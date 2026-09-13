import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

type Resolved = {
	title: string;
	artist: string;
	cover: string;
	provider: string;
	sourceUrl: string;
};

const UA =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// Both services withhold their Open Graph tags from ordinary clients --
// Anghami answers 406, Spotify serves a metadata-less web-player shell -- but
// serve them to the link-preview crawlers they want unfurling their links,
// which is exactly the job here, so ask as one first.
const UA_PREVIEW = 'WhatsApp/2.23.20.0';

let cachedToken: { value: string; expires: number } | null = null;

function isBlockedHost(hostname: string): boolean {
	const h = hostname.toLowerCase();
	return (
		h === 'localhost' ||
		h === '0.0.0.0' ||
		h === '::1' ||
		h.endsWith('.local') ||
		/^127\./.test(h) ||
		/^10\./.test(h) ||
		/^192\.168\./.test(h) ||
		/^169\.254\./.test(h) ||
		/^172\.(1[6-9]|2\d|3[01])\./.test(h)
	);
}

function safeUrl(raw: string): URL | null {
	try {
		const u = new URL(raw);
		if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
		if (isBlockedHost(u.hostname)) return null;
		return u;
	} catch {
		return null;
	}
}

function parseSpotifyTrackId(raw: string): string | null {
	const match = raw.match(
		/(?:open\.spotify\.com\/(?:intl-[a-z-]+\/)?track\/|spotify:track:)([A-Za-z0-9]+)/
	);
	return match ? match[1] : null;
}

async function spotifyToken(): Promise<string | null> {
	const id = env.SPOTIFY_CLIENT_ID;
	const secret = env.SPOTIFY_CLIENT_SECRET;
	if (!id || !secret) return null;
	if (cachedToken && cachedToken.expires > Date.now() + 5000) return cachedToken.value;

	const res = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			Authorization: 'Basic ' + btoa(`${id}:${secret}`),
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: 'grant_type=client_credentials',
		signal: AbortSignal.timeout(8000)
	});
	if (!res.ok) return null;

	const data = await res.json();
	if (!data.access_token) return null;
	cachedToken = {
		value: data.access_token,
		expires: Date.now() + (data.expires_in ?? 3600) * 1000
	};
	return cachedToken.value;
}

async function resolveSpotify(raw: string): Promise<Resolved | null> {
	const trackId = parseSpotifyTrackId(raw);
	if (!trackId) return null;
	const canonical = `https://open.spotify.com/track/${trackId}`;

	// The Web API is the best source -- an exact, structured artist list -- but
	// it needs credentials.
	const token = await spotifyToken();
	if (token) {
		const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
			headers: { Authorization: `Bearer ${token}` },
			signal: AbortSignal.timeout(8000)
		});
		if (res.ok) {
			const data = await res.json();
			const images: Array<{ url: string }> = data.album?.images ?? [];
			return {
				title: data.name ?? '',
				artist: (data.artists ?? []).map((a: { name: string }) => a.name).join(', '),
				cover: images[0]?.url ?? '',
				provider: 'spotify',
				sourceUrl: data.external_urls?.spotify ?? canonical
			};
		}
	}

	// Without them the track page's own Open Graph tags still carry the title,
	// the artist and a 640px cover, so they beat oEmbed, which has no artist
	// field at all and only a small thumbnail.
	const og = await resolveOpenGraph(new URL(canonical), 'spotify');
	if (og?.title) return og;

	const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(canonical)}`, {
		headers: { 'User-Agent': UA },
		signal: AbortSignal.timeout(8000)
	});
	if (res.ok) {
		const data = await res.json();
		return {
			title: data.title ?? '',
			artist: '',
			cover: data.thumbnail_url ?? '',
			provider: 'spotify',
			sourceUrl: canonical
		};
	}
	return null;
}

function decodeEntities(input: string): string {
	return input
		.replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
		.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&apos;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');
}

type MetaTag = Record<string, string>;

// Attributes are parsed rather than matched by key, because not every site
// quotes them -- Anghami emits `<meta property=og:url content=https://...>`,
// where a quoted-only match reads nothing and a loose one lets `og:image`
// swallow `og:image:width`.
function parseMetaTags(html: string): MetaTag[] {
	const tags: MetaTag[] = [];
	const metaPattern = /<meta\b([^>]*)>/gi;
	const attrPattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+))/g;

	for (const tag of html.matchAll(metaPattern)) {
		const attrs: MetaTag = {};
		for (const attr of tag[1].matchAll(attrPattern)) {
			attrs[attr[1].toLowerCase()] = attr[2] ?? attr[3] ?? attr[4] ?? '';
		}
		tags.push(attrs);
	}
	return tags;
}

function readMeta(tags: MetaTag[], keys: string[]): string {
	for (const key of keys) {
		for (const tag of tags) {
			const id = (tag.property ?? tag.name ?? '').toLowerCase();
			if (id === key && tag.content) return decodeEntities(tag.content).trim();
		}
	}
	return '';
}

const GENERIC_DESCRIPTOR = /^(song|single|album|ep|playlist|music|track)$/i;

function looksLikeArtist(candidate: string, title: string): boolean {
	if (!candidate || GENERIC_DESCRIPTOR.test(candidate)) return false;
	return candidate.toLowerCase() !== title.toLowerCase();
}

function readArtist(tags: MetaTag[], provider: string, title: string): string {
	const tagged = readMeta(tags, ['music:musician_description', 'og:audio:artist']);
	if (tagged) return tagged;

	const description = readMeta(tags, ['og:description', 'twitter:description']);

	// Both services lead the description with the artist and follow it with
	// interpunct-separated detail: "Artist · song · 1991" on Anghami,
	// "Artist, Artist · Album · Song · 2015" on Spotify. The interpunct has to
	// be present, or an arbitrary site's prose description reads as an artist.
	if (description.includes('·')) {
		const lead = description.split('·')[0].trim();
		if (looksLikeArtist(lead, title)) return lead;
	}

	// Anghami also exposes "Artist - Title | Play on Anghami".
	if (provider === 'anghami') {
		const share = readMeta(tags, ['twitter:title']).match(/^(.+?)\s+-\s+.+?\s*\|\s*Play on/i);
		if (share && looksLikeArtist(share[1].trim(), title)) return share[1].trim();
	}

	const byline = description.match(/\bby\s+(.+?)(?:\s+on\s+Anghami|\s+[·|]|\s+-\s+|\.$|$)/i);
	return byline ? byline[1].trim() : '';
}

// Anghami's og:image is a 600x314 share card with the track name burned into
// it, which crops badly in a square song row; the album art behind it is
// reachable by the id the card is generated from.
function upgradeAnghamiCover(ogImage: string): string {
	try {
		const id = new URL(ogImage).searchParams.get('coverartid');
		if (id && /^\d+$/.test(id)) return `https://artwork.anghcdn.co/webp/?id=${id}&size=640`;
	} catch {
		// Not a URL we can rewrite -- keep what the page gave us.
	}
	return ogImage;
}

async function fetchPage(url: URL): Promise<{ html: string; finalUrl: URL } | null> {
	for (const ua of [UA_PREVIEW, UA]) {
		let res: Response;
		try {
			res = await fetch(url, {
				headers: {
					'User-Agent': ua,
					Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
					'Accept-Language': 'en-US,en;q=0.9'
				},
				redirect: 'follow',
				signal: AbortSignal.timeout(8000)
			});
		} catch {
			continue;
		}
		if (!res.ok) continue;
		return {
			html: (await res.text()).slice(0, 400000),
			finalUrl: safeUrl(res.url) ?? url
		};
	}
	return null;
}

async function resolveOpenGraph(url: URL, provider: string): Promise<Resolved | null> {
	const page = await fetchPage(url);
	if (!page) return null;

	const tags = parseMetaTags(page.html);

	// An unknown Anghami id still answers 200, with the site's own landing-page
	// tags ("Anghami - The world is listening") that would otherwise be filled
	// into the form as a song. Real song pages are tagged og:type=music.song.
	if (provider !== 'unknown' && readMeta(tags, ['og:type']) === 'website') return null;

	const title = readMeta(tags, ['og:title', 'twitter:title']);
	let cover = readMeta(tags, [
		'og:image:secure_url',
		'og:image',
		'twitter:image',
		'twitter:image:src'
	]);
	if (provider === 'anghami' && cover) cover = upgradeAnghamiCover(cover);

	if (!title && !cover) return null;
	return {
		title,
		artist: readArtist(tags, provider, title),
		cover,
		provider,
		sourceUrl: page.finalUrl.toString()
	};
}

function extractUrl(raw: string): string {
	const match = raw.match(/https?:\/\/[^\s<>"']+/i);
	if (!match) return raw;
	return match[0].replace(/[.,;:!?)\]}]+$/, '');
}

function providerFor(raw: string): string {
	if (/spotify\.com|spotify\.link|spotify:track:/.test(raw)) return 'spotify';
	if (/anghami\./.test(raw)) return 'anghami';
	return 'unknown';
}

export const POST: RequestHandler = async ({ request }) => {
	let payload: { url?: unknown };
	try {
		payload = await request.json();
	} catch {
		error(400, 'Expected a JSON body with a "url" field');
	}

	const input = typeof payload.url === 'string' ? payload.url.trim() : '';
	if (!input) error(400, 'Provide a song link');

	const raw = extractUrl(input);

	const provider = providerFor(raw);

	try {
		if (provider === 'spotify') {
			const spotify = await resolveSpotify(raw);
			if (spotify) return json(spotify);
		}

		const parsed = safeUrl(raw);
		if (!parsed) error(422, 'That link could not be read');

		const og = await resolveOpenGraph(parsed, provider);
		if (og) return json(og);

		error(422, 'No song details found at that link');
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err && 'body' in err) throw err;
		error(502, 'Could not reach that link');
	}
};

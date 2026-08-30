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

function readMeta(html: string, keys: string[]): string {
	for (const key of keys) {
		const escaped = key.replace(/:/g, '\\:');
		const patterns = [
			new RegExp(
				`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*\\scontent=["']([^"']*)["']`,
				'i'
			),
			new RegExp(
				`<meta[^>]+content=["']([^"']*)["'][^>]*\\s(?:property|name)=["']${escaped}["']`,
				'i'
			)
		];
		for (const pattern of patterns) {
			const match = html.match(pattern);
			if (match && match[1]) return decodeEntities(match[1]).trim();
		}
	}
	return '';
}

async function resolveOpenGraph(url: URL, provider: string): Promise<Resolved | null> {
	const res = await fetch(url, {
		headers: {
			'User-Agent': UA,
			Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			'Accept-Language': 'en-US,en;q=0.9'
		},
		redirect: 'follow',
		signal: AbortSignal.timeout(8000)
	});
	if (!res.ok) return null;

	const finalUrl = safeUrl(res.url) ?? url;
	const html = (await res.text()).slice(0, 400000);

	const title = readMeta(html, ['og:title', 'twitter:title']);
	const cover = readMeta(html, [
		'og:image:secure_url',
		'og:image',
		'twitter:image',
		'twitter:image:src'
	]);
	let artist = readMeta(html, ['music:musician_description', 'og:audio:artist']);
	const description = readMeta(html, ['og:description', 'twitter:description']);
	if (!artist && description) {
		const match = description.match(/\bby\s+(.+?)(?:\s+on\s+Anghami|\s+[·|]|\s+-\s+|\.$|$)/i);
		if (match) artist = match[1].trim();
	}

	if (!title && !cover) return null;
	return {
		title,
		artist,
		cover,
		provider,
		sourceUrl: finalUrl.toString()
	};
}

function providerFor(raw: string): string {
	if (/spotify\.com|spotify:track:/.test(raw)) return 'spotify';
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

	const raw = typeof payload.url === 'string' ? payload.url.trim() : '';
	if (!raw) error(400, 'Provide a song link');

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

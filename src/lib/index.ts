// place files you want to import through the `$lib` alias in this folder.

// Song links reach the app from pastes and from localStorage, which a curious
// user can hand-edit, so nothing but http(s) is allowed to become an href --
// a `javascript:` URL there would run on click.
export function safeHttpUrl(raw: unknown): string {
	if (typeof raw !== 'string') return '';
	const trimmed = raw.trim();
	if (!trimmed) return '';
	try {
		const url = new URL(trimmed);
		return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : '';
	} catch {
		return '';
	}
}

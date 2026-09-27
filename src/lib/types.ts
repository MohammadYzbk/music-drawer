export type Song = {
	id: string;
	title: string;
	artist: string;
	cover: string;
	url: string;
	comment: string;
};

export type Queues = { me: Song[]; you: Song[] };

// A `#rrggbb` background per queue -- the only form `<input type="color">`
// reads and writes.
export type QueueColors = Record<keyof Queues, string>;

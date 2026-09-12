export type Song = {
	id: string;
	title: string;
	artist: string;
	cover: string;
	url: string;
	comment: string;
};

export type Queues = { me: Song[]; you: Song[] };

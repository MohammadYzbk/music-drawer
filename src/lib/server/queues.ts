import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { env } from '$env/dynamic/private';
import { safeHttpUrl } from '$lib';
import type { Queues, Song } from '$lib/types';

const FILE = env.QUEUES_FILE || 'data/queues.json';

const defaults: Queues = {
	me: [
		{
			id: 'seed-1',
			title: 'Weird Fishes / Arpeggi',
			artist: 'Radiohead',
			cover: '',
			url: '',
			comment: ''
		},
		{ id: 'seed-2', title: 'Redbone', artist: 'Childish Gambino', cover: '', url: '', comment: '' },
		{ id: 'seed-3', title: 'Nights', artist: 'Frank Ocean', cover: '', url: '', comment: '' }
	],
	you: [
		{
			id: 'seed-4',
			title: 'A Real Hero',
			artist: 'College & Electric Youth',
			cover: '',
			url: '',
			comment: ''
		},
		{
			id: 'seed-5',
			title: 'Motion Sickness',
			artist: 'Phoebe Bridgers',
			cover: '',
			url: '',
			comment: ''
		}
	]
};

function text(value: unknown): string {
	return typeof value === 'string' ? value : '';
}

function normaliseList(list: unknown): Song[] {
	if (!Array.isArray(list)) return [];
	return list.map((item) => {
		const song = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
		return {
			id: text(song.id) || crypto.randomUUID(),
			title: text(song.title),
			artist: text(song.artist),
			cover: text(song.cover),
			url: safeHttpUrl(song.url),
			comment: text(song.comment)
		};
	});
}

export function hasQueueShape(raw: unknown): boolean {
	if (!raw || typeof raw !== 'object') return false;
	const source = raw as Record<string, unknown>;
	return Array.isArray(source.me) || Array.isArray(source.you);
}

export function normaliseQueues(raw: unknown): Queues {
	const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
	return { me: normaliseList(source.me), you: normaliseList(source.you) };
}

export async function readQueues(): Promise<Queues> {
	let raw: string;
	try {
		raw = await readFile(FILE, 'utf8');
	} catch {
		return structuredClone(defaults);
	}

	try {
		const parsed = JSON.parse(raw);
		if (!hasQueueShape(parsed)) return structuredClone(defaults);
		return normaliseQueues(parsed);
	} catch {
		return structuredClone(defaults);
	}
}

async function persist(queues: Queues): Promise<void> {
	await mkdir(dirname(FILE), { recursive: true });
	const temp = `${FILE}.${process.pid}.tmp`;
	await writeFile(temp, JSON.stringify(queues, null, 2), 'utf8');
	await rename(temp, FILE);
}

let chain: Promise<unknown> = Promise.resolve();

export function writeQueues(queues: Queues): Promise<void> {
	const next = chain.then(
		() => persist(queues),
		() => persist(queues)
	);
	chain = next.catch(() => {});
	return next;
}

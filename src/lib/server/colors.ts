import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { env } from '$env/dynamic/private';
import type { QueueColors } from '$lib/types';
import { FILE as QUEUES_FILE } from './queues';
import { writeJson } from './store';

// Beside the queues file by default, so it lands on the same volume in prod.
const FILE = env.COLORS_FILE || join(dirname(QUEUES_FILE), 'colors.json');

export const defaultColors: QueueColors = { me: '#a52a2a', you: '#ff7f50' };

const HEX = /^#[0-9a-f]{6}$/i;

function colour(value: unknown, fallback: string): string {
	return typeof value === 'string' && HEX.test(value) ? value.toLowerCase() : fallback;
}

// Colours end up in a style attribute, so only a strict hex gets through --
// anything else falls back to the default rather than reaching the CSS.
export function normaliseColors(raw: unknown): QueueColors {
	const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
	return {
		me: colour(source.me, defaultColors.me),
		you: colour(source.you, defaultColors.you)
	};
}

export async function readColors(): Promise<QueueColors> {
	try {
		return normaliseColors(JSON.parse(await readFile(FILE, 'utf8')));
	} catch {
		return { ...defaultColors };
	}
}

export function writeColors(colors: QueueColors): Promise<void> {
	return writeJson(FILE, colors);
}

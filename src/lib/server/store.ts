import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

async function persist(file: string, value: unknown): Promise<void> {
	await mkdir(dirname(file), { recursive: true });
	const temp = `${file}.${process.pid}.tmp`;
	await writeFile(temp, JSON.stringify(value, null, 2), 'utf8');
	await rename(temp, file);
}

// One chain per file, so two writes to the same file never race on its temp
// file, while writes to different files don't wait on each other.
const chains = new Map<string, Promise<unknown>>();

export function writeJson(file: string, value: unknown): Promise<void> {
	const chain = chains.get(file) ?? Promise.resolve();
	const next = chain.then(
		() => persist(file, value),
		() => persist(file, value)
	);
	chains.set(
		file,
		next.catch(() => {})
	);
	return next;
}

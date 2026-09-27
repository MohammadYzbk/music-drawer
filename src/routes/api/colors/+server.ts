import { json, error } from '@sveltejs/kit';
import { normaliseColors, writeColors } from '$lib/server/colors';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ request }) => {
	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		error(400, 'Expected a JSON body');
	}

	const colors = normaliseColors(payload);

	try {
		await writeColors(colors);
	} catch {
		error(500, 'Could not write the colors file');
	}

	return json(colors);
};

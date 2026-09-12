import { json, error } from '@sveltejs/kit';
import { hasQueueShape, normaliseQueues, writeQueues } from '$lib/server/queues';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ request }) => {
	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		error(400, 'Expected a JSON body');
	}

	if (!hasQueueShape(payload)) {
		error(400, 'Expected a body shaped { me: [...], you: [...] }');
	}

	const queues = normaliseQueues(payload);

	try {
		await writeQueues(queues);
	} catch {
		error(500, 'Could not write the queues file');
	}

	return json(queues);
};

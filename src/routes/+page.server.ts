import { readQueues } from '$lib/server/queues';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { queues: await readQueues() };
};

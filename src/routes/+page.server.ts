import { readColors } from '$lib/server/colors';
import { readQueues } from '$lib/server/queues';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [queues, colors] = await Promise.all([readQueues(), readColors()]);
	return { queues, colors };
};

<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import Header from '$lib/components/header.svelte';
	import SongRow from '$lib/components/song-row.svelte';
	import AddSong from '$lib/components/add-song.svelte';
	import { safeHttpUrl } from '$lib';

	type Song = {
		id: string;
		title: string;
		artist: string;
		cover: string;
		url: string;
		comment: string;
	};
	type Queues = { me: Song[]; you: Song[] };

	const STORAGE_KEY = 'music-drawer:queues';

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
			{
				id: 'seed-2',
				title: 'Redbone',
				artist: 'Childish Gambino',
				cover: '',
				url: '',
				comment: ''
			},
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

	let queues = $state<Queues>(structuredClone(defaults));

	const translations = new Map<string, string>([
		['me', 'Mine'],
		['you', 'Yours']
	]);

	function newId(): string {
		if (browser && 'randomUUID' in crypto) return crypto.randomUUID();
		return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	}

	function normalise(list: unknown): Song[] {
		if (!Array.isArray(list)) return [];
		return list.map((item) => ({
			id: typeof item?.id === 'string' ? item.id : newId(),
			title: typeof item?.title === 'string' ? item.title : '',
			artist: typeof item?.artist === 'string' ? item.artist : '',
			cover: typeof item?.cover === 'string' ? item.cover : '',
			url: safeHttpUrl(item?.url),
			comment: typeof item?.comment === 'string' ? item.comment : ''
		}));
	}

	onMount(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return;
			const parsed = JSON.parse(raw);
			if (parsed && (Array.isArray(parsed.me) || Array.isArray(parsed.you))) {
				queues = { me: normalise(parsed.me), you: normalise(parsed.you) };
			}
		} catch {
			return;
		}
	});

	$effect(() => {
		const data = JSON.stringify(queues);
		if (browser) localStorage.setItem(STORAGE_KEY, data);
	});
</script>

<Header />
<main class="main-container">
	{#each Object.entries(queues) as [id, songs]}
		<section class="music-recs-container" {id}>
			<div class="recs-header">{translations.get(id)}</div>
			<div class="song-list">
				{#each songs as song (song.id)}
					<SongRow
						title={song.title}
						artist={song.artist}
						cover={song.cover}
						url={song.url}
						comment={song.comment}
						onremove={() => songs.splice(songs.indexOf(song), 1)}
					/>
				{/each}
				{#if songs.length === 0}
					<p class="empty">nothing here yet</p>
				{/if}
			</div>
			<AddSong onadd={(song) => songs.push({ id: newId(), ...song })} />
		</section>
	{/each}
</main>

<style>
	.main-container {
		flex: 1;
		display: flex;
		flex-wrap: wrap;
		min-height: 0;
		background-color: #9f415a;
		width: 100%;
	}

	.music-recs-container {
		display: flex;
		flex-direction: column;
		flex: 1 1 320px;
		min-height: 40vh;
		border: 3px solid black;
		overflow: hidden;
	}

	#you {
		background-color: coral;
	}

	#me {
		background-color: brown;
	}

	.recs-header {
		flex: 0 0 auto;
		border-bottom: dashed black;
		font-size: clamp(1.5rem, 4vw, 2.5rem);
		padding: clamp(0.5rem, 1.5vw, 1rem);
	}

	.song-list {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		scrollbar-width: thin;
		scrollbar-color: black transparent;
	}

	.song-list::-webkit-scrollbar {
		width: 10px;
	}

	.song-list::-webkit-scrollbar-thumb {
		background-color: black;
		border: 2px solid transparent;
		background-clip: content-box;
	}

	.empty {
		padding: clamp(0.75rem, 2vw, 1rem);
		opacity: 0.7;
	}

	@media (max-width: 600px) {
		.music-recs-container {
			flex-basis: 100%;
		}
	}
</style>

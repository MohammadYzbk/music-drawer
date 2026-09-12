<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Header from '$lib/components/header.svelte';
	import SongRow from '$lib/components/song-row.svelte';
	import AddSong from '$lib/components/add-song.svelte';
	import type { Queues, Song } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let saveError = $state('');

	const columns: Array<{ key: keyof Queues; label: string }> = [
		{ key: 'me', label: 'Mine' },
		{ key: 'you', label: 'Yours' }
	];

	function newId(): string {
		if ('randomUUID' in crypto) return crypto.randomUUID();
		return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	}

	async function commit(next: Queues) {
		try {
			const res = await fetch('/api/queues', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(next)
			});
			if (!res.ok) {
				saveError = 'Not saved — the server rejected the change';
				return;
			}
			saveError = '';
			await invalidateAll();
		} catch {
			saveError = 'Not saved — could not reach the server';
		}
	}

	function addSong(key: keyof Queues, draft: Omit<Song, 'id'>) {
		const next = structuredClone(data.queues);
		next[key].push({ id: newId(), ...draft });
		void commit(next);
	}

	function removeSong(key: keyof Queues, id: string) {
		const next = structuredClone(data.queues);
		next[key] = next[key].filter((song) => song.id !== id);
		void commit(next);
	}
</script>

<Header />
{#if saveError}
	<p class="save-error" role="alert">{saveError}</p>
{/if}
<main class="main-container">
	{#each columns as column (column.key)}
		<section class="music-recs-container" id={column.key}>
			<div class="recs-header">{column.label}</div>
			<div class="song-list">
				{#each data.queues[column.key] as song (song.id)}
					<SongRow
						title={song.title}
						artist={song.artist}
						cover={song.cover}
						url={song.url}
						comment={song.comment}
						onremove={() => removeSong(column.key, song.id)}
					/>
				{/each}
				{#if data.queues[column.key].length === 0}
					<p class="empty">nothing here yet</p>
				{/if}
			</div>
			<AddSong onadd={(song) => addSong(column.key, song)} />
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

	.save-error {
		flex: 0 0 auto;
		margin: 0;
		border-bottom: 3px solid black;
		background-color: #ffd7d7;
		padding: clamp(0.5rem, 1.5vw, 0.75rem);
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

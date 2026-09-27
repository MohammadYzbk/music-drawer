<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Header from '$lib/components/header.svelte';
	import SongRow from '$lib/components/song-row.svelte';
	import AddSong from '$lib/components/add-song.svelte';
	import type { QueueColors, Queues, Song } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let saveError = $state('');

	// Follows the server's copy, but is written to while a picker is dragged so
	// the queue recolours live; only the settled pick is sent.
	let colors = $derived(data.colors);

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

	async function commitColors(next: QueueColors) {
		try {
			const res = await fetch('/api/colors', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(next)
			});
			if (!res.ok) {
				saveError = 'Colour not saved — the server rejected the change';
				return;
			}
			saveError = '';
			await invalidateAll();
		} catch {
			saveError = 'Colour not saved — could not reach the server';
		}
	}

	function previewColor(key: keyof Queues, value: string) {
		colors = { ...colors, [key]: value };
	}

	function saveColor(key: keyof Queues, value: string) {
		previewColor(key, value);
		void commitColors(colors);
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
		<section
			class="music-recs-container"
			id={column.key}
			style:background-color={colors[column.key]}
		>
			<div class="recs-header">
				<span>{column.label}</span>
				<input
					class="color-picker"
					type="color"
					value={colors[column.key]}
					oninput={(e) => previewColor(column.key, e.currentTarget.value)}
					onchange={(e) => saveColor(column.key, e.currentTarget.value)}
					aria-label={`${column.label} queue colour`}
					title="Change this queue's colour"
				/>
			</div>
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
	/* The page never grows past the viewport: each queue gets a fixed share of
	   it, its list scrolls, and the adder stays pinned under the list. */
	.main-container {
		flex: 1 1 auto;
		min-height: 0;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		grid-auto-rows: minmax(0, 1fr);
		background-color: #9f415a;
		width: 100%;
	}

	.music-recs-container {
		display: flex;
		flex-direction: column;
		min-height: 0;
		border: 3px solid black;
		overflow: hidden;
	}

	.recs-header {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		border-bottom: dashed black;
		font-size: clamp(1.5rem, 4vw, 2.5rem);
		padding: clamp(0.5rem, 1.5vw, 1rem);
	}

	/* The swatch shows the queue's own colour, so the beige frame is what
	   keeps it visible against the header it sits on. */
	.color-picker {
		flex: 0 0 auto;
		width: 2.25rem;
		height: 2.25rem;
		border: 3px solid black;
		padding: 3px;
		background-color: beige;
		cursor: pointer;
	}

	.color-picker::-webkit-color-swatch-wrapper {
		padding: 0;
	}

	.color-picker::-webkit-color-swatch {
		border: none;
	}

	.color-picker::-moz-color-swatch {
		border: none;
	}

	.song-list {
		/* A zero basis hands the list whatever the header and adder leave, so
		   new songs scroll inside it instead of pushing the adder down. */
		flex: 1 1 0;
		min-height: 3rem;
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
		/* Stacked, the two queues split the height between them. */
		.main-container {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>

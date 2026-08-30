<script lang="ts">
	type Draft = { title: string; artist: string; cover: string };

	let { onadd }: { onadd: (song: Draft) => void } = $props();

	let open = $state(false);
	let link = $state('');
	let title = $state('');
	let artist = $state('');
	let cover = $state('');
	let status = $state('');
	let loading = $state(false);

	async function fetchFromLink() {
		const url = link.trim();
		if (!url) return;
		loading = true;
		status = 'Fetching…';
		try {
			const res = await fetch('/api/resolve', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url })
			});
			const data = await res.json().catch(() => null);
			if (!res.ok || !data) {
				status = data?.message ?? 'Could not read that link';
				return;
			}
			title = data.title || title;
			artist = data.artist || artist;
			cover = data.cover || cover;
			status = data.artist
				? `Loaded from ${data.provider}`
				: `Loaded from ${data.provider} — add the artist`;
		} catch {
			status = 'Network error while fetching';
		} finally {
			loading = false;
		}
	}

	function reset() {
		link = '';
		title = '';
		artist = '';
		cover = '';
		status = '';
	}

	function close() {
		reset();
		open = false;
	}

	function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!title.trim()) {
			status = 'A title is required';
			return;
		}
		onadd({ title: title.trim(), artist: artist.trim(), cover: cover.trim() });
		reset();
		open = false;
	}
</script>

<div class="adder">
	{#if !open}
		<button class="toggle" type="button" onclick={() => (open = true)}>+ add a song</button>
	{:else}
		<form onsubmit={submit}>
			<div class="link-row">
				<input
					class="field"
					type="url"
					placeholder="Paste a Spotify or Anghami link"
					bind:value={link}
				/>
				<button
					class="btn"
					type="button"
					onclick={fetchFromLink}
					disabled={loading || !link.trim()}
				>
					{loading ? '…' : 'fetch'}
				</button>
			</div>

			<div class="manual">
				{#if cover}
					<img class="preview" src={cover} alt="" />
				{:else}
					<div class="preview placeholder"></div>
				{/if}
				<div class="inputs">
					<input class="field" type="text" placeholder="Title" bind:value={title} />
					<input class="field" type="text" placeholder="Artist" bind:value={artist} />
					<input class="field" type="url" placeholder="Cover art URL" bind:value={cover} />
				</div>
			</div>

			{#if status}
				<p class="status">{status}</p>
			{/if}

			<div class="actions">
				<button class="btn primary" type="submit">add to queue</button>
				<button class="btn" type="button" onclick={close}>cancel</button>
			</div>
		</form>
	{/if}
</div>

<style>
	.adder {
		flex: 0 0 auto;
		border-top: 3px dashed black;
		padding: clamp(0.5rem, 1.5vw, 0.75rem);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.toggle {
		width: 100%;
		border: 3px dashed black;
		background-color: rgba(255, 255, 255, 0.15);
		padding: 0.5rem;
		font: inherit;
		cursor: pointer;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.link-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.link-row .field {
		flex: 1 1 12rem;
	}

	.manual {
		display: flex;
		gap: 0.5rem;
	}

	.inputs {
		flex: 1 1 auto;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.field {
		width: 100%;
		border: 3px solid black;
		background-color: beige;
		padding: 0.5rem;
		font: inherit;
	}

	.preview {
		flex: 0 0 auto;
		width: clamp(56px, 16vw, 76px);
		aspect-ratio: 1 / 1;
		border: 3px solid black;
		background-color: beige;
		object-fit: cover;
	}

	.status {
		font-size: 0.85rem;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.btn {
		border: 3px solid black;
		background-color: beige;
		padding: 0.45rem 0.9rem;
		font: inherit;
		cursor: pointer;
	}

	.btn.primary {
		background-color: black;
		color: beige;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>

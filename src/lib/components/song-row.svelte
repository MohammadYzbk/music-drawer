<script lang="ts">
	let {
		title = 'Untitled',
		artist = 'Unknown artist',
		cover = '',
		onremove
	}: {
		title?: string;
		artist?: string;
		cover?: string;
		onremove?: () => void;
	} = $props();
</script>

<div class="song-row">
	<div class="cover">
		{#if cover}
			<img src={cover} alt={`${title} cover art`} loading="lazy" />
		{/if}
	</div>
	<div class="meta">
		<span class="song-title">{title}</span>
		<span class="song-artist">{artist}</span>
	</div>
	{#if onremove}
		<button class="remove" type="button" onclick={onremove} aria-label={`Remove ${title}`}>
			✕
		</button>
	{/if}
</div>

<style>
	.song-row {
		display: flex;
		align-items: center;
		gap: clamp(0.5rem, 2vw, 1rem);
		padding: clamp(0.5rem, 1.5vw, 0.75rem);
		border-bottom: 3px solid black;
		background-color: rgba(255, 255, 255, 0.1);
	}

	.song-row:last-child {
		border-bottom: none;
	}

	.cover {
		flex: 0 0 auto;
		width: clamp(44px, 12vw, 64px);
		aspect-ratio: 1 / 1;
		border: 3px solid black;
		background-color: beige;
		overflow: hidden;
	}

	.cover img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.meta {
		flex: 1 1 auto;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.song-title {
		font-size: clamp(1rem, 3vw, 1.25rem);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.song-artist {
		font-size: clamp(0.8rem, 2.5vw, 1rem);
		opacity: 0.8;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.remove {
		flex: 0 0 auto;
		width: 2rem;
		height: 2rem;
		border: 3px solid black;
		background-color: beige;
		font: inherit;
		line-height: 1;
		cursor: pointer;
	}
</style>

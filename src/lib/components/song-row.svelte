<script lang="ts">
	import { safeHttpUrl } from '$lib';

	let {
		title = 'Untitled',
		artist = 'Unknown artist',
		cover = '',
		url = '',
		comment = '',
		onremove
	}: {
		title?: string;
		artist?: string;
		cover?: string;
		url?: string;
		comment?: string;
		onremove?: () => void;
	} = $props();

	const href = $derived(safeHttpUrl(url));
</script>

<!-- Cover and text are the link, while the remove button stays a sibling of
     it: nesting the button inside the anchor would navigate on every click. -->
{#snippet details()}
	<div class="cover">
		{#if cover}
			<img src={cover} alt={`${title} cover art`} loading="lazy" />
		{/if}
	</div>
	<div class="meta">
		<span class="song-title">{title}</span>
		<span class="song-artist">{artist}</span>
	</div>
{/snippet}

<div class="song-row">
	{#if href}
		<a class="details" {href} target="_blank" rel="noopener noreferrer" title={`Open ${title}`}>
			{@render details()}
			<span class="open" aria-hidden="true">↗</span>
		</a>
	{:else}
		<div class="details">{@render details()}</div>
	{/if}
	{#if comment}
		<p class="comment">{comment}</p>
	{/if}
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

	.details {
		flex: 1 1 auto;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: clamp(0.5rem, 2vw, 1rem);
		color: inherit;
		text-decoration: none;
	}

	a.details:hover .song-title {
		text-decoration: underline;
	}

	a.details:focus-visible {
		outline: 3px solid black;
		outline-offset: 2px;
	}

	.open {
		flex: 0 0 auto;
		padding-right: 0.25rem;
		opacity: 0.5;
	}

	a.details:hover .open {
		opacity: 1;
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
		/* Content-sized rather than growing, so the ↗ hugs the title instead of
		   drifting across the row to sit against the comment. */
		flex: 0 1 auto;
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

	.comment {
		flex: 0 1 auto;
		max-width: 38%;
		min-width: 0;
		margin: 0;
		text-align: right;
		font-size: clamp(0.7rem, 2vw, 0.85rem);
		font-style: italic;
		opacity: 0.85;
		overflow-wrap: anywhere;
		/* A comment is meant to stay small, so long ones clip rather than
		   stretching the row taller than its cover. */
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	@media (max-width: 600px) {
		.comment {
			max-width: 45%;
			-webkit-line-clamp: 2;
			line-clamp: 2;
		}
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

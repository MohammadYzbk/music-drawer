<script lang="ts">
	import musicdrawer from '$lib/assets/canvas.png';
</script>

<header class="header">
	<div class="logo"><img src={musicdrawer} alt="Music Drawer logo" /></div>
	<div class="title">Music Drawer</div>
</header>

<style>
	.header {
		flex: 0 0 auto;
		/* Equal side tracks with the title in the middle one, so the title is
		   centred on the header itself. Flex cannot do this: the logo eats width
		   first, which only ever centres the title in what is left over. */
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
		align-items: center;
		gap: clamp(0.5rem, 2vw, 2rem);
		background-color: beige;
		padding: clamp(0.75rem, 3vw, 2rem);
	}

	.logo {
		display: flex;
		align-items: center;
		justify-self: start;
	}

	.logo img {
		width: clamp(140px, 40vw, 400px);
		/* Holds the logo inside its track rather than overflowing it, which is
		   what keeps the two side tracks equal -- and so the title centred. */
		max-width: 100%;
	}

	.title {
		text-align: center;
		font-size: clamp(2rem, 8vw, 6.25rem);
		line-height: 1.1;
		word-break: break-word;
	}

	@media (max-width: 600px) {
		.header {
			/* One track: logo above title, both centred. */
			grid-template-columns: minmax(0, 1fr);
			justify-items: center;
		}

		.logo {
			justify-self: center;
		}
	}
</style>

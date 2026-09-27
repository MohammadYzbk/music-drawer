<script lang="ts">
	import musicdrawer from '$lib/assets/musicdrawer.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={musicdrawer} />
	<title>Music Drawer</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Geist+Pixel&display=swap" rel="stylesheet" />

	<style>
		* {
			box-sizing: border-box;
			margin: 0;
			padding: 0;
		}

		html {
			font-size: clamp(14px, 0.6rem + 0.6vw, 18px);
		}

		body {
			font-family: 'Geist Pixel', system-ui, sans-serif;
			min-height: 100vh;
			min-height: 100svh;
			-webkit-text-size-adjust: 100%;
		}

		img {
			max-width: 100%;
			height: auto;
		}
	</style>
</svelte:head>

<div class="app">
	{@render children()}
</div>

<style>
	/* A fixed height rather than a minimum, so the queues scroll inside the
	   page instead of the page itself growing. */
	.app {
		display: flex;
		flex-direction: column;
		height: 100vh;
		height: 100svh;
		overflow: hidden;
	}
</style>

<script lang="ts">
	import musicdrawer from '$lib/assets/musicdrawer.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={musicdrawer} />
	<title>Music Drawer</title>
  	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link href="https://fonts.googleapis.com/css2?family=Geist+Pixel&display=swap" rel="stylesheet">

	<style>
		* {
			font-family: 'Geist Pixel';
			display:flexbox;
			box-sizing: border-box;
			margin: 0px;
			padding: 0px;
		}
	</style>
</svelte:head>



{@render children()}

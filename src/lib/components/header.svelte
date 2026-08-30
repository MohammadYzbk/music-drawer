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
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: flex-start;
		gap: clamp(0.5rem, 2vw, 2rem);
		background-color: beige;
		padding: clamp(0.75rem, 3vw, 2rem);
		text-align: left;
	}

	.logo {
		display: flex;
		align-items: center;
	}

	.logo img {
		width: clamp(140px, 40vw, 400px);
	}

	.title {
		font-size: clamp(2rem, 8vw, 6.25rem);
		line-height: 1.1;
		word-break: break-word;
	}

	@media (max-width: 600px) {
		.header {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>

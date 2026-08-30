<script lang="ts">
	import musicdrawer from '$lib/assets/canvas.png';
</script>

<div class="header">
	<div class="logo"><img src={musicdrawer} width="400" alt="" /></div>
	<div class="title">Music Drawer</div>
</div>

<style>
	.header {
		background-color: beige;
		height: 22vh;
		display: flex;
		text-align: center;
		align-content: center;
		font-size: 100px;
	}

	.title {
		text-align: center;
		align-content: center;
	}

	.logo {
		align-content: center;
	}
</style>

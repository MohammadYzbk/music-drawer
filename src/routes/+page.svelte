<script>
	import Image from '$lib/components/image.svelte';
	import Header from '$lib/components/header.svelte';

	let list = ['me', 'you'];

	let translations = new Map();
	translations.set('you', 'Yours');
	translations.set('me', 'Mine');
</script>

<Header></Header>
<div class="main-container">
	{#each list as id}
		<div class="music-recs-container" {id}>
			<div class="recs-header">{translations.get(id)}</div>
		</div>
	{/each}
</div>

<style>
	.main-container {
		display: flex;
		background-color: #9f415a;
		height: 78vh;
		width: 100%;
	}

	.music-recs-container {
		height: 78vh;
		flex: 1;
		border-color: black;
		border: solid;
		border-width: 3px;
	}

	#you {
		background-color: coral;
	}

	#me {
		background-color: brown;
	}

	.recs-header {
		height: fit-content;
		border: none;
		border-bottom: dashed black;
		font-size: xx-large;
		padding: 5px;
		padding-left: 10px;
		align-items: center;
	}
</style>

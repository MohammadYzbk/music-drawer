import adapter from '@sveltejs/adapter-netlify';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Deployed to Netlify, which terminates TLS and issues/renews the
			// certificate itself -- see netlify.toml. Swapping hosts means
			// changing the adapter import above and nothing else.
			adapter: adapter()
		})
	]
});

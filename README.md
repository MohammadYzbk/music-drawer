# Music Drawer

Share music to a group of people in a queue!

## Adding songs

Each queue has an **+ add a song** panel. Paste a Spotify or Anghami link and hit
**fetch** to pre-fill the title, artist, and cover art, or type every field by hand.
Queues are saved to the browser's `localStorage`.

### Link import

- **Spotify** works with no setup via the public oEmbed endpoint (title + artwork).
  To also pull the artist name, create an app at
  <https://developer.spotify.com/dashboard>, copy `.env.example` to `.env`, and fill
  in `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET`.
- **Anghami** has no public API and blocks server-side page reads, so its links
  generally fall back to manual entry.
- Other links are read via Open Graph tags where the page exposes them.

# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@0.17.0 create --template minimal --types ts --install npm music-drawer
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

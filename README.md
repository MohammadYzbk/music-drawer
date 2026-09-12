# Music Drawer

Share music to a group of people in a queue!

## Adding songs

Each queue has an **+ add a song** panel. Paste a Spotify or Anghami link and hit
**fetch** to pre-fill the title, artist, and cover art, or type every field by hand.
Queues are saved to the browser's `localStorage`.

### Link import

Links are read as a link-preview crawler, because that is the request both
services answer with Open Graph tags: Anghami 406s anything else, and Spotify
serves an empty web-player shell. Title, artist and cover all come from those
tags, so **no setup is required** for either service.

- **Spotify** optionally uses the Web API, which returns an exact, structured
  artist list rather than one parsed from a description. To enable it, create an
  app at <https://developer.spotify.com/dashboard>, copy `.env.example` to `.env`,
  and fill in `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET`. Without credentials
  the Open Graph tags are used (640px cover); oEmbed is only a last resort, as it
  carries no artist field and a smaller thumbnail.
- **Anghami** has no public API at all. Its square album art is used in place of
  the wide share card its `og:image` advertises.
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

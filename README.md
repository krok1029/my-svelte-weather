# My Svelte Weather

My Svelte Weather is an interactive weather forecast application built with SvelteKit, Tailwind CSS, and Leaflet. It retrieves 36-hour forecasts from Taiwan's Central Weather Administration and displays them on an interactive map.

## Features

- Browse Taiwan's cities on an interactive map
- View detailed 36-hour forecast for a selected city, including temperature and conditions
- Built with SvelteKit, TypeScript and Tailwind CSS

## Setup

1. Install dependencies:

   ```bash
   yarn install
   ```

2. Create a `.env` file in the project root with your CWA API token:

   ```
   PUBLIC_API_TOKEN=your_token_here
   ```

## Development

Start a development server at <http://localhost:5173>:

```bash
yarn dev
```

Use `yarn dev --open` to open the app in a new browser tab.

## Production

Create an optimized production build:

```bash
yarn build
```

Preview the production build locally:

```bash
yarn preview
```

To deploy to a specific environment, install the appropriate [SvelteKit adapter](https://kit.svelte.dev/docs/adapters).

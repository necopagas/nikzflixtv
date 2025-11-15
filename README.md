![NikzFlix TV banner](public/logo512.png)

# NikzFlix TV

NikzFlix TV is a React + Vite streaming hub that aggregates movies, anime, dramas, live TV, and curated collections with seasonal themes and ad monetisation hooks.

## Features

- Home hero with smart trailer playback and curated media rows
- My List, Continue Watching, and watch history syncing via local storage
- IPTV viewer, Vivamax, Videoke, and community chat pages
- Seasonal themes (Halloween, Christmas, New Year) with optional ambient audio
- Adsterra social bar + smartlink placements out of the box

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables:

   ```bash
   cp .env.example .env
   # edit .env and add your TMDB key
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` – start the Vite dev server
- `npm run build` – create a production build
- `npm run preview` – preview the production build locally
- `npm run lint` – lint the source files with ESLint

## Tech Stack

- React 19 with React Router and Suspense-based code splitting
- Tailwind CSS (via `@tailwindcss/vite`) and custom `App.css` theme
- Capacitor plugins for Android packaging and sharing
- TMDB-powered catalog fetching with resilient helpers

## Project Structure Highlights

- `src/App.jsx` – app shell, routing, modals, seasonal overlays
- `src/pages/` – route-level pages (Home, Anime, Drama, IPTV, etc.)
- `src/components/` – reusable UI primitives (Banner, Row, Poster, Modals)
- `src/hooks/` – stateful logic for lists, history, seasonal themes
- `api/` – Express proxies and Gemini integrations (optional backend)

## Deployment Notes

- Provide a valid TMDB API key via `VITE_TMDB_API_KEY`
- Ensure hosted assets (alarm audio, ad scripts) are reachable over HTTPS
- For Capacitor builds, update Android config under `android/`

## WeebCentral (Cloudflare-protected)

WeebCentral is protected by Cloudflare, so the app cannot reliably scrape it from a serverless environment. During development run the bundled proxy server and start Vite with `npm run dev:with-proxy`, or start the proxy manually with `npm run proxy` and point the env var `WEEBCENTRAL_BYPASS_URL` to `http://localhost:3001`.

In production you can also host the proxy on your own server or use a Cloudflare bypass service, then point `WEEBCENTRAL_BYPASS_URL` at the hosted endpoint. See `CLOUDFLARE_BYPASS_README.md` for details on the proxy API and alternative sources.

---

Need help polishing further? Open an issue or reach out to the maintainer.

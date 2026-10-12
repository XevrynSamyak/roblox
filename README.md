# Omnity Hub website

A static site. There is no build step and nothing to install.

## Run it locally

```bash
python3 -m http.server 4190
```

Then open http://localhost:4190. Opening `index.html` straight from the folder also works, but live Roblox data needs a server.

## Files

| File | What it holds |
|------|---------------|
| `index.html` | The home page: search, live and coming-soon games, the quick look popup, the MM2 menu, why Omnity, FAQ |
| `script.html` | One page per game, opened as `script.html?id=<game id>` |
| `assets/data.js` | Every game, loader line, image, Roblox ID and feature list. Edit this file to add or change games |
| `assets/site.css` | All styles and colour tokens |
| `assets/site.js` | Draws both pages, loads live Roblox data, copy buttons, popups and themes |
| `assets/games/` | Put your own 16:9 game pictures here |
| `check.mjs` | Checks `data.js` for mistakes before you publish |

## Add a game

Copy an entry in `assets/data.js`, give it a new `id`, and fill in `placeId` and `universeId`. The comment at the top of that file explains every field. Then run:

```bash
node check.mjs
```

## Publish

Upload the whole folder to any static host, such as Vercel, Netlify, Cloudflare Pages or GitHub Pages.

## Before going live

- The Discord invite in `assets/data.js` has expired. Put a new one in the `discord` field.
- Steal An Egg, RIVALS, Ride A Pet and Slayers 2 still need their `load` lines.

## Outside services

Fonts come from Google Fonts. Your logo and the MM2 images load from oblivion.menu. Live player counts and game thumbnails come from Roblox through RoProxy, and the page shows drawn covers when that is unavailable.

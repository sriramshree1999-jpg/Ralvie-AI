# Ralvie AI

Marketing site for **Ralvie AI Frontdesk** — the always-on AI front desk that
answers every call, message, and email, books appointments, qualifies leads,
and routes the rest to your team 24/7.

A self-contained static site with two interactive 3D (Three.js / WebGL) scenes:
an AI-voice waveform hero background and a voice-reactive sphere.

## Run locally

The page uses ES modules, so it must be served over HTTP (not opened as a
`file://`):

- **VS Code** — install the *Live Server* extension, right-click `index.html`
  → *Open with Live Server*.
- **Or** — `npx serve .` then open the printed URL.

## Deploy

It's a plain static site — upload these files to any static host
(GitHub Pages, Netlify, Vercel, Cloudflare Pages).

For **GitHub Pages**: repo *Settings → Pages → Deploy from a branch → `main` / root*.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page markup |
| `styles.css` | Dark-theme glassmorphic styles |
| `scene.js` | Three.js voice visuals (hero + coverage sphere) |
| `ui.js` | Nav mega-menus, scroll reveals, counters, card tilt |
| `ralvie-logo.svg` | Brand logo |

## Dependencies

Loaded at runtime from CDNs (needs internet):

- [Three.js](https://threejs.org/) `0.160.0` — via jsDelivr
- [Inter](https://fonts.google.com/specimen/Inter) — via Google Fonts

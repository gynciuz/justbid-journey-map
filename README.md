# JustBid Pickup Journey Map

Interactive journey map covering the full JustBid pickup experience — from bidding to item collection.

## Quick Start

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
```

Opens at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

Output goes to `dist/` folder. Deploy anywhere that serves static files (Vercel, Netlify, GitHub Pages, etc.).

## Deploy to Vercel (fastest)

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com)
3. Import the repo → auto-detects Vite → Deploy

Or use the CLI:
```bash
npx vercel
```

## Deploy to Netlify

1. Run `npm run build`
2. Drag the `dist/` folder to [app.netlify.com/drop](https://app.netlify.com/drop)

## Project Structure

```
justbid-journey-map/
├── index.html          # HTML entry point
├── package.json        # Dependencies & scripts
├── vite.config.js      # Vite configuration
├── README.md           # This file
└── src/
    ├── main.jsx        # React entry point
    └── App.jsx         # Full journey map component (~1000 lines)
```

## Tech Stack

- **React 18** — UI framework
- **Vite 6** — Build tool & dev server
- **Lucide React** — Icon library
- **No CSS framework** — All styles are inline

## Features

- Homepage with journey cards and ranked UX gaps (flip cards)
- See All (blueprint) mode with swimlane grid
- Story mode with progressive disclosure
- Feeling curve with persona comment popups
- Flippable gap and action cards
- Keyboard navigation (← →) and mobile swipe
- Source attribution tags with links
- Active column highlighting with opacity
- Pinned navigation curve at bottom

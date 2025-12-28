# SearchCraft

**Craft smarter job and people searches across multiple platforms.**

[![Deploy to GitHub Pages](https://github.com/iamB0ody/searchcraft-search-builder/actions/workflows/deploy.yml/badge.svg)](https://searchcraft.site)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Progressive Web App that generates Boolean search queries and opens platform-specific URLs for LinkedIn, Indeed, Google Jobs, and regional job boards.

## What is SearchCraft?

SearchCraft helps recruiters, job seekers, and researchers build precise search queries without memorizing Boolean syntax. Enter job titles, skills, and exclusions — SearchCraft generates the query and opens the search directly on your chosen platform.

**Important:** SearchCraft does not scrape websites or access any APIs. It simply generates search URLs that open in your browser. You use your own account on each platform. Results depend on each platform's search capabilities.

## Key Features

- **Multi-Platform Support** — 11 platforms including LinkedIn, Sales Navigator, Indeed (63 regions), and MENA job boards
- **Boolean Query Builder** — Visual editor with AND/OR/NOT logic
- **Live Preview** — See your query update in real-time with character/operator counts
- **Presets** — Save, edit, duplicate, and organize frequently-used searches
- **Search History** — Automatically track past searches for quick re-use
- **Share Searches** — Export via WhatsApp, Telegram, Email, or shareable links
- **Quality Score** — Get 0-100 scoring with actionable tips to improve your query
- **Light/Dark Theme** — System-aware theme with manual toggle
- **PWA** — Install on desktop or mobile, works offline

## Supported Platforms

| Platform | Search Type | Boolean Support | Notes |
|----------|-------------|-----------------|-------|
| LinkedIn | People, Jobs | Good | Full Boolean with AND, OR, NOT, parentheses |
| Sales Navigator | People | Good | 15 operator limit per query |
| Google Jobs | Jobs | Good | Best with shorter, simpler queries |
| Indeed | Jobs | Good | 63 regional domains supported |
| Bayt | Jobs | Partial | OR and quotes only |
| GulfTalent | Jobs | Partial | OR and quotes only |
| NaukriGulf | Jobs | Partial | OR and quotes only |
| Recruit.net | Jobs | Keywords | Boolean converted to keywords |
| beBee | Jobs | Keywords | Boolean converted to keywords |
| GulfJobs | Jobs | Keywords | Boolean converted to keywords |
| ArabJobs | Jobs | Keywords | Boolean converted to keywords |

**Boolean Support Levels:**
- **Good** — Supports AND, OR, NOT/minus, parentheses, quotes
- **Partial** — Supports some operators (usually OR and quotes)
- **Keywords** — No Boolean; terms are searched as keywords

## Quick Start

### Prerequisites

- Node.js 18+ recommended
- npm, yarn, or pnpm

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm start
```

Open [http://localhost:4200](http://localhost:4200). The app reloads automatically on file changes.

### Production Build

```bash
npm run build:prod
```

Output is in `dist/searchcraft/browser/`. Includes service worker for PWA.

### Run Tests

```bash
npm test
```

## How It Works

1. **Choose a platform** — Select from LinkedIn, Indeed, Google Jobs, or regional boards
2. **Build your search** — Add job titles (OR), skills (AND), and exclusions (NOT)
3. **Execute** — Copy the query or click to open the search directly on the platform

## PWA Notes

SearchCraft is a Progressive Web App:

- **Service Worker** is enabled only in production builds
- **Install on mobile:** Open the site in Chrome/Safari, tap "Add to Home Screen"
- **Install on desktop:** Click the install icon in the browser address bar
- **Offline:** The app shell works offline; searches require internet

To test PWA locally:

```bash
npm run build:prod
npx serve dist/searchcraft/browser
```

## Data & Privacy

- **All data is stored locally** in your browser's LocalStorage
- **No server, no tracking** — SearchCraft runs entirely in your browser
- **What's stored:** Presets, search history, theme preference
- **Clearing data:** Use browser settings to clear site data

## Project Structure

```
src/app/
├── components/       # Shared UI components (header, chip-input, preview)
├── core/             # Services (theme, share, storage, feature-flags)
├── features/         # Feature modules (home, presets, history)
├── models/           # TypeScript interfaces and types
├── pages/            # Main pages (search-builder)
└── services/         # Platform adapters, quality score, intelligence
    └── platforms/    # 11 platform adapters + registry
```

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit with a clear message
6. Open a Pull Request

Please open an issue first for major changes to discuss the approach.

## Roadmap

- Additional job platforms
- Browser extension for one-click searches
- Query templates and guided mode
- Import/export presets as files

## License

This project is licensed under the [MIT License](LICENSE).

## Disclaimer

LinkedIn, Sales Navigator, Indeed, Google, and other platform names are trademarks of their respective owners. SearchCraft is an independent project and is not affiliated with, endorsed by, or sponsored by any of these companies.

SearchCraft generates search URLs based on publicly documented search syntax. It does not access private APIs, scrape content, or bypass any platform restrictions.

---

**Live Site:** [searchcraft.site](https://searchcraft.site)

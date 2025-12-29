<p align="center">
  <img src="public/icons/icon-128.png" alt="SearchCraft Logo" width="128" height="128">
</p>

<h1 align="center">SearchCraft</h1>

<p align="center">
  <strong>Build smarter job and people searches for LinkedIn and job platforms — without guessing Boolean syntax.</strong>
</p>

<p align="center">
  <a href="https://searchcraft.site"><img src="https://github.com/iamB0ody/searchcraft-search-builder/actions/workflows/deploy.yml/badge.svg" alt="Deploy to GitHub Pages"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
</p>

<p align="center">
  SearchCraft is a web application that helps job seekers and recruiters build precise Boolean search queries visually. It generates platform-ready search URLs for LinkedIn, Indeed, Google Jobs, and regional job boards.
</p>

---

## What is SearchCraft?

SearchCraft is a visual Boolean search builder that runs entirely in your browser.

- **Build searches visually** — Add job titles, skills, and exclusions without memorizing Boolean syntax
- **Generate platform-ready URLs** — Open your search directly on LinkedIn, Indeed, or other job boards
- **No scraping, no login required** — SearchCraft generates URLs; you use your own platform accounts
- **Privacy-first** — All data stays in your browser. No tracking, no server, no analytics

---

## Who is it for?

### Job Seekers

- Find relevant jobs faster with precise Boolean queries
- Reduce noise in search results by excluding unwanted terms
- Discover recently posted jobs with date filters
- Use LinkedIn and job boards more effectively

### Recruiters

- Build recruiter-grade people searches on LinkedIn
- Use hiring signals to find candidates more likely to respond
- Save and reuse search presets for different roles
- Source candidates more efficiently across platforms

---

## Key Features

### Visual Search Builder
Build Boolean queries with a simple form. Add job titles (OR-joined), skills (AND-joined), and exclusion terms (NOT).

### Emotional Search Mode
Adjust your search intensity based on your mindset:
- **Urgent** — Broader results, faster searching (accepts more noise)
- **Normal** — Balanced precision and coverage (default)
- **Chill** — Quality-focused, precise results (stricter matching)

### Hiring Signals (People Search)
Enable smart Boolean phrases to find engaged candidates:
- Open to opportunities
- Recruiter-friendly bio
- Exclude students/interns
- Exclude freelance-only profiles

### LinkedIn Jobs Filters
Advanced filters for LinkedIn job searches:
- Date posted (past 24 hours, week, month)
- Jobs in your network
- Fair Chance Employer

### Real-Time Preview
See your Boolean query and platform URL update as you type. Quality score (0-100) with actionable tips.

### Presets & History
Save frequently-used searches as presets. Search history tracks past queries for quick re-use.

### Share Searches
Share via WhatsApp, Telegram, Email, or generate a shareable link.

### PWA Support
Install SearchCraft on your phone or desktop. Works offline (searches require internet).

---

## Supported Platforms

### Job Search

| Platform | Boolean Support | Notes |
|----------|-----------------|-------|
| LinkedIn Jobs | Good | Full Boolean with AND, OR, NOT, parentheses |
| Google Jobs | Good | Works best with shorter queries |
| Indeed | Good | 63 regional domains supported |
| Bayt | Partial | OR and quotes only |
| GulfTalent | Partial | OR and quotes only |
| NaukriGulf | Partial | OR and quotes only |
| Recruit.net | Keywords | Boolean converted to keywords |
| beBee | Keywords | Boolean converted to keywords |
| GulfJobs | Keywords | Boolean converted to keywords |
| ArabJobs | Keywords | Boolean converted to keywords |

### People Search

| Platform | Boolean Support | Notes |
|----------|-----------------|-------|
| LinkedIn | Good | Full Boolean, hiring signals supported |
| Sales Navigator | Good | 15 operator limit per query |

**Note:** SearchCraft generates search URLs — final results depend on each platform's search capabilities.

---

## How It Works

1. **Choose what you're searching for**
   Select Jobs or People, then pick your target platform

2. **Fill the search builder**
   Add job titles, skills, location, and optional filters

3. **Open in platform**
   Click to launch your search directly on LinkedIn, Indeed, or other platforms

---

## Tech Stack

- **Angular 20** — Modern web framework
- **Ionic 8** — Cross-platform UI components
- **TypeScript** — Type-safe JavaScript
- **PWA** — Angular Service Worker for offline support
- **localStorage** — Browser-based data persistence (no server)

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm (or yarn/pnpm)

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

### Test PWA Locally

```bash
npm run build:prod
npx serve dist/searchcraft/browser
```

---

## Limitations

- **No job description analysis** — SearchCraft builds search queries; it doesn't read or analyze job postings
- **No platform scraping** — Results come directly from each platform's search functionality
- **Filter availability varies** — Some filters (like "In your network") only work on specific platforms
- **Results depend on platforms** — Each platform interprets Boolean queries differently

---

## Roadmap

- Additional job platforms and regional support
- Improved onboarding experience
- More recruiter-focused tools and hiring signals
- Query templates for common searches
- Browser extension for one-click searches

---

## Privacy

- **No login required** — Use SearchCraft without creating an account
- **No tracking** — No analytics, no cookies, no data collection
- **No server** — Everything runs in your browser
- **Local storage only** — Presets and history are stored in your browser's localStorage

To clear your data, use your browser's "Clear site data" option.

---

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit with a clear message
6. Open a Pull Request

Please open an issue first for major changes to discuss the approach.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Disclaimer

LinkedIn, Sales Navigator, Indeed, Google, and other platform names are trademarks of their respective owners. SearchCraft is an independent project and is not affiliated with, endorsed by, or sponsored by any of these companies.

SearchCraft generates search URLs based on publicly documented search syntax. It does not access private APIs, scrape content, or bypass any platform restrictions.

---

**Live Site:** [searchcraft.site](https://searchcraft.site)

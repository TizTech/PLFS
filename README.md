# PLFS

PLFS is a one-page Premier League dashboard and live tracker for football.

## What It Shows

- Yesterday / Today / Tomorrow EPL matches (live feed)
- Match status and scorelines
- Current Premier League table
- Quick search filter for teams and matches
- Dark/light theme toggle

## Data Source

- Live data is fetched from ESPN public endpoints:
  - `https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard`
  - `https://site.api.espn.com/apis/v2/sports/soccer/eng.1/standings`

## Run

1. Open `index.html` directly in a browser.
2. Internet connection is required for live data.

## Files

- `index.html` - single dashboard layout
- `styles.css` - simple responsive styling
- `app.js` - live fetch, rendering, filtering, theme toggle
- `README.md` - project notes

## Future Improvements

- Auto-refresh every 30-60 seconds during live games
- Match detail drawer with events/stats
- Better offline fallback/cache behavior
- Team profile cards with deeper stats

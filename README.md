# retrocableguide

A PAL-era cable guide recreation built with React and Vite.

The UI targets a `720x576` frame and recreates a 1990s cable listings look while loading live channel and programme data from configurable M3U and XMLTV feeds.

## Features

- Retro guide UI tuned against reference captures
- Shared grid layout for top panel and listings alignment
- Configurable XMLTV + M3U feed ingestion
- Configurable preview channel rotation
- Configurable guide logo image
- TS playback via `mpegts.js`
- HLS playback via `hls.js`
- Configurable `12h` or `24h` time formatting

## Running Locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Configuration

Main config lives in [src/config.js](./src/config.js).

Important options:

- `m3uUrl`: playlist source
- `xmltvUrl`: XMLTV source
- `proxyPath`: guide API path, normally `/api/guide`
- `allowedGroups`: M3U `group-title` values to include
- `channelLimit`: `0` means no limit
- `timeFormat`: `"12h"` or `"24h"`
- `previewChannels`: ordered list of channel numbers used for preview rotation
- `previewCycleSeconds`: preview rotation interval
- `previewVideoUrl`: optional fixed preview override; blank means use preview channel streams
- `previewMuted`: preview audio policy
- `guideLogoUrl`: configurable guide logo image
- `fallbackToDemoData`: whether to use demo guide data if live feed loading fails

## Data Flow

1. The Vite server exposes `/api/guide`.
2. That endpoint fetches the configured M3U and XMLTV feeds.
3. The app normalizes the feed into a simple guide payload.
4. The listings render from the full filtered channel set.
5. The preview panel rotates independently over `previewChannels`.

## Preview Notes

- Raw TS preview streams are played in-browser with `mpegts.js`.
- HLS manifests are played with `hls.js`.
- Wider-than-`4:3` sources are cropped to fill the retro preview window.
- If `previewVideoUrl` is set, it overrides the rotating preview channel streams.

## Assets

- Guide logo: [public/guide-logo.png](./public/guide-logo.png)
- SVG source: [public/guide-logo.svg](./public/guide-logo.svg)

## Reference / Handoff

Project-specific handoff notes live in [AGENTS.md](./AGENTS.md).

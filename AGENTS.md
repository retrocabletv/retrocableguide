# Retro Cable Guide Handoff

## Current State

- Project path: `/Users/alexkinch/Projects/alexkinch/retrocableguide`
- GitHub repo: `github.com/alexkinch/retrocableguide`
- Branch: `main`
- Main implementation file: `retrocableguide.jsx`
- Main config file: `src/config.js`
- Guide logo asset: `public/guide-logo.png`
- Mosaic page: `src/mosaic.jsx`

## What Was Built

- A PAL-era cable guide recreation in React/Vite.
- Frame target is `720x576`.
- The app now has three routes:
  - `/` launcher
  - `/guide` retro guide
  - `/mosaic` mosaic wall
- The top layout was rebuilt around a shared grid instead of ad hoc sections.
- Live guide data now comes from configurable M3U and XMLTV feeds.
- The main listings render from the full filtered channel set.
- The top-left preview panel and video rotate over a configurable `previewChannels` subset.
- The top-left preview info panel now supports configurable transition effects.
- A separate mosaic page shows 12 outer live tiles plus a rotating centre promo tile.
- Mosaic page audio can be overridden with a separate URL.
- The right preview window now crops wider-than-`4:3` sources to fill the retro preview area.
- The lower guide area uses shared column geometry so `START` and `CHANNEL` line up with the content rows.
- Branding was changed from `NYNEX` to `ALEX`.

## Important Design Decisions

- Treat this as **PAL 576i / 720x576**, not 480i.
- Preserve overall proportions. Do not keep shrinking modules to solve safe-area problems.
- Safe-area thinking should apply mostly to text/graphics placement, not to collapsing the whole composition.
- The main guide and preview channel rotation are separate concerns.
- Preview channel logic must not affect the main listings set.
- Guide preview transitions only apply to the top-left info panel, not the video window.
- Mosaic page behavior must stay isolated from guide-page behavior.
- Most UI chrome uses a Futura-style stack: `F_UI`.
- Programme listing rows use Arial/Helvetica-style italic text: `F_MAIN`.

## Current Layout Constants

These are at the top of `retrocableguide.jsx` and drive most geometry:

- `FRAME_WIDTH`
- `FRAME_HEIGHT`
- `LEFT_PANEL_WIDTH`
- `RIGHT_PANEL_WIDTH`
- `TOP_TOTAL_HEIGHT`
- `TOP_TEXT_HEIGHT`
- `CALENDAR_ROW_HEIGHT`
- `HEADER_HEIGHT`
- `BODY_HEIGHT`
- `START_COL_WIDTH`
- `LEFT_CHANNEL_WIDTH`
- `NOW_HEADER_WIDTH`
- `TELE_TEXT_WIDTH`

If proportions drift again, adjust these first instead of patching individual blocks.

## Feed and Preview Notes

- Feed config lives in `src/config.js`.
- Current guide sources are Dispatcharr endpoints:
  - `m3uUrl: http://192.168.20.186:9191/output/m3u`
  - `xmltvUrl: http://192.168.20.186:9191/output/epg`
- Current `allowedGroups` are the UK groups.
- `channelLimit: 0` means no guide cap.
- `previewChannels` controls the rotating preview subset.
- `previewInfoMode` controls whether the top-left panel rotates or stays fixed.
- `previewVideoMode` controls whether the large preview follows a channel stream or a fixed URL.
- `previewFixedChannel` can pin the top-left panel when not rotating.
- `previewTransitions`, `previewTransitionMode`, and `previewTransitionSeconds` control the top-left panel effect.
- `previewVideoUrl` is an override; blank means use the current preview channel stream.
- `previewCycleSeconds` is currently `15`.
- `previewTransitionSeconds` is currently `1.2`.
- `mosaicChannels` controls the 12-tile mosaic lineup.
- `mosaicAudioUrl` is currently a Sky Radio MP3 stream override.
- TS preview uses `mpegts.js`.
- HLS preview uses `hls.js`.
- Shared TS/HLS tile playback logic lives in `src/components/stream-media.jsx`.
- The guide logo is now loaded from `public/guide-logo.png`.

## Known Remaining Issues / Likely Next Steps

- Browser TS preview still needs real-world validation against all channels.
- The transition set may still want editorial tuning; the framework is now configurable.
- Calendar badge could still be pushed closer to the exact reference if needed.
- Logo cell could still be refined if a more exact scribbled mark is desired.
- Header colors and contrast may still want tiny calibration against additional captures.
- The top-left channel/logo/programme panel may still need small proportional tuning depending on new references.

## Things Not To Break

- Do not let preview-channel filtering mutate the main listings.
- Do not let guide transitions affect the video window.
- Do not let the mosaic page logic leak back into the guide page.
- Do not go back to independent top/bottom layouts; keep the shared grid.
- Do not replace the listing rows with a separate programme column.
- Do not shrink everything globally to chase safe zones.

## Useful Commands

Install / run:

```bash
npm install
npm run dev
npm run build
```

Transcode a browser-friendly 4:3 preview file:

```bash
ffmpeg -i video.mp4 -vf "scale=768:576:flags=lanczos,setsar=1,setdar=4/3" -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p -c:a aac -b:a 192k /Users/alexkinch/Projects/alexkinch/retrocableguide/public/video.mp4
```

Inspect live guide data:

```bash
curl -s http://127.0.0.1:5175/api/guide
```

## Final Instruction

The current version was explicitly approved by the user as looking good after the top-layout rebuild. Future changes should be incremental and reference-driven.

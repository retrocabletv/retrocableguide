# Cable Guide Handoff

## Current State

- Project path: `/Users/alexkinch/Projects/alexkinch/nynex-epg`
- GitHub repo: `github.com/alexkinch/cableguide`
- Branch: `main`
- Main implementation file: `nynex-epg.jsx`
- Preview video path: `public/video.mp4`

## What Was Built

- A PAL-era cable guide recreation in React/Vite.
- Frame target is `720x576`.
- The top layout was rebuilt around a shared grid instead of ad hoc sections.
- The right preview window now preserves the full video frame rather than cropping it.
- The lower guide area uses shared column geometry so `START` and `CHANNEL` line up with the content rows.
- Branding was changed from `NYNEX` to `ALEX`.

## Important Design Decisions

- Treat this as **PAL 576i / 720x576**, not 480i.
- Preserve overall proportions. Do not keep shrinking modules to solve safe-area problems.
- Safe-area thinking should apply mostly to text/graphics placement, not to collapsing the whole composition.
- The preview window should remain proportional and should not crop the source video.
- Most UI chrome uses a Futura-style stack: `F_UI`.
- Programme listing rows use Arial/Helvetica-style italic text: `F_MAIN`.

## Current Layout Constants

These are at the top of `nynex-epg.jsx` and drive most geometry:

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

## Preview Video Notes

- Browser preview works best with a square-pixel 4:3 file.
- Current source should live at `public/video.mp4`.
- Earlier issues came from bad transcodes and bad aspect metadata.
- Current preview rendering is set up to preserve the full frame.

## Known Remaining Issues / Likely Next Steps

- Calendar badge could still be pushed closer to the exact reference if needed.
- Logo cell could still be refined if a more exact scribbled mark is desired.
- Header colors and contrast may still want tiny calibration against additional captures.
- The top-left channel/logo/programme panel may still need small proportional tuning depending on new references.

## Things Not To Break

- Do not reintroduce cropped preview video.
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
ffmpeg -i video.mp4 -vf "scale=768:576:flags=lanczos,setsar=1,setdar=4/3" -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p -c:a aac -b:a 192k /Users/alexkinch/Projects/alexkinch/nynex-epg/public/video.mp4
```

## Final Instruction

The current version was explicitly approved by the user as looking good after the top-layout rebuild. Future changes should be incremental and reference-driven.

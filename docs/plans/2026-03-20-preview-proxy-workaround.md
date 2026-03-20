## Preview Proxy Workaround

### Goal

Provide a browser-playable live preview for a selected channel without pushing TS/HLS conversion logic into the retro guide app.

### Problem

The current IPTV sources exposed by Dispatcharr are MPEG-TS stream URLs. Native browser `<video>` playback for raw TS is unreliable. The guide app can select a channel, but that does not make the stream browser-safe.

### Recommended Approach

Run a small separate preview service that:

1. Pulls one TS channel stream from Dispatcharr.
2. Repackages or transcodes it into HLS.
3. Exposes a stable browser URL like `/preview/current.m3u8`.
4. Leaves this app responsible only for rendering the UI and loading `previewVideoUrl`.

This keeps the retro guide app simple and makes future Astro migration easier because the preview pipeline remains external.

### Minimal Architecture

- `retrocableguide`
  - reads `previewVideoUrl`
  - renders the preview window
  - does not know about TS vs HLS internals
- `preview-proxy`
  - receives a configured source TS URL or channel ID
  - runs `ffmpeg`
  - writes a rolling HLS playlist and segment files
  - serves the generated `.m3u8` and `.ts`/`.m4s` files

### Suggested Config Shape

In this app:

```js
export const APP_CONFIG = {
  previewVideoUrl: "http://localhost:8081/preview/current.m3u8",
  // ...
};
```

In the preview service:

```env
SOURCE_STREAM_URL=http://dispatcharr/proxy/ts/stream/...
OUTPUT_DIR=/tmp/retrocableguide-preview
PORT=8081
```

### First-Pass FFmpeg Command

If the incoming codecs are already browser-compatible, start with repackaging:

```bash
ffmpeg -i "$SOURCE_STREAM_URL" \
  -c copy \
  -f hls \
  -hls_time 4 \
  -hls_list_size 6 \
  -hls_flags delete_segments+append_list \
  /tmp/retrocableguide-preview/current.m3u8
```

If `-c copy` does not play reliably in the browser, transcode to H.264/AAC:

```bash
ffmpeg -i "$SOURCE_STREAM_URL" \
  -c:v libx264 \
  -preset veryfast \
  -c:a aac \
  -f hls \
  -hls_time 4 \
  -hls_list_size 6 \
  -hls_flags delete_segments+append_list \
  /tmp/retrocableguide-preview/current.m3u8
```

### Minimal Service Responsibilities

- Start `ffmpeg` for the configured source stream.
- Serve `/preview/current.m3u8` and segment files from the output directory.
- Restart `ffmpeg` if the upstream stream drops.
- Keep only a short rolling window of segments.

### Future Extension

Once this exists, the app can add:

- `previewChannelId`
- `previewRotationSeconds`
- `previewChannels`

The preview service would then switch source streams while keeping a stable HLS output path for the browser.

### Recommendation

Do not build the TS-to-HLS pipeline into the main retro guide app. Treat it as a separate utility or sidecar service and keep `previewVideoUrl` as the app’s only playback input.

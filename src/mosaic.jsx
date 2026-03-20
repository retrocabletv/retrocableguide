import { useEffect, useMemo, useState } from "react";
import { APP_CONFIG } from "./config.js";
import { loadGuideData } from "./guide/client.js";
import { StreamMedia } from "./components/stream-media.jsx";

const FRAME_WIDTH = 720;
const FRAME_HEIGHT = 576;
const TILE_WIDTH = 180;
const TILE_HEIGHT = 144;
const PROMO_WIDTH = 360;
const PROMO_HEIGHT = 288;
const LABEL_FONT = "\"VT323\", \"Helvetica Neue\", Helvetica, Arial, sans-serif";
const TEXT_OUTLINE = "1px 0 0 #000000, -1px 0 0 #000000, 0 1px 0 #000000, 0 -1px 0 #000000";

const TILE_POSITIONS = [
  { left: 0, top: 0 },
  { left: 180, top: 0 },
  { left: 360, top: 0 },
  { left: 540, top: 0 },
  { left: 0, top: 144 },
  { left: 540, top: 144 },
  { left: 0, top: 288 },
  { left: 540, top: 288 },
  { left: 0, top: 432 },
  { left: 180, top: 432 },
  { left: 360, top: 432 },
  { left: 540, top: 432 },
];

function TileLabel({ num, verticalAlign = "top" }) {
  return (
    <div
      style={{
        position: "absolute",
        top: verticalAlign === "top" ? "6px" : "auto",
        bottom: verticalAlign === "bottom" ? "6px" : "auto",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 2,
        fontFamily: LABEL_FONT,
        fontWeight: 400,
        fontSize: "22px",
        color: "#ffffff",
        lineHeight: 1,
        letterSpacing: "0.5px",
        textShadow: "1px 1px 0 #000000, 2px 2px 0 rgba(0,0,0,0.65)",
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      CH {num}
    </div>
  );
}

function MosaicTile({ channel, left, top, width, height, muted, labelAlign = "top" }) {
  const streamUrl = channel?.streamUrl || "";

  return (
    <div
      style={{
        position: "absolute",
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        background: "#000000",
        overflow: "hidden",
      }}
    >
      {channel ? <TileLabel num={channel.num} verticalAlign={labelAlign} /> : null}
      {streamUrl ? <StreamMedia url={streamUrl} muted={muted} fit="cover" /> : null}
    </div>
  );
}

export default function MosaicPage() {
  const [channels, setChannels] = useState([]);
  const [promoIndex, setPromoIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function refreshGuide() {
      const payload = await loadGuideData();
      if (cancelled || !payload?.channels?.length) {
        return;
      }

      setChannels(payload.channels);
    }

    refreshGuide();

    if (!APP_CONFIG.refreshMinutes) {
      return () => {
        cancelled = true;
      };
    }

    const intervalId = setInterval(refreshGuide, APP_CONFIG.refreshMinutes * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  const mosaicChannels = useMemo(() => {
    const desired = APP_CONFIG.mosaicChannels?.length
      ? APP_CONFIG.mosaicChannels
      : channels.slice(0, 12).map((channel) => channel.num);

    return desired
      .map((num) => channels.find((channel) => channel.num === num))
      .filter(Boolean)
      .slice(0, 12);
  }, [channels]);

  useEffect(() => {
    if (mosaicChannels.length <= 1) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % mosaicChannels.length);
    }, (APP_CONFIG.mosaicCycleSeconds || 30) * 1000);

    return () => clearInterval(intervalId);
  }, [mosaicChannels]);

  useEffect(() => {
    setPromoIndex((prev) => {
      if (!mosaicChannels.length) {
        return 0;
      }

      return Math.min(prev, mosaicChannels.length - 1);
    });
  }, [mosaicChannels.length]);

  const promoChannel = mosaicChannels[promoIndex] || null;
  const audioUrl = APP_CONFIG.mosaicAudioUrl || promoChannel?.streamUrl || "";

  return (
    <div
      style={{
        width: `${FRAME_WIDTH}px`,
        height: `${FRAME_HEIGHT}px`,
        margin: "0 auto",
        position: "relative",
        overflow: "hidden",
        background: "#000000",
        textShadow: TEXT_OUTLINE,
      }}
    >
      {TILE_POSITIONS.map((position, index) => (
        <MosaicTile
          key={`tile-${mosaicChannels[index]?.num ?? index}`}
          channel={mosaicChannels[index] || null}
          left={position.left}
          top={position.top}
          width={TILE_WIDTH}
          height={TILE_HEIGHT}
          muted
          labelAlign={position.top >= 288 ? "bottom" : "top"}
        />
      ))}

      <MosaicTile
        channel={promoChannel}
        left={180}
        top={144}
        width={PROMO_WIDTH}
        height={PROMO_HEIGHT}
        muted
        labelAlign="top"
      />

      {audioUrl ? <StreamMedia url={audioUrl} muted={false} audioOnly /> : null}
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from "react";
import { APP_CONFIG } from "../config.js";
import { loadGuideData } from "../guide/client.js";
import { CrtOverlay } from "../components/crt-overlay.jsx";

const F_MAIN = "Arial, Helvetica, sans-serif";
const F_UI = "Futura, 'Futura PT', 'Century Gothic', Arial, sans-serif";
const F_TELETEXT = "Georgia, Palatino, 'Times New Roman', serif";
const IS_NYNEX = APP_CONFIG.guideStyle === "nynex";
const SHOW_PROMOS = APP_CONFIG.previewContentMode === "promo";
const FRAME_WIDTH = 720;
const FRAME_HEIGHT = 576;
const TITLE_SAFE_SCALE = 0.9; // 10% inset — PAL title-safe area
const LEFT_PANEL_WIDTH = 287;
const RIGHT_PANEL_WIDTH = FRAME_WIDTH - LEFT_PANEL_WIDTH;
const TOP_TOTAL_HEIGHT = Math.round(RIGHT_PANEL_WIDTH * 3 / 4);
const TOP_TEXT_HEIGHT = 210;
const CALENDAR_ROW_HEIGHT = TOP_TOTAL_HEIGHT - TOP_TEXT_HEIGHT;
const HEADER_HEIGHT = 38;
const BODY_HEIGHT = FRAME_HEIGHT - TOP_TOTAL_HEIGHT - HEADER_HEIGHT;
const START_COL_WIDTH = 100;
const LEFT_CHANNEL_WIDTH = LEFT_PANEL_WIDTH - START_COL_WIDTH;
const NOW_HEADER_WIDTH = 148;
const TELE_TEXT_WIDTH = FRAME_WIDTH - LEFT_PANEL_WIDTH - NOW_HEADER_WIDTH;
const BODY_TEXT_WIDTH = FRAME_WIDTH - START_COL_WIDTH - 8;
const TEXT_OUTLINE = "1px 0 0 #000000, -1px 0 0 #000000, 0 1px 0 #000000, 0 -1px 0 #000000";

const C_DEEP_BLUE = IS_NYNEX ? "#141850" : "#1a2060";
const C_DARK_HEADER = IS_NYNEX ? "#0e2258" : "#162e6a";
const C_YELLOW = "#e8d400";
const C_CHANNEL_PEACH = "#e8a848";
const C_ROW_EVEN = IS_NYNEX ? "#08082e" : "#0c0c34";
const C_ROW_ODD = IS_NYNEX ? "#14145a" : "#1a1a62";
const C_BORDER = IS_NYNEX ? "#3a5080" : "#4a6090";

function resolveBrand(text) {
  if (!text) return text;
  return text.replace(/\{brand\}/gi, (APP_CONFIG.guideBrand || "cable").toUpperCase());
}

const PROMOS = (APP_CONFIG.promos || []).map(p => ({
  ...p,
  title: resolveBrand(p.title),
  lines: (p.lines || []).map(resolveBrand),
  highlight: resolveBrand(p.highlight),
  price: resolveBrand(p.price),
  price2: resolveBrand(p.price2),
  footer: resolveBrand(p.footer),
}));

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const SHORT_DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function pad(n) { return String(n).padStart(2, "0"); }

const ONE_LINE = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "clip",
};

let measureContext = null;

function getMeasureContext() {
  if (typeof document === "undefined") {
    return null;
  }

  if (!measureContext) {
    measureContext = document.createElement("canvas").getContext("2d");
  }

  return measureContext;
}

function countWrappedLines(label, title, maxWidth) {
  const ctx = getMeasureContext();
  if (!ctx) {
    return 1;
  }

  ctx.font = "italic bold 26px Arial";
  const tokens = [label, ...title.split(/\s+/).filter(Boolean)];
  let lines = 1;
  let current = "";

  for (const token of tokens) {
    const next = current ? `${current} ${token}` : token;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
      continue;
    }

    if (!current) {
      current = token;
      continue;
    }

    lines += 1;
    current = token;
  }

  return lines;
}

function getVisibleEntries(entries, maxRows) {
  const visible = [];
  let usedRows = 0;

  for (const entry of entries) {
    const label = `${pad(entry.num)} ${entry.channelName}`;
    const rowLines = countWrappedLines(label, entry.title, BODY_TEXT_WIDTH);
    if (usedRows + rowLines > maxRows) {
      break;
    }
    visible.push(entry);
    usedRows += rowLines;
  }

  return visible;
}

function splitEntriesIntoPages(entries, maxRows) {
  const pages = [];
  let offset = 0;

  while (offset < entries.length) {
    const page = getVisibleEntries(entries.slice(offset), maxRows);
    if (!page.length) {
      break;
    }
    pages.push(page);
    offset += page.length;
  }

  return pages.length ? pages : [[]];
}

function ChannelLogo({ logoUrl, alt, size = 28 }) {
  if (!logoUrl) {
    return null;
  }

  return (
    <img
      src={logoUrl}
      alt={alt}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: "contain",
        flexShrink: 0,
      }}
    />
  );
}

function CalendarBadge({ date }) {
  const day = IS_NYNEX ? SHORT_DAYS[date.getDay()] : DAYS[date.getDay()];
  const dateNum = date.getDate();
  const h = APP_CONFIG.timeFormat === "12h"
    ? String(date.getHours() % 12 || 12)
    : String(date.getHours());
  const m = pad(date.getMinutes());

  return (
    <div style={{
      background: "linear-gradient(180deg, #d4a030 0%, #c88e2a 42%, #b07820 100%)",
      borderRadius: "14px 14px 12px 12px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      width: "82%",
      height: `${CALENDAR_ROW_HEIGHT - 12}px`,
      position: "relative",
      boxShadow: "2px 3px 0px rgba(0,0,0,0.88), inset 0 0 0 1px rgba(255,248,221,0.4)",
      border: "2px solid #221200",
      overflow: "visible",
      marginLeft: "auto",
      marginRight: "0",
    }}>
      <div style={{
        position: "absolute",
        inset: "2px",
        borderRadius: "11px 11px 9px 9px",
        background: "linear-gradient(180deg, rgba(255,245,214,0.72) 0%, rgba(255,255,255,0.08) 20%, transparent 42%, rgba(88,38,6,0.08) 100%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        top: "-7px",
        left: "16px",
        width: "11px",
        height: "18px",
        background: "linear-gradient(180deg, #fff8e6 0%, #f3dca7 40%, #d39a42 100%)",
        borderRadius: "7px",
        border: "1px solid #6f4514",
        boxShadow: "1px 1px 0 rgba(0,0,0,0.7)",
      }} />
      <div style={{
        position: "absolute",
        top: "-7px",
        right: "16px",
        width: "11px",
        height: "18px",
        background: "linear-gradient(180deg, #fff8e6 0%, #f3dca7 40%, #d39a42 100%)",
        borderRadius: "7px",
        border: "1px solid #6f4514",
        boxShadow: "1px 1px 0 rgba(0,0,0,0.7)",
      }} />
      <div style={{
        position: "absolute",
        top: "0px",
        left: "18px",
        width: "8px",
        height: "8px",
        background: "#4f2902",
        borderRadius: "50%",
        boxShadow: "inset 0 1px 0 rgba(255,224,169,0.35)",
      }} />
      <div style={{
        position: "absolute",
        top: "0px",
        right: "18px",
        width: "8px",
        height: "8px",
        background: "#4f2902",
        borderRadius: "50%",
        boxShadow: "inset 0 1px 0 rgba(255,224,169,0.35)",
      }} />
      {/* Day-name banner strip */}
      <div style={{
        position: "absolute",
        top: "10px",
        left: "4px",
        right: "4px",
        height: "16px",
        background: "linear-gradient(180deg, #b85a18 0%, #9a4210 100%)",
        borderRadius: "3px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 1px 0 rgba(0,0,0,0.2)",
      }}>
        <span style={{
          fontFamily: F_UI,
          fontWeight: 900,
          fontSize: IS_NYNEX ? "11px" : "8px",
          color: "#fff8e0",
          letterSpacing: IS_NYNEX ? "1.5px" : "0.5px",
          textTransform: "uppercase",
          textShadow: "0 1px 0 rgba(0,0,0,0.4)",
          lineHeight: 1,
        }}>{day}</span>
      </div>
      <div style={{
        position: "absolute",
        top: "30px",
        left: 0,
        right: 0,
        fontFamily: "'Bodoni 72', 'Didot', 'Times New Roman', serif",
        fontWeight: 900,
        fontSize: "48px",
        color: "#150c02",
        lineHeight: 0.78,
        letterSpacing: "-1.4px",
        textShadow: "1px 1px 0 rgba(109,72,18,0.28)",
        textAlign: "center",
        fontStyle: "normal",
      }}>{dateNum}</div>
      <div style={{
        position: "absolute",
        bottom: "5px",
        left: 0,
        right: 0,
        fontFamily: F_MAIN,
        fontWeight: 700,
        fontSize: "22px",
        color: "#221100",
        lineHeight: 1,
        letterSpacing: "-0.7px",
        textAlign: "center",
      }}>{h}:{m}</div>
    </div>
  );
}

function GuideLogo() {
  const brand = (APP_CONFIG.guideBrand || "cable").toUpperCase();
  return (
    <div style={{
      background: "#ffffff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "2px 2px 0px #000",
      border: "2px solid #1a2050",
      position: "relative",
      overflow: "hidden",
      width: "100%",
      height: `${CALENDAR_ROW_HEIGHT - 10}px`,
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        background: "repeating-linear-gradient(135deg, rgba(180,190,220,0.18) 0px, rgba(180,190,220,0.18) 2px, transparent 2px, transparent 8px)",
      }} />
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        lineHeight: 1,
        textShadow: "none",
      }}>
        <span style={{
          fontFamily: F_UI,
          fontWeight: 900,
          fontSize: "30px",
          letterSpacing: "3px",
          color: "#1a2668",
        }}>{brand}</span>
        <span style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: "14px",
          color: "#333",
          marginTop: "-1px",
          letterSpacing: "0.5px",
        }}>channel</span>
        <span style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontStyle: "italic",
          fontWeight: 700,
          fontSize: "36px",
          color: "#1a1a1a",
          marginTop: "-6px",
          letterSpacing: "0.5px",
        }}>Guide</span>
      </div>
    </div>
  );
}

function PromoPanel({ promoIndex }) {
  const promo = PROMOS[promoIndex % PROMOS.length];
  return (
    <div style={{
      position: "absolute",
      inset: 0,
      background: `linear-gradient(170deg, #10103a 0%, #0a0a30 40%, #060620 100%)`,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
      padding: "14px 20px",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse at 50% 40%, rgba(40,40,100,0.35), transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        inset: 0,
        background: "repeating-linear-gradient(180deg, rgba(255,255,255,0.015) 0 1px, transparent 1px 3px)",
        opacity: 0.4,
        pointerEvents: "none",
      }} />
      <div style={{
        fontFamily: F_UI,
        fontWeight: 900,
        fontSize: "22px",
        color: C_YELLOW,
        marginBottom: "10px",
        letterSpacing: "0.5px",
        textShadow: TEXT_OUTLINE,
      }}>{promo.title}</div>
      {promo.lines.filter(Boolean).map((line, i) => (
        <div key={i} style={{
          fontFamily: F_UI,
          fontWeight: 700,
          fontSize: "26px",
          color: "#ffffff",
          lineHeight: 1.3,
          textShadow: TEXT_OUTLINE,
        }}>{line}</div>
      ))}
      {promo.highlight && (
        <div style={{
          fontFamily: F_UI,
          fontWeight: 900,
          fontSize: "26px",
          color: C_YELLOW,
          marginTop: "6px",
          lineHeight: 1.3,
          textShadow: TEXT_OUTLINE,
        }}>{promo.highlight}</div>
      )}
      {promo.price && (
        <div style={{
          fontFamily: F_UI,
          fontWeight: 900,
          fontSize: "44px",
          color: "#ffffff",
          marginTop: "4px",
          lineHeight: 1.0,
          textShadow: TEXT_OUTLINE,
        }}>
          {promo.price}
          {promo.price2 && <div style={{ fontSize: "38px" }}>{promo.price2}</div>}
        </div>
      )}
      {promo.footer && (
        <div style={{
          fontFamily: F_UI,
          fontWeight: 400,
          fontSize: "17px",
          color: "#d0d0d8",
          marginTop: "10px",
          textShadow: TEXT_OUTLINE,
        }}>{promo.footer}</div>
      )}
    </div>
  );
}

function createSeededRandom(seed) {
  let value = (seed || 1) >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function PreviewTransitionOverlay({ type, reveal, durationMs, seed, children }) {
  if (!type) {
    return null;
  }

  const shellStyle = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    overflow: "hidden",
  };

  if (type === "blockDissolve") {
    const columns = 8;
    const rows = 6;
    const random = createSeededRandom(seed);
    const cells = [];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        cells.push({
          col,
          row,
          left: `${(col / columns) * 100}%`,
          top: `${(row / rows) * 100}%`,
          width: `${100 / columns}%`,
          height: `${100 / rows}%`,
          delay: Math.round(random() * durationMs * 0.75),
        });
      }
    }

    return (
      <div style={shellStyle}>
        {cells.map((cell, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              left: cell.left,
              top: cell.top,
              width: cell.width,
              height: cell.height,
              overflow: "hidden",
              opacity: reveal ? 1 : 0,
              transition: `opacity 120ms steps(2, end) ${cell.delay}ms`,
            }}
          >
            <div
              style={{
                position: "absolute",
                width: `${columns * 100}%`,
                height: `${rows * 100}%`,
                left: `-${cell.col * 100}%`,
                top: `-${cell.row * 100}%`,
              }}
            >
              {children}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "blindsHorizontal" || type === "blindsVertical") {
    const count = 8;
    const isHorizontal = type === "blindsHorizontal";
    return (
      <div style={shellStyle}>
        {Array.from({ length: count }).map((_, index) => {
          const delay = Math.round((durationMs * 0.45 * index) / count);
          const sliceOffset = `${index * 100}%`;
          return (
            <div
              key={index}
              style={{
                position: "absolute",
                left: isHorizontal ? 0 : `${(index / count) * 100}%`,
                top: isHorizontal ? `${(index / count) * 100}%` : 0,
                width: isHorizontal ? "100%" : `${100 / count}%`,
                height: isHorizontal ? `${100 / count}%` : "100%",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  transform: isHorizontal
                    ? `scaleY(${reveal ? 1 : 0})`
                    : `scaleX(${reveal ? 1 : 0})`,
                  transformOrigin: isHorizontal ? "center top" : "left center",
                  transition: `transform 220ms steps(2, end) ${delay}ms`,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    width: isHorizontal ? "100%" : `${count * 100}%`,
                    height: isHorizontal ? `${count * 100}%` : "100%",
                    left: isHorizontal ? 0 : `-${sliceOffset}`,
                    top: isHorizontal ? `-${sliceOffset}` : 0,
                  }}
                >
                  {children}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const wipeClips = {
    wipeLeft: reveal ? "inset(0 0 0 0)" : "inset(0 0 0 100%)",
    wipeRight: reveal ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
    wipeUp: reveal ? "inset(0 0 0 0)" : "inset(100% 0 0 0)",
    wipeDown: reveal ? "inset(0 0 0 0)" : "inset(0 0 100% 0)",
  };

  return (
    <div
      style={{
        ...shellStyle,
        clipPath: wipeClips[type] || "inset(0 0 0 0)",
        transition: `clip-path ${durationMs}ms steps(10, end)`,
      }}
    >
      {children}
    </div>
  );
}

function NowOnPanelContent({ channel, programme }) {
  const channelNum = channel ? String(channel.num) : "--";
  const logoUrl = channel?.logoUrl || "";
  const channelName = channel?.name || "No preview";

  return (
    <>
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "6px",
        marginBottom: IS_NYNEX ? "0px" : "4px",
      }}>
        <div style={{
          fontFamily: F_UI,
          fontWeight: 900,
          color: "#ffffff",
          lineHeight: 0.95,
          letterSpacing: "-0.5px",
          width: IS_NYNEX ? "120px" : "104px",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          gap: IS_NYNEX ? "0px" : "2px",
          marginTop: IS_NYNEX ? "4px" : "6px",
          textAlign: "left",
        }}>
          <div style={{ fontSize: IS_NYNEX ? "22px" : "24px", fontStyle: IS_NYNEX ? "italic" : "normal", fontWeight: 900 }}>Now on</div>
          <div style={{ fontSize: IS_NYNEX ? "17px" : "19px", fontStyle: IS_NYNEX ? "italic" : "normal", whiteSpace: "nowrap" }}>{IS_NYNEX ? "ch." : "Ch."} <span style={{ fontSize: IS_NYNEX ? "38px" : "34px", fontStyle: "normal" }}>{channelNum}</span></div>
        </div>
        <div style={{
          width: IS_NYNEX ? "130px" : "120px",
          height: IS_NYNEX ? "80px" : "90px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <ChannelLogo logoUrl={logoUrl} alt={channelName} size={IS_NYNEX ? 90 : 100} />
        </div>
      </div>
      <div style={{
        fontFamily: F_UI,
        fontWeight: 700,
        fontStyle: "normal",
        fontSize: IS_NYNEX ? "22px" : "24px",
        color: "#ffffff",
        letterSpacing: "-0.5px",
        marginTop: IS_NYNEX ? "10px" : "15px",
        textAlign: "left",
        lineHeight: 1.05,
      }}>{programme}</div>
    </>
  );
}

// --- NOW ON PANEL ---
function NowOnPanel({ channel, programme }) {
  const [displayedChannel, setDisplayedChannel] = useState(channel);
  const [displayedProgramme, setDisplayedProgramme] = useState(programme);
  const [incomingChannel, setIncomingChannel] = useState(null);
  const [incomingProgramme, setIncomingProgramme] = useState("");
  const [transitionActive, setTransitionActive] = useState(false);
  const [transitionReveal, setTransitionReveal] = useState(false);
  const [transitionType, setTransitionType] = useState(APP_CONFIG.previewTransitions?.[0] || "blockDissolve");
  const [transitionSeed, setTransitionSeed] = useState(1);
  const transitionIndexRef = useRef(0);
  const durationMs = Math.max(100, Math.round((APP_CONFIG.previewTransitionSeconds || 1) * 1000));

  useEffect(() => {
    const nextChannelNum = channel?.num ?? null;
    const displayedChannelNum = displayedChannel?.num ?? null;
    const hasChanged = nextChannelNum !== displayedChannelNum || programme !== displayedProgramme;

    if (!hasChanged) {
      return undefined;
    }

    const configuredTransitions = APP_CONFIG.previewTransitions?.length
      ? APP_CONFIG.previewTransitions
      : ["blockDissolve"];
    const nextType = APP_CONFIG.previewTransitionMode === "cycle"
      ? configuredTransitions[transitionIndexRef.current++ % configuredTransitions.length]
      : configuredTransitions[Math.floor(Math.random() * configuredTransitions.length)];

    setTransitionType(nextType);
    setTransitionSeed((nextChannelNum || 0) * 97 + (displayedChannelNum || 0) * 13 + Date.now());
    setIncomingChannel(channel);
    setIncomingProgramme(programme);
    setTransitionActive(true);
    setTransitionReveal(false);

    const startTimer = setTimeout(() => {
      setTransitionReveal(true);
    }, 20);

    const settleTimer = setTimeout(() => {
      setDisplayedChannel(channel);
      setDisplayedProgramme(programme);
      setIncomingChannel(null);
      setIncomingProgramme("");
      setTransitionActive(false);
      setTransitionReveal(false);
    }, durationMs);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(settleTimer);
    };
  }, [channel, displayedChannel, displayedProgramme, durationMs, programme]);

  return (
    <div style={{ padding: "8px 10px 4px 10px", height: "100%", position: "relative", overflow: "hidden" }}>
      <NowOnPanelContent channel={displayedChannel} programme={displayedProgramme} />
      {transitionActive && incomingChannel ? (
        <PreviewTransitionOverlay
          type={transitionType}
          reveal={transitionReveal}
          durationMs={durationMs}
          seed={transitionSeed}
        >
          <div style={{ position: "absolute", inset: 0, background: C_DEEP_BLUE, padding: "8px 10px 4px 10px", overflow: "hidden" }}>
            <NowOnPanelContent channel={incomingChannel} programme={incomingProgramme} />
          </div>
        </PreviewTransitionOverlay>
      ) : null}
    </div>
  );
}

// --- LIVE WINDOW ---
function LiveWindow({ channel, programme, videoUrl, onPlaybackError }) {
  const hue = ((channel?.num || 0) * 27) % 360;
  const previewWidth = 768;
  const previewHeight = FRAME_HEIGHT;
  const safeInsetX = 20;
  const safeInsetTop = 12;
  const safeInsetBottom = 18;
  const previewRegionHeight = TOP_TOTAL_HEIGHT;
  const scale = previewRegionHeight / previewHeight;
  const scaledWidth = previewWidth * scale;
  const offsetX = (RIGHT_PANEL_WIDTH - scaledWidth) / 2;
  const [videoFailed, setVideoFailed] = useState(false);
  const [cropToFourThree, setCropToFourThree] = useState(false);
  const videoRef = useRef(null);
  const errorReportedRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    const logPrefix = `[preview ${channel?.num ?? "--"}]`;
    const logPlaybackError = (...args) => {
      console.error(logPrefix, ...args);
    };

    errorReportedRef.current = false;
    if (!video || !videoUrl) {
      console.error(logPrefix, "Preview setup aborted", {
        hasVideoElement: Boolean(video),
        videoUrl,
      });
      setVideoFailed(true);
      if (onPlaybackError) {
        onPlaybackError();
      }
      return undefined;
    }

    const isHlsSource = /\.m3u8(?:$|\?)/i.test(videoUrl);
    const isTsSource = /\.ts(?:$|\?)/i.test(videoUrl) || /\/proxy\/ts\//i.test(videoUrl);
    const isNativeHlsSource = isHlsSource && video.canPlayType("application/vnd.apple.mpegurl");
    const useNativeErrorEvents = !isTsSource && (!isHlsSource || isNativeHlsSource);
    let hls = null;
    let mpegtsPlayer = null;
    let cancelled = false;
    let retryCount = 0;
    const attemptPlayback = async () => {
      try {
        await video.play();
      } catch (error) {
        if (error?.name === "NotAllowedError" && !video.muted) {
          console.warn(logPrefix, "Autoplay with sound was blocked; retrying muted playback");
          video.muted = true;
          await video.play();
          return;
        }

        logPlaybackError("Playback start failed", error);
        throw error;
      }
    };
    const reportPlaybackError = () => {
      setVideoFailed(true);
      if (!errorReportedRef.current && onPlaybackError) {
        errorReportedRef.current = true;
        onPlaybackError();
      }
    };
    const handleLoadedMetadata = () => {
      const sourceAspect = video.videoWidth && video.videoHeight
        ? video.videoWidth / video.videoHeight
        : 0;
      setCropToFourThree(sourceAspect > (4 / 3) + 0.02);
    };
    const handleNativeError = () => {
      const mediaError = video.error
        ? {
            code: video.error.code,
            message: video.error.message,
          }
        : null;
      logPlaybackError("Native media element error", mediaError);
      reportPlaybackError();
    };

    setVideoFailed(false);
    setCropToFourThree(false);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    if (useNativeErrorEvents) {
      video.addEventListener("error", handleNativeError);
    }

    async function attachPlayer() {
      if (isHlsSource) {
        if (isNativeHlsSource) {
          video.src = videoUrl;
          attemptPlayback().catch(reportPlaybackError);
          return;
        }

        const { default: Hls } = await import("hls.js");
        if (cancelled) {
          return;
        }

        if (!Hls.isSupported()) {
          logPlaybackError("hls.js is not supported in this browser");
          setVideoFailed(true);
          return;
        }

        hls = new Hls();
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          attemptPlayback().catch(reportPlaybackError);
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          logPlaybackError("hls.js error", data);
          if (data.fatal) {
            reportPlaybackError();
          }
        });
        return;
      }

      if (isTsSource) {
        const { default: mpegts } = await import("mpegts.js");
        if (cancelled) {
          return;
        }

        if (!mpegts.getFeatureList().mseLivePlayback) {
          logPlaybackError("mpegts.js live MSE playback is not supported in this browser", mpegts.getFeatureList());
          setVideoFailed(true);
          return;
        }

        mpegtsPlayer = mpegts.createPlayer({
          type: "mpegts",
          isLive: true,
          liveBufferLatencyChasing: true,
          liveBufferLatencyMaxLatency: 3,
          liveBufferLatencyMinRemain: 0.5,
          lazyLoad: false,
          url: videoUrl,
        });
        mpegtsPlayer.attachMediaElement(video);
        mpegtsPlayer.on(mpegts.Events.ERROR, (errorType, errorDetail, errorInfo) => {
          logPlaybackError("mpegts.js error", {
            errorType,
            errorDetail,
            errorInfo,
          });
          if (retryCount < 1 && !cancelled) {
            retryCount += 1;
            mpegtsPlayer.unload();
            mpegtsPlayer.load();
            attemptPlayback().catch(reportPlaybackError);
            return;
          }
          reportPlaybackError();
        });
        mpegtsPlayer.load();
        attemptPlayback().catch(reportPlaybackError);
        return;
      }

      video.src = videoUrl;
      attemptPlayback().catch(reportPlaybackError);
    }

    attachPlayer().catch(() => {
      logPlaybackError("attachPlayer threw unexpectedly");
      reportPlaybackError();
    });

    return () => {
      cancelled = true;
      if (hls) {
        hls.destroy();
      }
      if (mpegtsPlayer) {
        mpegtsPlayer.destroy();
      }
      if (video) {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        if (useNativeErrorEvents) {
          video.removeEventListener("error", handleNativeError);
        }
        video.pause();
        video.removeAttribute("src");
      }
    };
  }, [videoUrl, onPlaybackError]);

  return (
    <div style={{
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      background: "#12070d",
    }}>
      <div style={{
        position: "absolute",
        left: `${offsetX}px`,
        top: "0",
        width: `${previewWidth}px`,
        height: `${previewHeight}px`,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        overflow: "hidden",
        background: "#000000",
      }}>
        <div style={{
          position: "absolute",
          left: `${safeInsetX}px`,
          top: `${safeInsetTop}px`,
          right: `${safeInsetX}px`,
          bottom: `${safeInsetBottom}px`,
          overflow: "hidden",
          background: `linear-gradient(180deg, hsl(${hue} 40% 24%), hsl(${(hue + 35) % 360} 34% 14%))`,
        }}>
          <video
            ref={videoRef}
            autoPlay
            muted={APP_CONFIG.previewMuted}
            loop
            playsInline
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: cropToFourThree ? "cover" : "contain",
              objectPosition: "center",
              background: "#000000",
              filter: "brightness(0.9) contrast(0.95)",
              opacity: videoFailed || !videoUrl ? 0 : 1,
            }}
          />
          {videoFailed || !videoUrl ? (
            <>
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(255,255,255,0.08), transparent 18%, transparent 82%, rgba(0,0,0,0.18))",
            }} />
            <div style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(circle at 24% 28%, hsla(${(hue + 60) % 360} 90% 68% / 0.55), transparent 16%), radial-gradient(circle at 67% 40%, hsla(${(hue + 150) % 360} 80% 60% / 0.35), transparent 24%), radial-gradient(circle at 56% 72%, rgba(255,255,255,0.18), transparent 22%)`,
            }} />
            <div style={{
              position: "absolute",
              left: "8%",
              bottom: "6%",
              width: "34%",
              height: "62%",
              borderRadius: "38% 38% 42% 42% / 22% 22% 36% 36%",
              background: "linear-gradient(180deg, rgba(74,40,20,0.95), rgba(34,18,9,0.98))",
              boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.06)",
            }} />
            <div style={{
              position: "absolute",
              left: "22%",
              top: "12%",
              width: "30%",
              height: "60%",
              borderRadius: "46% 46% 42% 42% / 28% 28% 34% 34%",
              background: "linear-gradient(180deg, rgba(204,168,138,0.92), rgba(116,84,63,0.98))",
              transform: "rotate(-5deg)",
            }} />
            <div style={{
              position: "absolute",
              left: "26%",
              top: "12%",
              width: "20%",
              height: "16%",
              borderRadius: "10px 10px 4px 4px",
              background: `linear-gradient(180deg, hsl(${(hue + 92) % 360} 95% 70%), hsl(${(hue + 76) % 360} 92% 58%))`,
            }} />
            <div style={{
              position: "absolute",
              inset: 0,
              background: "repeating-linear-gradient(180deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 4px)",
              opacity: 0.24,
            }} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// --- CHANNEL LISTING ---
function ChannelListing({ entries, phase, buildProgress }) {
  const visible = getVisibleEntries(entries, 6);
  return (
    <div style={{ overflow: "hidden", height: "100%", background: IS_NYNEX ? "#06062a" : "#0a0a38" }}>
      <div style={{ padding: "0", height: "100%" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: `${START_COL_WIDTH}px` }} />
            <col />
          </colgroup>
          <tbody>
            {visible.map((entry, i) => {
              const isVisible = i < buildProgress;
              const label = `${pad(entry.num)} ${entry.channelName}`;

              return (
                <tr key={`${phase}-${entry.num}-${i}`} style={{
                  opacity: isVisible ? 1 : 0,
                  transition: `opacity 0.1s ease ${i * 0.05}s`,
                  background: i % 2 === 0 ? C_ROW_EVEN : C_ROW_ODD,
                  borderBottom: `2px solid ${C_BORDER}`,
                }}>
                  <td style={{
                    width: `${START_COL_WIDTH}px`,
                    padding: "1px 6px 1px 0",
                    verticalAlign: "top",
                    fontFamily: F_MAIN,
                    fontWeight: 700,
                    fontStyle: "italic",
                    fontSize: "26px",
                    lineHeight: 1.04,
                    letterSpacing: "-0.5px",
                    color: "#ffffff",
                    whiteSpace: "nowrap",
                    textAlign: "right",
                    borderRight: `2px solid ${C_BORDER}`,
                  }}>{entry.start}</td>
                  <td style={{
                    padding: "1px 0 1px 8px",
                    verticalAlign: "top",
                    fontFamily: F_MAIN,
                    fontWeight: 700,
                    fontStyle: "italic",
                    fontSize: "26px",
                    lineHeight: 1.04,
                    letterSpacing: "-0.5px",
                    color: "#ffffff",
                    textAlign: "left",
                  }}>
                    <span style={{ color: IS_NYNEX ? C_CHANNEL_PEACH : C_YELLOW, whiteSpace: "nowrap" }}>{label}</span>
                    <span style={{ fontWeight: 400 }}> {entry.title}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- MAIN ---
export default function RetroCableGuide() {
  const [now, setNow] = useState(new Date());
  const [previewIndex, setPreviewIndex] = useState(0);
  const [promoIndex, setPromoIndex] = useState(0);
  const [listingPhase, setListingPhase] = useState("now");
  const [buildProgress, setBuildProgress] = useState(0);
  const [listingEntries, setListingEntries] = useState([]);
  const [listingPageIndex, setListingPageIndex] = useState(0);
  const [channels, setChannels] = useState([]);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Guide data
  useEffect(() => {
    let cancelled = false;

    async function refreshGuide() {
      const payload = await loadGuideData();
      if (cancelled || !payload?.channels?.length) {
        return;
      }

      setChannels(payload.channels);
      setPreviewIndex((prev) => Math.min(prev, payload.channels.length - 1));
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

  const previewChannels = APP_CONFIG.previewChannels?.length
    ? channels.filter((channel) => APP_CONFIG.previewChannels.includes(channel.num) && channel.streamUrl)
    : channels.filter((channel) => channel.streamUrl);
  const previewChannelKey = previewChannels.map((channel) => channel.num).join(",");
  const fixedPreviewChannel = APP_CONFIG.previewFixedChannel != null
    ? previewChannels.find((channel) => channel.num === APP_CONFIG.previewFixedChannel) || previewChannels[0] || null
    : previewChannels[0] || null;

  // Now On rotation
  useEffect(() => {
    if (APP_CONFIG.previewInfoMode !== "rotate" || previewChannels.length <= 1) {
      return undefined;
    }

    const t = setInterval(() => {
      setPreviewIndex(prev => (prev + 1) % previewChannels.length);
    }, (APP_CONFIG.previewCycleSeconds || 30) * 1000);
    return () => clearInterval(t);
  }, [previewChannelKey]);

  // Promo rotation
  useEffect(() => {
    if (!SHOW_PROMOS || PROMOS.length <= 1) {
      return undefined;
    }

    const t = setInterval(() => {
      setPromoIndex(prev => (prev + 1) % PROMOS.length);
    }, (APP_CONFIG.previewCycleSeconds || 30) * 1000);
    return () => clearInterval(t);
  }, []);

  // Build listing entries
  const buildEntries = useCallback((phase) => {
    return channels.map(ch => {
      const progIndex = phase === "now" ? 0 : Math.min(1, ch.programmes.length - 1);
      const prog = ch.programmes[progIndex];
      return { num: ch.num, channelName: ch.name, logoUrl: ch.logoUrl, start: prog.start, title: prog.title };
    });
  }, [channels]);

  // Listing cycle
  useEffect(() => {
    const entries = buildEntries(listingPhase);
    const pages = splitEntriesIntoPages(entries, 6);
    const pageIndex = listingPageIndex % pages.length;
    const pageEntries = pages[pageIndex];

    setListingEntries(pageEntries);
    setBuildProgress(0);

    let line = 0;
    const buildInterval = setInterval(() => {
      line++;
      setBuildProgress(line);
      if (line >= pageEntries.length) clearInterval(buildInterval);
    }, 100);

    const holdTimeout = setTimeout(() => {
      setBuildProgress(0);
      setTimeout(() => {
        setListingPageIndex((prev) => (prev + 1) % pages.length);
        setListingPhase(prev => prev === "now" ? "next" : "now");
      }, 500);
    }, 10000);

    return () => {
      clearInterval(buildInterval);
      clearTimeout(holdTimeout);
    };
  }, [listingPhase, listingPageIndex, buildEntries]);

  const infoChannel = APP_CONFIG.previewInfoMode === "rotate"
    ? previewChannels[previewIndex] || previewChannels[0] || null
    : fixedPreviewChannel;
  const videoChannel = APP_CONFIG.previewVideoMode === "channel"
    ? (APP_CONFIG.previewInfoMode === "rotate"
        ? previewChannels[previewIndex] || previewChannels[0] || null
        : fixedPreviewChannel)
    : null;
  const currentProg = infoChannel?.programmes?.[0] || { title: "Schedule unavailable" };
  const previewVideoUrl = APP_CONFIG.previewVideoMode === "url"
    ? APP_CONFIG.previewVideoUrl || ""
    : videoChannel?.streamUrl || "";
  return (
    <div style={{
      width: "720px",
      height: "576px",
      margin: "0 auto",
      background: "#0a0a2e",
      position: "relative",
      overflow: "hidden",
    }}>
    <div style={{
      width: "720px",
      height: "576px",
      transform: `scale(${TITLE_SAFE_SCALE})`,
      transformOrigin: "center center",
      display: "grid",
      gridTemplateColumns: `${START_COL_WIDTH}px ${LEFT_CHANNEL_WIDTH}px ${NOW_HEADER_WIDTH}px ${TELE_TEXT_WIDTH}px`,
      gridTemplateRows: `${TOP_TEXT_HEIGHT}px ${CALENDAR_ROW_HEIGHT}px ${HEADER_HEIGHT}px ${BODY_HEIGHT}px`,
      textShadow: TEXT_OUTLINE,
    }}>
      <div style={{
        gridColumn: "1 / 3",
        gridRow: "1 / 2",
        background: C_DEEP_BLUE,
        borderRight: "2px solid #2a3578",
        borderBottom: "2px solid #0f1a50",
      }}>
        <NowOnPanel channel={infoChannel} programme={currentProg.title} />
      </div>

      <div style={{
        gridColumn: "3 / 5",
        gridRow: "1 / 3",
        position: "relative",
        overflow: "hidden",
        background: SHOW_PROMOS ? C_DEEP_BLUE : "#1a0000",
        borderBottom: "2px solid #2a3578",
      }}>
        {SHOW_PROMOS ? (
          <PromoPanel promoIndex={promoIndex} />
        ) : (
          <LiveWindow
            channel={videoChannel || infoChannel}
            programme={currentProg.title}
            videoUrl={previewVideoUrl}
          />
        )}
      </div>

      <div style={{
        gridColumn: "1 / 2",
        gridRow: "2 / 3",
        background: C_DEEP_BLUE,
        padding: "1px 3px 3px 4px",
        borderRight: "2px solid #0f1a50",
        borderBottom: "2px solid #2a3578",
      }}>
        <CalendarBadge date={now} />
      </div>

      <div style={{
        gridColumn: "2 / 3",
        gridRow: "2 / 3",
        background: C_DEEP_BLUE,
        padding: "1px 4px 3px 3px",
        borderRight: "2px solid #2a3578",
        borderBottom: "2px solid #2a3578",
      }}>
        <GuideLogo />
      </div>

      <div style={{
        gridColumn: "1 / 2",
        gridRow: "3 / 4",
        background: C_DARK_HEADER,
        borderTop: "2px solid #4a6090",
        borderRight: "2px solid #4a6090",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: "4px",
        fontFamily: F_UI,
        fontWeight: 900,
        fontSize: "18px",
        letterSpacing: "-0.5px",
        color: "#ffffff",
      }}>START</div>

      <div style={{
        gridColumn: "2 / 3",
        gridRow: "3 / 4",
        background: C_DARK_HEADER,
        borderTop: "2px solid #4a6090",
        borderRight: "2px solid #4a6090",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: F_UI,
        fontWeight: 900,
        fontSize: "18px",
        letterSpacing: "-0.5px",
        color: "#ffffff",
      }}>CHANNEL</div>

      <div style={{
        gridColumn: "3 / 4",
        gridRow: "3 / 4",
        background: C_DARK_HEADER,
        borderTop: "2px solid #4a6090",
        borderRight: "2px solid #4a6090",
        display: "flex",
        alignItems: "center",
        justifyContent: IS_NYNEX ? "center" : "space-between",
        padding: "0 8px",
        fontFamily: F_UI,
        fontWeight: 900,
        fontSize: "18px",
        letterSpacing: "-0.5px",
      }}>
        {IS_NYNEX ? (
          <span style={{ color: C_YELLOW }}>{listingPhase === "now" ? "NOW" : "NEXT"}</span>
        ) : (
          <>
            <span style={{ color: listingPhase === "now" ? C_YELLOW : "#6878a0" }}>NOW</span>
            <span style={{ color: listingPhase === "next" ? C_YELLOW : "#6878a0" }}>NEXT</span>
          </>
        )}
      </div>

      <div style={{
        gridColumn: "4 / 5",
        gridRow: "3 / 4",
        background: C_DARK_HEADER,
        borderTop: "2px solid #4a6090",
        display: "flex",
        alignItems: "center",
        paddingLeft: "8px",
        fontFamily: IS_NYNEX ? F_TELETEXT : F_UI,
        fontWeight: IS_NYNEX ? 400 : 900,
        fontStyle: IS_NYNEX ? "italic" : "normal",
        fontSize: IS_NYNEX ? "16px" : "17px",
        letterSpacing: IS_NYNEX ? "0.2px" : "-0.5px",
        color: IS_NYNEX ? "#d8d4c8" : C_YELLOW,
        ...ONE_LINE,
      }}>{APP_CONFIG.headerTagline || ""}</div>

      <div style={{
        gridColumn: "1 / 5",
        gridRow: "4 / 5",
        overflow: "hidden",
      }}>
        <ChannelListing entries={listingEntries} phase={listingPhase} buildProgress={buildProgress} />
      </div>

      <CrtOverlay />
    </div>
    </div>
  );
}

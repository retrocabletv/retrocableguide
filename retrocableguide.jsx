import { useState, useEffect, useCallback, useRef } from "react";
import { APP_CONFIG } from "./src/config.js";
import { loadGuideData } from "./src/guide/client.js";

const F_MAIN = "Arial, Helvetica, sans-serif";
const F_CONDENSED = "'Arial Narrow', Arial, Helvetica, sans-serif";
const F_UI = "Futura, 'Futura PT', 'Century Gothic', Arial, sans-serif";
const FRAME_WIDTH = 720;
const FRAME_HEIGHT = 576;
const LEFT_PANEL_WIDTH = 287;
const RIGHT_PANEL_WIDTH = FRAME_WIDTH - LEFT_PANEL_WIDTH;
const TOP_TOTAL_HEIGHT = Math.round(RIGHT_PANEL_WIDTH * 3 / 4);
const TOP_TEXT_HEIGHT = 210;
const CALENDAR_ROW_HEIGHT = TOP_TOTAL_HEIGHT - TOP_TEXT_HEIGHT;
const HEADER_HEIGHT = 42;
const BODY_HEIGHT = FRAME_HEIGHT - TOP_TOTAL_HEIGHT - HEADER_HEIGHT;
const LISTING_SIDE_PADDING = 14;
const START_COL_WIDTH = 118;
const LEFT_CHANNEL_WIDTH = LEFT_PANEL_WIDTH - START_COL_WIDTH;
const NOW_HEADER_WIDTH = 148;
const TELE_TEXT_WIDTH = FRAME_WIDTH - LEFT_PANEL_WIDTH - NOW_HEADER_WIDTH;
const BODY_TEXT_WIDTH = FRAME_WIDTH - START_COL_WIDTH - 14;

const PROMOS = [
  {
    title: "Unique To NYNEX Customers",
    lines: ["USE YOUR REMOTE", "CONTROL AND YOU WILL", ""],
    highlight: "ONLY BE CHARGED",
    price: "£9.95",
    footer: "Details on Channel 51",
  },
  {
    title: "NYNEX Pay Per View",
    lines: ["SATURDAY NIGHT", "BIG FIGHT LIVE", ""],
    highlight: "EXCLUSIVE TO CABLE",
    price: "£14.95",
    footer: "Order on Channel 51",
  },
  {
    title: "NYNEX Local Channels",
    lines: ["YOUR LOCAL NEWS", "AND INFORMATION", ""],
    highlight: "ONLY ON CABLE",
    price: "",
    footer: "Channel 52",
  },
  {
    title: "Free Installation",
    lines: ["TELL YOUR", "FRIENDS ABOUT", "NYNEX CABLE"],
    highlight: "AND RECEIVE",
    price: "1 MONTH",
    price2: "FREE",
    footer: "Call 0800 000 CABLE",
  },
];

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

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

  ctx.font = "italic 700 26px Arial";
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
  const day = DAYS[date.getDay()];
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
      <div style={{
        position: "absolute",
        top: "18px",
        left: 0,
        right: 0,
        color: "#2d1800",
        fontFamily: "'Bodoni 72', 'Didot', 'Times New Roman', serif",
        fontWeight: 900,
        fontSize: "10px",
        letterSpacing: "0px",
        textAlign: "center",
        lineHeight: 1,
        textTransform: "uppercase",
      }}>{day}</div>
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
      }}>{dateNum}</div>
      <div style={{
        position: "absolute",
        bottom: "7px",
        left: 0,
        right: 0,
        fontFamily: F_UI,
        fontWeight: 700,
        fontSize: "24px",
        color: "#221100",
        lineHeight: 1,
        letterSpacing: "-0.7px",
        textAlign: "center",
      }}>{h}:{m}</div>
    </div>
  );
}

function GuideLogo() {
  return (
    <div style={{
      background: "#edf1f8",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0",
      boxShadow: "2px 2px 0px #000",
      border: "1px solid #1f285f",
      position: "relative",
      overflow: "hidden",
      width: "100%",
      height: `${CALENDAR_ROW_HEIGHT - 10}px`,
    }}>
      <img
        src={APP_CONFIG.guideLogoUrl}
        alt="Alex Channel Guide"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    </div>
  );
}

// --- NOW ON PANEL ---
function NowOnPanel({ channel, programme }) {
  const channelNumber = channel ? `Ch. ${channel.num}` : "Ch. --";
  const logoUrl = channel?.logoUrl || "";
  const channelName = channel?.name || "No preview";

  return (
    <div style={{ padding: "12px 16px 6px 16px", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
        <div style={{
          fontFamily: F_UI,
          fontWeight: 900,
          color: "#ffffff",
          lineHeight: 0.95,
          width: "104px",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          gap: "4px",
          marginTop: "8px",
          textAlign: "left",
        }}>
          <div style={{ fontSize: "20px", fontStyle: "normal" }}>Now on</div>
          <div style={{ fontSize: "28px", fontStyle: "normal", whiteSpace: "nowrap" }}>{channelNumber}</div>
        </div>
        <div style={{
          width: "104px",
          height: "70px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <ChannelLogo logoUrl={logoUrl} alt={channelName} size={64} />
        </div>
      </div>
      <div style={{
        fontFamily: F_UI,
        fontWeight: 700,
        fontStyle: "normal",
        fontSize: "24px",
        color: "#ffffff",
        marginTop: "8px",
        textAlign: "center",
        lineHeight: 1.05,
      }}>{programme}</div>
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
    <div style={{ overflow: "hidden", height: "100%", background: "#0a0a44" }}>
      <div style={{ padding: "6px 0 1px 0", height: "100%" }}>
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
                  background: i % 2 === 0 ? "#0c0c4a" : "#14146a",
                }}>
                  <td style={{
                    width: `${START_COL_WIDTH}px`,
                    padding: "0 12px 0 0",
                    verticalAlign: "top",
                    fontFamily: F_MAIN,
                    fontWeight: 700,
                    fontStyle: "italic",
                    fontSize: "26px",
                    lineHeight: 1.16,
                    color: "#ffffff",
                    whiteSpace: "nowrap",
                    textAlign: "right",
                    borderRight: "2px solid #6079ad",
                  }}>{entry.start}</td>
                  <td style={{
                    padding: "0 0 0 14px",
                    verticalAlign: "top",
                    fontFamily: F_MAIN,
                    fontWeight: 700,
                    fontStyle: "italic",
                    fontSize: "26px",
                    lineHeight: 1.16,
                    color: "#ffffff",
                    textAlign: "left",
                  }}>
                    <span style={{ color: "#ffff00", whiteSpace: "nowrap" }}>{label}</span>
                    <span> {entry.title}</span>
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

  // Now On rotation
  useEffect(() => {
    if (previewChannels.length <= 1) {
      return undefined;
    }

    const t = setInterval(() => {
      setPreviewIndex(prev => (prev + 1) % previewChannels.length);
    }, (APP_CONFIG.previewCycleSeconds || 30) * 1000);
    return () => clearInterval(t);
  }, [previewChannelKey]);

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

  const currentChannel = previewChannels[previewIndex] || previewChannels[0] || null;
  const currentProg = currentChannel?.programmes?.[0] || { title: "Schedule unavailable" };
  const previewVideoUrl = APP_CONFIG.previewVideoUrl || currentChannel?.streamUrl || "";
  return (
    <div style={{
      width: "720px",
      height: "576px",
      margin: "0 auto",
      background: "#000033",
      position: "relative",
      overflow: "hidden",
      display: "grid",
      gridTemplateColumns: `${START_COL_WIDTH}px ${LEFT_CHANNEL_WIDTH}px ${NOW_HEADER_WIDTH}px ${TELE_TEXT_WIDTH}px`,
      gridTemplateRows: `${TOP_TEXT_HEIGHT}px ${CALENDAR_ROW_HEIGHT}px ${HEADER_HEIGHT}px ${BODY_HEIGHT}px`,
    }}>
      <div style={{
        gridColumn: "1 / 3",
        gridRow: "1 / 2",
        background: "#000066",
        borderRight: "3px solid #ffffff",
        borderBottom: "2px solid #0f1a63",
      }}>
        <NowOnPanel channel={currentChannel} programme={currentProg.title} />
      </div>

      <div style={{
        gridColumn: "3 / 5",
        gridRow: "1 / 3",
        position: "relative",
        overflow: "hidden",
        background: "#1a0000",
        borderBottom: "3px solid #ffffff",
      }}>
        <LiveWindow
          channel={currentChannel}
          programme={currentProg.title}
          videoUrl={previewVideoUrl}
        />
      </div>

      <div style={{
        gridColumn: "1 / 2",
        gridRow: "2 / 3",
        background: "#000066",
        padding: "1px 3px 3px 4px",
        borderRight: "2px solid #0f1a63",
        borderBottom: "3px solid #ffffff",
      }}>
        <CalendarBadge date={now} />
      </div>

      <div style={{
        gridColumn: "2 / 3",
        gridRow: "2 / 3",
        background: "#000066",
        padding: "1px 4px 3px 3px",
        borderRight: "3px solid #ffffff",
        borderBottom: "3px solid #ffffff",
      }}>
        <GuideLogo />
      </div>

      <div style={{
        gridColumn: "1 / 2",
        gridRow: "3 / 4",
        background: "#7594c8",
        borderRight: "2px solid #6079ad",
        borderBottom: "3px solid #ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: F_UI,
        fontWeight: 900,
        fontSize: "18px",
        color: "#ffffff",
      }}>START</div>

      <div style={{
        gridColumn: "2 / 3",
        gridRow: "3 / 4",
        background: "#6788c4",
        borderRight: "2px solid #6079ad",
        borderBottom: "3px solid #ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: F_UI,
        fontWeight: 900,
        fontSize: "18px",
        color: "#ffffff",
      }}>CHANNEL</div>

      <div style={{
        gridColumn: "3 / 4",
        gridRow: "3 / 4",
        background: "#1b3d86",
        borderBottom: "3px solid #ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 10px",
        fontFamily: F_UI,
        fontWeight: 900,
        fontSize: "18px",
      }}>
        <span style={{ color: listingPhase === "next" ? "#ffff00" : "#203468", textAlign: "left" }}>NOW</span>
        <span style={{ color: listingPhase === "now" ? "#ffff00" : "#203468", textAlign: "right" }}>NEXT</span>
      </div>

      <div style={{
        gridColumn: "4 / 5",
        gridRow: "3 / 4",
        background: "#1917af",
        borderBottom: "3px solid #ffffff",
        display: "flex",
        alignItems: "center",
        paddingLeft: "12px",
        fontFamily: F_UI,
        fontWeight: 900,
        fontSize: "18px",
        color: "#ffff00",
        ...ONE_LINE,
      }}>Full listings on teletext</div>

      <div style={{
        gridColumn: "1 / 5",
        gridRow: "4 / 5",
        overflow: "hidden",
      }}>
        <ChannelListing entries={listingEntries} phase={listingPhase} buildProgress={buildProgress} />
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";

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

// --- DATA ---
const CHANNELS = [
  { num: 1, name: "Sky One", programmes: [
    { start: "6:00", title: "Batfink" },
    { start: "6:30", title: "DJ Kat Show" },
    { start: "9:25", title: "Hercules: The Legendary Journeys" },
    { start: "10:15", title: "Xena: Warrior Princess" },
  ]},
  { num: 2, name: "Sky 2", programmes: [
    { start: "6:00", title: "Shop on the Box" },
    { start: "9:00", title: "Sally Jessy Raphael" },
    { start: "10:00", title: "Oprah Winfrey" },
  ]},
  { num: 3, name: "UK Gold", programmes: [
    { start: "6:00", title: "Open All Hours" },
    { start: "6:30", title: "Are You Being Served?" },
    { start: "7:00", title: "Keeping Up Appearances" },
    { start: "7:30", title: "Last of the Summer Wine" },
  ]},
  { num: 5, name: "UK Living", programmes: [
    { start: "6:00", title: "Infomercial" },
    { start: "7:00", title: "Good Morning with Anne and Nick" },
    { start: "9:00", title: "Supermarket Sweep" },
  ]},
  { num: 6, name: "Sky News", programmes: [
    { start: "6:00", title: "Sky News Sunrise" },
    { start: "9:00", title: "Sky News at Nine" },
    { start: "10:00", title: "Sky News at Ten" },
  ]},
  { num: 7, name: "CNN", programmes: [
    { start: "7:00", title: "CNN World News" },
    { start: "8:00", title: "CNN Moneyline" },
    { start: "9:00", title: "CNN Newsnight" },
  ]},
  { num: 8, name: "Euronews", programmes: [
    { start: "7:00", title: "News Bulletin" },
    { start: "8:00", title: "Euronews Magazine" },
    { start: "9:00", title: "World Business Report" },
  ]},
  { num: 9, name: "EBN", programmes: [
    { start: "7:00", title: "EBN Breakfast: Focus Europe / Focus Asia" },
    { start: "9:00", title: "Business Day" },
    { start: "10:00", title: "Markets in Motion" },
  ]},
  { num: 10, name: "NCTV", programmes: [
    { start: "7:00", title: "ScreenScene" },
    { start: "8:00", title: "The Wire" },
    { start: "9:00", title: "Local News" },
  ]},
  { num: 11, name: "Nick", programmes: [
    { start: "7:00", title: "Teenage Mutant Hero Turtles" },
    { start: "7:30", title: "Rugrats" },
    { start: "8:00", title: "Hey Arnold!" },
  ]},
  { num: 12, name: "Eurosport", programmes: [
    { start: "7:30", title: "Mountain Bike: Grundig / UCI World Cup" },
    { start: "9:00", title: "Eurosport News" },
    { start: "9:30", title: "Tour de France Highlights" },
  ]},
  { num: 14, name: "Sky Sports 1", programmes: [
    { start: "7:00", title: "Gillette World Sport Special" },
    { start: "8:00", title: "Premier League Football Review" },
    { start: "9:00", title: "Ringside" },
  ]},
  { num: 15, name: "Sky Movies", programmes: [
    { start: "7:30", title: "Baby's Day Out (1994) Cert: PG" },
    { start: "9:15", title: "The Shawshank Redemption (1994) Cert: 15" },
    { start: "11:30", title: "Congo (1995) Cert: PG" },
  ]},
  { num: 25, name: "Ice", programmes: [
    { start: "6:30", title: "Iznogoud" },
    { start: "7:30", title: "Sci-Fi Knightmare" },
    { start: "9:00", title: "The Outer Limits" },
  ]},
];

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

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

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

  ctx.font = "italic 700 31px Arial";
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

function CalendarBadge({ date }) {
  const day = DAYS[date.getDay()];
  const dateNum = date.getDate();
  const h = pad(date.getHours());
  const m = pad(date.getMinutes());

  return (
    <div style={{
      background: "linear-gradient(180deg, #f4cf7a 0%, #e0ad48 45%, #d1962f 100%)",
      borderRadius: "10px 10px 8px 8px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      width: "100%",
      height: `${CALENDAR_ROW_HEIGHT - 10}px`,
      position: "relative",
      boxShadow: "2px 2px 0px #000",
      border: "2px solid #221200",
      overflow: "visible",
    }}>
      <div style={{
        position: "absolute",
        top: "-4px",
        left: "20px",
        width: "8px",
        height: "12px",
        background: "linear-gradient(180deg, #f2f2f2 0%, #cfcfcf 100%)",
        borderRadius: "4px",
        border: "1px solid #3a3a3a",
        boxShadow: "1px 1px 0 #000",
      }} />
      <div style={{
        position: "absolute",
        top: "-4px",
        right: "20px",
        width: "8px",
        height: "12px",
        background: "linear-gradient(180deg, #f2f2f2 0%, #cfcfcf 100%)",
        borderRadius: "4px",
        border: "1px solid #3a3a3a",
        boxShadow: "1px 1px 0 #000",
      }} />
      <div style={{
        position: "absolute",
        top: "-1px",
        left: "21px",
        width: "6px",
        height: "6px",
        background: "#3a2204",
        borderRadius: "50%",
      }} />
      <div style={{
        position: "absolute",
        top: "-1px",
        right: "21px",
        width: "6px",
        height: "6px",
        background: "#3a2204",
        borderRadius: "50%",
      }} />
      <div style={{
        color: "#4b2c00",
        fontFamily: F_UI,
        fontWeight: 900,
        fontSize: "10px",
        letterSpacing: "0.5px",
        padding: "5px 6px 0 6px",
        width: "100%",
        textAlign: "center",
      }}>{day}</div>
      <div style={{
        fontFamily: F_UI,
        fontWeight: 900,
        fontSize: "40px",
        color: "#160d02",
        lineHeight: 0.9,
        marginTop: "1px",
        textShadow: "1px 1px 0 #6d4812",
      }}>{dateNum}</div>
      <div style={{
        fontFamily: F_UI,
        fontWeight: 900,
        fontSize: "16px",
        color: "#160d02",
        lineHeight: 1,
        marginTop: "1px",
      }}>{h}:{m}</div>
    </div>
  );
}

function GuideLogo() {
  return (
    <div style={{
      background: "#edf1f8",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "4px 12px",
      boxShadow: "2px 2px 0px #000",
      border: "1px solid #1f285f",
      position: "relative",
      overflow: "hidden",
      width: "100%",
      height: `${CALENDAR_ROW_HEIGHT - 10}px`,
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        background: "repeating-linear-gradient(-25deg, rgba(44,68,150,0.14) 0 9px, transparent 9px 22px)",
        opacity: 0.85,
      }} />
      <div style={{
        position: "absolute",
        left: "18%",
        bottom: "10%",
        fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
        fontSize: "20px",
        fontWeight: 700,
        color: "#171717",
        transform: "rotate(-10deg)",
        opacity: 0.95,
      }}>channel</div>
      <div style={{
        position: "absolute",
        left: "29%",
        bottom: "-1%",
        fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
        fontSize: "30px",
        fontWeight: 700,
        color: "#101010",
        transform: "rotate(-9deg)",
        opacity: 0.98,
      }}>Guide</div>
      <div style={{
        fontFamily: F_UI,
        fontWeight: 900,
        fontSize: "21px",
        color: "#26359a",
        letterSpacing: "0.5px",
        lineHeight: 1,
        position: "relative",
      }}>ALE<span style={{ color: "#cc2222" }}>X</span></div>
      <div style={{
        fontFamily: F_UI,
        fontStyle: "italic",
        fontWeight: 700,
        fontSize: "16px",
        color: "#24339b",
        lineHeight: 1,
        position: "relative",
        opacity: 0,
      }}>Channel</div>
      <div style={{
        fontFamily: F_UI,
        fontStyle: "italic",
        fontWeight: 700,
        fontSize: "17px",
        color: "#24339b",
        lineHeight: 1,
        position: "relative",
        opacity: 0,
      }}>Guide</div>
    </div>
  );
}

// --- NOW ON PANEL ---
function NowOnPanel({ channel, programme }) {
  return (
    <div style={{ padding: "14px 16px 6px 16px", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "2px" }}>
        <div style={{
          fontFamily: F_UI,
          fontWeight: 900,
          color: "#ffffff",
          lineHeight: 0.95,
          width: "96px",
          flexShrink: 0,
        }}>
          <div style={{ fontSize: "20px" }}>Now on</div>
          <div style={{ fontSize: "28px" }}>Ch. {channel.num}</div>
        </div>
        <div style={{
          fontFamily: F_UI,
          fontWeight: 900,
          fontSize: "32px",
          color: "#ff4444",
          lineHeight: 1,
          letterSpacing: "0px",
          textShadow: "2px 2px 0px #000000",
          flex: 1,
          ...ONE_LINE,
        }}>{channel.name}</div>
      </div>
      <div style={{
        fontFamily: F_UI,
        fontWeight: 700,
        fontStyle: "normal",
        fontSize: "20px",
        color: "#ffffff",
        marginTop: "12px",
        textAlign: "center",
        lineHeight: 1.05,
      }}>{programme}</div>
    </div>
  );
}

// --- LIVE WINDOW ---
function LiveWindow({ channel, programme }) {
  const hue = (channel.num * 27) % 360;
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
          {!videoFailed ? (
            <video
              src="/video.mp4"
              autoPlay
              muted
              loop
              playsInline
              onError={() => setVideoFailed(true)}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
                objectPosition: "center",
                background: "#000000",
              }}
            />
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}

// --- CHANNEL LISTING ---
function ChannelListing({ entries, phase, buildProgress }) {
  const visible = getVisibleEntries(entries, 6);
  return (
    <div style={{ overflow: "hidden", height: "100%", background: "#000066" }}>
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
                    <span style={{ color: "#ffff00", whiteSpace: "nowrap" }}>{label} </span>
                    <span>{entry.title}</span>
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
export default function NynexEPG() {
  const [now, setNow] = useState(new Date());
  const [nowOnIndex, setNowOnIndex] = useState(0);
  const [listingPhase, setListingPhase] = useState("now");
  const [buildProgress, setBuildProgress] = useState(0);
  const [listingEntries, setListingEntries] = useState([]);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Now On rotation
  useEffect(() => {
    const t = setInterval(() => {
      setNowOnIndex(prev => (prev + 1) % CHANNELS.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  // Build listing entries
  const buildEntries = useCallback((phase) => {
    return CHANNELS.map(ch => {
      const progIndex = phase === "now" ? 0 : Math.min(1, ch.programmes.length - 1);
      const prog = ch.programmes[progIndex];
      return { num: ch.num, channelName: ch.name, start: prog.start, title: prog.title };
    });
  }, []);

  // Listing cycle
  useEffect(() => {
    const entries = buildEntries(listingPhase);
    setListingEntries(entries);
    setBuildProgress(0);

    let line = 0;
    const buildInterval = setInterval(() => {
      line++;
      setBuildProgress(line);
      if (line >= entries.length) clearInterval(buildInterval);
    }, 100);

    const holdTimeout = setTimeout(() => {
      setBuildProgress(0);
      setTimeout(() => {
        setListingPhase(prev => prev === "now" ? "next" : "now");
      }, 500);
    }, 10000);

    return () => {
      clearInterval(buildInterval);
      clearTimeout(holdTimeout);
    };
  }, [listingPhase, buildEntries]);

  const currentChannel = CHANNELS[nowOnIndex];
  const currentProg = currentChannel.programmes[0];

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
        <LiveWindow channel={currentChannel} programme={currentProg.title} />
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

import { useEffect, useMemo, useState } from "react";
import {
  DEVICES,
  bestChargeWindow,
  chargeMinutes,
  cleanEvents,
  dailyTotals,
  formatDuration,
  formatHour,
  hourlyCoverage,
  averageDailyHours,
  sampleWeek,
  startOfDay,
  todayStats,
} from "./lib.js";

const STORE_KEY = "lightlog-events-v1";
const STARTED_KEY = "lightlog-started-v1";

function loadEvents() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function timeLabel(ts) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function dayLabel(ts) {
  return new Date(ts).toLocaleDateString([], { weekday: "short" });
}

export default function App() {
  const [tab, setTab] = useState("today");
  const [events, setEvents] = useState(loadEvents);
  const [started, setStarted] = useState(
    () => localStorage.getItem(STARTED_KEY) === "1"
  );
  const [now, setNow] = useState(() => Date.now());
  const [device, setDevice] = useState("phone");
  const [battery, setBattery] = useState(35);
  const [pastTime, setPastTime] = useState("");
  const [pastState, setPastState] = useState("on");

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(events));
  }, [events]);

  const stats = useMemo(() => todayStats(events, now), [events, now]);
  const coverage = useMemo(() => hourlyCoverage(events, now), [events, now]);
  const week = useMemo(() => dailyTotals(events, now, 7), [events, now]);
  const avgHours = useMemo(
    () => averageDailyHours(events, now, 7),
    [events, now]
  );
  const needMinutes = chargeMinutes(device, battery);
  const bestWindow = useMemo(
    () => bestChargeWindow(coverage, needMinutes, new Date(now).getHours()),
    [coverage, needMinutes, now]
  );

  const todayEvents = useMemo(() => {
    const dayStart = startOfDay(now);
    return cleanEvents(events)
      .filter((e) => e.t >= dayStart)
      .reverse();
  }, [events, now]);

  const bestHours = useMemo(() => {
    return coverage
      .map((c, h) => ({ h, c }))
      .filter((x) => x.c !== null && x.c >= 0.6)
      .sort((a, b) => b.c - a.c)
      .slice(0, 4)
      .sort((a, b) => a.h - b.h);
  }, [coverage]);

  function begin(withSample) {
    if (withSample) setEvents(sampleWeek(Date.now()));
    setStarted(true);
    localStorage.setItem(STARTED_KEY, "1");
  }

  function togglePower() {
    const next = stats.currentOn === true ? false : true;
    setEvents((prev) => cleanEvents([...prev, { t: Date.now(), on: next }]));
    setNow(Date.now());
  }

  function addPast() {
    if (!pastTime) return;
    const t = new Date(pastTime).getTime();
    if (Number.isNaN(t) || t > Date.now()) return;
    setEvents((prev) =>
      cleanEvents([...prev, { t, on: pastState === "on" }])
    );
    setPastTime("");
    setNow(Date.now());
  }

  function undoLast() {
    setEvents((prev) => {
      const cleaned = cleanEvents(prev);
      return cleaned.slice(0, -1);
    });
    setNow(Date.now());
  }

  function clearAll() {
    setEvents([]);
    setStarted(false);
    localStorage.removeItem(STARTED_KEY);
  }

  const sinceMinutes =
    stats.since !== null ? Math.round((now - stats.since) / 60000) : 0;

  return (
    <div className="wrap">
      <header className="topbar">
        <div className="brand">
          <div className="logo" aria-hidden="true">
            ⚡
          </div>
          <div>
            <h1>LightLog</h1>
            <p>Know when the light will come</p>
          </div>
        </div>
        <div className="clock">
          <strong>{timeLabel(now)}</strong>
          {new Date(now).toLocaleDateString([], {
            weekday: "long",
            day: "numeric",
            month: "short",
          })}
        </div>
      </header>

      {!started ? (
        <section className="card welcome">
          <div className="icon" aria-hidden="true">
            💡
          </div>
          <h2>Stop guessing when NEPA will bring light</h2>
          <p>
            LightLog tracks every time power comes and goes, learns the
            pattern for your area, and tells you the best time to charge
            your phone, laptop and power bank. Everything stays on your
            device, no account needed.
          </p>
          <div className="btn-row">
            <button className="btn" onClick={() => begin(true)}>
              Try it with a sample week
            </button>
            <button className="btn ghost" onClick={() => begin(false)}>
              Start fresh
            </button>
          </div>
        </section>
      ) : (
        <>
          <nav className="tabs" aria-label="Main">
            <button
              className={tab === "today" ? "active" : ""}
              onClick={() => setTab("today")}
            >
              Today
            </button>
            <button
              className={tab === "patterns" ? "active" : ""}
              onClick={() => setTab("patterns")}
            >
              Patterns
            </button>
            <button
              className={tab === "charge" ? "active" : ""}
              onClick={() => setTab("charge")}
            >
              Charge planner
            </button>
          </nav>

          {tab === "today" && (
            <>
              <section
                className={"hero " + (stats.currentOn ? "on" : "off")}
              >
                <div className="state">
                  <span
                    className={"dot " + (stats.currentOn ? "on" : "off")}
                  />
                  {stats.currentOn === null
                    ? "No log yet"
                    : stats.currentOn
                      ? "Light is on"
                      : "No light"}
                </div>
                <div className="big">
                  {stats.currentOn === null
                    ? "Tap below to start"
                    : formatDuration(sinceMinutes)}
                </div>
                <p className="since">
                  {stats.since !== null
                    ? (stats.currentOn ? "Came on at " : "Went off at ") +
                      timeLabel(stats.since)
                    : "Log the first change and LightLog starts learning."}
                </p>
                <div className="btn-row">
                  <button className="btn" onClick={togglePower}>
                    {stats.currentOn ? "Light just went off" : "Light just came on"}
                  </button>
                  {events.length > 0 && (
                    <button className="btn ghost" onClick={undoLast}>
                      Undo last log
                    </button>
                  )}
                </div>
              </section>

              <div className="tiles">
                <div className="tile">
                  <div className="num">{formatDuration(stats.onMinutes)}</div>
                  <div className="lbl">Light today so far</div>
                </div>
                <div className="tile">
                  <div className="num">
                    {formatDuration(stats.longestStretch)}
                  </div>
                  <div className="lbl">Longest stretch today</div>
                </div>
                <div className="tile">
                  <div className="num">{stats.changesToday}</div>
                  <div className="lbl">Changes logged today</div>
                </div>
              </div>

              <section className="card">
                <h2>Today's timeline</h2>
                <p className="sub">Every change you logged today, newest first.</p>
                {todayEvents.length === 0 ? (
                  <p className="note">
                    Nothing logged today yet. When the light changes, tap
                    the button above.
                  </p>
                ) : (
                  <ul className="timeline">
                    {todayEvents.map((e, i) => (
                      <li key={e.t + "-" + i}>
                        <span className={"tag " + (e.on ? "on" : "off")}>
                          {e.on ? "ON" : "OFF"}
                        </span>
                        {e.on ? "Light came on" : "Light went off"}
                        <span className="when">{timeLabel(e.t)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="card">
                <h2>Missed a change?</h2>
                <p className="sub">
                  If you noticed late, add the change with the time it
                  really happened.
                </p>
                <div className="form-grid">
                  <div>
                    <label className="field" htmlFor="past-time">
                      Date and time
                    </label>
                    <input
                      id="past-time"
                      type="datetime-local"
                      value={pastTime}
                      onChange={(e) => setPastTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="field" htmlFor="past-state">
                      What happened
                    </label>
                    <select
                      id="past-state"
                      value={pastState}
                      onChange={(e) => setPastState(e.target.value)}
                    >
                      <option value="on">Light came on</option>
                      <option value="off">Light went off</option>
                    </select>
                  </div>
                  <button className="btn ghost" onClick={addPast}>
                    Add it
                  </button>
                </div>
              </section>
            </>
          )}

          {tab === "patterns" && (
            <>
              <section className="card">
                <h2>When does light usually come?</h2>
                <p className="sub">
                  Each bar is one hour of the day. Taller means light is
                  more likely to be on at that hour, based on your logs.
                </p>
                <div className="heat" role="img" aria-label="Hourly light pattern chart">
                  {coverage.map((c, h) => (
                    <div
                      key={h}
                      className="bar"
                      title={
                        formatHour(h) +
                        ": " +
                        (c === null
                          ? "no data yet"
                          : Math.round(c * 100) + "% of the time")
                      }
                      style={{
                        height: c === null ? "4px" : Math.max(4, c * 100) + "%",
                        background:
                          c === null
                            ? "var(--panel-2)"
                            : `linear-gradient(180deg, rgba(255,176,32,${0.35 + c * 0.65}), rgba(255,107,74,${0.35 + c * 0.65}))`,
                      }}
                    />
                  ))}
                </div>
                <div className="heat-labels">
                  <span>12am</span>
                  <span>6am</span>
                  <span>12pm</span>
                  <span>6pm</span>
                  <span>11pm</span>
                </div>
                {bestHours.length > 0 ? (
                  <>
                    <p className="note" style={{ marginTop: 16 }}>
                      Your most reliable hours for light:
                    </p>
                    <div className="best-hours">
                      {bestHours.map((x) => (
                        <span className="chip" key={x.h}>
                          {formatHour(x.h)} - {Math.round(x.c * 100)}%
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="note" style={{ marginTop: 16 }}>
                    Keep logging for a few days and your reliable hours
                    will show up here.
                  </p>
                )}
              </section>

              <section className="card">
                <h2>Light per day, last 7 days</h2>
                <p className="sub">
                  {avgHours !== null
                    ? "You average about " +
                      avgHours.toFixed(1) +
                      " hours of light a day."
                    : "Log a few days to see your daily average."}
                </p>
                <div className="week">
                  {week.map((d) => (
                    <div className="col" key={d.dayStart}>
                      <span className="hrs">
                        {d.onMinutes === null
                          ? "-"
                          : formatDuration(d.onMinutes)}
                      </span>
                      <div
                        className={
                          "bar" + (d.onMinutes === null ? " empty" : "")
                        }
                        style={{
                          height:
                            d.onMinutes === null
                              ? "4px"
                              : Math.max(4, (d.onMinutes / (16 * 60)) * 100) + "%",
                        }}
                      />
                      <span className="day">{dayLabel(d.dayStart)}</span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {tab === "charge" && (
            <section className="card">
              <h2>Charge planner</h2>
              <p className="sub">
                Pick a device and your current battery level. LightLog
                works out how long a full charge needs and when your light
                pattern can actually cover it.
              </p>
              <div className="devices">
                {DEVICES.map((d) => (
                  <button
                    key={d.id}
                    className={"device" + (device === d.id ? " selected" : "")}
                    onClick={() => setDevice(d.id)}
                  >
                    <div className="icon" aria-hidden="true">
                      {d.id === "phone" ? "📱" : d.id === "laptop" ? "💻" : "🔋"}
                    </div>
                    <div className="name">{d.name}</div>
                    <div className="note">
                      Full charge about {formatDuration(d.fullMinutes)}
                    </div>
                  </button>
                ))}
              </div>
              <label className="field" htmlFor="battery">
                Current battery
              </label>
              <div className="battery-row">
                <input
                  id="battery"
                  type="range"
                  min="0"
                  max="100"
                  value={battery}
                  onChange={(e) => setBattery(Number(e.target.value))}
                />
                <span className="pct">{battery}%</span>
              </div>

              <div className="result">
                <div className="line">
                  <span>Time to full charge</span>
                  <strong>{formatDuration(needMinutes)}</strong>
                </div>
                <div className="line">
                  <span>Best time to start</span>
                  <strong>
                    {bestWindow
                      ? formatHour(bestWindow.startHour) +
                        " (" +
                        Math.round(bestWindow.score * 100) +
                        "% chance light holds)"
                      : "Not enough logs yet"}
                  </strong>
                </div>
                <div className="line">
                  <span>Light right now</span>
                  <strong>
                    {stats.currentOn === null
                      ? "Unknown"
                      : stats.currentOn
                        ? "On"
                        : "Off"}
                  </strong>
                </div>
              </div>

              {stats.currentOn ? (
                <div className="verdict good">
                  Light is on now. Plug in your{" "}
                  {DEVICES.find((d) => d.id === device).name.toLowerCase()}{" "}
                  straight away, it needs about {formatDuration(needMinutes)}{" "}
                  to reach full.
                </div>
              ) : bestWindow ? (
                <div className="verdict wait">
                  No light right now. Based on your pattern, the best
                  window starts around {formatHour(bestWindow.startHour)}.
                  Keep the charger close and plug in as soon as light
                  comes.
                </div>
              ) : (
                <div className="verdict wait">
                  Log light changes for a few days and this planner will
                  start predicting your best charging windows.
                </div>
              )}
            </section>
          )}

          <footer>
            LightLog stores everything on this device only. No account,
            no tracking.
            <br />
            <button
              className="btn ghost"
              style={{ marginTop: 10 }}
              onClick={clearAll}
            >
              Clear all my data
            </button>
          </footer>
        </>
      )}
    </div>
  );
}

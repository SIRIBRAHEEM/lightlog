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
import {
  Badge,
  BatteryIcon,
  BulbIcon,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ClockIcon,
  Input,
  Label,
  LaptopIcon,
  PhoneIcon,
  PlugIcon,
  PlusIcon,
  Select,
  Stat,
  TabsList,
  TabsTrigger,
  TrashIcon,
  UndoIcon,
  ZapIcon,
} from "./components/ui.jsx";
import { cn } from "./utils.js";

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

const DEVICE_ICONS = {
  phone: PhoneIcon,
  laptop: LaptopIcon,
  powerbank: BatteryIcon,
};

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
    <div className="mx-auto w-full max-w-[920px] px-4 pb-12 pt-5 sm:px-5">
      <header className="flex items-center justify-between gap-3 pb-5 pt-1">
        <div className="flex items-center gap-3">
          <div
            className="grid h-12 w-12 shrink-0 place-items-center rounded-[1.1rem] bg-gradient-to-br from-lamp to-ember text-[#241300] shadow-[0_8px_22px_-4px_rgba(255,150,40,0.6)]"
            aria-hidden="true"
          >
            <ZapIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-[28px] font-extrabold leading-none text-cream">
              LightLog
            </h1>
            <p className="mt-1 text-[13px] font-semibold text-muted">
              Know when the light will come
            </p>
          </div>
        </div>
        <div className="text-right text-[13px] font-semibold text-muted">
          <strong className="block font-display text-[22px] font-bold leading-tight text-cream">
            {timeLabel(now)}
          </strong>
          {new Date(now).toLocaleDateString([], {
            weekday: "long",
            day: "numeric",
            month: "short",
          })}
        </div>
      </header>

      {!started ? (
        <Card className="px-6 py-10 text-center sm:px-10">
          <div
            className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-lamp/15 text-lamp shadow-glow"
            aria-hidden="true"
          >
            <BulbIcon className="h-12 w-12" />
          </div>
          <h2 className="mt-6 font-display text-[30px] font-extrabold leading-tight text-cream">
            Stop guessing when NEPA will bring light
          </h2>
          <p className="mx-auto mt-3 max-w-[480px] leading-relaxed text-muted">
            LightLog tracks every time power comes and goes, learns the
            pattern for your area, and tells you the best time to charge
            your phone, laptop and power bank. Everything stays on your
            device, no account needed.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={() => begin(true)}>
              Try it with a sample week
            </Button>
            <Button variant="secondary" size="lg" onClick={() => begin(false)}>
              Start fresh
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <TabsList aria-label="Main" className="mb-5">
            <TabsTrigger active={tab === "today"} onClick={() => setTab("today")}>
              Today
            </TabsTrigger>
            <TabsTrigger
              active={tab === "patterns"}
              onClick={() => setTab("patterns")}
            >
              Patterns
            </TabsTrigger>
            <TabsTrigger active={tab === "charge"} onClick={() => setTab("charge")}>
              Charge planner
            </TabsTrigger>
          </TabsList>

          {tab === "today" && (
            <>
              <section
                className={cn(
                  "relative mb-4 overflow-hidden rounded-[2rem] border p-7 shadow-card",
                  stats.currentOn
                    ? "border-lamp/40 bg-gradient-to-br from-[#3a2c10] via-panel to-panel shadow-glow"
                    : "border-line bg-gradient-to-br from-[#2a1b2e] via-panel to-panel"
                )}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full blur-3xl",
                    stats.currentOn ? "bg-lamp/25" : "bg-rose/10"
                  )}
                  aria-hidden="true"
                />
                <div className="relative">
                  <div className="flex items-center gap-2.5 text-sm font-extrabold uppercase tracking-[0.14em] text-muted">
                    <span
                      className={cn(
                        "h-3 w-3 rounded-full",
                        stats.currentOn
                          ? "dot-live bg-mint"
                          : "bg-rose shadow-[0_0_0_5px_rgba(251,113,133,0.15)]"
                      )}
                    />
                    {stats.currentOn === null
                      ? "No log yet"
                      : stats.currentOn
                        ? "Light is on"
                        : "No light"}
                  </div>
                  <div className="mt-2 font-display text-[clamp(40px,8vw,60px)] font-extrabold leading-none text-cream">
                    {stats.currentOn === null
                      ? "Tap below to start"
                      : formatDuration(sinceMinutes)}
                  </div>
                  <p className="mb-6 mt-2 flex items-center gap-1.5 text-[15px] font-semibold text-muted">
                    <ClockIcon className="h-4 w-4 shrink-0" />
                    {stats.since !== null
                      ? (stats.currentOn ? "Came on at " : "Went off at ") +
                        timeLabel(stats.since)
                      : "Log the first change and LightLog starts learning."}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="lg" onClick={togglePower}>
                      <ZapIcon className="h-5 w-5" />
                      {stats.currentOn ? "Light just went off" : "Light just came on"}
                    </Button>
                    {events.length > 0 && (
                      <Button variant="secondary" onClick={undoLast}>
                        <UndoIcon className="h-4 w-4" />
                        Undo last log
                      </Button>
                    )}
                  </div>
                </div>
              </section>

              <div className="mb-4 grid grid-cols-1 gap-3 min-[480px]:grid-cols-3">
                <Stat value={formatDuration(stats.onMinutes)} label="Light today so far" accent />
                <Stat
                  value={formatDuration(stats.longestStretch)}
                  label="Longest stretch today"
                />
                <Stat value={stats.changesToday} label="Changes logged today" />
              </div>

              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Today&apos;s timeline</CardTitle>
                  <CardDescription>
                    Every change you logged today, newest first.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {todayEvents.length === 0 ? (
                    <p className="text-sm leading-relaxed text-muted">
                      Nothing logged today yet. When the light changes, tap
                      the button above.
                    </p>
                  ) : (
                    <ul className="relative ml-2 space-y-0 border-l-2 border-dashed border-line pl-6">
                      {todayEvents.map((e, i) => (
                        <li
                          key={e.t + "-" + i}
                          className="relative flex items-center gap-3 py-2.5 text-[15px] font-semibold text-cream"
                        >
                          <span
                            className={cn(
                              "absolute -left-[31px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-panel",
                              e.on
                                ? "bg-mint shadow-[0_0_10px_rgba(61,220,151,0.8)]"
                                : "bg-rose"
                            )}
                            aria-hidden="true"
                          />
                          <Badge variant={e.on ? "on" : "off"}>
                            {e.on ? "ON" : "OFF"}
                          </Badge>
                          {e.on ? "Light came on" : "Light went off"}
                          <span className="ml-auto text-sm font-semibold text-muted">
                            {timeLabel(e.t)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Missed a change?</CardTitle>
                  <CardDescription>
                    If you noticed late, add the change with the time it
                    really happened.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
                    <div>
                      <Label htmlFor="past-time">Date and time</Label>
                      <Input
                        id="past-time"
                        type="datetime-local"
                        value={pastTime}
                        onChange={(e) => setPastTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="past-state">What happened</Label>
                      <Select
                        id="past-state"
                        value={pastState}
                        onChange={(e) => setPastState(e.target.value)}
                      >
                        <option value="on">Light came on</option>
                        <option value="off">Light went off</option>
                      </Select>
                    </div>
                    <Button variant="secondary" onClick={addPast}>
                      <PlusIcon className="h-4 w-4" />
                      Add it
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {tab === "patterns" && (
            <>
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>When does light usually come?</CardTitle>
                  <CardDescription>
                    Each bar is one hour of the day. Taller means light is
                    more likely to be on at that hour, based on your logs.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className="mt-2 grid h-[150px] grid-cols-[repeat(24,1fr)] items-end gap-1"
                    role="img"
                    aria-label="Hourly light pattern chart"
                  >
                    {coverage.map((c, h) => (
                      <div
                        key={h}
                        className="heat-bar min-h-1 rounded-t-md rounded-b-sm"
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
                              ? "#1c2747"
                              : `linear-gradient(180deg, rgba(255,209,102,${0.45 + c * 0.55}), rgba(255,138,61,${0.45 + c * 0.55}))`,
                          boxShadow:
                            c !== null && c >= 0.6
                              ? "0 0 12px rgba(255,176,46,0.45)"
                              : "none",
                        }}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-xs font-semibold text-muted">
                    <span>12am</span>
                    <span>6am</span>
                    <span>12pm</span>
                    <span>6pm</span>
                    <span>11pm</span>
                  </div>
                  {bestHours.length > 0 ? (
                    <>
                      <p className="mt-5 text-sm font-semibold text-muted">
                        Your most reliable hours for light:
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {bestHours.map((x) => (
                          <Badge
                            key={x.h}
                            variant="lamp"
                            className="px-3 py-1.5 text-sm"
                          >
                            {formatHour(x.h)} - {Math.round(x.c * 100)}%
                          </Badge>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="mt-5 text-sm leading-relaxed text-muted">
                      Keep logging for a few days and your reliable hours
                      will show up here.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Light per day, last 7 days</CardTitle>
                  <CardDescription>
                    {avgHours !== null
                      ? "You average about " +
                        avgHours.toFixed(1) +
                        " hours of light a day."
                      : "Log a few days to see your daily average."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mt-2 grid h-[160px] grid-cols-7 items-end gap-2.5">
                    {week.map((d) => (
                      <div
                        className="flex h-full flex-col items-center justify-end gap-2"
                        key={d.dayStart}
                      >
                        <span className="text-[13px] font-extrabold text-cream">
                          {d.onMinutes === null
                            ? "-"
                            : formatDuration(d.onMinutes)}
                        </span>
                        <div
                          className={cn(
                            "week-bar w-full max-w-[46px] rounded-t-xl rounded-b-md",
                            d.onMinutes === null
                              ? "bg-panel2"
                              : "bg-gradient-to-b from-gold to-ember shadow-[0_0_14px_rgba(255,176,46,0.35)]"
                          )}
                          style={{
                            height:
                              d.onMinutes === null
                                ? "4px"
                                : Math.max(4, (d.onMinutes / (16 * 60)) * 100) + "%",
                          }}
                        />
                        <span className="text-xs font-semibold text-muted">
                          {dayLabel(d.dayStart)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {tab === "charge" && (
            <Card>
              <CardHeader>
                <CardTitle>Charge planner</CardTitle>
                <CardDescription>
                  Pick a device and your current battery level. LightLog
                  works out how long a full charge needs and when your light
                  pattern can actually cover it.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-5 grid grid-cols-1 gap-3 min-[480px]:grid-cols-3">
                  {DEVICES.map((d) => {
                    const DeviceIcon = DEVICE_ICONS[d.id] || PhoneIcon;
                    const selected = device === d.id;
                    return (
                      <button
                        key={d.id}
                        onClick={() => setDevice(d.id)}
                        aria-pressed={selected}
                        className={cn(
                          "rounded-[1.4rem] border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lamp/70",
                          selected
                            ? "border-lamp/60 bg-lamp/10 shadow-glow"
                            : "border-line bg-nightsoft hover:border-lamp/40"
                        )}
                      >
                        <DeviceIcon
                          className={cn(
                            "h-8 w-8",
                            selected ? "text-lamp" : "text-muted"
                          )}
                        />
                        <div className="mt-2.5 font-display text-lg font-bold text-cream">
                          {d.name}
                        </div>
                        <div className="mt-0.5 text-[13px] font-semibold text-muted">
                          Full charge about {formatDuration(d.fullMinutes)}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <Label htmlFor="battery">Current battery</Label>
                <div className="flex items-center gap-4">
                  <input
                    id="battery"
                    type="range"
                    min="0"
                    max="100"
                    value={battery}
                    onChange={(e) => setBattery(Number(e.target.value))}
                  />
                  <span className="min-w-[92px] text-right font-display text-[32px] font-extrabold leading-none text-gold">
                    {battery}%
                  </span>
                </div>

                <div className="mt-5 rounded-[1.4rem] border border-line bg-nightsoft p-5">
                  <div className="flex items-center justify-between gap-3 border-b border-dashed border-line py-2.5 text-[15px]">
                    <span className="font-semibold text-muted">
                      Time to full charge
                    </span>
                    <strong className="font-display text-lg font-bold text-cream">
                      {formatDuration(needMinutes)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-dashed border-line py-2.5 text-[15px]">
                    <span className="font-semibold text-muted">
                      Best time to start
                    </span>
                    <strong className="font-display text-lg font-bold text-cream">
                      {bestWindow
                        ? formatHour(bestWindow.startHour) +
                          " (" +
                          Math.round(bestWindow.score * 100) +
                          "% chance light holds)"
                        : "Not enough logs yet"}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-2.5 text-[15px]">
                    <span className="font-semibold text-muted">
                      Light right now
                    </span>
                    <strong className="font-display text-lg font-bold text-cream">
                      {stats.currentOn === null
                        ? "Unknown"
                        : stats.currentOn
                          ? "On"
                          : "Off"}
                    </strong>
                  </div>
                </div>

                {stats.currentOn ? (
                  <div className="mt-4 flex gap-3 rounded-[1.4rem] border border-mint/35 bg-mint/10 p-4 text-[15px] font-semibold leading-relaxed text-cream">
                    <PlugIcon className="mt-0.5 h-5 w-5 shrink-0 text-mint" />
                    <span>
                      Light is on now. Plug in your{" "}
                      {DEVICES.find((d) => d.id === device).name.toLowerCase()}{" "}
                      straight away, it needs about {formatDuration(needMinutes)}{" "}
                      to reach full.
                    </span>
                  </div>
                ) : bestWindow ? (
                  <div className="mt-4 flex gap-3 rounded-[1.4rem] border border-lamp/35 bg-lamp/10 p-4 text-[15px] font-semibold leading-relaxed text-cream">
                    <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-lamp" />
                    <span>
                      No light right now. Based on your pattern, the best
                      window starts around {formatHour(bestWindow.startHour)}.
                      Keep the charger close and plug in as soon as light
                      comes.
                    </span>
                  </div>
                ) : (
                  <div className="mt-4 flex gap-3 rounded-[1.4rem] border border-lamp/35 bg-lamp/10 p-4 text-[15px] font-semibold leading-relaxed text-cream">
                    <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-lamp" />
                    <span>
                      Log light changes for a few days and this planner will
                      start predicting your best charging windows.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <footer className="mt-7 text-center text-[13px] font-semibold leading-relaxed text-muted">
            LightLog stores everything on this device only. No account,
            no tracking.
            <br />
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={clearAll}
            >
              <TrashIcon className="h-4 w-4" />
              Clear all my data
            </Button>
          </footer>
        </>
      )}
    </div>
  );
}

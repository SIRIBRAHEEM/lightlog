// LightLog core logic. Pure functions, no React, easy to test.
//
// An event is { t, on } where t is a millisecond timestamp and on is true
// when power came on at that moment, false when it went off. The state
// before the first event is unknown, so periods only start at the first
// event and run up to "now".

const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;

export function sortEvents(events) {
  return [...events].sort((a, b) => a.t - b.t);
}

// Collapse consecutive events with the same state (double taps etc).
export function cleanEvents(events) {
  const sorted = sortEvents(events);
  const out = [];
  for (const e of sorted) {
    if (out.length && out[out.length - 1].on === e.on) continue;
    out.push(e);
  }
  return out;
}

// Build on/off periods from events, ending at now.
export function buildPeriods(events, now) {
  const evs = cleanEvents(events);
  const periods = [];
  for (let i = 0; i < evs.length; i++) {
    const start = evs[i].t;
    const end = i + 1 < evs.length ? evs[i + 1].t : now;
    if (end > start) periods.push({ start, end, on: evs[i].on });
  }
  return periods;
}

// Minutes of power-on time inside [from, to].
export function onMinutesBetween(periods, from, to) {
  let total = 0;
  for (const p of periods) {
    if (!p.on) continue;
    const s = Math.max(p.start, from);
    const e = Math.min(p.end, to);
    if (e > s) total += (e - s) / MIN;
  }
  return total;
}

export function startOfDay(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// Current state plus today's numbers.
export function todayStats(events, now) {
  const evs = cleanEvents(events);
  const periods = buildPeriods(evs, now);
  const dayStart = startOfDay(now);
  const onMinutes = onMinutesBetween(periods, dayStart, now);
  const last = evs.length ? evs[evs.length - 1] : null;
  const changesToday = evs.filter((e) => e.t >= dayStart).length;

  // Longest single on-stretch that overlaps today.
  let longest = 0;
  for (const p of periods) {
    if (!p.on) continue;
    const s = Math.max(p.start, dayStart);
    const e = Math.min(p.end, now);
    if (e > s) longest = Math.max(longest, (e - s) / MIN);
  }

  return {
    hasData: evs.length > 0,
    currentOn: last ? last.on : null,
    since: last ? last.t : null,
    onMinutes: Math.round(onMinutes),
    longestStretch: Math.round(longest),
    changesToday,
  };
}

// Hours of light per day for the last `days` days, oldest first.
// Days with no logged coverage at all come back with onMinutes null.
export function dailyTotals(events, now, days = 7) {
  const periods = buildPeriods(events, now);
  const firstT = periods.length ? periods[0].start : null;
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = startOfDay(now - i * DAY);
    const dayEnd = Math.min(dayStart + DAY, now);
    if (firstT === null || dayEnd <= firstT) {
      out.push({ dayStart, onMinutes: null });
    } else {
      out.push({
        dayStart,
        onMinutes: Math.round(onMinutesBetween(periods, dayStart, dayEnd)),
      });
    }
  }
  return out;
}

// For each hour of the day (0-23), the fraction of observed time in that
// hour when power was on. Hours never observed come back null.
export function hourlyCoverage(events, now) {
  const periods = buildPeriods(events, now);
  const on = new Array(24).fill(0);
  const seen = new Array(24).fill(0);
  for (const p of periods) {
    let cursor = p.start;
    while (cursor < p.end) {
      const d = new Date(cursor);
      const hourEnd = new Date(d);
      hourEnd.setMinutes(60, 0, 0);
      const segEnd = Math.min(hourEnd.getTime(), p.end);
      const mins = (segEnd - cursor) / MIN;
      seen[d.getHours()] += mins;
      if (p.on) on[d.getHours()] += mins;
      cursor = segEnd;
    }
  }
  return seen.map((s, h) => (s > 0 ? on[h] / s : null));
}

// Average light hours per day across days that have data.
export function averageDailyHours(events, now, days = 7) {
  const totals = dailyTotals(events, now, days).filter(
    (d) => d.onMinutes !== null
  );
  if (!totals.length) return null;
  const sum = totals.reduce((a, d) => a + d.onMinutes, 0);
  return sum / totals.length / 60;
}

// Devices and how long a full charge from empty usually takes (minutes).
export const DEVICES = [
  { id: "phone", name: "Phone", fullMinutes: 90 },
  { id: "laptop", name: "Laptop", fullMinutes: 150 },
  { id: "powerbank", name: "Power bank", fullMinutes: 240 },
];

export function chargeMinutes(deviceId, fromPct) {
  const device = DEVICES.find((d) => d.id === deviceId) || DEVICES[0];
  const pct = Math.min(100, Math.max(0, fromPct));
  return Math.round((device.fullMinutes * (100 - pct)) / 100);
}

// Find the best start hour in the next 24 hours for a charge that needs
// `needMinutes`. Score is the average coverage across the window.
// Returns { startHour, score } or null when there is no coverage data.
export function bestChargeWindow(coverage, needMinutes, nowHour) {
  if (coverage.every((c) => c === null)) return null;
  const windowHours = Math.max(1, Math.ceil(needMinutes / 60));
  let best = null;
  for (let offset = 0; offset < 24; offset++) {
    const start = (nowHour + offset) % 24;
    let sum = 0;
    let count = 0;
    for (let k = 0; k < windowHours; k++) {
      const c = coverage[(start + k) % 24];
      if (c !== null) {
        sum += c;
        count++;
      }
    }
    if (!count) continue;
    const score = sum / count;
    if (!best || score > best.score) best = { startHour: start, score };
  }
  return best;
}

export function formatDuration(minutes) {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return m + "m";
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? h + "h " + rest + "m" : h + "h";
}

export function formatHour(h) {
  const hour = ((h % 24) + 24) % 24;
  if (hour === 0) return "12am";
  if (hour === 12) return "12pm";
  return hour < 12 ? hour + "am" : hour - 12 + "pm";
}

// A realistic sample week: light mostly in the evening and night, some
// short daytime stretches, a couple of bad days. Deterministic so the
// demo always looks the same.
export function sampleWeek(now) {
  const events = [];
  const day = (daysAgo, h, m) => {
    const d = new Date(startOfDay(now - daysAgo * DAY));
    d.setHours(h, m, 0, 0);
    return d.getTime();
  };
  const push = (t, on) => {
    if (t < now) events.push({ t, on });
  };

  // 6 days ago: light 6pm to 11pm
  push(day(6, 18, 5), true);
  push(day(6, 23, 10), false);
  // 5 days ago: morning 2h, evening 7pm to 1am
  push(day(5, 7, 0), true);
  push(day(5, 9, 15), false);
  push(day(5, 19, 0), true);
  push(day(4, 1, 20), false);
  // 4 days ago: only 2 hours in the evening
  push(day(4, 20, 30), true);
  push(day(4, 22, 30), false);
  // 3 days ago: good day, 5pm to 6am
  push(day(3, 17, 45), true);
  push(day(2, 6, 0), false);
  // 2 days ago: afternoon 1h, night 9pm to 4am
  push(day(2, 14, 0), true);
  push(day(2, 15, 5), false);
  push(day(2, 21, 10), true);
  push(day(1, 4, 0), false);
  // yesterday: evening 6:30pm to midnight
  push(day(1, 18, 30), true);
  push(day(0, 0, 5), false);
  // today: came on at 7:40am, went off 9:10am, back on later if past 6pm
  push(day(0, 7, 40), true);
  push(day(0, 9, 10), false);
  push(day(0, 18, 20), true);

  return sortEvents(events);
}

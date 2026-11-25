import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cleanEvents,
  buildPeriods,
  onMinutesBetween,
  todayStats,
  dailyTotals,
  hourlyCoverage,
  averageDailyHours,
  chargeMinutes,
  bestChargeWindow,
  formatDuration,
  formatHour,
  sampleWeek,
} from "./lib.js";

// Fixed "now": Wednesday 2026-11-25, 10:00 local time.
const NOW = new Date(2026, 10, 25, 10, 0, 0).getTime();
const at = (h, m = 0, dayOffset = 0) =>
  new Date(2026, 10, 25 + dayOffset, h, m, 0).getTime();

test("cleanEvents removes duplicate states and sorts", () => {
  const evs = cleanEvents([
    { t: at(9), on: false },
    { t: at(7), on: true },
    { t: at(8), on: true },
  ]);
  assert.equal(evs.length, 2);
  assert.equal(evs[0].on, true);
  assert.equal(evs[1].on, false);
});

test("buildPeriods runs from first event to now", () => {
  const periods = buildPeriods(
    [
      { t: at(7), on: true },
      { t: at(9), on: false },
    ],
    NOW
  );
  assert.equal(periods.length, 2);
  assert.equal(periods[0].on, true);
  assert.equal(periods[1].end, NOW);
});

test("onMinutesBetween counts only on-time in range", () => {
  const periods = buildPeriods(
    [
      { t: at(7), on: true },
      { t: at(9), on: false },
    ],
    NOW
  );
  assert.equal(onMinutesBetween(periods, at(0), NOW), 120);
  assert.equal(onMinutesBetween(periods, at(8), NOW), 60);
  assert.equal(onMinutesBetween(periods, at(9, 30), NOW), 0);
});

test("todayStats reports current state and totals", () => {
  const stats = todayStats(
    [
      { t: at(6), on: true },
      { t: at(8), on: false },
      { t: at(9, 30), on: true },
    ],
    NOW
  );
  assert.equal(stats.currentOn, true);
  assert.equal(stats.onMinutes, 150);
  assert.equal(stats.longestStretch, 120);
  assert.equal(stats.changesToday, 3);
});

test("todayStats handles no data", () => {
  const stats = todayStats([], NOW);
  assert.equal(stats.hasData, false);
  assert.equal(stats.currentOn, null);
  assert.equal(stats.onMinutes, 0);
});

test("dailyTotals marks unobserved days as null", () => {
  const totals = dailyTotals([{ t: at(7), on: true }], NOW, 7);
  assert.equal(totals.length, 7);
  assert.equal(totals[0].onMinutes, null);
  assert.equal(totals[6].onMinutes, 180);
});

test("hourlyCoverage gives fraction of on-time per hour", () => {
  const cov = hourlyCoverage(
    [
      { t: at(7), on: true },
      { t: at(8, 30), on: false },
    ],
    NOW
  );
  assert.equal(cov[7], 1);
  assert.equal(cov[8], 0.5);
  assert.equal(cov[9], 0);
  assert.equal(cov[3], null);
});

test("averageDailyHours averages only days with data", () => {
  const avg = averageDailyHours(
    [
      { t: at(7, 0, -1), on: true },
      { t: at(9, 0, -1), on: false },
      { t: at(7), on: true },
      { t: at(9), on: false },
    ],
    NOW,
    7
  );
  assert.equal(avg, 2);
});

test("chargeMinutes scales with battery level", () => {
  assert.equal(chargeMinutes("phone", 0), 90);
  assert.equal(chargeMinutes("phone", 50), 45);
  assert.equal(chargeMinutes("laptop", 20), 120);
  assert.equal(chargeMinutes("powerbank", 100), 0);
});

test("bestChargeWindow picks the highest coverage window", () => {
  const cov = new Array(24).fill(0);
  cov[19] = 1;
  cov[20] = 1;
  cov[21] = 1;
  const best = bestChargeWindow(cov, 120, 10);
  assert.equal(best.startHour, 19);
  assert.equal(best.score, 1);
});

test("bestChargeWindow returns null with no data", () => {
  assert.equal(bestChargeWindow(new Array(24).fill(null), 60, 10), null);
});

test("formatDuration and formatHour read naturally", () => {
  assert.equal(formatDuration(45), "45m");
  assert.equal(formatDuration(60), "1h");
  assert.equal(formatDuration(125), "2h 5m");
  assert.equal(formatHour(0), "12am");
  assert.equal(formatHour(13), "1pm");
  assert.equal(formatHour(12), "12pm");
});

test("sampleWeek produces a week of alternating events", () => {
  const evs = sampleWeek(NOW);
  assert.ok(evs.length >= 12);
  for (let i = 1; i < evs.length; i++) {
    assert.ok(evs[i].t > evs[i - 1].t);
    assert.notEqual(evs[i].on, evs[i - 1].on);
  }
  const stats = todayStats(evs, NOW);
  assert.ok(stats.onMinutes > 0);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSchedule,
  bulkTime,
  dayLabel,
  defaultOutOfOven,
  formatDuration,
  formatTime,
  roundToFiveMinutes,
  validateScheduleInput,
} from '../js/schedule.js';

const outOfOven = new Date(2026, 10, 14, 10, 0);
const now = new Date(2026, 10, 13, 12, 50);

const stepTimes = (steps) => Object.fromEntries(steps.map((s) => [s.id, formatTime(s.time)]));

test('bulk time follows 3 h at 24 °C, halving every 8 °C', () => {
  assert.equal(bulkTime(24).minutes, 180);
  assert.equal(bulkTime(22).minutes, 215);
  assert.equal(bulkTime(20).minutes, 255);
  assert.equal(bulkTime(28).minutes, 125);
});

test('bulk time clamps the temperature to 16–32 °C', () => {
  assert.deepEqual(bulkTime(40), { minutes: 90, tempC: 32, clamped: true });
  assert.deepEqual(bulkTime(5), { minutes: 360, tempC: 16, clamped: true });
  assert.equal(bulkTime(24).clamped, false);
});

test('formatDuration', () => {
  assert.equal(formatDuration(180), '3 h');
  assert.equal(formatDuration(215), '3 h 35 min');
  assert.equal(formatDuration(45), '45 min');
  assert.equal(formatDuration(0), '0 min');
});

test('roundToFiveMinutes rounds to the nearest 5 minutes', () => {
  assert.equal(formatTime(roundToFiveMinutes(new Date(2026, 0, 1, 10, 2))), '10:00');
  assert.equal(formatTime(roundToFiveMinutes(new Date(2026, 0, 1, 10, 3))), '10:05');
});

test('validateScheduleInput reports bad date and temperature', () => {
  assert.deepEqual(validateScheduleInput({ outOfOven: new Date(NaN), tempC: 22 }).length, 1);
  assert.deepEqual(validateScheduleInput({ outOfOven, tempC: NaN }).length, 1);
  assert.deepEqual(validateScheduleInput({ outOfOven, tempC: 22 }), []);
});

test('defaultOutOfOven is tomorrow at the given hour', () => {
  const date = defaultOutOfOven(now, 10);
  assert.equal(formatTime(date), '10:00');
  assert.equal(dayLabel(date, now), 'Tomorrow');
});

test('retard on: timeline is ordered and times are rounded', () => {
  const { bulk, steps } = buildSchedule(outOfOven, { tempC: 24, coldRetard: true }, now);
  assert.equal(bulk.minutes, 180);

  const times = steps.map((s) => s.time.getTime());
  assert.deepEqual(times, [...times].sort((a, b) => a - b));

  const t = stepTimes(steps);
  assert.equal(t.feed, '13:20');
  assert.equal(t.mix, '18:20');
  assert.equal(t.salt, '18:50');
  assert.equal(t.shape, '21:20');
  assert.equal(t.fridge, '21:20');
  assert.equal(t.preheat, '08:35');
  assert.equal(t.bake, '09:20');
  assert.equal(t.out, '10:00');
  assert.equal(t.cut, '11:30');
  assert.equal(steps.some((s) => s.id === 'proof'), false);
});

test('retard on: folds run every 30 min until shaping', () => {
  const { steps } = buildSchedule(outOfOven, { tempC: 24, coldRetard: true }, now);
  const folds = steps.filter((s) => s.id.startsWith('fold-'));
  assert.equal(folds.length, 4);
  assert.deepEqual(folds.map((s) => formatTime(s.time)), ['19:20', '19:50', '20:20', '20:50']);
});

test('retard off: room-temperature proof replaces the fridge step', () => {
  const { steps } = buildSchedule(outOfOven, { tempC: 24, coldRetard: false }, now);
  const t = stepTimes(steps);
  assert.equal(t.shape, '08:20');
  assert.equal(steps.some((s) => s.id === 'fridge'), false);
  assert.equal(steps.some((s) => s.id === 'proof'), true);
});

test('retard off: early steps are flagged as overnight', () => {
  const { steps } = buildSchedule(outOfOven, { tempC: 24, coldRetard: false }, now);
  const mix = steps.find((s) => s.id === 'mix');
  assert.equal(mix.night, true);
  assert.equal(steps.find((s) => s.id === 'bake').night, false);
});

test('steps before now are flagged as past', () => {
  const { steps } = buildSchedule(outOfOven, { tempC: 24, coldRetard: true }, now);
  assert.equal(steps.find((s) => s.id === 'feed').past, false);
  const pastNow = new Date(2026, 10, 13, 14, 0);
  const later = buildSchedule(outOfOven, { tempC: 24, coldRetard: true }, pastNow);
  assert.equal(later.steps.find((s) => s.id === 'feed').past, true);
  assert.equal(later.steps.find((s) => s.id === 'mix').past, false);
});

test('warm kitchen drops folds that land after shaping', () => {
  const { steps } = buildSchedule(outOfOven, { tempC: 32, coldRetard: true }, now);
  const shape = steps.find((s) => s.id === 'shape');
  steps
    .filter((s) => s.id.startsWith('fold-'))
    .forEach((s) => assert.ok(s.time < shape.time));
});

test('dayLabel: today, tomorrow, yesterday', () => {
  assert.equal(dayLabel(new Date(2026, 10, 13, 9, 0), now), 'Today');
  assert.equal(dayLabel(new Date(2026, 10, 14, 9, 0), now), 'Tomorrow');
  assert.equal(dayLabel(new Date(2026, 10, 12, 9, 0), now), 'Yesterday');
  const later = dayLabel(new Date(2026, 10, 20, 9, 0), now);
  assert.ok(!['Today', 'Tomorrow', 'Yesterday'].includes(later));
});

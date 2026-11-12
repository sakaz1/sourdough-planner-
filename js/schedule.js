import { BULK_MODEL, DEFAULT_SCHEDULE } from './defaults.js';

const MINUTE_MS = 60 * 1000;
const FIVE_MINUTES_MS = 5 * MINUTE_MS;
const DAY_MS = 24 * 60 * MINUTE_MS;

const pad = (n) => String(n).padStart(2, '0');

export function roundToFiveMinutes(date) {
  return new Date(Math.round(date.getTime() / FIVE_MINUTES_MS) * FIVE_MINUTES_MS);
}

/** Bulk time = refHours x 2^((refTempC - T) / halvingC), T clamped to the model range, rounded to 5 min. */
export function bulkTime(tempC, model = BULK_MODEL) {
  const clampedTempC = Math.min(model.maxTempC, Math.max(model.minTempC, tempC));
  const hours = model.refHours * 2 ** ((model.refTempC - clampedTempC) / model.halvingC);
  return {
    minutes: Math.round((hours * 60) / 5) * 5,
    tempC: clampedTempC,
    clamped: clampedTempC !== tempC,
  };
}

export function validateScheduleInput({ outOfOven, tempC }) {
  const errors = [];
  if (!(outOfOven instanceof Date) || Number.isNaN(outOfOven.getTime())) {
    errors.push('Enter a valid date and time for the bread to come out of the oven.');
  }
  if (!Number.isFinite(tempC)) errors.push('Room temperature must be a number.');
  return errors;
}

export function defaultOutOfOven(now, hour = DEFAULT_SCHEDULE.outOfOvenHour) {
  const date = new Date(now);
  date.setDate(date.getDate() + 1);
  date.setHours(hour, 0, 0, 0);
  return date;
}

const isNight = (date) => date.getHours() >= 23 || date.getHours() < 6;

/**
 * Works backwards from the out-of-oven time. Step times are rounded to 5 minutes,
 * so intervals between displayed times can differ from the real ones by a few minutes.
 * @returns {{bulk: ReturnType<typeof bulkTime>, steps: {id: string, label: string, detail: string, time: Date, past: boolean, night: boolean}[]}}
 */
export function buildSchedule(outOfOven, options = {}, now = new Date()) {
  const o = { ...DEFAULT_SCHEDULE, ...options };
  const bulk = bulkTime(o.tempC);

  // All offsets are minutes relative to the out-of-oven time.
  const bakeStart = -(o.steamMin + o.noSteamMin);
  const preheat = bakeStart - o.preheatMin;
  const shape = bakeStart - (o.coldRetard ? o.retardHours : o.proofHours) * 60;
  const mix = shape - bulk.minutes;
  const salt = mix + o.saltAfterMin;
  const feed = mix - o.starterFeedHours * 60;

  // Folds that would land after the end of bulk are dropped (warm kitchens).
  const folds = [];
  for (let k = 1; k <= o.foldSets; k++) {
    const offset = salt + k * o.foldEveryMin;
    if (offset < shape) folds.push(offset);
  }

  const at = (offset) => roundToFiveMinutes(new Date(outOfOven.getTime() + offset * MINUTE_MS));
  const step = (id, label, detail, offset) => ({ id, label, detail, time: at(offset) });

  const steps = [
    step('feed', 'Feed starter', `About ${o.starterFeedHours} h before mixing`, feed),
    step('mix', 'Mix', `Flour, water and starter; salt follows after ${o.saltAfterMin} min`, mix),
    step('salt', 'Add salt', '', salt),
    ...folds.map((offset, i) => step(`fold-${i + 1}`, `Stretch and fold ${i + 1} of ${folds.length}`, '', offset)),
    step('bulk-end', 'End of bulk', `Bulk took ${formatDuration(bulk.minutes)}`, shape),
    step('shape', 'Shape', '', shape),
    ...(o.coldRetard
      ? [step('fridge', 'Into the fridge', `Cold retard for ${o.retardHours} h`, shape)]
      : [step('proof', 'Proof', `${o.proofHours} h at room temperature`, shape)]),
    step('preheat', 'Preheat oven', `To ${o.steamTempC} \u00b0C`, preheat),
    step(
      'bake',
      'Bake',
      `${o.steamMin} min at ${o.steamTempC} \u00b0C with steam, then ${o.noSteamMin} min at ${o.noSteamTempC} \u00b0C without` +
        (o.coldRetard ? '; straight from the fridge' : ''),
      bakeStart,
    ),
    step('out', 'Out of the oven', '', 0),
    step('cut', 'Ready to cut', `After resting ${o.restMin} min`, o.restMin),
  ];

  // Stable sort keeps the logical order for steps that share a time.
  steps.sort((a, b) => a.time - b.time);
  return {
    bulk,
    steps: steps.map((s) => ({ ...s, past: s.time < now, night: isNight(s.time) })),
  };
}

export function formatTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h && `${h} h`, (m || !h) && `${m} min`].filter(Boolean).join(' ');
}

export function dayLabel(date, now = new Date()) {
  const dayNumber = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS;
  const diff = dayNumber(date) - dayNumber(now);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

import { computeRecipe } from './calc.js';
import { BULK_MODEL, DEFAULT_RECIPE, DEFAULT_SCHEDULE } from './defaults.js';
import {
  buildSchedule,
  dayLabel,
  defaultOutOfOven,
  formatDuration,
  formatTime,
  validateScheduleInput,
} from './schedule.js';

const form = document.getElementById('recipe-form');
const floursEl = document.getElementById('flours');
const errorsEl = document.getElementById('errors');
const resultsEl = document.getElementById('results');
const rowsEl = document.getElementById('result-rows');

const fmt = new Intl.NumberFormat('en', { maximumFractionDigits: 1 });
// Empty input must be invalid, not 0.
const parse = (value) => (value.trim() === '' ? NaN : Number(value));

function addFlourRow(name = '', grams = '') {
  const row = document.createElement('div');
  row.className = 'flour-row';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'flour-name';
  nameInput.placeholder = 'Flour name';
  nameInput.setAttribute('aria-label', 'Flour name');
  nameInput.value = name;

  const gramsInput = document.createElement('input');
  gramsInput.type = 'number';
  gramsInput.className = 'flour-grams';
  gramsInput.min = '0';
  gramsInput.step = 'any';
  gramsInput.inputMode = 'decimal';
  gramsInput.placeholder = 'g';
  gramsInput.setAttribute('aria-label', 'Flour grams');
  gramsInput.value = grams;

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'remove';
  remove.textContent = '\u00d7';
  remove.setAttribute('aria-label', 'Remove flour');

  row.append(nameInput, gramsInput, remove);
  floursEl.append(row);
}

function readRecipe() {
  return {
    flours: [...floursEl.querySelectorAll('.flour-row')].map((row) => ({
      name: row.querySelector('.flour-name').value,
      grams: parse(row.querySelector('.flour-grams').value),
    })),
    water: parse(form.elements.water.value),
    starter: parse(form.elements.starter.value),
    salt: parse(form.elements.salt.value),
  };
}

function addRow(cells, className) {
  const tr = document.createElement('tr');
  if (className) tr.className = className;
  cells.forEach((text, i) => {
    const td = document.createElement(i === 0 ? 'th' : 'td');
    if (i === 0) td.scope = 'row';
    td.textContent = text;
    tr.append(td);
  });
  rowsEl.append(tr);
}

function renderRecipe() {
  const result = computeRecipe(readRecipe());
  errorsEl.replaceChildren();
  rowsEl.replaceChildren();

  if (!result.ok) {
    result.errors.forEach((message) => {
      const li = document.createElement('li');
      li.textContent = message;
      errorsEl.append(li);
    });
    resultsEl.hidden = true;
    return;
  }

  result.ingredients.forEach((i) => addRow([i.name, `${fmt.format(i.grams)} g`, `${fmt.format(i.percent)}%`]));
  addRow(['Total flour', `${fmt.format(result.totalFlour)} g`, ''], 'summary divider');
  addRow(['Total hydration', '', `${fmt.format(result.hydration)}%`], 'summary');
  addRow(['Total dough weight', `${fmt.format(result.totalWeight)} g`, ''], 'summary');
  resultsEl.hidden = false;
}

form.addEventListener('input', renderRecipe);
form.addEventListener('submit', (e) => e.preventDefault());
document.getElementById('add-flour').addEventListener('click', () => {
  addFlourRow();
  renderRecipe();
});
floursEl.addEventListener('click', (e) => {
  if (!e.target.classList.contains('remove')) return;
  e.target.closest('.flour-row').remove();
  renderRecipe();
});

DEFAULT_RECIPE.flours.forEach((f) => addFlourRow(f.name, f.grams));
form.elements.water.value = DEFAULT_RECIPE.water;
form.elements.starter.value = DEFAULT_RECIPE.starter;
form.elements.salt.value = DEFAULT_RECIPE.salt;
renderRecipe();

// Schedule planner
const scheduleForm = document.getElementById('schedule-form');
const scheduleErrorsEl = document.getElementById('schedule-errors');
const scheduleWarningsEl = document.getElementById('schedule-warnings');
const scheduleResultsEl = document.getElementById('schedule-results');
const bulkSummaryEl = document.getElementById('bulk-summary');
const bulkNoteEl = document.getElementById('bulk-note');
const timelineEl = document.getElementById('timeline');

const pad = (n) => String(n).padStart(2, '0');

function toInputValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function listItem(text) {
  const li = document.createElement('li');
  li.textContent = text;
  return li;
}

function stepElement(step, now) {
  const li = document.createElement('li');
  li.className = 'step';

  const when = document.createElement('div');
  when.className = 'when';
  const time = document.createElement('span');
  time.className = 'time';
  time.textContent = formatTime(step.time);
  const day = document.createElement('span');
  day.className = 'day';
  day.textContent = dayLabel(step.time, now);
  when.append(time, day);

  const what = document.createElement('div');
  what.className = 'what';
  const label = document.createElement('strong');
  label.textContent = step.label;
  what.append(label);
  if (step.detail) {
    const detail = document.createElement('span');
    detail.className = 'detail';
    detail.textContent = step.detail;
    what.append(detail);
  }
  const flags = [step.past && 'In the past', step.night && 'Overnight (23:00\u201306:00)'].filter(Boolean);
  flags.forEach((text) => {
    const flag = document.createElement('span');
    flag.className = 'flag';
    flag.textContent = text;
    what.append(flag);
  });
  if (flags.length) li.classList.add('warn');

  li.append(when, what);
  return li;
}

function renderSchedule() {
  const input = {
    outOfOven: new Date(scheduleForm.elements.outOfOven.value),
    tempC: parse(scheduleForm.elements.roomTemp.value),
  };
  scheduleErrorsEl.replaceChildren();
  scheduleWarningsEl.replaceChildren();
  timelineEl.replaceChildren();

  const errors = validateScheduleInput(input);
  if (errors.length) {
    scheduleErrorsEl.append(...errors.map(listItem));
    scheduleResultsEl.hidden = true;
    return;
  }

  const now = new Date();
  const { bulk, steps } = buildSchedule(
    input.outOfOven,
    { tempC: input.tempC, coldRetard: scheduleForm.elements.coldRetard.checked },
    now,
  );

  bulkSummaryEl.textContent = `Bulk fermentation: ${formatDuration(bulk.minutes)} at ${bulk.tempC} \u00b0C`;
  bulkNoteEl.textContent =
    `Bulk time halves for every ${BULK_MODEL.halvingC} \u00b0C warmer and doubles for every ` +
    `${BULK_MODEL.halvingC} \u00b0C cooler, starting from ${formatDuration(BULK_MODEL.refHours * 60)} at ${BULK_MODEL.refTempC} \u00b0C.`;

  if (bulk.clamped) {
    scheduleWarningsEl.append(
      listItem(`Room temperature is outside ${BULK_MODEL.minTempC}\u2013${BULK_MODEL.maxTempC} \u00b0C; bulk time is calculated for ${bulk.tempC} \u00b0C.`),
    );
  }
  const past = steps.filter((s) => s.past).length;
  const night = steps.filter((s) => s.night).length;
  const plural = (n) => `${n} step${n === 1 ? '' : 's'}`;
  if (past) scheduleWarningsEl.append(listItem(`${plural(past)} fall in the past.`));
  if (night) scheduleWarningsEl.append(listItem(`${plural(night)} fall between 23:00 and 06:00.`));

  timelineEl.append(...steps.map((s) => stepElement(s, now)));
  scheduleResultsEl.hidden = false;
}

scheduleForm.addEventListener('input', renderSchedule);
scheduleForm.addEventListener('submit', (e) => e.preventDefault());

scheduleForm.elements.outOfOven.value = toInputValue(defaultOutOfOven(new Date(), DEFAULT_SCHEDULE.outOfOvenHour));
scheduleForm.elements.roomTemp.value = DEFAULT_SCHEDULE.tempC;
scheduleForm.elements.coldRetard.checked = DEFAULT_SCHEDULE.coldRetard;
renderSchedule();

// Theme: follows the system until the user picks one, then remembers the choice.
const themeToggle = document.getElementById('theme-toggle');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
const THEME_KEY = 'theme';

function savedTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  return saved === 'light' || saved === 'dark' ? saved : null;
}

function currentTheme() {
  return savedTheme() ?? (systemDark.matches ? 'dark' : 'light');
}

function applyTheme() {
  const theme = currentTheme();
  document.documentElement.dataset.theme = theme;
  themeToggle.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
}

themeToggle.addEventListener('click', () => {
  localStorage.setItem(THEME_KEY, currentTheme() === 'dark' ? 'light' : 'dark');
  applyTheme();
});
systemDark.addEventListener('change', applyTheme);
applyTheme();

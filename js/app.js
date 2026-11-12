import { computeRecipe } from './calc.js';
import { DEFAULT_RECIPE } from './defaults.js';

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

function render() {
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

form.addEventListener('input', render);
form.addEventListener('submit', (e) => e.preventDefault());
document.getElementById('add-flour').addEventListener('click', () => {
  addFlourRow();
  render();
});
floursEl.addEventListener('click', (e) => {
  if (!e.target.classList.contains('remove')) return;
  e.target.closest('.flour-row').remove();
  render();
});

DEFAULT_RECIPE.flours.forEach((f) => addFlourRow(f.name, f.grams));
form.elements.water.value = DEFAULT_RECIPE.water;
form.elements.starter.value = DEFAULT_RECIPE.starter;
form.elements.salt.value = DEFAULT_RECIPE.salt;
render();

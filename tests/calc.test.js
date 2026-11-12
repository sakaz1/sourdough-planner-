import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeRecipe } from '../js/calc.js';
import { DEFAULT_RECIPE } from '../js/defaults.js';

test('default recipe gives baker percentages, hydration and total weight', () => {
  const result = computeRecipe(DEFAULT_RECIPE);
  assert.equal(result.ok, true);
  const percent = Object.fromEntries(result.ingredients.map((i) => [i.name, Math.round(i.percent * 10) / 10]));
  assert.deepEqual(percent, {
    'Wheat flour': 70,
    'Rye flour': 30,
    Water: 70,
    Starter: 20,
    Salt: 2,
  });
  assert.equal(result.totalFlour, 500);
  assert.equal(result.totalWeight, 960);
  assert.equal(Math.round(result.hydration * 10) / 10, 72.7);
});

test('blank flour name falls back to a numbered name', () => {
  const result = computeRecipe({ ...DEFAULT_RECIPE, flours: [{ name: '  ', grams: 100 }] });
  assert.equal(result.ingredients[0].name, 'Flour 1');
});

test('no flours is an error', () => {
  const result = computeRecipe({ ...DEFAULT_RECIPE, flours: [] });
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes('Add at least one flour.'));
});

test('NaN and negative values are errors', () => {
  const nan = computeRecipe({ ...DEFAULT_RECIPE, water: NaN });
  assert.equal(nan.ok, false);
  assert.ok(nan.errors.includes('Water must be a number, 0 or more.'));

  const negative = computeRecipe({ ...DEFAULT_RECIPE, salt: -1 });
  assert.equal(negative.ok, false);
  assert.ok(negative.errors.includes('Salt must be a number, 0 or more.'));
});

test('zero total flour is an error', () => {
  const result = computeRecipe({ ...DEFAULT_RECIPE, flours: [{ name: 'Rye', grams: 0 }] });
  assert.deepEqual(result, { ok: false, errors: ['Total flour must be greater than 0.'] });
});

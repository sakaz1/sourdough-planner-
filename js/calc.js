// Starter is assumed 100% hydration: half flour, half water.
const STARTER_FLOUR_SHARE = 0.5;

/**
 * @param {{flours: {name: string, grams: number}[], water: number, starter: number, salt: number}} recipe
 * @returns {{ok: false, errors: string[]} | {ok: true, ingredients: {name: string, grams: number, percent: number}[], totalFlour: number, hydration: number, totalWeight: number}}
 */
export function computeRecipe({ flours, water, starter, salt }) {
  const errors = [];
  const check = (label, value) => {
    if (!Number.isFinite(value) || value < 0) {
      errors.push(`${label} must be a number, 0 or more.`);
    }
  };

  if (flours.length === 0) errors.push('Add at least one flour.');
  const named = flours.map((f, i) => ({ ...f, name: f.name.trim() || `Flour ${i + 1}` }));
  named.forEach((f) => check(f.name, f.grams));
  check('Water', water);
  check('Starter', starter);
  check('Salt', salt);
  if (errors.length) return { ok: false, errors };

  const totalFlour = named.reduce((sum, f) => sum + f.grams, 0);
  if (totalFlour <= 0) return { ok: false, errors: ['Total flour must be greater than 0.'] };

  const percent = (grams) => (grams / totalFlour) * 100;
  const ingredients = [
    ...named,
    { name: 'Water', grams: water },
    { name: 'Starter', grams: starter },
    { name: 'Salt', grams: salt },
  ].map((i) => ({ ...i, percent: percent(i.grams) }));

  const starterFlour = starter * STARTER_FLOUR_SHARE;
  const starterWater = starter - starterFlour;
  const hydration = ((water + starterWater) / (totalFlour + starterFlour)) * 100;
  const totalWeight = ingredients.reduce((sum, i) => sum + i.grams, 0);

  return { ok: true, ingredients, totalFlour, hydration, totalWeight };
}

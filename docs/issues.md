# Work items

## 1. Set up the static page skeleton and GitHub Pages

**Description**
Create `index.html`, `styles.css`, `js/app.js` and `js/defaults.js`, and enable GitHub Pages.

**Acceptance criteria**
- The page loads from the Pages URL with no console errors.
- The layout is readable on a 375 px wide screen.
- `defaults.js` exports all the default recipe and timing values listed in the README.

## 2. Recipe calculator: baker's %, hydration, total weight

**Description**
Implement pure functions in `calc.js` and a form for multiple flours, water, starter and salt.

**Acceptance criteria**
- Flour rows can be added and removed.
- The defaults produce wheat 70%, rye 30%, water 70%, starter 20%, salt 2%, hydration 72.7% and total 960 g.
- Hydration includes the starter's flour and water, split 50/50.
- Results update as values change.
- Invalid input (empty or negative) shows a message, not NaN.

## 3. Scale recipe to target dough weight

**Description**
Add a target weight input that scales all ingredients proportionally.

**Acceptance criteria**
- 1200 g from the defaults gives wheat 437.5 g, rye 187.5 g, water 437.5 g, starter 125 g and salt 12.5 g.
- Percentages and hydration stay the same after scaling.
- Displayed grams are rounded to 1 decimal place.

## 4. Temperature-adjusted bulk time

**Description**
Implement `bulkTime()` in `schedule.js` using 3 h × 2^((24 − T)/8).

**Acceptance criteria**
- 24 °C gives 3:00, 20 °C gives 4:15, and 28 °C gives 2:05 after rounding to 5 minutes.
- Input is clamped to 16–32 °C, with a visible warning outside that range.
- The UI shows the one-sentence explanation of the model.
- The function is covered in `tests/tests.html`.

## 5. Backward schedule planner

**Description**
Implement `buildSchedule()` and render the timeline from the out-of-oven time, the room temperature and a cold retard toggle.

**Acceptance criteria**
- Saturday 10:00, 24 °C with retard on reproduces the example timeline in the README.
- Turning retard off replaces the 12 h fridge step with a 1 h room-temperature proof.
- Each step shows the day and time.
- Inputs persist across reloads via `localStorage`.
- A reset button restores the defaults.

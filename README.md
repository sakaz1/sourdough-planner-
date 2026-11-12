# Sourdough Bake Planner

A small personal web app that turns a recipe and a target bake time into exact quantities and a timed schedule. Plain HTML, CSS and vanilla JavaScript: no frameworks, no build step, hosted on GitHub Pages.

## Live demo

<https://YOUR-USERNAME.github.io/YOUR-REPO/> (placeholder: replace with the real GitHub Pages URL)

## Product spec

**Goal**
Turn my recipe and target bake time into exact quantities and a timed schedule, with bulk time adjusted for room temperature.

**User**
One home baker (me), on phone or laptop, usually the day before baking. I know sourdough but don't want to do the arithmetic.

**Features**
1. **Recipe calculator**
   - Input any number of flours (name and grams), plus water, starter (assumed 100% hydration) and salt.
   - Output each ingredient's baker's percentage (relative to the listed flour), total hydration including the flour and water in the starter, and total dough weight.
   - Scale every ingredient to a target dough weight.
2. **Schedule planner**
   - Input the date and time the bread should come out of the oven (default: tomorrow 10:00), the room temperature (default 22 °C), and whether to cold retard (default on).
   - Work backwards to a vertical timeline with clock times and day labels (Today / Tomorrow): feed starter, mix, add salt, stretch and folds, end of bulk, shape, into the fridge, preheat, bake, out of the oven, ready to cut.
   - Warn when a step is in the past or falls between 23:00 and 06:00.
   - All displayed clock times are rounded to the nearest 5 minutes.
3. **Temperature-adjusted bulk:** bulk time comes from the one-sentence model below.
4. **Defaults** are pre-filled with my recipe and timings and can be reset.
5. **Persistence:** the last inputs are saved in `localStorage`.

**Non-goals**
- No accounts, backend, sync or sharing.
- No frameworks, bundlers, npm or build step.
- No starter-maintenance tracking or feeding-ratio maths.
- No notifications or alarms.
- No recipe library: one working recipe at a time.
- No hydration-, inoculation- or dough-temperature-aware fermentation modelling.

**Defaults**

| Item | Value |
|---|---|
| Wheat flour | 350 g |
| Rye flour | 150 g |
| Water | 350 g |
| Starter (100%) | 100 g |
| Salt | 10 g |
| Starter feed before mix | 5 h |
| Room temperature | 22 °C |
| Bulk at reference temp | 3 h at 24 °C |
| Cold retard | 12 h, bake straight from the fridge |
| Preheat | 45 min |
| Bake | 20 min at 250 °C with steam, then 22 min at 210 °C without |
| Rest before cutting | 90 min |
| Salt added | 30 min after mix |
| Stretch and folds | 4 sets, every 30 min after salt |
| Room-temperature proof (retard off) | 1 h |

**Default recipe output**
- Listed flour: 500 g. The starter adds 50 g flour and 50 g water.
- Baker's % (relative to the 500 g listed flour): wheat 70%, rye 30%, water 70%, starter 20%, salt 2%.
- Total hydration: (350 + 50) / (500 + 50) = **72.7%**
- Total dough: **960 g**
- Scaling: every ingredient × (target weight / 960). A 1200 g target gives a factor of 1.25: wheat 437.5 g, rye 187.5 g, water 437.5 g, starter 125 g, salt 12.5 g.

## Temperature model

> **Bulk time halves for every 8 °C warmer (and doubles for every 8 °C cooler), starting from 3 hours at 24 °C.**

$$
t_{\text{bulk}} = 3\,\text{h} \times 2^{\frac{24 - T}{8}}
$$

- T is room temperature in °C. The 3 h and 24 °C values are editable defaults.
- T is clamped to 16–32 °C, with a warning outside that range.
- The result is rounded to the nearest 5 minutes.

| Room temp | Bulk |
|---|---|
| 20 °C | 3 × 2^0.5 ≈ **4 h 15 min** |
| 24 °C | **3 h 00 min** |
| 28 °C | 3 × 2^−0.5 ≈ **2 h 05 min** |

**Backward calculation** from the out-of-oven time:
- Bake starts 42 min earlier (20 min steam + 22 min without).
- Preheat starts 45 min before the bake.
- Shaping happens 12 h before the bake (cold retard).
- Mixing happens one bulk time before shaping.
- The starter is fed 5 h before mixing.

Without the cold retard, shaping goes straight into a 1 h room-temperature proof (editable default).

**Example:** bread out Saturday 10:00, 24 °C, cold retard on. Times are rounded to 5 minutes, so displayed intervals can be a few minutes off (the bake is shown at 09:20 although 42 min before 10:00 is 09:18).

| Step | Time |
|---|---|
| Feed starter | Fri 13:20 |
| Mix | Fri 18:20 |
| Add salt | Fri 18:50 |
| Stretch and folds | Fri 19:20, 19:50, 20:20, 20:50 |
| End of bulk, shape, into fridge | Fri 21:20 |
| Preheat oven | Sat 08:35 |
| Bake: 20 min at 250 °C with steam, then 22 min at 210 °C | Sat 09:20 |
| Out of oven | **Sat 10:00** |
| Ready to cut | Sat 11:30 |

Folds that would fall after the end of bulk (warm kitchens) are left out.

## File structure

```
/
├── index.html          # markup: recipe form, schedule form, results
├── styles.css          # mobile-first styling
├── js/
│   ├── app.js          # wires DOM events and rendering (localStorage to come)
│   ├── calc.js         # baker's %, hydration, totals (scaling to come); pure functions
│   ├── schedule.js     # bulkTime(), buildSchedule(), time formatting; pure functions
│   └── defaults.js     # default recipe, bulk model and timings
├── tests/
│   └── tests.html      # planned: open in browser; runs plain assertions on pure modules
├── docs/
│   └── issues.md       # work items to turn into GitHub issues
└── README.md
```

Scripts are loaded with `<script type="module">`, which works on GitHub Pages without a build step.

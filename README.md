# Sourdough Bake Planner

A small personal web app that turns a recipe and a target bake time into exact quantities and a timed schedule. Plain HTML, CSS and vanilla JavaScript: no frameworks, no build step, hosted on GitHub Pages.

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
   - Input the date and time the bread should come out of the oven, the room temperature, and whether to cold retard.
   - Work backwards to a timeline: feed starter, mix, add salt, stretch and folds, end of bulk, shape, cold retard, preheat, bake, rest before cutting.
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
| Bulk at reference temp | 5 h at 24 °C |
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

> **Bulk time halves for every 8 °C warmer (and doubles for every 8 °C cooler), starting from 5 hours at 24 °C.**

$$
t_{\text{bulk}} = 5\,\text{h} \times 2^{\frac{24 - T}{8}}
$$

- T is room temperature in °C. The 5 h and 24 °C values are editable defaults.
- T is clamped to 16–32 °C, with a warning outside that range.
- The result is rounded to the nearest 5 minutes.

| Room temp | Bulk |
|---|---|
| 20 °C | 5 × 2^0.5 ≈ **7 h 05 min** |
| 24 °C | **5 h 00 min** |
| 28 °C | 5 × 2^−0.5 ≈ **3 h 30 min** |

**Backward calculation** from the out-of-oven time:
- Bake starts 42 min earlier (20 min steam + 22 min without).
- Preheat starts 45 min before the bake.
- Shaping happens 12 h before the bake (cold retard).
- Mixing happens one bulk time before shaping.
- The starter is fed 5 h before mixing.

Without the cold retard, shaping goes straight into a 1 h room-temperature proof (editable default).

**Example:** bread out Saturday 10:00, 24 °C, cold retard on (times not snapped to 5 minutes).

| Step | Time |
|---|---|
| Feed starter | Fri 11:18 |
| Mix | Fri 16:18 |
| Add salt | Fri 16:48 |
| Stretch and folds | Fri 17:18, 17:48, 18:18, 18:48 |
| End bulk, shape, into fridge | Fri 21:18 |
| Preheat oven | Sat 08:33 |
| Out of fridge, bake with steam at 250 °C | Sat 09:18 |
| Remove steam, 210 °C | Sat 09:38 |
| Out of oven | **Sat 10:00** |
| Cut | Sat 11:30 |

## File structure

```
/
├── index.html          # markup: recipe form, schedule form, results
├── css/
│   └── style.css       # mobile-first styling
├── js/
│   ├── app.js          # wires DOM events, rendering, localStorage
│   ├── recipe.js       # baker's %, hydration, totals, scaling (pure functions)
│   ├── fermentation.js # bulkTime(tempC, refHours, refTemp)
│   ├── schedule.js     # buildSchedule(outOfOvenDate, options) -> steps[]
│   └── defaults.js     # default recipe and timings
├── tests/
│   └── tests.html      # open in browser; runs plain assertions on pure modules
├── docs/
│   └── issues.md       # work items to turn into GitHub issues
└── README.md
```

Scripts are loaded with `<script type="module">`, which works on GitHub Pages without a build step.

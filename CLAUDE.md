# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

No build step for development — open `index.html` directly in a browser, or serve it (`python3 -m http.server 8080`) if you need a real origin for testing. There is no `package.json`, no npm dependencies, no test suite, and no linter — this is pure vanilla JS/HTML/CSS. Tailwind CSS, lucide-icons, and the Google Fonts are all loaded from CDN inside `index.html` (internet required, even for local dev).

For mobile use: `node build.js` bundles `style.css` and every `js/*.js` into a single self-contained `index.standalone.html`. This exists because opening the multi-file `index.html` via `file://` fails on many mobile browsers — they refuse to load sibling `<script src="js/...">` files (each `file://` path is treated as a separate origin). Rebuild it after touching `style.css` or any `js/*.js` file; `build.js` finds scripts to inline via the regex `<script src="(js\/[\w-]+\.js)"></script>`, so a new game file only needs to match that pattern in `index.html` to be picked up automatically.

## Architecture

- `index.html` loads `js/*.js` as plain `<script>` tags in a fixed order (`utils.js`, `i18n.js` → each `game-*.js` → `stats.js` → `main.js` last). Order matters — every file assumes the globals defined by earlier ones already exist.
- Every game is a self-contained IIFE assigned to a global const (`GameLine`, `GameMath`, `GamePairs`, `GameSchulte`, `GameWords`, `GameSpeedRead`), returning a fixed-shape object: `{ id, titleKey, descKey, icon, color, mount(root, onExit), historyVariants? }`. `main.js` only ever touches this shape — it never reaches into a game's internals.
  - `mount(root, onExit)` renders the entire game into `root`; games move between screens (setup → round → game-over) by rebuilding `root.innerHTML`, not via any framework or virtual DOM.
  - `historyVariants()` is optional: it returns `{key, label}[]` describing every scoreable variant (e.g. per level × per round type). Omit it for a tool with no score, like `GameSpeedRead`.
- `Utils` (`js/utils.js`) is the shared toolkit: `el()` is a hyperscript-style DOM builder used everywhere instead of innerHTML templates; `shuffle`/`sample`/`randInt` for randomization; `getBest`/`setBest`/`recordResult`/`getHistory` for localStorage-backed scoring; `speak()` wraps the Web Speech API for TTS; `buildVoiceToggle()` is the shared voice on/off widget used by both `GameLine` and `GameWords`.
- `I18N` (`js/i18n.js`) is a flat nested-dict translator (`ru`/`en`) accessed as `I18N.t('a.b.c', {vars})`; the active language persists in localStorage. Every user-facing string goes through it, namespaced per game plus a `game.<id>.title`/`.desc` pair for the menu card.
- **Scoring key convention:** `Utils.setBest`/`recordResult` must be called with the exact same key that `historyVariants()` produces for that variant (pattern: `` `${gameId}_${levelKey}_${roundType}` ``) — not the bare game id. Using the wrong key makes best-score tracking work while `StatsView`'s per-variant chart silently shows no history, since it looks up history by the `historyVariants()` keys.
- `StatsView` (`js/stats.js`) is shaped like a game (`mount`, `titleKey`, etc.) and sits in the menu, but instead of being played it renders one chart card per entry in its own `GAMES_META` array (game reference + SVG stroke color + `higherIsBetter` + a value formatter). A scored game must be added to `GAMES_META` separately from `main.js`'s `games` array.
- `main.js` just holds the `games` array (menu order/contents) and a two-screen router (`showMenu`/`openGame`) — it carries no other state.

## Adding a new game

1. Create `js/game-<id>.js` following the IIFE/`mount` contract above.
2. Add `<script src="js/game-<id>.js"></script>` in `index.html`, after `utils.js`/`i18n.js` and before `stats.js`/`main.js`.
3. Add the game object to the `games` array in `js/main.js`.
4. Add `ru` and `en` strings to `js/i18n.js`: `game.<id>.title`/`.desc` plus the game's own key namespace.
5. If it has a score, add an entry to `GAMES_META` in `js/stats.js` too — and double-check its score keys match its `historyVariants()` keys (see the convention above).
6. Run `node build.js` to refresh `index.standalone.html`.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

No build step for development — open `index.html` directly in a browser, or serve it (`python3 -m http.server 8080`) if you need a real origin for testing. There is no `package.json`, no npm dependencies, no test suite, and no linter — this is pure vanilla JS/HTML/CSS. Tailwind CSS, lucide-icons, and the Google Fonts are all loaded from CDN inside `index.html` (internet required, even for local dev).

For mobile use: `node build.js` bundles `style.css` and every `js/*.js` into a single self-contained `index.standalone.html`. This exists because opening the multi-file `index.html` via `file://` fails on many mobile browsers — they refuse to load sibling `<script src="js/...">` files (each `file://` path is treated as a separate origin). Rebuild it after touching `style.css` or any `js/*.js` file; `build.js` finds scripts to inline via the regex `<script src="(js\/[\w-]+\.js)"></script>`, so a new game file only needs to match that pattern in `index.html` to be picked up automatically.

## Architecture

- `index.html` loads `js/*.js` as plain `<script>` tags in a fixed order (`utils.js`, `i18n.js` → each `game-*.js` → `stats.js` → `main.js` last). Order matters — every file assumes the globals defined by earlier ones already exist.
- Every game is a self-contained IIFE assigned to a global const (`GameLine`, `GameMath`, `GameSumer`, `GamePairs`, `GameSchulte`, `GameWords`, `GameEdubba`, `GameSpeedRead`), returning a fixed-shape object: `{ id, titleKey, descKey, icon, color, mount(root, onExit), historyVariants? }`. `main.js` only ever touches this shape — it never reaches into a game's internals.
  - `mount(root, onExit)` renders the entire game into `root`; games move between screens (setup → round → game-over) by rebuilding `root.innerHTML`, not via any framework or virtual DOM.
  - `historyVariants()` is optional: it returns `{key, label}[]` describing every scoreable variant (e.g. per level × per round type). Omit it for a tool with no score, like `GameSpeedRead`.
- `Utils` (`js/utils.js`) is the shared toolkit: `el()` is a hyperscript-style DOM builder used everywhere instead of innerHTML templates; `shuffle`/`sample`/`randInt` for randomization; `getBest`/`setBest`/`recordResult`/`getHistory` for localStorage-backed scoring; `speak()` wraps the Web Speech API for TTS; `buildVoiceToggle()` is the shared voice on/off widget used by both `GameLine` and `GameWords`.
- `I18N` (`js/i18n.js`) is a flat nested-dict translator (`ru`/`en`) accessed as `I18N.t('a.b.c', {vars})`; the active language persists in localStorage. Every user-facing string goes through it, namespaced per game plus a `game.<id>.title`/`.desc` pair for the menu card.
- **Scoring key convention:** `Utils.setBest`/`recordResult` must be called with the exact same key that `historyVariants()` produces for that variant (pattern: `` `${gameId}_${levelKey}_${roundType}` ``) — not the bare game id. Using the wrong key makes best-score tracking work while `StatsView`'s per-variant chart silently shows no history, since it looks up history by the `historyVariants()` keys.
- `StatsView` (`js/stats.js`) is shaped like a game (`mount`, `titleKey`, etc.) and sits in the menu, but instead of being played it renders one chart card per entry in its own `GAMES_META` array (game reference + SVG stroke color + `higherIsBetter` + a value formatter). A scored game must be added to `GAMES_META` separately from `main.js`'s `games` array.
- **Edubba engine** (`js/edubba.js`) is shared by `GameEdubba` (words) and `GameSumer` (base-60 math): a lesson block is mastered through copy → recall → exam (`Edubba.run(root, cfg)`), and `Edubba.renderLessons` unlocks each block only after the previous one is mastered (exam ≥ 85%). The engine knows nothing about words or numbers — the game supplies `items`, `prompt`/`model` renderers, a `makeInput` widget (letter tiles / numeric keypad) and `isCorrect`. Mastery is stored as the best exam % under `Utils.setBest('edubba_' + lessonId)`, so `Edubba.isMastered(id)` is how `GameSumer` decides which practice problems it may generate.
- `GameSumer` never converts to decimal for the player: numbers are shown and accepted only as base-60 places (`1:06`), trailing zeros optional (`canon()` treats `1` = `1:00`). Internally it uses plain integers; `GameSumer.sex` exposes `fmt`/`canon`/`rec` for checking against reference igi tables.
- `main.js` just holds the `games` array (menu order/contents) and a two-screen router (`showMenu`/`openGame`) — it carries no other state.

## Android APK

`android/` is a minimal native wrapper (plain `Activity` + `WebView`, no Capacitor/Cordova) that bundles the standalone build as an offline-installable app. Build with `android/build-apk.sh` — it runs `node build.js`, copies `index.standalone.html` into `android/app/src/main/assets/www/index.html`, and runs `./gradlew assembleDebug`; output lands at `android/app/build/outputs/apk/debug/app-debug.apk`, debug-signed and ready to sideload (`adb install` or copy + tap on-device).

Requires a JDK **17** on `PATH`/`JAVA_HOME` (Gradle 8.9 rejects newer JDKs like 23 with "Unsupported class file major version") and the Android SDK's `platform-tools`, `platforms;android-34`, `build-tools;34.0.0` at `ANDROID_SDK_ROOT` (defaults to `~/Android/Sdk`) — `build-apk.sh` auto-uses `~/.android-build-jdk17` if present.

`MainActivity.java` only exists to do what a bare `WebView` can't: `onShowFileChooser` (needed for the "Load .txt" file picker in `GameSpeedRead`) and back-button → `webView.goBack()`. Everything else is the same web app running in `file:///android_asset/www/index.html`. Tailwind/lucide/Google Fonts are still loaded from their CDNs at runtime, so **the app needs internet on launch** even though it's "installed" — there's no local/offline build of those assets yet.

## Adding a new game

1. Create `js/game-<id>.js` following the IIFE/`mount` contract above.
2. Add `<script src="js/game-<id>.js"></script>` in `index.html`, after `utils.js`/`i18n.js` and before `stats.js`/`main.js`.
3. Add the game object to the `games` array in `js/main.js`.
4. Add `ru` and `en` strings to `js/i18n.js`: `game.<id>.title`/`.desc` plus the game's own key namespace.
5. If it has a score, add an entry to `GAMES_META` in `js/stats.js` too — and double-check its score keys match its `historyVariants()` keys (see the convention above).
6. Run `node build.js` to refresh `index.standalone.html`.

# Repository Guidelines

## Project Structure & Module Organization

This repository builds “我是老板 / I am boss,” a 2D pixel business simulation. Keep simulation logic render-independent.

```text
src/config/        initial choices, probability tables, balance constants
src/sim/           pure systems for company, employees, finance, society, scoring
src/harness/       seeded runners, snapshots, fast-forward, balance reports, probability audits
src/game/          render-agnostic session controller and player actions
src/ui/            HUD and city-map view models
src/web/           Vite browser client for the playable prototype
tests/             Vitest tests covering systems and harness behavior
assets/            planned pixel art, audio, fonts, and fixtures
docs/              economy model, AI iteration guide, UI drafts, and design notes
```

`src/config/probabilities.ts` is the source of truth for chance-based behavior. Add tunables there with gameplay-impact comments.
Use `docs/ai-iteration-guide.md` as the handoff document for future AI iterations, and use `docs/ui-drafts.md` for the current pixel UI direction.

## Build, Test, and Development Commands

- `npm install` installs TypeScript, Vitest, Vite, Playwright, and tsx. Use `NPM_CONFIG_CACHE=/tmp/i-am-boss-npm-cache npm install` for npm cache permission issues.
- `npm run build` type-checks with `tsc -p tsconfig.json`.
- `npm run build:web` creates the Vite build.
- `npm run dev` starts the browser prototype on `127.0.0.1`.
- `npm test` runs all deterministic Vitest unit tests.
- `npm run test:e2e` runs Playwright core web flow coverage.
- `npm run harness -- --seed 1 --days 365` prints one seeded summary JSON.
- `npm run harness -- --seed 7 --days 200 --checkpointIntervalDays 90` records timeline checkpoints.
- `npm run balance -- --seedStart 1 --runs 10 --days 365 --checkpointIntervalDays 90` runs multi-seed economy reports.
- `npm run probability:audit` verifies probability configuration coverage.

## Harness & Balance Workflow

Harness output is the canonical contract for automated balancing and UI model work. Keep `HarnessSummary` deterministic for identical seed, initial choice, and day-count inputs.

When changing simulation behavior:
- Add or update focused Vitest coverage for the changed system.
- Run at least one deterministic seed example with `npm run harness -- --seed <n> --days <d>`.
- For economy changes, run `npm run balance -- --seedStart 1 --runs 10 --days 365 --checkpointIntervalDays 90`.
- For probability changes, keep the tunable in `src/config/probabilities.ts` with a gameplay-impact comment and run `npm run probability:audit`.
- Preserve checkpoint determinism for `runHarnessTimeline`.

## Coding Style & Naming Conventions

Use TypeScript with 2-space indentation. Prefer pure functions in `src/sim/` and UI state mapping in `src/ui/`. Use `camelCase` for variables/functions, `PascalCase` for classes/scenes, `SCREAMING_SNAKE_CASE` for constants, and `kebab-case` for config filenames.

Browser UI text must support Simplified Chinese and English switching. Add user-facing strings to `src/web/i18n.ts`, keep stable IDs in models, and cover language-specific labels in tests.

For web performance, keep simulation work out of render functions. Prefer derived view models, bounded event feeds, event delegation, and single-pass transforms for repeated summaries.

## Testing Guidelines

Test files use `*.test.ts` and deterministic seeded RNG. Cover probability changes across hiring, finance, policy, legal, labor, lifecycle, snapshot, and scoring systems.

Use focused tests before full runs. For harness changes, include seed examples and verify deterministic checkpoint summaries.

## Playwright Self-Test Workflow

Use Playwright for browser-facing QA when changing `src/web/`, `src/ui/`, or player action wiring. Keep the pass focused on:
- Logic flow: startup choice, language switching, recruitment, finance, event filtering, time advance, game over, and leaderboard.
- UI layout: desktop `1280x720`, mobile/narrow viewport, dialog fit, text visibility, and horizontal overflow.
- Button behavior: disabled prerequisites, enabled transitions, dialog open/close, finance, recruitment, employee, culture, and secondary actions.

`npm run test:e2e` is the canonical browser self-test. Browser screenshots should stay ephemeral: capture them in memory for assertions, or use a temporary copy only while actively reviewing a layout issue and delete it after inspection.

When Playwright finds a reproducible issue, add or update a focused browser assertion first, then make the smallest product change that satisfies it. Sync any workflow changes into this file and `docs/ai-iteration-guide.md`.

## Commit & Pull Request Guidelines

History uses short subjects such as `init project`; keep commits imperative, for example `add hiring balance tests`. PRs should include gameplay impact, validation commands, seed examples, UI screenshots or clips, and linked issues.

## Content & Safety

Keep illegal or harmful company and employee behavior abstract, consequence-driven, and non-graphic. Exclude sexual, pornographic, and exploitative content from gameplay, assets, fixtures, and tests.

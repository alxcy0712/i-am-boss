# I am boss / 我是老板

A 2D pixel-style browser business simulation. The player acts as a founder, starts from one founder profile, hires employees, manages salary and culture, reacts to policy and market cycles, pursues financing and IPO, then receives a final score when the company goes bankrupt, the founder retires, or the founder dies.

[中文 README](README.md)

## Current Status

The project has a playable web prototype, deterministic simulation systems, harness tooling, balance reports, Vitest unit tests, and Playwright core browser-flow coverage.

Feature coverage:

| Requirement | Status | Entry points |
| --- | --- | --- |
| Founder, employee, and company abilities | Done | `src/sim/types.ts`, `src/sim/state.ts` |
| Three initial choices | Done | `src/config/initial-choices.ts` |
| Bankruptcy, retirement, death game over | Done | `src/sim/game-over.ts` |
| 1:2:1 scoring | Done | `src/sim/scoring.ts` |
| Private analyst estimate and public market value | Done | `src/sim/valuation.ts`, `src/sim/securities-market.ts` |
| Hiring, salary, negotiation, resignation, severance | Done | `src/sim/hiring.ts`, `src/sim/staffing.ts`, `src/sim/employee-lifecycle.ts`, `src/sim/resignation.ts` |
| Policy, court, macro cycle, special events | Done | `src/sim/policy.ts`, `src/sim/court.ts`, `src/sim/macro-cycle.ts`, `src/sim/special-events.ts` |
| Bank loans, IPO, listed governance | Done | `src/sim/finance.ts`, `src/sim/listed-governance.ts` |
| Central probability configuration | Done | `src/config/probabilities.ts` |
| Simplified Chinese default, English toggle | Done | `src/web/i18n.ts` |

Future AI iteration material lives in [AI Iteration Guide](docs/ai-iteration-guide.md) and [UI Drafts](docs/ui-drafts.md).

## Quick Start

```bash
npm install
npm run dev
```

The browser prototype runs on `127.0.0.1`; Vite prints the selected port.

## Commands

```bash
npm run build
npm run build:web
npm test
npm run test:e2e
npm run harness -- --seed 1 --days 365
npm run harness -- --seed 7 --days 200 --checkpointIntervalDays 90
npm run balance -- --seedStart 1 --runs 10 --days 365 --checkpointIntervalDays 90
npm run probability:audit
```

## Project Layout

```text
src/config/        Initial choices, probability tables, balance constants
src/sim/           Pure company, employee, finance, society, scoring systems
src/harness/       Seeded runners, fast-forward, snapshots, balance reports, audits
src/game/          Render-agnostic session controller and player actions
src/ui/            HUD and city-map view models
src/web/           Vite browser client
tests/             Vitest and Playwright tests
docs/              Economy model, AI iteration guide, UI drafts
public/fonts/      Pixel font assets
```

## Gameplay Systems

Startup begins with three founder profiles: technical, network, and resilient. Choosing one creates the initial company state with founder abilities, cash, reputation, culture, and society state.

Operating gameplay includes:

- Hiring: company scale, revenue, and resources determine role needs; candidates receive background, abilities, target salary, and minimum salary.
- People: employees have technical skill, experience, stress tolerance, communication, EQ, IQ, personality, salary, tenure, and management level.
- Company: the company tracks cash, debt, valuation, revenue, burn, reputation, morale, culture, resources, operational capability, and role mix.
- Society: macro cycles affect market sentiment and unemployment; policy, court cases, and special events affect cash, reputation, and markets.
- Finance: bank loans, IPO, listed market value, governance, delisting risk, insurance, and investment portfolio.
- End state: bankruptcy, retirement, or death triggers game over; final score uses days played, company valuation, and player wealth.

## Harness

Harness is the main entry point for balance and AI iteration. It provides deterministic seeds, fast-forwarding, timeline checkpoints, multi-run balance reports, and probability configuration audits.

Single-seed summary:

```bash
npm run harness -- --seed 1 --days 365
```

Timeline checkpoints:

```bash
npm run harness -- --seed 7 --days 200 --checkpointIntervalDays 90
```

Multi-seed balance report:

```bash
npm run balance -- --seedStart 1 --runs 10 --days 365 --checkpointIntervalDays 90
```

## Probability And Balance

All probabilities, weights, and tuning values are centralized in `src/config/probabilities.ts`. Gameplay probability changes should start there and include focused tests.

Recommended balance loop:

1. Update `src/config/probabilities.ts`
2. Run focused tests
3. Run `npm run balance -- --seedStart 1 --runs 10 --days 365 --checkpointIntervalDays 90`
4. Record seed examples, game-over reasons, valuation, cash, headcount, and event counts

## Content Safety

The game may include abstract company violations, employee violations, court cases, and financial risk events. Sexual, pornographic, violent, exploitative, and graphic content is excluded from gameplay, copy, assets, fixtures, and tests.

## Development Guidance

Future AI iterations should pick one small goal from the docs, pair it with deterministic seeds, and add or update tests. Simulation logic stays render-independent; the web layer consumes session and view-model data.

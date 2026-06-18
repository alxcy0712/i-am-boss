# Economy Model — 我是老板 (I am boss)

## Overview

The game simulates a startup founder's journey from founding to bankruptcy, retirement, or death. The economy model drives hiring, valuation, finance, and society interactions.

## Core Loops

### 1. Hiring Loop
- Candidates generated with ability scores (0-10): tech, experience, stress tolerance, communication, eq, iq, personality
- Salary negotiation: candidate has target salary, player makes offer
- Acceptance probability = base + salary match + reputation + equity + communication
- Culture fit affects both hiring acceptance and resignation risk

### 2. Finance Loop
- **Private valuation**: analyst-style estimate based on annual revenue, profit margin, reputation, operational capability, and market sentiment
- **Public valuation**: `listedMarketValue` (fluctuates with sentiment, reputation, noise)
- **Bank loans**: require reputation ≥ 4 and revenue > 6 months burn
- **IPO**: require revenue ≥ 1M, reputation ≥ 7, headcount ≥ 30

### 3. Society Loop
- **Macro cycle**: 60-year Kondratiev cycle (recovery → prosperity → recession → depression)
- **Market sentiment**: drives valuation multiples
- **Unemployment**: affects salary expectations
- **Policy**: random support grants for matching companies
- **Court**: legal violations (company/employee) result in cash penalties + reputation loss
- **Special events**: financial crisis, supply chain shock, geopolitical tension

### 4. Scoring Loop
- Final score = `daysPlayed×1 + companyValuation×2 + playerWealth×1`
- Weights: days:valuation:wealth = 1:2:1
- The linear score keeps the requested weighting directly visible in the game-over breakdown

## Key Systems

### Abilities (0-10 scale)

**Person abilities:**
- `tech`: technical skill (education + experience + role match)
- `experience`: industry years
- `stressTolerance`: stability under pressure
- `communication`: teamwork, promotion potential
- `eq`: emotional intelligence
- `iq`: raw intelligence
- `personality`: ambitious/steady/collaborative/independent

**Company abilities:**
- `cash`: current cash reserves
- `debt`: total liabilities
- `valuation`: estimated market value
- `reputation`: brand strength (0-10)
- `morale`: employee satisfaction (0-10)
- `culture`: wolf/laissez-faire/adaptive/striver
- `headcount`: total employees

### Salary System

| Role | Base Monthly | Junior | Mid | Senior |
|------|-------------|--------|-----|--------|
| engineer | 12,000 | 0.75× | 1× | 1.65× |
| product | 11,000 | 0.75× | 1× | 1.65× |
| sales | 9,500 | 0.75× | 1× | 1.65× |
| finance | 10,500 | 0.75× | 1× | 1.65× |
| hr | 9,000 | 0.75× | 1× | 1.65× |

**Salary modifiers:**
- Education premium: elite +8%, strong +4%, standard +0%, vocational -2%
- Role-matched major: +3%
- Industry experience: +0.4% per year
- Labor market: ±12% based on unemployment

### Culture System

| Culture | Pressure | Morale | Reputation | Best Personality |
|---------|----------|--------|------------|------------------|
| wolf | 9 | -0.8 | 0 | ambitious (1.0) |
| laissez-faire | 3 | +0.5 | -0.2 | independent (1.0) |
| adaptive | 5 | +0.3 | +0.2 | collaborative (1.0) |
| striver | 7 | -0.2 | +0.1 | ambitious (0.95) |

### Macro Cycle Phases

| Phase | Market Sentiment | Unemployment |
|-------|-----------------|--------------|
| recovery | 1.05 | 7% |
| prosperity | 1.20 | 4% |
| recession | 0.86 | 12% |
| depression | 0.68 | 20% |

### Special Events

| Event | Monthly Chance | Cash Loss | Sentiment | Unemployment |
|-------|---------------|-----------|-----------|--------------|
| financial crisis | 0.08 × 0.4 | -12% | -0.18 | +3.5% |
| supply chain shock | 0.08 × 0.35 | -4% | -0.04 | - |
| geopolitical tension | 0.08 × 0.25 | - | -0.10 | +1.5% |

### Game Over Conditions

1. **Bankruptcy**: cash < 0
2. **Retirement**: founder age ≥ 65
3. **Death**: founder health ≤ 0

### Promotion System

**Middle Management** (headcount ≥ 8):
- Tenure ≥ 12 months
- Score ≥ 7.2 (communication×0.35 + eq×0.25 + stress×0.20 + experience×0.15 + tenure×0.05)
- Salary raise: +15%

**Executive** (headcount ≥ 30):
- Tenure ≥ 36 months
- Score ≥ 8.4
- Salary raise: +15%

## Probability Configuration

All tunable values are in `src/config/probabilities.ts`. Key sections:

| Section | Key Values | Impact |
|---------|------------|--------|
| `founder` | retirementAge, monthlyBaseHealthLoss | Game length |
| `hiring` | baseAcceptance, salaryWeight | Hiring difficulty |
| `resignation` | baseRisk, salaryGapWeight | Employee retention |
| `valuation` | privateRevenueMultiple, reputationWeight | Company value |
| `finance` | ipoRevenueThreshold, minimumLoanReputation | IPO/loans |
| `macroCycle` | cycleLengthDays, phase parameters | Economic waves |
| `specialEvents` | monthlyChance, event weights | Random events |
| `laborMarket` | highUnemploymentThreshold | Salary adjustments |

## Tuning Guide

**Too easy?** Increase:
- `resignation.baseRisk` (more turnover)
- `specialEvents.monthlyChance` (more crises)
- Decrease `hiring.baseAcceptance` (harder hiring)

**Too hard?** Decrease:
- `finance.ipoRevenueThreshold` (earlier IPO)
- `founder.monthlyBaseHealthLoss` (longer runs)
- `court.companyViolationPenaltyPerSeverity` (lower penalties)

**Score balance?** Adjust scoring weights in `src/sim/scoring.ts`:
```typescript
daysPlayed * 1 + // days weight
companyValuation * 2 + // valuation weight
playerWealth * 1; // wealth weight
```

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-04-21

### Added

- Agent management: `createAgent()`, `getAgent()`, `listAgents()`, `updateAgent()`, `deleteAgent()`, `startAgent()`, `stopAgent()`
- Agent chat: `sendMessage()`, `getMessages()` with pagination
- Skills catalog: `listSkills()` — 7 available skills
- Automations: `createAutomation()`, `listAutomations()`, `deleteAutomation()` — price triggers + scheduled actions
- Strategy presets: `monitor-exit`, `momentum`, `defi-yield`, `macro-guard`, `sniper`
- E2E test suite (`tests/e2e.ts`) — 9/9 tests pass against production
- `launch-agent.ts` example — full agent lifecycle
- Comprehensive README rewrite (~900 lines) with full API reference, pricing, and integration guide

### Fixed

- `deleteAgent()` / `deleteAutomation()` now use `DELETE` HTTP method (was `POST`)
- Default `baseUrl` corrected to `https://agents.clawpump.tech/api/v1`
- Model name in launch-agent example corrected to `meta-llama/llama-3.3-70b-instruct:free`
- `.env.example` now includes all environment variables used in examples
- `.npmignore` now excludes `tests/` directory

## [0.1.0] - 2026-04-21

### Added

- Initial SDK release
- `ClawpumpClient` class with API key authentication
- Price endpoint: `getPrice()`
- Swap endpoints: `getSwapQuote()`, `executeSwap()` (returns unsigned Solana transactions)
- Portfolio endpoint: `getPortfolio()`
- Signal endpoints: `getTopMovers()`, `getYieldOpportunities()`, `getMacroSignals()`, `getAnomalies()`
- Indicators endpoint: `getIndicators()` (RSI, EMA, SMA, MACD)
- Full TypeScript types for all requests and responses
- Error hierarchy: `AuthenticationError`, `RateLimitError`, `NotFoundError`, `ValidationError`, `InsufficientLiquidityError`, `ServerError`, `NetworkError`, `TimeoutError`
- Configurable retry with exponential backoff
- Dual ESM/CJS output
- Usage examples for common trading strategies

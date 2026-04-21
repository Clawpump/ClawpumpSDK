# @clawpump/sdk

The official TypeScript SDK for [ClawPump](https://agents.clawpump.tech) — the autonomous AI agent platform on Solana.

Launch AI trading agents that run 24/7, execute DeFi strategies across 11 DEXes, and manage their own Solana wallets. Integrate ClawPump into your app with a single npm package.

**What you can do with this SDK:**

- **Launch agents** — create autonomous AI agents hosted on ClawPump infrastructure
- **Choose strategies** — momentum trading, sniping, DeFi yield, macro hedging, monitor & exit
- **Chat with agents** — instruct them in natural language; they execute on-chain
- **Execute swaps** — non-custodial token swaps via Jupiter (you sign, we route)
- **Access market intelligence** — prices, technical indicators, signals, anomaly detection
- **Set automations** — price triggers and scheduled actions that fire automatically

```
npm install @clawpump/sdk
```

---

## Table of Contents

- [Quick Start](#quick-start)
- [Installation & Setup](#installation--setup)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
  - [Agent Management](#agent-management)
  - [Agent Chat](#agent-chat)
  - [Skills & Automations](#skills--automations)
  - [Market Intelligence](#market-intelligence)
  - [Swap Execution](#swap-execution)
- [Strategy Presets](#strategy-presets)
- [Skills Catalog](#skills-catalog)
- [Available Models](#available-models)
- [Automation System](#automation-system)
- [Swap Execution Guide](#swap-execution-guide)
- [Error Handling](#error-handling)
- [TypeScript Types](#typescript-types)
- [Configuration Best Practices](#configuration-best-practices)
- [Pricing & Commercial](#pricing--commercial)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)
- [Requirements](#requirements)
- [Contributing](#contributing)

---

## Quick Start

Five lines to your first AI agent:

```ts
import { ClawpumpClient } from "@clawpump/sdk";

const client = new ClawpumpClient({ apiKey: process.env.CLAWPUMP_API_KEY! });

const agent = await client.createAgent({ name: "My First Agent", strategy: "momentum" });
await client.startAgent(agent.id);
const reply = await client.sendMessage(agent.id, { message: "What tokens are trending?" });
console.log(reply.content);
```

That's it. Your agent is live on Solana with its own wallet, running a momentum trading strategy.

---

## Installation & Setup

### 1. Install the SDK

```bash
npm install @clawpump/sdk
```

Works with `yarn`, `pnpm`, and `bun` too:

```bash
yarn add @clawpump/sdk
pnpm add @clawpump/sdk
bun add @clawpump/sdk
```

### 2. Get your API key

Request an API key by emailing **dev@clawpump.tech** with:

- Your project name and description
- Expected monthly call volume
- Whether you need swap execution (trading) capabilities

For partnerships and commercial integrations, reach out to **partnerships@clawpump.tech** or DM [@clawpumptech](https://twitter.com/clawpumptech) on Twitter/X.

### 3. Configure the client

```ts
import { ClawpumpClient } from "@clawpump/sdk";

const client = new ClawpumpClient({
  apiKey: process.env.CLAWPUMP_API_KEY!,  // Required — your cpk_* API key
  baseUrl: "https://agents.clawpump.tech/api/v1", // Default — production API
  timeout: 30_000,   // Request timeout in ms (default: 30s)
  retries: 2,        // Retry on 5xx/network/timeout (default: 0, recommended: 2)
  retryDelay: 1_000, // Base delay between retries, doubles each attempt (default: 1s)
});
```

### 4. Set your environment variable

```bash
# .env
CLAWPUMP_API_KEY=cpk_your_key_here
```

---

## Core Concepts

### How agents work

Each ClawPump agent is an autonomous AI that:

1. **Has its own Solana wallet** — isolated, funded by you, used for on-chain actions
2. **Runs an LLM** — processes instructions, makes decisions, generates responses
3. **Has configurable skills** — trading, sniping, portfolio management, social posting, etc.
4. **Executes on-chain** — swaps tokens, launches coins, monitors positions — all autonomously
5. **Is hosted on ClawPump infrastructure** — you don't need to run any servers

### Non-custodial architecture

ClawPump never holds your private keys. When the SDK returns a swap transaction:

```
You call executeSwap()
    → ClawPump builds an unsigned Solana transaction
    → Returns it as base64 to your app
    → You sign it with YOUR wallet (Privy, Phantom, Backpack, etc.)
    → You broadcast to Solana RPC
    → ClawPump never touches the private key
```

### Agent lifecycle

```
createAgent()  →  Configure (updateAgent, skills, automations)
                        ↓
                  startAgent()  →  Agent is RUNNING (executing strategy)
                        ↓
                  sendMessage()  →  Chat, instruct, query
                        ↓
                  stopAgent()  →  Agent is STOPPED (paused)
                        ↓
                  deleteAgent()  →  Permanently removed
```

---

## API Reference

### Agent Management

#### `createAgent(params)`

Create a new AI agent. Each agent gets its own Solana wallet and LLM configuration.

```ts
const agent = await client.createAgent({
  name: "Momentum Alpha",              // Required — display name
  strategy: "momentum",                // Optional — auto-configures skills + persona
  model: "meta-llama/llama-3.3-70b-instruct:free", // Optional — defaults to platform default
  persona: "Aggressive momentum trader. Focus on tokens with >$50K liquidity.", // Optional
  systemPrompt: "You are a trading bot...", // Optional — overrides persona if set
  temperature: 0.7,                    // Optional — LLM temperature (0-1)
  skills: ["trading", "market-intelligence", "sniper"], // Optional — overrides strategy
});
```

**Response:**

```json
{
  "id": "f3ee44b1-a2c4-4e8f-9b1d-...",
  "name": "Momentum Alpha",
  "status": "stopped",
  "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "skills": ["trading", "market-intelligence", "sniper"],
  "model": "meta-llama/llama-3.3-70b-instruct:free",
  "persona": "Aggressive momentum trader...",
  "avatarUrl": null,
  "isPublic": false,
  "createdAt": "2026-04-21T12:00:00Z",
  "updatedAt": "2026-04-21T12:00:00Z",
  "meta": { "timestamp": "...", "requestId": "..." }
}
```

---

#### `getAgent(agentId)`

```ts
const agent = await client.getAgent("f3ee44b1-...");
```

---

#### `listAgents()`

Returns all agents owned by your API key.

```ts
const { agents } = await client.listAgents();
for (const agent of agents) {
  console.log(`${agent.name} (${agent.status}) — wallet: ${agent.walletAddress}`);
}
```

---

#### `updateAgent(agentId, params)`

Modify an agent's configuration. Only pass the fields you want to change.

```ts
await client.updateAgent("f3ee44b1-...", {
  name: "Conservative Bot",
  skills: ["portfolio", "market-intelligence"],
  persona: "Conservative trader. Never risk more than 5% per position.",
  temperature: 0.3,
  isPublic: true,
  publicDescription: "A cautious AI trader focused on capital preservation.",
});
```

---

#### `startAgent(agentId)` / `stopAgent(agentId)`

```ts
const started = await client.startAgent("f3ee44b1-...");
console.log(started.status); // "running"

const stopped = await client.stopAgent("f3ee44b1-...");
console.log(stopped.status); // "stopped"
```

---

#### `deleteAgent(agentId)`

Permanently removes the agent. **This cannot be undone.**

```ts
await client.deleteAgent("f3ee44b1-...");
```

---

### Agent Chat

#### `sendMessage(agentId, params)`

Send a message to an agent. The agent uses its LLM and enabled skills to respond — it can research markets, execute trades, analyze positions, and more.

```ts
const reply = await client.sendMessage("f3ee44b1-...", {
  message: "Buy 0.1 SOL worth of the top trending token right now",
  model: "deepseek/deepseek-chat",  // Optional — override model for this message
  temperature: 0.5,                  // Optional — override temperature
});

console.log(reply.content);
// "I found BONK trending +15% in the last hour with strong volume.
//  Executed a swap: 0.1 SOL → 42,735 BONK. Transaction: 5xK2..."

console.log(reply.usage);
// { promptTokens: 1250, completionTokens: 340, totalTokens: 1590 }

console.log(reply.cost);
// 0.0003 (in USD credits)
```

---

#### `getMessages(agentId, params?)`

Retrieve chat history with pagination.

```ts
const { messages, hasMore } = await client.getMessages("f3ee44b1-...", {
  limit: 50,                           // Max messages (default: 20)
  before: "2026-04-21T12:00:00Z",     // Pagination cursor
});

for (const msg of messages) {
  console.log(`[${msg.role}] ${msg.content.slice(0, 100)}...`);
}

if (hasMore) {
  // Fetch next page using the oldest message's createdAt
  const nextPage = await client.getMessages("f3ee44b1-...", {
    limit: 50,
    before: messages.at(-1)?.createdAt,
  });
}
```

---

### Skills & Automations

#### `listSkills()`

Get the full catalog of available skills.

```ts
const { skills } = await client.listSkills();
// [
//   { slug: "trading", name: "Trading", description: "Swap, arbitrage...", alwaysOn: false },
//   { slug: "portfolio", name: "Portfolio Management", ... },
//   ...
// ]
```

---

#### `createAutomation(params)`

Create price triggers or scheduled actions. See [Automation System](#automation-system) for details.

```ts
const automation = await client.createAutomation({
  agentId: "f3ee44b1-...",
  name: "SOL take-profit at $200",
  trigger: {
    type: "price_threshold",
    mint: "So11111111111111111111111111111111111111112",
    operator: "gte",
    priceUsd: 200,
  },
  action: {
    type: "agent_prompt",
    prompt: "SOL hit $200! Sell 50% of our SOL position for USDC.",
  },
  triggerOnce: true,
});
```

---

#### `listAutomations(agentId)` / `deleteAutomation(automationId)`

```ts
const { automations } = await client.listAutomations("f3ee44b1-...");
await client.deleteAutomation("auto_456-...");
```

---

### Market Intelligence

#### `getPrice(params)`

Real-time price for any SPL token on Solana.

```ts
const sol = await client.getPrice({
  mint: "So11111111111111111111111111111111111111112",
  currency: "usd",  // Default
});
// { mint, symbol: "SOL", name: "Solana", price: 148.52,
//   change24h: 0.05, volume24h: 2800000000, marketCap: 68000000000 }
```

---

#### `getTopMovers(params?)`

Trending tokens by price action and volume.

```ts
const { movers } = await client.getTopMovers({
  timeframe: "1h",         // "1h" | "4h" | "24h"
  limit: 10,               // Max 100
  sortBy: "gainers",       // "gainers" | "losers" | "volume"
  minLiquidity: 50_000,    // Filter illiquid tokens (USD)
});
// movers: [{ mint, symbol, name, price, change, volume, marketCap, liquidity }]
```

---

#### `getIndicators(params)`

Technical analysis: RSI, EMA, SMA, MACD.

```ts
const { indicators } = await client.getIndicators({
  mint: "So11111111111111111111111111111111111111112",
  indicators: ["rsi", "ema", "macd"],
  timeframe: "1h",    // "1m" | "5m" | "15m" | "1h" | "4h" | "1d"
  period: 14,          // Moving average period
});

for (const ind of indicators) {
  if (ind.indicator === "rsi") {
    console.log(`RSI: ${ind.value} (${ind.signal})`); // "RSI: 34.2 (oversold)"
  }
  if (ind.indicator === "macd") {
    console.log(`MACD: ${ind.macd}, Signal: ${ind.signal}, Trend: ${ind.trend}`);
  }
}
```

---

#### `getYieldOpportunities(params?)` / `getMacroSignals(params?)` / `getAnomalies(params?)`

```ts
// DeFi yield across Solana protocols
const { opportunities } = await client.getYieldOpportunities({ minApy: 5, limit: 10 });
// [{ protocol: "Marinade", pool: "mSOL/SOL", apy: 7.2, tvl: 125000000, risk: "low" }]

// Macro-level market health
const { signals } = await client.getMacroSignals({ include: ["fear_greed", "etf_flows"] });
// [{ category: "fear_greed", value: 35, sentiment: "bearish", updatedAt: "..." }]

// On-chain anomaly detection
const { anomalies } = await client.getAnomalies({
  timeframe: "1h",
  types: ["whale_movement", "liquidity_spike"],
  limit: 5,
});
// [{ type: "whale_movement", mints: ["EPjF..."], severity: 0.8, description: "..." }]
```

---

### Swap Execution

#### `getSwapQuote(params)`

Preview a swap before executing.

```ts
const quote = await client.getSwapQuote({
  inputMint: "So11111111111111111111111111111111111111112",     // SOL
  outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",  // USDC
  amount: "100000000",    // 0.1 SOL in lamports
  slippageBps: 50,        // 0.5% slippage tolerance
});
// { inputAmount: "100000000", outputAmount: "14852000000",
//   priceImpact: 0.002, routes: [{ source: "Jupiter", percentage: 100 }],
//   expiresIn: 60 }
```

---

#### `executeSwap(params)`

Execute a swap. Returns an **unsigned Solana transaction** for you to sign and broadcast.

```ts
const { unsignedTransaction, expiresAt, outputAmount, priceImpact } =
  await client.executeSwap({
    inputMint: "So11111111111111111111111111111111111111112",
    outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    amount: "100000000",
    slippageBps: 50,
    userWallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  });

// unsignedTransaction = base64-encoded Solana transaction
// Sign with your wallet and submit to Solana RPC
// See "Swap Execution Guide" below for complete signing examples
```

---

#### `getPortfolio(params)`

All token holdings for any Solana wallet.

```ts
const portfolio = await client.getPortfolio({
  wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
});

console.log(`Total: $${portfolio.totalValueUsd}`);
console.log(`SOL: ${portfolio.solBalance}`);
for (const token of portfolio.holdings) {
  console.log(`  ${token.symbol}: ${token.uiBalance} ($${token.valueUsd})`);
}
```

---

## Strategy Presets

Use `strategy` when creating an agent for one-line setup. Each preset auto-configures skills and persona.

| Preset | Description | Skills enabled | Best for |
|--------|-------------|---------------|----------|
| `monitor-exit` | Watch a token, sell at take-profit or stop-loss | portfolio, market-intelligence, wallet | Position management |
| `momentum` | Buy trending tokens using RSI/EMA signals | portfolio, market-intelligence, wallet, trading, sniper | Active trading |
| `defi-yield` | Deploy capital into highest-yield opportunities | portfolio, market-intelligence, wallet, trading | Yield farming |
| `macro-guard` | Rotate to stables when macro turns bearish | portfolio, market-intelligence, wallet, trading | Risk management |
| `sniper` | Small fast positions on new liquidity/anomalies | portfolio, market-intelligence, wallet, trading, sniper | New token launches |

**When to use presets vs custom skills:**

- Use presets for standard trading strategies — they're tested and balanced
- Use custom `skills` array when you need a specific combination (e.g., trading + social for a bot that trades AND tweets)

```ts
// Preset approach (recommended for most cases)
const agent = await client.createAgent({ name: "Bot", strategy: "momentum" });

// Custom skills approach (full control)
const agent = await client.createAgent({
  name: "Bot",
  skills: ["trading", "social", "portfolio", "market-intelligence"],
});
```

---

## Skills Catalog

| Slug | Name | What it enables |
|------|------|----------------|
| `trading` | Trading | Swap tokens via Jupiter, arbitrage, liquidity operations on Solana DEXes |
| `token-launch` | Token Launch | Launch new tokens via pump.fun |
| `portfolio` | Portfolio Management | Balance tracking, P&L analysis, portfolio rebalancing |
| `market-intelligence` | Market Intelligence | Real-time price feeds, trend analysis, market signals |
| `social` | Social Media | Post to Twitter/X, monitor mentions and engagement |
| `sniper` | Token Sniper | New token launch detection, security evaluation, early entry |
| `wallet` | Wallet Operations | Transfer tokens, check balances, manage wallet operations |
| `image-generation` | Image Generation | Generate images from text prompts for avatars, content, and social posts |

---

## Available Models

### Free tier (no credit cost)

| Model | Context Window | Tool Calling |
|-------|---------------|--------------|
| `meta-llama/llama-3.3-70b-instruct:free` | 65K | Yes |
| `qwen/qwen3-next-80b-a3b-instruct:free` | 262K | Yes |
| `z-ai/glm-4.5-air:free` | 131K | Yes |
| `openai/gpt-oss-120b:free` | 131K | Yes |

### Paid tier (billed per-token from your credit balance)

| Model | Input / 1M tokens | Output / 1M tokens |
|-------|-------------------|---------------------|
| `deepseek/deepseek-chat` | $0.18 | $0.36 |
| `moonshotai/kimi-k2.5` | $0.59 | $2.86 |
| `deepseek/deepseek-r1` | $0.72 | $2.85 |
| `openai/gpt-5.4-mini` | $0.98 | $5.85 |
| `anthropic/claude-haiku-4.5` | $1.30 | $6.50 |
| `openai/gpt-5.4` | $3.25 | $19.50 |
| `anthropic/claude-sonnet-4.6` | $3.90 | $19.50 |
| `anthropic/claude-opus-4.6` | $6.50 | $32.50 |

If no model is specified, agents default to a free tier model.

---

## Automation System

Automations let agents react to market conditions or time-based events without manual intervention.

### Price threshold trigger

Fire when a token hits a price target:

```ts
await client.createAutomation({
  agentId: agent.id,
  name: "SOL crash protection",
  trigger: {
    type: "price_threshold",
    mint: "So11111111111111111111111111111111111111112", // SOL
    operator: "lte",    // "lte" (<=) or "gte" (>=)
    priceUsd: 80,
  },
  action: {
    type: "agent_prompt",
    prompt: "EMERGENCY: SOL dropped below $80. Sell all non-stablecoin positions for USDC.",
  },
  triggerOnce: true,    // Fire once, then mark completed
});
```

### Scheduled trigger

Fire at a specific time:

```ts
await client.createAutomation({
  agentId: agent.id,
  name: "Daily portfolio rebalance",
  trigger: {
    type: "schedule",
    scheduledAt: "2026-04-22T09:00:00Z",
  },
  action: {
    type: "agent_prompt",
    prompt: "Rebalance: ensure no single position exceeds 25% of total portfolio value.",
  },
});
```

### Action types

| Action | Description |
|--------|-------------|
| `agent_prompt` | Send a message to the agent as if you chatted with it. The agent processes the prompt using its LLM and skills. |
| `tool_call` | Directly invoke a specific tool with arguments (advanced). |

---

## Swap Execution Guide

ClawPump is fully non-custodial. When you call `executeSwap()`, you receive an **unsigned Solana transaction** that you sign with your own wallet.

### The flow

```
1. Your app calls client.executeSwap({ userWallet: "..." })
2. ClawPump builds the optimal swap route (via Jupiter)
3. Returns a base64-encoded unsigned transaction
4. Your app deserializes it → signs it → broadcasts to Solana
5. ClawPump NEVER has access to your private keys
```

### Signing with Privy (server-side embedded wallets)

```ts
// Step 1: Get the unsigned transaction from ClawPump
const { unsignedTransaction } = await client.executeSwap({
  inputMint: "So11111111111111111111111111111111111111112",
  outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  amount: "100000000",
  userWallet: AGENT_WALLET,
});

// Step 2: Sign via Privy
const signResponse = await fetch(
  `https://auth.privy.io/api/v1/wallets/${PRIVY_WALLET_ID}/rpc`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "privy-app-id": PRIVY_APP_ID,
      Authorization: `Basic ${Buffer.from(`${PRIVY_APP_ID}:${PRIVY_APP_SECRET}`).toString("base64")}`,
    },
    body: JSON.stringify({
      method: "signTransaction",
      params: { transaction: unsignedTransaction, encoding: "base64" },
    }),
  },
);
const { data } = await signResponse.json();

// Step 3: Submit to Solana
import { Connection } from "@solana/web3.js";
const connection = new Connection("https://api.mainnet-beta.solana.com");
const txBuffer = Buffer.from(data.signedTransaction, "base64");
const txId = await connection.sendRawTransaction(txBuffer);
console.log(`https://solscan.io/tx/${txId}`);
```

### Signing with Phantom (browser)

```ts
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";

const { signTransaction, publicKey } = useWallet();

const { unsignedTransaction } = await client.executeSwap({
  inputMint: SOL_MINT,
  outputMint: USDC_MINT,
  amount: "100000000",
  userWallet: publicKey.toBase58(),
});

const tx = Transaction.from(Buffer.from(unsignedTransaction, "base64"));
const signed = await signTransaction(tx);
const txId = await connection.sendRawTransaction(signed.serialize());
```

### Platform fees

A small swap fee is automatically embedded in each transaction. The fee varies by your API tier:

| Tier | Fee |
|------|-----|
| Free | 0.85% |
| Builder | 0.50% |
| Scale | 0.30% |
| Enterprise | Custom |

The fee is deducted from the swap output amount. The `outputAmount` returned by `executeSwap()` already reflects the fee. No additional billing integration is needed.

---

## Error Handling

All SDK errors extend `ClawpumpError`. Import and catch specific types:

```ts
import {
  ClawpumpClient,
  AuthenticationError,
  RateLimitError,
  InsufficientLiquidityError,
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ServerError,
} from "@clawpump/sdk";

try {
  await client.executeSwap({ ... });
} catch (error) {
  if (error instanceof AuthenticationError) {
    // 401 — Your API key is invalid or deactivated
    console.error("Bad API key:", error.message);
  } else if (error instanceof ForbiddenError) {
    // 403 — Your tier doesn't include this endpoint
    console.error("Upgrade your tier:", error.message);
  } else if (error instanceof NotFoundError) {
    // 404 — Unknown agent ID, mint address, or resource
    console.error("Not found:", error.message);
  } else if (error instanceof ValidationError) {
    // 422 — Bad parameters
    console.error("Invalid params:", error.message, error.fieldErrors);
  } else if (error instanceof InsufficientLiquidityError) {
    // 422 — Not enough liquidity to fill the swap
    console.error("No liquidity:", error.message);
  } else if (error instanceof RateLimitError) {
    // 429 — Monthly call limit exceeded
    console.error(`Rate limited. Retry after: ${error.retryAfter}`);
  } else if (error instanceof ServerError) {
    // 5xx — ClawPump internal error (retryable)
    console.error("Server error:", error.message, "Request ID:", error.requestId);
  }
}
```

### Error reference

| Error | HTTP | Retryable | When |
|-------|------|-----------|------|
| `AuthenticationError` | 401 | No | Invalid or missing API key |
| `ForbiddenError` | 403 | No | Endpoint not included in your tier |
| `NotFoundError` | 404 | No | Unknown agent, mint, or resource |
| `ValidationError` | 422 | No | Bad request parameters |
| `InsufficientLiquidityError` | 422 | No | Swap can't be filled |
| `RateLimitError` | 429 | Yes | Monthly call limit exceeded |
| `ServerError` | 5xx | Yes | Internal server error |
| `NetworkError` | — | Yes | DNS failure, connection refused |
| `TimeoutError` | — | Yes | Request exceeded timeout |

### Debugging

Every response includes a `requestId` in the `meta` field. Include this when contacting support:

```ts
try {
  await client.getAgent("bad-id");
} catch (error) {
  if (error instanceof ClawpumpError) {
    console.log("Request ID:", error.requestId); // Include this in bug reports
  }
}
```

---

## TypeScript Types

All types are fully exported. Import what you need:

```ts
import type {
  // Client config
  ClawpumpClientConfig,

  // Agent types
  CreateAgentParams,
  UpdateAgentParams,
  AgentResponse,
  AgentListResponse,
  AgentStatus,       // "running" | "stopped" | "error"
  SkillSlug,         // "trading" | "token-launch" | "portfolio" | ...
  StrategyPreset,    // "monitor-exit" | "momentum" | "defi-yield" | ...

  // Chat types
  SendMessageParams,
  ChatMessageResponse,
  GetMessagesParams,
  MessagesResponse,
  MessageEntry,

  // Skills & Automations
  SkillInfo,
  SkillCatalogResponse,
  CreateAutomationParams,
  AutomationResponse,
  AutomationListResponse,
  AutomationStatus,

  // Market intelligence
  GetPriceParams,
  PriceResponse,
  TopMoversParams,
  TopMoversResponse,
  TopMover,
  YieldParams,
  YieldResponse,
  YieldOpportunity,
  MacroSignalsParams,
  MacroSignalsResponse,
  MacroSignal,
  AnomaliesParams,
  AnomaliesResponse,
  Anomaly,

  // Technical indicators
  GetIndicatorsParams,
  IndicatorsResponse,
  IndicatorType,       // "rsi" | "ema" | "sma" | "macd"
  IndicatorValue,      // RSIValue | EMAValue | SMAValue | MACDValue
  RSIValue,
  EMAValue,
  SMAValue,
  MACDValue,

  // Swap
  SwapQuoteParams,
  SwapQuoteResponse,
  SwapExecuteParams,
  SwapExecuteResponse,
  SwapRoute,

  // Portfolio
  GetPortfolioParams,
  PortfolioResponse,
  TokenHolding,

  // Common
  ApiMeta,
} from "@clawpump/sdk";
```

---

## Configuration Best Practices

### Production

```ts
const client = new ClawpumpClient({
  apiKey: process.env.CLAWPUMP_API_KEY!,
  retries: 2,          // Handle transient failures
  retryDelay: 1_000,   // 1s → 2s → 4s backoff
  timeout: 30_000,     // 30s for most endpoints
});
```

### Cron-based agents (like OMZO)

```ts
const client = new ClawpumpClient({
  apiKey: process.env.CLAWPUMP_API_KEY!,
  retries: 2,          // Critical — a single failure shouldn't skip a tick
  timeout: 15_000,     // Faster timeout to leave room for retries within 60s tick
});
```

### Testing with custom fetch

```ts
// Mock fetch for unit tests
const mockFetch = async (url: string, init?: RequestInit) => {
  return new Response(JSON.stringify({ skills: [] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

const client = new ClawpumpClient({
  apiKey: "cpk_test_key",
  fetch: mockFetch,
});
```

### Older Node.js (< 18)

```ts
import fetch from "node-fetch";

const client = new ClawpumpClient({
  apiKey: process.env.CLAWPUMP_API_KEY!,
  fetch: fetch as unknown as typeof globalThis.fetch,
});
```

---

## Pricing & Commercial

### Tiers

| | Free | Builder | Scale | Enterprise |
|---|---|---|---|---|
| **Monthly cost** | $0 | $49 | $199 | Custom |
| **API calls/month** | 1,000 | 50,000 | 500,000 | Unlimited |
| **Agents** | 1 | 5 | 25 | Unlimited |
| **Swap fee** | 0.85% | 0.50% | 0.30% | Custom |
| **Endpoints** | Price + Portfolio | All | All + priority | All + SLA |
| **Support** | Community | Email | Priority email | Dedicated + Slack |

### How to get started

1. **Free tier** — email **dev@clawpump.tech** with your project name. We'll generate a `cpk_*` key.
2. **Builder/Scale** — same email, specify your expected volume. Payment via SOL/USDC.
3. **Enterprise** — email **partnerships@clawpump.tech** for custom pricing, SLA, webhooks, and dedicated support.

### Partnership integrations

If you're building a platform that wants to let your users launch ClawPump agents (like OMZO), we offer:

- **White-label agent deployment** — your users create agents through your UI, hosted on our infra
- **Revenue sharing** — earn a percentage of swap fees from agents deployed through your platform
- **Custom skill development** — we can build custom skills for your use case
- **Co-marketing** — joint announcements, shared documentation, integration showcases

Contact **partnerships@clawpump.tech** or DM [@clawpumptech](https://twitter.com/clawpumptech).

### How swap fees work

Swap fees are embedded directly in the unsigned transaction. When you call `executeSwap()`:

1. ClawPump builds the swap transaction via Jupiter
2. A platform fee instruction is added that sends a percentage of the output to ClawPump
3. The `outputAmount` in the response already reflects the fee deduction
4. You sign and broadcast the transaction as-is — no separate payment needed

The fee percentage depends on your API tier (see table above).

---

## Rate Limiting

### How limits work

- Each API key has a monthly call limit based on its tier
- Every API call (including GET requests) counts toward the limit
- Limits reset on the 1st of each month (UTC)
- When you exceed your limit, all calls return `429 RateLimitError`

### Handling rate limits

```ts
import { RateLimitError } from "@clawpump/sdk";

try {
  await client.createAgent({ name: "Bot", strategy: "momentum" });
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Limit exceeded. Resets: ${new Date(error.retryAfter!).toISOString()}`);
    // Upgrade your tier or wait for monthly reset
  }
}
```

### Built-in retry

The SDK automatically retries `429` responses when `retries > 0` is configured. It respects the `Retry-After` header from the server.

---

## Examples

Complete, runnable example scripts in [`examples/`](./examples):

| Example | Description |
|---------|-------------|
| **[launch-agent.ts](./examples/launch-agent.ts)** | Full lifecycle: create agent, set automation, start, chat, list agents |
| **[momentum-strategy.ts](./examples/momentum-strategy.ts)** | Cron-style tick: top movers → RSI check → quote → swap |
| **[swap-with-privy.ts](./examples/swap-with-privy.ts)** | Unsigned transaction → Privy server-side signing → Solana broadcast |
| **[monitor-and-exit.ts](./examples/monitor-and-exit.ts)** | Watch a position, sell at take-profit or stop-loss |
| **[basic-price-check.ts](./examples/basic-price-check.ts)** | Simplest usage — get SOL and USDC prices |

Run any example:

```bash
CLAWPUMP_API_KEY=cpk_... npx tsx examples/launch-agent.ts
```

---

## Requirements

- **Node.js 18+** (uses native `fetch`)
- **TypeScript 5+** (for full type support)
- Also works with **Deno**, **Bun**, and **modern browsers**

---

## Contributing

Found a bug or want a feature? [Open an issue](https://github.com/Clawpump/ClawpumpSDK/issues).

Want to contribute code? Fork, branch, PR. All contributions welcome.

---

## Links

- **Platform**: [agents.clawpump.tech](https://agents.clawpump.tech)
- **SDK repo**: [github.com/Clawpump/ClawpumpSDK](https://github.com/Clawpump/ClawpumpSDK)
- **Twitter/X**: [@clawpumptech](https://twitter.com/clawpumptech)
- **API keys & support**: dev@clawpump.tech
- **Partnerships**: partnerships@clawpump.tech

## License

MIT

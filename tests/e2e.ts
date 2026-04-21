/**
 * End-to-end test for the ClawPump SDK.
 *
 * Tests the full agent lifecycle against the production API:
 *   listSkills → createAgent → getAgent → listAgents → startAgent →
 *   sendMessage → getMessages → stopAgent → deleteAgent
 *
 * Usage:
 *   CLAWPUMP_API_KEY=cpk_xxx CLAWPUMP_BASE_URL=https://agents.clawpump.tech/api/v1 npx tsx tests/e2e.ts
 */

// Use the local build instead of npm package
import { ClawpumpClient } from "../src/index.js";
import type { AgentResponse } from "../src/index.js";

const API_KEY = process.env.CLAWPUMP_API_KEY;
const BASE_URL =
  process.env.CLAWPUMP_BASE_URL ?? "https://agents.clawpump.tech/api/v1";

if (!API_KEY) {
  console.error("ERROR: Set CLAWPUMP_API_KEY environment variable");
  process.exit(1);
}

const client = new ClawpumpClient({
  apiKey: API_KEY,
  baseUrl: BASE_URL,
  timeout: 60_000,
  retries: 1,
});

let createdAgentId: string | null = null;
let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>) {
  process.stdout.write(`  ${name} ... `);
  try {
    await fn();
    console.log("PASS");
    passed++;
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : JSON.stringify(error);
    console.log(`FAIL: ${msg}`);
    failed++;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function main() {
  console.log(`\nClawPump SDK E2E Test`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API Key:  ${API_KEY!.slice(0, 12)}...`);
  console.log(`─────────────────────────────────\n`);

  // ── Skills Catalog ──────────────────────────────────────
  await test("listSkills returns skill catalog", async () => {
    const { skills } = await client.listSkills();
    assert(Array.isArray(skills), "skills should be an array");
    assert(skills.length >= 5, `expected >=5 skills, got ${skills.length}`);
    const slugs = skills.map((s) => s.slug);
    assert(slugs.includes("trading"), "should include 'trading' skill");
    assert(
      slugs.includes("market-intelligence"),
      "should include 'market-intelligence' skill",
    );
  });

  // ── Create Agent ────────────────────────────────────────
  let agent: AgentResponse;
  await test("createAgent with momentum strategy", async () => {
    agent = await client.createAgent({
      name: "SDK E2E Test Bot",
      strategy: "momentum",
      persona: "Test agent for SDK E2E validation. Do not trade.",
    });
    createdAgentId = agent.id;
    assert(typeof agent.id === "string", "agent should have an id");
    assert(agent.name === "SDK E2E Test Bot", `name mismatch: ${agent.name}`);
    assert(
      agent.status === "stopped" || agent.status === "running",
      `unexpected status: ${agent.status}`,
    );
    console.log(`(id: ${agent.id.slice(0, 8)}...) `);
  });

  if (!createdAgentId) {
    console.log("\n  Skipping remaining tests — agent creation failed.\n");
    return;
  }

  // ── Get Agent ───────────────────────────────────────────
  await test("getAgent returns the created agent", async () => {
    const fetched = await client.getAgent(createdAgentId!);
    assert(fetched.id === createdAgentId, "id should match");
    assert(
      fetched.name === "SDK E2E Test Bot",
      `name mismatch: ${fetched.name}`,
    );
  });

  // ── List Agents ─────────────────────────────────────────
  await test("listAgents includes the created agent", async () => {
    const { agents } = await client.listAgents();
    assert(Array.isArray(agents), "agents should be an array");
    const found = agents.find((a) => a.id === createdAgentId);
    assert(!!found, "created agent should appear in listAgents");
  });

  // ── Start Agent ─────────────────────────────────────────
  await test("startAgent changes status to running", async () => {
    const started = await client.startAgent(createdAgentId!);
    assert(
      started.status === "running",
      `expected running, got ${started.status}`,
    );
  });

  // ── Send Message ────────────────────────────────────────
  await test("sendMessage gets a response", async () => {
    const reply = await client.sendMessage(createdAgentId!, {
      message: "Hello! What skills do you have?",
    });
    assert(typeof reply.content === "string", "reply should have content");
    assert(reply.content.length > 0, "reply content should not be empty");
    assert(reply.role === "assistant", `expected assistant role, got ${reply.role}`);
    console.log(`(${reply.content.slice(0, 50)}...) `);
  });

  // ── Get Messages ────────────────────────────────────────
  await test("getMessages returns chat history", async () => {
    const { messages } = await client.getMessages(createdAgentId!, {
      limit: 10,
    });
    assert(Array.isArray(messages), "messages should be an array");
    assert(messages.length >= 1, "should have at least 1 message");
  });

  // ── Stop Agent ──────────────────────────────────────────
  await test("stopAgent changes status to stopped", async () => {
    const stopped = await client.stopAgent(createdAgentId!);
    assert(
      stopped.status === "stopped",
      `expected stopped, got ${stopped.status}`,
    );
  });

  // ── Delete Agent ────────────────────────────────────────
  await test("deleteAgent removes the agent", async () => {
    await client.deleteAgent(createdAgentId!);
    createdAgentId = null; // Don't try to clean up again
  });

  // ── Summary ─────────────────────────────────────────────
  console.log(`\n─────────────────────────────────`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`─────────────────────────────────\n`);

  process.exit(failed > 0 ? 1 : 0);
}

// Cleanup on exit (delete agent if test crashes mid-way)
process.on("SIGINT", async () => {
  if (createdAgentId) {
    console.log(`\nCleaning up agent ${createdAgentId}...`);
    try {
      await client.deleteAgent(createdAgentId);
    } catch {
      // ignore
    }
  }
  process.exit(1);
});

main().catch(async (err) => {
  console.error("Fatal error:", err);
  if (createdAgentId) {
    console.log(`Cleaning up agent ${createdAgentId}...`);
    try {
      await client.deleteAgent(createdAgentId);
    } catch {
      // ignore
    }
  }
  process.exit(1);
});

import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const agents = [
  ["Signal Scout", "Product", "Trend researcher", "active", "Claude 3.7 Sonnet", JSON.stringify(["Web search", "Notion"]), "cyan"],
  ["Pipeline Pilot", "Growth", "Lead qualification", "active", "GPT-4.1", JSON.stringify(["HubSpot", "Email"]), "violet"],
  ["Care Concierge", "Support", "Customer responder", "active", "GPT-4.1 mini", JSON.stringify(["Intercom", "Knowledge base"]), "amber"],
  ["Release Ranger", "Engineering", "QA evaluator", "paused", "Claude 3.7 Sonnet", JSON.stringify(["GitHub", "CI runner"]), "emerald"],
  ["Ledger Lens", "Finance", "Invoice analyst", "active", "Gemini 2.5 Pro", JSON.stringify(["Drive", "Accounting"]), "rose"],
  ["Brand Beacon", "Marketing", "Content strategist", "active", "GPT-4.1", JSON.stringify(["Drive", "Social scheduler"]), "blue"],
];

for (const row of agents) {
  await connection.execute(`INSERT INTO agents (name, department, role, status, model, allowedTools, accent) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE department=VALUES(department), role=VALUES(role), status=VALUES(status), model=VALUES(model), allowedTools=VALUES(allowedTools), accent=VALUES(accent)`, row);
}

const [agentRows] = await connection.query("SELECT id, name FROM agents");
const agentId = Object.fromEntries(agentRows.map((row) => [row.name, row.id]));
const policies = [
  ["Signal Scout", "Tier 1", 200, "Internal"],
  ["Pipeline Pilot", "Tier 2", 150, "Confidential"],
  ["Care Concierge", "Tier 3", 80, "Restricted"],
  ["Release Ranger", "Tier 3", 500, "Confidential"],
  ["Ledger Lens", "Tier 4", 250, "Restricted"],
  ["Brand Beacon", "Tier 1", 200, "Internal"],
];
for (const [name, tier, spend, classification] of policies) {
  await connection.execute(`INSERT INTO policies (agentId, approvalTier, spendLimitCents, dataClassification, lastReviewDate) SELECT ?, ?, ?, ?, CURRENT_TIMESTAMP FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM policies WHERE agentId = ?)`, [agentId[name], tier, spend, classification, agentId[name]]);
}

const runs = [
  ["RUN-4821", "Pipeline Pilot", "Qualify inbound leads from last 24 hours", "high", "Tier 2", "running", "Enriching company profiles", 161, 18],
  ["RUN-4819", "Care Concierge", "Draft responses for escalated conversations", "urgent", "Tier 3", "waiting_approval", "Human approval required", 496, 42],
  ["RUN-4817", "Signal Scout", "Synthesize mobile onboarding feedback", "normal", "Tier 1", "completed", "Report delivered", 848, 77],
  ["RUN-4816", "Brand Beacon", "Generate three launch angles for Q3", "normal", "Tier 2", "running", "Drafting campaign variants", 272, 31],
  ["RUN-4812", "Release Ranger", "Run regression checks on release branch", "high", "Tier 3", "paused", "Paused by emergency stop", 1135, 124],
];
for (const [key, name, task, priority, tier, status, step, elapsed, cost] of runs) {
  await connection.execute(`INSERT INTO agentRuns (runKey, agentId, task, priority, tierLevel, status, currentStep, elapsedSeconds, costCents) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE agentId=VALUES(agentId), task=VALUES(task), priority=VALUES(priority), tierLevel=VALUES(tierLevel), status=VALUES(status), currentStep=VALUES(currentStep), elapsedSeconds=VALUES(elapsedSeconds), costCents=VALUES(costCents)`, [key, agentId[name], task, priority, tier, status, step, elapsed, cost]);
}

const approvals = [
  ["APR-091", "RUN-4819", "Care Concierge", "Send a refund apology to customer", "Intercom.send_message", JSON.stringify({ conversation_id: 8841, tone: "empathetic", refund: 49 }), "3 similar cases resolved · policy KB-14", "Tier 3", 18],
  ["APR-090", "RUN-4821", "Pipeline Pilot", "Create a qualified opportunity in CRM", "HubSpot.create_deal", JSON.stringify({ company: "Arcfield", value: 18000, stage: "qualified" }), "Website intent + pricing page visit", "Tier 2", 42],
  ["APR-089", "RUN-4816", "Brand Beacon", "Schedule campaign post for review", "Social.schedule_draft", JSON.stringify({ channel: "LinkedIn", audience: 42800, publish: "Friday 09:00" }), "Brand checklist 12/12 · claims verified", "Tier 2", 1440],
];
for (const [key, runKey, name, action, tool, params, evidence, risk, deadlineMinutes] of approvals) {
  await connection.execute(`INSERT INTO approvals (approvalKey, runId, agentId, proposedAction, toolName, parameters, evidence, riskTier, deadline) SELECT ?, r.id, ?, ?, ?, ?, ?, ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? MINUTE) FROM agentRuns r WHERE r.runKey = ? AND NOT EXISTS (SELECT 1 FROM approvals WHERE approvalKey = ?)`, [key, agentId[name], action, tool, params, evidence, risk, deadlineMinutes, runKey, key]);
}

await connection.execute(`INSERT INTO workspaceState (id, globalKillSwitch, updatedBy) VALUES (1, 0, 'System') ON DUPLICATE KEY UPDATE id=id`);
await connection.end();
console.log("Demo data seeded idempotently.");
process.exit(0);

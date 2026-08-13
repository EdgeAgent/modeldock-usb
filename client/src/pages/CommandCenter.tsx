import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { isOfflineMode, subscribeToExecutionMode, type ExecutionMode } from "@/lib/executionMode";
import { getWorkflowLaunchGuard } from "@/lib/workflowLaunchGuard";
import { Activity, AlertTriangle, ArrowDown, ArrowUp, Bot, CheckCircle2, Clock3, Command, FileCheck2, Loader2, Pause, Play, Pencil, Plus, ShieldAlert, Sparkles, TimerReset, Trash2, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useRealtime } from "@/hooks/useRealtime";

const suggestions = [
  "Launch Signal Scout to synthesize the latest onboarding feedback, priority normal, tier 1",
  "What is running right now?",
  "Show my approval queue",
  "Pause RUN-4821",
];

const quickTemplates = [
  { label: "Weekly agency operations", prompt: "Run weekly agency operations with Signal Scout, then have Campaign Architect draft the next campaign, then have Delivery Steward prepare the client update for review, priority normal, tier 1" },
  { label: "Client proposal pipeline", prompt: "Launch Client Intake to scope the request, then Proposal Writer to draft the proposal, then Delivery Steward package the output for approval, priority high, tier 2" },
  { label: "Launch campaign safely", prompt: "Have Campaign Architect plan the campaign, then Signal Scout validate the audience, then publish the campaign for human approval, priority high, tier 3" },
];

type TemplateStepDraft = { stepKey: string; position: number; name: string; stepType: "agent"; agentId: number | null; config: Record<string, unknown>; requiresApproval: number };

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining.toString().padStart(2, "0")}s`;
}

function parseWorkflowPlan(command: string, availableAgents: Array<{ id: number; name: string; status: "active" | "paused"; model?: string | null }>) {
  const segments = command.split(/\s+(?:then|after that|next)\s+|\s*;\s*/i).map((segment) => segment.trim()).filter(Boolean);
  return segments.map((segment, index) => {
    const normalized = segment.toLowerCase();
    const agent = availableAgents.find((item) => normalized.includes(item.name.toLowerCase())) || availableAgents.find((item) => item.status === "active");
    const priority = normalized.includes("urgent") ? "urgent" : normalized.includes("high") ? "high" : normalized.includes("low") ? "low" : "normal";
    const tierMatch = normalized.match(/tier\s*([0-3])/);
    const tierLevel = tierMatch ? `Tier ${tierMatch[1]}` : "Tier 1";
    const requiresApproval = /approval|review|publish|send|delete|refund|external/i.test(segment) || tierLevel === "Tier 3";
    const task = segment.replace(/^(please\s+)?(launch|start|run|ask|have)\s+/i, "").replace(agent ? new RegExp(agent.name, "i") : /$^/, "").replace(/^\s*(to|for)\s+/i, "").replace(/,?\s*(priority\s+(urgent|high|normal|low))?/i, "").replace(/,?\s*tier\s*[0-3]/i, "").trim() || `Complete workflow step ${index + 1}`;
    return { index, agent, task, priority, tierLevel, requiresApproval };
  }).filter((step) => step.agent);
}

export default function CommandCenter() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([
    { role: "system", content: "You are the Agent Ops Desk command assistant. Never bypass approval gates or emergency stops." },
    { role: "assistant", content: "Command center ready. Tell me what you want to run, pause, inspect, or approve. I will keep every action inside the workspace guardrails." },
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [executionMode, setExecutionMode] = useState<ExecutionMode>(() => isOfflineMode() ? "offline" : "cloud");
  useEffect(() => subscribeToExecutionMode(setExecutionMode), []);
  const [planPreview, setPlanPreview] = useState<Array<{ index: number; agent?: { id: number; name: string }; task: string; priority: string; tierLevel: string; requiresApproval: boolean }>>([]);
  const previousRunSnapshot = useRef("");
  const { data: agents } = trpc.agents.list.useQuery();
  const { data: runs, isLoading: runsLoading, isError: runsError } = trpc.runs.list.useQuery(undefined, { refetchInterval: 2500 });
  const { data: approvals } = trpc.approvals.list.useQuery(undefined, { refetchInterval: 5000 });
  const { data: emergency } = trpc.emergency.state.useQuery(undefined, { refetchInterval: 2500 });
  const launchMutation = trpc.runs.launch.useMutation();
  const createWorkflowMutation = trpc.workflows.create.useMutation();
  const { data: savedWorkflows } = trpc.workflows.list.useQuery();
  const updateWorkflowMutation = trpc.workflows.update.useMutation();
  const archiveWorkflowMutation = trpc.workflows.delete.useMutation();
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState<number>();
  const [templateToEditId, setTemplateToEditId] = useState<number>();
  const templateDetailInput = useMemo(() => ({ workflowId: templateToEditId || 0 }), [templateToEditId]);
  const { data: templateDetail } = trpc.workflows.detail.useQuery(templateDetailInput, { enabled: Boolean(templateToEditId) });
  const [templateSteps, setTemplateSteps] = useState<TemplateStepDraft[]>([]);
  useEffect(() => { if (templateDetail?.steps) setTemplateSteps(templateDetail.steps.map((step) => ({ stepKey: step.stepKey, position: step.position, name: step.name, stepType: "agent", agentId: step.agentId ?? null, config: (step.config || {}) as Record<string, unknown>, requiresApproval: step.requiresApproval }))); }, [templateDetail]);
  const pauseMutation = trpc.runs.pause.useMutation();
  const commandAudit = trpc.audit.logToolCall.useMutation();
  const utils = trpc.useUtils();
  const { connected: realtimeConnected } = useRealtime(() => { void utils.runs.list.invalidate(); void utils.approvals.list.invalidate(); });

  const activeRuns = useMemo(() => runs?.filter(({ run }) => ["running", "waiting_approval"].includes(run.status)) || [], [runs]);
  useEffect(() => {
    const snapshot = activeRuns.map(({ run, agent }) => `${run.runKey}:${run.status}:${run.currentStep}:${run.elapsedSeconds}:${run.costCents}`).join("|");
    if (snapshot && snapshot !== previousRunSnapshot.current) {
      previousRunSnapshot.current = snapshot;
      const liveUpdate = activeRuns.map(({ run, agent }) => `**${run.runKey}** · ${agent?.name || "Unknown agent"}\nStatus: **${run.status}** · Current step: **${run.currentStep}** · Elapsed time: **${formatElapsed(run.elapsedSeconds)}** · Cost estimate: **$${(run.costCents / 100).toFixed(2)}** · Approval state: **${run.status === "waiting_approval" ? "Pending human approval" : "Not currently blocked"}**`).join("\n\n");
      setMessages((current) => [...current, { role: "assistant", content: `Live execution update\n\n${liveUpdate}` }]);
    }
    const latest = activeRuns[0]?.run.runKey;
    if (latest) document.title = `${latest} · Agent Ops Desk`;
    return () => { document.title = "Agent Ops Desk"; };
  }, [activeRuns]);

  const reply = (content: string) => setMessages((current) => [...current, { role: "assistant", content }]);
  const saveCustomTemplate = () => { const name = templateName.trim(); const description = templateDescription.trim(); if (!name || !description) { toast.error("Add a template name and command description"); return; } const plan = parseWorkflowPlan(description, agents || []); const generatedSteps = (plan.length ? plan : [{ index: 0, agent: agents?.find((agent) => agent.status === "active"), task: description, priority: "normal", tierLevel: "Tier 1", requiresApproval: true }]).map((step) => ({ stepKey: `template-${step.index + 1}`, position: step.index, name: step.task.slice(0, 140), stepType: "agent" as const, agentId: step.agent?.id || null, config: { task: step.task, priority: step.priority, tierLevel: step.tierLevel }, requiresApproval: step.requiresApproval ? 1 : 0 })); const steps = (editingTemplateId && templateSteps.length ? templateSteps : generatedSteps); if (editingTemplateId) { updateWorkflowMutation.mutate({ id: editingTemplateId, name, description, steps }, { onSuccess: () => { toast.success("Workflow template updated"); setEditingTemplateId(undefined); setTemplateName(""); setTemplateDescription(""); }, onError: (error) => toast.error(error.message) }); } else { createWorkflowMutation.mutate({ name, description, triggerType: "manual", steps }, { onSuccess: () => { toast.success("Workflow template saved"); setTemplateName(""); setTemplateDescription(""); }, onError: (error) => toast.error(error.message) }); } };
  const editCustomTemplate = (workflow: NonNullable<typeof savedWorkflows>[number]) => { setEditingTemplateId(workflow.id); setTemplateToEditId(workflow.id); setTemplateName(workflow.name); setTemplateDescription(workflow.description); };
  const moveTemplateStep = (index: number, direction: -1 | 1) => setTemplateSteps((current) => { const target = index + direction; if (target < 0 || target >= current.length) return current; const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next.map((step, position) => ({ ...step, position })); });
  const insertCustomTemplate = (workflow: NonNullable<typeof savedWorkflows>[number]) => handleCommand(workflow.description);

  const handleCommand = (raw: string) => {
    const command = raw.trim();
    commandAudit.mutate({ toolName: "command.chat", parametersSummary: command, referenceKey: "CHAT" });
    setMessages((current) => [...current, { role: "user", content: command }]);
    setIsThinking(true);
    window.setTimeout(() => {
      const normalized = command.toLowerCase();
      const plannedSteps = parseWorkflowPlan(command, agents || []);
      if (plannedSteps.length > 1 && !normalized.includes("what is running") && !normalized.includes("status") && !normalized.includes("approval") && !normalized.includes("pause")) {
        if (plannedSteps.some((step) => !getWorkflowLaunchGuard(step.agent, executionMode).allowed)) { setIsThinking(false); reply("Offline mode is enabled. This multi-step plan includes a cloud-only agent. Switch to Cloud mode or revise the plan to use local/offline agents; approvals, audit history, and emergency stops remain active."); return; }
        setPlanPreview(plannedSteps);
        reply(`I decomposed this into **${plannedSteps.length} ordered steps**. I will create a workflow, launch step 1, and pause automatically at approval-gated steps.\n\n${plannedSteps.map((step) => `${step.index + 1}. **${step.agent?.name}** · ${step.task} · ${step.priority} · ${step.tierLevel}${step.requiresApproval ? " · approval required" : ""}`).join("\n")}`);
        createWorkflowMutation.mutate({ name: `Command plan · ${new Date().toLocaleTimeString()}`, description: command, triggerType: "manual", steps: plannedSteps.map((step) => ({ stepKey: `command-${step.index + 1}`, position: step.index, name: step.task.slice(0, 140), stepType: "agent" as const, agentId: step.agent?.id || null, config: { task: step.task, priority: step.priority }, requiresApproval: step.requiresApproval ? 1 : 0 })) }, { onSuccess: (workflow) => { const first = plannedSteps[0]; if (!workflow || !first.agent) { setIsThinking(false); reply("The plan was saved, but I could not identify the first active agent to launch."); return; } launchMutation.mutate({ agentId: first.agent.id, task: first.task, priority: first.priority as "urgent" | "high" | "normal" | "low", tierLevel: first.tierLevel, workflowId: workflow.id, executionMode }, { onSuccess: (run) => { setIsThinking(false); reply(`Workflow **${workflow.name}** is live. Step 1 launched as **${run?.runKey || "a new run"}**. I will keep tracking each step and surface approvals here.`); }, onError: (error) => { setIsThinking(false); reply(`The workflow was created, but step 1 could not launch: ${error.message}`); } }); }, onError: (error) => { setIsThinking(false); reply(`I could not create the multi-step workflow: ${error.message}`); } });
        return;
      }
      if (normalized.includes("approval") || normalized.includes("approve")) {
        setIsThinking(false);
        reply(`There are **${approvals?.length ?? 0}** pending approval requests. I will not approve or deny them from chat without an explicit approval action. Opening the Human Approval Queue now.`);
        setLocation("/approvals");
        return;
      }
      const pauseMatch = command.match(/\bpause\s+(RUN-[A-Z0-9-]+)/i);
      if (pauseMatch) {
        const target = runs?.find(({ run }) => run.runKey.toLowerCase() === pauseMatch[1].toLowerCase());
        if (!target) { setIsThinking(false); reply(`I could not find **${pauseMatch[1]}** in the live run feed.`); return; }
        pauseMutation.mutate({ runKey: target.run.runKey }, { onSuccess: () => { setIsThinking(false); reply(`Paused **${target.run.runKey}** at “${target.run.currentStep}”. The evidence remains in the Audit Log.`); }, onError: (error) => { setIsThinking(false); reply(`I could not pause **${target.run.runKey}**: ${error.message}`); } });
        return;
      }
      if (normalized.includes("what is running") || normalized.includes("status") || normalized.includes("live runs")) {
        setIsThinking(false);
        if (!activeRuns.length) { reply("No active runs are currently visible. The live monitor is still connected and will refresh automatically."); return; }
        reply(activeRuns.map(({ run, agent }) => `**${run.runKey}** · ${agent?.name || "Unknown agent"} · ${run.status} · ${run.currentStep} · ${formatElapsed(run.elapsedSeconds)} · $${(run.costCents / 100).toFixed(2)}`).join("\n\n"));
        return;
      }
      if (normalized.includes("launch") || normalized.includes("start") || normalized.includes("run ")) {
        const requested = agents?.find((agent) => normalized.includes(agent.name.toLowerCase())) || agents?.find((agent) => agent.status === "active"); const launchGuard = getWorkflowLaunchGuard(requested, executionMode); if (!launchGuard.allowed) { setIsThinking(false); reply(launchGuard.message); return; }
        if (emergency?.globalKillSwitch) { setIsThinking(false); reply("The global emergency stop is active. I cannot launch a workflow until an administrator resumes execution."); return; }
        const selected = agents?.find((agent) => normalized.includes(agent.name.toLowerCase())) || agents?.find((agent) => agent.status === "active");
        if (!selected) { setIsThinking(false); reply("No active agent is available to launch. Check the Agent Registry first."); return; }
        const priority = normalized.includes("urgent") ? "urgent" : normalized.includes("high") ? "high" : normalized.includes("low") ? "low" : "normal";
        const tierMatch = normalized.match(/tier\s*([0-3])/);
        const tierLevel = tierMatch ? `Tier ${tierMatch[1]}` : "Tier 1";
        const task = command.replace(/^(please\s+)?(launch|start|run)\s+/i, "").replace(new RegExp(selected.name, "i"), "").replace(/^\s*(to|for)\s+/i, "").replace(/,?\s*(priority\s+(urgent|high|normal|low))?/i, "").replace(/,?\s*tier\s*[0-3]/i, "").trim() || "Complete the requested workflow";
        launchMutation.mutate({ agentId: selected.id, task, priority, tierLevel, executionMode }, { onSuccess: (run) => { setIsThinking(false); commandAudit.mutate({ toolName: "agent.run.launch", parametersSummary: `${selected.name} · ${task}`, referenceKey: run?.runKey }); reply(`Launched **${selected.name}** as **${run?.runKey || "a new run"}**. I am tracking it live below. Tier **${tierLevel}** actions remain subject to human approval.`); }, onError: (error) => { setIsThinking(false); reply(`I could not launch that workflow: ${error.message}`); } });
        return;
      }
      setIsThinking(false);
      reply("I can launch or pause runs, report live status, and open the Human Approval Queue. Try: “Launch Signal Scout to synthesize onboarding feedback, priority high, tier 1.”");
    }, 220);
  };

  return <div className="space-y-7"><div className={`flex items-start gap-3 rounded-2xl border p-4 ${executionMode === "offline" ? "border-amber-300/25 bg-amber-300/[0.08]" : "border-emerald-300/20 bg-emerald-300/[0.06]"}`} role="status"><div className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${executionMode === "offline" ? "bg-amber-300" : "bg-emerald-300"}`} /><div><p className={`text-sm font-semibold ${executionMode === "offline" ? "text-amber-100" : "text-emerald-100"}`}>{executionMode === "offline" ? "Offline mode is active" : "Cloud mode is active"}</p><p className="mt-1 text-xs leading-relaxed text-slate-400">{executionMode === "offline" ? "Only agents marked local/offline can launch. Cloud-only actions are blocked; approvals, audit history, live tracking, and emergency stops remain available. This setting persists locally in your browser across sessions." : "Cloud-enabled execution is available. Toggle Offline mode in the sidebar to block cloud-only launches and keep work local; your choice persists locally in this browser."}</p></div></div>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />Command center / natural language control</div><h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">Talk to your operations</h1><p className="mt-2 max-w-2xl text-sm text-slate-500">Describe the outcome. The desk routes work to an allowed agent, keeps approval gates intact, and streams the execution state back to you.</p></div><div className="flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs text-emerald-200"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />{realtimeConnected ? "WebSocket live tracking connected" : "Polling fallback active"}</div></div>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card className="overflow-hidden border-white/[0.07] bg-white/[0.035] shadow-none"><CardHeader className="flex flex-row items-center justify-between border-b border-white/[0.06] px-5 py-4"><div><CardTitle className="flex items-center gap-2 text-sm font-semibold text-white"><Command className="h-4 w-4 text-cyan-300" />Agent command chat</CardTitle><p className="mt-1 text-xs text-slate-500">Commands are audited and safety-gated.</p></div><Badge variant="outline" className="border-cyan-300/20 bg-cyan-300/10 text-[10px] text-cyan-200">Human-directed</Badge></CardHeader>{planPreview.length > 1 && <div className="border-b border-white/[0.06] bg-cyan-300/[0.04] px-5 py-4"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200/70">Active multi-step plan</p><div className="mt-2 flex flex-wrap gap-2">{planPreview.map((step) => <Badge key={step.index} variant="outline" className="border-cyan-300/20 text-[10px] text-cyan-100">{step.index + 1}. {step.agent?.name} · {step.requiresApproval ? "approval gate" : "auto"}</Badge>)}</div></div>}<div className="border-b border-white/[0.06] bg-black/10 px-5 py-3"><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Custom workflow templates</p><span className="text-[10px] text-slate-600">Saved to this workspace</span></div><div className="mt-2 grid gap-2 sm:grid-cols-[0.8fr_1.4fr_auto]"><Input aria-label="Custom template name" value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder="Template name" className="h-8 border-white/[0.09] bg-transparent text-xs text-white" /><Input aria-label="Custom template command" value={templateDescription} onChange={(event) => setTemplateDescription(event.target.value)} placeholder="Describe the multi-step command" className="h-8 border-white/[0.09] bg-transparent text-xs text-white" /><Button type="button" size="sm" onClick={saveCustomTemplate} disabled={createWorkflowMutation.isPending || updateWorkflowMutation.isPending} className="h-8 bg-cyan-300 text-xs font-semibold text-slate-950 hover:bg-cyan-200"><Plus className="mr-1 h-3.5 w-3.5" />{editingTemplateId ? "Save edit" : "Save template"}</Button></div>{editingTemplateId && templateSteps.length > 0 && <div className="mt-3 space-y-2 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.03] p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200/70">Edit ordered steps</p>{templateSteps.map((step, index) => <div key={step.stepKey} className="grid gap-2 rounded-lg border border-white/[0.07] bg-black/10 p-2 sm:grid-cols-[1.4fr_1fr_0.7fr_0.7fr_auto]"><Input aria-label={`Step ${index + 1} task`} value={step.name} onChange={(event) => setTemplateSteps((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value, config: { ...item.config, task: event.target.value } } : item))} className="h-8 border-white/[0.09] bg-transparent text-xs text-white" /><select aria-label={`Step ${index + 1} agent`} value={step.agentId ?? ""} onChange={(event) => setTemplateSteps((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, agentId: event.target.value ? Number(event.target.value) : null } : item))} className="h-8 rounded-md border border-white/[0.09] bg-[#0d1923] px-2 text-xs text-slate-300"><option value="">Select agent</option>{agents?.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select><select aria-label={`Step ${index + 1} priority`} value={String(step.config.priority || "normal")} onChange={(event) => setTemplateSteps((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, config: { ...item.config, priority: event.target.value } } : item))} className="h-8 rounded-md border border-white/[0.09] bg-[#0d1923] px-2 text-xs text-slate-300"><option>low</option><option>normal</option><option>high</option><option>urgent</option></select><select aria-label={`Step ${index + 1} tier`} value={String(step.config.tierLevel || "Tier 1")} onChange={(event) => setTemplateSteps((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, config: { ...item.config, tierLevel: event.target.value } } : item))} className="h-8 rounded-md border border-white/[0.09] bg-[#0d1923] px-2 text-xs text-slate-300"><option>Tier 1</option><option>Tier 2</option><option>Tier 3</option></select><label className="flex items-center gap-1 text-[10px] text-slate-400"><input type="checkbox" checked={step.requiresApproval === 1} onChange={(event) => setTemplateSteps((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, requiresApproval: event.target.checked ? 1 : 0 } : item))} />Approval</label><div className="flex items-center justify-end gap-1"><Button type="button" size="icon" variant="ghost" aria-label={`Move step ${index + 1} up`} onClick={() => moveTemplateStep(index, -1)} disabled={index === 0} className="h-7 w-7 text-slate-500 hover:text-cyan-200"><ArrowUp className="h-3.5 w-3.5" /></Button><Button type="button" size="icon" variant="ghost" aria-label={`Move step ${index + 1} down`} onClick={() => moveTemplateStep(index, 1)} disabled={index === templateSteps.length - 1} className="h-7 w-7 text-slate-500 hover:text-cyan-200"><ArrowDown className="h-3.5 w-3.5" /></Button></div></div>)}</div>}{savedWorkflows?.length ? <div className="mt-3 space-y-2">{savedWorkflows.slice(0, 4).map((workflow) => <div key={workflow.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2"><button type="button" onClick={() => insertCustomTemplate(workflow)} className="min-w-0 flex-1 text-left"><p className="truncate text-xs font-medium text-slate-200">{workflow.name}</p><p className="truncate text-[10px] text-slate-600">{workflow.description}</p></button><div className="flex items-center gap-1"><Button type="button" size="icon" variant="ghost" aria-label={`Edit ${workflow.name}`} onClick={() => editCustomTemplate(workflow)} className="h-7 w-7 text-slate-500 hover:text-cyan-200"><Pencil className="h-3.5 w-3.5" /></Button><Button type="button" size="icon" variant="ghost" aria-label={`Delete ${workflow.name}`} onClick={() => archiveWorkflowMutation.mutate({ id: workflow.id }, { onSuccess: () => toast.success("Template deleted") })} className="h-7 w-7 text-slate-500 hover:text-rose-200"><Trash2 className="h-3.5 w-3.5" /></Button></div></div>)}</div> : <p className="mt-2 text-[11px] text-slate-600">No saved custom templates yet.</p>}</div><div className="border-b border-white/[0.06] bg-black/10 px-5 py-3"><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Quick actions</p><span className="text-[10px] text-slate-600">Templates stay approval-gated</span></div><div className="mt-2 flex flex-wrap gap-2">{quickTemplates.map((template) => <Button key={template.label} type="button" size="sm" variant="outline" onClick={() => handleCommand(template.prompt)} disabled={isThinking} className="h-8 border-white/[0.09] bg-transparent text-[11px] text-slate-300 hover:border-cyan-300/25 hover:bg-cyan-300/[0.05] hover:text-cyan-100">{template.label}</Button>)}</div></div><CardContent className="p-0"><div aria-live="polite" aria-label="Agent command conversation"><AIChatBox messages={messages} onSendMessage={handleCommand} isLoading={isThinking || launchMutation.isPending || pauseMutation.isPending} height="620px" placeholder="Tell the operations desk what to do..." emptyStateMessage="Your command desk is ready" suggestedPrompts={suggestions} className="rounded-none border-0 bg-transparent shadow-none" /></div></CardContent></Card>
      <div className="space-y-5"><Card className="border-white/[0.07] bg-white/[0.035] shadow-none"><CardHeader className="px-5 py-4"><CardTitle className="flex items-center gap-2 text-sm font-semibold text-white"><Activity className="h-4 w-4 text-cyan-300" />Live execution feed</CardTitle><p className="mt-1 text-xs text-slate-500">{realtimeConnected ? "Low-latency WebSocket updates" : "Polling fallback · reconnecting to WebSocket"}</p></CardHeader><CardContent className="space-y-3 px-5 pb-5">{runsLoading && <div className="flex items-center gap-2 py-4 text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Connecting to run stream…</div>}{runsError && <div className="rounded-lg border border-rose-300/20 bg-rose-300/10 p-3 text-xs text-rose-200">The live run feed is temporarily unavailable.</div>}{!runsLoading && !runsError && !activeRuns.length && <div className="rounded-lg border border-dashed border-white/[0.1] p-4 text-center text-xs text-slate-600">No active runs. Launch one from chat.</div>}{activeRuns.map(({ run, agent }) => <div key={run.runKey} className="rounded-xl border border-white/[0.07] bg-black/15 p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-semibold text-white">{run.runKey}</p><p className="mt-1 truncate text-[11px] text-slate-500">{agent?.name || "Unknown agent"} · {run.currentStep}</p></div><Badge variant="outline" className={run.status === "waiting_approval" ? "border-amber-300/20 text-amber-200" : "border-cyan-300/20 text-cyan-200"}>{run.status === "waiting_approval" ? "Approval" : "Running"}</Badge></div><div className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-slate-500"><span className="flex items-center gap-1"><TimerReset className="h-3 w-3" />{formatElapsed(run.elapsedSeconds)}</span><span className="flex items-center gap-1"><WalletCards className="h-3 w-3" />${(run.costCents / 100).toFixed(2)}</span><span className="flex items-center gap-1"><FileCheck2 className="h-3 w-3" />{run.status === "waiting_approval" ? "Needs review" : "Guarded"}</span></div></div>)}</CardContent></Card>
        <Card className={`border-white/[0.07] shadow-none ${emergency?.globalKillSwitch ? "bg-rose-300/[0.07]" : "bg-white/[0.035]"}`}><CardContent className="p-5"><div className="flex gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-300/20 bg-amber-300/10 text-amber-200">{emergency?.globalKillSwitch ? <ShieldAlert className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}</div><div><p className="text-sm font-semibold text-white">{emergency?.globalKillSwitch ? "Execution frozen" : "Safety layer active"}</p><p className="mt-1 text-xs leading-relaxed text-slate-500">{emergency?.globalKillSwitch ? "The global emergency stop is blocking new workflow launches." : "Chat can coordinate work, but it cannot bypass policy, approval tiers, or kill switches."}</p></div></div><Button variant="outline" className="mt-4 h-9 w-full border-white/[0.08] bg-transparent text-xs text-slate-400 hover:bg-white/[0.05]" onClick={() => setLocation(emergency?.globalKillSwitch ? "/policies" : "/approvals")}>{emergency?.globalKillSwitch ? "Review safety controls" : "Open Human Approval Queue"}</Button></CardContent></Card>
      </div>
    </div>
  </div>;
}

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Activity, AlertTriangle, Bot, CheckCircle2, Clock3, Command, FileCheck2, Loader2, Pause, Play, ShieldAlert, Sparkles, TimerReset, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

const suggestions = [
  "Launch Signal Scout to synthesize the latest onboarding feedback, priority normal, tier 1",
  "What is running right now?",
  "Show my approval queue",
  "Pause RUN-4821",
];

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining.toString().padStart(2, "0")}s`;
}

export default function CommandCenter() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([
    { role: "system", content: "You are the Agent Ops Desk command assistant. Never bypass approval gates or emergency stops." },
    { role: "assistant", content: "Command center ready. Tell me what you want to run, pause, inspect, or approve. I will keep every action inside the workspace guardrails." },
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const previousRunSnapshot = useRef("");
  const { data: agents } = trpc.agents.list.useQuery();
  const { data: runs, isLoading: runsLoading, isError: runsError } = trpc.runs.list.useQuery(undefined, { refetchInterval: 2500 });
  const { data: approvals } = trpc.approvals.list.useQuery(undefined, { refetchInterval: 5000 });
  const { data: emergency } = trpc.emergency.state.useQuery(undefined, { refetchInterval: 2500 });
  const launchMutation = trpc.runs.launch.useMutation();
  const pauseMutation = trpc.runs.pause.useMutation();
  const commandAudit = trpc.audit.logToolCall.useMutation();

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
  const handleCommand = (raw: string) => {
    const command = raw.trim();
    commandAudit.mutate({ toolName: "command.chat", parametersSummary: command, referenceKey: "CHAT" });
    setMessages((current) => [...current, { role: "user", content: command }]);
    setIsThinking(true);
    window.setTimeout(() => {
      const normalized = command.toLowerCase();
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
        if (emergency?.globalKillSwitch) { setIsThinking(false); reply("The global emergency stop is active. I cannot launch a workflow until an administrator resumes execution."); return; }
        const selected = agents?.find((agent) => normalized.includes(agent.name.toLowerCase())) || agents?.find((agent) => agent.status === "active");
        if (!selected) { setIsThinking(false); reply("No active agent is available to launch. Check the Agent Registry first."); return; }
        const priority = normalized.includes("urgent") ? "urgent" : normalized.includes("high") ? "high" : normalized.includes("low") ? "low" : "normal";
        const tierMatch = normalized.match(/tier\s*([0-3])/);
        const tierLevel = tierMatch ? `Tier ${tierMatch[1]}` : "Tier 1";
        const task = command.replace(/^(please\s+)?(launch|start|run)\s+/i, "").replace(new RegExp(selected.name, "i"), "").replace(/^\s*(to|for)\s+/i, "").replace(/,?\s*(priority\s+(urgent|high|normal|low))?/i, "").replace(/,?\s*tier\s*[0-3]/i, "").trim() || "Complete the requested workflow";
        launchMutation.mutate({ agentId: selected.id, task, priority, tierLevel }, { onSuccess: (run) => { setIsThinking(false); commandAudit.mutate({ toolName: "agent.run.launch", parametersSummary: `${selected.name} · ${task}`, referenceKey: run?.runKey }); reply(`Launched **${selected.name}** as **${run?.runKey || "a new run"}**. I am tracking it live below. Tier **${tierLevel}** actions remain subject to human approval.`); }, onError: (error) => { setIsThinking(false); reply(`I could not launch that workflow: ${error.message}`); } });
        return;
      }
      setIsThinking(false);
      reply("I can launch or pause runs, report live status, and open the Human Approval Queue. Try: “Launch Signal Scout to synthesize onboarding feedback, priority high, tier 1.”");
    }, 220);
  };

  return <div className="space-y-7">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />Command center / natural language control</div><h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">Talk to your operations</h1><p className="mt-2 max-w-2xl text-sm text-slate-500">Describe the outcome. The desk routes work to an allowed agent, keeps approval gates intact, and streams the execution state back to you.</p></div><div className="flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs text-emerald-200"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />Live tracking connected</div></div>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card className="overflow-hidden border-white/[0.07] bg-white/[0.035] shadow-none"><CardHeader className="flex flex-row items-center justify-between border-b border-white/[0.06] px-5 py-4"><div><CardTitle className="flex items-center gap-2 text-sm font-semibold text-white"><Command className="h-4 w-4 text-cyan-300" />Agent command chat</CardTitle><p className="mt-1 text-xs text-slate-500">Commands are audited and safety-gated.</p></div><Badge variant="outline" className="border-cyan-300/20 bg-cyan-300/10 text-[10px] text-cyan-200">Human-directed</Badge></CardHeader><CardContent className="p-0"><div aria-live="polite" aria-label="Agent command conversation"><AIChatBox messages={messages} onSendMessage={handleCommand} isLoading={isThinking || launchMutation.isPending || pauseMutation.isPending} height="620px" placeholder="Tell the operations desk what to do..." emptyStateMessage="Your command desk is ready" suggestedPrompts={suggestions} className="rounded-none border-0 bg-transparent shadow-none" /></div></CardContent></Card>
      <div className="space-y-5"><Card className="border-white/[0.07] bg-white/[0.035] shadow-none"><CardHeader className="px-5 py-4"><CardTitle className="flex items-center gap-2 text-sm font-semibold text-white"><Activity className="h-4 w-4 text-cyan-300" />Live execution feed</CardTitle><p className="mt-1 text-xs text-slate-500">Refreshes every 2.5 seconds</p></CardHeader><CardContent className="space-y-3 px-5 pb-5">{runsLoading && <div className="flex items-center gap-2 py-4 text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Connecting to run stream…</div>}{runsError && <div className="rounded-lg border border-rose-300/20 bg-rose-300/10 p-3 text-xs text-rose-200">The live run feed is temporarily unavailable.</div>}{!runsLoading && !runsError && !activeRuns.length && <div className="rounded-lg border border-dashed border-white/[0.1] p-4 text-center text-xs text-slate-600">No active runs. Launch one from chat.</div>}{activeRuns.map(({ run, agent }) => <div key={run.runKey} className="rounded-xl border border-white/[0.07] bg-black/15 p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-semibold text-white">{run.runKey}</p><p className="mt-1 truncate text-[11px] text-slate-500">{agent?.name || "Unknown agent"} · {run.currentStep}</p></div><Badge variant="outline" className={run.status === "waiting_approval" ? "border-amber-300/20 text-amber-200" : "border-cyan-300/20 text-cyan-200"}>{run.status === "waiting_approval" ? "Approval" : "Running"}</Badge></div><div className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-slate-500"><span className="flex items-center gap-1"><TimerReset className="h-3 w-3" />{formatElapsed(run.elapsedSeconds)}</span><span className="flex items-center gap-1"><WalletCards className="h-3 w-3" />${(run.costCents / 100).toFixed(2)}</span><span className="flex items-center gap-1"><FileCheck2 className="h-3 w-3" />{run.status === "waiting_approval" ? "Needs review" : "Guarded"}</span></div></div>)}</CardContent></Card>
        <Card className={`border-white/[0.07] shadow-none ${emergency?.globalKillSwitch ? "bg-rose-300/[0.07]" : "bg-white/[0.035]"}`}><CardContent className="p-5"><div className="flex gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-300/20 bg-amber-300/10 text-amber-200">{emergency?.globalKillSwitch ? <ShieldAlert className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}</div><div><p className="text-sm font-semibold text-white">{emergency?.globalKillSwitch ? "Execution frozen" : "Safety layer active"}</p><p className="mt-1 text-xs leading-relaxed text-slate-500">{emergency?.globalKillSwitch ? "The global emergency stop is blocking new workflow launches." : "Chat can coordinate work, but it cannot bypass policy, approval tiers, or kill switches."}</p></div></div><Button variant="outline" className="mt-4 h-9 w-full border-white/[0.08] bg-transparent text-xs text-slate-400 hover:bg-white/[0.05]" onClick={() => setLocation(emergency?.globalKillSwitch ? "/policies" : "/approvals")}>{emergency?.globalKillSwitch ? "Review safety controls" : "Open Human Approval Queue"}</Button></CardContent></Card>
      </div>
    </div>
  </div>;
}

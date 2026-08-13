import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  FolderKanban,
  Gauge,
  Globe2,
  Lightbulb,
  Megaphone,
  MessageSquareText,
  Plus,
  Rocket,
  Sparkles,
  Target,
  UsersRound,
  WandSparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { buildAgencyWorkflowTask, formatWorkflowStatus } from "@/lib/agencyWorkflow";
import { getExecutionMode } from "@/lib/executionMode";
import { getWorkflowLaunchGuard } from "@/lib/workflowLaunchGuard";

type Template = {
  id: string;
  title: string;
  description: string;
  prompt: string;
  agentHint: string;
  icon: React.ElementType;
  tone: string;
};

const templates: Template[] = [
  { id: "client-request", title: "Turn a client ask into a plan", description: "Clarify the request, scope the work, and create a delivery plan.", prompt: "Turn this client request into a clear scope, plan, and next steps: ", agentHint: "Signal Scout", icon: BriefcaseBusiness, tone: "cyan" },
  { id: "proposal", title: "Create a proposal", description: "Build a polished proposal with scope, timeline, and recommended next step.", prompt: "Create a proposal for: ", agentHint: "Brand Beacon", icon: FileText, tone: "violet" },
  { id: "campaign", title: "Plan a marketing campaign", description: "Move from goal to audience, message, channels, and launch checklist.", prompt: "Plan a marketing campaign for: ", agentHint: "Brand Beacon", icon: Megaphone, tone: "amber" },
  { id: "website", title: "Start a website project", description: "Capture goals, pages, content needs, and the first delivery milestone.", prompt: "Start a website project for: ", agentHint: "Release Ranger", icon: Globe2, tone: "emerald" },
  { id: "weekly-ops", title: "Run weekly agency operations", description: "Review open work, blockers, deadlines, and the most important move today.", prompt: "Run my weekly agency operations review. Focus on: ", agentHint: "Pipeline Pilot", icon: CalendarDays, tone: "rose" },
  { id: "custom", title: "Start with my own ask", description: "Describe any business task and the desk will help shape it.", prompt: "", agentHint: "Signal Scout", icon: WandSparkles, tone: "blue" },
];

const toneMap: Record<string, string> = {
  cyan: "border-cyan-300/20 bg-cyan-300/10 text-cyan-200",
  violet: "border-violet-300/20 bg-violet-300/10 text-violet-200",
  amber: "border-amber-300/20 bg-amber-300/10 text-amber-200",
  emerald: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
  rose: "border-rose-300/20 bg-rose-300/10 text-rose-200",
  blue: "border-blue-300/20 bg-blue-300/10 text-blue-200",
};

const statusStyle: Record<string, string> = {
  running: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
  waiting_approval: "border-amber-300/20 bg-amber-300/10 text-amber-200",
  completed: "border-cyan-300/20 bg-cyan-300/10 text-cyan-200",
  paused: "border-slate-300/20 bg-slate-300/10 text-slate-300",
};

function StepIndicator({ step }: { step: number }) {
  const labels = ["Choose a starting point", "Add the context", "Review and start"];
  return <div className="mb-7 flex flex-wrap items-center gap-2 text-xs sm:gap-3">{labels.map((label, index) => { const number = index + 1; const active = number === step; const done = number < step; return <div key={label} className="flex items-center gap-2"><div className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold ${done ? "border-cyan-300 bg-cyan-300 text-slate-950" : active ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-100" : "border-white/10 bg-white/[0.03] text-slate-600"}`}>{done ? <Check className="h-3.5 w-3.5" /> : number}</div><span className={active ? "font-medium text-slate-200" : "text-slate-600"}>{label}</span>{number < 3 && <ChevronRight className="h-3.5 w-3.5 text-slate-700" />}</div>; })}</div>;
}

function Metric({ icon: Icon, label, value, detail, tone }: { icon: React.ElementType; label: string; value: string; detail: string; tone: string }) {
  return <Card className="border-white/[0.07] bg-white/[0.035] shadow-none"><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div><div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${toneMap[tone]}`}><Icon className="h-4 w-4" /></div></div></CardContent></Card>;
}

function AskBuilder({ onStarted }: { onStarted: () => void }) {
  const [step, setStep] = useState(1);
  const [selectedId, setSelectedId] = useState("client-request");
  const [ask, setAsk] = useState(templates[0].prompt);
  const [client, setClient] = useState("");
  const [dueDate, setDueDate] = useState("");
  const { data: agents } = trpc.agents.list.useQuery();
  const launchMutation = trpc.runs.launch.useMutation();
  const selected = templates.find((template) => template.id === selectedId) ?? templates[0];
  const ready = ask.trim().length > 18;
  const selectedAgent = useMemo(() => agents?.find((agent) => agent.name.toLowerCase() === selected.agentHint.toLowerCase()) ?? agents?.find((agent) => agent.status === "active"), [agents, selected.agentHint]);

  const choose = (template: Template) => {
    setSelectedId(template.id);
    setAsk(template.prompt);
  };

  const startWorkflow = () => {
    if (!ready) return;
    if (!selectedAgent) {
      toast.error("No active workflow specialist is available yet.");
      return;
    }
    const launchGuard = getWorkflowLaunchGuard(selectedAgent, getExecutionMode());
    if (!launchGuard.allowed) { toast.error(launchGuard.message); return; }
    launchMutation.mutate({ agentId: selectedAgent.id, task: buildAgencyWorkflowTask({ ask, client, dueDate }), priority: "normal", tierLevel: "Tier 1", targetDate: dueDate || undefined, executionMode: launchGuard.executionMode }, { onSuccess: (run) => { toast.success(`Your workflow is underway${run?.runKey ? ` · ${run.runKey}` : ""}`); onStarted(); }, onError: (error) => toast.error(error.message || "Could not start this workflow") });
  };

  return <Card className="overflow-hidden border-cyan-300/15 bg-[linear-gradient(135deg,rgba(103,232,249,0.08),rgba(255,255,255,0.025)_48%,rgba(167,139,250,0.06))] shadow-none"><CardContent className="p-5 sm:p-7"><div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200"><Sparkles className="h-3.5 w-3.5" />Start a business ask</div><h2 className="text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">What should the agency move forward today?</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">Pick a starting point, add a little context, and Agent Ops Desk will turn the ask into a guided workflow. You stay in control before anything sensitive is sent or published.</p><div className="mt-7"><StepIndicator step={step} />{step === 1 && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{templates.map((template) => { const Icon = template.icon; const active = template.id === selectedId; return <button key={template.id} onClick={() => choose(template)} className={`group rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/[0.06] ${active ? "border-cyan-300/45 bg-cyan-300/[0.08]" : "border-white/[0.08] bg-black/10"}`}><div className="flex items-start justify-between gap-3"><div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${toneMap[template.tone]}`}><Icon className="h-4 w-4" /></div>{active && <div className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-300 text-slate-950"><Check className="h-3 w-3" /></div>}</div><p className="mt-4 text-sm font-semibold text-white">{template.title}</p><p className="mt-1.5 text-xs leading-relaxed text-slate-500">{template.description}</p></button>; })}</div>}{step === 2 && <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]"><div><label className="text-xs font-medium text-slate-300">Describe the outcome you want</label><Textarea value={ask} onChange={(event) => setAsk(event.target.value)} rows={7} placeholder="Example: We need a launch plan for a new service aimed at local professional firms..." className="mt-2 resize-none border-white/[0.1] bg-black/20 text-sm leading-relaxed text-white placeholder:text-slate-700" /><p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-600"><CircleHelp className="h-3.5 w-3.5" />Plain language is fine. The desk will help structure it.</p></div><div className="space-y-4"><div><label className="text-xs font-medium text-slate-300">Client or business name <span className="text-slate-600">(optional)</span></label><Input value={client} onChange={(event) => setClient(event.target.value)} placeholder="e.g. Northstar Studio" className="mt-2 border-white/[0.1] bg-black/20 text-sm text-white placeholder:text-slate-700" /></div><div><label className="text-xs font-medium text-slate-300">Target date <span className="text-slate-600">(optional)</span></label><Input value={dueDate} onChange={(event) => setDueDate(event.target.value)} type="date" className="mt-2 border-white/[0.1] bg-black/20 text-sm text-white [color-scheme:dark]" /></div><div className="rounded-xl border border-white/[0.07] bg-black/15 p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">Suggested first specialist</p><div className="mt-2 flex items-center gap-2.5"><div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${toneMap[selected.tone]}`}><selected.icon className="h-4 w-4" /></div><div><p className="text-sm font-medium text-slate-200">{selectedAgent?.name ?? selected.agentHint}</p><p className="text-[11px] text-slate-500">Will shape the first pass</p></div></div></div></div></div>}{step === 3 && <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]"><div className="rounded-2xl border border-white/[0.08] bg-black/15 p-5"><div className="flex items-center gap-3"><div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${toneMap[selected.tone]}`}><selected.icon className="h-5 w-5" /></div><div><p className="text-sm font-semibold text-white">{selected.title}</p><p className="mt-1 text-xs text-slate-500">Ready for a guided first pass</p></div></div><div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.025] p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">Your ask</p><p className="mt-2 text-sm leading-relaxed text-slate-300">{ask}</p>{client && <p className="mt-3 text-xs text-slate-500">Client: <span className="text-slate-300">{client}</span></p>}{dueDate && <p className="mt-1 text-xs text-slate-500">Target date: <span className="text-slate-300">{dueDate}</span></p>}</div></div><div className="space-y-3"><div className="flex items-start gap-3 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] p-4"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /><div><p className="text-sm font-medium text-emerald-100">You review before action</p><p className="mt-1 text-xs leading-relaxed text-emerald-100/60">The first step is a draft and plan. Approval gates remain in place for external actions.</p></div></div><div className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-black/10 p-4"><Target className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" /><div><p className="text-sm font-medium text-slate-200">Clear next action</p><p className="mt-1 text-xs leading-relaxed text-slate-500">You will see the current step, what is needed from you, and what happens next.</p></div></div></div></div>}<div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><Button variant="ghost" onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={step === 1} className="text-slate-500 hover:bg-white/[0.05] hover:text-white">Back</Button>{step < 3 ? <Button onClick={() => setStep((current) => current + 1)} disabled={step === 2 && !ready} className="bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200">{step === 1 ? "Add context" : "Review my workflow"}<ArrowRight className="ml-2 h-4 w-4" /></Button> : <Button onClick={startWorkflow} disabled={launchMutation.isPending || !ready} className="bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200"><Rocket className="mr-2 h-4 w-4" />{launchMutation.isPending ? "Starting…" : "Start this workflow"}</Button>}</div></div></CardContent></Card>;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: overview } = trpc.overview.summary.useQuery(undefined, { refetchInterval: 10000 });
  const { data: runs } = trpc.runs.list.useQuery(undefined, { refetchInterval: 5000 });
  const { data: approvals } = trpc.approvals.list.useQuery(undefined, { refetchInterval: 10000 });
  const activeRuns = runs?.filter(({ run }) => ["running", "waiting_approval"].includes(run.status)).slice(0, 4) ?? [];
  const completedToday = overview?.departments.reduce((total, department) => total + department.runs, 0);
  const nextDeadline = runs?.map(({ run }) => run.targetDate).filter((date): date is Date => Boolean(date)).sort((a, b) => a.getTime() - b.getTime())[0];

  return <div className="space-y-7" key={refreshKey}><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />Agency command center</div><h1 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">Make the next move obvious.</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">Your operating desk for turning loose business asks into scoped work, clear ownership, and client-ready delivery.</p></div><div className="flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs text-emerald-200"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />Workspace healthy</div></div><AskBuilder onStarted={() => { setRefreshKey((current) => current + 1); toast.info("Open Work board to follow each step as it moves forward."); }} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={FolderKanban} label="Open work" value={String(activeRuns.length)} detail="Projects needing movement" tone="cyan" /><Metric icon={ClipboardIcon} label="Needs your review" value={String(approvals?.length ?? overview?.approvalQueue ?? 0)} detail="Human decisions waiting" tone="amber" /><Metric icon={Gauge} label="Delivered today" value={completedToday === undefined ? "—" : String(completedToday)} detail="Completed agency actions" tone="emerald" /><Metric icon={Clock3} label="Next deadline" value={nextDeadline ? nextDeadline.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"} detail={nextDeadline ? "Earliest open target date" : "No target date set"} tone="violet" /></div><div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]"><Card className="border-white/[0.07] bg-white/[0.035] shadow-none"><CardHeader className="flex flex-row items-start justify-between px-5 py-5"><div><CardTitle className="text-base font-semibold text-white">Work that needs movement</CardTitle><p className="mt-1 text-xs text-slate-500">A short list of the work currently in motion.</p></div><Button variant="ghost" size="sm" onClick={() => setLocation("/runs")} className="text-xs text-slate-400 hover:bg-white/[0.05] hover:text-white">Open work board<ArrowRight className="ml-2 h-3.5 w-3.5" /></Button></CardHeader><CardContent className="space-y-3 px-5 pb-5">{activeRuns.length ? activeRuns.map(({ run, agent }) => <button key={run.runKey} onClick={() => setLocation("/runs")} className="flex w-full items-center gap-3 rounded-xl border border-white/[0.07] bg-black/10 p-3 text-left transition hover:bg-white/[0.05]"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-200"><FolderKanban className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-medium text-slate-200">{run.task}</p><Badge variant="outline" className={`rounded-full text-[10px] ${statusStyle[run.status] || statusStyle.paused}`}>{formatWorkflowStatus(run.status)}</Badge></div><p className="mt-1 truncate text-xs text-slate-500">{agent?.name || "Agency specialist"} · {run.currentStep}</p></div><ChevronRight className="h-4 w-4 shrink-0 text-slate-600" /></button>) : <div className="rounded-xl border border-dashed border-white/10 p-6 text-center"><p className="text-sm text-slate-400">Nothing is moving yet.</p><p className="mt-1 text-xs text-slate-600">Start a business ask above and the first workflow will appear here.</p></div>}</CardContent></Card><Card className="border-white/[0.07] bg-white/[0.035] shadow-none"><CardHeader className="px-5 py-5"><CardTitle className="text-base font-semibold text-white">Your operating rhythm</CardTitle><p className="mt-1 text-xs text-slate-500">A simple cadence for running the agency.</p></CardHeader><CardContent className="space-y-3 px-5 pb-5">{[{ icon: MessageSquareText, title: "Capture the ask", detail: "Write down the outcome, not the perfect brief." }, { icon: Lightbulb, title: "Shape the next step", detail: "The desk turns context into a focused workflow." }, { icon: UsersRound, title: "Keep humans in control", detail: "Review sensitive actions before they go out." }, { icon: Rocket, title: "Deliver and learn", detail: "Track progress, blockers, and what to do next." }].map(({ icon: Icon, title, detail }, index) => <div key={title} className="flex items-start gap-3"><div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-cyan-200"><span className="text-[10px] font-semibold">{index + 1}</span></div><div><p className="text-sm font-medium text-slate-200">{title}</p><p className="mt-1 text-xs leading-relaxed text-slate-500">{detail}</p></div></div>)}</CardContent></Card></div><div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-300/10 text-violet-200"><Plus className="h-4 w-4" /></div><div><p className="text-sm font-medium text-white">Need a different view?</p><p className="mt-1 text-xs text-slate-500">Browse specialists, approvals, and your activity history from the workspace nav.</p></div></div><Button variant="outline" onClick={() => setLocation("/agents")} className="border-white/[0.1] bg-transparent text-xs text-slate-300 hover:bg-white/[0.05] hover:text-white">Explore specialists<ArrowRight className="ml-2 h-3.5 w-3.5" /></Button></div></div>;
}

function ClipboardIcon(props: React.ComponentProps<"svg">) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><rect width="8" height="4" x="8" y="2" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="m9 14 2 2 4-4" /></svg>;
}

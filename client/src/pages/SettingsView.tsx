import { useEffect, useState } from "react";
import { Cloud, Database, Check, HardDrive, RefreshCw, ShieldCheck, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { type ExecutionMode } from "@/lib/executionMode";

export default function SettingsView() {
  const { data: settings, isLoading } = trpc.settings.get.useQuery();
  const utils = trpc.useUtils();
  const [selectedMode, setSelectedMode] = useState<ExecutionMode>("cloud");
  const setMode = trpc.settings.setExecutionMode.useMutation({
    onSuccess: (next) => {
      setSelectedMode(next.executionMode);
      localStorage.setItem("agent-ops-execution-mode", next.executionMode);
      window.dispatchEvent(new CustomEvent("agent-ops:execution-mode", { detail: { mode: next.executionMode } }));
      void utils.settings.get.invalidate();
      toast.success(next.executionMode === "offline" ? "Offline mode enabled" : "Cloud mode enabled", { description: next.executionMode === "offline" ? "New work is limited to local/offline specialists." : "Cloud-connected specialists are available again." });
    },
    onError: (error) => toast.error("Could not save execution mode", { description: error.message }),
  });

  useEffect(() => {
    if (settings?.executionMode) setSelectedMode(settings.executionMode);
  }, [settings?.executionMode]);

  const chooseMode = (mode: ExecutionMode) => {
    if (mode === selectedMode || setMode.isPending) return;
    setSelectedMode(mode);
    setMode.mutate({ executionMode: mode });
  };

  const offline = selectedMode === "offline";
  return <div className="space-y-7">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />User settings</div><h1 className="text-3xl font-semibold tracking-[-0.04em] text-white">Choose how the desk operates.</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">Switch between self-contained Offline work and cloud-connected operation. Your choice is saved to the local JSON state file and restored when the portable runtime starts again.</p></div><Badge variant="outline" className={offline ? "border-amber-300/25 bg-amber-300/10 px-3 py-1.5 text-amber-200" : "border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-emerald-200"}><span className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${offline ? "bg-amber-300" : "bg-emerald-300"}`} />{offline ? "Offline mode active" : "Cloud mode active"}</Badge></div>
    <Card className={`border shadow-none ${offline ? "border-amber-300/20 bg-amber-300/[0.045]" : "border-emerald-300/20 bg-emerald-300/[0.045]"}`}><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${offline ? "border-amber-300/25 bg-amber-300/10 text-amber-200" : "border-emerald-300/25 bg-emerald-300/10 text-emerald-200"}`}>{offline ? <WifiOff className="h-5 w-5" /> : <Cloud className="h-5 w-5" />}</div><div><p className="text-sm font-semibold text-white">Current mode: {offline ? "Offline" : "Cloud"}</p><p className="mt-1 text-xs leading-relaxed text-slate-400">{offline ? "Cloud-only agents are blocked. Approvals, audit logs, emergency stops, and local specialists remain available." : "Cloud-connected agents may run when allowed by workspace guardrails. Sensitive actions still require your approval."}</p></div></div><div className="flex items-center gap-2 text-xs text-slate-500"><Check className="h-4 w-4 text-emerald-300" />{isLoading ? "Loading saved preference…" : "Saved locally"}</div></CardContent></Card>
    <Card className="border-white/[0.07] bg-white/[0.035] shadow-none"><CardHeader className="px-5 py-5"><CardTitle className="text-base font-semibold text-white">Execution mode</CardTitle><p className="mt-1 text-xs text-slate-500">Choose one mode manually. The change takes effect immediately for new workflow launches.</p></CardHeader><CardContent className="grid gap-3 p-5 pt-0 md:grid-cols-2"><button onClick={() => chooseMode("offline")} aria-pressed={offline} className={`rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 ${offline ? "border-amber-300/45 bg-amber-300/[0.08]" : "border-white/[0.08] bg-black/10 hover:bg-white/[0.05]"}`}><div className="flex items-start justify-between gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-300/25 bg-amber-300/10 text-amber-200"><HardDrive className="h-5 w-5" /></div>{offline && <span className="rounded-full bg-amber-300 px-2 py-1 text-[10px] font-semibold text-slate-950">Selected</span>}</div><p className="mt-4 text-sm font-semibold text-white">Offline</p><p className="mt-1 text-xs leading-relaxed text-slate-500">Use local/offline model agents and keep the operating preference in the portable JSON store. No cloud-only launches are allowed.</p></button><button onClick={() => chooseMode("cloud")} aria-pressed={!offline} className={`rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 ${!offline ? "border-emerald-300/45 bg-emerald-300/[0.08]" : "border-white/[0.08] bg-black/10 hover:bg-white/[0.05]"}`}><div className="flex items-start justify-between gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-300/10 text-emerald-200"><Cloud className="h-5 w-5" /></div>{!offline && <span className="rounded-full bg-emerald-300 px-2 py-1 text-[10px] font-semibold text-slate-950">Selected</span>}</div><p className="mt-4 text-sm font-semibold text-white">Cloud</p><p className="mt-1 text-xs leading-relaxed text-slate-500">Use connected model agents and integrations while preserving approval gates, audit logs, and emergency-stop controls.</p></button></CardContent></Card>
    <Card className="border-white/[0.07] bg-white/[0.035] shadow-none"><CardHeader className="px-5 py-5"><CardTitle className="flex items-center gap-2 text-base font-semibold text-white"><Database className="h-4 w-4 text-cyan-300" />Local persistence</CardTitle><p className="mt-1 text-xs text-slate-500">Offline mode stores its execution preference and portable workspace state in a local JSON file.</p></CardHeader><CardContent className="space-y-3 p-5 pt-0"><div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-black/15 p-4"><div><p className="text-xs font-medium text-slate-300">State file</p><p className="mt-1 break-all font-mono text-[11px] text-slate-500">{settings?.storagePath || "portable-data/agent-ops-state.json"}</p></div><RefreshCw className={`h-4 w-4 text-slate-600 ${setMode.isPending ? "animate-spin" : ""}`} /></div><div className="flex items-start gap-3 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" /><p className="text-xs leading-relaxed text-slate-400">The adapter writes atomically and creates the portable-data directory when needed. Keep the USB drive mounted and use the launcher’s backup command before removing it.</p></div></CardContent></Card>
  </div>;
}

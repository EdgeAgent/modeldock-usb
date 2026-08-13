import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useIsMobile } from "@/hooks/useMobile";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Activity, Bot, ClipboardCheck, Cloud, Command, FileClock, FileOutput, GitBranch, LayoutDashboard, LogOut, PanelLeft, ShieldCheck, SlidersHorizontal, UsersRound, WifiOff, Workflow } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const menuItems = [
  { icon: LayoutDashboard, label: "Today", path: "/" },
  { icon: Command, label: "Ask the desk", path: "/chat" },
  { icon: Workflow, label: "Work board", path: "/runs" },
  { icon: GitBranch, label: "Workflow builder", path: "/workflows" },
  { icon: FileOutput, label: "Deliverables", path: "/deliverables" },
  { icon: ClipboardCheck, label: "Needs my review", path: "/approvals", count: 26 },
  { icon: UsersRound, label: "Specialists", path: "/agents" },
  { icon: FileClock, label: "Activity history", path: "/audit" },
  { icon: ShieldCheck, label: "Guardrails", path: "/policies" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 264;
const MIN_WIDTH = 220;
const MAX_WIDTH = 400;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  useEffect(() => { localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString()); }, [sidebarWidth]);
  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return <div className="flex min-h-screen items-center justify-center bg-[#071018] text-white"><div className="flex w-full max-w-md flex-col items-center gap-6 p-8 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200"><Bot className="h-7 w-7" /></div><div><h1 className="text-2xl font-semibold tracking-tight">Sign in to ModelDock</h1><p className="mt-2 text-sm text-slate-500">Your local ModelDock workspace is protected by workspace authentication.</p></div><Button onClick={() => startLogin()} size="lg" className="w-full bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200">Sign in</Button></div></div>;
  return <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}><DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent></SidebarProvider>;
}

function DashboardLayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (width: number) => void }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const { data: persistedSettings } = trpc.settings.get.useQuery();
  const saveExecutionMode = trpc.settings.setExecutionMode.useMutation();
  const [offlineMode, setOfflineMode] = useState(() => localStorage.getItem("agent-ops-execution-mode") === "offline");
  useEffect(() => { if (persistedSettings?.executionMode) { const nextOffline = persistedSettings.executionMode === "offline"; setOfflineMode(nextOffline); localStorage.setItem("agent-ops-execution-mode", persistedSettings.executionMode); } }, [persistedSettings?.executionMode]);
  const toggleOfflineMode = () => { const next = !offlineMode; const mode = next ? "offline" : "cloud"; setOfflineMode(next); localStorage.setItem("agent-ops-execution-mode", mode); window.dispatchEvent(new CustomEvent("agent-ops:execution-mode", { detail: { mode } })); saveExecutionMode.mutate({ executionMode: mode }, { onError: () => { setOfflineMode(!next); toast.error("Could not save execution mode"); } }); };
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const activeMenuItem = menuItems.find((item) => item.path === location);
  useEffect(() => { if (isCollapsed) setIsResizing(false); }, [isCollapsed]);
  useEffect(() => {
    const move = (event: MouseEvent) => { if (!isResizing) return; const left = sidebarRef.current?.getBoundingClientRect().left ?? 0; const width = event.clientX - left; if (width >= MIN_WIDTH && width <= MAX_WIDTH) setSidebarWidth(width); };
    const up = () => setIsResizing(false);
    if (isResizing) { document.addEventListener("mousemove", move); document.addEventListener("mouseup", up); document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"; }
    return () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); document.body.style.cursor = ""; document.body.style.userSelect = ""; };
  }, [isResizing, setSidebarWidth]);
  return <><div ref={sidebarRef} className="relative"><Sidebar collapsible="icon" className="border-r border-white/[0.06] bg-[#09131c]" disableTransition={isResizing}><SidebarHeader className="h-20 justify-center border-b border-white/[0.06] px-4"><div className="flex items-center gap-3"><button onClick={toggleSidebar} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white" aria-label="Toggle navigation"><PanelLeft className="h-4 w-4" /></button>{!isCollapsed && <div className="min-w-0"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.8)]" /><span className="truncate text-sm font-semibold tracking-tight text-white">ModelDock</span></div><p className="mt-1 pl-4 text-[10px] uppercase tracking-[0.14em] text-slate-600">Local LLM USB</p></div>}</div></SidebarHeader><SidebarContent className="gap-0 px-2 py-4"><div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600 group-data-[collapsible=icon]:hidden">Your workspace</div><SidebarMenu className="gap-1">{menuItems.map((item) => <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={location === item.path} onClick={() => setLocation(item.path)} tooltip={item.label} className="h-10 rounded-lg text-xs font-medium text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-slate-200 data-[active=true]:bg-cyan-300/10 data-[active=true]:text-cyan-200"> <item.icon className="h-4 w-4 shrink-0" /><span>{item.label}</span>{item.count && !isCollapsed ? <span className="ml-auto rounded-full bg-amber-300/10 px-2 py-0.5 text-[10px] text-amber-300">{item.count}</span> : null}</SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu><div className="my-5 border-t border-white/[0.06]" /><div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600 group-data-[collapsible=icon]:hidden">Workspace</div><SidebarMenu><SidebarMenuItem><SidebarMenuButton tooltip={offlineMode ? "Offline mode enabled" : "Cloud mode enabled"} onClick={toggleOfflineMode} className={`h-10 rounded-lg text-xs font-medium transition-colors ${offlineMode ? "bg-amber-300/10 text-amber-200 hover:bg-amber-300/15" : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-200"}`}><span className="relative flex h-4 w-4 items-center justify-center">{offlineMode ? <WifiOff className="h-4 w-4" /> : <Cloud className="h-4 w-4" />}<span className={`absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full ${offlineMode ? "bg-amber-300" : "bg-emerald-300"}`} /></span><span>{offlineMode ? "Offline mode" : "Cloud mode"}</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu><SidebarMenu><SidebarMenuItem><SidebarMenuButton tooltip="User settings" onClick={() => setLocation("/settings")} className="h-10 rounded-lg text-xs font-medium text-slate-500 hover:bg-white/[0.05] hover:text-slate-200"><SlidersHorizontal className="h-4 w-4" /><span>User settings</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarContent><SidebarFooter className="border-t border-white/[0.06] p-3"><DropdownMenu><DropdownMenuTrigger asChild><button className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 group-data-[collapsible=icon]:justify-center"><Avatar className="h-8 w-8 border border-white/10"><AvatarFallback className="bg-cyan-300/10 text-xs font-semibold text-cyan-200">{user?.name?.charAt(0).toUpperCase() || "J"}</AvatarFallback></Avatar><div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-xs font-medium text-slate-200">{user?.name || "Workspace owner"}</p><p className="mt-0.5 truncate text-[10px] text-slate-600">{user?.email || "Operations lead"}</p></div></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-48 border-white/10 bg-[#101d29] text-slate-200"><DropdownMenuItem onClick={logout} className="cursor-pointer text-xs text-slate-300 focus:bg-white/[0.06] focus:text-white"><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu></SidebarFooter></Sidebar><div className={`absolute right-0 top-0 z-50 h-full w-1 cursor-col-resize transition-colors hover:bg-cyan-300/20 ${isCollapsed ? "hidden" : ""}`} onMouseDown={() => setIsResizing(true)} /></div><SidebarInset className="bg-[#071018]"><div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.05),transparent_30%)]"><div className="flex items-center justify-between border-b border-white/[0.05] bg-[#071018]/75 px-4 py-2.5 backdrop-blur sm:px-6 lg:px-8"><Tooltip><TooltipTrigger asChild><button onClick={() => setLocation("/settings")} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium transition hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 ${offlineMode ? "border-amber-300/25 bg-amber-300/10 text-amber-200" : "border-emerald-300/25 bg-emerald-300/10 text-emerald-200"}`} aria-label={`Current execution mode: ${offlineMode ? "Offline" : "Cloud"}. Open user settings to change it.`}><span className={`h-1.5 w-1.5 rounded-full ${offlineMode ? "bg-amber-300" : "bg-emerald-300"}`} />{offlineMode ? "Offline mode" : "Cloud mode"}<span className="ml-1 text-slate-500">· change in settings</span></button></TooltipTrigger><TooltipContent side="bottom" className="max-w-xs"><p className="font-medium">{offlineMode ? "Offline" : "Cloud"} execution mode</p><p className="mt-1 opacity-80">Last sync: {persistedSettings?.lastSyncAt ? new Date(persistedSettings.lastSyncAt).toLocaleString() : "Not written yet"} · Data store: {persistedSettings?.sizeBytes ? `${(persistedSettings.sizeBytes / 1024).toFixed(1)} KB` : "0 B"}</p></TooltipContent></Tooltip><span className="text-[10px] uppercase tracking-[0.14em] text-slate-600">{saveExecutionMode.isPending ? "Saving preference…" : "Preference saved locally"}</span></div>{isMobile && <div className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-white/[0.06] bg-[#071018]/90 px-3 backdrop-blur"><SidebarTrigger className="h-9 w-9 text-slate-400" /><span className="text-sm font-medium text-white">{activeMenuItem?.label ?? "ModelDock"}</span></div>}<main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main></div></SidebarInset></>;
}

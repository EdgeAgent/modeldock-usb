import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useIsMobile } from "@/hooks/useMobile";
import { Activity, Bot, ClipboardCheck, Command, FileClock, LayoutDashboard, LogOut, PanelLeft, ShieldCheck, SlidersHorizontal, UsersRound } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const menuItems = [
  { icon: Command, label: "Command Center", path: "/chat" },
  { icon: LayoutDashboard, label: "Department Overview", path: "/" },
  { icon: Bot, label: "Agent Registry", path: "/agents" },
  { icon: Activity, label: "Live Run Monitor", path: "/runs" },
  { icon: ClipboardCheck, label: "Human Approval Queue", path: "/approvals", count: 26 },
  { icon: FileClock, label: "Audit Log", path: "/audit" },
  { icon: ShieldCheck, label: "Policy and Tool Registry", path: "/policies" },
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
  if (!user) return <div className="flex min-h-screen items-center justify-center bg-[#071018] text-white"><div className="flex w-full max-w-md flex-col items-center gap-6 p-8 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200"><Bot className="h-7 w-7" /></div><div><h1 className="text-2xl font-semibold tracking-tight">Sign in to Agent Ops Desk</h1><p className="mt-2 text-sm text-slate-500">Your human-directed operations console is protected by workspace authentication.</p></div><Button onClick={() => startLogin()} size="lg" className="w-full bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200">Sign in</Button></div></div>;
  return <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}><DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent></SidebarProvider>;
}

function DashboardLayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (width: number) => void }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
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
  return <><div ref={sidebarRef} className="relative"><Sidebar collapsible="icon" className="border-r border-white/[0.06] bg-[#09131c]" disableTransition={isResizing}><SidebarHeader className="h-20 justify-center border-b border-white/[0.06] px-4"><div className="flex items-center gap-3"><button onClick={toggleSidebar} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white" aria-label="Toggle navigation"><PanelLeft className="h-4 w-4" /></button>{!isCollapsed && <div className="min-w-0"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.8)]" /><span className="truncate text-sm font-semibold tracking-tight text-white">Agent Ops Desk</span></div><p className="mt-1 pl-4 text-[10px] uppercase tracking-[0.14em] text-slate-600">Control plane</p></div>}</div></SidebarHeader><SidebarContent className="gap-0 px-2 py-4"><div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600 group-data-[collapsible=icon]:hidden">Workspace</div><SidebarMenu className="gap-1">{menuItems.map((item) => <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={location === item.path} onClick={() => setLocation(item.path)} tooltip={item.label} className="h-10 rounded-lg text-xs font-medium text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-slate-200 data-[active=true]:bg-cyan-300/10 data-[active=true]:text-cyan-200"> <item.icon className="h-4 w-4 shrink-0" /><span>{item.label}</span>{item.count && !isCollapsed ? <span className="ml-auto rounded-full bg-amber-300/10 px-2 py-0.5 text-[10px] text-amber-300">{item.count}</span> : null}</SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu><div className="my-5 border-t border-white/[0.06]" /><div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600 group-data-[collapsible=icon]:hidden">System</div><SidebarMenu><SidebarMenuItem><SidebarMenuButton tooltip="Workspace settings" onClick={() => setLocation("/policies")} className="h-10 rounded-lg text-xs font-medium text-slate-500 hover:bg-white/[0.05] hover:text-slate-200"><SlidersHorizontal className="h-4 w-4" /><span>Workspace settings</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarContent><SidebarFooter className="border-t border-white/[0.06] p-3"><DropdownMenu><DropdownMenuTrigger asChild><button className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 group-data-[collapsible=icon]:justify-center"><Avatar className="h-8 w-8 border border-white/10"><AvatarFallback className="bg-cyan-300/10 text-xs font-semibold text-cyan-200">{user?.name?.charAt(0).toUpperCase() || "J"}</AvatarFallback></Avatar><div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-xs font-medium text-slate-200">{user?.name || "Workspace owner"}</p><p className="mt-0.5 truncate text-[10px] text-slate-600">{user?.email || "Operations lead"}</p></div></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-48 border-white/10 bg-[#101d29] text-slate-200"><DropdownMenuItem onClick={logout} className="cursor-pointer text-xs text-slate-300 focus:bg-white/[0.06] focus:text-white"><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu></SidebarFooter></Sidebar><div className={`absolute right-0 top-0 z-50 h-full w-1 cursor-col-resize transition-colors hover:bg-cyan-300/20 ${isCollapsed ? "hidden" : ""}`} onMouseDown={() => setIsResizing(true)} /></div><SidebarInset className="bg-[#071018]"><div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.05),transparent_30%)]">{isMobile && <div className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-white/[0.06] bg-[#071018]/90 px-3 backdrop-blur"><SidebarTrigger className="h-9 w-9 text-slate-400" /><span className="text-sm font-medium text-white">{activeMenuItem?.label ?? "Agent Ops Desk"}</span></div>}<main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main></div></SidebarInset></>;
}

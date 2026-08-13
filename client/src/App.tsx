import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import CommandCenter from "@/pages/CommandCenter";
import { AgentsView, ApprovalsView, AuditView, PoliciesView, RunsBoard } from "@/pages/WorkspaceViews";
import { DeliverablesView, WorkflowBuilderView } from "@/pages/WorkflowViews";
import SettingsView from "@/pages/SettingsView";
import { Route, Switch } from "wouter";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return <DashboardLayout><Switch><Route path="/" component={Home} /><Route path="/chat" component={CommandCenter} /><Route path="/agents" component={AgentsView} /><Route path="/runs" component={RunsBoard} /><Route path="/workflows" component={WorkflowBuilderView} /><Route path="/deliverables" component={DeliverablesView} /><Route path="/approvals" component={ApprovalsView} /><Route path="/audit" component={AuditView} /><Route path="/policies" component={PoliciesView} /><Route path="/settings" component={SettingsView} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch></DashboardLayout>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster theme="dark" /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

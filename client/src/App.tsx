import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import CommandCenter from "@/pages/CommandCenter";
import { Route, Switch } from "wouter";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return <DashboardLayout><Switch><Route path="/" component={Home} /><Route path="/chat" component={CommandCenter} /><Route path="/agents" component={Home} /><Route path="/runs" component={Home} /><Route path="/approvals" component={Home} /><Route path="/audit" component={Home} /><Route path="/policies" component={Home} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch></DashboardLayout>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster theme="dark" /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

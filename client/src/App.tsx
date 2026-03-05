import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "./pages/Home";
import { ChatWidget } from "./components/ChatWidget";
import { DisclaimerPopup } from "./components/DisclaimerPopup";
import { useVisitorTracking } from "./hooks/use-visitor";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useVisitorTracking();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <DisclaimerPopup />
        <Router />
        <ChatWidget />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

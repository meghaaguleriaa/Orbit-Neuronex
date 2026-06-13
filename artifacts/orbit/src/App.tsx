import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import AppLayout from "@/components/orbit/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Candidates from "@/pages/Candidates";
import CandidateProfile from "@/pages/CandidateProfile";
import DecisionChamber from "@/pages/DecisionChamber";
import Autopilot from "@/pages/Autopilot";
import Simulations from "@/pages/Simulations";
import HiddenTalent from "@/pages/HiddenTalent";
import TeamChemistry from "@/pages/TeamChemistry";
import Analytics from "@/pages/Analytics";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/candidates" component={Candidates} />
      <Route path="/candidates/:id" component={CandidateProfile} />
      <Route path="/decision-chamber" component={DecisionChamber} />
      <Route path="/autopilot" component={Autopilot} />
      <Route path="/simulations" component={Simulations} />
      <Route path="/hidden-talent" component={HiddenTalent} />
      <Route path="/team-chemistry" component={TeamChemistry} />
      <Route path="/analytics" component={Analytics} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppLayout>
              <Router />
            </AppLayout>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;

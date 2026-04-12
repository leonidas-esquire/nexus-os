import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import DocsLayout from "./pages/docs/DocsLayout";
import ManualLayout from "./pages/docs/ManualLayout";
import MarketplacePage from "./pages/marketplace/MarketplacePage";
import SkillDetailPage from "./pages/marketplace/SkillDetailPage";
import DeveloperPortal from "./pages/marketplace/DeveloperPortal";
import CompareSkills from "./pages/marketplace/CompareSkills";
import DependencyGraph from "./pages/marketplace/DependencyGraph";
import PublisherProfile from "./pages/marketplace/PublisherProfile";


function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/marketplace"} component={MarketplacePage} />
      <Route path={"/marketplace/compare"} component={CompareSkills} />
      <Route path={"/marketplace/developer"} component={DeveloperPortal} />
      <Route path={"/marketplace/dependencies"} component={DependencyGraph} />
      <Route path={"/marketplace/publisher/:handle"} component={PublisherProfile} />
      <Route path={"/marketplace/:skillName"} component={SkillDetailPage} />
      <Route path={"/docs/manual"} component={ManualLayout} />
      <Route path={"/docs/manual/:section"} component={ManualLayout} />
      <Route path={"/docs/manual/:section/:page"} component={ManualLayout} />
      <Route path={"/docs"} component={DocsLayout} />
      <Route path={"/docs/:section"} component={DocsLayout} />
      <Route path={"/docs/:section/:page"} component={DocsLayout} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import Home from "./pages/Home";
import DocsLayout from "./pages/docs/DocsLayout";
import ManualLayout from "./pages/docs/ManualLayout";
import MarketplacePage from "./pages/marketplace/MarketplacePage";
import SkillDetailPage from "./pages/marketplace/SkillDetailPage";
import DeveloperPortal from "./pages/marketplace/DeveloperPortal";
import CompareSkills from "./pages/marketplace/CompareSkills";
import DependencyGraph from "./pages/marketplace/DependencyGraph";
import PublisherProfile from "./pages/marketplace/PublisherProfile";
import WatchlistPage from "./pages/marketplace/WatchlistPage";
import LeaderboardPage from "./pages/marketplace/LeaderboardPage";
import AdminDashboard from "./pages/marketplace/AdminDashboard";
import BlogIndex from "./pages/blog/BlogIndex";
import BlogPost from "./pages/blog/BlogPost";
import BlogPostPreview from "./pages/blog/BlogPostPreview";
import AdminBlog from "./pages/admin/AdminBlog";
import LegalIndex from "./pages/legal/LegalIndex";
import TermsOfService from "./pages/legal/TermsOfService";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/marketplace"} component={MarketplacePage} />
      <Route path={"/marketplace/compare"} component={CompareSkills} />
      <Route path={"/marketplace/developer"} component={DeveloperPortal} />
      <Route path={"/marketplace/dependencies"} component={DependencyGraph} />
      <Route path={"/marketplace/watchlist"} component={WatchlistPage} />
      <Route path={"/marketplace/leaderboard"} component={LeaderboardPage} />
      <Route path={"/marketplace/admin"} component={AdminDashboard} />
      <Route path={"/marketplace/publisher/:handle"} component={PublisherProfile} />
      <Route path={"/marketplace/:skillName"} component={SkillDetailPage} />
      <Route path={"/docs/manual"} component={ManualLayout} />
      <Route path={"/docs/manual/:section"} component={ManualLayout} />
      <Route path={"/docs/manual/:section/:page"} component={ManualLayout} />
      <Route path={"/docs"} component={DocsLayout} />
      <Route path={"/docs/:section"} component={DocsLayout} />
      <Route path={"/docs/:section/:page"} component={DocsLayout} />
      {/* Blog — public */}
      <Route path="/blog" component={BlogIndex} />
      <Route path="/blog/preview/:token" component={BlogPostPreview} />
      <Route path="/blog/:slug" component={BlogPost} />
      {/* Blog — admin */}
      <Route path="/admin/blog" component={AdminBlog} />
      {/* Legal */}
      <Route path="/legal" component={LegalIndex} />
      <Route path="/legal/terms" component={TermsOfService} />
      <Route path="/legal/privacy" component={PrivacyPolicy} />
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
          <FavoritesProvider>
            <Toaster />
            <Router />
          </FavoritesProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

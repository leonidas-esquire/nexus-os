import { RegistryCatalog, RegistryDetail, RegistryDeveloper, RegistryAdmin, RegistryUpcoming } from "./pages/marketplace/Registry";
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
import BlogIndex from "./pages/blog/BlogIndex";
import BlogPost from "./pages/blog/BlogPost";
import BlogPostPreview from "./pages/blog/BlogPostPreview";
import AdminBlog from "./pages/admin/AdminBlog";
import LegalIndex from "./pages/legal/LegalIndex";
import TermsOfService from "./pages/legal/TermsOfService";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import ShowcaseIndex from "./pages/showcase/ShowcaseIndex";
import ShowcaseSubmit from "./pages/showcase/ShowcaseSubmit";
import ShowcaseProject from "./pages/showcase/ShowcaseProject";
import AdminShowcase from "./pages/admin/AdminShowcase";
import { SignIn, SignUp } from "@clerk/react";

function ClerkAuthPage({ mode }: { mode: "sign-in" | "sign-up" }) {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-16">
      {mode === "sign-in" ? (
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/"
        />
      ) : (
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/"
        />
      )}
    </main>
  );
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/sign-in" component={() => <ClerkAuthPage mode="sign-in" />} />
      <Route path="/sign-in/:rest*" component={() => <ClerkAuthPage mode="sign-in" />} />
      <Route path="/sign-up" component={() => <ClerkAuthPage mode="sign-up" />} />
      <Route path="/sign-up/:rest*" component={() => <ClerkAuthPage mode="sign-up" />} />
      <Route path={"/marketplace"} component={RegistryCatalog} />
      <Route path={"/marketplace/compare"} component={RegistryUpcoming} />
      <Route path={"/marketplace/developer"} component={RegistryDeveloper} />
      <Route path={"/marketplace/dependencies"} component={RegistryUpcoming} />
      <Route path={"/marketplace/watchlist"} component={RegistryUpcoming} />
      <Route path={"/marketplace/leaderboard"} component={RegistryUpcoming} />
      <Route path={"/marketplace/admin"} component={RegistryAdmin} />
      <Route path={"/marketplace/publisher/:handle"} component={RegistryUpcoming} />
      <Route path={"/marketplace/:skillName"} component={RegistryDetail} />
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
      {/* Showcase — public */}
      <Route path="/showcase" component={ShowcaseIndex} />
      <Route path="/showcase/submit" component={ShowcaseSubmit} />
      <Route path="/showcase/:slug" component={ShowcaseProject} />
      {/* Showcase — admin */}
      <Route path="/admin/showcase" component={AdminShowcase} />
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

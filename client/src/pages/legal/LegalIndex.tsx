import { Link } from "wouter";
import { useEffect } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { Network, FileText, Shield, Mail, ExternalLink } from "lucide-react";

export default function LegalIndex() {
  useEffect(() => {
    document.title = "Legal — Nexus OS";
    const meta = document.querySelector('meta[name="robots"]');
    if (meta) {
      meta.setAttribute("content", "noindex, follow");
    } else {
      const el = document.createElement("meta");
      el.setAttribute("name", "robots");
      el.setAttribute("content", "noindex, follow");
      document.head.appendChild(el);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-nexus-deep/50 backdrop-blur-md sticky top-0 z-40">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-nexus-indigo/20 flex items-center justify-center border border-nexus-indigo/30">
                <Network size={14} className="text-nexus-indigo" />
              </div>
              <span className="font-mono font-bold text-sm">
                nexus<span className="text-nexus-indigo">.</span>os
              </span>
            </Link>
            <span className="text-muted-foreground font-mono text-sm hidden sm:inline">
              /legal
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container py-16 max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Legal</h1>
        <p className="text-muted-foreground text-lg mb-12">
          Legal documents and policies for Nexus OS.
        </p>

        <div className="space-y-6">
          {/* Terms of Service */}
          <Link href="/legal/terms">
            <div className="group terminal-border rounded-lg p-6 hover:border-nexus-indigo/40 transition-all duration-300 cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 rounded-md bg-nexus-indigo/10 flex items-center justify-center text-nexus-indigo">
                  <FileText size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="font-mono font-semibold text-lg text-foreground group-hover:text-nexus-indigo transition-colors">
                      Terms of Service
                    </h2>
                    <ExternalLink size={16} className="text-muted-foreground group-hover:text-nexus-indigo transition-colors" />
                  </div>
                  <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                    Our Terms of Service govern your use of the Nexus OS software, website, and related services.
                  </p>
                  <span className="text-xs text-muted-foreground mt-2 inline-block">
                    Last updated: April 12, 2026
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* Privacy Policy */}
          <Link href="/legal/privacy">
            <div className="group terminal-border rounded-lg p-6 hover:border-nexus-indigo/40 transition-all duration-300 cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 rounded-md bg-nexus-green/10 flex items-center justify-center text-nexus-green">
                  <Shield size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="font-mono font-semibold text-lg text-foreground group-hover:text-nexus-indigo transition-colors">
                      Privacy Policy
                    </h2>
                    <ExternalLink size={16} className="text-muted-foreground group-hover:text-nexus-indigo transition-colors" />
                  </div>
                  <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                    Our Privacy Policy explains how we collect, use, and protect your personal information.
                  </p>
                  <span className="text-xs text-muted-foreground mt-2 inline-block">
                    Last updated: April 12, 2026
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Contact Section */}
        <div className="mt-12 pt-8 border-t border-border">
          <h2 className="font-mono font-semibold text-lg mb-4">Contact</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-nexus-indigo" />
              <span>Legal inquiries: <a href="mailto:legal@aiagents.nexus" className="text-nexus-indigo hover:underline">legal@aiagents.nexus</a></span>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-nexus-green" />
              <span>Privacy inquiries: <a href="mailto:privacy@aiagents.nexus" className="text-nexus-indigo hover:underline">privacy@aiagents.nexus</a></span>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-muted-foreground" />
              <span>Support: <a href="mailto:support@aiagents.nexus" className="text-nexus-indigo hover:underline">support@aiagents.nexus</a></span>
            </div>
          </div>
        </div>

        {/* Open Source */}
        <div className="mt-8 pt-8 border-t border-border">
          <h2 className="font-mono font-semibold text-lg mb-4">Open Source Licenses</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nexus OS CLI is licensed under Apache 2.0. View our open source components and their licenses on{" "}
            <a
              href="https://github.com/leonidas-esquire/nexus-os"
              target="_blank"
              rel="noopener noreferrer"
              className="text-nexus-indigo hover:underline"
            >
              GitHub
            </a>.
          </p>
        </div>

        <p className="text-xs text-muted-foreground mt-8 italic">
          These documents are provided for informational purposes and do not constitute legal advice.
        </p>
      </main>
    </div>
  );
}

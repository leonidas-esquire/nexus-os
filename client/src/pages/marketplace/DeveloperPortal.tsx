/*
 * DeveloperPortal — /marketplace/developer
 * Developer dashboard with earnings, published skills, recent activity,
 * payout history, and publish flow.
 */
import { useState } from "react";
import { Link } from "wouter";
import {
  DollarSign, TrendingUp, Package, Activity, ArrowRight,
  ChevronRight, Download, Clock, CheckCircle2, Wallet,
  Star, ExternalLink, Plus, Sun, Moon, Code2, BookOpen,
  LayoutDashboard, Menu, X, ArrowUpRight, CreditCard,
  BarChart3, History,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  DEVELOPER_EARNINGS, PAYOUTS, RECENT_ACTIVITY,
  formatNumber, formatMoney,
  type DeveloperEarnings, type Payout, type ActivityEntry,
} from "./marketplaceData";

const DEV_HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310419663030909471/NRmiWdZq2JgxyAQQ5B7Zs7/marketplace-dev-portal-24RhdqPyGkQzi2H9ffNfe7.webp";

/* ─── Summary Card ────────────────────────────────────────────────────────── */
function SummaryCard({
  icon, label, value, sub, accent,
}: {
  icon: React.ReactNode; label: string; value: string; sub?: string; accent?: string;
}) {
  return (
    <div className="bg-card/60 border border-border/50 rounded-xl p-5 hover:border-border transition-colors">
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        {icon}
        <span className="text-xs uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className={`text-2xl sm:text-3xl font-bold ${accent || "text-foreground"}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */
export default function DeveloperPortal() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "skills" | "payouts">("overview");
  const { theme, toggleTheme } = useTheme();

  const totalRevenue = DEVELOPER_EARNINGS.reduce((a, e) => a + e.revenue, 0);
  const totalEarnings = DEVELOPER_EARNINGS.reduce((a, e) => a + e.yourCut, 0);
  const pendingPayout = totalEarnings;
  const totalCalls = DEVELOPER_EARNINGS.reduce((a, e) => a + e.calls, 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/">
              <span className="font-bold text-lg tracking-tight cursor-pointer">
                nexus<span className="text-nexus-indigo">.</span>os
              </span>
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
            <Link href="/marketplace">
              <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer hidden sm:block">Marketplace</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
            <span className="text-foreground font-medium hidden sm:block">Developer Portal</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm">
            <Link href="/marketplace">
              <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Browse Skills</span>
            </Link>
            <Link href="/docs">
              <span className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <Code2 className="w-4 h-4" /> Docs
              </span>
            </Link>
            <button
              onClick={() => toggleTheme?.()}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          <button className="md:hidden p-2 rounded-lg hover:bg-accent" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl p-4 space-y-3">
            <Link href="/marketplace"><span className="block text-sm py-2 cursor-pointer">Browse Skills</span></Link>
            <Link href="/docs"><span className="block text-sm py-2 cursor-pointer">API Docs</span></Link>
            <Link href="/docs/manual"><span className="block text-sm py-2 cursor-pointer">Manual</span></Link>
          </div>
        )}
      </nav>

      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={DEV_HERO} alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8 sm:pt-16 sm:pb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-nexus-green/10 border border-nexus-green/20 text-nexus-green text-xs font-medium mb-4">
                <LayoutDashboard className="w-3.5 h-3.5" />
                Developer Dashboard
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">@verified-dev</h1>
              <p className="text-sm text-muted-foreground">dev@example.com &middot; AXIS Verified (T2/AAA)</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => toast.info("Publish flow: naos marketplace publish ./my-skill/")}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-nexus-indigo text-white rounded-xl font-medium text-sm hover:bg-nexus-indigo/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Publish Skill
              </button>
              <button
                onClick={() => toast.success("Withdrawal of $230.30 initiated. Expected: 2-3 business days.")}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-card border border-border/50 rounded-xl font-medium text-sm hover:bg-accent transition-colors"
              >
                <Wallet className="w-4 h-4" />
                Withdraw
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Summary Cards ────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-2">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <SummaryCard
            icon={<DollarSign className="w-4 h-4" />}
            label="This Month"
            value={formatMoney(totalEarnings)}
            accent="text-nexus-green"
          />
          <SummaryCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="All Time Revenue"
            value={formatMoney(totalRevenue + PAYOUTS.reduce((a, p) => a + p.amount, 0))}
          />
          <SummaryCard
            icon={<CreditCard className="w-4 h-4" />}
            label="Pending Payout"
            value={formatMoney(pendingPayout)}
            accent="text-nexus-amber"
          />
          <SummaryCard
            icon={<Activity className="w-4 h-4" />}
            label="Total Calls"
            value={formatNumber(totalCalls)}
          />
        </div>
      </section>

      {/* ─── Tabs ─────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        <div className="flex gap-1 border-b border-border/50 mb-6">
          {(["overview", "skills", "payouts"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? "border-nexus-indigo text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ─── Overview Tab ───────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
            {/* Earnings Table */}
            <div className="lg:col-span-2">
              <div className="bg-card/60 border border-border/50 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
                  <h2 className="font-semibold flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-nexus-indigo" />
                    Earnings by Skill
                  </h2>
                  <span className="text-xs text-muted-foreground">70% revenue share</span>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="bg-card/30">
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Skill</th>
                      <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Calls</th>
                      <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Revenue</th>
                      <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Your Cut (70%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEVELOPER_EARNINGS.map((e) => (
                      <tr key={e.skill} className="border-t border-border/20 hover:bg-card/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <Link href={`/marketplace/${e.skill}`}>
                            <span className="font-medium text-sm hover:text-nexus-indigo transition-colors cursor-pointer">{e.skill}</span>
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm text-muted-foreground">{formatNumber(e.calls)}</td>
                        <td className="px-5 py-3.5 text-right text-sm">{formatMoney(e.revenue)}</td>
                        <td className="px-5 py-3.5 text-right text-sm font-medium text-nexus-green">{formatMoney(e.yourCut)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border/50 bg-card/30">
                      <td className="px-5 py-3 font-semibold text-sm">Total</td>
                      <td className="px-5 py-3 text-right text-sm text-muted-foreground">{formatNumber(totalCalls)}</td>
                      <td className="px-5 py-3 text-right text-sm font-medium">{formatMoney(totalRevenue)}</td>
                      <td className="px-5 py-3 text-right text-sm font-bold text-nexus-green">{formatMoney(totalEarnings)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <div className="bg-card/60 border border-border/50 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border/30">
                  <h2 className="font-semibold flex items-center gap-2">
                    <History className="w-5 h-5 text-nexus-cyan" />
                    Recent Activity
                  </h2>
                </div>
                <div className="divide-y divide-border/20">
                  {RECENT_ACTIVITY.map((a, i) => (
                    <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-card/40 transition-colors">
                      <div>
                        <p className="text-sm font-medium">{a.skill}</p>
                        <p className="text-xs text-muted-foreground">+{formatNumber(a.calls)} calls</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-nexus-green">+{formatMoney(a.revenue)}</p>
                        <p className="text-xs text-muted-foreground">{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Skills Tab ─────────────────────────────────────────────────── */}
        {activeTab === "skills" && (
          <div className="pb-20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Your Published Skills</h2>
              <button
                onClick={() => toast.info("Run: naos marketplace publish ./my-skill/")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-nexus-indigo text-white rounded-lg text-sm font-medium hover:bg-nexus-indigo/90 transition-colors"
              >
                <Plus className="w-4 h-4" /> Publish New
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DEVELOPER_EARNINGS.map((e) => (
                <Link key={e.skill} href={`/marketplace/${e.skill}`}>
                  <div className="bg-card/60 border border-border/50 rounded-xl p-5 hover:border-nexus-indigo/30 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-nexus-indigo/10 border border-nexus-indigo/20 flex items-center justify-center">
                          <Package className="w-5 h-5 text-nexus-indigo" />
                        </div>
                        <div>
                          <h3 className="font-semibold group-hover:text-nexus-indigo transition-colors">{e.skill}</h3>
                          <p className="text-xs text-muted-foreground">{formatNumber(e.calls)} calls</p>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/30">
                      <div>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                        <p className="text-sm font-medium">{formatMoney(e.revenue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Your Earnings</p>
                        <p className="text-sm font-medium text-nexus-green">{formatMoney(e.yourCut)}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="w-3 h-3 text-nexus-amber fill-nexus-amber" />
                        4.9 &middot; 1,234 reviews
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Publish Instructions */}
            <div className="mt-8 bg-card/40 border border-border/30 rounded-xl p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="w-5 h-5 text-nexus-indigo" />
                How to Publish a Skill
              </h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-nexus-indigo/10 text-nexus-indigo text-xs font-bold flex items-center justify-center shrink-0">1</span>
                  <div>
                    <p className="text-foreground font-medium">Create your skill package</p>
                    <p>Include <code className="text-xs bg-muted/50 px-1.5 py-0.5 rounded">skill.toml</code>, <code className="text-xs bg-muted/50 px-1.5 py-0.5 rounded">skill.wasm</code>, and <code className="text-xs bg-muted/50 px-1.5 py-0.5 rounded">README.md</code></p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-nexus-indigo/10 text-nexus-indigo text-xs font-bold flex items-center justify-center shrink-0">2</span>
                  <div>
                    <p className="text-foreground font-medium">Configure pricing in skill.toml</p>
                    <p>Choose per-call, flat, or free pricing model</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-nexus-indigo/10 text-nexus-indigo text-xs font-bold flex items-center justify-center shrink-0">3</span>
                  <div>
                    <p className="text-foreground font-medium">Publish via CLI</p>
                    <code className="text-xs bg-muted/50 px-2 py-1 rounded font-mono text-nexus-green block mt-1">$ naos marketplace publish ./my-skill/</code>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-nexus-indigo/10 text-nexus-indigo text-xs font-bold flex items-center justify-center shrink-0">4</span>
                  <div>
                    <p className="text-foreground font-medium">Complete Stripe onboarding</p>
                    <p>Set up payouts to receive your 70% revenue share</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Payouts Tab ────────────────────────────────────────────────── */}
        {activeTab === "payouts" && (
          <div className="pb-20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Payout History</h2>
              <button
                onClick={() => toast.success("Withdrawal of $230.30 initiated. Expected: 2-3 business days.")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-nexus-green text-white rounded-lg text-sm font-medium hover:bg-nexus-green/90 transition-colors"
              >
                <Wallet className="w-4 h-4" /> Withdraw {formatMoney(pendingPayout)}
              </button>
            </div>

            {/* Pending */}
            <div className="bg-nexus-amber/5 border border-nexus-amber/20 rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-nexus-amber/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-nexus-amber" />
                  </div>
                  <div>
                    <p className="font-medium">Pending Payout</p>
                    <p className="text-sm text-muted-foreground">Available for withdrawal</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-nexus-amber">{formatMoney(pendingPayout)}</p>
              </div>
            </div>

            {/* History */}
            <div className="bg-card/60 border border-border/50 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-card/30">
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Date</th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Amount</th>
                    <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Transfer ID</th>
                  </tr>
                </thead>
                <tbody>
                  {PAYOUTS.map((p) => (
                    <tr key={p.transferId} className="border-t border-border/20 hover:bg-card/40 transition-colors">
                      <td className="px-5 py-3.5 text-sm">{p.date}</td>
                      <td className="px-5 py-3.5 text-sm text-right font-medium">{formatMoney(p.amount)}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-nexus-green">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-xs font-mono text-muted-foreground">{p.transferId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Stripe Connect Info */}
            <div className="mt-6 bg-card/40 border border-border/30 rounded-xl p-5">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-nexus-indigo" />
                Stripe Connect
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Payouts are processed via Stripe Connect. Funds typically arrive in 2-3 business days.
              </p>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">Account:</span>
                <code className="text-xs font-mono bg-muted/30 px-2 py-1 rounded">acct_xxx...xxx</code>
                <span className="inline-flex items-center gap-1 text-xs text-nexus-green">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; 2026 Nexus OS. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/"><span className="hover:text-foreground transition-colors cursor-pointer">Home</span></Link>
            <Link href="/marketplace"><span className="hover:text-foreground transition-colors cursor-pointer">Marketplace</span></Link>
            <Link href="/docs"><span className="hover:text-foreground transition-colors cursor-pointer">Docs</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

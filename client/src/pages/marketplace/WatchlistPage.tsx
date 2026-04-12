import { Link } from "wouter";
import { Heart, Bell, BellOff, Trash2, ExternalLink, Shield, ArrowUpRight, Sun, Moon, ChevronRight, Package } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { SKILLS, trustBadge, formatNumber, timeAgo } from "./marketplaceData";
import NotificationBell from "./NotificationBell";

export default function WatchlistPage() {
  const { theme, toggleTheme } = useTheme();
  const {
    favorites,
    notifications,
    unreadCount,
    toggleFavorite,
    toggleNotify,
    markNotificationRead,
    markAllNotificationsRead,
  } = useFavorites();

  const watchedSkills = favorites
    .map((f) => {
      const skill = SKILLS.find((s) => s.name === f.skillName);
      return skill ? { ...f, skill } : null;
    })
    .filter(Boolean) as Array<{ skillName: string; addedAt: string; lastVersion: string; notify: boolean; skill: (typeof SKILLS)[0] }>;

  const typeIcons: Record<string, { icon: string; color: string }> = {
    new_version: { icon: "📦", color: "text-nexus-indigo" },
    security_update: { icon: "🛡️", color: "text-nexus-amber" },
    deprecation: { icon: "⚠️", color: "text-nexus-amber" },
    price_change: { icon: "💰", color: "text-nexus-green" },
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-mono font-bold text-lg tracking-tight">
              nexus<span className="text-nexus-indigo">.os</span>
            </Link>
            <span className="text-muted-foreground">›</span>
            <Link href="/marketplace" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Marketplace
            </Link>
            <span className="text-muted-foreground">›</span>
            <span className="text-sm font-medium">Watchlist</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/marketplace" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Browse</Link>
            <Link href="/marketplace/developer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Developer</Link>
            <NotificationBell />
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-accent transition-colors">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-6 h-6 text-red-400 fill-red-400" />
              <h1 className="text-2xl font-bold">My Watchlist</h1>
              <span className="text-sm text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
                {favorites.length} skills
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              Track your favorite skills and get notified when new versions are published.
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsRead}
              className="text-sm text-nexus-indigo hover:text-nexus-indigo/80 transition-colors"
            >
              Mark all as read ({unreadCount})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Watched Skills List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Watched Skills
            </h2>
            {watchedSkills.length === 0 ? (
              <div className="border border-dashed border-border rounded-xl p-12 text-center">
                <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-2">No skills in your watchlist yet.</p>
                <Link href="/marketplace" className="text-sm text-nexus-indigo hover:underline">
                  Browse the marketplace →
                </Link>
              </div>
            ) : (
              watchedSkills.map(({ skillName, addedAt, lastVersion, notify, skill }) => (
                <div
                  key={skillName}
                  className="border border-border rounded-xl p-4 hover:border-nexus-indigo/30 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <Link
                          href={`/marketplace/${skillName}`}
                          className="font-mono font-semibold text-foreground hover:text-nexus-indigo transition-colors"
                        >
                          {skillName}
                        </Link>
                        <span className="text-xs bg-accent text-muted-foreground px-2 py-0.5 rounded-full font-mono">
                          v{skill.version}
                        </span>
                        {skill.version !== lastVersion && (
                          <span className="text-xs bg-nexus-green/20 text-nexus-green px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3" />
                            Update available
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {trustBadge(skill.trust)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                        {skill.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{formatNumber(skill.stats.totalCalls)} calls</span>
                        <span>⭐ {skill.stats.rating}</span>
                        <span>{skill.wasmSize}</span>
                        <span>Added {addedAt}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => toggleNotify(skillName)}
                        className={`p-2 rounded-lg transition-colors ${
                          notify
                            ? "text-nexus-indigo bg-nexus-indigo/10 hover:bg-nexus-indigo/20"
                            : "text-muted-foreground hover:bg-accent"
                        }`}
                        title={notify ? "Notifications on" : "Notifications off"}
                      >
                        {notify ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      </button>
                      <Link
                        href={`/marketplace/${skillName}`}
                        className="p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
                        title="View skill"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => toggleFavorite(skillName, skill.version)}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Remove from watchlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Notifications Sidebar */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Update Notifications
              {unreadCount > 0 && (
                <span className="text-xs bg-nexus-indigo text-white px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h2>
            {notifications.length === 0 ? (
              <div className="border border-dashed border-border rounded-xl p-8 text-center">
                <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const typeInfo = typeIcons[n.type] || { icon: "📌", color: "text-foreground" };
                return (
                  <button
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className={`w-full text-left border rounded-xl p-3 transition-all ${
                      n.read
                        ? "border-border bg-transparent opacity-60"
                        : "border-nexus-indigo/30 bg-nexus-indigo/5"
                    } hover:border-nexus-indigo/50`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-base mt-0.5">{typeInfo.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-semibold">{n.skillName}</span>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-nexus-indigo flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                        <span className="text-xs text-muted-foreground/60 mt-1 block">
                          {timeAgo(n.timestamp)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}

            {/* Quick Stats */}
            <div className="border border-border rounded-xl p-4 mt-6">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-nexus-indigo" />
                Watchlist Stats
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Watching</span>
                  <span className="font-semibold">{favorites.length} skills</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Notifications on</span>
                  <span className="font-semibold">{favorites.filter((f) => f.notify).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updates available</span>
                  <span className="font-semibold text-nexus-green">
                    {watchedSkills.filter((w) => w.skill.version !== w.lastVersion).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unread alerts</span>
                  <span className="font-semibold text-nexus-indigo">{unreadCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-6">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link href="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link>
            <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
          </div>
          <span>© 2026 Nexus OS</span>
        </div>
      </footer>
    </div>
  );
}

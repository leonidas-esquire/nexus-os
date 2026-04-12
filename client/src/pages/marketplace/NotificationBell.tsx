/**
 * NotificationBell — Marketplace notification dropdown.
 * Shows alerts for new skill versions, review replies, and payout events.
 */
import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import {
  Bell, GitBranch, MessageSquare, DollarSign, Package,
  Check, CheckCheck, Star, Shield, X, ChevronRight,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────── */
type NotificationType = "version" | "review" | "payout" | "publish" | "trust";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
}

/* ─── Mock Data ──────────────────────────────────────────────────────────── */
const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "version",
    title: "New version available",
    message: "json-parser v1.2.0 released — adds recursive descent mode and streaming support",
    time: "2 hours ago",
    read: false,
    link: "/marketplace/json-parser",
  },
  {
    id: "n2",
    type: "review",
    title: "New review on csv-parser",
    message: "DataEngineer42 left a 5-star review: \"Handles edge cases beautifully\"",
    time: "5 hours ago",
    read: false,
    link: "/marketplace/csv-parser",
  },
  {
    id: "n3",
    type: "payout",
    title: "Payout processed",
    message: "$127.40 has been deposited to your Stripe account (March 2026)",
    time: "1 day ago",
    read: false,
    link: "/marketplace/developer",
  },
  {
    id: "n4",
    type: "trust",
    title: "AXIS trust score updated",
    message: "json-parser upgraded to T2/AAA — highest trust tier achieved",
    time: "2 days ago",
    read: true,
    link: "/marketplace/json-parser",
  },
  {
    id: "n5",
    type: "publish",
    title: "Skill approved",
    message: "csv-parser v2.0.0 passed AXIS review and is now live on the marketplace",
    time: "3 days ago",
    read: true,
    link: "/marketplace/csv-parser",
  },
  {
    id: "n6",
    type: "review",
    title: "Review reply",
    message: "You received a reply to your review on regex-matcher from @PatternSystems",
    time: "4 days ago",
    read: true,
    link: "/marketplace/regex-matcher",
  },
  {
    id: "n7",
    type: "version",
    title: "Dependency updated",
    message: "email-extractor v1.1.0 — a dependency of your agent — has been updated",
    time: "5 days ago",
    read: true,
    link: "/marketplace/email-extractor",
  },
  {
    id: "n8",
    type: "payout",
    title: "Revenue milestone",
    message: "Congratulations! Your total marketplace earnings have exceeded $1,000",
    time: "1 week ago",
    read: true,
  },
];

/* ─── Icon Map ───────────────────────────────────────────────────────────── */
function NotifIcon({ type }: { type: NotificationType }) {
  const base = "w-4 h-4";
  switch (type) {
    case "version":
      return <GitBranch className={`${base} text-nexus-cyan`} />;
    case "review":
      return <MessageSquare className={`${base} text-nexus-amber`} />;
    case "payout":
      return <DollarSign className={`${base} text-nexus-green`} />;
    case "publish":
      return <Package className={`${base} text-nexus-indigo`} />;
    case "trust":
      return <Shield className={`${base} text-purple-400`} />;
  }
}

function NotifBadgeColor(type: NotificationType): string {
  switch (type) {
    case "version": return "bg-nexus-cyan/10 border-nexus-cyan/20";
    case "review": return "bg-nexus-amber/10 border-nexus-amber/20";
    case "payout": return "bg-nexus-green/10 border-nexus-green/20";
    case "publish": return "bg-nexus-indigo/10 border-nexus-indigo/20";
    case "trust": return "bg-purple-400/10 border-purple-400/20";
  }
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | NotificationType>("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const filtered = filter === "all"
    ? notifications
    : notifications.filter((n) => n.type === filter);

  const FILTERS: { key: "all" | NotificationType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "version", label: "Versions" },
    { key: "review", label: "Reviews" },
    { key: "payout", label: "Payouts" },
    { key: "publish", label: "Published" },
    { key: "trust", label: "Trust" },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-accent/50 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4.5 h-4.5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-in zoom-in duration-200">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] bg-background border border-border/50 rounded-xl shadow-2xl overflow-hidden z-[80] animate-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-nexus-indigo hover:text-nexus-indigo/80 flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="px-3 py-2 border-b border-border/20 flex gap-1 overflow-x-auto">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                  filter === f.key
                    ? "bg-nexus-indigo/10 text-nexus-indigo"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <Bell className="w-6 h-6 mx-auto mb-2 opacity-30" />
                No notifications
              </div>
            ) : (
              filtered.map((notif) => {
                const content = (
                  <div
                    key={notif.id}
                    onClick={() => markRead(notif.id)}
                    className={`px-4 py-3 border-b border-border/10 hover:bg-accent/20 transition-colors cursor-pointer ${
                      !notif.read ? "bg-nexus-indigo/[0.03]" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${NotifBadgeColor(notif.type)}`}>
                        <NotifIcon type={notif.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-semibold ${!notif.read ? "text-foreground" : "text-foreground/70"}`}>
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-nexus-indigo shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{notif.time}</p>
                      </div>
                    </div>
                  </div>
                );

                return notif.link ? (
                  <Link key={notif.id} href={notif.link}>
                    <span onClick={() => setOpen(false)}>{content}</span>
                  </Link>
                ) : (
                  content
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border/30 bg-accent/5">
            <Link href="/marketplace/developer">
              <span
                onClick={() => setOpen(false)}
                className="text-xs text-nexus-indigo hover:text-nexus-indigo/80 flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                View all activity <ChevronRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

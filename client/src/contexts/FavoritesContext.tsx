import { createContext, useContext, useState, useCallback, ReactNode } from "react";

/* ─── Types ─────────────────────────────────────────────────────────────── */

export interface WatchlistEntry {
  skillName: string;
  addedAt: string;
  lastVersion: string;
  notify: boolean;
}

export interface WatchlistNotification {
  id: string;
  skillName: string;
  type: "new_version" | "security_update" | "deprecation" | "price_change";
  message: string;
  version?: string;
  timestamp: string;
  read: boolean;
}

interface FavoritesContextType {
  favorites: WatchlistEntry[];
  notifications: WatchlistNotification[];
  unreadCount: number;
  isFavorite: (skillName: string) => boolean;
  toggleFavorite: (skillName: string, currentVersion: string) => void;
  toggleNotify: (skillName: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearFavorites: () => void;
}

/* ─── Mock Notifications ────────────────────────────────────────────────── */

const MOCK_WATCHLIST_NOTIFICATIONS: WatchlistNotification[] = [
  {
    id: "wn-1",
    skillName: "json-parser",
    type: "new_version",
    message: "json-parser v1.3.0 is now available with streaming support improvements",
    version: "1.3.0",
    timestamp: "2026-04-10T14:30:00Z",
    read: false,
  },
  {
    id: "wn-2",
    skillName: "csv-parser",
    type: "security_update",
    message: "csv-parser v1.0.1 patches a buffer overflow in large file handling",
    version: "1.0.1",
    timestamp: "2026-04-09T09:15:00Z",
    read: false,
  },
  {
    id: "wn-3",
    skillName: "sentiment-analyzer",
    type: "new_version",
    message: "sentiment-analyzer v3.1.0 adds support for 12 new languages",
    version: "3.1.0",
    timestamp: "2026-04-08T18:00:00Z",
    read: true,
  },
  {
    id: "wn-4",
    skillName: "email-extractor",
    type: "price_change",
    message: "email-extractor reduced pricing from $0.0003 to $0.0002 per call",
    timestamp: "2026-04-07T11:45:00Z",
    read: true,
  },
  {
    id: "wn-5",
    skillName: "url-validator",
    type: "new_version",
    message: "url-validator v1.1.0 adds IPv6 and internationalized domain support",
    version: "1.1.0",
    timestamp: "2026-04-06T16:20:00Z",
    read: true,
  },
];

/* ─── Default Watchlist ─────────────────────────────────────────────────── */

const DEFAULT_FAVORITES: WatchlistEntry[] = [
  { skillName: "json-parser", addedAt: "2026-03-15", lastVersion: "1.2.0", notify: true },
  { skillName: "csv-parser", addedAt: "2026-03-20", lastVersion: "1.0.0", notify: true },
  { skillName: "sentiment-analyzer", addedAt: "2026-03-25", lastVersion: "3.0.0", notify: true },
  { skillName: "email-extractor", addedAt: "2026-04-01", lastVersion: "2.0.1", notify: false },
  { skillName: "url-validator", addedAt: "2026-04-05", lastVersion: "1.0.2", notify: true },
];

/* ─── Context ───────────────────────────────────────────────────────────── */

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<WatchlistEntry[]>(DEFAULT_FAVORITES);
  const [notifications, setNotifications] = useState<WatchlistNotification[]>(MOCK_WATCHLIST_NOTIFICATIONS);

  const isFavorite = useCallback(
    (skillName: string) => favorites.some((f) => f.skillName === skillName),
    [favorites]
  );

  const toggleFavorite = useCallback((skillName: string, currentVersion: string) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.skillName === skillName);
      if (exists) return prev.filter((f) => f.skillName !== skillName);
      return [
        ...prev,
        {
          skillName,
          addedAt: new Date().toISOString().split("T")[0],
          lastVersion: currentVersion,
          notify: true,
        },
      ];
    });
  }, []);

  const toggleNotify = useCallback((skillName: string) => {
    setFavorites((prev) =>
      prev.map((f) => (f.skillName === skillName ? { ...f, notify: !f.notify } : f))
    );
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        notifications,
        unreadCount,
        isFavorite,
        toggleFavorite,
        toggleNotify,
        markNotificationRead,
        markAllNotificationsRead,
        clearFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}

import { Moon, Sun } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme, switchable } = useTheme();

  if (!switchable || !toggleTheme) return null;

  return (
    <button
      onClick={toggleTheme}
      className={`relative p-2 rounded-md border border-border hover:border-nexus-indigo/30 hover:bg-nexus-surface/50 transition-all group ${className}`}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-muted-foreground group-hover:text-nexus-amber transition-colors" />
      ) : (
        <Moon className="w-4 h-4 text-muted-foreground group-hover:text-nexus-indigo transition-colors" />
      )}
    </button>
  );
}

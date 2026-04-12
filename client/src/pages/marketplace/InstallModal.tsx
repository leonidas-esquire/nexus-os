import { useState, useEffect, useCallback } from "react";
import { X, Download, Shield, Settings, CheckCircle2, Loader2, Package, AlertTriangle, Terminal } from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface InstallStep {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  duration: number; // ms to simulate
}

interface InstallModalProps {
  skillName: string;
  skillVersion: string;
  wasmSize: string;
  publisher: string;
  trustBadge: string;
  isOpen: boolean;
  onClose: () => void;
}

/* ─── Steps ─────────────────────────────────────────────────────────────── */

const INSTALL_STEPS: InstallStep[] = [
  {
    id: "resolve",
    label: "Resolving Package",
    description: "Checking registry for latest compatible version...",
    icon: <Package className="w-4 h-4" />,
    duration: 800,
  },
  {
    id: "download",
    label: "Downloading WASM Binary",
    description: "Fetching compiled binary from CDN...",
    icon: <Download className="w-4 h-4" />,
    duration: 1500,
  },
  {
    id: "verify",
    label: "AXIS Trust Verification",
    description: "Validating publisher signature and trust score...",
    icon: <Shield className="w-4 h-4" />,
    duration: 1200,
  },
  {
    id: "sandbox",
    label: "Sandbox Validation",
    description: "Testing WASM binary in isolated environment...",
    icon: <AlertTriangle className="w-4 h-4" />,
    duration: 1000,
  },
  {
    id: "config",
    label: "Updating Configuration",
    description: "Adding skill to nexus.config.yaml...",
    icon: <Settings className="w-4 h-4" />,
    duration: 600,
  },
];

/* ─── Log Lines ─────────────────────────────────────────────────────────── */

function getLogLines(step: string, skillName: string, version: string, wasmSize: string, publisher: string, trustBadge: string | undefined): string[] {
  const badge = trustBadge ?? "Unknown";
  switch (step) {
    case "resolve":
      return [
        `$ naos marketplace install ${skillName}`,
        `Resolving ${skillName}@^${version}...`,
        `Found ${skillName}@${version} (${wasmSize})`,
        `Publisher: ${publisher} [${badge}]`,
        `License: MIT — compatible ✓`,
      ];
    case "download":
      return [
        `Downloading ${skillName}-${version}.wasm...`,
        `  ████████████████████████████████ 100%`,
        `  ${wasmSize} downloaded in 0.3s`,
        `Checksum: sha256:a3f7...9c2e ✓`,
      ];
    case "verify":
      return [
        `Verifying AXIS trust chain...`,
        `  Publisher AUID: axis:company:dev:01hx...`,
        `  Trust Tier: ${badge.split("/")[0]} — ${badge.split("/")[0] <= "T2" ? "HIGH TRUST" : "STANDARD"}`,
        `  Signature: ed25519 — valid ✓`,
        `  No known vulnerabilities ✓`,
      ];
    case "sandbox":
      return [
        `Running sandbox validation...`,
        `  Memory limit: 256MB — within bounds ✓`,
        `  Execution time: 3ms avg — within 100ms limit ✓`,
        `  No filesystem access requested ✓`,
        `  No network access requested ✓`,
        `  Sandbox test: PASSED ✓`,
      ];
    case "config":
      return [
        `Updating nexus.config.yaml...`,
        `  Added [skills.${skillName}]`,
        `  version = "${version}"`,
        `  priority = "normal"`,
        ``,
        `✓ ${skillName}@${version} installed successfully`,
        `  Run 'naos skills list' to verify`,
      ];
    default:
      return [];
  }
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function InstallModal({ skillName, skillVersion, wasmSize, publisher, trustBadge, isOpen, onClose }: InstallModalProps) {
  const [currentStep, setCurrentStep] = useState(-1); // -1 = not started
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const reset = useCallback(() => {
    setCurrentStep(-1);
    setCompletedSteps([]);
    setLogLines([]);
    setIsComplete(false);
    setIsInstalling(false);
    setDownloadProgress(0);
  }, []);

  // Reset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(reset, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen, reset]);

  // Auto-progress through steps
  useEffect(() => {
    if (!isInstalling || currentStep < 0 || currentStep >= INSTALL_STEPS.length) return;

    const step = INSTALL_STEPS[currentStep];
    const lines = getLogLines(step.id, skillName, skillVersion, wasmSize, publisher, trustBadge);

    // Add log lines one by one
    let lineIdx = 0;
    const lineInterval = setInterval(() => {
      if (lineIdx < lines.length) {
        const currentLine = lines[lineIdx];
        setLogLines((prev) => [...prev, currentLine ?? ""]);
        lineIdx++;
      }
    }, step.duration / (lines.length + 1));

    // Simulate download progress for download step
    let progInterval: ReturnType<typeof setInterval> | null = null;
    if (step.id === "download") {
      setDownloadProgress(0);
      let prog = 0;
      progInterval = setInterval(() => {
        prog += Math.random() * 15 + 5;
        if (prog > 100) prog = 100;
        setDownloadProgress(prog);
      }, step.duration / 8);
    }

    // Complete step after duration
    const timeout = setTimeout(() => {
      clearInterval(lineInterval);
      if (progInterval) clearInterval(progInterval);
      setDownloadProgress(100);
      setCompletedSteps((prev) => [...prev, step.id]);

      if (currentStep < INSTALL_STEPS.length - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
        setIsComplete(true);
        setIsInstalling(false);
      }
    }, step.duration);

    return () => {
      clearTimeout(timeout);
      clearInterval(lineInterval);
      if (progInterval) clearInterval(progInterval);
    };
  }, [currentStep, isInstalling, skillName, skillVersion, wasmSize, publisher, trustBadge]);

  const startInstall = () => {
    setIsInstalling(true);
    setCurrentStep(0);
    setLogLines([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-nexus-indigo/20 flex items-center justify-center">
              <Download className="w-4 h-4 text-nexus-indigo" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Install Skill</h3>
              <p className="text-xs text-muted-foreground">
                {skillName}@{skillVersion} · {wasmSize}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Steps Progress */}
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-1">
            {INSTALL_STEPS.map((step, i) => {
              const isActive = i === currentStep;
              const isDone = completedSteps.includes(step.id);
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isDone
                          ? "bg-nexus-green text-black"
                          : isActive
                          ? "bg-nexus-indigo text-white ring-2 ring-nexus-indigo/30"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : isActive ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span className="text-xs font-medium">{i + 1}</span>
                      )}
                    </div>
                    <div className="hidden sm:block min-w-0">
                      <p
                        className={`text-xs font-medium truncate ${
                          isDone ? "text-nexus-green" : isActive ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {step.label.split(" ")[0]}
                      </p>
                    </div>
                  </div>
                  {i < INSTALL_STEPS.length - 1 && (
                    <div
                      className={`h-px flex-1 mx-1 transition-colors duration-300 ${
                        isDone ? "bg-nexus-green" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Current step description */}
          {currentStep >= 0 && currentStep < INSTALL_STEPS.length && (
            <div className="mt-3 flex items-center gap-2">
              <div className="text-nexus-indigo">{INSTALL_STEPS[currentStep].icon}</div>
              <p className="text-sm text-muted-foreground">{INSTALL_STEPS[currentStep].description}</p>
            </div>
          )}

          {/* Download progress bar */}
          {currentStep >= 0 && INSTALL_STEPS[currentStep]?.id === "download" && (
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-nexus-indigo rounded-full transition-all duration-200"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* Terminal Log */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Installation Log</span>
          </div>
          <div className="bg-black/50 rounded-lg border border-border p-4 h-48 overflow-y-auto font-mono text-xs leading-relaxed">
            {logLines.length === 0 && !isInstalling && (
              <p className="text-muted-foreground">Click "Install" to begin...</p>
            )}
            {logLines.map((line, i) => {
              const l = line ?? "";
              return (
              <div
                key={i}
                className={`${
                  l.includes("✓")
                    ? "text-nexus-green"
                    : l.startsWith("$")
                    ? "text-nexus-indigo"
                    : l.includes("████")
                    ? "text-nexus-cyan"
                    : l.includes("PASSED") || l.includes("successfully")
                    ? "text-nexus-green font-semibold"
                    : "text-foreground/80"
                } animate-in fade-in slide-in-from-bottom-1 duration-200`}
              >
                {l || "\u00A0"}
              </div>
              );
            })}
            {isInstalling && (
              <span className="inline-block w-2 h-3.5 bg-nexus-indigo animate-pulse ml-0.5" />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          {isComplete ? (
            <>
              <div className="flex items-center gap-2 text-nexus-green">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">Installation complete</span>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-nexus-green text-black rounded-lg text-sm font-medium hover:bg-nexus-green/90 transition-colors"
              >
                Done
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={startInstall}
                disabled={isInstalling}
                className="px-5 py-2 bg-nexus-indigo text-white rounded-lg text-sm font-medium hover:bg-nexus-indigo/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isInstalling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Install
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

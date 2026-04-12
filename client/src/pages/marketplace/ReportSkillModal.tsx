/**
 * ReportSkillModal — Flag a skill for policy violations
 * Multi-step modal: reason selection → description → confirmation
 */
import { useState } from "react";
import {
  X, AlertTriangle, Shield, Bug, FileWarning, Scale,
  AlertOctagon, Send, CheckCircle2, ChevronRight,
} from "lucide-react";

interface ReportSkillModalProps {
  skillName: string;
  isOpen: boolean;
  onClose: () => void;
}

const REPORT_REASONS = [
  {
    id: "malicious",
    label: "Malicious Behavior",
    description: "Skill attempts to exfiltrate data, escalate privileges, or perform unauthorized actions",
    icon: AlertOctagon,
    severity: "critical",
  },
  {
    id: "security",
    label: "Security Vulnerability",
    description: "Known CVE, buffer overflow, injection vector, or unsafe memory access",
    icon: Shield,
    severity: "high",
  },
  {
    id: "misrepresentation",
    label: "Misrepresentation",
    description: "Skill description, benchmarks, or trust claims are misleading or fabricated",
    icon: FileWarning,
    severity: "high",
  },
  {
    id: "license",
    label: "License Violation",
    description: "Skill uses code or assets in violation of their license terms",
    icon: Scale,
    severity: "medium",
  },
  {
    id: "bug",
    label: "Critical Bug",
    description: "Skill crashes, produces incorrect output, or exceeds resource limits consistently",
    icon: Bug,
    severity: "medium",
  },
  {
    id: "policy",
    label: "Policy Violation",
    description: "Violates Nexus OS marketplace guidelines, naming conventions, or content policies",
    icon: AlertTriangle,
    severity: "low",
  },
] as const;

type ReportReason = typeof REPORT_REASONS[number]["id"];

const severityColors: Record<string, string> = {
  critical: "text-red-400 bg-red-500/10 border-red-500/20",
  high: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  low: "text-blue-400 bg-blue-500/10 border-blue-500/20",
};

export default function ReportSkillModal({ skillName, isOpen, onClose }: ReportSkillModalProps) {
  const [step, setStep] = useState<"reason" | "details" | "submitted">("reason");
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState("");
  const [includeEvidence, setIncludeEvidence] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reportId, setReportId] = useState("");

  if (!isOpen) return null;

  const selectedReasonData = REPORT_REASONS.find(r => r.id === selectedReason);

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setReportId(`RPT-${Date.now().toString(36).toUpperCase()}`);
      setStep("submitted");
    }, 1800);
  };

  const handleClose = () => {
    setStep("reason");
    setSelectedReason(null);
    setDescription("");
    setIncludeEvidence(false);
    setEvidenceUrl("");
    setContactEmail("");
    setIsAnonymous(false);
    setSubmitting(false);
    setReportId("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-red-500/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Report Skill</h2>
              <p className="text-xs text-muted-foreground">
                {step === "reason" && "Select a reason"}
                {step === "details" && "Provide details"}
                {step === "submitted" && "Report submitted"}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicator */}
        {step !== "submitted" && (
          <div className="px-6 pt-4 flex items-center gap-2">
            <div className={`h-1 flex-1 rounded-full transition-colors ${step === "reason" || step === "details" ? "bg-red-500" : "bg-muted"}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors ${step === "details" ? "bg-red-500" : "bg-muted"}`} />
          </div>
        )}

        {/* ─── Step 1: Reason Selection ─── */}
        {step === "reason" && (
          <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
            <p className="text-sm text-muted-foreground mb-4">
              Why are you reporting <span className="font-mono text-foreground">{skillName}</span>?
            </p>
            {REPORT_REASONS.map((reason) => {
              const Icon = reason.icon;
              const isSelected = selectedReason === reason.id;
              return (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all group ${
                    isSelected
                      ? "border-red-500/50 bg-red-500/5"
                      : "border-border/50 bg-card/50 hover:border-border hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isSelected ? "bg-red-500/10" : "bg-muted/50"
                    }`}>
                      <Icon className={`w-4 h-4 ${isSelected ? "text-red-400" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-foreground/80"}`}>
                          {reason.label}
                        </span>
                        <span className={`text-[10px] font-medium uppercase px-1.5 py-0.5 rounded border ${severityColors[reason.severity]}`}>
                          {reason.severity}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {reason.description}
                      </p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-colors ${
                      isSelected ? "border-red-500 bg-red-500" : "border-muted-foreground/30"
                    }`}>
                      {isSelected && (
                        <svg viewBox="0 0 16 16" className="w-full h-full text-white">
                          <path fill="currentColor" d="M6.5 11.5L3 8l1-1 2.5 2.5L12 4l1 1z" />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ─── Step 2: Details ─── */}
        {step === "details" && selectedReasonData && (
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Selected reason summary */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${severityColors[selectedReasonData.severity]}`}>
              <selectedReasonData.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{selectedReasonData.label}</span>
              <span className="text-[10px] uppercase font-medium ml-auto">{selectedReasonData.severity}</span>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={`Describe the issue with ${skillName} in detail. Include specific behavior, reproduction steps, or evidence...`}
                rows={4}
                className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {description.length}/1000 characters
              </p>
            </div>

            {/* Evidence URL toggle */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeEvidence}
                  onChange={(e) => setIncludeEvidence(e.target.checked)}
                  className="w-4 h-4 rounded border-border accent-red-500"
                />
                <span className="text-sm">Include evidence URL</span>
              </label>
              {includeEvidence && (
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://gist.github.com/... or paste link to proof"
                  className="w-full mt-2 bg-background/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50"
                />
              )}
            </div>

            {/* Contact email */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Contact Email <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="your@email.com — for follow-up on this report"
                className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50"
              />
            </div>

            {/* Anonymous toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded border-border accent-red-500"
              />
              <span className="text-sm">Submit anonymously</span>
              <span className="text-xs text-muted-foreground">(your identity won&apos;t be shared with the publisher)</span>
            </label>
          </div>
        )}

        {/* ─── Step 3: Submitted ─── */}
        {step === "submitted" && (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Report Submitted</h3>
              <p className="text-sm text-muted-foreground">
                Thank you for helping keep the Nexus OS marketplace safe.
              </p>
            </div>
            <div className="bg-muted/30 border border-border/50 rounded-xl p-4 text-left space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Report ID</span>
                <span className="font-mono text-xs text-foreground">{reportId}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Skill</span>
                <span className="font-mono text-xs">{skillName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Reason</span>
                <span className="text-xs">{selectedReasonData?.label}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="text-xs text-amber-400 font-medium">Under Review</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Our AXIS trust team will review this report within 24-48 hours.
              {contactEmail && " We'll notify you at the provided email."}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between">
          {step === "reason" && (
            <>
              <button onClick={handleClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
              <button
                onClick={() => selectedReason && setStep("details")}
                disabled={!selectedReason}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
          {step === "details" && (
            <>
              <button onClick={() => setStep("reason")} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={description.length < 10 || submitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Report
                  </>
                )}
              </button>
            </>
          )}
          {step === "submitted" && (
            <button
              onClick={handleClose}
              className="ml-auto px-5 py-2.5 bg-muted/50 border border-border/50 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

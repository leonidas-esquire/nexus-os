/**
 * PublishWizard — Multi-step form for publishing a new WASM skill.
 * Steps: 1) Basic Info  2) WASM Upload  3) I/O Schema  4) Pricing  5) Review & Submit
 */
import { useState, useCallback } from "react";
import {
  X, ChevronRight, ChevronLeft, Check, Upload, FileCode2,
  Package, DollarSign, Shield, AlertTriangle, Loader2,
  Plus, Trash2, Info,
} from "lucide-react";
import { toast } from "sonner";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface IOField {
  name: string;
  type: "string" | "json" | "number" | "boolean" | "binary";
  required: boolean;
  description: string;
}

interface WizardData {
  // Step 1 — Basic Info
  name: string;
  displayName: string;
  category: string;
  description: string;
  license: string;
  patterns: string[];
  // Step 2 — WASM Upload
  wasmFile: string | null;
  wasmSize: string;
  readme: string;
  // Step 3 — I/O Schema
  inputs: IOField[];
  outputs: IOField[];
  maxInput: string;
  maxExecution: string;
  memoryLimit: string;
  // Step 4 — Pricing
  pricingModel: "free" | "per-call" | "flat";
  pricePerCall: string;
  flatPrice: string;
  // Step 5 — Review (no extra fields)
}

const CATEGORIES = [
  "Parsers", "Validators", "Transformers", "Calculators",
  "AI / ML", "Security", "Data", "Web", "Text", "Media",
];

const LICENSES = ["MIT", "Apache-2.0", "GPL-3.0", "BSD-3-Clause", "Proprietary"];

const IO_TYPES = ["string", "json", "number", "boolean", "binary"] as const;

const STEPS = [
  { id: 1, label: "Basic Info", icon: Package },
  { id: 2, label: "WASM Binary", icon: Upload },
  { id: 3, label: "I/O Schema", icon: FileCode2 },
  { id: 4, label: "Pricing", icon: DollarSign },
  { id: 5, label: "Review", icon: Shield },
];

const DEFAULT_DATA: WizardData = {
  name: "",
  displayName: "",
  category: "Parsers",
  description: "",
  license: "MIT",
  patterns: [""],
  wasmFile: null,
  wasmSize: "",
  readme: "",
  inputs: [{ name: "input", type: "string", required: true, description: "" }],
  outputs: [{ name: "output", type: "json", required: true, description: "" }],
  maxInput: "1MB",
  maxExecution: "100ms",
  memoryLimit: "256MB",
  pricingModel: "free",
  pricePerCall: "0.0001",
  flatPrice: "9.99",
};

/* ─── Field Components ───────────────────────────────────────────────────── */
function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <label className="block text-sm font-medium text-foreground mb-1.5">
      {children}
      {hint && <span className="text-xs text-muted-foreground font-normal ml-1.5">({hint})</span>}
    </label>
  );
}

function Input({
  value, onChange, placeholder, mono, ...rest
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-accent/30 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-nexus-indigo/40 focus:border-nexus-indigo/40 transition-all ${mono ? "font-mono" : ""}`}
      {...rest}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-accent/30 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-nexus-indigo/40 focus:border-nexus-indigo/40 transition-all resize-none"
    />
  );
}

function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-accent/30 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-nexus-indigo/40 focus:border-nexus-indigo/40 transition-all"
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

/* ─── Main Wizard ────────────────────────────────────────────────────────── */
export default function PublishWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({ ...DEFAULT_DATA });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = useCallback(<K extends keyof WizardData>(key: K, value: WizardData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const canAdvance = (): boolean => {
    if (step === 1) return data.name.length >= 3 && data.displayName.length >= 2 && data.description.length >= 10;
    if (step === 2) return data.wasmFile !== null;
    if (step === 3) return data.inputs.length > 0 && data.outputs.length > 0;
    if (step === 4) return true;
    return true;
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      toast.success("Skill submitted for AXIS review!");
    }, 2500);
  };

  const handleFakeUpload = () => {
    update("wasmFile", "my-skill.wasm");
    update("wasmSize", "124 KB");
    toast.success("WASM binary uploaded (simulated)");
  };

  /* ─── Step Content ─────────────────────────────────────────────────────── */
  const renderStep = () => {
    switch (step) {
      /* ─── Step 1: Basic Info ─────────────────────────────────────────── */
      case 1:
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label hint="lowercase, hyphens only">Skill Name</Label>
                <Input
                  value={data.name}
                  onChange={(v) => update("name", v.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="my-awesome-skill"
                  mono
                />
              </div>
              <div>
                <Label>Display Name</Label>
                <Input
                  value={data.displayName}
                  onChange={(v) => update("displayName", v)}
                  placeholder="My Awesome Skill"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={data.category} onChange={(v) => update("category", v)} options={CATEGORIES} />
              </div>
              <div>
                <Label>License</Label>
                <Select value={data.license} onChange={(v) => update("license", v)} options={LICENSES} />
              </div>
            </div>

            <div>
              <Label hint="min 10 characters">Description</Label>
              <TextArea
                value={data.description}
                onChange={(v) => update("description", v)}
                placeholder="Describe what your skill does, its key features, and typical use cases..."
                rows={4}
              />
            </div>

            <div>
              <Label hint="natural language patterns that route to this skill">Patterns</Label>
              <div className="space-y-2">
                {data.patterns.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={p}
                      onChange={(v) => {
                        const next = [...data.patterns];
                        next[i] = v;
                        update("patterns", next);
                      }}
                      placeholder={`e.g. "parse json", "extract data"`}
                    />
                    {data.patterns.length > 1 && (
                      <button
                        onClick={() => update("patterns", data.patterns.filter((_, j) => j !== i))}
                        className="p-2 text-muted-foreground hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => update("patterns", [...data.patterns, ""])}
                  className="text-xs text-nexus-indigo hover:text-nexus-indigo/80 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add pattern
                </button>
              </div>
            </div>
          </div>
        );

      /* ─── Step 2: WASM Upload ────────────────────────────────────────── */
      case 2:
        return (
          <div className="space-y-5">
            <div>
              <Label>WASM Binary</Label>
              {!data.wasmFile ? (
                <button
                  onClick={handleFakeUpload}
                  className="w-full border-2 border-dashed border-border/50 rounded-xl p-8 text-center hover:border-nexus-indigo/40 hover:bg-accent/20 transition-all group"
                >
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3 group-hover:text-nexus-indigo transition-colors" />
                  <p className="text-sm text-foreground font-medium mb-1">Click to upload your .wasm file</p>
                  <p className="text-xs text-muted-foreground">Max 10MB. Must be compiled with WASI target.</p>
                </button>
              ) : (
                <div className="bg-nexus-green/10 border border-nexus-green/30 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-nexus-green" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{data.wasmFile}</p>
                      <p className="text-xs text-muted-foreground">{data.wasmSize}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { update("wasmFile", null); update("wasmSize", ""); }}
                    className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <Label hint="optional, Markdown supported">README</Label>
              <TextArea
                value={data.readme}
                onChange={(v) => update("readme", v)}
                placeholder="# My Skill\n\nDescribe installation, usage examples, and API reference..."
                rows={8}
              />
            </div>

            <div className="bg-accent/20 border border-border/30 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-nexus-cyan mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Your WASM binary will be scanned for security vulnerabilities and tested against the
                AXIS sandbox constraints before approval.
              </p>
            </div>
          </div>
        );

      /* ─── Step 3: I/O Schema ─────────────────────────────────────────── */
      case 3:
        return (
          <div className="space-y-6">
            {/* Inputs */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Input Fields</Label>
                <button
                  onClick={() => update("inputs", [...data.inputs, { name: "", type: "string", required: false, description: "" }])}
                  className="text-xs text-nexus-indigo hover:text-nexus-indigo/80 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add input
                </button>
              </div>
              <div className="space-y-3">
                {data.inputs.map((field, i) => (
                  <div key={i} className="bg-accent/20 border border-border/30 rounded-lg p-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                      <Input
                        value={field.name}
                        onChange={(v) => {
                          const next = [...data.inputs];
                          next[i] = { ...next[i], name: v };
                          update("inputs", next);
                        }}
                        placeholder="field name"
                        mono
                      />
                      <select
                        value={field.type}
                        onChange={(e) => {
                          const next = [...data.inputs];
                          next[i] = { ...next[i], type: e.target.value as IOField["type"] };
                          update("inputs", next);
                        }}
                        className="bg-accent/30 border border-border/50 rounded-lg px-2 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-nexus-indigo/40"
                      >
                        {IO_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => {
                            const next = [...data.inputs];
                            next[i] = { ...next[i], required: e.target.checked };
                            update("inputs", next);
                          }}
                          className="rounded border-border accent-nexus-indigo"
                        />
                        Required
                      </label>
                      {data.inputs.length > 1 && (
                        <button
                          onClick={() => update("inputs", data.inputs.filter((_, j) => j !== i))}
                          className="p-1 text-muted-foreground hover:text-red-400 transition-colors justify-self-end"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <Input
                      value={field.description}
                      onChange={(v) => {
                        const next = [...data.inputs];
                        next[i] = { ...next[i], description: v };
                        update("inputs", next);
                      }}
                      placeholder="Field description..."
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Outputs */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Output Fields</Label>
                <button
                  onClick={() => update("outputs", [...data.outputs, { name: "", type: "json", required: true, description: "" }])}
                  className="text-xs text-nexus-indigo hover:text-nexus-indigo/80 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add output
                </button>
              </div>
              <div className="space-y-3">
                {data.outputs.map((field, i) => (
                  <div key={i} className="bg-accent/20 border border-border/30 rounded-lg p-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                      <Input
                        value={field.name}
                        onChange={(v) => {
                          const next = [...data.outputs];
                          next[i] = { ...next[i], name: v };
                          update("outputs", next);
                        }}
                        placeholder="field name"
                        mono
                      />
                      <select
                        value={field.type}
                        onChange={(e) => {
                          const next = [...data.outputs];
                          next[i] = { ...next[i], type: e.target.value as IOField["type"] };
                          update("outputs", next);
                        }}
                        className="bg-accent/30 border border-border/50 rounded-lg px-2 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-nexus-indigo/40"
                      >
                        {IO_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => {
                            const next = [...data.outputs];
                            next[i] = { ...next[i], required: e.target.checked };
                            update("outputs", next);
                          }}
                          className="rounded border-border accent-nexus-indigo"
                        />
                        Required
                      </label>
                      {data.outputs.length > 1 && (
                        <button
                          onClick={() => update("outputs", data.outputs.filter((_, j) => j !== i))}
                          className="p-1 text-muted-foreground hover:text-red-400 transition-colors justify-self-end"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <Input
                      value={field.description}
                      onChange={(v) => {
                        const next = [...data.outputs];
                        next[i] = { ...next[i], description: v };
                        update("outputs", next);
                      }}
                      placeholder="Field description..."
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Resource Limits */}
            <div>
              <Label>Resource Limits</Label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Max Input</p>
                  <Select value={data.maxInput} onChange={(v) => update("maxInput", v)} options={["256KB", "512KB", "1MB", "5MB", "10MB"]} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Max Execution</p>
                  <Select value={data.maxExecution} onChange={(v) => update("maxExecution", v)} options={["50ms", "100ms", "500ms", "1s", "5s"]} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Memory Limit</p>
                  <Select value={data.memoryLimit} onChange={(v) => update("memoryLimit", v)} options={["64MB", "128MB", "256MB", "512MB", "1GB"]} />
                </div>
              </div>
            </div>
          </div>
        );

      /* ─── Step 4: Pricing ────────────────────────────────────────────── */
      case 4:
        return (
          <div className="space-y-5">
            <div>
              <Label>Pricing Model</Label>
              <div className="grid grid-cols-3 gap-3">
                {(["free", "per-call", "flat"] as const).map((model) => (
                  <button
                    key={model}
                    onClick={() => update("pricingModel", model)}
                    className={`border rounded-xl p-4 text-center transition-all ${
                      data.pricingModel === model
                        ? "border-nexus-indigo bg-nexus-indigo/10"
                        : "border-border/50 hover:border-border"
                    }`}
                  >
                    <p className="font-semibold text-sm capitalize">{model === "per-call" ? "Per Call" : model === "flat" ? "Flat Rate" : "Free"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {model === "free" && "Open source, no charges"}
                      {model === "per-call" && "Charge per invocation"}
                      {model === "flat" && "Monthly subscription"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {data.pricingModel === "per-call" && (
              <div>
                <Label hint="USD per call">Price Per Call</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input
                    value={data.pricePerCall}
                    onChange={(v) => update("pricePerCall", v)}
                    placeholder="0.0001"
                    mono
                    style={{ paddingLeft: "1.5rem" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  You earn 70% (${(parseFloat(data.pricePerCall || "0") * 0.7).toFixed(6)}/call). Nexus takes 25%, Stripe 5%.
                </p>
              </div>
            )}

            {data.pricingModel === "flat" && (
              <div>
                <Label hint="USD per month">Monthly Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input
                    value={data.flatPrice}
                    onChange={(v) => update("flatPrice", v)}
                    placeholder="9.99"
                    mono
                    style={{ paddingLeft: "1.5rem" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  You earn 70% (${(parseFloat(data.flatPrice || "0") * 0.7).toFixed(2)}/mo). Nexus takes 25%, Stripe 5%.
                </p>
              </div>
            )}

            <div className="bg-accent/20 border border-border/30 rounded-lg p-4">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-nexus-green" />
                Revenue Split
              </h4>
              <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-2">
                <div className="bg-nexus-green" style={{ width: "70%" }} />
                <div className="bg-nexus-indigo" style={{ width: "25%" }} />
                <div className="bg-muted-foreground/40" style={{ width: "5%" }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span><span className="inline-block w-2 h-2 rounded-full bg-nexus-green mr-1" />Developer 70%</span>
                <span><span className="inline-block w-2 h-2 rounded-full bg-nexus-indigo mr-1" />Nexus 25%</span>
                <span><span className="inline-block w-2 h-2 rounded-full bg-muted-foreground/40 mr-1" />Stripe 5%</span>
              </div>
            </div>
          </div>
        );

      /* ─── Step 5: Review ─────────────────────────────────────────────── */
      case 5:
        if (submitted) {
          return (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-nexus-green/10 border-2 border-nexus-green/30 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-nexus-green" />
              </div>
              <h3 className="text-xl font-bold mb-2">Submitted for Review</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                Your skill <code className="text-nexus-indigo font-mono">{data.name}</code> has been submitted
                for AXIS trust verification. You'll receive a notification when the review is complete (typically 24-48 hours).
              </p>
              <div className="bg-accent/20 border border-border/30 rounded-lg p-4 max-w-sm mx-auto text-left">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">What happens next</h4>
                <ul className="space-y-2 text-sm text-foreground/80">
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-nexus-green mt-0.5 shrink-0" /> WASM binary security scan</li>
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-nexus-green mt-0.5 shrink-0" /> Sandbox constraint validation</li>
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-nexus-green mt-0.5 shrink-0" /> I/O schema verification</li>
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-nexus-green mt-0.5 shrink-0" /> AXIS trust score assignment</li>
                </ul>
              </div>
              <button
                onClick={onClose}
                className="mt-6 px-6 py-2 bg-nexus-indigo text-white rounded-lg text-sm font-medium hover:bg-nexus-indigo/90 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          );
        }

        return (
          <div className="space-y-5">
            <div className="bg-nexus-amber/10 border border-nexus-amber/30 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-nexus-amber mt-0.5 shrink-0" />
              <p className="text-xs text-foreground/80">
                Please review all details carefully. Once submitted, your skill will enter the AXIS
                verification queue and cannot be modified until review is complete.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-accent/20 border border-border/30 rounded-lg p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Basic Info</h4>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-mono">{data.name || "—"}</span>
                  <span className="text-muted-foreground">Display Name</span>
                  <span>{data.displayName || "—"}</span>
                  <span className="text-muted-foreground">Category</span>
                  <span>{data.category}</span>
                  <span className="text-muted-foreground">License</span>
                  <span>{data.license}</span>
                  <span className="text-muted-foreground">Patterns</span>
                  <span>{data.patterns.filter(Boolean).join(", ") || "—"}</span>
                </div>
              </div>

              <div className="bg-accent/20 border border-border/30 rounded-lg p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">WASM Binary</h4>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-muted-foreground">File</span>
                  <span className="font-mono">{data.wasmFile || "—"}</span>
                  <span className="text-muted-foreground">Size</span>
                  <span>{data.wasmSize || "—"}</span>
                </div>
              </div>

              <div className="bg-accent/20 border border-border/30 rounded-lg p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">I/O Schema</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Inputs</p>
                    <div className="flex flex-wrap gap-1">
                      {data.inputs.map((f, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded bg-nexus-indigo/10 border border-nexus-indigo/20 text-nexus-indigo font-mono">
                          {f.name}: {f.type}{f.required ? "*" : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Outputs</p>
                    <div className="flex flex-wrap gap-1">
                      {data.outputs.map((f, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded bg-nexus-green/10 border border-nexus-green/20 text-nexus-green font-mono">
                          {f.name}: {f.type}{f.required ? "*" : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/30 text-xs text-muted-foreground">
                  <span>Max Input: {data.maxInput}</span>
                  <span>Max Exec: {data.maxExecution}</span>
                  <span>Memory: {data.memoryLimit}</span>
                </div>
              </div>

              <div className="bg-accent/20 border border-border/30 rounded-lg p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Pricing</h4>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-muted-foreground">Model</span>
                  <span className="capitalize">{data.pricingModel === "per-call" ? "Per Call" : data.pricingModel}</span>
                  {data.pricingModel === "per-call" && (
                    <>
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-mono">${data.pricePerCall}/call</span>
                    </>
                  )}
                  {data.pricingModel === "flat" && (
                    <>
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-mono">${data.flatPrice}/mo</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  /* ─── Render ───────────────────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-background border border-border/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Package className="w-5 h-5 text-nexus-indigo" />
              Publish New Skill
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Step {step} of {STEPS.length} — {STEPS[step - 1].label}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 border-b border-border/30 bg-accent/10">
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isDone = step > s.id;
              return (
                <div key={s.id} className="flex items-center">
                  <button
                    onClick={() => { if (isDone) setStep(s.id); }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      isActive
                        ? "bg-nexus-indigo text-white"
                        : isDone
                          ? "bg-nexus-green/10 text-nexus-green cursor-pointer hover:bg-nexus-green/20"
                          : "text-muted-foreground"
                    }`}
                  >
                    {isDone ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <ChevronRight className="w-3 h-3 text-muted-foreground/30 mx-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {renderStep()}
        </div>

        {/* Footer */}
        {!submitted && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-accent/5">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : onClose()}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {step > 1 ? "Back" : "Cancel"}
            </button>

            {step < 5 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canAdvance()}
                className="flex items-center gap-1.5 px-5 py-2 bg-nexus-indigo text-white rounded-lg text-sm font-medium hover:bg-nexus-indigo/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2 bg-nexus-green text-white rounded-lg text-sm font-medium hover:bg-nexus-green/90 transition-colors disabled:opacity-60"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                ) : (
                  <><Shield className="w-4 h-4" /> Submit for AXIS Review</>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

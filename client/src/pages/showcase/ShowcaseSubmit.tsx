import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useCallback, useRef } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import {
  ArrowRight,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Network,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "ai-agents", label: "AI Agents" },
  { value: "automation", label: "Automation" },
  { value: "devops", label: "DevOps" },
  { value: "research", label: "Research" },
  { value: "trading", label: "Trading" },
  { value: "other", label: "Other" },
];

const NEXUS_FEATURES = [
  "Supervisor",
  "Saga",
  "Workflow",
  "Pool",
  "Cost Controller",
  "AXIS Trust",
  "Broker",
  "WASM Sandbox",
  "Edge Deploy",
];

export default function ShowcaseSubmit() {
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalFileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [demoUrl, setDemoUrl] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorHandle, setAuthorHandle] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [authorAvatar, setAuthorAvatar] = useState("");
  const [authorTwitter, setAuthorTwitter] = useState("");
  const [authorGithub, setAuthorGithub] = useState("");
  const [featuresUsed, setFeaturesUsed] = useState<string[]>([]);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = trpc.showcaseSubmit.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err) => {
      toast.error("Submission failed: " + err.message);
    },
  });

  useEffect(() => {
    document.title = "Submit Project — Nexus OS Showcase";
  }, []);

  const handleImageUpload = useCallback(
    async (file: File, type: "main" | "additional") => {
      if (type === "main") setUploading(true);
      else setUploadingAdditional(true);

      try {
        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch("/api/showcase/upload-image", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        const { url } = await res.json();

        if (type === "main") {
          setScreenshotUrl(url);
        } else {
          setScreenshots((prev) => [...prev.slice(0, 4), url]);
        }
      } catch (err: any) {
        toast.error("Upload failed: " + err.message);
      } finally {
        if (type === "main") setUploading(false);
        else setUploadingAdditional(false);
      }
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        handleImageUpload(file, screenshotUrl ? "additional" : "main");
      }
    },
    [handleImageUpload, screenshotUrl]
  );

  const toggleFeature = (feature: string) => {
    setFeaturesUsed((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenshotUrl) {
      toast.error("Please upload at least one screenshot of your project.");
      return;
    }
    if (!category) {
      toast.error("Please select a category for your project.");
      return;
    }

    submitMutation.mutate({
      title,
      tagline,
      description,
      screenshotUrl,
      screenshots: screenshots.length > 0 ? screenshots : undefined,
      demoUrl: demoUrl || "",
      repoUrl: repoUrl || "",
      websiteUrl: websiteUrl || "",
      videoUrl: videoUrl || "",
      authorName,
      authorHandle: authorHandle || "",
      authorEmail,
      authorAvatar: authorAvatar || "",
      authorTwitter: authorTwitter || "",
      authorGithub: authorGithub || "",
      featuresUsed: featuresUsed.length > 0 ? featuresUsed : undefined,
      category: category as any,
    });
  };

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="max-w-md text-center px-6">
          <div className="w-16 h-16 rounded-full bg-nexus-green/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-nexus-green" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Project Submitted!</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Thank you for sharing your project. Our team will review your
            submission and notify you once it's approved and live on the
            showcase.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/showcase">
              <Button
                variant="outline"
                className="font-mono text-sm gap-2 w-full sm:w-auto"
              >
                <ArrowRight size={14} className="rotate-180" />
                Back to Showcase
              </Button>
            </Link>
            <Link href="/">
              <Button className="bg-nexus-indigo hover:bg-nexus-indigo/90 text-white font-mono text-sm w-full sm:w-auto">
                Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
              /showcase/submit
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container py-12 max-w-3xl">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Submit Your <span className="text-nexus-indigo">Project</span>
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Share what you've built with Nexus OS. Submissions are reviewed by
            our team before appearing on the showcase.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* ─── Project Details ──────────────────────────────── */}
          <section>
            <h2 className="text-lg font-bold font-mono mb-5 pb-2 border-b border-border">
              Project Details
            </h2>
            <div className="space-y-5">
              <div>
                <Label htmlFor="title" className="font-mono text-sm mb-1.5">
                  Project Name *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., ResearchBot Pro"
                  required
                  minLength={3}
                  maxLength={100}
                  className="bg-nexus-surface/30 border-border"
                />
              </div>

              <div>
                <Label htmlFor="tagline" className="font-mono text-sm mb-1.5">
                  Tagline *
                </Label>
                <Input
                  id="tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="A short one-liner describing your project"
                  required
                  minLength={10}
                  maxLength={200}
                  className="bg-nexus-surface/30 border-border"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {tagline.length}/200 characters
                </p>
              </div>

              <div>
                <Label
                  htmlFor="description"
                  className="font-mono text-sm mb-1.5"
                >
                  Description (Markdown) *
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your project in detail. Supports Markdown formatting."
                  required
                  minLength={50}
                  maxLength={10000}
                  rows={8}
                  className="bg-nexus-surface/30 border-border font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {description.length}/10,000 characters — Markdown supported
                </p>
              </div>

              <div>
                <Label className="font-mono text-sm mb-2 block">
                  Category *
                </Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`px-4 py-2 rounded-md text-sm font-mono transition-all border ${
                        category === cat.value
                          ? "bg-nexus-indigo text-white border-nexus-indigo"
                          : "bg-transparent text-muted-foreground border-border hover:border-nexus-indigo/40"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ─── Nexus Features Used ─────────────────────────── */}
          <section>
            <h2 className="text-lg font-bold font-mono mb-5 pb-2 border-b border-border">
              Nexus Features Used
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Select which Nexus OS features your project uses.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {NEXUS_FEATURES.map((feature) => (
                <button
                  key={feature}
                  type="button"
                  onClick={() => toggleFeature(feature)}
                  className={`px-3 py-2.5 rounded-md text-sm font-mono transition-all border text-left ${
                    featuresUsed.includes(feature)
                      ? "bg-nexus-indigo/15 text-nexus-indigo border-nexus-indigo/30"
                      : "bg-transparent text-muted-foreground border-border hover:border-nexus-indigo/30"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {featuresUsed.includes(feature) ? (
                      <CheckCircle2 size={14} className="shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40 shrink-0" />
                    )}
                    {feature}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* ─── Screenshots ─────────────────────────────────── */}
          <section>
            <h2 className="text-lg font-bold font-mono mb-5 pb-2 border-b border-border">
              Screenshots
            </h2>

            {/* Main screenshot */}
            <div className="mb-4">
              <Label className="font-mono text-sm mb-2 block">
                Primary Screenshot *
              </Label>
              {screenshotUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img
                    src={screenshotUrl}
                    alt="Primary screenshot"
                    className="w-full h-56 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setScreenshotUrl("")}
                    className="absolute top-2 right-2 bg-nexus-deep/80 backdrop-blur-sm rounded-full p-1.5 hover:bg-red-500/80 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-10 text-center cursor-pointer hover:border-nexus-indigo/40 transition-colors"
                >
                  {uploading ? (
                    <Loader2
                      className="animate-spin text-nexus-indigo mx-auto mb-2"
                      size={28}
                    />
                  ) : (
                    <Upload
                      size={28}
                      className="text-muted-foreground mx-auto mb-2"
                    />
                  )}
                  <p className="text-sm text-muted-foreground">
                    {uploading
                      ? "Uploading..."
                      : "Click or drag & drop to upload"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPEG, PNG, WebP, GIF — max 10 MB
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, "main");
                  e.target.value = "";
                }}
              />
            </div>

            {/* Additional screenshots */}
            <div>
              <Label className="font-mono text-sm mb-2 block">
                Additional Screenshots{" "}
                <span className="text-muted-foreground">(up to 5)</span>
              </Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {screenshots.map((url, i) => (
                  <div
                    key={i}
                    className="relative rounded-lg overflow-hidden border border-border aspect-video"
                  >
                    <img
                      src={url}
                      alt={`Screenshot ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setScreenshots((prev) =>
                          prev.filter((_, idx) => idx !== i)
                        )
                      }
                      className="absolute top-1 right-1 bg-nexus-deep/80 backdrop-blur-sm rounded-full p-1 hover:bg-red-500/80 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                {screenshots.length < 5 && (
                  <button
                    type="button"
                    onClick={() => additionalFileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-lg aspect-video flex items-center justify-center hover:border-nexus-indigo/40 transition-colors"
                  >
                    {uploadingAdditional ? (
                      <Loader2
                        className="animate-spin text-nexus-indigo"
                        size={18}
                      />
                    ) : (
                      <Plus size={18} className="text-muted-foreground" />
                    )}
                  </button>
                )}
              </div>
              <input
                ref={additionalFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, "additional");
                  e.target.value = "";
                }}
              />
            </div>
          </section>

          {/* ─── Links ───────────────────────────────────────── */}
          <section>
            <h2 className="text-lg font-bold font-mono mb-5 pb-2 border-b border-border">
              Links
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="repoUrl" className="font-mono text-sm mb-1.5">
                  GitHub Repository
                </Label>
                <Input
                  id="repoUrl"
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="bg-nexus-surface/30 border-border"
                />
              </div>
              <div>
                <Label
                  htmlFor="websiteUrl"
                  className="font-mono text-sm mb-1.5"
                >
                  Website
                </Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://..."
                  className="bg-nexus-surface/30 border-border"
                />
              </div>
              <div>
                <Label htmlFor="demoUrl" className="font-mono text-sm mb-1.5">
                  Live Demo
                </Label>
                <Input
                  id="demoUrl"
                  type="url"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="https://..."
                  className="bg-nexus-surface/30 border-border"
                />
              </div>
              <div>
                <Label htmlFor="videoUrl" className="font-mono text-sm mb-1.5">
                  Video Demo
                </Label>
                <Input
                  id="videoUrl"
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="bg-nexus-surface/30 border-border"
                />
              </div>
            </div>
          </section>

          {/* ─── Author Info ─────────────────────────────────── */}
          <section>
            <h2 className="text-lg font-bold font-mono mb-5 pb-2 border-b border-border">
              Author Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="authorName"
                  className="font-mono text-sm mb-1.5"
                >
                  Name *
                </Label>
                <Input
                  id="authorName"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="bg-nexus-surface/30 border-border"
                />
              </div>
              <div>
                <Label
                  htmlFor="authorEmail"
                  className="font-mono text-sm mb-1.5"
                >
                  Email *
                </Label>
                <Input
                  id="authorEmail"
                  type="email"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="bg-nexus-surface/30 border-border"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Not displayed publicly — used for review notifications only
                </p>
              </div>
              <div>
                <Label
                  htmlFor="authorHandle"
                  className="font-mono text-sm mb-1.5"
                >
                  Handle / Username
                </Label>
                <Input
                  id="authorHandle"
                  value={authorHandle}
                  onChange={(e) => setAuthorHandle(e.target.value)}
                  placeholder="@yourhandle"
                  className="bg-nexus-surface/30 border-border"
                />
              </div>
              <div>
                <Label
                  htmlFor="authorGithub"
                  className="font-mono text-sm mb-1.5"
                >
                  GitHub Username
                </Label>
                <Input
                  id="authorGithub"
                  value={authorGithub}
                  onChange={(e) => setAuthorGithub(e.target.value)}
                  placeholder="github-username"
                  className="bg-nexus-surface/30 border-border"
                />
              </div>
              <div>
                <Label
                  htmlFor="authorTwitter"
                  className="font-mono text-sm mb-1.5"
                >
                  Twitter / X Handle
                </Label>
                <Input
                  id="authorTwitter"
                  value={authorTwitter}
                  onChange={(e) => setAuthorTwitter(e.target.value)}
                  placeholder="@handle"
                  className="bg-nexus-surface/30 border-border"
                />
              </div>
              <div>
                <Label
                  htmlFor="authorAvatar"
                  className="font-mono text-sm mb-1.5"
                >
                  Avatar URL
                </Label>
                <Input
                  id="authorAvatar"
                  type="url"
                  value={authorAvatar}
                  onChange={(e) => setAuthorAvatar(e.target.value)}
                  placeholder="https://github.com/username.png"
                  className="bg-nexus-surface/30 border-border"
                />
              </div>
            </div>
          </section>

          {/* ─── Submit ──────────────────────────────────────── */}
          <div className="border-t border-border pt-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <p className="text-xs text-muted-foreground">
              By submitting, you agree to our{" "}
              <Link
                href="/legal/terms"
                className="text-nexus-indigo hover:underline"
              >
                Terms of Service
              </Link>
              .
            </p>
            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="bg-nexus-indigo hover:bg-nexus-indigo/90 text-white font-mono gap-2 px-8"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <ArrowRight size={16} />
                  Submit Project
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Back */}
        <div className="mt-12 text-center">
          <Link
            href="/showcase"
            className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-nexus-indigo transition-colors"
          >
            <ArrowRight size={14} className="rotate-180" />
            Back to Showcase
          </Link>
        </div>
      </main>
    </div>
  );
}

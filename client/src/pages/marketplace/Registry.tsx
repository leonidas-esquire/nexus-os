import { useState, type ReactNode, type FormEvent } from "react";
import { Link, useParams } from "wouter";
import { useAuth } from "@clerk/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, ArrowDownToLine, Code2, ShieldCheck } from "lucide-react";
import type { RegistryVersion, SkillManifest } from "@shared/marketplace";
import { trpc } from "@/lib/trpc";

const button =
  "inline-flex items-center gap-2 rounded-lg border border-indigo-400/40 bg-indigo-500/15 px-4 py-2 text-sm text-indigo-200 hover:bg-indigo-500/25 disabled:opacity-40";
const field =
  "w-full rounded-lg border border-white/15 bg-black/30 p-3 text-white";
async function request<T>(
  path: string,
  token?: string | null,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`/api/marketplace/${path}`, {
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Request failed");
  return body;
}
function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#090c16] text-slate-100">
      <header className="border-b border-white/10">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-6 py-5">
          <Link href="/" className="font-mono font-bold tracking-wider">
            AIAGENTS<span className="text-indigo-400">.NEXUS</span>
          </Link>
          <Link href="/marketplace" className="text-sm text-slate-300">
            Marketplace
          </Link>
          <Link
            href="/marketplace/developer"
            className="ml-auto text-sm text-indigo-300"
          >
            Developer portal →
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12">{children}</main>
    </div>
  );
}
function ErrorNotice({ error }: { error: unknown }) {
  return error ? (
    <p
      role="alert"
      className="my-4 rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-red-200"
    >
      {error instanceof Error ? error.message : String(error)}
    </p>
  ) : null;
}
function Card({ release }: { release: RegistryVersion }) {
  return (
    <Link
      href={`/marketplace/${release.name}?version=${release.version}`}
      className="block rounded-xl border border-white/10 bg-white/[0.03] p-6 hover:border-indigo-400/60"
    >
      <Package className="mb-5 text-indigo-400" />
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-mono font-semibold">{release.name}</h2>
        <span className="text-xs text-slate-400">v{release.version}</span>
      </div>
      <p className="mt-3 text-sm text-slate-300">
        {release.manifest.description}
      </p>
      <p className="mt-6 text-xs text-slate-400">
        {release.publisher} · {release.manifest.category}
      </p>
      <div className="mt-3 flex justify-between text-xs">
        <span className="text-emerald-300">Approved release</span>
        <span>Free</span>
      </div>
    </Link>
  );
}
export function RegistryCatalog() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const result = useQuery({
    queryKey: ["registry", query, offset],
    queryFn: () =>
      request<{ items: RegistryVersion[] }>(
        `skills?q=${encodeURIComponent(query)}&offset=${offset}`
      ),
  });
  return (
    <Shell>
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-indigo-400">
        The skill registry / Early access
      </p>
      <h1 className="mt-4 text-4xl font-semibold md:text-6xl">
        Build once. Run with Nexus.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-slate-400">
        Discover developer-built WASM skills. Download an approved version and
        run it in your agent’s sandbox.
      </p>
      <div className="my-8 flex flex-wrap gap-4 text-xs text-slate-300">
        <span>◇ Versioned packages</span>
        <span>◇ SHA-256 integrity</span>
        <span>◇ WASIp1 runtime</span>
      </div>
      <form
        className="mb-8 flex gap-3"
        onSubmit={e => {
          e.preventDefault();
          setQuery(search);
          setOffset(0);
        }}
      >
        <input
          aria-label="Search skill names"
          className={field}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search skill names…"
        />
        <button className={button}>Search</button>
      </form>
      <ErrorNotice error={result.error} />
      {result.isPending ? (
        <p>Loading skills…</p>
      ) : result.data?.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/20 p-12 text-center">
          <Code2 className="mx-auto mb-4 text-indigo-400" />
          <h2 className="text-xl">
            {query
              ? "No matching releases"
              : "The registry is ready for its first skills"}
          </h2>
          <p className="my-3 text-slate-400">
            Publish a WASM package from the developer portal. Approved releases
            appear here.
          </p>
          <Link className={button} href="/marketplace/developer">
            Publish a skill →
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {result.data?.items.map(v => (
            <Card key={v.id} release={v} />
          ))}
        </div>
      )}
      <div className="mt-6 flex gap-3">
        <button
          className={button}
          disabled={offset === 0}
          onClick={() => setOffset(offset - 50)}
        >
          Previous
        </button>
        <button
          className={button}
          disabled={result.data?.items.length !== 50}
          onClick={() => setOffset(offset + 50)}
        >
          Next
        </button>
      </div>
      <p className="mt-12 text-sm text-slate-500">
        Free releases are available in this first phase. Paid skill sales and
        developer payouts are coming in a later phase.
      </p>
    </Shell>
  );
}
export function RegistryDetail() {
  const { skillName, releaseVersion } = useParams<{
    skillName: string;
    releaseVersion?: string;
  }>();
  const version =
    releaseVersion ||
    new URLSearchParams(window.location.search).get("version");
  const result = useQuery({
    queryKey: ["registry-detail", skillName, version],
    queryFn: () =>
      request<RegistryVersion>(
        `skills/${encodeURIComponent(skillName)}${version ? `/${encodeURIComponent(version)}` : ""}`
      ),
  });
  const v = result.data;
  return (
    <Shell>
      <Link href="/marketplace" className="text-sm text-indigo-300">
        ← All skills
      </Link>
      <ErrorNotice error={result.error} />
      {result.isPending && <p className="mt-8">Loading release…</p>}
      {v && (
        <>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Package className="text-indigo-400" size={36} />
            <h1 className="text-4xl font-semibold">{v.name}</h1>
            <span className="font-mono text-slate-400">v{v.version}</span>
          </div>
          <p className="mt-5 text-lg text-slate-300">
            {v.manifest.description}
          </p>
          <p className="mt-3 text-sm text-slate-400">
            By {v.publisher} · {v.manifest.license} · Free
          </p>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
            <article className="whitespace-pre-wrap rounded-xl border border-white/10 p-6 leading-relaxed text-slate-300">
              {`Inputs\n${v.manifest.inputs}\n\nOutputs\n${v.manifest.outputs}\n\nExamples\n${v.manifest.examples.map(e => `Input: ${e.input}\nOutput: ${e.output}`).join("\n\n")}\n\n${v.manifest.readme}`}
            </article>
            <aside className="space-y-5 rounded-xl border border-indigo-400/25 bg-indigo-500/5 p-6">
              <h2 className="flex items-center gap-2 font-semibold">
                <ArrowDownToLine size={18} /> Install this version
              </h2>
              <code className="block break-all rounded bg-black/40 p-3 text-sm">
                naos marketplace install {v.name}@{v.version}
              </code>
              <p className="text-xs text-slate-400">
                Use a CLI build containing the registry update. Installation
                prints the package path and agent creation command.
              </p>
              <a
                className={button}
                href={`/api/marketplace/skills/${v.name}/${v.version}/package`}
              >
                Download WASM
              </a>
              <button
                className={button}
                onClick={() => {
                  const url = URL.createObjectURL(
                    new Blob([JSON.stringify(v.manifest, null, 2)], {
                      type: "application/json",
                    })
                  );
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "manifest.json";
                  a.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                }}
              >
                Download manifest
              </button>
              <p className="text-xs text-slate-400">
                {(v.size / 1024).toFixed(1)} KiB · WASIp1 command
              </p>
              <p className="break-all font-mono text-xs text-slate-500">
                SHA-256
                <br />
                {v.sha256}
              </p>
              <p className="text-xs text-slate-400">
                Approval is a publication review. Run packages in the Nexus
                sandbox with its memory, time, and fuel limits.
              </p>
            </aside>
          </div>
        </>
      )}
    </Shell>
  );
}
const initial: SkillManifest = {
  schemaVersion: 1,
  name: "",
  version: "1.0.0",
  description: "",
  readme: "",
  inputs: "",
  outputs: "",
  examples: [{ input: "", output: "" }],
  license: "MIT",
  category: "Other",
  runtime: "wasip1-command",
  entrypoint: "_start",
  pricing: "free",
};
export function RegistryDeveloper() {
  const { isSignedIn, getToken } = useAuth();
  const cache = useQueryClient();
  const [manifest, setManifest] = useState(initial);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [message, setMessage] = useState("");
  const [offset, setOffset] = useState(0);
  const me = trpc.auth.me.useQuery();
  const releases = useQuery({
    queryKey: ["registry-mine", me.data?.id, offset],
    queryFn: async () =>
      request<{ items: RegistryVersion[] }>(
        `mine?offset=${offset}`,
        await getToken()
      ),
    enabled: !!isSignedIn,
  });
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    setBusy(true);
    setError(null);
    setMessage("");
    try {
      const body = new FormData();
      body.append("manifest", JSON.stringify(manifest));
      body.append("wasm", file);
      await request("publish", await getToken(), { method: "POST", body });
      setMessage(`${manifest.name}@${manifest.version} submitted for review.`);
      await cache.invalidateQueries({ queryKey: ["registry-mine"] });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell>
      <p className="font-mono text-xs tracking-widest text-indigo-400">
        DEVELOPER PORTAL
      </p>
      <h1 className="mt-4 text-4xl font-semibold">Ship a skill.</h1>
      <p className="mt-4 text-slate-400">
        Upload a WASIp1 command. Each version is immutable and reviewed before
        it appears in the catalog.
      </p>
      {!isSignedIn ? (
        <Link
          className={`${button} mt-8`}
          href="/sign-in?redirect_url=%2Fmarketplace%2Fdeveloper"
        >
          Sign in to publish
        </Link>
      ) : (
        <>
          <ErrorNotice error={error || releases.error} />
          {message && (
            <p role="status" className="my-4 text-emerald-300">
              {message}
            </p>
          )}
          <div className="mt-8 grid gap-10 lg:grid-cols-2">
            <form
              onSubmit={submit}
              className="space-y-5 rounded-xl border border-white/10 p-6"
            >
              <h2 className="text-xl font-semibold">New release</h2>
              {(
                [
                  ["name", "Skill name"],
                  ["version", "Version (major.minor.patch)"],
                  ["description", "Description"],
                  ["license", "License"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block text-sm text-slate-300">
                  {label}
                  <input
                    required
                    className={`${field} mt-2`}
                    value={manifest[key]}
                    onChange={e =>
                      setManifest({ ...manifest, [key]: e.target.value })
                    }
                  />
                </label>
              ))}
              <label className="block text-sm text-slate-300">
                Category
                <select
                  className={`${field} mt-2`}
                  value={manifest.category}
                  onChange={e =>
                    setManifest({
                      ...manifest,
                      category: e.target.value as SkillManifest["category"],
                    })
                  }
                >
                  {[
                    "Validators",
                    "Parsers",
                    "Transformers",
                    "Calculators",
                    "Data",
                    "Other",
                  ].map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-300">
                README — inputs, outputs, and usage
                <textarea
                  required
                  rows={7}
                  className={`${field} mt-2`}
                  value={manifest.readme}
                  onChange={e =>
                    setManifest({ ...manifest, readme: e.target.value })
                  }
                />
              </label>
              {(["inputs", "outputs"] as const).map(key => (
                <label key={key} className="block text-sm text-slate-300">
                  {key === "inputs"
                    ? "Input format and constraints"
                    : "Output format and errors"}
                  <textarea
                    required
                    minLength={10}
                    maxLength={2000}
                    className={`${field} mt-2`}
                    value={manifest[key]}
                    onChange={e =>
                      setManifest({ ...manifest, [key]: e.target.value })
                    }
                  />
                </label>
              ))}
              <label className="block text-sm text-slate-300">
                Example input
                <textarea
                  className={`${field} mt-2`}
                  value={manifest.examples[0].input}
                  onChange={e =>
                    setManifest({
                      ...manifest,
                      examples: [
                        { ...manifest.examples[0], input: e.target.value },
                      ],
                    })
                  }
                />
              </label>
              <label className="block text-sm text-slate-300">
                Expected example output
                <textarea
                  className={`${field} mt-2`}
                  value={manifest.examples[0].output}
                  onChange={e =>
                    setManifest({
                      ...manifest,
                      examples: [
                        { ...manifest.examples[0], output: e.target.value },
                      ],
                    })
                  }
                />
              </label>
              <label className="block text-sm text-slate-300">
                WASM package (maximum 16 MiB)
                <input
                  required
                  type="file"
                  accept=".wasm"
                  className={`${field} mt-2`}
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
              </label>
              <p className="text-xs text-slate-400">
                This phase supports free skills. Your package must export memory
                and _start; it runs without inherited filesystem or network
                access.
              </p>
              <button className={button} disabled={busy || !file}>
                {busy ? "Uploading and validating…" : "Submit for review"}
              </button>
            </form>
            <section>
              <h2 className="mb-5 text-xl font-semibold">Your releases</h2>
              {releases.isPending && <p>Loading…</p>}
              {releases.data?.items.length === 0 && (
                <p className="text-slate-400">
                  Your first submission will appear here.
                </p>
              )}
              {releases.data?.items.map(v => (
                <div
                  key={v.id}
                  className="mb-3 rounded-lg border border-white/10 p-4"
                >
                  <div className="flex justify-between gap-3">
                    <span className="font-mono">
                      {v.name}@{v.version}
                    </span>
                    <span className="text-sm text-indigo-300">{v.status}</span>
                  </div>
                  {v.reviewReason && (
                    <p className="mt-3 text-sm text-slate-400">
                      Review: {v.reviewReason}
                    </p>
                  )}
                  {v.status === "approved" && (
                    <Link
                      className="mt-3 block text-sm text-indigo-300"
                      href={`/marketplace/${v.name}?version=${v.version}`}
                    >
                      View release →
                    </Link>
                  )}
                </div>
              ))}
              <div className="my-5 flex gap-3">
                <button
                  className={button}
                  disabled={offset === 0}
                  onClick={() => setOffset(offset - 50)}
                >
                  Previous
                </button>
                <button
                  className={button}
                  disabled={releases.data?.items.length !== 50}
                  onClick={() => setOffset(offset + 50)}
                >
                  Next
                </button>
              </div>
              {me.data?.role === "admin" && (
                <Link href="/marketplace/admin" className={button}>
                  Review submissions →
                </Link>
              )}
            </section>
          </div>
        </>
      )}
    </Shell>
  );
}
export function RegistryAdmin() {
  const { getToken } = useAuth();
  const me = trpc.auth.me.useQuery();
  const cache = useQueryClient();
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const [offset, setOffset] = useState(0);
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const releases = useQuery({
    queryKey: ["registry-review", me.data?.id, offset],
    queryFn: async () =>
      request<{ items: RegistryVersion[] }>(
        `review?offset=${offset}`,
        await getToken()
      ),
    enabled: me.data?.role === "admin",
  });
  async function review(v: RegistryVersion, action: string) {
    setBusy(true);
    setError(null);
    try {
      await request(`review/${v.id}`, await getToken(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: reasons[v.id] || "" }),
      });
      await cache.invalidateQueries({ queryKey: ["registry-review"] });
      await cache.invalidateQueries({ queryKey: ["registry"] });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  async function download(v: RegistryVersion) {
    try {
      const token = await getToken();
      const response = await fetch(
        `/api/marketplace/review/${v.name}/${v.version}/package`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error("Review download failed");
      const url = URL.createObjectURL(await response.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `${v.name}-${v.version}.wasm`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e);
    }
  }
  return (
    <Shell>
      <h1 className="flex items-center gap-3 text-3xl font-semibold">
        <ShieldCheck className="text-indigo-400" /> Release review
      </h1>
      {me.isPending ? (
        <p>Checking access…</p>
      ) : me.data?.role !== "admin" ? (
        <p className="mt-6">Administrator access required.</p>
      ) : (
        <>
          <p className="my-5 text-slate-400">
            Structural validation does not execute code. Inspect the package and
            verify its documented behavior in the Nexus sandbox before
            approving.
          </p>
          <ErrorNotice error={error || releases.error} />
          {releases.isPending && <p>Loading…</p>}
          {releases.data?.items.length === 0 && <p>No submissions yet.</p>}
          {releases.data?.items.map(v => (
            <article
              key={v.id}
              className="mb-5 space-y-4 rounded-xl border border-white/10 p-6"
            >
              <h2 className="font-mono text-lg">
                {v.name}@{v.version}{" "}
                <span className="text-sm text-indigo-300">{v.status}</span>
              </h2>
              <p className="text-sm text-slate-400">
                {v.publisher} · {v.manifest.description}
              </p>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs text-slate-400">
                {JSON.stringify(v.manifest, null, 2)}
              </pre>
              <p className="break-all font-mono text-xs text-slate-500">
                SHA-256: {v.sha256}
              </p>
              <button className={button} onClick={() => download(v)}>
                Download for inspection
              </button>
              {v.reviewReason && (
                <p className="text-sm">Review: {v.reviewReason}</p>
              )}
              {["pending", "approved"].includes(v.status) && (
                <>
                  <label className="block text-sm">
                    Review notes (at least 10 characters)
                    <textarea
                      className={`${field} mt-2`}
                      value={reasons[v.id] || ""}
                      onChange={e =>
                        setReasons({ ...reasons, [v.id]: e.target.value })
                      }
                    />
                  </label>
                  <div className="flex gap-3">
                    {(v.status === "pending"
                      ? ["approved", "rejected"]
                      : ["revoked"]
                    ).map(action => (
                      <button
                        className={button}
                        key={action}
                        disabled={
                          busy || (reasons[v.id] || "").trim().length < 10
                        }
                        onClick={() => review(v, action)}
                      >
                        {action === "approved"
                          ? "Approve"
                          : action === "rejected"
                            ? "Reject"
                            : "Revoke"}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </article>
          ))}
          <div className="flex gap-3">
            <button
              className={button}
              disabled={offset === 0}
              onClick={() => setOffset(offset - 50)}
            >
              Previous
            </button>
            <button
              className={button}
              disabled={releases.data?.items.length !== 50}
              onClick={() => setOffset(offset + 50)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </Shell>
  );
}
export function RegistryUpcoming() {
  return (
    <Shell>
      <h1 className="text-3xl font-semibold">This feature is coming later.</h1>
      <p className="my-5 text-slate-400">
        Browse real releases or publish a skill in the developer portal.
      </p>
      <Link href="/marketplace" className={button}>
        Browse skills →
      </Link>
    </Shell>
  );
}

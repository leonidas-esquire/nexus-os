import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { contentProvenance, artifactDigests } from "./content-provenance";
export function evaluateFreshness(input: {
  now: Date;
  expectedDigest: string;
  actualDigest: string;
  release: string;
  latestRelease?: string;
  policy: {
    intervalDays: number;
    initialReviewDue: string;
    reviews: Array<{
      reviewer: string;
      reviewedAt: string;
      sourceDigest: string;
      evidenceUrl: string;
    }>;
  };
}) {
  const errors: string[] = [];
  const reviews = input.policy.reviews;
  for (const r of reviews)
    if (
      !r.reviewer.startsWith("human:") ||
      !/^https:\/\//.test(r.evidenceUrl) ||
      !Number.isFinite(Date.parse(r.reviewedAt)) ||
      Date.parse(r.reviewedAt) > input.now.getTime() ||
      !/^[a-f0-9]{64}$/.test(r.sourceDigest)
    )
      errors.push("Invalid human review evidence");
  const latest = [...reviews].sort(
    (a, b) => Date.parse(b.reviewedAt) - Date.parse(a.reviewedAt)
  )[0];
  const due = latest
    ? new Date(
        Date.parse(latest.reviewedAt) + input.policy.intervalDays * 86400000
      )
    : new Date(input.policy.initialReviewDue);
  if (!Number.isFinite(due.getTime()) || input.now >= due)
    errors.push("Quarterly human content review is due");
  if (input.expectedDigest !== input.actualDigest)
    errors.push(
      "Generated documentation does not match source content; regenerate"
    );
  if (input.latestRelease && input.latestRelease !== input.release)
    errors.push(
      `Release drift: documentation=${input.release}, GitHub=${input.latestRelease}`
    );
  return {
    ok: errors.length === 0,
    errors,
    humanReview: latest || null,
    humanReviewCoversCurrentSources:
      latest?.sourceDigest === input.actualDigest,
    nextHumanReviewDue: due.toISOString(),
    releaseChecked: !!input.latestRelease,
  };
}
export async function checkFreshness(remote = false) {
  const provenance = contentProvenance();
  const generated = JSON.parse(
    readFileSync("client/public/content-provenance.json", "utf8")
  );
  if (JSON.stringify(generated.artifacts) !== JSON.stringify(artifactDigests()))
    throw new Error(
      "Generated artifact content drift; regenerate and validate"
    );
  const policy = JSON.parse(
    readFileSync("docs/reviews/content-policy.json", "utf8")
  );
  const release = readFileSync("knowledge/product/release.md", "utf8").match(
    /\*\*(v[\d.]+)\*\*/
  )?.[1];
  if (!release) throw new Error("Missing documented release");
  const homeRelease = readFileSync("client/src/pages/Home.tsx", "utf8")
    .match(/v[\d.]+ — Current Stable Release/)?.[0]
    .split(" ")[0];
  if (homeRelease !== release)
    throw new Error("Homepage and knowledge release versions disagree");
  let latestRelease: string | undefined;
  if (remote) {
    const response = await fetch(
      "https://api.github.com/repos/leonidas-esquire/nexus-os/releases/latest",
      {
        signal: AbortSignal.timeout(15000),
        headers: {
          Accept: "application/vnd.github+json",
          ...(process.env.GITHUB_TOKEN
            ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
            : {}),
        },
      }
    );
    if (!response.ok)
      throw new Error(
        `Release freshness check failed: HTTP ${response.status}`
      );
    latestRelease = (await response.json()).tag_name;
    if (!latestRelease) throw new Error("GitHub release has no tag");
  }
  const report = {
    ...evaluateFreshness({
      now: new Date(),
      expectedDigest: generated.sourceDigest,
      actualDigest: provenance.sourceDigest,
      release,
      latestRelease,
      policy,
    }),
    checkedAt: new Date().toISOString(),
    sourceCommit: provenance.sourceCommit,
    sourceDigest: provenance.sourceDigest,
  };
  writeFileSync("freshness-report.json", JSON.stringify(report, null, 2));
  if (!report.ok) throw new Error(report.errors.join("; "));
  console.log(JSON.stringify(report));
  return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await checkFreshness(process.argv.includes("--remote"));

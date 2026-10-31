import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Loads fetcher/.env (gitignored) for local runs. Imported first by index.ts so the
 * keys are in process.env before config.ts reads them. Real environment variables
 * (e.g. GitHub Actions secrets) take precedence over the file.
 */
const file = join(dirname(fileURLToPath(import.meta.url)), "../.env");
if (existsSync(file)) {
  const before = { ...process.env };
  process.loadEnvFile(file);
  for (const [k, v] of Object.entries(before)) if (v !== undefined) process.env[k] = v;
}

// Locally, borrow the GitHub CLI's token if you're logged in — anonymous GitHub API
// access is capped at 60 requests/hour, which a few runs in a row will exhaust.
if (!process.env.GITHUB_TOKEN && !process.env.GH_TOKEN && !process.env.CI) {
  try {
    const token = execFileSync("gh", ["auth", "token"], { encoding: "utf8", timeout: 3000, stdio: ["ignore", "pipe", "ignore"] }).trim();
    if (token) process.env.GITHUB_TOKEN = token;
  } catch {
    /* gh not installed or not logged in — fine */
  }
}

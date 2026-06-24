/**
 * Suite-local secrets loader for the extension Playwright suite.
 *
 * Reads apps/extension/.playwright/.env.test (gitignored) into process.env.
 * Runs at config load so worker processes inherit the values. No dotenv
 * dependency — the format is the same KEY=value the legacy .mjs driver used.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const suiteRoot = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(suiteRoot, '.env.test');

export function loadTestEnv(): void {
  if (!fs.existsSync(envPath)) {
    throw new Error(
      `Missing ${envPath}. Copy .env.test.example to .env.test and fill it in.`
    );
  }
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2];
    }
  }
}

export function requireSecrets(keys: readonly string[]): void {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required secrets in .env.test: ${missing.join(', ')}`);
  }
}

/** Backend base URL the extension talks to during e2e (salmon-api). */
export const API_URL = process.env.SALMON_API_URL ?? 'http://127.0.0.1:3001';

/** True when the salmon-api backend answers (any HTTP status = reachable). */
export async function isBackendUp(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    await fetch(API_URL, { signal: controller.signal });
    clearTimeout(timer);
    return true;
  } catch {
    return false;
  }
}

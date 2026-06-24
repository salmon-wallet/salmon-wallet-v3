/**
 * Suite-local secrets loader for the web Playwright suite.
 * Reads apps/web/.playwright/.env.test (gitignored) into process.env.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const suiteRoot = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(suiteRoot, '.env.test');

export function loadTestEnv(): void {
  if (!fs.existsSync(envPath)) return; // web smoke can run without secrets
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2];
    }
  }
}

export const API_URL = process.env.SALMON_API_URL ?? 'http://127.0.0.1:3001';

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

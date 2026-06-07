/**
 * SABI Direct Turso Client with 429 Retry Logic
 *
 * Prisma's LibSQL adapter doesn't retry on Turso 429 (rate limit) — it just throws.
 * This module provides a direct libsql client with automatic retry backoff,
 * used for critical auth operations (login, session creation) where a 429
 * must not silently fail and lock users out.
 *
 * Usage: import { sabiExecute } from './tursoClient'
 *   const rows = await sabiExecute({ sql: '...', args: [...] });
 *
 * Falls back gracefully — if all retries fail, throws the original error.
 * Callers must handle the error (wrap in try/catch).
 */

import { createClient, type Client, type InArgs } from '@libsql/client';

const globalForTurso = globalThis as unknown as { sabiTursoClient?: Client };

function buildClient(): Client {
  const url = (process.env.DATABASE_URL || '').replace('libsql://', 'https://');
  const authToken = process.env.TURSO_AUTH_TOKEN;
  return createClient({ url, authToken });
}

function getClient(): Client {
  if (!globalForTurso.sabiTursoClient) {
    globalForTurso.sabiTursoClient = buildClient();
  }
  return globalForTurso.sabiTursoClient;
}

function resetClient() {
  globalForTurso.sabiTursoClient = undefined;
}

// Retry delays for 429 (ms): 1s, 3s, 7s, 15s
const RETRY_DELAYS = [1000, 3000, 7000, 15000];

/**
 * Execute a SQL query against SABI's Turso DB with 429 retry backoff.
 * Mirrors gamerz360's dbExecute pattern for consistency.
 */
export async function sabiExecute(
  query: { sql: string; args?: InArgs },
  timeoutMs = 8000
): Promise<{ rows: any[] }> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const client = getClient();
    try {
      const result = await Promise.race([
        client.execute(query),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('sabiExecute timeout')), timeoutMs)
        ),
      ]);
      return { rows: result.rows as any[] };
    } catch (err: any) {
      resetClient(); // fresh client on next attempt
      const msg = err?.message || '';
      const is429 = msg.includes('429') || msg.toLowerCase().includes('rate');
      const isRetryable = is429 || err?.name === 'AbortError' || msg.includes('timeout');

      if (attempt < 4 && isRetryable) {
        const delay = is429 ? RETRY_DELAYS[attempt] : RETRY_DELAYS[0];
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error('sabiExecute: exhausted retries');
}

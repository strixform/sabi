import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  let databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable not set');
  }

  // Force HTTP transport on Vercel serverless. `libsql://` makes @libsql/client
  // use the WebSocket protocol, which HANGS on cold start (a frozen instance's
  // socket is dead when it wakes → the next query stalls ~35s / 504s). Rewriting
  // to https:// uses stateless HTTP per query, so there's no dead socket to hang
  // on. (Same fix as gamers360 and the-owlet — this is what made SABI's wallet
  // endpoint 504.)
  if (databaseUrl.startsWith('libsql://')) {
    databaseUrl = databaseUrl.replace('libsql://', 'https://');
  }

  const adapter = new PrismaLibSql({
    url: databaseUrl,
    authToken: process.env.TURSO_AUTH_TOKEN,
    intMode: 'number',
  });

  const client = new PrismaClient({
    adapter,
    transactionOptions: { maxWait: 8000, timeout: 10000 },
  });
  globalForPrisma.prisma = client;
  return client;
}

// Lazy: importing this module must NOT construct the client. The constructor throws
// when DATABASE_URL is absent, and `next build`'s "collect page data" step imports every
// route module — so an eager `getPrismaClient()` here broke local builds ("DATABASE_URL
// environment variable not set" while collecting /api/reseller/analytics). The Proxy
// defers construction to the FIRST real property access (a query), which only ever
// happens at request time when the env is present. Existing `import { prisma }` callers
// are unchanged. (Vercel always has the env, so this only ever affected local builds.)
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(client) : value;
  },
});
export { getPrismaClient };

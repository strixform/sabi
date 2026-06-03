import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable not set');
  }

  let adapter;

  if (databaseUrl.startsWith('file:')) {
    // Local file-based SQLite
    adapter = new PrismaLibSql({
      url: databaseUrl,
    });
  } else {
    // Turso/LibSQL remote
    adapter = new PrismaLibSql({
      url: databaseUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }

  return new PrismaClient({ adapter });
}

export const prisma = getPrismaClient();
export { getPrismaClient };

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

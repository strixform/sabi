import { prisma } from './prisma';
import crypto from 'crypto';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createSabiApiKey(userId: string, name: string) {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);

    const key = await prisma.sabiApiToken.create({
      data: {
        userId,
        name,
        tokenHash,
      },
    });

    return { success: true, key: `sabi_${key.id}_${token}` };
  } catch (error) {
    return { success: false, error: 'Key creation failed' };
  }
}

export async function verifySabiApiKey(keyString: string) {
  try {
    const parts = keyString.split('_');
    if (parts.length !== 3) return null;

    const [, keyId, token] = parts;
    const tokenHash = hashToken(token);

    const key = await prisma.sabiApiToken.findFirst({
      where: {
        id: keyId,
        tokenHash,
      },
      include: { user: true },
    });

    if (!key || (key.expiresAt && key.expiresAt < new Date())) {
      return null;
    }

    await prisma.sabiApiToken.update({
      where: { id: keyId },
      data: { lastUsedAt: new Date() },
    });

    return { userId: key.userId, user: key.user };
  } catch (error) {
    return null;
  }
}

export async function listSabiApiKeys(userId: string) {
  try {
    return await prisma.sabiApiToken.findMany({
      where: { userId },
      select: { id: true, name: true, createdAt: true, lastUsedAt: true },
    });
  } catch (error) {
    return [];
  }
}

export async function deleteSabiApiKey(userId: string, keyId: string) {
  try {
    const key = await prisma.sabiApiToken.findFirst({
      where: { id: keyId, userId },
    });

    if (!key) return { success: false, error: 'Key not found' };

    await prisma.sabiApiToken.delete({ where: { id: keyId } });
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Deletion failed' };
  }
}

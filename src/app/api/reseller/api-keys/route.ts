import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { verifyResellerToken } from '@/lib/resellerAuth';
import crypto from 'crypto';

function generateApiKey(): string {
  return 'sk_live_' + crypto.randomBytes(32).toString('hex');
}

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export async function GET(request: NextRequest) {
  try {
    const payload = await verifyResellerToken();

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const prisma = getPrismaClient();

    // For now, we'll return mock API keys
    // In a real implementation, you would fetch from a database table
    const mockKeys = [
      {
        id: '1',
        name: 'Mobile App',
        key: 'sk_live_abc123def456...',
        createdAt: new Date('2026-05-01'),
        lastUsed: new Date('2026-06-02'),
      },
      {
        id: '2',
        name: 'Dashboard Integration',
        key: 'sk_live_xyz789uvw456...',
        createdAt: new Date('2026-04-15'),
        lastUsed: new Date('2026-06-01'),
      },
    ];

    return NextResponse.json({
      success: true,
      keys: mockKeys,
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await verifyResellerToken();

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const prisma = getPrismaClient();
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: 'API key name is required' },
        { status: 400 }
      );
    }

    // Generate new API key
    const newKey = generateApiKey();
    const hashedKey = hashKey(newKey);

    // In a real implementation, store in database
    // For now, return the key (only shown once)

    return NextResponse.json({
      success: true,
      message: 'API key created successfully. Save it now - you won\'t see it again!',
      key: {
        id: crypto.randomBytes(8).toString('hex'),
        name: body.name,
        key: newKey, // Only returned once on creation
        createdAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}

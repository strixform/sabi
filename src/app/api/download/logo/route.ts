import { readFileSync } from 'fs';
import { join } from 'path';

export const maxDuration = 15;
export const preferredRegion = 'sfo1'; // Turso DB in Oregon (sfo1) — keeps latency minimal

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'public', 'sabi-logo.svg');
    const fileContent = readFileSync(filePath);

    return new Response(fileContent, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': 'attachment; filename="sabi-logo.svg"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return new Response('File not found', { status: 404 });
  }
}
import Anthropic from '@anthropic-ai/sdk';

/** Shared Anthropic client + helpers for SABI's AI tools. */
export const AI_MODEL = 'claude-sonnet-4-6'; // capable + cost-appropriate for buyer-facing tools

export function getAnthropic(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

/** Run a single-shot prompt and return the text. */
export async function aiText(system: string, user: string, maxTokens = 1024): Promise<string | null> {
  const client = getAnthropic();
  if (!client) return null;
  const res = await client.messages.create({
    model: AI_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  });
  const block = res.content.find((b) => b.type === 'text');
  return block && block.type === 'text' ? block.text : null;
}

/** Extract the first JSON object/array from a model response (handles ```json fences). */
export function parseJsonLoose<T = any>(text: string): T | null {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  if (start === -1) return null;
  // Try progressively from the first bracket.
  for (let end = candidate.length; end > start; end--) {
    const slice = candidate.slice(start, end);
    try { return JSON.parse(slice) as T; } catch { /* keep trimming */ }
  }
  return null;
}

export function detectPlatform(url: string): string | null {
  const u = url.toLowerCase();
  if (u.includes('instagram')) return 'instagram';
  if (u.includes('tiktok')) return 'tiktok';
  if (u.includes('youtu')) return 'youtube';
  if (u.includes('twitter') || u.includes('x.com')) return 'twitter';
  if (u.includes('facebook') || u.includes('fb.')) return 'facebook';
  if (u.includes('threads')) return 'threads';
  if (u.includes('spotify')) return 'spotify';
  if (u.includes('audiomack')) return 'audiomack';
  if (u.includes('boomplay')) return 'boomplay';
  return null;
}

import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { getAnthropic, aiText, parseJsonLoose } from '@/lib/sabiAI';
import { getRateLimitKey, checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const maxDuration = 30;
export const preferredRegion = 'sfo1';

/**
 * POST /api/sabi/ai/caption  body: { topic, platform?, tone? }
 * Generates caption options + hashtags for a post — a free creator tool / upsell.
 */
export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(getRateLimitKey(req, 'ai-caption'), 20, 60 * 60000);
  if (!rl.allowed) return rateLimitResponse(20, rl.resetTime);

  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!getAnthropic()) {
    return NextResponse.json({ error: 'AI isn\'t set up yet. (ANTHROPIC_API_KEY missing.)' }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const topic = typeof body.topic === 'string' ? body.topic.trim().slice(0, 300) : '';
  const platform = typeof body.platform === 'string' ? body.platform.trim().slice(0, 30) : 'instagram';
  const tone = typeof body.tone === 'string' ? body.tone.trim().slice(0, 40) : 'engaging';
  if (!topic) return NextResponse.json({ error: 'Tell us what the post is about.' }, { status: 400 });

  const system = `You are a Nigerian social-media copywriter. Write scroll-stopping ${platform} captions with a ${tone} tone, aware of Nigerian culture and slang where it fits naturally (never forced).
Return ONLY JSON: {"captions": [3 strings], "hashtags": [up to 12 strings without the # symbol]}.`;

  try {
    const text = await aiText(system, `Post topic: ${topic}`, 700);
    const out = parseJsonLoose<{ captions: string[]; hashtags: string[] }>(text || '');
    if (!out || !Array.isArray(out.captions)) {
      return NextResponse.json({ error: 'Could not generate captions — try again.' }, { status: 502 });
    }
    return NextResponse.json({
      success: true,
      captions: out.captions.slice(0, 3).map((c) => String(c).slice(0, 400)),
      hashtags: (out.hashtags || []).slice(0, 12).map((h) => String(h).replace(/^#/, '').slice(0, 40)),
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'AI request failed', detail: e?.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { getAnthropic, aiText, parseJsonLoose, detectPlatform } from '@/lib/sabiAI';
import { SERVICES_CATALOG } from '@/lib/servicesCatalog';
import { getRateLimitKey, checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const maxDuration = 30;
export const preferredRegion = 'sfo1';

/**
 * POST /api/sabi/ai/growth-plan  body: { url, goal? }
 * Claude recommends a tailored package (services + quantities + drip schedule)
 * for a creator's profile, drawn from the real SABI catalog.
 */
export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(getRateLimitKey(req, 'ai-plan'), 10, 60 * 60000);
  if (!rl.allowed) return rateLimitResponse(10, rl.resetTime);

  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!getAnthropic()) {
    return NextResponse.json({ error: 'AI isn\'t set up yet. (ANTHROPIC_API_KEY missing.)' }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const url = typeof body.url === 'string' ? body.url.trim().slice(0, 300) : '';
  const goal = typeof body.goal === 'string' ? body.goal.trim().slice(0, 300) : '';
  if (!url) return NextResponse.json({ error: 'Paste your profile or post link.' }, { status: 400 });

  const platform = detectPlatform(url);
  // Condensed catalog for the prompt (filter to the platform when we can detect it).
  const catalog = SERVICES_CATALOG
    .filter((s) => !platform || s.category === platform)
    .map((s) => ({ id: s.id, name: s.name, action: s.action, nairaPerUnit: Math.round(s.pricePerUnit / 100), min: s.minQuantity }));

  const system = `You are a Nigerian social-media growth strategist for SABI, a platform that delivers REAL Nigerian engagement.
Recommend a focused, realistic starter package from ONLY the provided services. Favour a balanced mix (e.g. followers + a few content-engagement services), sensible quantities (respect each service "min"), and a natural drip schedule so growth looks organic.
Return ONLY JSON: {"summary": string, "dripDays": number (0,3,5,7,14 or 30), "items": [{"serviceId": string, "quantity": number, "reason": string}]}. Keep 2-4 items. Quantities must be >= each service's min.`;

  const user = `Profile/post link: ${url}
Platform detected: ${platform || 'unknown'}
Buyer goal: ${goal || 'grow my presence and credibility'}

Available services (JSON): ${JSON.stringify(catalog)}`;

  try {
    const text = await aiText(system, user, 900);
    const plan = parseJsonLoose<{ summary: string; dripDays: number; items: { serviceId: string; quantity: number; reason: string }[] }>(text || '');
    if (!plan || !Array.isArray(plan.items)) {
      return NextResponse.json({ error: 'Could not generate a plan — try again.' }, { status: 502 });
    }
    // Validate items against the catalog and clamp quantities to >= min.
    const items = plan.items.map((it) => {
      const svc = SERVICES_CATALOG.find((s) => s.id === it.serviceId);
      if (!svc) return null;
      const qty = Math.max(svc.minQuantity, Math.min(Number(it.quantity) || svc.minQuantity, svc.maxQuantity));
      return { serviceId: svc.id, name: svc.name, action: svc.action, quantity: qty, nairaPerUnit: Math.round(svc.pricePerUnit / 100), reason: String(it.reason || '').slice(0, 200) };
    }).filter(Boolean);

    return NextResponse.json({
      success: true,
      platform,
      summary: String(plan.summary || '').slice(0, 600),
      dripDays: [0, 3, 5, 7, 14, 30].includes(Number(plan.dripDays)) ? Number(plan.dripDays) : 0,
      items,
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'AI request failed', detail: e?.message }, { status: 500 });
  }
}

import { MetadataRoute } from 'next';

/**
 * Public, indexable pages only. Auth-gated app routes (dashboard, wallet, orders,
 * admin, reseller dashboard, etc.) are intentionally excluded — they're behind login
 * and add no SEO value. Keep this in sync with public/robots.txt.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://sability.io').replace(/\/$/, '');
  const now = new Date();

  const entry = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  ): MetadataRoute.Sitemap[number] => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });

  return [
    entry('', 1.0, 'daily'),
    // Core marketing / conversion
    entry('/sabi/services', 0.9, 'weekly'),
    entry('/sabi/calculator', 0.8, 'weekly'),
    entry('/sabi/docs', 0.7, 'weekly'),
    entry('/sabi/register', 0.8, 'monthly'),
    entry('/sabi/login', 0.5, 'monthly'),
    // Partners / resellers
    entry('/partners', 0.7, 'monthly'),
    entry('/partners/resellers', 0.7, 'monthly'),
    entry('/partners/resellers/apply', 0.6, 'monthly'),
    // Legal (trust signals — indexable, low priority)
    entry('/sabi/legal/terms', 0.3, 'yearly'),
    entry('/sabi/legal/privacy', 0.3, 'yearly'),
    entry('/sabi/legal/refunds', 0.3, 'yearly'),
    entry('/sabi/legal/cookies', 0.3, 'yearly'),
  ];
}

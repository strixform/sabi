import { pageMetadata, serviceLd, breadcrumbLd, faqLd } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';

export const metadata = pageMetadata({
  title: 'Buy Real Nigerian Followers, Likes & Views',
  ogTitle: 'SABI Services — Real Nigerian Engagement Across 11 Platforms',
  description:
    '50+ social media services across 11 platforms — Instagram, TikTok, YouTube, X, Facebook and more. Real Nigerian followers, likes, views, comments and shares, targetable by state, city and gender. See live naira pricing.',
  path: '/sabi/services',
  keywords:
    'buy Instagram followers Nigeria, TikTok views Nigeria, YouTube subscribers Nigeria, buy likes Nigeria, SMM services Nigeria, real Nigerian engagement, social media growth Nigeria, cheap followers Naira',
});

const faqs = [
  {
    q: 'Are the followers and likes from real Nigerians?',
    a: 'Yes. Every order is fulfilled by verified real people across Nigeria — not bots. You can target by state, city and gender.',
  },
  {
    q: 'How fast do orders start?',
    a: 'Most orders begin within minutes of placing them. Delivery pace depends on the service and quantity.',
  },
  {
    q: 'Which platforms are supported?',
    a: 'Instagram, TikTok, YouTube, X (Twitter), Facebook, and more — 11 platforms with over 50 services in total.',
  },
  {
    q: 'What do I pay in?',
    a: 'Pricing is in Nigerian naira. Fund your wallet and place orders instantly, or use the price calculator first.',
  },
];

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={[
          serviceLd(),
          breadcrumbLd([
            { name: 'Home', path: '/' },
            { name: 'Services', path: '/sabi/services' },
          ]),
          faqLd(faqs),
        ]}
      />
      {children}
    </>
  );
}

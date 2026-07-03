import { pageMetadata, breadcrumbLd } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';

export const metadata = pageMetadata({
  title: 'Price Calculator',
  description:
    'Work out the exact naira cost of any SABI order before you buy. Pick a platform, service and quantity and see live pricing instantly — followers, likes, views, comments and more.',
  path: '/sabi/calculator',
  keywords:
    'SMM price calculator Nigeria, followers price Naira, cost of Instagram followers Nigeria, social media pricing calculator',
});

export default function CalculatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Price Calculator', path: '/sabi/calculator' },
        ])}
      />
      {children}
    </>
  );
}

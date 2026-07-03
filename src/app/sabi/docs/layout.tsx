import { pageMetadata, breadcrumbLd } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';

export const metadata = pageMetadata({
  title: 'API Documentation',
  description:
    'Complete guide to integrating SABI — authentication, endpoints, service IDs and order placement. Build social growth into your own app or reseller panel.',
  path: '/sabi/docs',
  keywords: 'SABI API, SMM API Nigeria, reseller API, social media panel API documentation',
});

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'API Documentation', path: '/sabi/docs' },
        ])}
      />
      {children}
    </>
  );
}

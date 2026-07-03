import { pageMetadata, breadcrumbLd } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';

export const metadata = pageMetadata({
  title: 'Become a Reseller',
  description:
    'Start your own social media growth business with SABI. We build and launch your branded website with full API access — you set your prices and keep the margin. See setup and monthly pricing.',
  path: '/partners/resellers',
  keywords:
    'become SMM reseller Nigeria, white label social panel, start SMM panel, reseller pricing, branded SMM website',
});

export default function ResellersLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Partners', path: '/partners' },
          { name: 'Resellers', path: '/partners/resellers' },
        ])}
      />
      {children}
    </>
  );
}

import { pageMetadata, breadcrumbLd } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';

export const metadata = pageMetadata({
  title: 'Partners & White-Label',
  description:
    'Launch your own branded SMM panel on SABI — custom white-label website, full API access and an affiliate program. Resell real Nigerian engagement under your own brand.',
  path: '/partners',
  keywords:
    'white label SMM panel Nigeria, reseller program, social media panel reseller, SMM affiliate Nigeria, start SMM business Nigeria',
});

export default function PartnersLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Partners', path: '/partners' },
        ])}
      />
      {children}
    </>
  );
}

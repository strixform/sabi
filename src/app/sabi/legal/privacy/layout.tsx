import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Privacy Policy',
  description: 'How SABI collects, uses and protects your data. Read our privacy policy.',
  path: '/sabi/legal/privacy',
});

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

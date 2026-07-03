import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Terms of Service',
  description: 'The terms that govern your use of SABI. Read our terms of service.',
  path: '/sabi/legal/terms',
});

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Cookie Policy',
  description: 'How SABI uses cookies and similar technologies. Read our cookie policy.',
  path: '/sabi/legal/cookies',
});

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Refund Policy',
  description: 'When and how refunds are issued on SABI — including the under-delivery completion guarantee.',
  path: '/sabi/legal/refunds',
});

export default function RefundsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

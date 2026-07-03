import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Auto Engagement',
  description: 'Fund real engagement for your next posts — followers, likes and comments from real Nigerians on every post you publish.',
  path: '/sabi/engagement',
  noIndex: true, // authed buyer feature
});

export default function EngagementLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

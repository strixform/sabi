import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Create your free account',
  description:
    'Sign up for SABI in seconds and start growing on Instagram, TikTok, YouTube, X and more with real Nigerian engagement. No card required to browse — fund your wallet when ready.',
  path: '/sabi/register',
  keywords: 'SABI sign up, create account, SMM panel Nigeria register, social growth Nigeria account',
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

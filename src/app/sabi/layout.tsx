import { PushNotificationPrompt } from '@/components/PushNotificationPrompt';
// WhatsAppButton removed from layout — now lives as a small icon inside
// ModernSabiHeader so it appears in the nav bar on user pages only,
// not on admin pages (/sabi/admin/*).

// Layout is no longer force-dynamic — individual pages declare their own
// rendering strategy. Auth-dependent pages add `export const dynamic = 'force-dynamic'`
// directly in their page.tsx. Static/marketing pages can be cached.

export default function SabiLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PushNotificationPrompt />
    </>
  );
}

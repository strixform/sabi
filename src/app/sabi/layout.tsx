import { PushNotificationPrompt } from '@/components/PushNotificationPrompt';
// WhatsAppButton removed from layout — now lives as a small icon inside
// ModernSabiHeader so it appears in the nav bar on user pages only,
// not on admin pages (/sabi/admin/*).

// Force all /sabi/* pages to server-render on every request.
export const dynamic = 'force-dynamic';

export default function SabiLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PushNotificationPrompt />
    </>
  );
}

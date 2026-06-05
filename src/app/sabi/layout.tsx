import { PushNotificationPrompt } from '@/components/PushNotificationPrompt';

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

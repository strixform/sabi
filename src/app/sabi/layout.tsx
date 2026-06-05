// Force all /sabi/* pages to be server-rendered on every request.
// This prevents static pre-rendering which causes hydration mismatches
// (blank pages, auth flash) since all sabi pages depend on client-side state.
export const dynamic = 'force-dynamic';

export default function SabiLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

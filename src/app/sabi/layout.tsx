import Link from 'next/link';

export default function SabiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-800/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🎯 SABI
          </Link>
          <div className="flex gap-4 items-center">
            <Link href="/sabi/dashboard" className="text-sm font-semibold hover:text-blue-400 transition">
              Dashboard
            </Link>
            <Link href="/sabi/order" className="text-sm font-semibold hover:text-blue-400 transition">
              New Order
            </Link>
            <Link href="/sabi/api-keys" className="text-sm font-semibold hover:text-blue-400 transition">
              API Keys
            </Link>
            <button className="px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 rounded-lg transition">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {children}
      </main>
    </div>
  );
}

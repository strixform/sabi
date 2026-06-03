export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="border-b border-slate-800/50 pb-6">
        <h1 className="text-4xl font-black">Dashboard</h1>
        <p className="text-slate-400 mt-2">Welcome back! Here&apos;s your account overview.</p>
      </div>

      {/* Wallet Section */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <div className="text-slate-400 text-sm">Wallet Balance</div>
          <div className="text-3xl font-bold text-blue-400 mt-2">₦0.00</div>
          <button className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg text-sm">
            Fund Wallet
          </button>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <div className="text-slate-400 text-sm">Total Spent</div>
          <div className="text-3xl font-bold text-purple-400 mt-2">₦0.00</div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <div className="text-slate-400 text-sm">Active Orders</div>
          <div className="text-3xl font-bold text-pink-400 mt-2">0</div>
        </div>
      </div>

      {/* Quick Action */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-slate-700/50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Place Your First Order</h2>
        <p className="text-slate-300 mb-6">Get real, active Nigerian engagement for your social media</p>
        <a
          href="/sabi/order"
          className="inline-block px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition"
        >
          Start Ordering
        </a>
      </div>

      {/* Recent Orders */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Orders</h2>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 text-center text-slate-400">
          No orders yet
        </div>
      </div>
    </div>
  );
}

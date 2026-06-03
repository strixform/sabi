export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          🎯 Sabi
        </h1>
        <p className="text-slate-300 mt-2">Login to your account</p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/20 transition">
          Login
        </button>
      </div>

      <p className="text-center text-slate-400">
        Don&apos;t have an account?{' '}
        <a href="/sabi/register" className="text-blue-400 hover:underline">
          Register here
        </a>
      </p>
    </div>
  );
}

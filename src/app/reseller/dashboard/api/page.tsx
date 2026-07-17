'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiTarget, FiArrowLeft, FiCode, FiCopy, FiCheck, FiBook } from 'react-icons/fi';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GradientText } from '@/components/AnimatedText';
import { InteractiveCard } from '@/components/InteractiveCard';
import { CuteIconAnimation } from '@/components/CuteIconAnimation';

export default function ApiDocsPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const endpoints = [
    {
      id: 'create-order',
      method: 'POST',
      path: '/api/sabi/orders',
      description: 'Create a new service order',
      example: `curl -X POST https://sability.io/api/sabi/orders \\
  -H "Authorization: Bearer sabi_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "serviceType": "followers",
    "targetUrl": "https://instagram.com/username",
    "quantity": 500,
    "paymentMethod": "wallet"
  }'`,
    },
    {
      id: 'get-orders',
      method: 'GET',
      path: '/api/sabi/orders',
      description: 'Get list of your orders',
      example: `curl -X GET https://sability.io/api/sabi/orders \\
  -H "Authorization: Bearer sabi_YOUR_KEY"`,
    },
    {
      id: 'get-order',
      method: 'GET',
      path: '/api/sabi/orders/{id}',
      description: 'Get details of a specific order',
      example: `curl -X GET https://sability.io/api/sabi/orders/ORD123 \\
  -H "Authorization: Bearer sabi_YOUR_KEY"`,
    },
    {
      id: 'get-wallet',
      method: 'GET',
      path: '/api/sabi/wallet',
      description: 'Get wallet balance and transaction history',
      example: `curl -X GET https://sability.io/api/sabi/wallet \\
  -H "Authorization: Bearer sabi_YOUR_KEY"`,
    },
  ];

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      {/* Header */}
      <header className="border-b border-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/reseller/dashboard" className="flex items-center gap-3 hover:opacity-80 transition">
            <CuteIconAnimation type="bounce" duration={1.5}>
              <FiTarget className="w-8 h-8 text-blue-400" />
            </CuteIconAnimation>
            <div className="text-2xl font-black">
              <GradientText>SABI</GradientText>
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Single source of truth: the reseller API IS the SABI API. Keys come from the SABI account. */}
        <div className="mb-8 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5">
          <div className="text-white font-bold text-sm mb-1">🔑 Your API keys live in your SABI account</div>
          <p className="text-slate-300 text-sm">This is the same SABI API that powers your site — one system, one set of keys. Create your account, generate a key, and share it with us to power your built site.</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <a href="/sabi/api-keys" className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-500 text-white">Get your API keys →</a>
            <a href="/sabi/docs" className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-700 text-white">Full API reference</a>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Link href="/reseller/dashboard" className="text-blue-400 hover:text-blue-300 flex items-center gap-2 mb-4">
            <FiArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-black mb-2">
            API <GradientText>Documentation</GradientText>
          </h1>
          <p className="text-slate-400">Build custom interfaces using our REST API. Full authentication and webhook support.</p>
        </motion.div>

        {/* Quick Start */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          <InteractiveCard glowColor="blue">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <FiCode className="w-6 h-6" />
                Quick Start
              </h2>
              <div className="space-y-6">
                {/* Step 1 */}
                <div>
                  <h3 className="font-bold text-white mb-3">1. Get Your API Key</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Go to Settings → API Keys and create a new key. Keep it safe!
                  </p>
                </div>

                {/* Step 2 */}
                <div>
                  <h3 className="font-bold text-white mb-3">2. Make Your First Request</h3>
                  <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                    <code className="text-slate-300 text-sm font-mono block mb-3">
                      curl -X GET https://sability.io/api/sabi/wallet \<br />
                      &nbsp;&nbsp;-H "Authorization: Bearer sabi_YOUR_KEY"
                    </code>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleCopy(
                            'quick-start',
                            'curl -X GET https://sability.io/api/sabi/wallet \\\n  -H "Authorization: Bearer sabi_YOUR_KEY"'
                          )
                        }
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-xs font-semibold flex items-center gap-1"
                      >
                        {copied === 'quick-start' ? (
                          <>
                            <FiCheck className="w-3 h-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <FiCopy className="w-3 h-3" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Response */}
                <div>
                  <h3 className="font-bold text-white mb-3">Response</h3>
                  <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                    <code className="text-green-400 text-sm font-mono block">
                      {`{
  "balance": 50000,
  "totalFunded": 200000,
  "totalSpent": 150000,
  "currency": "NGN"
}`}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </InteractiveCard>
        </motion.div>

        {/* Endpoints */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Endpoints</h2>
          <div className="space-y-6">
            {endpoints.map((endpoint, i) => (
              <InteractiveCard key={endpoint.id} glowColor="purple">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-3 py-1 rounded font-bold text-xs ${
                            endpoint.method === 'GET'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-green-500/20 text-green-300'
                          }`}
                        >
                          {endpoint.method}
                        </span>
                        <code className="text-white font-mono">{endpoint.path}</code>
                      </div>
                      <p className="text-slate-400 text-sm">{endpoint.description}</p>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                    <code className="text-slate-300 text-sm font-mono block whitespace-pre-wrap">
                      {endpoint.example}
                    </code>
                    <button
                      onClick={() => handleCopy(endpoint.id, endpoint.example)}
                      className="mt-3 px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-xs font-semibold flex items-center gap-1"
                    >
                      {copied === endpoint.id ? (
                        <>
                          <FiCheck className="w-3 h-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <FiCopy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </InteractiveCard>
            ))}
          </div>
        </motion.div>

        {/* Authentication */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-12"
        >
          <InteractiveCard glowColor="green">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Authentication</h2>
              <p className="text-slate-400 mb-4">
                All API requests require Bearer token authentication. Include your API key in the Authorization header.
              </p>
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                <code className="text-slate-300 text-sm font-mono">
                  Authorization: Bearer sk_live_xxx...
                </code>
              </div>
            </div>
          </InteractiveCard>
        </motion.div>

        {/* Rate Limiting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12"
        >
          <InteractiveCard glowColor="orange">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Rate Limiting</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-2">Requests per Day</p>
                  <p className="text-2xl font-bold text-white">1,000</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-2">Requests per Hour</p>
                  <p className="text-2xl font-bold text-white">100</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-2">Burst Limit</p>
                  <p className="text-2xl font-bold text-white">20</p>
                </div>
              </div>
            </div>
          </InteractiveCard>
        </motion.div>

        {/* Webhooks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <InteractiveCard glowColor="blue">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <FiBook className="w-6 h-6" />
                Webhooks
              </h2>
              <p className="text-slate-400 mb-4">
                Get real-time notifications about order events. Configure your webhook URL in Settings.
              </p>
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-800 mb-4">
                <p className="text-slate-400 text-xs mb-2">Example webhook payload:</p>
                <code className="text-green-400 text-sm font-mono block">
                  {`{
  "event": "order.completed",
  "orderId": "ORD123",
  "serviceType": "followers",
  "status": "completed",
  "completedAt": "2026-06-02T12:00:00Z",
  "quantity": 500,
  "totalPrice": 5000
}`}
                </code>
              </div>
              <p className="text-slate-400 text-sm">
                Events: order.created, order.payment_confirmed, order.processing, order.completed, order.failed, order.refunded
              </p>
            </div>
          </InteractiveCard>
        </motion.div>
      </div>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GradientText } from '@/components/AnimatedText';
import { InteractiveCard } from '@/components/InteractiveCard';
import { FiCode, FiKey, FiZap, FiBook, FiArrowRight } from 'react-icons/fi';
import { SiJavascript, SiPython } from 'react-icons/si';
import { getCardColor } from '@/lib/designSystem';

const ENDPOINT_SECTIONS = [
  {
    title: 'Authentication',
    icon: FiKey,
    color: 'blue',
    endpoints: [
      {
        method: 'POST',
        path: '/api/sabi/auth/register',
        description: 'Register a new account',
        color: 'blue',
      },
      {
        method: 'POST',
        path: '/api/sabi/auth/login',
        description: 'Login to your account',
        color: 'purple',
      },
    ],
  },
  {
    title: 'Orders',
    icon: FiZap,
    color: 'cyan',
    endpoints: [
      {
        method: 'POST',
        path: '/api/sabi/orders',
        description: 'Create a new order',
        color: 'cyan',
      },
      {
        method: 'GET',
        path: '/api/sabi/orders',
        description: 'Get all orders for authenticated user',
        color: 'emerald',
      },
    ],
  },
  {
    title: 'Services',
    icon: FiBook,
    color: 'orange',
    endpoints: [
      {
        method: 'GET',
        path: '/api/sabi/services',
        description: 'Get all available services with pricing and details',
        color: 'orange',
      },
    ],
  },
  {
    title: 'Wallet',
    icon: FiCode,
    color: 'rose',
    endpoints: [
      {
        method: 'POST',
        path: '/api/sabi/wallet/fund',
        description: 'Initialize a payment to fund your wallet',
        color: 'rose',
      },
      {
        method: 'GET',
        path: '/api/sabi/wallet',
        description: 'Get wallet balance and transaction history',
        color: 'pink',
      },
    ],
  },
];

const CODE_EXAMPLES = [
  {
    title: 'JavaScript',
    icon: SiJavascript,
    language: 'javascript',
    code: `const apiKey = 'sabi_[keyId]_[token]';

// Create an order
const response = await fetch('https://sability.io/api/sabi/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${apiKey}\`
  },
  body: JSON.stringify({
    serviceId: 'instagram_followers',
    quantity: 500,
    targetUrl: 'https://instagram.com/yourprofile',
    paymentMethod: 'wallet'
  })
});

const data = await response.json();
console.log(data);`,
  },
  {
    title: 'Python',
    icon: SiPython,
    language: 'python',
    code: `import requests

api_key = 'sabi_[keyId]_[token]'
headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

# Create an order
response = requests.post(
    'https://sability.io/api/sabi/orders',
    headers=headers,
    json={
        'serviceId': 'instagram_followers',
        'quantity': 500,
        'targetUrl': 'https://instagram.com/yourprofile',
        'paymentMethod': 'wallet'
    }
)

print(response.json())`,
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <ModernSabiHeader showNavigation={true} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-black mb-2">
            <GradientText>API Documentation</GradientText>
          </h1>
          <p className="text-lg text-slate-400">Complete guide to integrating Sabi into your application</p>
        </motion.div>

        {/* Authentication Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-4">Authentication</h2>
            <p className="text-slate-300">All API requests require authentication. Include your API key in the Authorization header:</p>
          </div>
          <InteractiveCard glowColor="blue">
            <div className="p-6 sm:p-8">
              <div className="bg-[#0A0D14] p-4 rounded-lg border border-white/[0.06] overflow-auto">
                <code className="text-sm text-slate-200 font-mono">
                  Authorization: Bearer sabi_[keyId]_[token]
                </code>
              </div>
            </div>
          </InteractiveCard>
        </motion.div>

        {/* API Endpoints Sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold mb-8">API Endpoints</h2>
          <div className="grid gap-8">
            {ENDPOINT_SECTIONS.map((section, idx) => {
              const Icon = section.icon;
              return (
                <motion.div key={section.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + idx * 0.1 }}>
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold flex items-center gap-2 mb-4">
                      <Icon className="w-6 h-6 text-blue-400" />
                      {section.title}
                    </h3>
                  </div>
                  <div className="grid gap-4">
                    {section.endpoints.map((endpoint, endpointIdx) => (
                      <InteractiveCard key={endpoint.path} glowColor={section.color as any}>
                        <div className="p-6">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${endpoint.method === 'GET' ? 'bg-emerald-500/30' : 'bg-orange-500/30'}`}>
                                  {endpoint.method}
                                </span>
                                <code className="font-mono text-blue-400 font-bold">{endpoint.path}</code>
                              </div>
                              <p className="text-slate-400 text-sm">{endpoint.description}</p>
                            </div>
                            <FiArrowRight className="w-5 h-5 text-slate-600 hidden sm:block" />
                          </div>
                        </div>
                      </InteractiveCard>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Code Examples */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold mb-8">Code Examples</h2>
          <div className="grid lg:grid-cols-2 gap-6">
            {CODE_EXAMPLES.map((example, idx) => {
              const Icon = example.icon;
              return (
                <motion.div key={example.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + idx * 0.1 }}>
                  <InteractiveCard glowColor={idx === 0 ? 'yellow' : 'indigo'}>
                    <div className="p-6 sm:p-8">
                      <div className="flex items-center gap-2 mb-6">
                        <Icon className="w-5 h-5" />
                        <h3 className="text-xl font-bold">{example.title}</h3>
                      </div>
                      <div className="bg-[#0A0D14] p-4 rounded-lg border border-white/[0.06] overflow-auto">
                        <code className="text-xs text-slate-200 font-mono whitespace-pre-wrap">{example.code}</code>
                      </div>
                    </div>
                  </InteractiveCard>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Support Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <InteractiveCard glowColor="pink">
            <div className="p-6 sm:p-8">
              <h3 className="text-xl font-bold mb-2">Need Help?</h3>
              <p className="text-slate-300 mb-4">Check our documentation or contact support for assistance with integration.</p>
              <Link href="/sabi/api-keys" className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 font-semibold transition">
                Manage API Keys <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </InteractiveCard>
        </motion.div>
      </div>
    </div>
  );
}

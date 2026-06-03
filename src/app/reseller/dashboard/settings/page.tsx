'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiTarget, FiArrowLeft, FiKey, FiMail, FiPhone, FiMapPin, FiCopy, FiCheck, FiTrash2, FiPlus, FiHelpCircle } from 'react-icons/fi';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GradientText } from '@/components/AnimatedText';
import { InteractiveCard } from '@/components/InteractiveCard';
import { CuteIconAnimation } from '@/components/CuteIconAnimation';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed?: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
}

export default function SettingsPage() {
  const [reseller] = useState({
    businessName: 'Your Business Name',
    businessEmail: 'contact@business.com',
    contactName: 'John Doe',
    contactPhone: '+234 8XX XXX XXXX',
    businessAddress: '123 Business St, Lagos',
  });

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Mobile App',
      key: 'sk_live_abc123def456ghi789jkl...',
      createdAt: '2026-05-01',
      lastUsed: '2026-06-02',
    },
    {
      id: '2',
      name: 'Dashboard Integration',
      key: 'sk_live_xyz789uvw456rst123abc...',
      createdAt: '2026-04-15',
      lastUsed: '2026-06-01',
    },
  ]);

  const [tickets] = useState<SupportTicket[]>([
    {
      id: '#SUP001',
      subject: 'Site customization request',
      status: 'in_progress',
      createdAt: '2026-06-01',
    },
    {
      id: '#SUP002',
      subject: 'Question about API rate limits',
      status: 'resolved',
      createdAt: '2026-05-28',
    },
  ]);

  const [copied, setCopied] = useState<string | null>(null);
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  const handleCopyKey = (keyId: string, keyValue: string) => {
    navigator.clipboard.writeText(keyValue);
    setCopied(keyId);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCreateKey = () => {
    // In a real app, POST to /api/reseller/api-keys
    setShowNewKeyForm(false);
    setNewKeyName('');
  };

  const handleDeleteKey = (keyId: string) => {
    setApiKeys(prev => prev.filter(k => k.id !== keyId));
    // In a real app, DELETE to /api/reseller/api-keys/[id]
  };

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
            Settings & <GradientText>Account</GradientText>
          </h1>
          <p className="text-slate-400">Manage your account and API integrations</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Settings */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-2 space-y-8"
          >
            {/* Account Information */}
            <InteractiveCard glowColor="blue">
              <div className="p-8">
                <h3 className="text-xl font-bold text-white mb-6">Account Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={reseller.businessName}
                      disabled
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-400 mt-1">Contact us to update</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        <FiMail className="w-4 h-4 inline mr-2" />
                        Business Email
                      </label>
                      <input
                        type="email"
                        value={reseller.businessEmail}
                        disabled
                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        <FiPhone className="w-4 h-4 inline mr-2" />
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={reseller.contactPhone}
                        disabled
                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      <FiMapPin className="w-4 h-4 inline mr-2" />
                      Business Address
                    </label>
                    <input
                      type="text"
                      value={reseller.businessAddress}
                      disabled
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 cursor-not-allowed"
                    />
                  </div>

                  <button className="w-full px-4 py-2 border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 rounded-lg transition font-semibold text-sm mt-4">
                    Contact Support to Update
                  </button>
                </div>
              </div>
            </InteractiveCard>

            {/* API Keys */}
            <InteractiveCard glowColor="purple">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <FiKey className="w-5 h-5" />
                    API Keys
                  </h3>
                  <button
                    onClick={() => setShowNewKeyForm(true)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/20 transition font-semibold text-sm flex items-center gap-2"
                  >
                    <FiPlus className="w-4 h-4" />
                    New Key
                  </button>
                </div>

                {/* New Key Form */}
                {showNewKeyForm && (
                  <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-purple-500/30">
                    <input
                      type="text"
                      placeholder="Key name (e.g., Mobile App)"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none mb-3"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateKey}
                        className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition text-white font-semibold"
                      >
                        Create Key
                      </button>
                      <button
                        onClick={() => {
                          setShowNewKeyForm(false);
                          setNewKeyName('');
                        }}
                        className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition text-white font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Keys List */}
                <div className="space-y-3">
                  {apiKeys.map(key => (
                    <div
                      key={key.id}
                      className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-purple-500/30 transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-white">{key.name}</h4>
                          <p className="text-xs text-slate-400 mt-1">Created {key.createdAt}</p>
                          {key.lastUsed && (
                            <p className="text-xs text-slate-400">Last used {key.lastUsed}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteKey(key.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition text-red-400"
                          title="Delete key"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={key.key}
                          disabled
                          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 text-sm font-mono cursor-not-allowed"
                        />
                        <button
                          onClick={() => handleCopyKey(key.id, key.key)}
                          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition text-slate-300"
                        >
                          {copied === key.id ? (
                            <FiCheck className="w-4 h-4" />
                          ) : (
                            <FiCopy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-slate-400 mt-4">
                  Never share your API keys. Treat them like passwords. If compromised, regenerate immediately.
                </p>
              </div>
            </InteractiveCard>

            {/* Support Tickets */}
            <InteractiveCard glowColor="green">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <FiHelpCircle className="w-5 h-5" />
                    Support Tickets
                  </h3>
                  <Link
                    href="/reseller/dashboard/support"
                    className="text-green-400 hover:text-green-300 text-sm font-semibold"
                  >
                    View All →
                  </Link>
                </div>

                <div className="space-y-3">
                  {tickets.map(ticket => (
                    <div key={ticket.id} className="flex items-start justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div>
                        <p className="font-bold text-white text-sm">{ticket.id}</p>
                        <p className="text-slate-400 text-sm">{ticket.subject}</p>
                        <p className="text-xs text-slate-500 mt-1">Created {ticket.createdAt}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          ticket.status === 'resolved'
                            ? 'bg-green-500/20 text-green-300'
                            : ticket.status === 'in_progress'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-yellow-500/20 text-yellow-300'
                        }`}
                      >
                        {ticket.status.replace('_', ' ').charAt(0).toUpperCase() + ticket.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </InteractiveCard>
          </motion.div>

          {/* Quick Links & Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Documentation */}
            <InteractiveCard glowColor="blue">
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Documentation</h3>
                <div className="space-y-2">
                  <a
                    href="#"
                    className="block px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition text-slate-300 text-sm font-semibold"
                  >
                    API Reference
                  </a>
                  <a
                    href="#"
                    className="block px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition text-slate-300 text-sm font-semibold"
                  >
                    Integration Guide
                  </a>
                  <a
                    href="#"
                    className="block px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition text-slate-300 text-sm font-semibold"
                  >
                    Best Practices
                  </a>
                </div>
              </div>
            </InteractiveCard>

            {/* Webhook Configuration */}
            <InteractiveCard glowColor="purple">
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Webhooks</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Get real-time notifications about order events
                </p>
                <input
                  type="url"
                  placeholder="https://yoursite.com/webhooks"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none text-sm mb-3"
                />
                <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition text-white font-semibold text-sm">
                  Save Webhook URL
                </button>
              </div>
            </InteractiveCard>

            {/* Danger Zone */}
            <InteractiveCard glowColor="red">
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Danger Zone</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Irreversible actions
                </p>
                <button className="w-full px-4 py-2 border border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-lg transition font-semibold text-sm">
                  Deactivate Account
                </button>
              </div>
            </InteractiveCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { FiCopy, FiTrash2, FiPlus, FiLoader } from 'react-icons/fi';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { InteractiveCard } from '@/components/InteractiveCard';
import { GradientText } from '@/components/AnimatedText';
import { getCardColor } from '@/lib/designSystem';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const response = await fetch('/api/sabi/api-keys');
      const data = await response.json();
      if (data.success) {
        setKeys(data.keys || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    setCreatingKey(true);

    try {
      const response = await fetch('/api/sabi/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      });

      const data = await response.json();
      if (data.success) {
        setKeys([...keys, { id: data.key.split('_')[1], name: newKeyName, createdAt: new Date().toISOString(), lastUsedAt: null }]);
        setNewKeyName('');
        setShowForm(false);
        alert(`API Key created:\n\n${data.key}\n\nSave this somewhere safe - you won't see it again!`);
      }
    } finally {
      setCreatingKey(false);
    }
  };

  const deleteKey = async (keyId: string) => {
    if (!confirm('Are you sure? This action cannot be undone.')) return;

    try {
      const response = await fetch('/api/sabi/api-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId }),
      });

      const data = await response.json();
      if (data.success) {
        setKeys(keys.filter((k) => k.id !== keyId));
      }
    } catch (error) {
      alert('Failed to delete key');
    }
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <ModernSabiHeader showNavigation={true} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 sm:mb-12"
        >
          <h1 className="text-5xl font-black mb-2">
            <GradientText>API Keys</GradientText>
          </h1>
          <p className="text-slate-400 text-lg">Manage your API keys for programmatic access</p>
        </motion.div>

        <div className="space-y-6 sm:space-y-8">
          {/* Documentation Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <InteractiveCard glowColor="cyan">
              <div className="p-6 sm:p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-2xl">📚</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-cyan-400 mb-2">Quick Start</h3>
                    <p className="text-slate-300 text-sm mb-4">
                      Use your API key to integrate Sabi into your application. Include it in the Authorization header:
                    </p>
                    <div className="bg-[#0A0D14] p-3 rounded-lg border border-white/[0.06] mb-4 overflow-auto">
                      <code className="text-xs text-slate-200 font-mono">
                        Authorization: Bearer sabi_[keyId]_[token]
                      </code>
                    </div>
                    <Link href="/sabi/docs" className="text-cyan-400 hover:text-cyan-300 font-semibold text-sm transition">
                      View full API documentation →
                    </Link>
                  </div>
                </div>
              </div>
            </InteractiveCard>
          </motion.div>

          {/* Create New Key Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {!showForm && (
              <motion.button
                onClick={() => setShowForm(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold rounded-lg transition flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/20"
              >
                <FiPlus className="w-5 h-5" />
                Create New API Key
              </motion.button>
            )}
          </motion.div>

          {/* Create Key Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <InteractiveCard glowColor="blue">
                  <div className="p-6 sm:p-8">
                    <h3 className="text-lg font-bold mb-6">Create New API Key</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-slate-300">Key Name</label>
                        <input
                          type="text"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          placeholder="e.g., Mobile App, Dashboard Integration"
                          className="w-full px-4 py-3 bg-white/[0.025] border border-white/[0.06] rounded-lg text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                        <p className="text-xs text-slate-400 mt-2">Give your key a descriptive name</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <motion.button
                          onClick={createKey}
                          disabled={!newKeyName.trim() || creatingKey}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          {creatingKey ? (
                            <>
                              <FiLoader className="w-4 h-4 animate-spin inline mr-2" />
                              Creating...
                            </>
                          ) : (
                            'Create Key'
                          )}
                        </motion.button>
                        <motion.button
                          onClick={() => setShowForm(false)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-6 py-3 border border-white/[0.08]/50 text-white font-bold rounded-lg hover:bg-white/[0.015] transition"
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </InteractiveCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* API Keys List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">Your API Keys</h3>

              {loading ? (
                <InteractiveCard glowColor="blue">
                  <div className="p-8 text-center">
                    <FiLoader className="w-6 h-6 animate-spin mx-auto mb-3 text-blue-400" />
                    <p className="text-slate-400">Loading your API keys...</p>
                  </div>
                </InteractiveCard>
              ) : keys.length === 0 ? (
                <InteractiveCard glowColor="blue">
                  <div className="p-8 text-center">
                    <p className="text-slate-400 mb-2">No API keys yet</p>
                    <p className="text-sm text-slate-500">Create your first API key to get started with programmatic access</p>
                  </div>
                </InteractiveCard>
              ) : (
                <div className="grid gap-4">
                  {keys.map((key, idx) => {
                    const cardColor = getCardColor(idx);
                    return (
                      <motion.div
                        key={key.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <InteractiveCard glowColor={cardColor.glow as any}>
                          <div className="p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-bold text-white text-lg mb-1">{key.name}</h4>
                              <div className="text-xs text-slate-400 space-y-1">
                                <p>Created {new Date(key.createdAt).toLocaleDateString()}</p>
                                {key.lastUsedAt && (
                                  <p>Last used {new Date(key.lastUsedAt).toLocaleDateString()}</p>
                                )}
                              </div>
                            </div>
                            <motion.button
                              onClick={() => deleteKey(key.id)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-4 py-2 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition flex items-center gap-2 text-sm"
                            >
                              <FiTrash2 className="w-4 h-4" />
                              Delete
                            </motion.button>
                          </div>
                        </InteractiveCard>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

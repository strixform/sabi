'use client';

import { useEffect, useState } from 'react';

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
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2">API Keys</h1>
        <p className="text-slate-400">Manage your API keys for programmatic access</p>
      </div>

      {/* Documentation */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 mb-8">
        <h3 className="font-bold text-blue-400 mb-2">📚 Documentation</h3>
        <p className="text-sm text-slate-300 mb-3">
          Use your API key to integrate Sabi into your application. Include it in the Authorization header:
        </p>
        <code className="block bg-slate-900 p-3 rounded text-xs text-slate-200 mb-3 overflow-auto">
          Authorization: Bearer sabi_[keyId]_[token]
        </code>
        <a href="/sabi/docs" className="text-blue-400 hover:underline text-sm">
          View full API documentation →
        </a>
      </div>

      {/* Create New Key */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="mb-8 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition"
        >
          + Create New API Key
        </button>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-bold mb-4">Create New API Key</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Key Name</label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Mobile App, Dashboard Integration"
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-slate-400 mt-1">Give your key a descriptive name</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={createKey}
                disabled={!newKeyName.trim() || creatingKey}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg disabled:opacity-50 transition"
              >
                {creatingKey ? 'Creating...' : 'Create Key'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-slate-600 text-white font-bold rounded-lg hover:border-slate-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Keys List */}
      <div>
        <h3 className="text-xl font-bold mb-4">Your API Keys</h3>
        {loading ? (
          <p className="text-slate-400">Loading...</p>
        ) : keys.length === 0 ? (
          <p className="text-slate-400 bg-slate-800/50 rounded-lg p-4 text-center">
            No API keys yet. Create one to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {keys.map((key) => (
              <div
                key={key.id}
                className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="font-bold">{key.name}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Created {new Date(key.createdAt).toLocaleDateString()}
                    {key.lastUsedAt && (
                      <> • Last used {new Date(key.lastUsedAt).toLocaleDateString()}</>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteKey(key.id)}
                  className="px-4 py-2 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

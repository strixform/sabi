'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function OrderPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    serviceId: '',
    quantity: '',
    targetUrl: '',
    paymentMethod: 'flutterwave',
  });
  const [loading, setLoading] = useState(false);

  const services = [
    { id: 'instagram_followers', name: 'Instagram Followers', icon: '📷', price: '₦0.60' },
    { id: 'instagram_likes', name: 'Instagram Likes', icon: '❤️', price: '₦0.80' },
    { id: 'twitter_followers', name: 'Twitter Followers', icon: '𝕏', price: '₦0.55' },
    { id: 'tiktok_followers', name: 'TikTok Followers', icon: '🎵', price: '₦0.70' },
    { id: 'youtube_subscribers', name: 'YouTube Subscribers', icon: '▶️', price: '₦0.80' },
    { id: 'facebook_likes', name: 'Facebook Likes', icon: '👍', price: '₦0.85' },
  ];

  const handleNext = () => {
    if (step < 6) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleServiceSelect = (serviceId: string) => {
    setFormData({ ...formData, serviceId });
    handleNext();
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sabi/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: formData.serviceId,
          quantity: parseInt(formData.quantity),
          targetUrl: formData.targetUrl,
          paymentMethod: formData.paymentMethod,
        }),
      });

      const data = await response.json();
      if (data.success) {
        window.location.href = `/sabi/orders/${data.orderId}`;
      } else {
        alert(data.error || 'Order failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2">Create New Order</h1>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition ${
                s <= step ? 'bg-blue-500' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step 1: Service Selection */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Step 1: Choose a Service</h2>
          <p className="text-slate-400">Select the type of engagement you want</p>
          <div className="grid md:grid-cols-2 gap-4">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => handleServiceSelect(service.id)}
                className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:border-blue-500/50 transition text-left"
              >
                <div className="text-4xl mb-2">{service.icon}</div>
                <div className="font-bold">{service.name}</div>
                <div className="text-blue-400 text-sm">{service.price} per unit</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Quantity */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Step 2: How Many?</h2>
          <p className="text-slate-400">Enter the quantity you want to purchase</p>
          <input
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            placeholder="Enter quantity"
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-lg"
          />
          <div className="text-sm text-slate-400">
            Min: 100 | Max: 100,000
          </div>
        </div>
      )}

      {/* Step 3: Target URL */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Step 3: Target URL</h2>
          <p className="text-slate-400">Enter the link where you want engagement sent</p>
          <input
            type="url"
            value={formData.targetUrl}
            onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
            placeholder="https://instagram.com/yourprofile"
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* Step 4: Payment Method */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Step 4: Payment Method</h2>
          <p className="text-slate-400">How would you like to pay?</p>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-4 bg-slate-800/50 border border-blue-500/50 rounded-lg cursor-pointer">
              <input
                type="radio"
                name="payment"
                value="flutterwave"
                checked={formData.paymentMethod === 'flutterwave'}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              />
              <div>
                <div className="font-bold">Flutterwave</div>
                <div className="text-sm text-slate-400">Card, Bank Transfer, or Mobile Money</div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg cursor-pointer hover:border-slate-600/50 transition">
              <input
                type="radio"
                name="payment"
                value="wallet"
                checked={formData.paymentMethod === 'wallet'}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              />
              <div>
                <div className="font-bold">Wallet Balance</div>
                <div className="text-sm text-slate-400">Use funds in your Sabi wallet</div>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Step 5: Review */}
      {step === 5 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Step 5: Review Order</h2>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Service:</span>
              <span className="font-bold">
                {services.find((s) => s.id === formData.serviceId)?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Quantity:</span>
              <span className="font-bold">{formData.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target URL:</span>
              <span className="font-bold text-sm truncate">{formData.targetUrl}</span>
            </div>
            <div className="border-t border-slate-700 pt-3 mt-3 flex justify-between text-lg">
              <span>Total Price:</span>
              <span className="font-bold text-blue-400">₦ Calculating...</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 6: Confirmation */}
      {step === 6 && (
        <div className="text-center space-y-6">
          <div className="text-6xl">✅</div>
          <h2 className="text-3xl font-bold">Order Complete!</h2>
          <p className="text-slate-400 text-lg">
            Your order is being processed. You can track it on your dashboard.
          </p>
          <Link
            href="/sabi/dashboard"
            className="inline-block px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg hover:shadow-lg"
          >
            Go to Dashboard
          </Link>
        </div>
      )}

      {/* Navigation */}
      {step < 6 && (
        <div className="flex gap-4 mt-8">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="px-6 py-3 border border-slate-600 text-white font-bold rounded-lg hover:border-slate-400 transition"
            >
              Back
            </button>
          )}
          <button
            onClick={step === 5 ? handleSubmit : handleNext}
            disabled={
              (step === 2 && !formData.quantity) ||
              (step === 3 && !formData.targetUrl) ||
              loading
            }
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Processing...' : step === 5 ? 'Place Order' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
}

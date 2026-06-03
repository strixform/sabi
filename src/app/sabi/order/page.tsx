'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const SERVICES = [
  { id: 'instagram_followers', name: 'Instagram Followers', price: 60, min: 100, max: 10000 },
  { id: 'instagram_likes', name: 'Instagram Likes', price: 80, min: 50, max: 5000 },
  { id: 'twitter_followers', name: 'Twitter/X Followers', price: 55, min: 100, max: 5000 },
  { id: 'tiktok_followers', name: 'TikTok Followers', price: 70, min: 100, max: 10000 },
  { id: 'youtube_subscribers', name: 'YouTube Subscribers', price: 80, min: 50, max: 5000 },
  { id: 'facebook_likes', name: 'Facebook Likes', price: 85, min: 50, max: 5000 },
];

export default function OrderPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    serviceId: '',
    quantity: 0,
    targetUrl: '',
    paymentMethod: 'korapay',
  });

  const selectedService = SERVICES.find(s => s.id === formData.serviceId);
  const totalCost = selectedService ? (selectedService.price * formData.quantity) : 0;
  const platformFee = Math.round(totalCost * 0.15);
  const finalCost = totalCost + platformFee;

  const handleSubmit = async () => {
    if (!formData.serviceId || !formData.quantity || !formData.targetUrl) {
      alert('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/sabi/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: formData.serviceId,
          quantity: formData.quantity,
          targetUrl: formData.targetUrl,
          paymentMethod: formData.paymentMethod,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/sabi/orders/${data.orderId}`);
      } else {
        alert(data.error || 'Order failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-12 space-y-2">
        <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Create Your Order
        </h1>
        <p className="text-lg text-slate-400">Complete 4 simple steps to get real engagement</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex gap-3 mb-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition ${
                  s <= step
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'bg-slate-700/50 text-slate-400'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
              {s < 4 && (
                <div
                  className={`flex-1 h-1 rounded-full transition ${
                    s < step ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-slate-700/50'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-8">
          {/* Step 1: Service Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black mb-2">Step 1: Select Service</h2>
                <p className="text-slate-400">Choose the type of engagement you want</p>
              </div>

              <div className="grid gap-4">
                {SERVICES.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      setFormData({ ...formData, serviceId: service.id });
                      setStep(2);
                    }}
                    className="relative group text-left p-6 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 group-hover:border-blue-500/50 rounded-xl transition"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-xl opacity-0 group-hover:opacity-100 transition" />
                    <div className="relative space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg">{service.name}</h3>
                        <span className="text-xs px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                          ₦{service.price}/unit
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">
                        Min: {service.min} • Max: {service.max.toLocaleString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Quantity */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black mb-2">Step 2: Choose Quantity</h2>
                <p className="text-slate-400">How many units do you want to order?</p>
              </div>

              <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-8">
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-300 mb-3 block">Quantity</span>
                    <input
                      type="number"
                      min={selectedService?.min}
                      max={selectedService?.max}
                      value={formData.quantity || ''}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:border-blue-500/50 focus:outline-none text-white"
                      placeholder={`Min: ${selectedService?.min}, Max: ${selectedService?.max}`}
                    />
                  </label>
                  <p className="text-xs text-slate-500">
                    Range: {selectedService?.min} - {selectedService?.max?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Target URL */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black mb-2">Step 3: Target URL</h2>
                <p className="text-slate-400">Where should the engagement go?</p>
              </div>

              <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-8">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-300 mb-3 block">Instagram/Twitter/TikTok URL</span>
                  <input
                    type="url"
                    value={formData.targetUrl}
                    onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:border-blue-500/50 focus:outline-none text-white"
                    placeholder="https://instagram.com/username/post/12345..."
                  />
                </label>
              </div>
            </div>
          )}

          {/* Step 4: Review & Pay */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black mb-2">Step 4: Review & Pay</h2>
                <p className="text-slate-400">Confirm your order details</p>
              </div>

              <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-8 space-y-6">
                <div className="space-y-3 pb-6 border-b border-slate-700/50">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Service:</span>
                    <span className="font-semibold">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Quantity:</span>
                    <span className="font-semibold">{formData.quantity.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Unit Price:</span>
                    <span className="font-semibold">₦{selectedService?.price}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Subtotal:</span>
                    <span>₦{totalCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Platform Fee (15%):</span>
                    <span>₦{platformFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-3 border-t border-slate-700/50">
                    <span>Total:</span>
                    <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      ₦{finalCost.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="flex-1 px-6 py-3 border-2 border-slate-700 hover:border-slate-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>

            {step < 4 ? (
              <button
                onClick={() => setStep(Math.min(4, step + 1))}
                disabled={
                  (step === 1 && !formData.serviceId) ||
                  (step === 2 && (!formData.quantity || formData.quantity < (selectedService?.min || 0))) ||
                  (step === 3 && !formData.targetUrl)
                }
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Complete Order'}
              </button>
            )}
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 space-y-6">
            <h3 className="font-bold text-lg">Order Summary</h3>

            {selectedService && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm text-slate-400">Service</div>
                  <div className="font-semibold">{selectedService.name}</div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-slate-400">Quantity</div>
                  <div className="font-semibold">{formData.quantity.toLocaleString()}</div>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-700/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Subtotal</span>
                    <span>₦{totalCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Fee (15%)</span>
                    <span>₦{platformFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-3 border-t border-slate-700/50">
                    <span>Total</span>
                    <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      ₦{finalCost.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-300">
                  ✓ Real, verified users • Delivery within 24-48h • Money-back guarantee
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

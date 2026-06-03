'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GradientText } from '@/components/AnimatedText';
import { StaggerContainer, StaggerItem } from '@/components/StaggerContainer';
import { InteractiveCard } from '@/components/InteractiveCard';
import { FloatingElement } from '@/components/FloatingElement';

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

  const selectedService = SERVICES.find((s) => s.id === formData.serviceId);
  const totalCost = selectedService ? selectedService.price * formData.quantity : 0;
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
    <div className="min-h-screen relative">
      <AnimatedBackground />

      <div className="relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 space-y-2"
        >
          <h1 className="text-5xl font-black">
            <GradientText>Create Your Order</GradientText>
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-400"
          >
            Complete 4 simple steps to get real engagement
          </motion.p>
        </motion.div>

        {/* Animated Progress Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <div className="flex gap-3 mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex-1 flex items-center gap-3">
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition ${
                    s <= step ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'bg-slate-700/50 text-slate-400'
                  }`}
                  animate={
                    s === step
                      ? {
                          scale: [1, 1.15, 1],
                          boxShadow: ['0 0 0 0 rgba(59,130,246,0.7)', '0 0 0 10px rgba(59,130,246,0)', '0 0 0 0 rgba(59,130,246,0)'],
                        }
                      : {}
                  }
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                >
                  {s < step ? '✓' : s}
                </motion.div>
                {s < 4 && (
                  <motion.div
                    className={`flex-1 h-1 rounded-full transition ${s < step ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-slate-700/50'}`}
                    animate={s === step - 1 ? { scaleX: [0, 1] } : {}}
                    transition={{ duration: 0.6 }}
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-8">
            <AnimatePresence mode="wait">
              {/* Step 1: Service Selection */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-2xl font-black mb-2">Step 1: Select Service</h2>
                    <p className="text-slate-400">Choose the type of engagement you want</p>
                  </div>

                  <StaggerContainer staggerDelay={0.08}>
                    <div className="grid gap-4">
                      {SERVICES.map((service, i) => (
                        <StaggerItem key={service.id}>
                          <motion.button
                            onClick={() => {
                              setFormData({ ...formData, serviceId: service.id });
                              setStep(2);
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative group text-left p-6 rounded-xl transition duration-300 ${
                              formData.serviceId === service.id
                                ? 'border-2 border-blue-500 bg-blue-500/10'
                                : 'border border-slate-700/50 hover:border-blue-500/50 bg-slate-800/30'
                            }`}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-purple-600/0 rounded-xl opacity-0 group-hover:opacity-10 transition" />
                            <div className="relative space-y-2">
                              <div className="flex justify-between items-start">
                                <h3 className="font-bold text-lg">{service.name}</h3>
                                <span className="text-xs px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full">₦{service.price}/unit</span>
                              </div>
                              <p className="text-sm text-slate-400">
                                Min: {service.min} • Max: {service.max.toLocaleString()}
                              </p>
                            </div>
                          </motion.button>
                        </StaggerItem>
                      ))}
                    </div>
                  </StaggerContainer>
                </motion.div>
              )}

              {/* Step 2: Quantity */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-2xl font-black mb-2">Step 2: Choose Quantity</h2>
                    <p className="text-slate-400">How many units do you want to order?</p>
                  </div>

                  <InteractiveCard glowColor="blue">
                    <div className="p-8 space-y-6">
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-300 mb-3 block">Quantity</span>
                        <motion.input
                          type="number"
                          min={selectedService?.min}
                          max={selectedService?.max}
                          value={formData.quantity || ''}
                          onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:border-blue-500/50 focus:outline-none text-white focus:ring-2 focus:ring-blue-500/20 transition"
                          placeholder={`Min: ${selectedService?.min}, Max: ${selectedService?.max}`}
                          whileFocus={{ scale: 1.02 }}
                        />
                      </label>
                      <p className="text-xs text-slate-500">
                        Range: {selectedService?.min} - {selectedService?.max?.toLocaleString()}
                      </p>
                    </div>
                  </InteractiveCard>
                </motion.div>
              )}

              {/* Step 3: Target URL */}
              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-2xl font-black mb-2">Step 3: Target URL</h2>
                    <p className="text-slate-400">Where should the engagement go?</p>
                  </div>

                  <InteractiveCard glowColor="purple">
                    <div className="p-8">
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-300 mb-3 block">Instagram/Twitter/TikTok URL</span>
                        <motion.input
                          type="url"
                          value={formData.targetUrl}
                          onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:border-purple-500/50 focus:outline-none text-white focus:ring-2 focus:ring-purple-500/20 transition"
                          placeholder="https://instagram.com/username/post/12345..."
                          whileFocus={{ scale: 1.02 }}
                        />
                      </label>
                    </div>
                  </InteractiveCard>
                </motion.div>
              )}

              {/* Step 4: Review & Pay */}
              {step === 4 && (
                <motion.div
                  key="step-4"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-2xl font-black mb-2">Step 4: Review & Pay</h2>
                    <p className="text-slate-400">Confirm your order details</p>
                  </div>

                  <InteractiveCard glowColor="pink">
                    <div className="p-8 space-y-6">
                      <motion.div
                        className="space-y-3 pb-6 border-b border-slate-700/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ staggerChildren: 0.1 }}
                      >
                        {[
                          { label: 'Service:', value: selectedService?.name },
                          { label: 'Quantity:', value: formData.quantity.toLocaleString() },
                          { label: 'Unit Price:', value: `₦${selectedService?.price}` },
                        ].map((item, i) => (
                          <motion.div
                            key={i}
                            className="flex justify-between"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                          >
                            <span className="text-slate-400">{item.label}</span>
                            <span className="font-semibold">{item.value}</span>
                          </motion.div>
                        ))}
                      </motion.div>

                      <motion.div
                        className="space-y-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Subtotal:</span>
                          <span>₦{totalCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Platform Fee (15%):</span>
                          <span>₦{platformFee.toLocaleString()}</span>
                        </div>
                        <motion.div
                          className="flex justify-between text-lg font-bold pt-3 border-t border-slate-700/50"
                          animate={{ scale: [1, 1.02, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <span>Total:</span>
                          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            ₦{finalCost.toLocaleString()}
                          </span>
                        </motion.div>
                      </motion.div>
                    </div>
                  </InteractiveCard>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex gap-4"
            >
              <motion.button
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 px-6 py-3 border-2 border-slate-700 hover:border-slate-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </motion.button>

              {step < 4 ? (
                <motion.button
                  onClick={() => setStep(Math.min(4, step + 1))}
                  disabled={
                    (step === 1 && !formData.serviceId) ||
                    (step === 2 && (!formData.quantity || formData.quantity < (selectedService?.min || 0))) ||
                    (step === 3 && !formData.targetUrl)
                  }
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleSubmit}
                  disabled={loading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Complete Order'}
                </motion.button>
              )}
            </motion.div>
          </div>

          {/* Summary Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-8 space-y-6">
              <InteractiveCard glowColor="blue">
                <div className="p-6 space-y-6">
                  <h3 className="font-bold text-lg">Order Summary</h3>

                  {selectedService && (
                    <StaggerContainer staggerDelay={0.1}>
                      <div className="space-y-4">
                        <StaggerItem>
                          <div className="space-y-2">
                            <div className="text-sm text-slate-400">Service</div>
                            <div className="font-semibold">{selectedService.name}</div>
                          </div>
                        </StaggerItem>

                        <StaggerItem>
                          <div className="space-y-2">
                            <div className="text-sm text-slate-400">Quantity</div>
                            <motion.div
                              className="font-semibold"
                              key={formData.quantity}
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                            >
                              {formData.quantity.toLocaleString()}
                            </motion.div>
                          </div>
                        </StaggerItem>

                        <StaggerItem>
                          <div className="space-y-2 pt-4 border-t border-slate-700/50">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Subtotal</span>
                              <span>₦{totalCost.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Fee (15%)</span>
                              <span>₦{platformFee.toLocaleString()}</span>
                            </div>
                            <motion.div
                              className="flex justify-between font-bold text-lg pt-3 border-t border-slate-700/50"
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <span>Total</span>
                              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                ₦{finalCost.toLocaleString()}
                              </span>
                            </motion.div>
                          </div>
                        </StaggerItem>
                      </div>
                    </StaggerContainer>
                  )}

                  <FloatingElement delay={0} duration={4} distance={5}>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-300">
                      ✓ Real, verified users • Delivery within 24-48h • Money-back guarantee
                    </div>
                  </FloatingElement>
                </div>
              </InteractiveCard>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

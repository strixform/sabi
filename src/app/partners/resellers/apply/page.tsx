'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiTarget, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GradientText } from '@/components/AnimatedText';
import { InteractiveCard } from '@/components/InteractiveCard';
import { AnimateInText } from '@/components/AnimateInText';
import { CuteIconAnimation } from '@/components/CuteIconAnimation';

export default function ApplyPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    // Business info
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
    country: 'NG',

    // Contact person
    contactName: '',
    contactEmail: '',
    contactPhone: '',

    // Billing
    paymentMethod: 'bank_transfer',
    accountNumber: '',
    bankCode: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/reseller/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/partners';
        }, 3000);
      } else {
        setError(data.error || 'Application submission failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10 max-w-md w-full mx-4">
          <InteractiveCard glowColor="green">
            <div className="p-8 text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <FiCheckCircle className="w-16 h-16 text-green-400 mx-auto" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white">Application Submitted!</h2>
              <p className="text-slate-300">
                Thank you for applying. Our team will review your application and contact you within 48 hours.
              </p>
              <p className="text-sm text-slate-400">Redirecting to partners page...</p>
            </div>
          </InteractiveCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      {/* Header */}
      <header className="border-b border-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/partners" className="flex items-center gap-3 hover:opacity-80 transition">
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-black mb-4">
            <GradientText>
              <AnimateInText type="blur" delay={0.2}>
                Become a Sabi Reseller
              </AnimateInText>
            </GradientText>
          </h1>
          <p className="text-slate-300">
            <AnimateInText type="fade" delay={0.3}>
              Fill out this form to apply for our reseller program
            </AnimateInText>
          </p>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-3"
          >
            <FiAlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <p className="text-red-300 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Form */}
        <InteractiveCard glowColor="blue">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Business Information */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Business Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    placeholder="Your business name"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Business Email *
                    </label>
                    <input
                      type="email"
                      name="businessEmail"
                      value={formData.businessEmail}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      placeholder="contact@business.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Business Phone *
                    </label>
                    <input
                      type="tel"
                      name="businessPhone"
                      value={formData.businessPhone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      placeholder="+234 8XX XXX XXXX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Business Address
                  </label>
                  <input
                    type="text"
                    name="businessAddress"
                    value={formData.businessAddress}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    placeholder="Street, City, State"
                  />
                </div>
              </div>
            </div>

            {/* Contact Person */}
            <div className="border-t border-slate-700 pt-8">
              <h3 className="text-lg font-bold text-white mb-4">Contact Person</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    placeholder="Your full name"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      placeholder="your.email@gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      placeholder="+234 8XX XXX XXXX"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="border-t border-slate-700 pt-8">
              <h3 className="text-lg font-bold text-white mb-4">Payment Method</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Preferred Payment Method *
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="wallet">Sabi Wallet</option>
                  </select>
                </div>

                {formData.paymentMethod === 'bank_transfer' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Account Number *
                      </label>
                      <input
                        type="text"
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleInputChange}
                        required={formData.paymentMethod === 'bank_transfer'}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                        placeholder="0123456789"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Bank Code *
                      </label>
                      <input
                        type="text"
                        name="bankCode"
                        value={formData.bankCode}
                        onChange={handleInputChange}
                        required={formData.paymentMethod === 'bank_transfer'}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                        placeholder="GTB, UBA, etc"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="border-t border-slate-700 pt-8">
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting Application...' : 'Submit Application'}
              </motion.button>

              <p className="text-center text-slate-400 text-sm mt-4">
                We'll review your application and contact you within 48 hours.
              </p>
            </div>
          </form>
        </InteractiveCard>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link href="/partners/resellers" className="text-blue-400 hover:text-blue-300 transition">
            ← Back to Reseller Program
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiTarget, FiArrowLeft, FiDownload, FiCreditCard, FiCalendar, FiCheckCircle } from 'react-icons/fi';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GradientText } from '@/components/AnimatedText';
import { InteractiveCard } from '@/components/InteractiveCard';
import { CuteIconAnimation } from '@/components/CuteIconAnimation';

interface Invoice {
  id: string;
  billingMonth: string;
  setupFee: number;
  maintenanceFee: number;
  orderCommission: number;
  totalAmount: number;
  amountPaid: number;
  status: 'pending' | 'paid' | 'overdue';
  paidDate?: string;
  dueDate: string;
}

interface BillingData {
  reseller: {
    businessName: string;
    businessEmail: string;
    paymentMethod: string;
  };
  billing: {
    totalPaid: number;
    totalDue: number;
    currentBalance: number;
    nextDueDate: string | null;
  };
  invoices: Invoice[];
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billingInfo, setBillingInfo] = useState<BillingData['billing'] | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const response = await fetch('/api/reseller/billing');
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices);
        setBillingInfo(data.billing);
        setPaymentMethod(data.reseller.paymentMethod || 'bank_transfer');
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
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
            Billing & <GradientText>Payments</GradientText>
          </h1>
          <p className="text-slate-400">Manage your invoices and payment methods</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-2 space-y-8"
          >
            {/* Current Balance */}
            <InteractiveCard glowColor="blue">
              <div className="p-8">
                <h3 className="text-lg font-bold text-white mb-2">Current Balance</h3>
                <p className="text-slate-400 text-sm mb-4">Your account balance and next billing cycle</p>
                {billingInfo ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <p className="text-slate-400 text-sm mb-1">Account Balance</p>
                      <p className="text-2xl font-black text-green-400">₦{billingInfo.currentBalance.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <p className="text-slate-400 text-sm mb-1">Next Payment Due</p>
                      <p className="text-lg font-bold text-white">
                        {billingInfo.nextDueDate ? new Date(billingInfo.nextDueDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-400">Loading...</div>
                )}
              </div>
            </InteractiveCard>

            {/* Invoices */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Invoices</h2>
              <div className="space-y-4">
                {invoices.map((invoice, i) => (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                  >
                    <InteractiveCard glowColor={invoice.status === 'paid' ? 'green' : 'blue'}>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                              {invoice.id}
                              {invoice.status === 'paid' && <FiCheckCircle className="w-5 h-5 text-green-400" />}
                            </h3>
                            <p className="text-sm text-slate-400">{invoice.billingMonth}</p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              invoice.status === 'paid'
                                ? 'bg-green-500/20 text-green-300 border border-green-500/50'
                                : invoice.status === 'overdue'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                                : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
                            }`}
                          >
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6 py-4 border-y border-slate-700">
                          {invoice.setupFee > 0 && (
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Setup Fee</p>
                              <p className="font-bold text-white">₦{invoice.setupFee.toLocaleString()}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Maintenance</p>
                            <p className="font-bold text-white">₦{invoice.maintenanceFee.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Commission</p>
                            <p className="font-bold text-white">₦{invoice.orderCommission.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-400 mb-1">Total Amount</p>
                            <p className="text-2xl font-black text-blue-400">₦{invoice.totalAmount.toLocaleString()}</p>
                            {invoice.paidDate && (
                              <p className="text-xs text-green-400 mt-2">Paid on {invoice.paidDate}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedInvoice(invoice)}
                              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-white"
                              title="Download Invoice"
                            >
                              <FiDownload className="w-5 h-5" />
                            </button>
                            {invoice.status !== 'paid' && (
                              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-white font-semibold text-sm">
                                Pay Now
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </InteractiveCard>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Payment Method */}
            <InteractiveCard glowColor="purple">
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <FiCreditCard className="w-5 h-5" />
                  Payment Method
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition">
                    <input
                      type="radio"
                      name="payment"
                      value="bank_transfer"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="ml-3 text-white font-semibold">Bank Transfer</span>
                  </label>
                  <label className="flex items-center p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition">
                    <input
                      type="radio"
                      name="payment"
                      value="wallet"
                      checked={paymentMethod === 'wallet'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="ml-3 text-white font-semibold">Sabi Wallet</span>
                  </label>
                </div>
              </div>
            </InteractiveCard>

            {/* Billing Schedule */}
            <InteractiveCard glowColor="green">
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <FiCalendar className="w-5 h-5" />
                  Billing Schedule
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Billing Cycle</span>
                    <span className="font-bold text-white">Monthly</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Billing Date</span>
                    <span className="font-bold text-white">1st of Month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Due Date</span>
                    <span className="font-bold text-white">15th of Month</span>
                  </div>
                  <div className="pt-3 border-t border-slate-700">
                    <p className="text-xs text-slate-400">
                      Your invoice is automatically generated and sent to your email on the 1st of each month.
                    </p>
                  </div>
                </div>
              </div>
            </InteractiveCard>

            {/* Tax Information */}
            <InteractiveCard glowColor="blue">
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Tax Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Business Name</label>
                    <p className="text-white font-semibold">Your Business Name</p>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Business Email</label>
                    <p className="text-white font-semibold">contact@business.com</p>
                  </div>
                  <button className="w-full mt-4 px-4 py-2 border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 rounded-lg transition font-semibold text-sm">
                    Update Information
                  </button>
                </div>
              </div>
            </InteractiveCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

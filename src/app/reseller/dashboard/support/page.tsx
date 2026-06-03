'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiTarget, FiArrowLeft, FiSend, FiBook, FiMail, FiHelpCircle, FiPhone } from 'react-icons/fi';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GradientText } from '@/components/AnimatedText';
import { InteractiveCard } from '@/components/InteractiveCard';
import { CuteIconAnimation } from '@/components/CuteIconAnimation';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  replies: number;
}

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<'tickets' | 'faq' | 'contact'>('tickets');
  const [tickets] = useState<Ticket[]>([
    {
      id: '#SUP001',
      subject: 'Site customization request',
      description: 'Need help changing the color scheme on my reseller site',
      status: 'in_progress',
      createdAt: '2026-06-01',
      replies: 3,
    },
    {
      id: '#SUP002',
      subject: 'Question about API rate limits',
      description: 'What are the rate limits for the API?',
      status: 'resolved',
      createdAt: '2026-05-28',
      replies: 2,
    },
  ]);

  const [newTicket, setNewTicket] = useState({ subject: '', description: '', priority: 'medium' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitTicket = () => {
    setSubmitted(true);
    setTimeout(() => {
      setNewTicket({ subject: '', description: '', priority: 'medium' });
      setSubmitted(false);
    }, 2000);
  };

  const faqs = [
    {
      q: 'How do I customize my reseller site?',
      a: 'Go to Dashboard → Customize Site. You can change colors, logo, content, and pages without any coding required.',
    },
    {
      q: 'What are your API rate limits?',
      a: '1000 requests per day per API key. Contact support if you need higher limits.',
    },
    {
      q: 'How do I get paid?',
      a: 'Monthly invoicing. Your invoice is generated on the 1st of each month. You pay our maintenance fee and keep all revenue from orders.',
    },
    {
      q: 'Can I cancel my account?',
      a: 'Yes, you can cancel anytime. Just pay through your current billing period. No long-term contracts required.',
    },
    {
      q: 'How long does it take for orders to complete?',
      a: 'Most orders complete within 2-7 days depending on the service type. You can track progress in your Analytics dashboard.',
    },
    {
      q: 'Do you provide support for my customers?',
      a: 'Yes! Our support team is available 24/7. Customers can reach out through your site and we assist them directly.',
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
            Help & <GradientText>Support</GradientText>
          </h1>
          <p className="text-slate-400">We're here to help you succeed. Get answers, create tickets, or reach out directly.</p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex gap-4 mb-8 border-b border-slate-800"
        >
          {['tickets', 'faq', 'contact'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-3 font-semibold capitalize transition ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'tickets' && '📋 My Tickets'}
              {tab === 'faq' && '❓ FAQ'}
              {tab === 'contact' && '📞 Contact Us'}
            </button>
          ))}
        </motion.div>

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Create New Ticket */}
            <InteractiveCard glowColor="blue">
              <div className="p-8">
                <h3 className="text-xl font-bold text-white mb-6">Create New Support Ticket</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      placeholder="Briefly describe your issue"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={newTicket.description}
                      onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none h-32"
                      placeholder="Tell us more about the issue..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Priority
                    </label>
                    <select
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="low">Low - General question</option>
                      <option value="medium">Medium - Some impact</option>
                      <option value="high">High - Urgent issue</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSubmitTicket}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/20 transition flex items-center justify-center gap-2"
                  >
                    {submitted ? '✓ Submitted' : (
                      <>
                        <FiSend className="w-4 h-4" />
                        Submit Ticket
                      </>
                    )}
                  </button>
                </div>
              </div>
            </InteractiveCard>

            {/* Existing Tickets */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Your Support Tickets</h3>
              <div className="space-y-4">
                {tickets.map((ticket, i) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                  >
                    <InteractiveCard glowColor={ticket.status === 'resolved' ? 'green' : 'blue'}>
                      <div className="p-6 cursor-pointer hover:opacity-80 transition">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="text-lg font-bold text-white">{ticket.subject}</h4>
                            <p className="text-sm text-slate-400">{ticket.id}</p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              ticket.status === 'resolved'
                                ? 'bg-green-500/20 text-green-300'
                                : ticket.status === 'in_progress'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-yellow-500/20 text-yellow-300'
                            }`}
                          >
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm mb-3">{ticket.description}</p>
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Created {ticket.createdAt}</span>
                          <span>{ticket.replies} replies</span>
                        </div>
                      </div>
                    </InteractiveCard>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <InteractiveCard glowColor="blue">
                  <div className="p-6">
                    <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                      <FiHelpCircle className="w-5 h-5 text-blue-400" />
                      {faq.q}
                    </h4>
                    <p className="text-slate-400 text-sm">{faq.a}</p>
                  </div>
                </InteractiveCard>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-3 gap-6"
          >
            {/* Email Support */}
            <InteractiveCard glowColor="blue">
              <div className="p-8 text-center">
                <FiMail className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Email Support</h3>
                <p className="text-slate-400 text-sm mb-4">
                  For general inquiries and non-urgent issues
                </p>
                <a
                  href="mailto:support@sabi.ng"
                  className="block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-white font-semibold text-sm"
                >
                  support@sabi.ng
                </a>
              </div>
            </InteractiveCard>

            {/* Chat Support */}
            <InteractiveCard glowColor="purple">
              <div className="p-8 text-center">
                <FiHelpCircle className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Live Chat</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Real-time support (coming soon)
                </p>
                <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition text-white font-semibold text-sm disabled:opacity-50">
                  Start Chat
                </button>
              </div>
            </InteractiveCard>

            {/* Phone Support */}
            <InteractiveCard glowColor="green">
              <div className="p-8 text-center">
                <FiPhone className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Call Support</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Monday - Friday, 9AM - 5PM WAT
                </p>
                <a
                  href="tel:+2348123456789"
                  className="block px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition text-white font-semibold text-sm"
                >
                  +234 812 345 6789
                </a>
              </div>
            </InteractiveCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}

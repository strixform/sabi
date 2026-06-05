'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FiArrowRight, FiArrowLeft, FiCheck, FiShoppingCart, FiLoader,
  FiAlertCircle, FiDollarSign, FiTrendingUp, FiStar
} from 'react-icons/fi';
import {
  SiInstagram, SiX, SiYoutube, SiTiktok, SiSnapchat, SiSpotify,
  SiWhatsapp, SiPinterest, SiThreads, SiTelegram, SiTwitch
} from 'react-icons/si';
import { GradientText } from '@/components/AnimatedText';
import { InteractiveCard } from '@/components/InteractiveCard';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { AnimateInText } from '@/components/AnimateInText';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';
import type { Service } from '@/lib/servicesCatalog';
import { PLATFORMS, computePricing, getServiceById } from '@/lib/servicesCatalog';

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: SiInstagram,
  twitter: SiX,
  youtube: SiYoutube,
  tiktok: SiTiktok,
  snapchat: SiSnapchat,
  spotify: SiSpotify,
  whatsapp: SiWhatsapp,
  pinterest: SiPinterest,
  threads: SiThreads,
  telegram: SiTelegram,
  twitch: SiTwitch,
};

// Intelligent URL detection patterns for each platform
type URLType = 'profile' | 'post' | 'video' | 'channel' | 'tweet' | 'thread' | 'pin' | 'channel_post' | 'other';

interface URLValidation {
  isValid: boolean;
  type: URLType;
  message?: string;
}

interface PlatformPatterns {
  patterns: Partial<Record<URLType, RegExp>>;
  defaultType?: URLType;
}

const URL_PATTERNS: Record<string, PlatformPatterns> = {
  instagram: {
    patterns: {
      profile: /instagram\.com\/([a-zA-Z0-9._-]+)\/?$|instagra\.am\/([a-zA-Z0-9._-]+)\/?$/i,
      post: /instagram\.com\/p\/|instagram\.com\/reel\/|instagram\.com\/tv\//i,
      video: /instagram\.com\/reel\//i,
      other: /instagram\.com|instagra\.am/i,
    },
  },
  twitter: {
    patterns: {
      profile: /twitter\.com\/([a-zA-Z0-9_]+)\/?$|x\.com\/([a-zA-Z0-9_]+)\/?$/i,
      tweet: /twitter\.com\/([a-zA-Z0-9_]+)\/status\/|x\.com\/([a-zA-Z0-9_]+)\/status\//i,
      other: /twitter\.com|x\.com/i,
    },
  },
  youtube: {
    patterns: {
      channel: /youtube\.com\/@|youtube\.com\/c\/|youtube\.com\/channel\//i,
      video: /youtube\.com\/watch\?v=|youtu\.be\//i,
      other: /youtube\.com|youtu\.be/i,
    },
  },
  tiktok: {
    patterns: {
      profile: /tiktok\.com\/@([a-zA-Z0-9._-]+)\/?$|vm\.tiktok\.com\/([a-zA-Z0-9]+)\/?$/i,
      video: /tiktok\.com\/@([a-zA-Z0-9._-]+)\/video\/|vm\.tiktok\.com\/|vt\.tiktok\.com\//i,
      other: /tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com/i,
    },
  },
  snapchat: {
    patterns: {
      profile: /snapchat\.com\/add\/|snapchat\.com\/user\//i,
      post: /snapchat\.com\/snap\//i,
      other: /snapchat\.com|snap\.com/i,
    },
  },
  spotify: {
    patterns: {
      channel: /spotify\.com\/artist\/|open\.spotify\.com\/artist\//i,
      post: /spotify\.com\/track\/|open\.spotify\.com\/track\//i,
      other: /spotify\.com|open\.spotify\.com/i,
    },
  },
  whatsapp: {
    patterns: {
      profile: /wa\.me\/|whatsapp\.com\/([a-zA-Z0-9]+)/i,
      other: /whatsapp\.com|wa\.me/i,
    },
  },
  pinterest: {
    patterns: {
      profile: /pinterest\.com\/([a-zA-Z0-9._-]+)\/?$|pin\.it\/([a-zA-Z0-9]+)\/?$/i,
      pin: /pinterest\.com\/pin\/|pin\.it\//i,
      other: /pinterest\.com|pin\.it/i,
    },
  },
  threads: {
    patterns: {
      profile: /threads\.net\/@([a-zA-Z0-9._-]+)\/?$/i,
      thread: /threads\.net\/@([a-zA-Z0-9._-]+)\/post\//i,
      other: /threads\.net/i,
    },
  },
  telegram: {
    patterns: {
      channel: /t\.me\/([a-zA-Z0-9_]+)|telegram\.org\/([a-zA-Z0-9_]+)/i,
      channel_post: /t\.me\/([a-zA-Z0-9_]+)\/(\d+)|telegram\.org\/([a-zA-Z0-9_]+)\/(\d+)/i,
      other: /t\.me|telegram\.org/i,
    },
  },
  twitch: {
    patterns: {
      channel: /twitch\.tv\/([a-zA-Z0-9_]+)\/?$/i,
      video: /twitch\.tv\/(?:videos|clips)\/|twitch\.tv\/([a-zA-Z0-9_]+)\/(?:clip|video|vod)/i,
      post: /twitch\.tv\/([a-zA-Z0-9_]+)\/(?:clip|video|vod)/i,
      other: /twitch\.tv/i,
    },
  },
};

// Service type requirements
const SERVICE_URL_REQUIREMENTS: Record<string, URLType[]> = {
  'Followers': ['profile', 'channel'],
  'Subscribers': ['channel', 'profile'],
  'Likes': ['post', 'video', 'tweet', 'pin', 'channel_post'],
  'Views': ['post', 'video', 'channel_post'],
  'Comments': ['post', 'video', 'tweet', 'channel_post'],
  'Comment Likes': ['post', 'video', 'tweet', 'channel_post'],
  'Saves': ['post', 'video', 'pin'],
  'Bookmarks': ['post', 'video'],
  'Story Views': ['post'],
  'Reel Views': ['post', 'video'],
  'Shares': ['post', 'video', 'tweet'],
  'Retweets': ['tweet'],
  'Replies': ['tweet'],
  'Quote Tweets': ['tweet'],
  'Post Views': ['channel_post'],
  'Reactions': ['post', 'channel_post'],
  'Message Views': ['channel_post'],
  'Message Reactions': ['channel_post'],
  'Repins': ['pin'],
  'Channel Followers': ['channel', 'profile'],
  'Subscriptions': ['channel'],
  'Channel Points': ['channel'],
  'Chat Comments': ['channel'],
  'Plays': ['post', 'channel'],
};

// Example target URLs per platform, by link kind, so each platform shows the
// right sample (TikTok shows a TikTok link, not Instagram).
const URL_EXAMPLES: Record<string, { profile: string; post: string; video?: string }> = {
  instagram: { profile: 'https://instagram.com/yourusername', post: 'https://instagram.com/p/Cxyz123', video: 'https://instagram.com/reel/Cxyz123' },
  tiktok: { profile: 'https://tiktok.com/@yourusername', post: 'https://tiktok.com/@yourusername/video/7123456789', video: 'https://tiktok.com/@yourusername/video/7123456789' },
  twitter: { profile: 'https://x.com/yourusername', post: 'https://x.com/yourusername/status/1761234567890' },
  youtube: { profile: 'https://youtube.com/@yourchannel', post: 'https://youtube.com/watch?v=dQw4w9WgXcQ', video: 'https://youtube.com/watch?v=dQw4w9WgXcQ' },
  snapchat: { profile: 'https://snapchat.com/add/yourusername', post: 'https://snapchat.com/add/yourusername' },
  spotify: { profile: 'https://open.spotify.com/artist/yourID', post: 'https://open.spotify.com/track/yourID' },
  whatsapp: { profile: 'https://wa.me/2348012345678', post: 'https://wa.me/2348012345678' },
  pinterest: { profile: 'https://pinterest.com/yourusername', post: 'https://pinterest.com/pin/123456789' },
  threads: { profile: 'https://threads.net/@yourusername', post: 'https://threads.net/@yourusername/post/Cxyz123' },
  telegram: { profile: 'https://t.me/yourchannel', post: 'https://t.me/yourchannel/123' },
  twitch: { profile: 'https://twitch.tv/yourchannel', post: 'https://twitch.tv/yourchannel' },
};

function getUrlExample(platform: string, action?: string): string {
  const ex = URL_EXAMPLES[platform];
  if (!ex) return 'https://...';
  if (!action) return ex.profile;
  const req = SERVICE_URL_REQUIREMENTS[action] || [];
  if (req.includes('profile') || req.includes('channel')) return ex.profile;
  if (req.includes('video') && ex.video) return ex.video;
  return ex.post;
}

function detectURLType(url: string, platform: string): URLValidation {
  const platformPatterns = URL_PATTERNS[platform];
  if (!platformPatterns) {
    return { isValid: false, type: 'other', message: `Unknown platform: ${platform}` };
  }

  // Normalize: drop query string (?igsh=…, ?si=…), hash, and trailing slashes
  // so links copied straight from a profile/app still match cleanly.
  const cleanUrl = url.trim().split('?')[0].split('#')[0].replace(/\/+$/, '');

  // Check each type
  const patterns = platformPatterns.patterns;
  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern && pattern.test(cleanUrl)) {
      return { isValid: true, type: type as URLType };
    }
  }

  return { isValid: false, type: 'other', message: 'URL format not recognized' };
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'from-pink-500 to-purple-600',
  twitter: 'from-blue-400 to-blue-600',
  youtube: 'from-red-500 to-red-700',
  tiktok: 'from-gray-900 to-black',
  snapchat: 'from-yellow-300 to-yellow-500',
  spotify: 'from-green-500 to-green-700',
  whatsapp: 'from-green-500 to-green-600',
  pinterest: 'from-red-600 to-red-700',
  threads: 'from-gray-800 to-gray-900',
  telegram: 'from-blue-400 to-blue-500',
  twitch: 'from-purple-600 to-purple-800',
};

// Nigerian states (audience targeting — Nigerian audience only for now)
const NIGERIAN_STATES = [
  'All Nigeria', 'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

const COMMENT_ACTIONS = ['Comments', 'Replies', 'Chat Comments'];
const COMMENT_MAX = 300;

type Step = 'platform' | 'service' | 'details' | 'review';

export default function OrderPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('platform');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [targetUrl, setTargetUrl] = useState('');
  const [quantity, setQuantity] = useState(100);
  // Audience targeting + comment customization
  const [audienceGender, setAudienceGender] = useState<'both' | 'male' | 'female'>('both');
  const [audienceLocation, setAudienceLocation] = useState('All Nigeria');
  const [commentGender, setCommentGender] = useState<'both' | 'male' | 'female'>('both');
  const [commentInstructions, setCommentInstructions] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [wallet, setWallet] = useState({ balance: 0 });
  const [session, setSession] = useState<any>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Fetch session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/sabi/auth/me');
        const data = await res.json();
        if (data.success) {
          setSession(data.user);
          // Fetch wallet
          const walletRes = await fetch('/api/sabi/wallet');
          const walletData = await walletRes.json();
          if (walletData.success) {
            setWallet({ balance: walletData.balance });
          }
          // Load favorite services
          try {
            const favRes = await fetch('/api/sabi/favorites');
            const favData = await favRes.json();
            if (favData.success) setFavorites(favData.serviceIds || []);
          } catch {}
        } else {
          router.push('/sabi/login');
        }
      } catch (err) {
        router.push('/sabi/login');
      }
    };
    checkSession();
  }, [router]);

  // Fetch services when platform selected
  useEffect(() => {
    if (selectedPlatform) {
      fetchServices();
    }
  }, [selectedPlatform]);

  // Re-order prefill: /sabi/order?reorder=1&serviceId=&quantity=&url=
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('reorder') !== '1') return;
    const svc = getServiceById(sp.get('serviceId') || '');
    if (!svc) return;
    setSelectedPlatform(svc.category);
    setSelectedService(svc);
    const q = parseInt(sp.get('quantity') || '') || svc.minQuantity;
    setQuantity(Math.max(svc.minQuantity, Math.min(svc.maxQuantity, q)));
    const url = sp.get('url');
    if (url) setTargetUrl(url);
    setCurrentStep('details');
  }, []);

  const toggleFavorite = async (serviceId: string) => {
    const isFav = favorites.includes(serviceId);
    // Optimistic update
    setFavorites((prev) => (isFav ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]));
    try {
      await fetch('/api/sabi/favorites', {
        method: isFav ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId }),
      });
    } catch {
      // Revert on failure
      setFavorites((prev) => (isFav ? [...prev, serviceId] : prev.filter((id) => id !== serviceId)));
    }
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/sabi/services?category=${selectedPlatform}`);
      const data = await res.json();
      if (data.success) {
        setServices(data.services);
      }
    } catch (err) {
      setError('Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  const pricing = selectedService ? computePricing(selectedService.pricePerUnit, quantity) : null;
  const totalCost = pricing ? pricing.totalKobo / 100 : 0; // naira, fees included
  const platformLabel = selectedPlatform
    ? Object.entries(PLATFORMS).find(([, value]) => value === selectedPlatform)?.[0] || selectedPlatform
    : '';

  const handleNextStep = () => {
    if (currentStep === 'platform' && selectedPlatform) {
      setCurrentStep('service');
    } else if (currentStep === 'service' && selectedService) {
      setCurrentStep('details');
    } else if (currentStep === 'details' && targetUrl && quantity) {
      setCurrentStep('review');
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'service') setCurrentStep('platform');
    else if (currentStep === 'details') setCurrentStep('service');
    else if (currentStep === 'review') setCurrentStep('details');
  };

  const validateTargetUrl = (): string | null => {
    if (!targetUrl || !selectedPlatform || !selectedService) return null;

    // Check if URL is valid format
    try {
      new URL(targetUrl);
    } catch {
      return 'Invalid URL format';
    }

    // Detect URL type using intelligent pattern matching
    const detection = detectURLType(targetUrl, selectedPlatform);

    if (!detection.isValid) {
      const platformLabel = selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1);
      return `URL must be a valid ${platformLabel} link`;
    }

    // Check if URL type matches service requirements
    const requiredTypes = SERVICE_URL_REQUIREMENTS[selectedService.action];
    if (requiredTypes && !requiredTypes.includes(detection.type)) {
      const typeNames = requiredTypes.join(', ').replace(/_/g, ' ');
      const detectedTypeName = detection.type.replace(/_/g, ' ');
      return `This service requires a ${typeNames} link, not a ${detectedTypeName} link`;
    }

    return null;
  };

  const handlePlaceOrder = async () => {
    if (!selectedService || !targetUrl || !quantity) {
      setError('Please fill in all details');
      return;
    }

    const urlError = validateTargetUrl();
    if (urlError) {
      setError(urlError);
      return;
    }

    if (wallet.balance < totalCost * 100) {
      setError('Insufficient wallet balance. Please fund your wallet first.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/sabi/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          targetUrl,
          quantity,
          paymentMethod: 'wallet',
          audienceGender,
          audienceLocation,
          ...(COMMENT_ACTIONS.includes(selectedService.action)
            ? { commentGender, commentInstructions: commentInstructions.trim() || null }
            : {}),
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/sabi/orders/${data.order.id}`);
      } else {
        setError(data.error || 'Failed to place order');
      }
    } catch (err) {
      setError('An error occurred while placing the order');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900">
        <div className="text-center text-slate-400">
          <FiLoader className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <AnimatedBackground />
      <ModernSabiHeader showNavigation={true} />

      {/* Order Header with Wallet & Progress */}
      <div className="relative z-20 border-b border-slate-700/50 bg-slate-900/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-black">New Order</h2>
            <div className="text-right text-sm sm:text-base">
              <p className="text-xs sm:text-sm text-slate-400">Wallet Balance</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-400">
                ₦{(wallet.balance / 100).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Progress indicators */}
          <div className="flex items-center justify-between gap-2">
            {(['platform', 'service', 'details', 'review'] as const).map((step, idx) => (
              <motion.div
                key={step}
                className="flex-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div
                  className={`h-1 rounded-full transition-all ${
                    step === currentStep
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 h-2'
                      : ['platform', 'service', 'details', 'review'].indexOf(step) <
                        ['platform', 'service', 'details', 'review'].indexOf(currentStep)
                      ? 'bg-emerald-500/50'
                      : 'bg-slate-700/50'
                  }`}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <AnimatePresence mode="wait">
          {/* Step 1: Platform Selection */}
          {currentStep === 'platform' && (
            <motion.div
              key="platform"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-4xl font-black mb-2">
                  <GradientText>Choose Your Platform</GradientText>
                </h2>
                <p className="text-slate-400 text-sm sm:text-lg">
                  <AnimateInText type="fade" delay={0.1}>
                    Select where you want to grow your presence
                  </AnimateInText>
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {Object.entries(PLATFORMS).map(([label, value]) => {
                  const Icon = PLATFORM_ICONS[value];
                  return (
                    <motion.button
                      key={value}
                      onClick={() => setSelectedPlatform(value)}
                      className={`p-3 sm:p-6 rounded-lg sm:rounded-xl border-2 transition-all ${
                        selectedPlatform === value
                          ? `border-blue-500 bg-blue-500/10`
                          : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {Icon && <Icon className="text-2xl sm:text-4xl mb-1 sm:mb-2" />}
                      <p className="font-bold text-white text-xs sm:text-sm">{label}</p>
                      {selectedPlatform === value && (
                        <motion.div
                          className="mt-2 flex items-center justify-center text-blue-400"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <FiCheck className="w-5 h-5" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 2: Service Selection */}
          {currentStep === 'service' && selectedPlatform && (
            <motion.div
              key="service"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h2 className="text-4xl font-black mb-2">
                  Choose Your <GradientText>Service</GradientText>
                </h2>
                <p className="text-slate-400 text-lg flex items-center gap-2">
                  {PLATFORM_ICONS[selectedPlatform] && React.createElement(PLATFORM_ICONS[selectedPlatform], { className: 'w-6 h-6' })}
                  {platformLabel} Services
                </p>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <FiLoader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
                  <p className="text-slate-400">Loading services...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...services].sort((a, b) => Number(favorites.includes(b.id)) - Number(favorites.includes(a.id))).map((service) => (
                    <motion.button
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className={`w-full text-left p-6 rounded-xl border-2 transition-all ${
                        selectedService?.id === service.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2">{service.name}</h3>
                          <p className="text-slate-400 text-sm line-clamp-2">{service.description}</p>
                        </div>
                        <div className="text-right ml-4 flex flex-col items-end gap-1">
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(service.id); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); toggleFavorite(service.id); } }}
                            className="cursor-pointer p-1 -mt-1 -mr-1"
                            aria-label={favorites.includes(service.id) ? 'Remove favorite' : 'Save favorite'}
                          >
                            <FiStar className={`w-5 h-5 transition ${favorites.includes(service.id) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-500 hover:text-slate-300'}`} />
                          </span>
                          <p className="text-lg font-bold text-emerald-400">
                            ₦{(service.pricePerUnit / 100).toFixed(2)}/{service.action}
                          </p>
                          <p className="text-xs text-slate-400">per unit</p>
                        </div>
                      </div>
                      {selectedService?.id === service.id && (
                        <motion.div
                          className="mt-4 flex items-center gap-2 text-blue-400 text-sm"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <FiCheck className="w-4 h-4" />
                          Selected
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 3: Details Input */}
          {currentStep === 'details' && selectedService && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h2 className="text-4xl font-black mb-2">
                  <GradientText>Enter Details</GradientText>
                </h2>
                <p className="text-slate-400 text-lg">Complete your {selectedService.name} order</p>
              </div>

              <InteractiveCard glowColor="blue">
                <div className="p-8 space-y-6">
                  {/* Target URL */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Target URL
                    </label>
                    <motion.input
                      type="url"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder={getUrlExample(selectedPlatform, selectedService.action)}
                      required
                      className={`w-full px-4 py-3 bg-slate-800/50 border rounded-lg focus:outline-none text-white focus:ring-2 transition ${
                        targetUrl && validateTargetUrl()
                          ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                          : targetUrl && !validateTargetUrl()
                          ? 'border-emerald-500/50 focus:border-emerald-500/50 focus:ring-emerald-500/20'
                          : 'border-slate-700/50 focus:border-blue-500/50 focus:ring-blue-500/20'
                      }`}
                      whileFocus={{ scale: 1.02 }}
                    />
                    {targetUrl && validateTargetUrl() && (
                      <motion.p className="text-xs text-red-400 mt-2 flex items-center gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <FiAlertCircle className="w-4 h-4" />
                        {validateTargetUrl()}
                      </motion.p>
                    )}
                    {targetUrl && !validateTargetUrl() && (
                      <motion.p className="text-xs text-emerald-400 mt-2 flex items-center gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <FiCheck className="w-4 h-4" />
                        URL is valid for {platformLabel}
                      </motion.p>
                    )}
                    {!targetUrl && (
                      <p className="text-xs text-slate-400 mt-1">
                        Example for {platformLabel} {selectedService.action}:{' '}
                        <span className="text-slate-300 font-mono break-all">
                          {getUrlExample(selectedPlatform, selectedService.action)}
                        </span>
                      </p>
                    )}
                  </motion.div>

                  {/* Quantity */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Quantity ({selectedService.action})
                    </label>
                    <div className="flex items-center gap-4">
                      <motion.button
                        onClick={() => setQuantity(Math.max(selectedService.minQuantity, quantity - 10))}
                        className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600 rounded-lg transition"
                        whileTap={{ scale: 0.9 }}
                      >
                        −
                      </motion.button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(
                            Math.max(selectedService.minQuantity, Math.min(selectedService.maxQuantity, parseInt(e.target.value) || 0))
                          )
                        }
                        className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-center focus:border-blue-500/50 outline-none"
                      />
                      <motion.button
                        onClick={() => setQuantity(Math.min(selectedService.maxQuantity, quantity + 10))}
                        className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600 rounded-lg transition"
                        whileTap={{ scale: 0.9 }}
                      >
                        +
                      </motion.button>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      Min: {selectedService.minQuantity.toLocaleString()} • Max: {selectedService.maxQuantity.toLocaleString()}
                    </p>
                  </motion.div>

                  {/* Audience targeting */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Audience Gender
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['both', 'male', 'female'] as const).map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setAudienceGender(g)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition ${
                              audienceGender === g
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Audience Location
                      </label>
                      <select
                        value={audienceLocation}
                        onChange={(e) => setAudienceLocation(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:border-blue-500/50 outline-none"
                      >
                        {NIGERIAN_STATES.map((s) => (
                          <option key={s} value={s} className="bg-slate-900">{s}</option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-400 mt-1">🇳🇬 We currently deliver Nigerian audience only.</p>
                    </div>
                  </motion.div>

                  {/* Comment customization (comment-type services only) */}
                  {COMMENT_ACTIONS.includes(selectedService.action) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-4 p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg"
                    >
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Commenter Gender
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['both', 'male', 'female'] as const).map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setCommentGender(g)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition ${
                                commentGender === g
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                  : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600'
                              }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          What should the comments say?
                        </label>
                        <textarea
                          value={commentInstructions}
                          onChange={(e) => setCommentInstructions(e.target.value.slice(0, COMMENT_MAX))}
                          rows={3}
                          placeholder="e.g. Positive comments about our new product launch, mention the discount, keep it casual and friendly."
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 text-sm focus:border-purple-500/50 outline-none resize-none"
                        />
                        <p className="text-xs text-slate-400 mt-1 text-right">
                          {commentInstructions.length}/{COMMENT_MAX}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Service Description Preview */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg"
                  >
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-mono text-xs">
                      {selectedService.description.split('\n').slice(0, 3).join('\n')}...
                    </p>
                    <motion.button
                      onClick={() => setCurrentStep('review')}
                      className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-semibold"
                      whileHover={{ x: 4 }}
                    >
                      View Full Description →
                    </motion.button>
                  </motion.div>
                </div>
              </InteractiveCard>
            </motion.div>
          )}

          {/* Step 4: Review */}
          {currentStep === 'review' && selectedService && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h2 className="text-4xl font-black mb-2">
                  <GradientText>Review Order</GradientText>
                </h2>
                <p className="text-slate-400 text-lg">Check everything before completing</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Order Details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Service Summary */}
                  <InteractiveCard glowColor="blue">
                    <div className="p-8">
                      <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        {PLATFORM_ICONS[selectedService.category] && (
                          <motion.div className="text-3xl" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            {React.createElement(PLATFORM_ICONS[selectedService.category], { className: 'text-3xl' })}
                          </motion.div>
                        )}
                        {selectedService.name}
                      </h3>

                      <div className="space-y-4 mb-6 text-sm">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
                          <span className="text-slate-400">Platform</span>
                          <span className="font-bold">{platformLabel}</span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
                          <span className="text-slate-400">Service Type</span>
                          <span className="font-bold">{selectedService.action}</span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
                          <span className="text-slate-400">Quantity</span>
                          <span className="font-bold text-lg">{quantity.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
                          <span className="text-slate-400">Target URL</span>
                          <span className="font-mono text-xs text-blue-400 truncate">{targetUrl}</span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
                          <span className="text-slate-400">Speed</span>
                          <span className="font-bold capitalize">{selectedService.speed}</span>
                        </div>
                      </div>

                      {/* Service Description */}
                      <div className="mt-6 p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg max-h-96 overflow-y-auto">
                        <h4 className="font-bold mb-3 text-white">Service Description</h4>
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-mono text-xs">
                          {selectedService.description}
                        </p>
                      </div>
                    </div>
                  </InteractiveCard>
                </div>

                {/* Pricing Summary */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <InteractiveCard glowColor="emerald">
                    <div className="p-8">
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <FiDollarSign className="w-5 h-5" />
                        Order Summary
                      </h3>

                      <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
                          <span className="text-slate-400">Price per unit</span>
                          <span className="font-bold">₦{(selectedService.pricePerUnit / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
                          <span className="text-slate-400">Quantity</span>
                          <span className="font-bold">{quantity.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
                          <span className="text-slate-400">Subtotal</span>
                          <span className="font-bold">₦{((pricing?.baseKobo ?? 0) / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
                          <span className="text-slate-400">Platform fee (7.5%)</span>
                          <span className="font-bold">₦{((pricing?.platformFeeKobo ?? 0) / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
                          <span className="text-slate-400">VAT (7.5%)</span>
                          <span className="font-bold">₦{((pricing?.vatKobo ?? 0) / 100).toFixed(2)}</span>
                        </div>
                      </div>

                      <motion.div
                        className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg mb-6"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <p className="text-sm text-emerald-400 font-bold mb-2">Total Cost</p>
                        <p className="text-3xl font-black text-emerald-400">₦{totalCost.toFixed(2)}</p>
                      </motion.div>

                      {wallet.balance < totalCost * 100 ? (
                        <motion.div
                          className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-6"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className="flex items-start gap-2">
                            <FiAlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm text-red-400 font-bold">Insufficient Balance</p>
                              <p className="text-xs text-red-400/70 mt-1">
                                You need ₦{(totalCost * 100 - wallet.balance).toFixed(0)} more
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg mb-6"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className="flex items-start gap-2">
                            <FiCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm text-emerald-400 font-bold">You have sufficient balance</p>
                              <p className="text-xs text-emerald-400/70 mt-1">
                                Remaining: ₦{((wallet.balance - totalCost * 100) / 100).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      <Link href="/sabi/wallet">
                        <motion.button
                          className="w-full px-4 py-2 bg-slate-700/50 hover:bg-slate-600 text-white font-semibold rounded-lg transition mb-3"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Fund Wallet
                        </motion.button>
                      </Link>

                      {wallet.balance >= totalCost * 100 && (
                        <motion.button
                          onClick={handlePlaceOrder}
                          disabled={loading}
                          className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {loading ? (
                            <>
                              <FiLoader className="w-5 h-5 animate-spin" />
                              Placing Order...
                            </>
                          ) : (
                            <>
                              <FiShoppingCart className="w-5 h-5" />
                              Place Order Now
                            </>
                          )}
                        </motion.button>
                      )}
                    </div>
                  </InteractiveCard>
                </motion.div>
              </div>

              {error && (
                <motion.div
                  className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <motion.div
          className="flex gap-4 mt-12 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {currentStep !== 'platform' && (
            <motion.button
              onClick={handlePreviousStep}
              className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600 text-white font-semibold rounded-lg transition flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiArrowLeft className="w-5 h-5" />
              Back
            </motion.button>
          )}

          {currentStep !== 'review' && (
            <motion.button
              onClick={handleNextStep}
              disabled={
                (currentStep === 'platform' && !selectedPlatform) ||
                (currentStep === 'service' && !selectedService) ||
                (currentStep === 'details' && (!targetUrl || !quantity))
              }
              className="ml-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Next
              <FiArrowRight className="w-5 h-5" />
            </motion.button>
          )}

          {currentStep === 'review' && (
            <motion.button
              onClick={() => setCurrentStep('details')}
              className="ml-auto px-6 py-3 bg-slate-700/50 hover:bg-slate-600 text-white font-semibold rounded-lg transition flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiArrowLeft className="w-5 h-5" />
              Edit Order
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
}

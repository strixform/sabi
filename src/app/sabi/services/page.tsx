'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiFilter, FiTrendingUp, FiClock, FiDollarSign } from 'react-icons/fi';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';
import { WanderingParticles } from '@/components/WanderingParticles';
import { GradientText } from '@/components/AnimatedText';
import { AnimateInText } from '@/components/AnimateInText';
import { SERVICES_CATALOG } from '@/lib/servicesCatalog';

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = Array.from(new Set(SERVICES_CATALOG.map(s => s.category)));
  const filteredServices = SERVICES_CATALOG.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getPriceDisplay = (service: any) => {
    const minPrice = service.pricePerUnit * service.minQuantity;
    const maxPrice = service.pricePerUnit * service.maxQuantity;
    return `₦${minPrice.toLocaleString()} - ₦${maxPrice.toLocaleString()}`;
  };

  const getSpeedColor = (speed: string) => {
    switch (speed) {
      case 'instant': return 'text-green-400';
      case 'fast': return 'text-blue-400';
      case 'medium': return 'text-yellow-400';
      default: return 'text-orange-400';
    }
  };

  return (
    <div className="min-h-screen relative">
      <WanderingParticles />
      <ModernSabiHeader showNavigation={true} />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-5 sm:mb-6 lg:mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            <GradientText>
              <AnimateInText type="slide" delay={0.1}>
                All Services
              </AnimateInText>
            </GradientText>
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Explore our complete catalog of 40+ services across 11+ social platforms
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-2xl mx-auto mb-5 sm:mb-6 lg:mb-8"
        >
          <div className="relative">
            <FiSearch className="absolute left-4 top-3.5 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
            />
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-wrap gap-2 justify-center mb-8 sm:mb-10 lg:mb-12"
        >
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full font-semibold transition ${
              selectedCategory === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {filteredServices.map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 border border-slate-700/50 rounded-lg p-6 hover:border-slate-600/50 hover:bg-slate-800/40 transition"
            >
              {/* Service Name */}
              <h3 className="text-xl font-bold text-white mb-2">
                {service.name}
              </h3>

              {/* Platform */}
              <p className="text-sm text-slate-400 mb-3 capitalize">
                {service.platform}
              </p>

              {/* Description */}
              <p className="text-slate-300 text-sm mb-4 line-clamp-2">
                {service.description}
              </p>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-slate-700/0 via-slate-700/50 to-slate-700/0 mb-4" />

              {/* Metrics */}
              <div className="space-y-3 mb-4">
                {/* Price */}
                <div className="flex items-center gap-3">
                  <FiDollarSign className="text-green-400 flex-shrink-0" size={18} />
                  <div>
                    <p className="text-xs text-slate-500">Price Range</p>
                    <p className="text-sm font-semibold text-green-400">
                      {getPriceDisplay(service)} per unit
                    </p>
                  </div>
                </div>

                {/* Quantity Range */}
                <div className="flex items-center gap-3">
                  <FiTrendingUp className="text-blue-400 flex-shrink-0" size={18} />
                  <div>
                    <p className="text-xs text-slate-500">Quantity</p>
                    <p className="text-sm font-semibold text-blue-400">
                      {service.minQuantity.toLocaleString()} - {service.maxQuantity.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Speed */}
                <div className="flex items-center gap-3">
                  <FiClock className={`${getSpeedColor(service.speed)} flex-shrink-0`} size={18} />
                  <div>
                    <p className="text-xs text-slate-500">Delivery Speed</p>
                    <p className={`text-sm font-semibold ${getSpeedColor(service.speed)}`}>
                      {service.speed.charAt(0).toUpperCase() + service.speed.slice(1)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-slate-700/0 via-slate-700/50 to-slate-700/0 mb-4" />

              {/* Engagement Rate */}
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1">Average Engagement</p>
                <p className="text-lg font-bold text-cyan-400">
                  {service.avgEngagement}% - {(service.avgEngagement * 1.5).toFixed(1)}%
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* No Results */}
        {filteredServices.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-slate-400 text-lg">No services found. Try adjusting your search.</p>
          </motion.div>
        )}

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-12 sm:mt-14 lg:mt-16 text-center"
        >
          <p className="text-slate-300 mb-6">
            Showing {filteredServices.length} of {SERVICES_CATALOG.length} services
          </p>
          <a
            href="/sabi/order"
            className="inline-block px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg hover:shadow-xl transition"
          >
            Start Your First Order
          </a>
        </motion.div>
      </section>
    </div>
  );
}

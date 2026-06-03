'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/sabi/orders?id=${orderId}`);
        const data = await response.json();
        if (data.success && data.orders) {
          setOrder(data.orders[0]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return <div className="text-center py-12">Loading order details...</div>;
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">Order not found</p>
        <Link href="/sabi/dashboard" className="text-blue-400 hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    executing: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    cancelled: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  const statusSteps = ['pending', 'processing', 'executing', 'completed'];
  const currentStepIndex = statusSteps.indexOf(order.status);

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/sabi/dashboard" className="text-blue-400 hover:underline mb-6 inline-block">
        ← Back to Dashboard
      </Link>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-black mb-2">Order #{order.id?.substring(0, 8)}</h1>
            <p className="text-slate-400">Created {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <div className={`px-6 py-2 rounded-full border font-bold ${statusColors[order.status] || statusColors.pending}`}>
            {order.status.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-8 mb-8">
        <div className="space-y-6">
          {statusSteps.map((status, index) => (
            <div key={status} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    index <= currentStepIndex
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {index <= currentStepIndex ? '✓' : index + 1}
                </div>
                {index < statusSteps.length - 1 && (
                  <div
                    className={`w-0.5 h-12 ${
                      index < currentStepIndex ? 'bg-blue-500' : 'bg-slate-700'
                    }`}
                  />
                )}
              </div>
              <div className="py-2">
                <div className="font-bold capitalize">{status}</div>
                <div className="text-sm text-slate-400">
                  {status === 'pending' && 'Waiting for confirmation'}
                  {status === 'processing' && 'Processing your order'}
                  {status === 'executing' && 'Active campaign running'}
                  {status === 'completed' && 'Order completed'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Details */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4">Order Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Service Type:</span>
              <span className="font-bold capitalize">{order.serviceType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Quantity:</span>
              <span className="font-bold">{order.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target URL:</span>
              <span className="font-bold text-xs truncate">{order.targetUrl}</span>
            </div>
            <div className="border-t border-slate-700 pt-3 mt-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Completed:</span>
                <span className="font-bold text-blue-400">{order.completionPercentage}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4">Pricing Breakdown</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Base Price:</span>
              <span className="font-bold">₦{order.totalPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Platform Fee (15%):</span>
              <span className="font-bold">₦{order.platformFee.toLocaleString()}</span>
            </div>
            <div className="border-t border-slate-700 pt-3 mt-3 flex justify-between text-base">
              <span className="font-bold">Total Amount:</span>
              <span className="font-bold text-blue-400">
                ₦{(order.totalPrice + order.platformFee).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Info */}
      {order.gamesz360CampaignId && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-bold mb-4">Campaign Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Campaign ID:</span>
              <span className="font-bold font-mono">{order.gamesz360CampaignId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="font-bold text-green-400">Active</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

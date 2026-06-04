import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals';

function sendVitals(metric: Metric) {
  // Send to analytics service (e.g., Google Analytics, Vercel Analytics)
  if (process.env.NODE_ENV === 'production') {
    const body = JSON.stringify(metric);
    // Using sendBeacon for reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/metrics', body);
    }
  }
}

export function reportWebVitals() {
  try {
    getCLS(sendVitals);
    getFID(sendVitals);
    getFCP(sendVitals);
    getLCP(sendVitals);
    getTTFB(sendVitals);
  } catch (error) {
    console.error('Web Vitals error:', error);
  }
}

import { SERVICES_CATALOG, computePricing, type Service } from './servicesCatalog';

export interface SabiService extends Service {
  estimatedDelivery?: string;
  taskType?: string;
  popularityScore?: number;
}

// Map new catalog to old interface for backward compatibility
export const SABI_SERVICES: Record<string, SabiService> = {};

// Initialize SABI_SERVICES from catalog on load
for (const service of SERVICES_CATALOG) {
  SABI_SERVICES[service.id] = {
    ...service,
    icon: service.name,
    estimatedDelivery: service.speed === 'instant' ? '< 1 hour' : service.speed === 'fast' ? '1-3 hours' : service.speed === 'medium' ? '1-24 hours' : '1-7 days',
    taskType: service.category,
    popularityScore: 95,
  };
}

export function getService(serviceId: string): SabiService | null {
  return SABI_SERVICES[serviceId] || null;
}

export function getAllServices(): SabiService[] {
  return Object.values(SABI_SERVICES);
}

export function calculatePrice(serviceId: string, quantity: number): number | null {
  const service = getService(serviceId);
  if (!service) return null;

  if (quantity < service.minQuantity || quantity > service.maxQuantity) {
    return null;
  }

  return computePricing(service.pricePerUnit, quantity).totalKobo;
}

export function validateOrder(
  serviceId: string,
  quantity: number,
  targetUrl: string
): { valid: boolean; error?: string } {
  const service = getService(serviceId);

  if (!service) {
    return { valid: false, error: 'Service not found' };
  }

  if (quantity < service.minQuantity) {
    return { valid: false, error: `Minimum quantity is ${service.minQuantity}` };
  }

  if (quantity > service.maxQuantity) {
    return { valid: false, error: `Maximum quantity is ${service.maxQuantity}` };
  }

  if (!targetUrl || targetUrl.trim().length === 0) {
    return { valid: false, error: 'Target URL is required' };
  }

  try {
    new URL(targetUrl);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  return { valid: true };
}

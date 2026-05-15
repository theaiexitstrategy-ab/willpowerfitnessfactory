import type { PlanTier } from './types';

export type PlanFeature = {
  tier: PlanTier;
  name: string;
  priceCents: number;
  stripePriceEnv: string | null;
  productLimit: number;
  storeLimit: number;
  platformFeeBps: number; // basis points, so 1500 = 15.00%
  removesWpffBranding: boolean;
  whiteLabel: boolean;
  customDomain: boolean;
  perOrderEmails: boolean;
  prioritySupport: boolean;
  features: string[];
};

export const PLANS: Record<PlanTier, PlanFeature> = {
  free: {
    tier: 'free',
    name: 'Free',
    priceCents: 0,
    stripePriceEnv: null,
    productLimit: 5,
    storeLimit: 1,
    platformFeeBps: 1500,
    removesWpffBranding: false,
    whiteLabel: false,
    customDomain: false,
    perOrderEmails: false,
    prioritySupport: false,
    features: [
      '1 store',
      'Up to 5 products',
      'WillPower FF branding on storefront',
      '15% platform fee per order',
    ],
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    priceCents: 2900,
    stripePriceEnv: 'STRIPE_PRICE_PRO',
    productLimit: Number.POSITIVE_INFINITY,
    storeLimit: 1,
    platformFeeBps: 800,
    removesWpffBranding: true,
    whiteLabel: false,
    customDomain: false,
    perOrderEmails: true,
    prioritySupport: false,
    features: [
      '1 store',
      'Unlimited products',
      'Custom brand colors + logo (no WPFF branding)',
      '8% platform fee per order',
      'Email notifications per order',
      'Analytics dashboard',
    ],
  },
  elite: {
    tier: 'elite',
    name: 'Elite',
    priceCents: 7900,
    stripePriceEnv: 'STRIPE_PRICE_ELITE',
    productLimit: Number.POSITIVE_INFINITY,
    storeLimit: 3,
    platformFeeBps: 400,
    removesWpffBranding: true,
    whiteLabel: true,
    customDomain: true,
    perOrderEmails: true,
    prioritySupport: true,
    features: [
      'Up to 3 stores',
      'Unlimited products',
      'Full white label (no WPFF branding anywhere)',
      '4% platform fee per order',
      'Priority support',
      'Custom domain support',
      'Early access to new product types',
    ],
  },
};

export function getPlan(tier: PlanTier): PlanFeature {
  return PLANS[tier] || PLANS.free;
}

export function platformFeeCents(subtotalCents: number, tier: PlanTier): number {
  return Math.round((subtotalCents * getPlan(tier).platformFeeBps) / 10000);
}

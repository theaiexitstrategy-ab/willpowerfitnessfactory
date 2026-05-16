/**
 * Single source of truth for the platform brand identity.
 *
 * Everything is env-driven so the same codebase can serve GoElev8.ai today,
 * be cloned for a partner platform tomorrow, and be re-skinned without code
 * changes. Defaults below assume GoElev8.ai.
 */

export const BRAND = {
  /** Human-facing brand name used in emails, footer, page titles. */
  name: process.env.NEXT_PUBLIC_BRAND_NAME || 'GoElev8 Merch',

  /** Shorter version for tight spaces and email subject lines. */
  shortName: process.env.NEXT_PUBLIC_BRAND_SHORT_NAME || 'GoElev8',

  /** Tagline shown on the marketing landing page hero. */
  tagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE || 'Launch your merch store. Print on demand. Built for fitness brands.',

  /** Public URL of the brand logo (white-on-dark). */
  logoUrl: process.env.NEXT_PUBLIC_BRAND_LOGO_URL || 'https://goelev8.ai/logo-white.png',

  /** Primary marketing domain (used in copyright + as default storefront-link fallback). */
  marketingUrl: process.env.NEXT_PUBLIC_BRAND_MARKETING_URL || 'https://goelev8.ai',

  /** Customer support email — surfaced in Settings (custom domains) and emails. */
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'hello@goelev8.ai',

  /** Transactional FROM email address. Must be on a domain verified in Resend. */
  fromEmail: process.env.RESEND_FROM_EMAIL || 'hello@goelev8.ai',

  /** Short code used to prefix Printify order labels (8 chars max). */
  orderLabelPrefix: process.env.NEXT_PUBLIC_BRAND_ORDER_PREFIX || 'GE8',
} as const;

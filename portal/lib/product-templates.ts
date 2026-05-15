import type { ProductTemplateKey } from './types';

export type ProductTemplate = {
  key: ProductTemplateKey;
  name: string;
  category: 'apparel' | 'accessories';
  defaultPriceCents: number;
  baseCostCents: number;
  description: string;
};

export const PRODUCT_TEMPLATES: ProductTemplate[] = [
  { key: 'tee',         name: 'Classic Tee',     category: 'apparel',     defaultPriceCents: 3499, baseCostCents: 1100, description: 'Premium ringspun cotton tee.' },
  { key: 'hoodie',      name: 'Premium Hoodie',  category: 'apparel',     defaultPriceCents: 5999, baseCostCents: 2400, description: 'Heavyweight fleece pullover.' },
  { key: 'zip_hoodie',  name: 'Zip Hoodie',      category: 'apparel',     defaultPriceCents: 6499, baseCostCents: 2700, description: 'Full-zip fleece hoodie with side pockets.' },
  { key: 'tank',        name: 'Tank',            category: 'apparel',     defaultPriceCents: 2799, baseCostCents: 900,  description: 'Cut-and-sewn training tank.' },
  { key: 'joggers',     name: 'Joggers',         category: 'apparel',     defaultPriceCents: 4999, baseCostCents: 2100, description: 'Tapered fleece joggers, drawcord waist.' },
  { key: 'shorts',      name: 'Performance Shorts', category: 'apparel',  defaultPriceCents: 3499, baseCostCents: 1500, description: 'Lightweight training shorts with side pockets.' },
  { key: 'snapback',    name: 'Snapback',        category: 'accessories', defaultPriceCents: 2999, baseCostCents: 1100, description: 'Structured 6-panel snapback.' },
  { key: 'tumbler',     name: 'Stainless Tumbler', category: 'accessories', defaultPriceCents: 3499, baseCostCents: 1200, description: 'Double-wall stainless steel tumbler.' },
];

export const getTemplate = (key: ProductTemplateKey) =>
  PRODUCT_TEMPLATES.find((t) => t.key === key);

import type { Product } from './types';

const BLACK = { name: 'Black', hex: '#0a0a0a' };
const WHITE = { name: 'White', hex: '#f2f2f2' };
const GOLD = { name: 'Gold', hex: '#C9A84C' };
const CHARCOAL = { name: 'Charcoal', hex: '#3a3a3a' };

const SIZES_APPAREL = ['S', 'M', 'L', 'XL', '2XL'];
const SIZE_OS = ['One Size'];

export const PRODUCTS: Product[] = [
  {
    id: 'tee',
    slug: 'willpower-classic-tee',
    name: 'WillPower Classic Tee',
    price: 34.99,
    description:
      'Premium cotton tee with the WillPower kettlebell logo. Built for the gym, cut for the street.',
    category: 'apparel',
    colors: [BLACK, WHITE, CHARCOAL],
    sizes: SIZES_APPAREL,
    printifyEnvKey: 'PRINTIFY_PRODUCT_TEE',
  },
  {
    id: 'hoodie',
    slug: 'willpower-hoodie',
    name: 'WillPower Hoodie',
    price: 59.99,
    description:
      'Heavyweight fleece hoodie. Embroidered logo. The piece you wear from the warm-up to the walk to your car.',
    category: 'apparel',
    colors: [BLACK, CHARCOAL],
    sizes: SIZES_APPAREL,
    printifyEnvKey: 'PRINTIFY_PRODUCT_HOODIE',
  },
  {
    id: 'snapback',
    slug: 'fitness-factory-snapback',
    name: 'Fitness Factory Snapback',
    price: 29.99,
    description: 'Structured 6-panel snapback with the FITNESS FACTORY star mark.',
    category: 'accessories',
    colors: [BLACK, GOLD],
    sizes: SIZE_OS,
    printifyEnvKey: 'PRINTIFY_PRODUCT_SNAPBACK',
  },
  {
    id: 'joggers',
    slug: 'willpower-joggers',
    name: 'WillPower Joggers',
    price: 49.99,
    description: 'Tapered fleece joggers. Side seam pockets, drawcord waist, ankle cuffs.',
    category: 'apparel',
    colors: [BLACK, CHARCOAL],
    sizes: SIZES_APPAREL,
    printifyEnvKey: 'PRINTIFY_PRODUCT_JOGGERS',
  },
  {
    id: 'tank',
    slug: 'willpower-tank',
    name: 'WillPower Tank',
    price: 27.99,
    description: 'Cut-and-sewn tank. Heavy drop arm, training-floor ready.',
    category: 'apparel',
    colors: [BLACK, WHITE],
    sizes: SIZES_APPAREL,
    printifyEnvKey: 'PRINTIFY_PRODUCT_TANK',
  },
  {
    id: 'tumbler',
    slug: 'willpower-tumbler',
    name: 'WillPower Tumbler',
    price: 34.99,
    description: 'Double-wall stainless tumbler. Keeps cold cold for 24 hours.',
    category: 'accessories',
    colors: [BLACK, WHITE],
    sizes: SIZE_OS,
    printifyEnvKey: 'PRINTIFY_PRODUCT_TUMBLER',
  },
];

export const getProduct = (id: string) => PRODUCTS.find((p) => p.id === id);

export const productPrintifyId = (envKey: string): string | undefined =>
  process.env[envKey]?.trim() || undefined;

export type ProductColor = { name: string; hex: string };

export type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  description: string;
  category: 'apparel' | 'accessories';
  colors: ProductColor[];
  sizes: string[];
  printifyEnvKey: string;
};

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  color: string;
  size: string;
  quantity: number;
};

export type ShippingInfo = {
  name: string;
  email: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
};

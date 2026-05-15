import { NextResponse } from 'next/server';
import { PRODUCTS, productPrintifyId } from '@/lib/products';
import { getPrintifyProduct } from '@/lib/printify';

export const revalidate = 300;

export async function GET() {
  const enriched = await Promise.all(
    PRODUCTS.map(async (p) => {
      const printifyId = productPrintifyId(p.printifyEnvKey);
      if (!printifyId || !process.env.PRINTIFY_API_KEY) {
        return { ...p, printifyId: null, image: null, hasLiveData: false };
      }
      try {
        const printify = await getPrintifyProduct(printifyId);
        if (!printify) return { ...p, printifyId, image: null, hasLiveData: false };
        const image =
          printify.images.find((i) => i.is_default)?.src || printify.images[0]?.src || null;
        return { ...p, printifyId, image, hasLiveData: true };
      } catch (err) {
        console.warn(`[/api/products] printify lookup failed for ${p.id}`, err);
        return { ...p, printifyId, image: null, hasLiveData: false };
      }
    }),
  );
  return NextResponse.json({ products: enriched });
}

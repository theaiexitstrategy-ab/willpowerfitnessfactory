import { BRAND } from '@/lib/brand';

export default function Logo({ height = 38 }: { height?: number }) {
  return (
    <img
      src={BRAND.logoUrl}
      alt={BRAND.name}
      style={{ height, width: 'auto', display: 'block' }}
    />
  );
}

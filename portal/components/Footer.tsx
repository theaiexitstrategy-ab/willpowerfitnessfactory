import Logo from './Logo';
import { BRAND } from '@/lib/brand';

export default function Footer() {
  return (
    <footer className="bg-[#070707] border-t border-border">
      <div className="max-w-[1160px] mx-auto px-5 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo height={24} />
          <p className="font-body text-xs text-silver">
            © {new Date().getFullYear()} {BRAND.shortName}. All rights reserved.
          </p>
        </div>
        <p className="font-body text-xs text-silver">
          <a href={BRAND.marketingUrl} target="_blank" rel="noopener" className="hover:text-white transition-colors">
            {BRAND.marketingUrl.replace(/^https?:\/\//, '')}
          </a>
        </p>
      </div>
    </footer>
  );
}

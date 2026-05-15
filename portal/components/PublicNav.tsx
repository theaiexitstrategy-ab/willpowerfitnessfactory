import Link from 'next/link';
import Logo from './Logo';

export default function PublicNav() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 h-[60px] bg-black/95 backdrop-blur-md border-b border-border flex items-center justify-between px-5">
      <Link href="/" aria-label="Will Power Fitness Factory">
        <Logo height={30} />
      </Link>
      <div className="flex items-center gap-3 md:gap-5">
        <Link
          href="/portal/login"
          className="font-condensed font-medium text-xs uppercase tracking-widest text-silver hover:text-white transition-colors"
        >
          Log in
        </Link>
        <Link
          href="/portal/signup"
          className="bg-gold text-black font-condensed font-bold uppercase text-xs tracking-widest px-4 py-2 hover:opacity-90 transition-opacity"
        >
          Start Free
        </Link>
      </div>
    </nav>
  );
}

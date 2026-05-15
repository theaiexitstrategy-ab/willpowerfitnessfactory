import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="bg-[#070707] border-t border-border">
      <div className="max-w-[1160px] mx-auto px-5 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo height={24} />
          <p className="font-body text-xs text-silver">
            © {new Date().getFullYear()} Will Power Fitness Factory · William Anderson
          </p>
        </div>
        <p className="font-body text-xs text-silver">
          Powered by{' '}
          <a href="https://goelev8.ai" target="_blank" rel="noopener" className="hover:text-white transition-colors">
            GoElev8.ai
          </a>
        </p>
      </div>
    </footer>
  );
}

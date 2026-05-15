import Logo from './Logo';

const BOOK = 'https://book.willpowerfitnessfactory.com';

export default function Footer() {
  return (
    <footer className="bg-[#070707] border-t border-border">
      <div className="max-w-[1160px] mx-auto px-5 py-12">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-10 md:gap-12">
          <div>
            <Logo height={28} />
            <p className="font-body font-light text-sm text-silver leading-relaxed mt-3 max-w-[30ch]">
              Empowering individuals to transform through mental determination and physical training.
              St. Louis, MO.
            </p>
            <div className="flex gap-2 mt-4">
              <SocialLink href="https://www.tiktok.com/@hulq314" label="TT" />
              <SocialLink href="https://www.facebook.com/profile.php?id=61553920083204" label="FB" />
              <SocialLink href="https://instagram.com/willpowerfitnessfactory" label="IG" />
            </div>
          </div>

          <div>
            <h4 className="font-condensed font-semibold text-[0.66rem] tracking-ultra uppercase text-light mb-3">
              Shop
            </h4>
            <ul className="space-y-2">
              <FooterLink href="/shop">All Merch</FooterLink>
              <FooterLink href={BOOK}>Private Training</FooterLink>
              <FooterLink href={BOOK}>Semi-Private</FooterLink>
              <FooterLink href={BOOK}>Group Sessions</FooterLink>
              <FooterLink href={BOOK}>Online Training</FooterLink>
            </ul>
          </div>

          <div>
            <h4 className="font-condensed font-semibold text-[0.66rem] tracking-ultra uppercase text-light mb-3">
              Contact
            </h4>
            <ul className="space-y-2 font-body font-light text-sm text-silver">
              <li>📍 The Flex Facility, St. Louis</li>
              <li>
                <a href="tel:3149647114" className="hover:text-white transition-colors">
                  314-964-7114
                </a>
              </li>
              <li>
                <a
                  href="mailto:willpowerfitnessfactory@gmail.com"
                  className="hover:text-white transition-colors leading-tight inline-block"
                >
                  willpowerfitnessfactory
                  <br />
                  @gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-4 mt-10 flex flex-wrap justify-between gap-2 text-[0.7rem]">
          <p className="font-body font-light text-[#404040]">
            © {new Date().getFullYear()} Will Power Fitness Factory · William Anderson · All rights reserved.
          </p>
          <p className="font-body font-light text-silver">
            Powered by{' '}
            <a
              href="https://goelev8.ai"
              target="_blank"
              rel="noopener"
              className="text-silver hover:text-white transition-colors"
            >
              GoElev8.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="w-8 h-8 border border-border flex items-center justify-center font-condensed font-bold text-[0.6rem] tracking-wide text-silver hover:border-white hover:text-white transition-colors"
    >
      {label}
    </a>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <a href={href} className="font-body font-light text-sm text-silver hover:text-white transition-colors">
        {children}
      </a>
    </li>
  );
}

import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import CartProvider from '@/components/CartProvider';
import CartPanel from '@/components/CartPanel';

export const metadata: Metadata = {
  title: 'Will Power Fitness Factory | Merch Shop',
  description:
    'Official WillPower Fitness Factory apparel — tees, hoodies, joggers, hats. St. Louis personal training with William Anderson, WNBF Pro.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <CartProvider>
          <Nav />
          <main className="min-h-screen pt-[60px]">{children}</main>
          <Footer />
          <CartPanel />
        </CartProvider>
      </body>
    </html>
  );
}

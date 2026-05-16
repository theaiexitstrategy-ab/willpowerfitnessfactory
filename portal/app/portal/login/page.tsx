import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import LoginForm from '@/components/portal/LoginForm';
import { BRAND } from '@/lib/brand';

export const metadata = { title: `Log in | ${BRAND.name}` };

export default function LoginPage() {
  return (
    <>
      <PublicNav />
      <section className="pt-[120px] pb-20 px-5">
        <div className="max-w-[440px] mx-auto panel">
          <span className="eyebrow">Welcome back</span>
          <h1 className="font-display text-3xl mt-2 mb-6">LOG IN</h1>
          <LoginForm />
          <p className="text-silver text-sm mt-6 text-center">
            New here?{' '}
            <Link href="/portal/signup" className="text-gold hover:text-gold-hi">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}

import Link from 'next/link';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/classes', label: 'Classes' },
  { href: '/register', label: 'Register' },
  { href: '/login', label: 'Login' },
];

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 text-teal-950">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-950 text-white font-semibold">
            TL
          </span>
          <div>
            <p className="text-lg font-semibold">Topline Academy</p>
            <p className="text-sm text-slate-500">Pakistan AI Online Classroom</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-4 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-slate-600 transition hover:text-teal-950">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

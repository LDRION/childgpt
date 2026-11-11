'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { api } from '@/lib/api';

const LINKS = [
  { href: '/parent', label: 'Обзор' },
  { href: '/parent/settings', label: 'Настройки' },
];

export function ParentNav() {
  const pathname = usePathname();

  async function logout() {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    window.location.href = '/';
  }

  return (
    <header className="pp-nav">
      <div className="container pp-nav__inner">
        <Logo href="/parent" tone="dark" />
        <nav className="pp-nav__links" aria-label="Кабинет">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={pathname === l.href ? 'page' : undefined}>
              {l.label}
            </Link>
          ))}
          <button type="button" onClick={logout}>
            Выйти
          </button>
        </nav>
      </div>
    </header>
  );
}

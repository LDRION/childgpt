import Link from 'next/link';
import { Logo } from './Logo';

const NAV = [
  { href: '/#lumi', label: 'Что умеет Луми' },
  { href: '/safety', label: 'Защита' },
  { href: '/#parents', label: 'Родителям' },
  { href: '/#faq', label: 'Вопросы' },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Logo />
        <nav className="site-header__nav" aria-label="Основное меню">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="site-header__actions">
          <Link href="/login" className="btn btn--ghost btn--sm">
            Войти
          </Link>
          <Link href="/register" className="btn btn--sm site-header__cta">
            Создать аккаунт
          </Link>
        </div>
      </div>
    </header>
  );
}

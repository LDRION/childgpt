import Link from 'next/link';
import { CHILD_HELPLINE } from '@childgpt/shared';
import { Logo } from './Logo';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__brand">
          <Logo />
          <p>Добрый ИИ-друг для детей 5–13 лет. Регистрация только для родителей.</p>
        </div>
        <nav className="site-footer__links" aria-label="Документы">
          <Link href="/safety">Как устроена защита</Link>
          <Link href="/privacy">Политика конфиденциальности</Link>
          <Link href="/terms">Пользовательское соглашение</Link>
          <Link href="/consent">Согласие на обработку данных ребёнка</Link>
        </nav>
        <div className="site-footer__help">
          <strong>{CHILD_HELPLINE.name}</strong>
          <a href={`tel:${CHILD_HELPLINE.tel}`}>{CHILD_HELPLINE.phone}</a>
          <span>{CHILD_HELPLINE.note}</span>
        </div>
      </div>
      <div className="container site-footer__bottom">© {new Date().getFullYear()} ChildGPT</div>
    </footer>
  );
}

import Link from 'next/link';
import { Lumi } from './Lumi';

export function Logo({ href = '/', tone = 'light' }: { href?: string; tone?: 'light' | 'dark' }) {
  return (
    <Link href={href} className={`logo logo--${tone}`} aria-label="ChildGPT — на главную">
      <Lumi size={38} float={false} title="" />
      <span className="logo__word">
        Child<span className="logo__accent">GPT</span>
      </span>
    </Link>
  );
}

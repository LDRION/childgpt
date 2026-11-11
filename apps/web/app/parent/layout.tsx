import type { Metadata } from 'next';
import { ParentNav } from './ParentNav';
import './parent.css';

export const metadata: Metadata = { title: 'Кабинет родителя', robots: { index: false, follow: false } };

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pp">
      <ParentNav />
      <main className="pp__main container">{children}</main>
    </div>
  );
}

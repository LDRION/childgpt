import { Logo } from '@/components/Logo';
import { NightSky } from '@/components/NightSky';
import { Clouds, Moon } from '@/components/Scenery';
import './auth.css';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth">
      <NightSky density={0.9} />
      <Moon className="auth__moon" />
      <div className="auth__top">
        <Logo />
      </div>
      <div className="auth__card">{children}</div>
      <Clouds tint="#c9d4ff" />
    </main>
  );
}

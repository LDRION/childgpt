import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Вход для родителей', robots: { index: false } };

export default function LoginPage() {
  return (
    <>
      <h1>С возвращением!</h1>
      <p className="auth__sub">Вход в кабинет родителя ChildGPT.</p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}

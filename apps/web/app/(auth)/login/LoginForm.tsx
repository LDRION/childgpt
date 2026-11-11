'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ApiError, api } from '@/lib/api';

export function LoginForm() {
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await api('/auth/login', { body: { email: form.get('email'), password: form.get('password') } });
      const next = params.get('next');
      window.location.href = next && next.startsWith('/parent') ? next : '/parent';
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось войти');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      <label className="field">
        <span className="field__label">Email</span>
        <input className="input" type="email" name="email" autoComplete="email" required />
      </label>
      <label className="field">
        <span className="field__label">Пароль</span>
        <input className="input" type="password" name="password" autoComplete="current-password" required />
      </label>
      <button className="btn btn--ink btn--block" type="submit" disabled={busy}>
        {busy ? 'Входим…' : 'Войти'}
      </button>
      <p className="auth__switch">
        Ещё нет аккаунта? <Link href="/register">Зарегистрироваться</Link>
      </p>
    </form>
  );
}

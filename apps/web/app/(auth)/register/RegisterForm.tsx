'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ApiError, api } from '@/lib/api';

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    setFields({});
    try {
      await api('/auth/register', {
        body: {
          name: form.get('name'),
          email: form.get('email'),
          password: form.get('password'),
          consents: {
            terms: form.get('terms') === 'on',
            privacy: form.get('privacy') === 'on',
            childData: form.get('childData') === 'on',
          },
        },
      });
      window.location.href = '/parent/children/new?welcome=1';
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFields(err.fields ?? {});
      } else {
        setError('Не удалось зарегистрироваться');
      }
      setBusy(false);
    }
  }

  const fieldError = (name: string) =>
    fields[name] ? (
      <span className="field__error" id={`${name}-error`}>
        {fields[name]}
      </span>
    ) : null;

  return (
    <form onSubmit={onSubmit} noValidate>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      <label className="field">
        <span className="field__label">Как к вам обращаться</span>
        <input className="input" name="name" autoComplete="given-name" required maxLength={60} aria-invalid={Boolean(fields.name)} />
        {fieldError('name')}
      </label>
      <label className="field">
        <span className="field__label">Email</span>
        <input className="input" type="email" name="email" autoComplete="email" required aria-invalid={Boolean(fields.email)} />
        <span className="field__hint">Сюда придут уведомления о важном в разговорах ребёнка.</span>
        {fieldError('email')}
      </label>
      <label className="field">
        <span className="field__label">Пароль</span>
        <input
          className="input"
          type="password"
          name="password"
          autoComplete="new-password"
          minLength={8}
          required
          aria-invalid={Boolean(fields.password)}
        />
        <span className="field__hint">Минимум 8 символов. Ребёнок не должен его знать.</span>
        {fieldError('password')}
      </label>

      <div className="auth__consents">
        <label className="check">
          <input type="checkbox" name="terms" required />
          <span>
            Мне есть 18 лет, я принимаю{' '}
            <Link href="/terms" target="_blank">
              пользовательское соглашение
            </Link>
          </span>
        </label>
        <label className="check">
          <input type="checkbox" name="privacy" required />
          <span>
            Я ознакомлен(а) с{' '}
            <Link href="/privacy" target="_blank">
              политикой конфиденциальности
            </Link>
          </span>
        </label>
        <label className="check">
          <input type="checkbox" name="childData" required />
          <span>
            Я родитель (законный представитель) и даю{' '}
            <Link href="/consent" target="_blank">
              согласие на обработку данных ребёнка
            </Link>
          </span>
        </label>
        {(fields['consents.terms'] || fields['consents.privacy'] || fields['consents.childData']) && (
          <span className="field__error">Чтобы продолжить, отметьте все три пункта.</span>
        )}
      </div>

      <button className="btn btn--ink btn--block" type="submit" disabled={busy}>
        {busy ? 'Создаём аккаунт…' : 'Создать аккаунт'}
      </button>
      <p className="auth__switch">
        Уже есть аккаунт? <Link href="/login">Войти</Link>
      </p>
    </form>
  );
}

'use client';

import { useState } from 'react';
import type { ParentDTO } from '@childgpt/shared';
import { ApiError, api, useApi } from '@/lib/api';
import { PinForm } from '../components';

export default function SettingsPage() {
  const me = useApi<{ parent: ParentDTO }>('/auth/me');
  const parent = me.data?.parent;

  return (
    <>
      <h1 className="pp-title">Настройки</h1>
      <div className="pp-settings">
        <section className="pp-card" id="pin">
          <h2>PIN-код для выхода из детского режима</h2>
          <p className="pp-muted">
            {parent?.hasPin ? 'PIN задан. Можно сменить его в любой момент.' : 'PIN ещё не задан — без него детский режим не включить.'}
          </p>
          <PinForm onDone={() => void me.reload()} />
        </section>

        {parent && <Notifications parent={parent} onSaved={(p) => me.setData({ parent: p })} />}
        <PasswordCard />
        <DeleteAccount />
      </div>
    </>
  );
}

function Notifications({ parent, onSaved }: { parent: ParentDTO; onSaved: (p: ParentDTO) => void }) {
  const [busy, setBusy] = useState(false);
  async function toggle(value: boolean) {
    setBusy(true);
    const res = await api<{ parent: ParentDTO }>('/auth/me', { method: 'PATCH', body: { notifyByEmail: value } });
    onSaved(res.parent);
    setBusy(false);
  }
  return (
    <section className="pp-card">
      <h2>Уведомления</h2>
      <label className="check">
        <input type="checkbox" checked={parent.notifyByEmail} disabled={busy} onChange={(e) => toggle(e.target.checked)} />
        <span>
          Присылать письмо на <strong>{parent.email}</strong>, если в разговоре ребёнка сработал кризисный протокол. Текст переписки в
          письмо не попадает.
        </span>
      </label>
    </section>
  );
}

function PasswordCard() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    try {
      await api('/auth/password', { body: { current: f.get('current'), next: f.get('next') } });
      setMsg({ ok: true, text: 'Пароль изменён. На других устройствах нужно будет войти заново.' });
      form.reset();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof ApiError ? (err.fields?.current ?? err.fields?.next ?? err.message) : 'Ошибка' });
    }
  }
  return (
    <section className="pp-card">
      <h2>Пароль</h2>
      {msg && <p className={msg.ok ? 'pp-ok' : 'form-error'}>{msg.text}</p>}
      <form onSubmit={onSubmit} className="pp-pin">
        <label className="field">
          <span className="field__label">Текущий пароль</span>
          <input className="input" type="password" name="current" autoComplete="current-password" required />
        </label>
        <label className="field">
          <span className="field__label">Новый пароль</span>
          <input className="input" type="password" name="next" autoComplete="new-password" minLength={8} required />
        </label>
        <button className="btn btn--ink" type="submit">
          Сменить пароль
        </button>
      </form>
    </section>
  );
}

function DeleteAccount() {
  const [error, setError] = useState<string | null>(null);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!confirm('Удалить аккаунт, профили детей и всю переписку без возможности восстановления?')) return;
    const f = new FormData(e.currentTarget);
    try {
      await api('/auth/me', { method: 'DELETE', body: { password: f.get('password') } });
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ошибка');
    }
  }
  return (
    <section className="pp-card pp-card--danger">
      <h2>Удалить аккаунт</h2>
      <p className="pp-muted">Будут удалены аккаунт, все профили детей, переписка, сигналы и записи о согласиях.</p>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={onSubmit} className="pp-pin">
        <label className="field">
          <span className="field__label">Пароль для подтверждения</span>
          <input className="input" type="password" name="password" autoComplete="current-password" required />
        </label>
        <button className="btn btn--danger" type="submit">
          Удалить навсегда
        </button>
      </form>
    </section>
  );
}

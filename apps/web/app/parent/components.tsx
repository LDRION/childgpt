'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  SAFETY_CATEGORY_LABELS,
  SAFETY_SEVERITY_LABELS,
  type SafetyEventDTO,
  type ThemeId,
} from '@childgpt/shared';
import { Lumi } from '@/components/Lumi';
import { ApiError, api } from '@/lib/api';
import { formatDateTime } from '@/lib/format';

export function ChildAvatar({ theme, size = 56 }: { theme: ThemeId; size?: number }) {
  return (
    <span className={`pp-avatar pp-avatar--${theme}`} style={{ width: size, height: size }}>
      <Lumi theme={theme} size={Math.round(size * 0.82)} float={false} title="" />
    </span>
  );
}

const SEVERITY_BADGE = { critical: 'badge--critical', warning: 'badge--warning', info: 'badge--info' } as const;

export function SafetyEventItem({ event, onReviewed, showChild = true }: { event: SafetyEventDTO; onReviewed?: () => void; showChild?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [reviewed, setReviewed] = useState(event.reviewed);

  async function review() {
    setBusy(true);
    try {
      await api(`/parent/safety-events/${event.id}/review`, { method: 'POST' });
      setReviewed(true);
      onReviewed?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className={`pp-event pp-event--${event.severity} ${reviewed ? 'pp-event--reviewed' : ''}`}>
      <div className="pp-event__head">
        <span className={`badge ${SEVERITY_BADGE[event.severity]}`}>{SAFETY_SEVERITY_LABELS[event.severity]}</span>
        <span className="pp-event__time">{formatDateTime(event.createdAt)}</span>
      </div>
      <h3 className="pp-event__title">
        {SAFETY_CATEGORY_LABELS[event.category] ?? 'Событие'}
        {showChild && event.childName ? <span> · {event.childName}</span> : null}
      </h3>
      {event.excerpt && <p className="pp-event__quote">«{event.excerpt}»</p>}
      <div className="pp-event__actions">
        <Link href={`/parent/children/${event.childId}?tab=chats${event.conversationId ? `&conversation=${event.conversationId}` : ''}`} className="btn btn--outline btn--sm">
          Открыть разговор
        </Link>
        {!reviewed && (
          <button type="button" className="btn btn--outline btn--sm" onClick={review} disabled={busy}>
            Просмотрено
          </button>
        )}
      </div>
    </article>
  );
}

/** Задать PIN (с подтверждением паролем). */
export function PinForm({ onDone, compact = false }: { onDone?: () => void; compact?: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get('pin') !== f.get('pin2')) {
      setError('PIN-коды не совпадают');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api('/auth/pin', { method: 'PUT', body: { pin: f.get('pin'), password: f.get('password') } });
      setOk(true);
      onDone?.();
    } catch (err) {
      setError(err instanceof ApiError ? (err.fields?.password ?? err.fields?.pin ?? err.message) : 'Не удалось сохранить');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={compact ? 'pp-pin pp-pin--compact' : 'pp-pin'}>
      {error && <div className="form-error">{error}</div>}
      {ok && <p className="pp-ok">PIN сохранён ✓</p>}
      <div className="pp-pin__row">
        <label className="field">
          <span className="field__label">Новый PIN</span>
          <input className="input" name="pin" inputMode="numeric" pattern="\d{4}" maxLength={4} autoComplete="off" required placeholder="4 цифры" />
        </label>
        <label className="field">
          <span className="field__label">Ещё раз</span>
          <input className="input" name="pin2" inputMode="numeric" pattern="\d{4}" maxLength={4} autoComplete="off" required placeholder="4 цифры" />
        </label>
      </div>
      <label className="field">
        <span className="field__label">Ваш пароль</span>
        <input className="input" name="password" type="password" autoComplete="current-password" required />
        <span className="field__hint">Чтобы ребёнок не мог сменить PIN сам.</span>
      </label>
      <button className="btn btn--ink" type="submit" disabled={busy}>
        {busy ? 'Сохраняем…' : 'Сохранить PIN'}
      </button>
    </form>
  );
}

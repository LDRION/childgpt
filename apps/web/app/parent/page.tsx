'use client';

import Link from 'next/link';
import type { ParentDTO } from '@childgpt/shared';
import { useApi } from '@/lib/api';
import { pluralRu, yearsLabel } from '@/lib/format';
import { ChildAvatar, SafetyEventItem } from './components';
import type { OverviewResponse } from './types';

export default function ParentOverview() {
  const me = useApi<{ parent: ParentDTO }>('/auth/me');
  const overview = useApi<OverviewResponse>('/parent/overview');

  if (overview.loading && !overview.data) return <div className="pp-loading"><span className="spinner" /></div>;
  if (overview.error) return <div className="form-error">{overview.error.message}</div>;

  const children = overview.data?.children ?? [];
  const events = overview.data?.events ?? [];
  const unreviewed = events.filter((e) => !e.reviewed);
  const parent = me.data?.parent;

  return (
    <>
      <section className="pp-hello">
        <div>
          <h1>Здравствуйте{parent ? `, ${parent.name}` : ''}!</h1>
          <p>
            {unreviewed.length > 0
              ? `${unreviewed.length} ${pluralRu(unreviewed.length, 'сигнал ждёт', 'сигнала ждут', 'сигналов ждут')} вашего внимания.`
              : 'Всё спокойно. Луми на посту 🦉'}
          </p>
        </div>
        <Link href="/parent/children/new" className="btn btn--ink">
          + Добавить ребёнка
        </Link>
      </section>

      {parent && !parent.hasPin && (
        <div className="pp-banner">
          <strong>Задайте PIN-код.</strong> Без него нельзя включить детский режим — PIN нужен, чтобы ребёнок не мог выйти в ваш
          кабинет. <Link href="/parent/settings#pin">Задать PIN →</Link>
        </div>
      )}

      {children.length === 0 ? (
        <section className="pp-empty">
          <ChildAvatar theme="girl" size={96} />
          <h2>Создайте профиль ребёнка</h2>
          <p>Имя, возраст и сказочный мир — Луми будет говорить с ребёнком на понятном ему языке.</p>
          <Link href="/parent/children/new" className="btn btn--ink">
            Создать профиль
          </Link>
        </section>
      ) : (
        <section className="pp-children" aria-label="Дети">
          {children.map((c) => (
            <Link key={c.id} href={`/parent/children/${c.id}`} className="pp-child">
              <ChildAvatar theme={c.theme} />
              <div className="pp-child__info">
                <strong>{c.name}</strong>
                <span>
                  {yearsLabel(c.age)} · сегодня {c.todayMessages} {pluralRu(c.todayMessages, 'сообщение', 'сообщения', 'сообщений')}
                </span>
              </div>
              {c.unreviewedCritical > 0 ? (
                <span className="badge badge--critical">Важно</span>
              ) : c.unreviewedAlerts > 0 ? (
                <span className="badge badge--warning">
                  {c.unreviewedAlerts} {pluralRu(c.unreviewedAlerts, 'сигнал', 'сигнала', 'сигналов')}
                </span>
              ) : (
                <span className="badge badge--ok">Всё спокойно</span>
              )}
            </Link>
          ))}
        </section>
      )}

      {events.length > 0 && (
        <section className="pp-section">
          <h2>Последние сигналы</h2>
          <div className="pp-events">
            {events.map((e) => (
              <SafetyEventItem key={e.id} event={e} onReviewed={overview.reload} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

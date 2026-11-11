'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import {
  SAFETY_CATEGORY_LABELS,
  THEMES,
  type ChildDTO,
  type ConversationDTO,
  type MessageDTO,
  type ParentDTO,
  type SafetyEventDTO,
} from '@childgpt/shared';
import { ApiError, api, useApi } from '@/lib/api';
import { formatDay, formatTime, yearsLabel } from '@/lib/format';
import { ChildForm } from '../../ChildForm';
import { ChildAvatar, PinForm, SafetyEventItem } from '../../components';

type Tab = 'chats' | 'signals' | 'settings';

const ACTION_LABEL: Record<NonNullable<MessageDTO['safety']>['action'], { text: string; cls: string } | null> = {
  allowed: null,
  redirected: { text: 'Луми мягко сменил тему', cls: 'badge--info' },
  crisis: { text: 'Кризисный протокол', cls: 'badge--critical' },
  fallback: { text: 'Ответ модели скрыт защитой', cls: 'badge--info' },
};

function ChildPage() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const tab = (params.get('tab') as Tab) ?? 'chats';
  const child = useApi<{ child: ChildDTO }>(`/parent/children/${id}`);
  const me = useApi<{ parent: ParentDTO }>('/auth/me');
  const [kidModeError, setKidModeError] = useState<string | null>(null);
  const [needPin, setNeedPin] = useState(false);
  const [pinJustSet, setPinJustSet] = useState(false);

  const setTab = (t: Tab) => router.replace(`/parent/children/${id}?tab=${t}`, { scroll: false });

  async function startKidMode() {
    setKidModeError(null);
    try {
      await api(`/parent/children/${id}/session`, { body: { device: 'web' } });
      window.location.href = '/kid';
    } catch (err) {
      if (err instanceof ApiError && err.code === 'pin_required') setNeedPin(true);
      else setKidModeError(err instanceof ApiError ? err.message : 'Не удалось включить детский режим');
    }
  }

  if (child.loading && !child.data) return <div className="pp-loading"><span className="spinner" /></div>;
  if (child.error || !child.data) return <div className="form-error">{child.error?.message ?? 'Профиль не найден'}</div>;
  const c = child.data.child;
  const created = params.get('created') === '1';
  const showPinCard = needPin || (created && me.data !== null && !me.data.parent.hasPin);

  return (
    <>
      <Link href="/parent" className="pp-back">
        ← К обзору
      </Link>

      <section className={`pp-kidhead pp-kidhead--${c.theme}`}>
        <ChildAvatar theme={c.theme} size={84} />
        <div className="pp-kidhead__info">
          <h1>{c.name}</h1>
          <p>
            {yearsLabel(c.age)} · {THEMES[c.theme].title}
            {c.strictMode ? ' · строгий режим' : ''}
          </p>
        </div>
        <div className="pp-kidhead__cta">
          <button type="button" className="btn" onClick={startKidMode}>
            Включить детский режим
          </button>
          <span>на этом устройстве</span>
        </div>
      </section>

      {pinJustSet ? (
        <div className="pp-banner pp-banner--ok">PIN сохранён ✓ Теперь нажмите «Включить детский режим» и передайте устройство ребёнку.</div>
      ) : (
        created &&
        !showPinCard && <div className="pp-banner pp-banner--ok">Профиль создан! Нажмите «Включить детский режим» и передайте устройство ребёнку.</div>
      )}
      {kidModeError && <div className="form-error">{kidModeError}</div>}
      {showPinCard && (
        <section className="pp-card">
          <h2>{created ? 'Профиль создан! Осталось задать PIN-код' : 'Задайте PIN-код родителя'}</h2>
          <p className="pp-muted">Ребёнок выйдет из детского режима только по этому коду. Не используйте дату рождения ребёнка.</p>
          <PinForm
            compact
            onDone={() => {
              setNeedPin(false);
              setPinJustSet(true);
              void me.reload();
            }}
          />
        </section>
      )}

      <nav className="pp-tabs" role="tablist">
        {(
          [
            ['chats', 'Разговоры'],
            ['signals', 'Сигналы'],
            ['settings', 'Настройки'],
          ] as const
        ).map(([t, label]) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
            {label}
          </button>
        ))}
      </nav>

      {tab === 'chats' && <Chats childId={id} initialConversation={params.get('conversation')} />}
      {tab === 'signals' && <Signals childId={id} />}
      {tab === 'settings' && (
        <Settings
          child={c}
          onSaved={(updated) => child.setData({ child: updated })}
        />
      )}
    </>
  );
}

function Chats({ childId, initialConversation }: { childId: string; initialConversation: string | null }) {
  const list = useApi<{ conversations: ConversationDTO[] }>(`/parent/children/${childId}/conversations`);
  const [selected, setSelected] = useState<string | null>(initialConversation);

  useEffect(() => {
    if (!selected && list.data?.conversations[0]) setSelected(list.data.conversations[0].id);
  }, [list.data, selected]);

  const transcript = useApi<{ conversation: ConversationDTO; messages: MessageDTO[] }>(selected ? `/parent/conversations/${selected}/messages` : null);

  if (list.loading && !list.data) return <div className="pp-loading"><span className="spinner" /></div>;
  const conversations = list.data?.conversations ?? [];
  if (conversations.length === 0) {
    return (
      <div className="pp-empty pp-empty--small">
        <h2>Пока разговоров нет</h2>
        <p>Когда ребёнок начнёт общаться с Луми, переписка появится здесь — по дням.</p>
      </div>
    );
  }

  return (
    <div className="pp-chats">
      <aside className="pp-days" aria-label="Дни">
        {conversations.map((cv) => (
          <button key={cv.id} type="button" aria-current={selected === cv.id} onClick={() => setSelected(cv.id)}>
            <span>{formatDay(cv.day)}</span>
            <small>
              {Math.ceil(cv.messageCount / 2)} вопр.
              {cv.flagged && <span className="pp-dot" aria-label="есть сигналы" />}
            </small>
          </button>
        ))}
      </aside>
      <section className="pp-transcript" aria-live="polite">
        {transcript.loading && !transcript.data ? (
          <div className="pp-loading"><span className="spinner" /></div>
        ) : (
          transcript.data?.messages.map((m) => {
            const label = m.role === 'lumi' && m.safety ? ACTION_LABEL[m.safety.action] : null;
            return (
              <div key={m.id} className={`pp-msg pp-msg--${m.role}`}>
                <div className="pp-msg__bubble">{m.text}</div>
                <div className="pp-msg__meta">
                  <span>{m.role === 'child' ? 'Ребёнок' : 'Луми'} · {formatTime(m.createdAt)}</span>
                  {m.role === 'child' && m.safety?.redactedPersonalData && <span className="badge badge--info">Личные данные скрыты от ИИ</span>}
                  {m.role === 'child' &&
                    m.safety?.categories
                      .filter((cat) => cat !== 'personal_data' && cat !== 'system_error')
                      .map((cat) => (
                        <span key={cat} className="badge badge--warning">
                          {SAFETY_CATEGORY_LABELS[cat]}
                        </span>
                      ))}
                  {label && <span className={`badge ${label.cls}`}>{label.text}</span>}
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}

function Signals({ childId }: { childId: string }) {
  const [all, setAll] = useState(false);
  const events = useApi<{ events: SafetyEventDTO[] }>(`/parent/safety-events?childId=${childId}${all ? '&includeInfo=1' : ''}`);
  return (
    <section>
      <label className="check pp-filter">
        <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} />
        <span>Показывать и незначительные события (мягкая смена темы, скрытые данные)</span>
      </label>
      {events.data?.events.length === 0 && (
        <div className="pp-empty pp-empty--small">
          <h2>Сигналов нет</h2>
          <p>Если в разговоре появится что-то, на что стоит обратить внимание, — это будет здесь.</p>
        </div>
      )}
      <div className="pp-events">
        {events.data?.events.map((e) => (
          <SafetyEventItem key={e.id} event={e} showChild={false} />
        ))}
      </div>
    </section>
  );
}

function Settings({ child, onSaved }: { child: ChildDTO; onSaved: (c: ChildDTO) => void }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function revoke() {
    setBusy(true);
    await api(`/parent/children/${child.id}/revoke`, { method: 'POST' });
    setBusy(false);
    alert('Готово: детский режим выключен на всех устройствах.');
  }

  async function remove() {
    if (!confirm(`Удалить профиль «${child.name}» и всю переписку без возможности восстановления?`)) return;
    setBusy(true);
    await api(`/parent/children/${child.id}`, { method: 'DELETE' });
    window.location.href = '/parent';
  }

  return (
    <div className="pp-settings">
      <section className="pp-card">
        <h2>Профиль</h2>
        {saved && <p className="pp-ok">Сохранено ✓</p>}
        <ChildForm
          initial={child}
          submitLabel="Сохранить изменения"
          onSubmit={async (values) => {
            const { child: updated } = await api<{ child: ChildDTO }>(`/parent/children/${child.id}`, { method: 'PATCH', body: values });
            onSaved(updated);
            setSaved(true);
          }}
        />
      </section>
      <section className="pp-card">
        <h2>Устройства</h2>
        <p className="pp-muted">Выключит детский режим на всех телефонах, планшетах и браузерах, где он был включён.</p>
        <button type="button" className="btn btn--outline" onClick={revoke} disabled={busy}>
          Выйти на всех устройствах
        </button>
      </section>
      <section className="pp-card pp-card--danger">
        <h2>Удаление</h2>
        <p className="pp-muted">Профиль, вся переписка и сигналы будут удалены безвозвратно.</p>
        <button type="button" className="btn btn--danger" onClick={remove} disabled={busy}>
          Удалить профиль ребёнка
        </button>
      </section>
    </div>
  );
}

export default function ChildDetailPage() {
  return (
    <Suspense>
      <ChildPage />
    </Suspense>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MASCOT_NAME, MESSAGE_MAX_LENGTH, getTheme, type KidProfileDTO, type MessageDTO } from '@childgpt/shared';
import { Lumi } from '@/components/Lumi';
import { NightSky } from '@/components/NightSky';
import { CastleScene, CosmosScene, Moon } from '@/components/Scenery';
import { ApiError, api } from '@/lib/api';
import { PinPad } from './PinPad';

const SUGGESTIONS = ['Почему небо голубое? ☁️', 'Расскажи сказку 📖', 'Загадай загадку 🤔', 'Помоги с задачкой ✏️', 'Как спят животные? 🐻'];

type ChatItem = MessageDTO & { pending?: boolean; failed?: boolean };

export default function KidChatPage() {
  const [profile, setProfile] = useState<KidProfileDTO | null>(null);
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [text, setText] = useState('');
  const [thinking, setThinking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const [me, history] = await Promise.all([
          api<{ child: KidProfileDTO }>('/kid/me'),
          api<{ messages: MessageDTO[] }>('/kid/messages'),
        ]);
        setProfile(me.child);
        setMessages(history.messages);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) window.location.href = '/login';
        else setNotice('Ой, не получается связаться с Луми. Проверь интернет 🌙');
      }
    })();
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const send = useCallback(
    async (raw: string) => {
      const value = raw.trim();
      if (!value || thinking) return;
      setText('');
      setNotice(null);
      const local: ChatItem = { id: `local-${Date.now()}`, role: 'child', text: value, createdAt: new Date().toISOString(), pending: true };
      setMessages((m) => [...m, local]);
      setThinking(true);
      try {
        const res = await api<{ message: MessageDTO; limited: boolean }>('/kid/messages', { body: { text: value } });
        setMessages((m) => [...m.map((x) => (x.id === local.id ? { ...x, pending: false } : x)), res.message]);
      } catch (err) {
        setMessages((m) => m.map((x) => (x.id === local.id ? { ...x, pending: false, failed: true } : x)));
        setNotice(err instanceof ApiError && err.status !== 0 ? err.message : 'Ой, связь потерялась. Попробуй ещё раз 🌙');
      } finally {
        setThinking(false);
        inputRef.current?.focus();
      }
    },
    [thinking],
  );

  const theme = getTheme(profile?.theme);
  const c = theme.colors;
  const style = {
    '--k-sky-top': c.skyTop,
    '--k-sky-mid': c.skyMid,
    '--k-sky-bottom': c.skyBottom,
    '--k-glow': c.glow,
    '--k-surface': c.surface,
    '--k-surface-strong': c.surfaceStrong,
    '--k-border': c.border,
    '--k-text': c.text,
    '--k-muted': c.textMuted,
    '--k-accent': c.accent,
    '--k-accent-text': c.accentText,
    '--k-accent2': c.accent2,
    '--k-bubble-child': c.bubbleChild,
    '--k-bubble-child-text': c.bubbleChildText,
    '--k-bubble-lumi': c.bubbleLumi,
    '--k-bubble-lumi-text': c.bubbleLumiText,
  } as React.CSSProperties;

  return (
    <div className={`kid kid--${theme.id}`} style={style}>
      <div className="kid__sky" aria-hidden="true">
        <NightSky density={0.8} />
        <Moon className="kid__moon" />
        {theme.scene === 'cosmos' ? <CosmosScene className="kid__scene" /> : <CastleScene className="kid__scene" />}
      </div>

      <header className="kid__head">
        <div className="kid__brand">
          <Lumi theme={theme.id} size={52} />
          <div>
            <strong>{MASCOT_NAME}</strong>
            <span>{thinking ? 'думает…' : 'совёнок-помощник'}</span>
          </div>
        </div>
        <button type="button" className="kid__exit" onClick={() => setPinOpen(true)}>
          <span aria-hidden="true">🔒</span> Для взрослых
        </button>
      </header>

      <div className="kid__list" ref={listRef} aria-live="polite">
        {messages.length === 0 && profile && (
          <div className="kid__welcome">
            <Lumi theme={theme.id} size={150} />
            <h1>Привет, {profile.name}!</h1>
            <p>Я Луми — совёнок, который знает много интересного. О чём поговорим?</p>
            <div className="kid__suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => void send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          const firstOfGroup = m.role === 'lumi' && messages[i - 1]?.role !== 'lumi';
          return (
            <div key={m.id} className={`kid-msg kid-msg--${m.role} ${m.failed ? 'kid-msg--failed' : ''}`}>
              {m.role === 'lumi' && <span className="kid-msg__avatar">{firstOfGroup && <Lumi theme={theme.id} size={38} float={false} title="" />}</span>}
              <div className="kid-msg__bubble">{m.text}</div>
            </div>
          );
        })}

        {thinking && (
          <div className="kid-msg kid-msg--lumi">
            <span className="kid-msg__avatar">
              <Lumi theme={theme.id} size={38} float={false} title="" />
            </span>
            <div className="kid-msg__bubble kid-thinking" aria-label="Луми думает">
              <span>✦</span>
              <span>✦</span>
              <span>✦</span>
            </div>
          </div>
        )}
      </div>

      <footer className="kid__composer">
        {notice && (
          <p className="kid__notice" role="status">
            {notice}
          </p>
        )}
        <form
          className="kid__form"
          onSubmit={(e) => {
            e.preventDefault();
            void send(text);
          }}
        >
          <textarea
            ref={inputRef}
            className="kid__input"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MESSAGE_MAX_LENGTH))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send(text);
              }
            }}
            rows={1}
            placeholder="Напиши Луми…"
            aria-label="Сообщение для Луми"
            maxLength={MESSAGE_MAX_LENGTH}
          />
          <button className="kid__send" type="submit" disabled={!text.trim() || thinking} aria-label="Отправить">
            <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
              <path d="M3.4 20.4 21 12 3.4 3.6l.1 6.5L15 12 3.5 13.9z" fill="currentColor" />
            </svg>
          </button>
        </form>
      </footer>

      {pinOpen && <PinPad onClose={() => setPinOpen(false)} />}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { PIN_LENGTH } from '@childgpt/shared';
import { ApiError, api } from '@/lib/api';

// Выход из детского режима. Ребёнку экран честно говорит: «это для взрослых».
export function PinPad({ onClose }: { onClose: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [usePassword, setUsePassword] = useState(false);

  async function submit(body: { pin: string } | { password: string }) {
    setBusy(true);
    setError(null);
    try {
      await api('/kid/exit', { body });
      window.location.href = '/parent';
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не получилось');
      setPin('');
      setBusy(false);
    }
  }

  useEffect(() => {
    if (pin.length === PIN_LENGTH) void submit({ pin });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (usePassword) return;
      if (e.key === 'Escape') onClose();
      else if (/^\d$/.test(e.key)) setPin((p) => (p.length < PIN_LENGTH ? p + e.key : p));
      else if (e.key === 'Backspace') setPin((p) => p.slice(0, -1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, usePassword]);

  return (
    <div className="pinpad" role="dialog" aria-modal="true" aria-labelledby="pinpad-title">
      <div className="pinpad__card">
        <button type="button" className="pinpad__close" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
        <p className="pinpad__lock" aria-hidden="true">
          🔒
        </p>
        <h2 id="pinpad-title">Только для взрослых</h2>
        <p className="pinpad__hint">{usePassword ? 'Введите пароль от аккаунта родителя' : 'Введите PIN-код родителя'}</p>

        {usePassword ? (
          <form
            className="pinpad__password"
            onSubmit={(e) => {
              e.preventDefault();
              const password = String(new FormData(e.currentTarget).get('password') ?? '');
              if (password) void submit({ password });
            }}
          >
            <input className="input" type="password" name="password" autoComplete="current-password" autoFocus required />
            <button className="btn btn--block" type="submit" disabled={busy}>
              Выйти
            </button>
          </form>
        ) : (
          <>
            <div className={`pinpad__dots ${error ? 'pinpad__dots--error' : ''}`} aria-label={`Введено ${pin.length} из ${PIN_LENGTH}`}>
              {Array.from({ length: PIN_LENGTH }, (_, i) => (
                <span key={i} className={i < pin.length ? 'is-filled' : ''} />
              ))}
            </div>
            <div className="pinpad__keys">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) =>
                k === '' ? (
                  <span key={i} />
                ) : (
                  <button
                    key={i}
                    type="button"
                    disabled={busy}
                    aria-label={k === '⌫' ? 'Стереть' : k}
                    onClick={() => (k === '⌫' ? setPin((p) => p.slice(0, -1)) : setPin((p) => (p.length < PIN_LENGTH ? p + k : p)))}
                  >
                    {k}
                  </button>
                ),
              )}
            </div>
          </>
        )}

        {error && (
          <p className="pinpad__error" role="alert">
            {error}
          </p>
        )}
        <button type="button" className="pinpad__alt" onClick={() => (setUsePassword((v) => !v), setError(null))}>
          {usePassword ? 'Ввести PIN-код' : 'Забыли PIN? Войти паролем'}
        </button>
      </div>
    </div>
  );
}

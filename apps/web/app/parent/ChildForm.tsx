'use client';

import { useState } from 'react';
import { CHILD_AGE_MAX, CHILD_AGE_MIN, DEFAULT_DAILY_MESSAGE_LIMIT, THEMES, type ChildDTO, type ThemeId } from '@childgpt/shared';
import { Lumi } from '@/components/Lumi';
import { CastleScene, CosmosScene } from '@/components/Scenery';
import { ApiError } from '@/lib/api';
import { yearsLabel } from '@/lib/format';

export interface ChildFormValues {
  name: string;
  birthYear: number;
  gender: 'boy' | 'girl';
  theme: ThemeId;
  dailyMessageLimit: number;
  strictMode: boolean;
}

export function ChildForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Partial<ChildDTO>;
  submitLabel: string;
  onSubmit: (values: ChildFormValues) => Promise<void>;
}) {
  const year = new Date().getFullYear();
  const years = Array.from({ length: CHILD_AGE_MAX - CHILD_AGE_MIN + 1 }, (_, i) => year - CHILD_AGE_MIN - i);
  const [gender, setGender] = useState<'boy' | 'girl'>(initial?.gender ?? 'girl');
  const [theme, setTheme] = useState<ThemeId>(initial?.theme ?? gender);
  const [themeTouched, setThemeTouched] = useState(Boolean(initial?.theme));
  const [limit, setLimit] = useState(initial?.dailyMessageLimit ?? DEFAULT_DAILY_MESSAGE_LIMIT);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  function pickGender(g: 'boy' | 'girl') {
    setGender(g);
    if (!themeTouched) setTheme(g);
  }

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    setFields({});
    try {
      await onSubmit({
        name: String(f.get('name') ?? '').trim(),
        birthYear: Number(f.get('birthYear')),
        gender,
        theme,
        dailyMessageLimit: limit,
        strictMode: f.get('strictMode') === 'on',
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось сохранить');
      setFields(err instanceof ApiError ? (err.fields ?? {}) : {});
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="pp-form" onSubmit={handle} noValidate>
      {error && <div className="form-error">{error}</div>}

      <div className="pp-form__grid">
        <label className="field">
          <span className="field__label">Имя ребёнка</span>
          <input className="input" name="name" defaultValue={initial?.name} required maxLength={30} placeholder="Например, Маша" aria-invalid={Boolean(fields.name)} />
          <span className="field__hint">Достаточно имени или домашнего прозвища — фамилия не нужна.</span>
          {fields.name && <span className="field__error">{fields.name}</span>}
        </label>
        <label className="field">
          <span className="field__label">Год рождения</span>
          <select className="input" name="birthYear" defaultValue={initial?.birthYear ?? year - 8} aria-invalid={Boolean(fields.birthYear)}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y} — {yearsLabel(year - y)}
              </option>
            ))}
          </select>
          {fields.birthYear && <span className="field__error">{fields.birthYear}</span>}
        </label>
      </div>

      <fieldset className="pp-fieldset">
        <legend className="field__label">Кто будет общаться с Луми</legend>
        <div className="pp-segment">
          <button type="button" aria-pressed={gender === 'girl'} onClick={() => pickGender('girl')}>
            Девочка
          </button>
          <button type="button" aria-pressed={gender === 'boy'} onClick={() => pickGender('boy')}>
            Мальчик
          </button>
        </div>
        <span className="field__hint">Чтобы Луми обращался к ребёнку в правильном роде.</span>
      </fieldset>

      <fieldset className="pp-fieldset">
        <legend className="field__label">Сказочный мир</legend>
        <div className="pp-themes">
          {[THEMES.girl, THEMES.boy].map((t) => (
            <button
              key={t.id}
              type="button"
              className={`pp-theme pp-theme--${t.id}`}
              aria-pressed={theme === t.id}
              onClick={() => {
                setTheme(t.id);
                setThemeTouched(true);
              }}
            >
              <span className="pp-theme__sky">
                {t.scene === 'cosmos' ? <CosmosScene /> : <CastleScene />}
                <Lumi theme={t.id} size={70} float={false} className="pp-theme__lumi" title="" />
              </span>
              <span className="pp-theme__name">{t.title}</span>
              <span className="pp-theme__aud">{t.audience}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <label className="field">
        <span className="field__label">
          Сообщений в день: <strong>{limit}</strong>
        </span>
        <input className="pp-range" type="range" min={10} max={300} step={10} value={limit} onChange={(e) => setLimit(Number(e.target.value))} />
        <span className="field__hint">Когда лимит закончится, Луми ласково предложит вернуться завтра.</span>
      </label>

      <label className="check pp-strict">
        <input type="checkbox" name="strictMode" defaultChecked={initial?.strictMode ?? false} />
        <span>
          <strong>Строгий режим.</strong> Дополнительная ИИ-проверка всегда включена, даже если на сервере выбран облегчённый режим.
          Рекомендуем для детей до 7 лет.
        </span>
      </label>

      <button className="btn btn--ink" type="submit" disabled={busy}>
        {busy ? 'Сохраняем…' : submitLabel}
      </button>
    </form>
  );
}

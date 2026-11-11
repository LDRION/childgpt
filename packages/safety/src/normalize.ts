// Нормализация текста перед проверкой правилами. Задача — свести обходы фильтра
// («х*й», «с у к а», «cyka», «пиииздец», невидимые символы) к одной канонической форме.
// Нормализованный текст используется ТОЛЬКО для сопоставления с правилами — модели и
// родителю уходит исходный (или отредактированный) текст.

const INVISIBLE = /[­͏؜ᅟᅠ឴឵᠎​-‏‪-‮⁠-⁯ㅤ︀-️﻿]/g;

// Латиница и цифры, похожие на кириллицу. Применяется к слову, только если слово уже
// содержит кириллицу или целиком состоит из «похожих» символов — иначе обычные
// английские слова превращались бы в кириллическую кашу.
const HOMOGLYPHS: Record<string, string> = {
  a: 'а',
  b: 'б',
  c: 'с',
  e: 'е',
  h: 'н',
  k: 'к',
  m: 'м',
  n: 'п',
  o: 'о',
  p: 'р',
  r: 'г',
  t: 'т',
  u: 'и',
  x: 'х',
  y: 'у',
  '0': 'о',
  '3': 'з',
  '4': 'ч',
  '6': 'б',
  '@': 'а',
};

const CYRILLIC = /[а-я]/;
const LETTER = /[а-яa-z]/;

function convertToken(token: string): string {
  const hasCyrillic = CYRILLIC.test(token);
  const hasLetter = LETTER.test(token);
  if (!hasLetter) return token;
  const allMappable = [...token].every((ch) => !LETTER.test(ch) || ch in HOMOGLYPHS || CYRILLIC.test(ch));
  if (!hasCyrillic && !allMappable) return token;
  // Цифры внутри «чистого числа» не трогаем — только внутри слов.
  return [...token].map((ch) => HOMOGLYPHS[ch] ?? ch).join('');
}

// «с у к а», «с.у.к.а», «с-у-к-а» → «сука». Склеиваем серии из 3+ одиночных букв.
function joinSpacedLetters(text: string): string {
  return text.replace(
    /(?<![а-яa-z])[а-яa-z](?:[\s.\-_*|/\\,~+]{1,3}[а-яa-z](?![а-яa-z])){2,}/g,
    (run) => run.replace(/[^а-яa-z]/g, ''),
  );
}

export function normalizeText(input: string, { homoglyphs = true } = {}): string {
  let s = input.normalize('NFKC').replace(INVISIBLE, '').toLowerCase().replace(/ё/g, 'е');
  s = joinSpacedLetters(s);
  // Маскирующие символы внутри слова («х*й», «п#зда») превращаем в «*», чтобы правила
  // с явной поддержкой маски могли их поймать.
  s = s.replace(/(?<=[а-яa-z])[#$%^&]+(?=[а-яa-z])/g, '*');
  if (homoglyphs) {
    s = s
      .split(/(\s+)/)
      .map((part) => (/^\s+$/.test(part) ? part : convertToken(part)))
      .join('');
  }
  // «пиииздец» → «пиздец», «ааааа» → «а» (удвоенные буквы сохраняем: «ссора», «касса»).
  s = s.replace(/([а-яa-z])\1{2,}/g, '$1');
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Два варианта: с заменой латиницы-двойников на кириллицу («cyka» → «сука») и без неё —
 * иначе английские слова, целиком из «похожих» букв («porn»), превращались бы в
 * кириллицу и проходили мимо англоязычных правил.
 */
export function normalizeVariants(input: string): string[] {
  const withHomoglyphs = normalizeText(input);
  const latinKept = normalizeText(input, { homoglyphs: false });
  return withHomoglyphs === latinKept ? [withHomoglyphs] : [withHomoglyphs, latinKept];
}

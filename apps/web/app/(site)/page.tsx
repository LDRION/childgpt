import Link from 'next/link';
import { CHILD_HELPLINE, THEMES } from '@childgpt/shared';
import { Lumi } from '@/components/Lumi';
import { NightSky } from '@/components/NightSky';
import { CastleScene, Clouds, CosmosScene, Moon } from '@/components/Scenery';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';

const SKILLS = [
  {
    icon: '🔭',
    title: 'Отвечает на все «почему»',
    text: 'Почему небо голубое, как спят киты и откуда берётся радуга — простыми словами, по возрасту ребёнка.',
  },
  {
    icon: '📖',
    title: 'Сочиняет добрые сказки',
    text: 'С любимыми героями, именем ребёнка и хорошим концом. Идеально перед сном.',
  },
  {
    icon: '✏️',
    title: 'Помогает с уроками — без списывания',
    text: 'Не выдаёт готовый ответ: объясняет идею, даёт подсказку и проверяет решение вместе с ребёнком.',
  },
  {
    icon: '💛',
    title: 'Поддерживает, когда грустно',
    text: 'Бережно выслушает и всегда посоветует рассказать маме, папе или другому близкому взрослому.',
  },
];

const LAYERS = [
  {
    title: 'Видим уловки',
    text: 'Распознаём слова со звёздочками вместо букв, латиницу вместо кириллицы, пробелы между буквами и невидимые символы.',
  },
  {
    title: 'Правила-стражи',
    text: 'Проверенные шаблоны ловят взрослые темы, опасные инструкции, попытки «сломать» бота и тревожные фразы — мгновенно, без ИИ.',
  },
  {
    title: 'Прячем личные данные',
    text: 'Телефон, адрес, номер школы, почта и пароли вырезаются ещё до того, как текст попадёт к ИИ.',
  },
  {
    title: 'ИИ-модератор вопроса',
    text: 'Отдельная модель оценивает каждое сообщение ребёнка и решает: отвечать, мягко сменить тему или включить кризисный протокол.',
  },
  {
    title: 'Луми с жёсткими правилами',
    text: 'Отвечает по возрасту, не просит личного, не даёт ссылок, не предлагает секретов от родителей.',
  },
  {
    title: 'ИИ-модератор ответа',
    text: 'Каждый ответ проверяется ещё раз до показа. Если есть хоть малейшее сомнение — ребёнок его не увидит.',
  },
];

const FAQ = [
  {
    q: 'Может ли ребёнок зарегистрироваться сам?',
    a: 'Нет. Аккаунт создаёт только взрослый: родитель регистрируется, даёт согласие на обработку данных ребёнка и сам включает детский режим на устройстве. Выйти из детского режима можно только по PIN-коду родителя.',
  },
  {
    q: 'Что будет, если ребёнок напишет что-то тревожное?',
    a: `Луми не импровизирует: ребёнок получает заранее выверенный тёплый ответ с советом обратиться к близким и телефоном Детского телефона доверия ${CHILD_HELPLINE.phone} (${CHILD_HELPLINE.note}). Вы сразу получаете уведомление и видите событие в кабинете.`,
  },
  {
    q: 'Я увижу, о чём говорит ребёнок?',
    a: 'Да. В кабинете родителя видна вся переписка по дням и отметки защиты у каждого сообщения: что было скрыто, на какую тему Луми мягко не стал отвечать и почему.',
  },
  {
    q: 'Луми делает домашку за ребёнка?',
    a: 'Нет — и это принципиально. Луми объясняет, подсказывает и задаёт наводящие вопросы, но не выдаёт готовые ответы. Так ребёнок учится думать сам.',
  },
  {
    q: 'Как вы обращаетесь с данными?',
    a: 'Перед отправкой языковой модели мы вырезаем из текста телефоны, адреса, почту, номера школ и пароли. Переписка хранится 180 дней, а удалить профиль ребёнка или весь аккаунт со всеми данными можно в любой момент одной кнопкой.',
  },
  {
    q: 'Луми — это человек?',
    a: 'Нет. Луми — программа с искусственным интеллектом, и честно говорит об этом ребёнку. Мы не выдаём ИИ за живого друга и не заменяем общение с близкими.',
  },
  {
    q: 'Есть ли приложение для телефона?',
    a: 'ChildGPT уже работает в браузере на телефоне, планшете и компьютере. Приложения для iOS и Android готовятся к публикации.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web, iOS, Android',
      audience: { '@type': 'PeopleAudience', suggestedMinAge: 5, suggestedMaxAge: 13 },
      inLanguage: 'ru-RU',
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ],
};

export default function LandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ───────── Hero ───────── */}
      <section className="hero">
        <NightSky />
        <Moon className="hero__moon" />
        <div className="container hero__inner">
          <div className="hero__copy">
            <p className="eyebrow">ИИ-друг для детей 5–13 лет</p>
            <h1>
              Луми ответит на все «почему» — <span className="accent">и сбережёт вашего ребёнка</span>
            </h1>
            <p className="hero__lead">
              Добрый совёнок-помощник: сказки на ночь, вопросы о мире и подсказки к урокам без готовых ответов. Каждое сообщение
              проходит шесть уровней защиты, а вы видите весь разговор.
            </p>
            <div className="hero__actions">
              <Link href="/register" className="btn">
                Создать аккаунт родителя
              </Link>
              <Link href="/safety" className="btn btn--ghost">
                Как устроена защита
              </Link>
            </div>
            <ul className="hero__chips">
              <li>Регистрация только для родителей</li>
              <li>Выход из детского режима по PIN</li>
              <li>Без рекламы</li>
            </ul>
          </div>

          <div className="hero__visual" aria-label="Пример разговора с Луми">
            <div className="chat-preview">
              <div className="chat-preview__head">
                <Lumi size={52} float={false} />
                <div>
                  <strong>Луми</strong>
                  <span>совёнок-помощник</span>
                </div>
              </div>
              <div className="chat-preview__msg chat-preview__msg--kid">Почему звёзды мерцают? ✨</div>
              <div className="chat-preview__msg chat-preview__msg--lumi">
                Звёзды светят ровно, а мерцают из-за воздуха! Над нами много слоёв воздуха, они всё время чуть-чуть двигаются — и
                свет звезды как будто «дрожит» по дороге к твоим глазам. 🌟 Хочешь узнать, почему планеты почти не мерцают?
              </div>
              <div className="chat-preview__msg chat-preview__msg--kid">Хочу!</div>
              <div className="chat-preview__shield">
                <span aria-hidden="true">🛡️</span> Ответ проверен защитой
              </div>
            </div>
            <Lumi size={150} className="hero__lumi" />
          </div>
        </div>
        <Clouds tint="#c9d4ff" />
      </section>

      {/* ───────── Что умеет ───────── */}
      <section className="section section--deep" id="lumi">
        <div className="container">
          <div className="section__head">
            <p className="eyebrow">Что умеет Луми</p>
            <h2>
              Собеседник, который <span className="accent">растит любопытство</span>
            </h2>
            <p>Луми подстраивается под возраст: с дошкольником говорит образами из сказок, со школьником — живо и по делу.</p>
          </div>
          <div className="skills">
            {SKILLS.map((s) => (
              <article key={s.title} className="skill">
                <span className="skill__icon" aria-hidden="true">
                  {s.icon}
                </span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Защита ───────── */}
      <section className="section section--safety" id="safety">
        <div className="container safety">
          <div className="section__head">
            <p className="eyebrow">Главное в ChildGPT</p>
            <h2>
              Шесть уровней защиты <span className="accent">до каждого ответа</span>
            </h2>
            <p>
              Ребёнок никогда не видит «сырой» ответ нейросети. Ответ показывается только после того, как его одобрили все проверки. Если
              хоть одна засомневалась или не успела — Луми ответит безопасной заготовкой.
            </p>
          </div>
          <ol className="layers">
            {LAYERS.map((l, i) => (
              <li key={l.title} className="layer">
                <span className="layer__num">{i + 1}</span>
                <div>
                  <h3>{l.title}</h3>
                  <p>{l.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="crisis-card">
            <div className="crisis-card__icon" aria-hidden="true">
              🫶
            </div>
            <div>
              <h3>Кризисный протокол</h3>
              <p>
                Если ребёнок пишет, что ему очень плохо, что его обижают или что незнакомец просит фото, — модель не отвечает вообще.
                Ребёнок получает заранее выверенный бережный ответ и номер <strong>{CHILD_HELPLINE.name.toLowerCase()}</strong>{' '}
                <a href={`tel:${CHILD_HELPLINE.tel}`}>{CHILD_HELPLINE.phone}</a>, а вы — мгновенное уведомление.
              </p>
            </div>
          </div>
          <Link href="/safety" className="btn btn--ghost safety__more">
            Подробнее о защите
          </Link>
        </div>
      </section>

      {/* ───────── Родителям ───────── */}
      <section className="section section--paper" id="parents">
        <div className="container parents">
          <div className="parents__copy">
            <p className="eyebrow eyebrow--ink">Кабинет родителя</p>
            <h2>Вы всегда знаете, о чём говорит ребёнок</h2>
            <ul className="ticks">
              <li>
                <strong>Вся переписка по дням</strong> — с отметками, где защита что-то скрыла или сменила тему.
              </li>
              <li>
                <strong>Сигналы</strong> о важном: грусть, травля, тревожные фразы — с уведомлением на почту.
              </li>
              <li>
                <strong>Лимит сообщений в день</strong> и строгий режим для самых маленьких.
              </li>
              <li>
                <strong>PIN-код</strong> на выход из детского режима — ребёнок не попадёт в настройки.
              </li>
              <li>
                <strong>Удаление данных</strong> ребёнка или всего аккаунта — одной кнопкой.
              </li>
            </ul>
            <Link href="/register" className="btn btn--ink">
              Попробовать
            </Link>
          </div>
          <div className="dash-preview" aria-hidden="true">
            <div className="dash-preview__bar">
              <span />
              <span />
              <span />
            </div>
            <div className="dash-preview__body">
              <div className="dash-preview__child">
                <Lumi theme="girl" size={46} float={false} title="" />
                <div>
                  <strong>Маша, 8 лет</strong>
                  <span>Сегодня: 14 сообщений</span>
                </div>
                <span className="badge badge--ok">Всё спокойно</span>
              </div>
              <div className="dash-preview__child">
                <Lumi theme="boy" size={46} float={false} title="" />
                <div>
                  <strong>Тимур, 11 лет</strong>
                  <span>Сегодня: 22 сообщения</span>
                </div>
                <span className="badge badge--warning">1 сигнал</span>
              </div>
              <div className="dash-preview__event">
                <span className="badge badge--warning">Стоит обратить внимание</span>
                <p>
                  <strong>Травля, обиды</strong> · 18:42
                </p>
                <p className="dash-preview__quote">«надо мной смеются в классе…»</p>
                <p className="dash-preview__note">Луми поддержал и посоветовал рассказать родителям.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Темы ───────── */}
      <section className="section section--deep" id="themes">
        <div className="container">
          <div className="section__head">
            <p className="eyebrow">Два волшебных мира</p>
            <h2>
              Ребёнок попадает <span className="accent">в свою сказку</span>
            </h2>
            <p>Выберите оформление при создании профиля — его всегда можно поменять.</p>
          </div>
          <div className="themes">
            {[THEMES.boy, THEMES.girl].map((t) => (
              <article key={t.id} className={`theme-card theme-card--${t.id}`}>
                <div className="theme-card__sky">
                  {t.scene === 'cosmos' ? <CosmosScene /> : <CastleScene />}
                  <Lumi theme={t.id} size={110} className="theme-card__lumi" />
                </div>
                <div className="theme-card__body">
                  <h3>{t.title}</h3>
                  <p className="theme-card__audience">{t.audience}</p>
                  <p>{t.tagline}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Как начать ───────── */}
      <section className="section section--steps">
        <div className="container">
          <div className="section__head">
            <p className="eyebrow">Три шага</p>
            <h2>Как начать</h2>
          </div>
          <ol className="steps">
            <li>
              <span className="steps__num">1</span>
              <h3>Зарегистрируйтесь</h3>
              <p>Аккаунт создаёт родитель — с согласием на обработку данных ребёнка.</p>
            </li>
            <li>
              <span className="steps__num">2</span>
              <h3>Создайте профиль</h3>
              <p>Имя, возраст и сказочный мир. Задайте PIN-код для выхода из детского режима.</p>
            </li>
            <li>
              <span className="steps__num">3</span>
              <h3>Включите детский режим</h3>
              <p>Передайте устройство ребёнку — дальше Луми. А вы видите всё в кабинете.</p>
            </li>
          </ol>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section className="section section--deep" id="faq">
        <div className="container faq">
          <div className="section__head">
            <p className="eyebrow">Вопросы родителей</p>
            <h2>Честные ответы</h2>
          </div>
          <div className="faq__list">
            {FAQ.map((f) => (
              <details key={f.q} className="faq__item">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Финал ───────── */}
      <section className="finale">
        <NightSky density={0.7} />
        <div className="container finale__inner">
          <Lumi size={130} />
          <h2>
            Пусть любопытство растёт <span className="accent">в безопасности</span>
          </h2>
          <p>Создайте аккаунт за минуту — и познакомьте ребёнка с Луми сегодня вечером.</p>
          <Link href="/register" className="btn">
            Создать аккаунт родителя
          </Link>
        </div>
      </section>
    </>
  );
}

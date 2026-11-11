import { LEGAL_VERSIONS } from '@childgpt/shared';

// Реквизиты оператора. Заполнить до запуска (см. docs/LAUNCH.md).
export const OPERATOR = {
  name: '[ФИО индивидуального предпринимателя / наименование юрлица]',
  inn: '[ИНН]',
  ogrn: '[ОГРНИП / ОГРН]',
  address: '[почтовый адрес]',
};

export function LegalShell({ title, version, children }: { title: string; version: keyof typeof LEGAL_VERSIONS; children: React.ReactNode }) {
  const [y, m, d] = LEGAL_VERSIONS[version].split('-');
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>{title}</h1>
          <p>
            Редакция от {d}.{m}.{y}
          </p>
        </div>
      </section>
      <article className="prose">
        <div className="container">{children}</div>
      </article>
    </>
  );
}

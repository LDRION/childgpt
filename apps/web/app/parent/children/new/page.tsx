'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import type { ChildDTO } from '@childgpt/shared';
import { api } from '@/lib/api';
import { ChildForm } from '../../ChildForm';

function NewChild() {
  const welcome = useSearchParams().get('welcome') === '1';
  return (
    <>
      <Link href="/parent" className="pp-back">
        ← К обзору
      </Link>
      <section className="pp-card">
        <h1>{welcome ? 'Аккаунт готов! Теперь — профиль ребёнка' : 'Новый профиль ребёнка'}</h1>
        <p className="pp-muted">Луми подстроит ответы под возраст ребёнка и будет обращаться к нему по имени.</p>
        <ChildForm
          submitLabel="Создать профиль"
          onSubmit={async (values) => {
            const { child } = await api<{ child: ChildDTO }>('/parent/children', { body: values });
            window.location.href = `/parent/children/${child.id}?created=1`;
          }}
        />
      </section>
    </>
  );
}

export default function NewChildPage() {
  return (
    <Suspense>
      <NewChild />
    </Suspense>
  );
}

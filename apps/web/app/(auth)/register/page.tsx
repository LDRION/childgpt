import type { Metadata } from 'next';
import { RegisterForm } from './RegisterForm';

export const metadata: Metadata = {
  title: 'Регистрация родителя',
  description: 'Создайте аккаунт родителя, чтобы познакомить ребёнка с совёнком Луми.',
};

export default function RegisterPage() {
  return (
    <>
      <h1>Аккаунт родителя</h1>
      <p className="auth__sub">Регистрирует только взрослый. Профиль ребёнка вы создадите на следующем шаге.</p>
      <RegisterForm />
    </>
  );
}

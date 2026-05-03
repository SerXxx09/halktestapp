import Link from 'next/link';
import { loginAction } from '@/app/actions';

export default function LoginPage() {
  return (
    <main className="page">
      <section className="card authCard">
        <p className="eyebrow">Вход</p>
        <h1>Личный кабинет</h1>
        <p className="lead">Войдите, чтобы добавить результат, посмотреть таблицу спортсменов или перейти в админку.</p>

        <form className="form" action={loginAction}>
          <label>
            Email
            <input name="email" type="email" placeholder="name@example.com" required />
          </label>

          <label>
            Пароль
            <input name="password" type="password" placeholder="Минимум 8 символов" required />
          </label>

          <button className="primaryButton" type="submit">Войти</button>
        </form>

        <p className="mutedText">
          Нет аккаунта? <Link href="/register">Зарегистрироваться</Link>
        </p>
      </section>
    </main>
  );
}

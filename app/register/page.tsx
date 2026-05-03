import Link from 'next/link';
import { registerAction } from '@/app/actions';

export default function RegisterPage() {
  return (
    <main className="page">
      <section className="card authCard">
        <p className="eyebrow">Регистрация</p>
        <h1>Новый аккаунт</h1>
        <p className="lead">Создайте аккаунт спортсмена. Админская роль назначается автоматически по email из ADMIN_EMAILS.</p>

        <form className="form" action={registerAction}>
          <label>
            Имя / ФИО
            <input name="name" type="text" placeholder="Иван Иванов" required />
          </label>

          <label>
            Email
            <input name="email" type="email" placeholder="name@example.com" required />
          </label>

          <label>
            Пароль
            <input name="password" type="password" placeholder="Минимум 8 символов" minLength={8} required />
          </label>

          <button className="primaryButton" type="submit">Создать аккаунт</button>
        </form>

        <p className="mutedText">
          Уже есть аккаунт? <Link href="/login">Войти</Link>
        </p>
      </section>
    </main>
  );
}

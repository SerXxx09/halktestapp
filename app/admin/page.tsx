import Link from 'next/link';
import { adminUpdateResultAction, logoutAction } from '@/app/actions';
import { requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';

type AdminResultRow = {
  id: number;
  athlete_name: string;
  athlete_email: string;
  discipline: string;
  result_value: string;
  video_url: string;
  status: string;
  admin_comment: string | null;
  created_at: string;
};

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'На проверке',
    approved: 'Подтверждено',
    rejected: 'Отклонено',
    corrected: 'Исправлено админом'
  };

  return labels[status] || status;
}

export default async function AdminPage() {
  const user = await requireAdmin();
  const results = await query<AdminResultRow>(
    `select r.*, u.name as athlete_name, u.email as athlete_email
     from results r
     join users u on u.id = r.user_id
     order by
       case r.status when 'pending' then 0 when 'rejected' then 1 when 'corrected' then 2 else 3 end,
       r.created_at desc`
  );

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Админ-панель</p>
          <h1>Проверка результатов</h1>
          <p className="mutedText">Администратор: {user.name} · {user.email}</p>
        </div>
        <nav className="navActions">
          <Link href="/dashboard">Кабинет</Link>
          <form action={logoutAction}>
            <button className="secondaryButton" type="submit">Выйти</button>
          </form>
        </nav>
      </header>

      <section className="panel">
        <h2>Все заявки</h2>
        <div className="adminList">
          {results.rows.length === 0 ? <p className="mutedText">Результатов пока нет.</p> : null}
          {results.rows.map((item) => (
            <article className="adminCard" key={item.id}>
              <div className="miniCardHeader">
                <div>
                  <strong>{item.athlete_name}</strong>
                  <p className="mutedText">{item.athlete_email}</p>
                </div>
                <span className={`badge ${item.status}`}>{statusLabel(item.status)}</span>
              </div>

              <form className="resultForm adminForm" action={adminUpdateResultAction}>
                <input type="hidden" name="id" value={item.id} />
                <label>
                  Дисциплина
                  <input name="discipline" defaultValue={item.discipline} required />
                </label>
                <label>
                  Результат
                  <input name="result_value" defaultValue={item.result_value} required />
                </label>
                <label>
                  Статус
                  <select name="status" defaultValue={item.status} required>
                    <option value="pending">На проверке</option>
                    <option value="approved">Подтверждено</option>
                    <option value="rejected">Отклонено</option>
                    <option value="corrected">Исправлено админом</option>
                  </select>
                </label>
                <label className="wideField">
                  Ссылка на видео
                  <input name="video_url" type="url" defaultValue={item.video_url} required />
                </label>
                <label className="wideField">
                  Комментарий администратора
                  <textarea name="admin_comment" defaultValue={item.admin_comment || ''} rows={3} />
                </label>
                <div className="wideField formFooter">
                  <a href={item.video_url} target="_blank" rel="noreferrer">Открыть видео</a>
                  <button className="primaryButton" type="submit">Сохранить изменения</button>
                </div>
              </form>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

import Link from 'next/link';
import { createResultAction, logoutAction, updateOwnResultAction } from '@/app/actions';
import { requireUser } from '@/lib/auth';
import { query } from '@/lib/db';

type ResultRow = {
  id: number;
  user_id: number;
  athlete_name: string;
  discipline: string;
  result_value: string;
  video_url: string;
  status: string;
  admin_comment: string | null;
  created_at: string;
  updated_at: string;
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

export default async function DashboardPage() {
  const user = await requireUser();
  const results = await query<ResultRow>(
    `select r.*, u.name as athlete_name
     from results r
     join users u on u.id = r.user_id
     order by r.created_at desc`
  );

  const ownResults = results.rows.filter((item) => item.user_id === user.id);

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Кабинет спортсмена</p>
          <h1>Здравствуйте, {user.name}</h1>
        </div>
        <nav className="navActions">
          {user.role === 'admin' ? <Link href="/admin">Админка</Link> : null}
          <form action={logoutAction}>
            <button className="secondaryButton" type="submit">Выйти</button>
          </form>
        </nav>
      </header>

      <section className="panel">
        <h2>Добавить результат</h2>
        <form className="resultForm" action={createResultAction}>
          <label>
            Дисциплина
            <input name="discipline" placeholder="Например: 100 м, подтягивания, прыжок" required />
          </label>
          <label>
            Результат
            <input name="result_value" placeholder="Например: 12.45 сек / 25 раз" required />
          </label>
          <label className="wideField">
            Ссылка на видео
            <input name="video_url" type="url" placeholder="https://disk.yandex.ru/..." required />
          </label>
          <button className="primaryButton" type="submit">Отправить на проверку</button>
        </form>
      </section>

      <section className="panel">
        <h2>Мои результаты</h2>
        <div className="cardsGrid">
          {ownResults.length === 0 ? <p className="mutedText">Вы пока не добавили ни одного результата.</p> : null}
          {ownResults.map((item) => (
            <article className="miniCard" key={item.id}>
              <div className="miniCardHeader">
                <strong>{item.discipline}</strong>
                <span className={`badge ${item.status}`}>{statusLabel(item.status)}</span>
              </div>
              <p><b>Результат:</b> {item.result_value}</p>
              <p><a href={item.video_url} target="_blank" rel="noreferrer">Открыть видео</a></p>
              {item.admin_comment ? <p className="mutedText">Комментарий: {item.admin_comment}</p> : null}

              {['pending', 'rejected'].includes(item.status) ? (
                <details>
                  <summary>Редактировать</summary>
                  <form className="form compactForm" action={updateOwnResultAction}>
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
                      Ссылка на видео
                      <input name="video_url" type="url" defaultValue={item.video_url} required />
                    </label>
                    <button className="secondaryButton" type="submit">Сохранить</button>
                  </form>
                </details>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Общая таблица результатов</h2>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Спортсмен</th>
                <th>Дисциплина</th>
                <th>Результат</th>
                <th>Статус</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {results.rows.map((item) => (
                <tr key={item.id}>
                  <td>{item.athlete_name}</td>
                  <td>{item.discipline}</td>
                  <td>{item.result_value}</td>
                  <td><span className={`badge ${item.status}`}>{statusLabel(item.status)}</span></td>
                  <td>{new Date(item.created_at).toLocaleDateString('ru-RU')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

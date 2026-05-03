'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  clearSessionCookie,
  hashPassword,
  requireAdmin,
  requireUser,
  roleForEmail,
  setSessionCookie,
  verifyPassword,
  type CurrentUser
} from '@/lib/auth';
import { query } from '@/lib/db';

type UserWithPassword = CurrentUser & {
  password_hash: string;
};

function requiredString(formData: FormData, key: string) {
  const value = String(formData.get(key) || '').trim();

  if (!value) {
    throw new Error(`Поле ${key} обязательно.`);
  }

  return value;
}

export async function registerAction(formData: FormData) {
  const name = requiredString(formData, 'name');
  const email = requiredString(formData, 'email').toLowerCase();
  const password = requiredString(formData, 'password');

  if (password.length < 8) {
    throw new Error('Пароль должен быть не короче 8 символов.');
  }

  const role = roleForEmail(email);
  const passwordHash = hashPassword(password);

  const result = await query<CurrentUser>(
    `insert into users (email, password_hash, name, role)
     values ($1, $2, $3, $4)
     returning id, email, name, role`,
    [email, passwordHash, name, role]
  );

  setSessionCookie(result.rows[0]);
  redirect(role === 'admin' ? '/admin' : '/dashboard');
}

export async function loginAction(formData: FormData) {
  const email = requiredString(formData, 'email').toLowerCase();
  const password = requiredString(formData, 'password');

  const result = await query<UserWithPassword>(
    `select id, email, name, role, password_hash from users where email = $1 limit 1`,
    [email]
  );

  const user = result.rows[0];

  if (!user || !verifyPassword(password, user.password_hash)) {
    throw new Error('Неверный email или пароль.');
  }

  setSessionCookie({ id: user.id, email: user.email, name: user.name, role: user.role });
  redirect(user.role === 'admin' ? '/admin' : '/dashboard');
}

export async function logoutAction() {
  clearSessionCookie();
  redirect('/login');
}

export async function createResultAction(formData: FormData) {
  const user = await requireUser();
  const discipline = requiredString(formData, 'discipline');
  const resultValue = requiredString(formData, 'result_value');
  const videoUrl = requiredString(formData, 'video_url');

  const created = await query<{ id: number }>(
    `insert into results (user_id, discipline, result_value, video_url, status)
     values ($1, $2, $3, $4, 'pending')
     returning id`,
    [user.id, discipline, resultValue, videoUrl]
  );

  await query(
    `insert into audit_log (actor_id, result_id, action, new_value)
     values ($1, $2, 'create_result', $3::jsonb)`,
    [user.id, created.rows[0].id, JSON.stringify({ discipline, resultValue, videoUrl })]
  );

  revalidatePath('/dashboard');
  redirect('/dashboard');
}

export async function updateOwnResultAction(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get('id'));
  const discipline = requiredString(formData, 'discipline');
  const resultValue = requiredString(formData, 'result_value');
  const videoUrl = requiredString(formData, 'video_url');

  if (!Number.isFinite(id)) {
    throw new Error('Некорректный ID результата.');
  }

  const before = await query(
    `select * from results where id = $1 and user_id = $2 limit 1`,
    [id, user.id]
  );

  if (!before.rows[0]) {
    throw new Error('Результат не найден или не принадлежит текущему пользователю.');
  }

  if (!['pending', 'rejected'].includes(before.rows[0].status)) {
    throw new Error('Подтверждённые результаты может менять только администратор.');
  }

  const updated = await query(
    `update results
     set discipline = $1, result_value = $2, video_url = $3, status = 'pending', updated_at = now()
     where id = $4 and user_id = $5
     returning *`,
    [discipline, resultValue, videoUrl, id, user.id]
  );

  await query(
    `insert into audit_log (actor_id, result_id, action, old_value, new_value)
     values ($1, $2, 'update_own_result', $3::jsonb, $4::jsonb)`,
    [user.id, id, JSON.stringify(before.rows[0]), JSON.stringify(updated.rows[0])]
  );

  revalidatePath('/dashboard');
  redirect('/dashboard');
}

export async function adminUpdateResultAction(formData: FormData) {
  const user = await requireAdmin();
  const id = Number(formData.get('id'));
  const discipline = requiredString(formData, 'discipline');
  const resultValue = requiredString(formData, 'result_value');
  const videoUrl = requiredString(formData, 'video_url');
  const status = requiredString(formData, 'status');
  const adminComment = String(formData.get('admin_comment') || '').trim();

  if (!Number.isFinite(id)) {
    throw new Error('Некорректный ID результата.');
  }

  if (!['pending', 'approved', 'rejected', 'corrected'].includes(status)) {
    throw new Error('Некорректный статус.');
  }

  const before = await query(`select * from results where id = $1 limit 1`, [id]);

  if (!before.rows[0]) {
    throw new Error('Результат не найден.');
  }

  const updated = await query(
    `update results
     set discipline = $1, result_value = $2, video_url = $3, status = $4, admin_comment = $5, updated_at = now()
     where id = $6
     returning *`,
    [discipline, resultValue, videoUrl, status, adminComment || null, id]
  );

  await query(
    `insert into audit_log (actor_id, result_id, action, old_value, new_value)
     values ($1, $2, 'admin_update_result', $3::jsonb, $4::jsonb)`,
    [user.id, id, JSON.stringify(before.rows[0]), JSON.stringify(updated.rows[0])]
  );

  revalidatePath('/admin');
  revalidatePath('/dashboard');
  redirect('/admin');
}

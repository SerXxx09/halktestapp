import { query } from './db';

export async function setupSchema() {
  await query(`
    create table if not exists users (
      id bigserial primary key,
      email text not null unique,
      password_hash text not null,
      name text not null,
      role text not null check (role in ('athlete', 'admin')) default 'athlete',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);

  await query(`
    create table if not exists results (
      id bigserial primary key,
      user_id bigint not null references users(id) on delete cascade,
      discipline text not null,
      result_value text not null,
      video_url text not null,
      status text not null check (status in ('pending', 'approved', 'rejected', 'corrected')) default 'pending',
      admin_comment text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);

  await query(`
    create table if not exists audit_log (
      id bigserial primary key,
      actor_id bigint references users(id) on delete set null,
      result_id bigint references results(id) on delete cascade,
      action text not null,
      old_value jsonb,
      new_value jsonb,
      created_at timestamptz not null default now()
    );
  `);

  await query(`create index if not exists idx_results_user_id on results(user_id);`);
  await query(`create index if not exists idx_results_status on results(status);`);
  await query(`create index if not exists idx_results_created_at on results(created_at desc);`);
}

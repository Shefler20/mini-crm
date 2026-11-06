-- Роли пользователей
create type public.user_role as enum (
  'manager',
  'executor'
);

-- Статусы задач
create type public.task_status as enum (
  'new',
  'in_progress',
  'in_review',
  'accepted',
  'rework'
);

-- Профили пользователей
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.user_role not null default 'executor',
  created_at timestamptz not null default now()
);

-- Строительные объекты
create table public.objects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Задачи
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  object_id uuid not null references public.objects(id) on delete cascade,
  executor_id uuid not null references public.profiles(id),
  author_id uuid not null references public.profiles(id),
  status public.task_status not null default 'new',
  created_at timestamptz not null default now()
);

-- История изменений статусов
create table public.task_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  changed_by uuid references public.profiles(id),
  old_status public.task_status,
  new_status public.task_status not null,
  comment text,
  created_at timestamptz not null default now()
);

-- Индексы для ускорения поиска
create index idx_tasks_object_id
  on public.tasks(object_id);

create index idx_tasks_executor_id
  on public.tasks(executor_id);

create index idx_task_history_task_id
  on public.task_history(task_id);

-- Включаем Row Level Security на всех таблицах
alter table public.profiles enable row level security;
alter table public.objects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_history enable row level security;
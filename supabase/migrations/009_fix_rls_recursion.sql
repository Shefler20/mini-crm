-- Создаём закрытую схему для внутренних функций безопасности
create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;

grant usage on schema private to authenticated;


-- 1. Проверяем, что пользователь действительно исполнитель
create or replace function private.is_executor_profile(
  p_profile_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_profile_id
      and p.role = 'executor'::public.user_role
  );
$$;


-- 2. Проверяем, назначена ли задача текущему пользователю
create or replace function private.is_task_assigned_to_current_user(
  p_task_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tasks t
    where t.id = p_task_id
      and t.executor_id = (select auth.uid())
  );
$$;


-- 3. Проверяем, участвовал ли пользователь в истории
-- задачи, назначенной текущему исполнителю
create or replace function private.can_view_profile_for_task_history(
  p_profile_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.task_history h
    join public.tasks t
      on t.id = h.task_id
    where h.changed_by = p_profile_id
      and t.executor_id = (select auth.uid())
  );
$$;


-- Ограничиваем вызов вспомогательных функций
revoke all on function private.is_executor_profile(uuid)
from public, anon, authenticated;

revoke all on function private.is_task_assigned_to_current_user(uuid)
from public, anon, authenticated;

revoke all on function private.can_view_profile_for_task_history(uuid)
from public, anon, authenticated;

grant execute on function private.is_executor_profile(uuid)
to authenticated;

grant execute on function private.is_task_assigned_to_current_user(uuid)
to authenticated;

grant execute on function private.can_view_profile_for_task_history(uuid)
to authenticated;


-- 4. Исправляем политику создания задач
drop policy if exists "Managers can create tasks"
on public.tasks;

create policy "Managers can create tasks"
on public.tasks
for insert
to authenticated
with check (
  public.current_user_role() = 'manager'
  and author_id = (select auth.uid())
  and status = 'new'
  and private.is_executor_profile(executor_id)
);


-- 5. Исправляем политику редактирования задач
drop policy if exists "Managers can update tasks"
on public.tasks;

create policy "Managers can update tasks"
on public.tasks
for update
to authenticated
using (
  public.current_user_role() = 'manager'
)
with check (
  public.current_user_role() = 'manager'
  and private.is_executor_profile(executor_id)
);


-- 6. Исправляем доступ исполнителя к истории
drop policy if exists "Executors can view history of assigned tasks"
on public.task_history;

create policy "Executors can view history of assigned tasks"
on public.task_history
for select
to authenticated
using (
  private.is_task_assigned_to_current_user(task_id)
);


-- 7. Исправляем доступ исполнителя к профилям авторов истории
drop policy if exists "Executors can view profiles of assigned task history actors"
on public.profiles;

create policy "Executors can view profiles of assigned task history actors"
on public.profiles
for select
to authenticated
using (
  public.current_user_role() = 'executor'
  and private.can_view_profile_for_task_history(id)
);
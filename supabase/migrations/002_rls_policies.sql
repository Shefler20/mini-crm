create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid())
$$;

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;

-- Разрешаем авторизованным пользователям обращаться к таблицам
grant usage on schema public to authenticated;

-- Профили: только чтение
grant select on public.profiles to authenticated;

-- Объекты: чтение и операции изменения
grant select, insert, update, delete
on public.objects to authenticated;

-- Задачи: чтение
grant select on public.tasks to authenticated;

-- Запрещаем прямое изменение задач
revoke insert, update, delete
on public.tasks from authenticated;

-- Постановщик сможет создавать задачи,
-- но не сможет напрямую задавать статус
grant insert (
  title,
  description,
  object_id,
  executor_id,
  author_id
)
on public.tasks to authenticated;

-- Изменять можно только содержимое задачи,
-- но не её статус
grant update (
  title,
  description,
  object_id,
  executor_id
)
on public.tasks to authenticated;

-- История доступна только для чтения
grant select on public.task_history to authenticated;

revoke insert, update, delete
on public.task_history from authenticated;

create policy "Users can read allowed profiles"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or public.current_user_role() = 'manager'
);

create policy "Managers can manage objects"
on public.objects
for all
to authenticated
using (
  public.current_user_role() = 'manager'
)
with check (
  public.current_user_role() = 'manager'
);

create policy "Executors can view assigned objects"
on public.objects
for select
to authenticated
using (
  exists (
    select 1
    from public.tasks t
    where t.object_id = objects.id
      and t.executor_id = (select auth.uid())
  )
);

create policy "Managers can manage tasks"
on public.tasks
for all
to authenticated
using (
  public.current_user_role() = 'manager'
)
with check (
  public.current_user_role() = 'manager'
);

create policy "Executors can view own tasks"
on public.tasks
for select
to authenticated
using (
  executor_id = (select auth.uid())
);

create policy "Managers can view all task history"
on public.task_history
for select
to authenticated
using (
  public.current_user_role() = 'manager'
);

create policy "Executors can view own task history"
on public.task_history
for select
to authenticated
using (
  exists (
    select 1
    from public.tasks t
    where t.id = task_history.task_id
      and t.executor_id = (select auth.uid())
  )
);
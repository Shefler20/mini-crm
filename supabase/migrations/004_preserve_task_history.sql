-- Добавляем снимок названия задачи и исполнителя
alter table public.task_history
add column executor_id uuid references public.profiles(id) on delete set null,
add column task_title text not null default 'Задача';

-- Заполняем новые поля для уже существующей истории
update public.task_history h
set
  executor_id = t.executor_id,
  task_title = t.title
from public.tasks t
where h.task_id = t.id;

-- Разрешаем сохранить историю без существующей задачи
alter table public.task_history
alter column task_id drop not null;

-- Меняем поведение внешнего ключа:
-- при удалении задачи task_id в истории станет NULL
alter table public.task_history
drop constraint task_history_task_id_fkey;

alter table public.task_history
add constraint task_history_task_id_fkey
foreign key (task_id)
references public.tasks(id)
on delete set null;

-- Исполнитель сможет читать историю,
-- которая относится к назначенным ему задачам
drop policy if exists "Executors can view own task history"
on public.task_history;

create policy "Executors can view own task history"
on public.task_history
for select
to authenticated
using (
  executor_id = (select auth.uid())
);

-- Повторно устанавливаем явные права доступа к таблицам
revoke all privileges on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

revoke all privileges on public.objects from anon, authenticated;
grant select, insert, update, delete
on public.objects to authenticated;

revoke all privileges on public.tasks from anon, authenticated;
grant select on public.tasks to authenticated;

grant insert (
  title,
  description,
  object_id,
  executor_id,
  author_id
)
on public.tasks to authenticated;

grant update (
  title,
  description,
  object_id,
  executor_id
)
on public.tasks to authenticated;

grant delete on public.tasks to authenticated;

revoke all privileges on public.task_history from anon, authenticated;
grant select on public.task_history to authenticated;

-- Обновляем функцию перехода статусов,
-- чтобы она сохраняла снимок названия и исполнителя
create or replace function public.transition_task(
  p_task_id uuid,
  p_new_status public.task_status,
  p_comment text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task public.tasks%rowtype;
  v_role public.user_role;
  v_user_id uuid;
  v_allowed boolean := false;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select p.role
  into v_role
  from public.profiles p
  where p.id = v_user_id;

  if v_role is null then
    raise exception 'User profile not found';
  end if;

  select *
  into v_task
  from public.tasks t
  where t.id = p_task_id
  for update;

  if not found then
    raise exception 'Task not found';
  end if;

  if v_role = 'manager' then
    v_allowed :=
      v_task.status = 'in_review'
      and p_new_status in ('accepted', 'rework');

  elsif v_role = 'executor' then

    if v_task.executor_id <> v_user_id then
      raise exception 'You are not assigned to this task';
    end if;

    v_allowed :=
      (v_task.status = 'new' and p_new_status = 'in_progress')
      or
      (v_task.status = 'in_progress' and p_new_status = 'in_review')
      or
      (v_task.status = 'rework' and p_new_status = 'in_progress');
  end if;

  if not v_allowed then
    raise exception 'Status transition is not allowed';
  end if;

  if p_new_status = 'rework'
     and nullif(trim(p_comment), '') is null then
    raise exception 'Comment is required for rework';
  end if;

  update public.tasks
  set status = p_new_status
  where id = p_task_id;

  insert into public.task_history (
    task_id,
    task_title,
    executor_id,
    changed_by,
    old_status,
    new_status,
    comment
  )
  values (
    p_task_id,
    v_task.title,
    v_task.executor_id,
    v_user_id,
    v_task.status,
    p_new_status,
    nullif(trim(p_comment), '')
  );
end;
$$;
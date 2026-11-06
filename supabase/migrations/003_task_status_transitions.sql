-- Функция безопасной смены статуса задачи
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

  -- Проверяем разрешённые переходы для постановщика
  if v_role = 'manager' then
    v_allowed :=
      v_task.status = 'in_review'
      and p_new_status in ('accepted', 'rework');

  -- Проверяем разрешённые переходы для исполнителя
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

  -- Комментарий обязателен при возврате на доработку
  if p_new_status = 'rework'
     and nullif(trim(p_comment), '') is null then
    raise exception 'Comment is required for rework';
  end if;

  -- Меняем статус
  update public.tasks
  set status = p_new_status
  where id = p_task_id;

  -- Записываем историю
  insert into public.task_history (
    task_id,
    changed_by,
    old_status,
    new_status,
    comment
  )
  values (
    p_task_id,
    v_user_id,
    v_task.status,
    p_new_status,
    nullif(trim(p_comment), '')
  );
end;
$$;

-- Запрещаем вызов функции неавторизованными пользователями
revoke all on function public.transition_task(
  uuid,
  public.task_status,
  text
) from public, anon;

grant execute on function public.transition_task(
  uuid,
  public.task_status,
  text
) to authenticated;

-- Постановщик может удалять задачи
grant delete on public.tasks to authenticated;
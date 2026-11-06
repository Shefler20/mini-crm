-- Функция записи создания задачи в историю
create or replace function public.record_task_creation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
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
    new.id,
    new.title,
    new.executor_id,
    new.author_id,
    null,
    new.status,
    null
  );

  return new;
end;
$$;

-- Обычные пользователи не должны вызывать эту функцию напрямую
revoke all on function public.record_task_creation()
from public, anon, authenticated;

-- Триггер автоматической записи истории
drop trigger if exists task_creation_history on public.tasks;

create trigger task_creation_history
after insert on public.tasks
for each row
execute function public.record_task_creation();
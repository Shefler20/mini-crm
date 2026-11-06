-- История доступна текущему исполнителю задачи
drop policy if exists "Executors can view own task history"
on public.task_history;

create policy "Executors can view history of assigned tasks"
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

-- Исполнитель видит имена авторов истории
-- только своих текущих задач
drop policy if exists "Executors can view profiles of own task history actors"
on public.profiles;

create policy "Executors can view profiles of assigned task history actors"
on public.profiles
for select
to authenticated
using (
  public.current_user_role() = 'executor'
  and exists (
    select 1
    from public.task_history h
    where h.changed_by = profiles.id
      and exists (
        select 1
        from public.tasks t
        where t.id = h.task_id
          and t.executor_id = (select auth.uid())
      )
  )
);
create policy "Executors can view profiles of own task history actors"
on public.profiles
for select
to authenticated
using (
  public.current_user_role() = 'executor'
  and exists (
    select 1
    from public.task_history h
    where h.changed_by = profiles.id
      and h.executor_id = (select auth.uid())
  )
);
-- Удаляем прежнюю общую политику управления задачами
drop policy if exists "Managers can manage tasks"
on public.tasks;

-- Постановщик может читать все задачи
create policy "Managers can view all tasks"
on public.tasks
for select
to authenticated
using (
  public.current_user_role() = 'manager'
);

-- Создавать задачи может только постановщик.
-- Автором должен быть текущий пользователь.
-- Начальный статус — только new.
-- Назначенный пользователь должен иметь роль executor.
create policy "Managers can create tasks"
on public.tasks
for insert
to authenticated
with check (
  public.current_user_role() = 'manager'
  and author_id = (select auth.uid())
  and status = 'new'
  and exists (
    select 1
    from public.profiles p
    where p.id = tasks.executor_id
      and p.role = 'executor'
  )
);

-- Постановщик может редактировать задачи,
-- но назначать исполнителем можно только executor.
create policy "Managers can update tasks"
on public.tasks
for update
to authenticated
using (
  public.current_user_role() = 'manager'
)
with check (
  public.current_user_role() = 'manager'
  and exists (
    select 1
    from public.profiles p
    where p.id = tasks.executor_id
      and p.role = 'executor'
  )
);

-- Удалять задачи может только постановщик
create policy "Managers can delete tasks"
on public.tasks
for delete
to authenticated
using (
  public.current_user_role() = 'manager'
);
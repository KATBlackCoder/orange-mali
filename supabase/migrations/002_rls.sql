alter table profiles enable row level security;
alter table forms enable row level security;
alter table form_fields enable row level security;
alter table submissions enable row level security;
alter table submission_rows enable row level security;
alter table row_values enable row level security;

-- Helper: rôle de l'utilisateur connecté
create or replace function current_role_name()
returns user_role as $$
  select role from profiles where id = auth.uid()
$$ language sql security definer;

-- Profiles
create policy "profiles_select" on profiles for select
  using (
    id = auth.uid()
    or parent_id = auth.uid()
    or exists (
      select 1 from profiles p2
      where p2.id = profiles.parent_id
      and p2.parent_id = auth.uid()
    )
    or current_role_name() in ('chef', 'sous_chef')
  );

-- Forms
create policy "forms_select" on forms for select using (actif = true);
create policy "forms_insert" on forms for insert
  with check (current_role_name() in ('chef', 'sous_chef'));
create policy "forms_update" on forms for update
  using (current_role_name() in ('chef', 'sous_chef'));

-- Form fields
create policy "fields_select" on form_fields for select
  using (exists (select 1 from forms f where f.id = form_id and f.actif = true));
create policy "fields_manage" on form_fields for all
  using (current_role_name() in ('chef', 'sous_chef'));

-- Submissions
create policy "submissions_select" on submissions for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = submissions.user_id
      and (p.parent_id = auth.uid()
           or current_role_name() in ('chef', 'sous_chef'))
    )
  );
create policy "submissions_insert" on submissions for insert
  with check (user_id = auth.uid());
create policy "submissions_update" on submissions for update
  using (
    (user_id = auth.uid() and statut = 'brouillon')
    or current_role_name() in ('chef', 'sous_chef', 'superviseur')
  );

-- Submission rows
create policy "rows_all" on submission_rows for all
  using (exists (
    select 1 from submissions s where s.id = submission_id
    and (s.user_id = auth.uid() or current_role_name() in ('chef','sous_chef','superviseur'))
  ));

-- Row values
create policy "values_all" on row_values for all
  using (exists (
    select 1 from submission_rows sr
    join submissions s on s.id = sr.submission_id
    where sr.id = row_id
    and (s.user_id = auth.uid() or current_role_name() in ('chef','sous_chef','superviseur'))
  ));

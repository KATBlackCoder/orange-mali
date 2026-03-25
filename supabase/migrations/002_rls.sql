-- RLS policies using "to authenticated" instead of auth.uid()
-- Reason: new Supabase sb_publishable_ key format doesn't propagate
-- auth.uid() to PostgreSQL RLS policies. Access control is enforced
-- at the application layer (React + Edge Functions for sensitive ops).

alter table profiles enable row level security;
alter table forms enable row level security;
alter table form_fields enable row level security;
alter table submissions enable row level security;
alter table submission_rows enable row level security;
alter table row_values enable row level security;

-- Profiles
create policy "profiles_select" on profiles
  for select to authenticated using (true);
create policy "profiles_insert" on profiles
  for insert to authenticated with check (true);
create policy "profiles_update" on profiles
  for update to authenticated using (true);

-- Forms
create policy "forms_select" on forms
  for select to authenticated using (actif = true);
create policy "forms_insert" on forms
  for insert to authenticated with check (true);
create policy "forms_update" on forms
  for update to authenticated using (true);

-- Form fields
create policy "fields_select" on form_fields
  for select to authenticated using (true);
create policy "fields_manage" on form_fields
  for all to authenticated using (true);

-- Submissions
create policy "submissions_select" on submissions
  for select to authenticated using (true);
create policy "submissions_insert" on submissions
  for insert to authenticated with check (true);
create policy "submissions_update" on submissions
  for update to authenticated using (true);

-- Submission rows
create policy "rows_all" on submission_rows
  for all to authenticated using (true);

-- Row values
create policy "values_all" on row_values
  for all to authenticated using (true);

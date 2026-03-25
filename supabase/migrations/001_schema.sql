-- Roles enum
create type user_role as enum ('chef', 'sous_chef', 'superviseur', 'employe');

-- Users (étend auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nom text not null,
  telephone text unique not null,
  role user_role not null default 'employe',
  zone text,
  parent_id uuid references profiles(id),
  actif boolean default true,
  created_at timestamptz default now()
);

-- Formulaires configurables
create table forms (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  description text,
  created_by uuid references profiles(id),
  actif boolean default true,
  created_at timestamptz default now()
);

-- Champs des formulaires
create table form_fields (
  id uuid primary key default gen_random_uuid(),
  form_id uuid references forms(id) on delete cascade,
  label text not null,
  type text not null check (type in ('text', 'number', 'tel', 'select', 'date')),
  options jsonb,
  requis boolean default false,
  ordre int not null,
  created_at timestamptz default now()
);

-- Soumissions (groupe de lignes)
create table submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid references forms(id),
  user_id uuid references profiles(id),
  statut text default 'brouillon' check (statut in ('brouillon', 'soumis', 'valide', 'rejete')),
  commentaire text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Lignes individuelles d'une soumission
create table submission_rows (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade,
  ordre int not null,
  created_at timestamptz default now()
);

-- Valeurs par champ pour chaque ligne
create table row_values (
  id uuid primary key default gen_random_uuid(),
  row_id uuid references submission_rows(id) on delete cascade,
  field_id uuid references form_fields(id),
  valeur text,
  created_at timestamptz default now()
);

-- Indexes
create index on submissions(user_id);
create index on submissions(form_id, statut);
create index on submission_rows(submission_id);
create index on row_values(row_id);

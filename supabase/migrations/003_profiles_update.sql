-- Mise à jour de la table profiles
alter table profiles rename column nom to first_name;
alter table profiles add column last_name text not null default '';
alter table profiles add column email text;
alter table profiles add column must_change_password boolean not null default true;

-- Supprimer le default temporaire sur last_name
alter table profiles alter column last_name drop default;

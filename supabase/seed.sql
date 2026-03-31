-- =============================================================
-- SEED — Orange Mali PWA — Données de test
-- Exécuter dans : Supabase Dashboard → SQL Editor → Run
--
-- Crée :
--   1 chef        | téléphone 70000000 | mot de passe ML70000000
--   2 sous-chefs  | téléphone 70000001-02 | mot de passe ML700000XX
--  10 superviseurs | téléphone 70100001-10 | mot de passe ML701000XX
--  60 employés    | téléphone 70200001-60 | mot de passe ML702000XX
--   2 formulaires avec champs
--  20 soumissions de test (statuts variés, dates variées)
--
-- Pour tout supprimer : exécuter le bloc DELETE en bas de ce fichier
-- =============================================================

DO $$
DECLARE
  -- IDs fixes pour les rôles principaux (pour pouvoir se connecter)
  chef_id    uuid := 'a0000000-0000-0000-0000-000000000001';
  sc1_id     uuid := 'a0000000-0000-0000-0000-000000000002';
  sc2_id     uuid := 'a0000000-0000-0000-0000-000000000003';

  -- Tableaux d'IDs pour superviseurs et employés
  sup_ids    uuid[];
  emp_ids    uuid[];

  -- IDs formulaires et champs
  form1_id   uuid := 'b0000000-0000-0000-0000-000000000001';
  form2_id   uuid := 'b0000000-0000-0000-0000-000000000002';
  f1_nom     uuid := 'c0000000-0000-0000-0000-000000000001';
  f1_montant uuid := 'c0000000-0000-0000-0000-000000000002';
  f1_produit uuid := 'c0000000-0000-0000-0000-000000000003';
  f2_zone    uuid := 'c0000000-0000-0000-0000-000000000004';
  f2_visites uuid := 'c0000000-0000-0000-0000-000000000005';

  i          int;
  tel        text;
  sup_id     uuid;
  emp_id     uuid;
  sub_id     uuid;
  row_id     uuid;
  statuts    text[] := ARRAY['soumis','valide','rejete','soumis','valide','soumis'];
BEGIN

  -- ─── Générer les UUIDs superviseurs et employés ───────────────────────────
  sup_ids := ARRAY(
    SELECT ('d' || LPAD(n::text, 7, '0') || '-0000-0000-0000-000000000000')::uuid
    FROM generate_series(1, 10) AS n
  );
  emp_ids := ARRAY(
    SELECT ('e' || LPAD(n::text, 7, '0') || '-0000-0000-0000-000000000000')::uuid
    FROM generate_series(1, 60) AS n
  );


  -- ─── AUTH USERS ───────────────────────────────────────────────────────────
  -- Chef
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', chef_id,
    'authenticated', 'authenticated', '70000000@orangemali.local',
    crypt('ML70000000', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}',
    now(), now()
  ) ON CONFLICT DO NOTHING;

  -- Sous-chefs
  FOR i IN 1..2 LOOP
    tel := '7000000' || i::text;
    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      CASE WHEN i = 1 THEN sc1_id ELSE sc2_id END,
      'authenticated', 'authenticated', tel || '@orangemali.local',
      crypt('ML' || tel, gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}',
      now(), now()
    ) ON CONFLICT DO NOTHING;
  END LOOP;

  -- Superviseurs
  FOR i IN 1..10 LOOP
    tel := '701000' || LPAD(i::text, 2, '0');
    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', sup_ids[i],
      'authenticated', 'authenticated', tel || '@orangemali.local',
      crypt('ML' || tel, gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}',
      now(), now()
    ) ON CONFLICT DO NOTHING;
  END LOOP;

  -- Employés
  FOR i IN 1..60 LOOP
    tel := '702000' || LPAD(i::text, 2, '0');
    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', emp_ids[i],
      'authenticated', 'authenticated', tel || '@orangemali.local',
      crypt('ML' || tel, gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}',
      now(), now()
    ) ON CONFLICT DO NOTHING;
  END LOOP;


  -- ─── PROFILES ─────────────────────────────────────────────────────────────
  -- Chef
  INSERT INTO profiles (id, first_name, last_name, telephone, role, must_change_password)
  VALUES (chef_id, 'TEST_Moussa', 'Konaté', '70000000', 'chef', false)
  ON CONFLICT DO NOTHING;

  -- Sous-chef 1
  INSERT INTO profiles (id, first_name, last_name, telephone, role, parent_id, must_change_password)
  VALUES (sc1_id, 'TEST_Fatoumata', 'Diallo', '70000001', 'sous_chef', chef_id, false)
  ON CONFLICT DO NOTHING;

  -- Sous-chef 2
  INSERT INTO profiles (id, first_name, last_name, telephone, role, parent_id, must_change_password)
  VALUES (sc2_id, 'TEST_Ibrahim', 'Coulibaly', '70000002', 'sous_chef', chef_id, false)
  ON CONFLICT DO NOTHING;

  -- 10 superviseurs (5 sous sc1, 5 sous sc2)
  FOR i IN 1..10 LOOP
    tel := '701000' || LPAD(i::text, 2, '0');
    INSERT INTO profiles (id, first_name, last_name, telephone, role, parent_id, must_change_password)
    VALUES (
      sup_ids[i],
      'TEST_Superviseur',
      'Sup' || i,
      tel,
      'superviseur',
      CASE WHEN i <= 5 THEN sc1_id ELSE sc2_id END,
      false
    ) ON CONFLICT DO NOTHING;
  END LOOP;

  -- 60 employés (6 par superviseur)
  FOR i IN 1..60 LOOP
    tel := '702000' || LPAD(i::text, 2, '0');
    sup_id := sup_ids[((i - 1) / 6) + 1];
    INSERT INTO profiles (id, first_name, last_name, telephone, role, parent_id, must_change_password)
    VALUES (
      emp_ids[i],
      'TEST_Employé',
      'Emp' || i,
      tel,
      'employe',
      sup_id,
      false
    ) ON CONFLICT DO NOTHING;
  END LOOP;


  -- ─── FORMULAIRES ──────────────────────────────────────────────────────────
  INSERT INTO forms (id, nom, description, created_by, actif)
  VALUES
    (form1_id, 'TEST_Vente Orange Money', 'Formulaire de test — transactions', chef_id, true),
    (form2_id, 'TEST_Rapport Quotidien',  'Formulaire de test — rapport terrain', chef_id, true)
  ON CONFLICT DO NOTHING;

  -- Champs formulaire 1
  INSERT INTO form_fields (id, form_id, label, type, requis, ordre)
  VALUES
    (f1_nom,     form1_id, 'Nom du client',  'text',   true,  0),
    (f1_montant, form1_id, 'Montant (FCFA)', 'number', true,  1),
    (f1_produit, form1_id, 'Produit',        'select', true,  2)
  ON CONFLICT DO NOTHING;

  UPDATE form_fields SET options = '["Orange Money","Wave","Moov Money"]'::jsonb
  WHERE id = f1_produit;

  -- Champs formulaire 2
  INSERT INTO form_fields (id, form_id, label, type, requis, ordre)
  VALUES
    (f2_zone,    form2_id, 'Zone couverte',    'text',   true,  0),
    (f2_visites, form2_id, 'Nombre de visites','number', false, 1)
  ON CONFLICT DO NOTHING;


  -- ─── SOUMISSIONS ──────────────────────────────────────────────────────────
  -- 20 soumissions réparties sur les 20 premiers employés
  -- statuts variés, dates étalées sur les 30 derniers jours
  FOR i IN 1..20 LOOP
    emp_id := emp_ids[i];
    sub_id := gen_random_uuid();

    INSERT INTO submissions (id, form_id, user_id, statut, created_at)
    VALUES (
      sub_id,
      CASE WHEN i % 2 = 0 THEN form1_id ELSE form2_id END,
      emp_id,
      statuts[(i % array_length(statuts, 1)) + 1],
      now() - ((i * 1.5)::text || ' days')::interval
    );

    row_id := gen_random_uuid();
    INSERT INTO submission_rows (id, submission_id, ordre) VALUES (row_id, sub_id, 0);

    IF i % 2 = 0 THEN
      -- Formulaire 1 : vente
      INSERT INTO row_values (row_id, field_id, valeur) VALUES
        (row_id, f1_nom,     'Client Test ' || i),
        (row_id, f1_montant, ((i * 500) + 1000)::text),
        (row_id, f1_produit, CASE WHEN i % 3 = 0 THEN 'Orange Money'
                                  WHEN i % 3 = 1 THEN 'Wave'
                                  ELSE 'Moov Money' END);
    ELSE
      -- Formulaire 2 : rapport
      INSERT INTO row_values (row_id, field_id, valeur) VALUES
        (row_id, f2_zone,    'Zone ' || i),
        (row_id, f2_visites, (i + 5)::text);
    END IF;
  END LOOP;

END $$;


-- =============================================================
-- CONNEXIONS DE TEST
-- =============================================================
-- Rôle         | Téléphone   | Login affiché              | Mot de passe
-- -------------|-------------|----------------------------|---------------
-- chef         | 70000000    | 70000000@konaté.org        | ML70000000
-- sous_chef 1  | 70000001    | 70000001@diallo.org        | ML70000001
-- sous_chef 2  | 70000002    | 70000002@coulibaly.org     | ML70000002
-- superviseur1 | 70100001    | 70100001@sup1.org          | ML70100001
-- employé 1    | 70200001    | 70200001@emp1.org          | ML70200001
-- =============================================================


-- =============================================================
-- NETTOYAGE — Supprimer toutes les données de test
-- Décommenter et exécuter pour tout effacer
-- =============================================================
/*
DELETE FROM row_values  WHERE row_id IN (
  SELECT sr.id FROM submission_rows sr
  JOIN submissions s ON s.id = sr.submission_id
  JOIN profiles p ON p.id = s.user_id
  WHERE p.first_name LIKE 'TEST_%'
);
DELETE FROM submission_rows WHERE submission_id IN (
  SELECT s.id FROM submissions s
  JOIN profiles p ON p.id = s.user_id
  WHERE p.first_name LIKE 'TEST_%'
);
DELETE FROM submissions WHERE user_id IN (
  SELECT id FROM profiles WHERE first_name LIKE 'TEST_%'
);
DELETE FROM form_fields WHERE form_id IN (
  SELECT id FROM forms WHERE nom LIKE 'TEST_%'
);
DELETE FROM forms WHERE nom LIKE 'TEST_%';
DELETE FROM profiles WHERE first_name LIKE 'TEST_%';
DELETE FROM auth.users WHERE email LIKE '%@orangemali.local'
  AND id IN (SELECT id FROM profiles WHERE first_name LIKE 'TEST_%');
*/

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const { telephone, first_name, last_name, email, role, zone, parent_id } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Vérifier que l'appelant est chef ou sous_chef
  const authHeader = req.headers.get('Authorization')
  const { data: { user: caller } } = await supabase.auth.getUser(authHeader?.replace('Bearer ', '') ?? '')
  if (!caller) return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401 })
  const { data: callerProfile } = await supabase.from('profiles').select('role').eq('id', caller.id).single()
  if (!callerProfile || !['chef', 'sous_chef'].includes(callerProfile.role)) {
    return new Response(JSON.stringify({ error: 'Accès refusé' }), { status: 403 })
  }

  const tel = telephone.replace(/\s/g, '')
  const authEmail = `${tel}@orangemali.local`
  const defaultPassword = `ML${tel}`

  const { data: { user }, error } = await supabase.auth.admin.createUser({
    email: authEmail,
    password: defaultPassword,
    email_confirm: true,
  })
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })

  await supabase.from('profiles').insert({
    id: user!.id,
    first_name,
    last_name,
    telephone,
    email: email ?? null,
    role,
    zone: zone ?? null,
    parent_id: parent_id ?? null,
    must_change_password: true,
  })

  const displayLogin = `${tel}@${last_name.toLowerCase()}.org`

  return new Response(JSON.stringify({
    id: user!.id,
    display_login: displayLogin,
    default_password: defaultPassword,
  }), { headers: { 'Content-Type': 'application/json' } })
})

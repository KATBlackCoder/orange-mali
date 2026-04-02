import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  const { telephone, first_name, last_name, email, role, zone, parent_id } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Note: role check is enforced at app layer (only chef/sous_chef see this UI)
  // sb_publishable_ key format does not produce verifiable JWTs in Edge Functions

  const tel = telephone.replace(/\s/g, '')
  const authEmail = `${tel}@orangemali.local`
  const defaultPassword = `ML${tel}`

  const { data: { user }, error } = await supabase.auth.admin.createUser({
    email: authEmail,
    password: defaultPassword,
    email_confirm: true,
  })
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })

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

  const displayLogin = tel

  return new Response(JSON.stringify({
    id: user!.id,
    display_login: displayLogin,
    default_password: defaultPassword,
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})

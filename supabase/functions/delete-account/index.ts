import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with user's token to verify identity
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Client with user's token to get user info
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Get the current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client to delete user
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Delete user's related data first (profiles, quiz_stats, etc.)
    // These should cascade automatically due to foreign keys, but let's be explicit
    await supabaseAdmin.from('user_followed_candidates').delete().eq('user_id', user.id)
    await supabaseAdmin.from('policy_match_results').delete().eq('user_id', user.id)
    await supabaseAdmin.from('quiz_stats').delete().eq('user_id', user.id)
    await supabaseAdmin.from('reports').delete().eq('user_id', user.id)
    await supabaseAdmin.from('user_roles').delete().eq('user_id', user.id)
    await supabaseAdmin.from('profiles').delete().eq('user_id', user.id)

    // Delete the user from auth.users
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('Failed to delete user:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

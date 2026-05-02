import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.1';

type DeletionRequest = {
  email?: string;
  reason?: string;
  requestedFrom?: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: 'Function is missing required secrets.' }, 500);
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const body = (await req.json().catch(() => ({}))) as DeletionRequest;
    const { data: userData } = token ? await supabase.auth.getUser(token) : { data: { user: null } };
    const user = userData.user;
    const email = user?.email ?? body.email?.trim().toLowerCase();

    if (!user && !email) {
      return json({ error: 'Email is required for web deletion requests.' }, 400);
    }

    const { data, error } = await supabase
      .from('account_deletion_requests')
      .insert({
        user_id: user?.id ?? null,
        email,
        reason: body.reason?.trim() || null,
        requested_from: body.requestedFrom || (user ? 'mobile' : 'web'),
        status: 'requested',
        metadata: {
          user_agent: req.headers.get('user-agent'),
          authenticated: Boolean(user),
        },
      })
      .select('id, status, created_at')
      .single();

    if (error) throw error;
    return json({ id: data.id, status: data.status, createdAt: data.created_at });
  } catch (error) {
    console.error('request-account-deletion failed', error);
    return json({ error: 'Hesap silme talebi oluşturulamadı.' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

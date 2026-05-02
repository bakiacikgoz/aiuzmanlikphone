import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.1';

type RevenueCatWebhook = {
  event?: {
    type?: string;
    app_user_id?: string;
    product_id?: string;
    entitlement_ids?: string[];
    expiration_at_ms?: number | null;
    purchased_at_ms?: number | null;
    environment?: string;
    store?: string;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const activeEventTypes = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
  'PRODUCT_CHANGE',
  'BILLING_ISSUE',
]);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const webhookSecret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
    if (!supabaseUrl || !serviceRoleKey || !webhookSecret) {
      return json({ error: 'Function is missing required secrets.' }, 500);
    }

    const authorization = req.headers.get('authorization') ?? '';
    if (authorization !== `Bearer ${webhookSecret}`) {
      return json({ error: 'Unauthorized webhook.' }, 401);
    }

    const payload = (await req.json()) as RevenueCatWebhook;
    const event = payload.event;
    const appUserId = event?.app_user_id;
    if (!event || !appUserId) {
      return json({ error: 'Invalid RevenueCat payload.' }, 400);
    }

    const entitlement = event.entitlement_ids?.includes('pro') ? 'pro' : event.entitlement_ids?.[0] ?? 'pro';
    const status = resolveStatus(event.type);
    const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null;
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const userId = await resolveUserId(supabase, appUserId);

    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        provider: 'revenuecat',
        app_user_id: appUserId,
        product_id: event.product_id ?? null,
        entitlement,
        status,
        expires_at: expiresAt,
        auto_renewing: status === 'active',
        raw_payload: payload,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'provider,app_user_id,entitlement' });

    if (error) throw error;
    return json({ received: true, appUserId, entitlement, status });
  } catch (error) {
    console.error('revenuecat-webhook failed', error);
    return json({ error: 'RevenueCat webhook failed.' }, 500);
  }
});

async function resolveUserId(supabase: ReturnType<typeof createClient>, appUserId: string) {
  const { data } = await supabase.from('profiles').select('id').eq('id', appUserId).maybeSingle();
  return data?.id ?? null;
}

function resolveStatus(type: string | undefined) {
  if (!type) return 'inactive';
  if (activeEventTypes.has(type)) return 'active';
  if (type === 'EXPIRATION') return 'expired';
  if (type === 'CANCELLATION') return 'cancelled';
  return 'inactive';
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.1';

type ReportRequest = {
  conversationId?: string;
  messageId?: string;
  reason?: string;
  details?: string;
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

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return json({ error: 'Authentication required.' }, 401);
    }

    const body = (await req.json()) as ReportRequest;
    if (!body.messageId && !body.conversationId) {
      return json({ error: 'Report needs a message or conversation id.' }, 400);
    }

    const conversationId = body.conversationId || await resolveConversationId(supabase, body.messageId, userData.user.id);
    if (!conversationId) {
      return json({ error: 'Message not found.' }, 404);
    }

    const { data, error } = await supabase
      .from('ai_mentor_reports')
      .insert({
        user_id: userData.user.id,
        conversation_id: conversationId,
        message_id: body.messageId,
        reason: body.reason || 'offensive_or_incorrect',
        details: body.details?.trim() || null,
        metadata: { source: 'mobile_mentor_report' },
      })
      .select('id, status, created_at')
      .single();

    if (error) throw error;
    return json({ id: data.id, status: data.status, createdAt: data.created_at });
  } catch (error) {
    console.error('report-ai-mentor-message failed', error);
    return json({ error: 'Rapor gönderilemedi.' }, 500);
  }
});

async function resolveConversationId(supabase: ReturnType<typeof createClient>, messageId: string | undefined, userId: string) {
  if (!messageId) return null;
  const { data } = await supabase
    .from('ai_mentor_messages')
    .select('conversation_id')
    .eq('id', messageId)
    .eq('user_id', userId)
    .maybeSingle();
  return data?.conversation_id ?? null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

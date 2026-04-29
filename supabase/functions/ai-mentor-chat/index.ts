import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.1';

type MentorRequest = {
  message: string;
  conversationId?: string;
  courseId?: string;
  lessonId?: string;
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
    const deepseekKey = Deno.env.get('DEEPSEEK_API_KEY');

    if (!supabaseUrl || !serviceRoleKey || !deepseekKey) {
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

    const body = (await req.json()) as MentorRequest;
    const prompt = body.message?.trim();
    if (!prompt) {
      return json({ error: 'Message is required.' }, 400);
    }

    const conversationId = await ensureConversation(supabase, {
      conversationId: body.conversationId,
      userId: userData.user.id,
      courseId: body.courseId,
      lessonId: body.lessonId,
      title: prompt.slice(0, 64),
    });

    await supabase.from('ai_mentor_messages').insert({
      conversation_id: conversationId,
      user_id: userData.user.id,
      role: 'user',
      content: prompt,
    });

    const started = Date.now();
    const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${deepseekKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-v4-pro',
        messages: [
          {
            role: 'system',
            content:
              'Sen AI Engineering Academy icin Turkce konusan, kisa ve ogretici bir AI mentorusun. Cevaplari ders baglamina uygun, pratik ve guvenli ver.',
          },
          { role: 'user', content: prompt },
        ],
        thinking: { type: 'enabled' },
        reasoning_effort: 'high',
        stream: false,
      }),
    });

    if (!deepseekResponse.ok) {
      const detail = await deepseekResponse.text();
      return json({ error: 'DeepSeek request failed.', detail }, 502);
    }

    const payload = await deepseekResponse.json();
    const answer = payload.choices?.[0]?.message?.content ?? 'Bunu daha basit bir ornekle tekrar aciklayabilirim.';
    const usage = payload.usage ?? {};
    const latencyMs = Date.now() - started;

    await supabase.from('ai_mentor_messages').insert({
      conversation_id: conversationId,
      user_id: userData.user.id,
      role: 'assistant',
      content: answer,
      token_input: usage.prompt_tokens ?? 0,
      token_output: usage.completion_tokens ?? 0,
      latency_ms: latencyMs,
      metadata: { provider: 'deepseek', model: 'deepseek-v4-pro' },
    });

    await supabase.from('ai_usage_ledger').insert({
      user_id: userData.user.id,
      conversation_id: conversationId,
      source: 'ai_mentor_chat',
      tokens_in: usage.prompt_tokens ?? 0,
      tokens_out: usage.completion_tokens ?? 0,
      cost_estimate: 0,
      currency: 'USD',
      metadata: { provider: 'deepseek', model: 'deepseek-v4-pro', latency_ms: latencyMs },
    });

    return json({ conversationId, answer, usage });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function ensureConversation(
  supabase: ReturnType<typeof createClient>,
  params: {
    conversationId?: string;
    userId: string;
    courseId?: string;
    lessonId?: string;
    title: string;
  },
) {
  if (params.conversationId) {
    return params.conversationId;
  }

  const { data, error } = await supabase
    .from('ai_mentor_conversations')
    .insert({
      user_id: params.userId,
      course_id: params.courseId,
      lesson_id: params.lessonId,
      title: params.title || 'AI Mentor',
      status: 'active',
      model: 'deepseek-v4-pro',
      system_prompt_version: 'v1',
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data.id as string;
}

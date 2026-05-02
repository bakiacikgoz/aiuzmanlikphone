import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.1';

type MentorRequest = {
  message: string;
  conversationId?: string;
  courseId?: string;
  lessonId?: string;
};

type SupabaseClient = ReturnType<typeof createClient>;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FREE_MESSAGE_LIMIT = 10;
const PRO_MESSAGE_LIMIT = 500;
const SHORT_WINDOW_MESSAGE_LIMIT = 6;
const SHORT_WINDOW_MS = 60_000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const deepseekKey = Deno.env.get('DEEPSEEK_API_KEY');
    const model = Deno.env.get('DEEPSEEK_MODEL') || 'deepseek-chat';

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
    if (prompt.length > 4000) {
      return json({ error: 'Mesaj çok uzun. Lütfen sorunu daha kısa yaz.' }, 400);
    }

    const usageGate = await evaluateMentorUsage(supabase, userData.user.id);
    if (!usageGate.allowed) {
      return json({
        error: usageGate.reason,
        code: usageGate.code,
        entitlementRequired: usageGate.entitlementRequired,
        quota: usageGate.quota,
      }, usageGate.status);
    }

    const conversationId = await ensureConversation(supabase, {
      conversationId: body.conversationId,
      userId: userData.user.id,
      courseId: body.courseId,
      lessonId: body.lessonId,
      title: prompt.slice(0, 64),
      model,
    });

    const lessonContext = await buildLessonContext(supabase, {
      courseId: body.courseId,
      lessonId: body.lessonId,
    });

    await supabase.from('ai_mentor_messages').insert({
      conversation_id: conversationId,
      user_id: userData.user.id,
      role: 'user',
      content: prompt,
      metadata: {
        context_course_id: body.courseId ?? null,
        context_lesson_id: body.lessonId ?? null,
      },
    });

    const started = Date.now();
    const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${deepseekKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: buildSystemPrompt(lessonContext) },
          { role: 'user', content: prompt },
        ],
        temperature: 0.25,
        max_tokens: 700,
        stream: false,
      }),
    });

    const latencyMs = Date.now() - started;
    if (!deepseekResponse.ok) {
      const detail = await deepseekResponse.text();
      console.error('DeepSeek request failed', { status: deepseekResponse.status, detail });
      return json({ error: 'AI mentor şu anda yanıt veremiyor. Lütfen biraz sonra tekrar dene.' }, 502);
    }

    const payload = await deepseekResponse.json();
    const answer = payload.choices?.[0]?.message?.content?.trim() || 'Bunu daha basit bir örnekle tekrar açıklayabilirim.';
    const usage = payload.usage ?? {};
    const tokensIn = Number(usage.prompt_tokens ?? 0);
    const tokensOut = Number(usage.completion_tokens ?? 0);
    const costEstimate = estimateCost(model, tokensIn, tokensOut);

    const { data: assistantMessage } = await supabase
      .from('ai_mentor_messages')
      .insert({
        conversation_id: conversationId,
        user_id: userData.user.id,
        role: 'assistant',
        content: answer,
        token_input: tokensIn,
        token_output: tokensOut,
        latency_ms: latencyMs,
        metadata: {
          provider: 'deepseek',
          model,
          context_attached: Boolean(lessonContext),
        },
      })
      .select('id')
      .single();

    await supabase.from('ai_usage_ledger').insert({
      user_id: userData.user.id,
      conversation_id: conversationId,
      source: 'ai_mentor_chat',
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      cost_estimate: costEstimate,
      currency: 'USD',
      metadata: { provider: 'deepseek', model, latency_ms: latencyMs, quota: usageGate.quota },
    });

    return json({
      conversationId,
      messageId: assistantMessage?.id ?? null,
      answer,
      usage: { promptTokens: tokensIn, completionTokens: tokensOut, costEstimate },
      quota: usageGate.quota,
    });
  } catch (error) {
    console.error('ai-mentor-chat failed', error);
    return json({ error: 'AI mentor isteği tamamlanamadı.' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function evaluateMentorUsage(supabase: SupabaseClient, userId: string) {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const shortWindowStart = new Date(Date.now() - SHORT_WINDOW_MS).toISOString();
  const entitlement = await getActiveEntitlement(supabase, userId);
  const messageLimit = entitlement.isPro ? PRO_MESSAGE_LIMIT : FREE_MESSAGE_LIMIT;
  const tokenLimit = entitlement.tokenLimit;

  const { count: recentCount } = await supabase
    .from('ai_mentor_messages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('role', 'user')
    .gte('created_at', shortWindowStart);

  if ((recentCount ?? 0) >= SHORT_WINDOW_MESSAGE_LIMIT) {
    return {
      allowed: false,
      status: 429,
      code: 'rate_limited',
      reason: 'Çok hızlı mesaj gönderiyorsun. Lütfen kısa bir ara ver.',
      entitlementRequired: false,
      quota: { messageLimit, tokenLimit, usedMessages: recentCount ?? 0, usedTokens: 0, isPro: entitlement.isPro },
    };
  }

  const { count: monthlyCount } = await supabase
    .from('ai_mentor_messages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('role', 'user')
    .gte('created_at', monthStart);

  const { data: usageRows } = await supabase
    .from('ai_usage_ledger')
    .select('tokens_in, tokens_out')
    .eq('user_id', userId)
    .eq('source', 'ai_mentor_chat')
    .gte('created_at', monthStart)
    .limit(1000);

  const usedTokens = (usageRows ?? []).reduce((sum: number, row: { tokens_in?: number; tokens_out?: number }) => {
    return sum + Number(row.tokens_in ?? 0) + Number(row.tokens_out ?? 0);
  }, 0);

  if ((monthlyCount ?? 0) >= messageLimit || usedTokens >= tokenLimit) {
    return {
      allowed: false,
      status: 402,
      code: 'mentor_quota_exceeded',
      reason: entitlement.isPro ? 'Bu ayki AI mentor kotan doldu.' : 'Ücretsiz AI mentor kotan doldu. Pro ile devam edebilirsin.',
      entitlementRequired: !entitlement.isPro,
      quota: { messageLimit, tokenLimit, usedMessages: monthlyCount ?? 0, usedTokens, isPro: entitlement.isPro },
    };
  }

  return {
    allowed: true,
    status: 200,
    code: 'ok',
    reason: null,
    entitlementRequired: false,
    quota: { messageLimit, tokenLimit, usedMessages: monthlyCount ?? 0, usedTokens, isPro: entitlement.isPro },
  };
}

async function getActiveEntitlement(supabase: SupabaseClient, userId: string) {
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('entitlement, status, expires_at')
    .eq('user_id', userId)
    .eq('entitlement', 'pro')
    .in('status', ['active', 'trialing'])
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('expires_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  const isPro = Boolean(subscription);
  const planSlug = isPro ? 'pro' : 'free';
  const { data: plan } = await supabase
    .from('plans')
    .select('ai_monthly_token_limit')
    .eq('slug', planSlug)
    .maybeSingle();

  return {
    isPro,
    tokenLimit: Number(plan?.ai_monthly_token_limit ?? (isPro ? 500000 : 50000)),
  };
}

async function ensureConversation(
  supabase: SupabaseClient,
  params: {
    conversationId?: string;
    userId: string;
    courseId?: string;
    lessonId?: string;
    title: string;
    model: string;
  },
) {
  if (params.conversationId) {
    const { data, error } = await supabase
      .from('ai_mentor_conversations')
      .select('id')
      .eq('id', params.conversationId)
      .eq('user_id', params.userId)
      .maybeSingle();

    if (error || !data?.id) {
      throw new Error('Conversation not found.');
    }
    return data.id as string;
  }

  const { data, error } = await supabase
    .from('ai_mentor_conversations')
    .insert({
      user_id: params.userId,
      course_id: params.courseId,
      lesson_id: params.lessonId,
      title: params.title || 'AI Mentor',
      status: 'active',
      model: params.model,
      system_prompt_version: 'mentor-v2',
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

async function buildLessonContext(
  supabase: SupabaseClient,
  params: { courseId?: string; lessonId?: string },
) {
  const parts: string[] = [];

  if (params.courseId) {
    const { data: course } = await supabase
      .from('courses')
      .select('title, subtitle, description')
      .eq('id', params.courseId)
      .maybeSingle();
    if (course) {
      parts.push(`Kurs: ${course.title}. ${course.subtitle ?? ''} ${course.description ?? ''}`.trim());
    }
  }

  if (params.lessonId) {
    const { data: lesson } = await supabase
      .from('lessons')
      .select('title')
      .eq('id', params.lessonId)
      .maybeSingle();
    if (lesson) parts.push(`Aktif ders: ${lesson.title}.`);

    const { data: blocks } = await supabase
      .from('lesson_content_blocks')
      .select('title, body, code, sort_order')
      .eq('lesson_id', params.lessonId)
      .order('sort_order')
      .limit(4);

    for (const block of blocks ?? []) {
      const text = [block.title, block.body, block.code ? `Kod örneği: ${block.code.slice(0, 700)}` : '']
        .filter(Boolean)
        .join('\n')
        .slice(0, 1200);
      if (text) parts.push(text);
    }
  }

  return parts.join('\n\n').slice(0, 3600);
}

function buildSystemPrompt(context: string) {
  return [
    'Sen AI Engineering Academy için Türkçe konuşan, kısa, pratik ve güvenli bir AI mentorusun.',
    'Kullanıcının öğrenme hedefini destekle; cevabı ders bağlamına bağla, gereksiz uzun anlatma.',
    'Kod istendiğinde küçük, açıklamalı örnek ver. Emin olmadığın yerde varsayımını açıkça söyle.',
    'Zararlı, aldatıcı, kişisel veri sızdırmaya veya güvenliği aşmaya yönelik istekleri reddet.',
    context ? `Ders bağlamı:\n${context}` : 'Ders bağlamı yoksa genel AI engineering ilkeleriyle cevap ver.',
  ].join('\n');
}

function estimateCost(model: string, tokensIn: number, tokensOut: number) {
  const inputRate = Number(Deno.env.get('DEEPSEEK_INPUT_USD_PER_1M') ?? (model.includes('reasoner') ? '0.55' : '0.27'));
  const outputRate = Number(Deno.env.get('DEEPSEEK_OUTPUT_USD_PER_1M') ?? (model.includes('reasoner') ? '2.19' : '1.10'));
  return Number(((tokensIn / 1_000_000) * inputRate + (tokensOut / 1_000_000) * outputRate).toFixed(6));
}

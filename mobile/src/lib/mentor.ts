const fallbackBackpropagationAnswer =
  'Backpropagation, hatayi cikistan girise dogru yayarak her katmandaki agirliklarin nasil guncellenecegini hesaplar. Bu sayede model hatasini azaltacak yonde ogrenebilir.';

const fallbackReluAnswer =
  'ReLU, negatif girdileri 0 yapan ve pozitif girdileri oldugu gibi geciren basit bir aktivasyon fonksiyonudur. Hesaplamasi hizli oldugu icin derin aglarda sik kullanilir ve gradient kaybolmasini azaltmaya yardim eder.';

const fallbackGeneralAnswer =
  'Bu konuda ilerlerken once kavrami basit bir ornekle dusun, sonra formulu ve uygulamadaki etkisini incele. Istersen sorunu daha spesifik yaz, adim adim aciklayayim.';

export type MentorReply = {
  answer: string;
  conversationId?: string;
  messageId?: string;
  quota?: {
    messageLimit: number;
    tokenLimit: number;
    usedMessages: number;
    usedTokens: number;
    isPro: boolean;
  };
  entitlementRequired?: boolean;
};

async function getSupabaseClient() {
  return import('./supabase');
}

function hasConfiguredSupabaseAnonKey() {
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return Boolean(anonKey && !anonKey.includes('replace-with'));
}

export function getFallbackMentorAnswer(message: string) {
  const normalized = message.toLocaleLowerCase('tr-TR');
  if (normalized.includes('relu')) return fallbackReluAnswer;
  if (normalized.includes('backprop') || normalized.includes('geri yay')) return fallbackBackpropagationAnswer;
  return fallbackGeneralAnswer;
}

function createFallbackReply(message: string): MentorReply {
  return {
    answer: getFallbackMentorAnswer(message),
    conversationId: 'local-demo',
    messageId: `local:${Date.now()}`,
    quota: {
      messageLimit: 10,
      tokenLimit: 50000,
      usedMessages: 0,
      usedTokens: 0,
      isPro: false,
    },
  };
}

export async function askMentor(message: string, accessToken?: string, context?: { conversationId?: string; courseId?: string; lessonId?: string }): Promise<MentorReply> {
  if (!hasConfiguredSupabaseAnonKey()) {
    return createFallbackReply(message);
  }
  const { supabase, isSupabaseConfigured } = await getSupabaseClient();
  if (!isSupabaseConfigured) {
    return createFallbackReply(message);
  }
  if (!accessToken) {
    throw new Error('Authentication required.');
  }

  const { data, error } = await supabase.functions.invoke('ai-mentor-chat', {
    body: {
      message,
      conversationId: context?.conversationId,
      courseId: context?.courseId,
      lessonId: context?.lessonId,
    },
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (error) {
    const maybeContext = (error as { context?: { json?: () => Promise<unknown> } }).context;
    const errorBody = await maybeContext?.json?.().catch(() => null) as MentorReply & { error?: string } | null;
    if (errorBody?.entitlementRequired) {
      return {
        answer: errorBody.error ?? 'Ücretsiz AI mentor kotan doldu. Pro ile devam edebilirsin.',
        entitlementRequired: true,
        quota: errorBody.quota,
      };
    }
    throw error;
  }

  return {
    answer: data?.answer ?? getFallbackMentorAnswer(message),
    conversationId: data?.conversationId,
    messageId: data?.messageId,
    quota: data?.quota,
    entitlementRequired: data?.entitlementRequired,
  };
}

export async function reportMentorMessage(input: {
  messageId?: string;
  conversationId?: string;
  reason?: string;
  details?: string;
}, accessToken?: string) {
  if (input.messageId?.startsWith('local:') || !hasConfiguredSupabaseAnonKey()) {
    return { id: input.messageId ?? 'local-report', status: 'received' };
  }
  const { supabase, isSupabaseConfigured } = await getSupabaseClient();
  if (!isSupabaseConfigured || input.messageId?.startsWith('local:')) {
    return { id: input.messageId ?? 'local-report', status: 'received' };
  }
  if (!accessToken) {
    throw new Error('Authentication required.');
  }

  const { data, error } = await supabase.functions.invoke('report-ai-mentor-message', {
    body: input,
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (error) throw error;
  return data ?? { status: 'received' };
}

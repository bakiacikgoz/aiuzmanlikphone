const fallbackBackpropagationAnswer =
  'Backpropagation, hatayi cikistan girise dogru yayarak her katmandaki agirliklarin nasil guncellenecegini hesaplar. Bu sayede model hatasini azaltacak yonde ogrenebilir.';

const fallbackReluAnswer =
  'ReLU, negatif girdileri 0 yapan ve pozitif girdileri oldugu gibi geciren basit bir aktivasyon fonksiyonudur. Hesaplamasi hizli oldugu icin derin aglarda sik kullanilir ve gradient kaybolmasini azaltmaya yardim eder.';

const fallbackGeneralAnswer =
  'Bu konuda ilerlerken once kavrami basit bir ornekle dusun, sonra formulu ve uygulamadaki etkisini incele. Istersen sorunu daha spesifik yaz, adim adim aciklayayim.';

async function getSupabaseClient() {
  return import('./supabase');
}

export function getFallbackMentorAnswer(message: string) {
  const normalized = message.toLocaleLowerCase('tr-TR');
  if (normalized.includes('relu')) return fallbackReluAnswer;
  if (normalized.includes('backprop') || normalized.includes('geri yay')) return fallbackBackpropagationAnswer;
  return fallbackGeneralAnswer;
}

export async function askMentor(message: string, accessToken?: string) {
  const { supabase, isSupabaseConfigured } = await getSupabaseClient();
  if (!isSupabaseConfigured) {
    return getFallbackMentorAnswer(message);
  }
  if (!accessToken) {
    throw new Error('Authentication required.');
  }

  const { data, error } = await supabase.functions.invoke('ai-mentor-chat', {
    body: { message, courseId: undefined, lessonId: undefined },
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (error) {
    throw error;
  }

  return data?.answer ?? getFallbackMentorAnswer(message);
}

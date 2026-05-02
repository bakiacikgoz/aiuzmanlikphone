async function getSupabaseClient() {
  return import('./supabase');
}

function hasConfiguredSupabaseAnonKey() {
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return Boolean(anonKey && !anonKey.includes('replace-with'));
}

export async function requestAccountDeletion(input: {
  email?: string;
  reason?: string;
  requestedFrom?: string;
}, accessToken?: string) {
  if (!hasConfiguredSupabaseAnonKey()) {
    return {
      id: 'local-deletion-request',
      status: 'requested',
      createdAt: new Date().toISOString(),
    };
  }
  const { supabase, isSupabaseConfigured } = await getSupabaseClient();
  if (!isSupabaseConfigured) {
    return {
      id: 'local-deletion-request',
      status: 'requested',
      createdAt: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase.functions.invoke('request-account-deletion', {
    body: {
      email: input.email,
      reason: input.reason,
      requestedFrom: input.requestedFrom ?? 'mobile',
    },
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });

  if (error) throw error;
  return data ?? { status: 'requested' };
}

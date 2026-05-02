import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

export type SubscriptionStatus = {
  isPro: boolean;
  entitlement: 'free' | 'pro';
  source: 'revenuecat' | 'supabase' | 'fallback';
  productId?: string;
  expiresAt?: string | null;
  status?: string;
};

type RevenueCatModule = {
  default?: {
    configure: (options: { apiKey: string; appUserID?: string }) => void;
    logIn?: (appUserID: string) => Promise<unknown>;
    getCustomerInfo: () => Promise<{
      entitlements?: {
        active?: Record<string, { isActive?: boolean; productIdentifier?: string; expirationDate?: string | null }>;
      };
    }>;
    restorePurchases?: () => Promise<unknown>;
  };
};

type RevenueCatUIModule = {
  default?: {
    presentPaywall?: () => Promise<unknown>;
  };
};

let configuredUserId: string | null = null;

function getRevenueCatApiKey() {
  if (Platform.OS === 'android') return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? '';
  if (Platform.OS === 'ios') return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? '';
  return process.env.EXPO_PUBLIC_REVENUECAT_WEB_API_KEY ?? '';
}

async function loadPurchases(): Promise<RevenueCatModule['default'] | null> {
  try {
    // eslint-disable-next-line import/no-unresolved
    const mod = await import('react-native-purchases') as RevenueCatModule;
    return mod.default ?? null;
  } catch {
    return null;
  }
}

async function loadPurchasesUI(): Promise<RevenueCatUIModule['default'] | null> {
  try {
    // eslint-disable-next-line import/no-unresolved
    const mod = await import('react-native-purchases-ui') as RevenueCatUIModule;
    return mod.default ?? null;
  } catch {
    return null;
  }
}

async function getSupabaseClient() {
  return import('./supabase');
}

export async function configureRevenueCat(appUserId: string | undefined) {
  const apiKey = getRevenueCatApiKey();
  if (!apiKey || !appUserId || Platform.OS === 'web') return false;
  const Purchases = await loadPurchases();
  if (!Purchases) return false;
  if (configuredUserId === appUserId) return true;
  Purchases.configure({ apiKey, appUserID: appUserId });
  configuredUserId = appUserId;
  return true;
}

export async function getSubscriptionStatus(appUserId: string | undefined): Promise<SubscriptionStatus> {
  if (!appUserId) return createFallbackStatus();

  const remoteStatus = await getSupabaseSubscriptionStatus(appUserId);
  if (remoteStatus.isPro) return remoteStatus;

  const configured = await configureRevenueCat(appUserId);
  if (!configured) return remoteStatus;

  const Purchases = await loadPurchases();
  const customerInfo = await Purchases?.getCustomerInfo().catch(() => null);
  const pro = customerInfo?.entitlements?.active?.pro;
  if (pro) {
    return {
      isPro: true,
      entitlement: 'pro',
      source: 'revenuecat',
      productId: pro.productIdentifier,
      expiresAt: pro.expirationDate ?? null,
      status: 'active',
    };
  }

  return remoteStatus;
}

export async function presentRevenueCatPaywall(appUserId: string | undefined) {
  const configured = await configureRevenueCat(appUserId);
  if (!configured) return { presented: false, reason: 'RevenueCat preview fallback' };
  const RevenueCatUI = await loadPurchasesUI();
  if (!RevenueCatUI?.presentPaywall) return { presented: false, reason: 'RevenueCat UI unavailable' };
  await RevenueCatUI.presentPaywall();
  return { presented: true };
}

export async function restoreRevenueCatPurchases(appUserId: string | undefined) {
  const configured = await configureRevenueCat(appUserId);
  if (!configured) return { restored: false };
  const Purchases = await loadPurchases();
  await Purchases?.restorePurchases?.();
  return { restored: true };
}

export async function openSubscriptionManagement() {
  await Linking.openURL('https://play.google.com/store/account/subscriptions');
}

async function getSupabaseSubscriptionStatus(appUserId: string): Promise<SubscriptionStatus> {
  const { isSupabaseConfigured, supabase } = await getSupabaseClient();
  if (!isSupabaseConfigured) return createFallbackStatus();
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('product_id, entitlement, status, expires_at')
    .eq('app_user_id', appUserId)
    .eq('entitlement', 'pro')
    .in('status', ['active', 'trialing'])
    .order('expires_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return createFallbackStatus('supabase');

  const expiresAt = data.expires_at as string | null;
  const isActive = !expiresAt || new Date(expiresAt).getTime() > Date.now();
  return {
    isPro: isActive,
    entitlement: isActive ? 'pro' : 'free',
    source: 'supabase',
    productId: data.product_id ?? undefined,
    expiresAt,
    status: data.status,
  };
}

function createFallbackStatus(source: SubscriptionStatus['source'] = 'fallback'): SubscriptionStatus {
  return {
    isPro: false,
    entitlement: 'free',
    source,
    status: 'inactive',
  };
}

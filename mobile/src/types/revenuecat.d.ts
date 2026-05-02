declare module 'react-native-purchases' {
  const Purchases: {
    configure: (options: { apiKey: string; appUserID?: string }) => void;
    logIn?: (appUserID: string) => Promise<unknown>;
    getCustomerInfo: () => Promise<{
      entitlements?: {
        active?: Record<string, { isActive?: boolean; productIdentifier?: string; expirationDate?: string | null }>;
      };
    }>;
    restorePurchases?: () => Promise<unknown>;
  };

  export default Purchases;
}

declare module 'react-native-purchases-ui' {
  const RevenueCatUI: {
    presentPaywall?: () => Promise<unknown>;
  };

  export default RevenueCatUI;
}

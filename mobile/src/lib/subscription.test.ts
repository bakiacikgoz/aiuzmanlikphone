import { describe, expect, it, vi } from 'vitest';

import { getSubscriptionStatus } from './subscription';

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

vi.mock('expo-linking', () => ({
  openURL: vi.fn(),
}));

describe('subscription helpers', () => {
  it('uses a safe free fallback when no app user id is available', async () => {
    await expect(getSubscriptionStatus(undefined)).resolves.toMatchObject({
      isPro: false,
      entitlement: 'free',
      source: 'fallback',
    });
  });
});

import { describe, expect, it } from 'vitest';

import { requestAccountDeletion } from './compliance';

describe('compliance helpers', () => {
  it('creates a local account deletion request fallback when Supabase is not configured', async () => {
    await expect(requestAccountDeletion({ email: 'reviewer@example.com', requestedFrom: 'web' })).resolves.toMatchObject({
      id: 'local-deletion-request',
      status: 'requested',
    });
  });
});

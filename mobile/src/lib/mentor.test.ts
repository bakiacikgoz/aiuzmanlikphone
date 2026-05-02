import { describe, expect, it } from 'vitest';

import { askMentor, getFallbackMentorAnswer, reportMentorMessage } from './mentor';

describe('mentor fallback answers', () => {
  it('answers ReLU questions with a ReLU-specific explanation', () => {
    expect(getFallbackMentorAnswer('ReLU nedir?')).toContain('ReLU');
    expect(getFallbackMentorAnswer('ReLU nedir?')).not.toContain('Backpropagation, hatayi cikistan');
  });

  it('keeps a backpropagation-specific fallback for backpropagation prompts', () => {
    expect(getFallbackMentorAnswer('Backpropagation neden onemlidir?')).toContain('Backpropagation');
  });

  it('returns a structured fallback reply when Supabase is not configured', async () => {
    const reply = await askMentor('ReLU nedir?');

    expect(reply).toMatchObject({
      answer: expect.stringContaining('ReLU'),
      conversationId: 'local-demo',
      quota: { isPro: false, messageLimit: 10 },
    });
  });

  it('accepts local mentor report fallbacks without network access', async () => {
    await expect(reportMentorMessage({ messageId: 'local:test' })).resolves.toMatchObject({
      status: 'received',
    });
  });
});

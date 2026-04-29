import { describe, expect, it } from 'vitest';

import { getFallbackMentorAnswer } from './mentor';

describe('mentor fallback answers', () => {
  it('answers ReLU questions with a ReLU-specific explanation', () => {
    expect(getFallbackMentorAnswer('ReLU nedir?')).toContain('ReLU');
    expect(getFallbackMentorAnswer('ReLU nedir?')).not.toContain('Backpropagation, hatayi cikistan');
  });

  it('keeps a backpropagation-specific fallback for backpropagation prompts', () => {
    expect(getFallbackMentorAnswer('Backpropagation neden onemlidir?')).toContain('Backpropagation');
  });
});

import { describe, expect, it } from 'vitest';

import { buildDiceBearAvatarUrl, defaultAvatarConfig, withSeed } from './avatar';

describe('avatar helpers', () => {
  it('builds a DiceBear PNG URL with deterministic seed and selected options', () => {
    const url = buildDiceBearAvatarUrl({
      ...defaultAvatarConfig,
      seed: 'zeynep@example.com',
      top: 'curly',
      hairColor: '724133',
      accessories: 'round',
    });

    expect(url).toContain('https://api.dicebear.com/9.x/avataaars/png?');
    expect(url).toContain('seed=zeynep%40example.com');
    expect(url).toContain('top=curly');
    expect(url).toContain('hairColor=724133');
    expect(url).toContain('accessories=round');
    expect(url).toContain('accessoriesProbability=100');
  });

  it('falls back to the default seed when seed input is blank', () => {
    expect(withSeed(defaultAvatarConfig, '   ').seed).toBe(defaultAvatarConfig.seed);
  });
});

import { describe, expect, it } from 'vitest';

import {
  createLocalCelebrationNotification,
  isMilestoneCelebrationType,
  mapNotificationToCelebrationEvent,
  resolveCelebrationAssetKey,
  sortAndDedupeCelebrationEvents,
} from './events';

describe('celebration event mapping', () => {
  it('maps notification metadata into a typed celebration event', () => {
    const event = mapNotificationToCelebrationEvent({
      id: 'notification-1',
      notification_type: 'league_promotion',
      title: 'Altın Lige yükseldin',
      body: 'Bronz Ligden Altın Lige çıktın.',
      is_read: false,
      created_at: '2026-05-01T09:00:00.000Z',
      metadata: {
        celebration: true,
        event_type: 'league_promotion',
        asset_key: 'gold',
        dedupe_key: 'league-promotion-gold',
        target_route: '/league',
        previous_tier: 'bronze',
        next_tier: 'gold',
        points: 1840,
      },
    });

    expect(event).toMatchObject({
      id: 'notification-1',
      type: 'league_promotion',
      previousTier: 'bronze',
      nextTier: 'gold',
      points: 1840,
      targetRoute: '/league',
    });
  });

  it('ignores regular notifications and unknown event types', () => {
    expect(mapNotificationToCelebrationEvent({
      id: 'notification-2',
      notification_type: 'achievement',
      metadata: { celebration: false },
    })).toBeNull();

    expect(mapNotificationToCelebrationEvent({
      id: 'notification-3',
      notification_type: 'unknown',
      metadata: { celebration: true, event_type: 'unknown' },
    })).toBeNull();
  });

  it('sorts events by creation time and dedupes by dedupe key', () => {
    const first = mapNotificationToCelebrationEvent(createLocalCelebrationNotification({
      type: 'badge_earned',
      title: 'Rozet',
      dedupeKey: 'same-badge',
    }, new Date('2026-05-01T09:02:00.000Z')))!;
    const duplicate = { ...first, id: 'local:duplicate', createdAt: '2026-05-01T09:03:00.000Z' };
    const second = mapNotificationToCelebrationEvent(createLocalCelebrationNotification({
      type: 'lab_completed',
      title: 'Lab',
      dedupeKey: 'lab',
    }, new Date('2026-05-01T09:01:00.000Z')))!;

    expect(sortAndDedupeCelebrationEvents([first, duplicate, second]).map((event) => event.id)).toEqual([
      second.id,
      first.id,
    ]);
  });

  it('resolves badge and league asset keys without loading native image modules', () => {
    expect(resolveCelebrationAssetKey({
      type: 'league_promotion',
      nextTier: 'diamond',
    })).toBe('diamond');
    expect(resolveCelebrationAssetKey({
      type: 'badge_earned',
      badgeSlug: 'quiz-champion',
      assetKey: 'achievement',
    })).toBe('quiz-champion');
    expect(resolveCelebrationAssetKey({
      type: 'course_completed',
    })).toBe('achievement');
  });

  it('keeps full-screen celebrations limited to milestone events', () => {
    expect(isMilestoneCelebrationType('lesson_completed')).toBe(false);
    expect(isMilestoneCelebrationType('quiz_correct')).toBe(false);
    expect(isMilestoneCelebrationType('lab_completed')).toBe(false);
    expect(isMilestoneCelebrationType('course_completed')).toBe(true);
    expect(isMilestoneCelebrationType('badge_earned')).toBe(true);
    expect(isMilestoneCelebrationType('league_promotion')).toBe(true);
  });
});

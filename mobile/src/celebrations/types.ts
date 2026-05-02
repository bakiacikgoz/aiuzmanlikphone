export type CelebrationEventType =
  | 'league_promotion'
  | 'league_demotion'
  | 'league_top_rank'
  | 'season_reward'
  | 'badge_earned'
  | 'lesson_completed'
  | 'quiz_passed'
  | 'quiz_correct'
  | 'lab_completed'
  | 'course_completed'
  | 'certificate_earned'
  | 'level_assigned';

export type LeagueTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export type CelebrationEvent = {
  id: string;
  type: CelebrationEventType;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  assetKey?: string;
  badgeSlug?: string;
  dedupeKey?: string;
  targetRoute?: string;
  previousTier?: LeagueTier;
  nextTier?: LeagueTier;
  points?: number;
};

export type CelebrationNotificationRow = {
  id: string;
  notification_type?: string | null;
  title?: string | null;
  body?: string | null;
  target_type?: string | null;
  target_id?: string | null;
  is_read?: boolean | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
};

export type EnqueueCelebrationInput = {
  type: CelebrationEventType;
  title: string;
  body?: string;
  targetType?: string;
  targetId?: string;
  assetKey?: string;
  dedupeKey?: string;
  targetRoute?: string;
  badgeSlug?: string;
  previousTier?: LeagueTier;
  nextTier?: LeagueTier;
  points?: number;
};

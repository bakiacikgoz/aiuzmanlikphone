import type {
  CelebrationEvent,
  CelebrationEventType,
  CelebrationNotificationRow,
  EnqueueCelebrationInput,
  LeagueTier,
} from './types';

const celebrationEventTypes: CelebrationEventType[] = [
  'league_promotion',
  'league_demotion',
  'league_top_rank',
  'season_reward',
  'badge_earned',
  'lesson_completed',
  'quiz_passed',
  'quiz_correct',
  'lab_completed',
  'course_completed',
  'certificate_earned',
  'level_assigned',
];

const milestoneCelebrationEventTypes: CelebrationEventType[] = [
  'league_promotion',
  'league_demotion',
  'league_top_rank',
  'season_reward',
  'badge_earned',
  'course_completed',
  'certificate_earned',
  'level_assigned',
];

const leagueTiers: LeagueTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asLeagueTier(value: unknown): LeagueTier | undefined {
  return leagueTiers.includes(value as LeagueTier) ? value as LeagueTier : undefined;
}

export function asCelebrationEventType(value: unknown): CelebrationEventType | undefined {
  return celebrationEventTypes.includes(value as CelebrationEventType) ? value as CelebrationEventType : undefined;
}

export function isMilestoneCelebrationType(value: unknown): value is CelebrationEventType {
  return milestoneCelebrationEventTypes.includes(value as CelebrationEventType);
}

export function isMilestoneCelebrationEvent(event: Pick<CelebrationEvent, 'type'>): boolean {
  return isMilestoneCelebrationType(event.type);
}

export function mapNotificationToCelebrationEvent(row: CelebrationNotificationRow): CelebrationEvent | null {
  const metadata = asRecord(row.metadata);
  if (metadata.celebration !== true && metadata.celebration !== 'true') return null;

  const type = asCelebrationEventType(metadata.event_type) ?? asCelebrationEventType(row.notification_type);
  if (!type) return null;

  return {
    id: row.id,
    type,
    title: row.title || getDefaultCelebrationTitle(type),
    body: row.body || getDefaultCelebrationBody(type),
    createdAt: row.created_at || new Date(0).toISOString(),
    isRead: Boolean(row.is_read),
    assetKey: asString(metadata.asset_key),
    badgeSlug: asString(metadata.badge_slug),
    dedupeKey: asString(metadata.dedupe_key),
    targetRoute: asString(metadata.target_route),
    previousTier: asLeagueTier(metadata.previous_tier),
    nextTier: asLeagueTier(metadata.next_tier),
    points: asNumber(metadata.points),
  };
}

export function sortAndDedupeCelebrationEvents(events: CelebrationEvent[]): CelebrationEvent[] {
  const seen = new Set<string>();
  return events
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .filter((event) => {
      const key = event.dedupeKey || event.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function resolveCelebrationAssetKey(event: Pick<CelebrationEvent, 'type' | 'assetKey' | 'badgeSlug' | 'nextTier'>): string {
  if ((event.type === 'league_promotion' || event.type === 'league_demotion' || event.type === 'league_top_rank') && event.nextTier) {
    return event.nextTier;
  }
  return event.badgeSlug || event.assetKey || 'achievement';
}

export function createLocalCelebrationNotification(input: EnqueueCelebrationInput, now = new Date()): CelebrationNotificationRow {
  const idSeed = input.dedupeKey || `${input.type}-${now.getTime()}`;
  const metadata: Record<string, unknown> = {
    celebration: true,
    event_type: input.type,
    asset_key: input.assetKey,
    dedupe_key: input.dedupeKey,
    target_route: input.targetRoute,
    badge_slug: input.badgeSlug,
    previous_tier: input.previousTier,
    next_tier: input.nextTier,
    points: input.points,
  };

  Object.keys(metadata).forEach((key) => {
    if (metadata[key] === undefined) delete metadata[key];
  });

  return {
    id: `local:${idSeed}`,
    notification_type: input.type,
    title: input.title,
    body: input.body || getDefaultCelebrationBody(input.type),
    target_type: input.targetType || 'celebration',
    target_id: input.targetId,
    is_read: false,
    metadata,
    created_at: now.toISOString(),
  };
}

export function getDefaultCelebrationTitle(type: CelebrationEventType): string {
  switch (type) {
    case 'league_promotion':
      return 'Lig yükseldi';
    case 'league_demotion':
      return 'Lig değişti';
    case 'league_top_rank':
      return 'Sıralama başarısı';
    case 'season_reward':
      return 'Sezon ödülü';
    case 'badge_earned':
      return 'Yeni rozet';
    case 'lesson_completed':
      return 'Ders tamamlandı';
    case 'quiz_passed':
    case 'quiz_correct':
      return 'Quiz başarısı';
    case 'lab_completed':
      return 'Lab tamamlandı';
    case 'course_completed':
      return 'Kurs tamamlandı';
    case 'certificate_earned':
      return 'Sertifika kazanıldı';
    case 'level_assigned':
      return 'Seviyen hazır';
  }
}

export function getDefaultCelebrationBody(type: CelebrationEventType): string {
  switch (type) {
    case 'league_promotion':
      return 'Yeni ligine geçtin ve haftalık yarışta bir üst seviyeye çıktın.';
    case 'league_demotion':
      return 'Yeni sezonda daha güçlü dönmek için hedefin hazır.';
    case 'league_top_rank':
      return 'Lig sıralamasında kritik bir eşiği geçtin.';
    case 'season_reward':
      return 'Sezon performansın için ödül kazandın.';
    case 'badge_earned':
      return 'Başarı koleksiyonuna yeni bir rozet eklendi.';
    case 'lesson_completed':
      return 'Bu dersi başarıyla tamamladın.';
    case 'quiz_passed':
    case 'quiz_correct':
      return 'Quiz sonucuyla XP ilerlemesine katkı sağladın.';
    case 'lab_completed':
      return 'Uygulama adımını başarıyla tamamladın.';
    case 'course_completed':
      return 'Kurs akışını başarıyla bitirdin.';
    case 'certificate_earned':
      return 'Bu başarı artık sertifika olarak kaydedildi.';
    case 'level_assigned':
      return 'Öğrenme rotan seviyene göre hazırlandı.';
  }
}

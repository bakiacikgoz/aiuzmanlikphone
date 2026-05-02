import type { ImageSourcePropType } from 'react-native';

import type { CelebrationEvent, LeagueTier } from './types';

const genericAchievementAsset = require('../../assets/celebrations/achievement-hero.png') as number;

const leagueBadgeAssets: Record<LeagueTier, number> = {
  bronze: require('../../assets/league/bronze-league-badge.png') as number,
  silver: require('../../assets/league/silver-league-badge.png') as number,
  gold: require('../../assets/league/gold-league-badge.png') as number,
  platinum: require('../../assets/league/platinum-league-badge.png') as number,
  diamond: require('../../assets/league/diamond-league-badge.png') as number,
};

const badgeAssets: Record<string, number> = {
  'algorithm-master': require('../../assets/badges/algorithm-master.png') as number,
  'quiz-champion': require('../../assets/badges/quiz-champion.png') as number,
  'consistent-learner': require('../../assets/badges/consistent-learner.png') as number,
  'python-basics': require('../../assets/badges/python-basics.png') as number,
  'neural-explorer': require('../../assets/badges/neural-explorer.png') as number,
  'prompt-guardian': require('../../assets/badges/prompt-guardian.png') as number,
  'data-cleaner': require('../../assets/badges/data-cleaner.png') as number,
  'model-trainer': require('../../assets/badges/model-trainer.png') as number,
  'deployment-pioneer': require('../../assets/badges/deployment-pioneer.png') as number,
  'lab-runner': require('../../assets/badges/lab-runner.png') as number,
  'note-keeper': require('../../assets/badges/note-keeper.png') as number,
  'league-climber': require('../../assets/badges/league-climber.png') as number,
};

const tierAccents: Record<LeagueTier, string> = {
  bronze: '#b87535',
  silver: '#a7adb4',
  gold: '#d99a11',
  platinum: '#7f8f9b',
  diamond: '#5bb6e6',
};

export const celebrationSparklesLottie = require('../../assets/lottie/celebration-sparkles.json');

export type CelebrationArtwork = {
  primary: ImageSourcePropType;
  secondary?: ImageSourcePropType;
  accent: string;
  kind: 'league' | 'badge' | 'course' | 'certificate' | 'level' | 'season' | 'generic';
  kicker: string;
};

export function getCelebrationArtwork(event: CelebrationEvent): CelebrationArtwork {
  if ((event.type === 'league_promotion' || event.type === 'league_demotion') && event.nextTier) {
    return {
      primary: leagueBadgeAssets[event.nextTier],
      secondary: event.previousTier ? leagueBadgeAssets[event.previousTier] : undefined,
      accent: tierAccents[event.nextTier],
      kind: 'league',
      kicker: event.type === 'league_promotion' ? 'Lig Yükseldi' : 'Lig Değişti',
    };
  }

  const badgeKey = event.badgeSlug || event.assetKey;
  if (badgeKey && badgeAssets[badgeKey]) {
    return {
      primary: badgeAssets[badgeKey],
      accent: '#d99a11',
      kind: 'badge',
      kicker: 'Rozet Kazanıldı',
    };
  }

  const tierKey = event.assetKey as LeagueTier | undefined;
  if (tierKey && leagueBadgeAssets[tierKey]) {
    return {
      primary: leagueBadgeAssets[tierKey],
      accent: tierAccents[tierKey],
      kind: 'league',
      kicker: 'Lig Başarısı',
    };
  }

  if (event.type === 'course_completed') {
    return {
      primary: genericAchievementAsset,
      accent: '#35c77b',
      kind: 'course',
      kicker: 'Kurs Tamamlandı',
    };
  }

  if (event.type === 'certificate_earned') {
    return {
      primary: genericAchievementAsset,
      accent: '#5bb6e6',
      kind: 'certificate',
      kicker: 'Sertifika Kazanıldı',
    };
  }

  if (event.type === 'level_assigned') {
    return {
      primary: genericAchievementAsset,
      accent: '#f5a524',
      kind: 'level',
      kicker: 'Seviye Hazır',
    };
  }

  if (event.type === 'season_reward') {
    return {
      primary: genericAchievementAsset,
      accent: '#d99a11',
      kind: 'season',
      kicker: 'Sezon Ödülü',
    };
  }

  return {
    primary: genericAchievementAsset,
    accent: '#d99a11',
    kind: 'generic',
    kicker: 'Başarı Açıldı',
  };
}

export function getCelebrationActionLabel(event: CelebrationEvent): string {
  switch (event.type) {
    case 'badge_earned':
      return 'Rozetlere Git';
    case 'league_promotion':
    case 'league_demotion':
    case 'league_top_rank':
      return 'Ligi Gör';
    case 'season_reward':
      return 'Ödülleri Gör';
    case 'certificate_earned':
      return 'Sertifikayı Gör';
    default:
      return event.targetRoute ? 'Devam Et' : 'Harika';
  }
}

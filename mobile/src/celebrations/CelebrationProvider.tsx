import React, { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { CelebrationOverlay } from './CelebrationOverlay';
import { createLocalCelebrationNotification, isMilestoneCelebrationEvent, isMilestoneCelebrationType, mapNotificationToCelebrationEvent, sortAndDedupeCelebrationEvents } from './events';
import type { CelebrationEvent, EnqueueCelebrationInput } from './types';
import {
  enqueueCelebrationEvent,
  getCelebrationEvents,
  markCelebrationSeen,
} from '../lib/academyApi';

type CelebrationContextValue = {
  refreshCelebrations: () => Promise<void>;
  celebrate: (input: EnqueueCelebrationInput) => Promise<void>;
  queueLength: number;
};

const CelebrationContext = createContext<CelebrationContextValue | null>(null);

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [pendingEvents, setPendingEvents] = useState<CelebrationEvent[]>([]);
  const [activeEvent, setActiveEvent] = useState<CelebrationEvent | null>(null);

  const refreshCelebrations = useCallback(async () => {
    const nextEvents = await getCelebrationEvents();
    setPendingEvents((currentEvents) => sortAndDedupeCelebrationEvents([...currentEvents, ...nextEvents].filter(isMilestoneCelebrationEvent)));
  }, []);

  const celebrate = useCallback(async (input: EnqueueCelebrationInput) => {
    if (!isMilestoneCelebrationType(input.type)) return;
    const response = await enqueueCelebrationEvent(input).catch(() => ({
      id: `local:${input.dedupeKey || `${input.type}-${Date.now()}`}`,
      created: true,
    }));
    if (!response.created) return;
    const localRow = createLocalCelebrationNotification({
      ...input,
      dedupeKey: input.dedupeKey || response.id,
    });
    const localEvent = mapNotificationToCelebrationEvent({
      ...localRow,
      id: response.id || localRow.id,
    });
    if (localEvent && isMilestoneCelebrationEvent(localEvent)) {
      setPendingEvents((currentEvents) => sortAndDedupeCelebrationEvents([...currentEvents, localEvent]));
    }
  }, []);

  useEffect(() => {
    refreshCelebrations().catch(() => undefined);
  }, [refreshCelebrations]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshCelebrations().catch(() => undefined);
      }
    });
    return () => subscription.remove();
  }, [refreshCelebrations]);

  useEffect(() => {
    if (activeEvent || pendingEvents.length === 0) return;
    setActiveEvent(pendingEvents[0]);
    setPendingEvents((events) => events.slice(1));
  }, [activeEvent, pendingEvents]);

  const dismissActiveEvent = useCallback(() => {
    const dismissedEvent = activeEvent;
    setActiveEvent(null);
    if (dismissedEvent) {
      markCelebrationSeen(dismissedEvent.id).catch(() => undefined);
    }
  }, [activeEvent]);

  const value = useMemo<CelebrationContextValue>(() => ({
    refreshCelebrations,
    celebrate,
    queueLength: pendingEvents.length + (activeEvent ? 1 : 0),
  }), [activeEvent, celebrate, pendingEvents.length, refreshCelebrations]);

  return (
    <CelebrationContext.Provider value={value}>
      {children}
      <CelebrationOverlay event={activeEvent} visible={Boolean(activeEvent)} onDismiss={dismissActiveEvent} />
    </CelebrationContext.Provider>
  );
}

export function useCelebrations() {
  const context = React.use(CelebrationContext);
  if (!context) {
    throw new Error('useCelebrations must be used within CelebrationProvider');
  }
  return context;
}

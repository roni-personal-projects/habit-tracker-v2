'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useHabitStore } from '@/store/useHabitStore';

export default function AuthSync() {
  const { userId, isLoaded } = useAuth();
  const initialize = useHabitStore((state) => state.initialize);

  useEffect(() => {
    if (isLoaded && userId) {
      initialize(userId);
    }
  }, [userId, isLoaded, initialize]);

  return null;
}

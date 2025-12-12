'use client';

import { Auth, onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';

import { useAuth } from '..';

export const useUser = (auth?: Auth | null) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authService = auth ?? useAuth();

  useEffect(() => {
    if (!authService) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(authService, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [authService]);

  return { user, loading };
};

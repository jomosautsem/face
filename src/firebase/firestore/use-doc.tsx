'use client';

import {
  doc,
  onSnapshot,
  type DocumentReference,
  type Query,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { useFirestore } from '..';

export const useDoc = <T,>(
  path: string | null | DocumentReference | Query
) => {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore || !path) {
      setLoading(false);
      return;
    }
    try {
      const docRef = typeof path === 'string' ? doc(firestore, path) : path;
      const unsubscribe = onSnapshot(
        docRef as DocumentReference,
        (snapshot) => {
          const doc = { id: snapshot.id, ...snapshot.data() } as T;
          setData(doc);
          setLoading(false);
        },
        (err) => {
          setError(err);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err: any) {
      setError(err);
      setLoading(false);
    }
  }, [firestore, path]);
  return { data, loading, error };
};

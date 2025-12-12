'use client';

import {
  collection,
  onSnapshot,
  query,
  where,
  type CollectionReference,
  type Query,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { useFirestore } from '..';

export const useCollection = <T,>(
  path: string | null | CollectionReference | Query,
  ...queryConstraints: any[]
) => {
  const [data, setData] = useState<T[]>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore || !path) {
      setLoading(false);
      return;
    }

    try {
      const ref =
        typeof path === 'string'
          ? query(collection(firestore, path), ...queryConstraints)
          : query(path, ...queryConstraints);

      const unsubscribe = onSnapshot(
        ref,
        (snapshot) => {
          const docs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as T[];
          setData(docs);
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

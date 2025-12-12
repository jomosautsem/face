'use client';

import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { createContext, ReactNode, useContext } from 'react';

import { FirebaseClientProvider } from './client-provider';

export const FirebaseContext = createContext<{
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}>({
  app: null,
  auth: null,
  firestore: null,
});

export const useFirebase = () => useContext(FirebaseContext);

export const useFirebaseApp = () => useContext(FirebaseContext)?.app;

export const useAuth = () => useContext(FirebaseContext)?.auth;

export const useFirestore = () => useContext(FirebaseContext)?.firestore;

export function FirebaseProvider({
  children,
  app,
  auth,
  firestore,
}: {
  children: ReactNode;
  app?: FirebaseApp;
  auth?: Auth;
  firestore?: Firestore;
}) {
  if (app && auth && firestore) {
    return (
      <FirebaseContext.Provider value={{ app, auth, firestore }}>
        {children}
      </FirebaseContext.Provider>
    );
  }
  return <FirebaseClientProvider>{children}</FirebaseClientProvider>;
}

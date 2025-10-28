import { initializeApp, getApps } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

export function getFirebaseApp() {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
    measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string) || undefined,
  } as any;
  if (!getApps().length) {
    initializeApp(config);
  }
}

export function getFirebaseMessaging() {
  getFirebaseApp();
  return getMessaging();
}

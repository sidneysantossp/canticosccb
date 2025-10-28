import { getFirebaseMessaging } from './firebase';
import { apiFetch } from '../api-helper';
import { getToken, onMessage, isSupported } from 'firebase/messaging';

const SW_URL = '/firebase-messaging-sw.js';

export async function registerWebPushToken(usuarioId: number | null, plataforma: 'web' | 'android' | 'ios' = 'web') {
  try {
    console.log('[WebPush] Starting registration...');
    const supported = await isSupported();
    if (!supported) {
      console.warn('[WebPush] Push not supported by this browser');
      return null;
    }

    const vapid = import.meta.env.VITE_FIREBASE_VAPID_KEY as string;
    if (!vapid) {
      console.warn('[WebPush] VAPID key not configured (VITE_FIREBASE_VAPID_KEY)');
      return null;
    }

    // Ask permission explicitly
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'default') {
        const perm = await Notification.requestPermission();
        console.log('[WebPush] Notification permission:', perm);
      }
      if (Notification.permission !== 'granted') {
        console.warn('[WebPush] Notifications permission not granted');
        return null;
      }
    }

    // Ensure service worker is registered and use that registration
    let reg: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      try {
        reg = await navigator.serviceWorker.register(SW_URL);
        console.log('[WebPush] Service worker registered:', reg.scope);
      } catch (err) {
        console.warn('[WebPush] Failed to register service worker:', err);
        reg = await navigator.serviceWorker.getRegistration() || undefined;
      }
    }

    const messaging = getFirebaseMessaging();
    const token = await getToken(messaging, { vapidKey: vapid, serviceWorkerRegistration: reg });
    console.log('[WebPush] getToken result:', !!token);
    if (!token) return null;

    // Send token to backend
    const res = await apiFetch('api/push/register-token.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, usuario_id: usuarioId, plataforma })
    });
    const text = await res.text();
    console.log('[WebPush] register-token response:', res.status, text);
    if (!res.ok) {
      console.warn('[WebPush] Failed to save token on backend');
      return null;
    }

    // Optional: foreground messages listener
    try {
      onMessage(messaging, (payload) => {
        console.log('[FCM] Message received in foreground:', payload);
      });
    } catch {}

    return token;
  } catch (e) {
    console.warn('[WebPush] Failed to register web push token', e);
    return null;
  }
}

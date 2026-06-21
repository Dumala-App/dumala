import {useEffect, useRef, useState} from 'react';
import {useRegisterSW} from 'virtual:pwa-register/react';

export type ServiceWorkerRegistrationStatus =
  | 'unsupported'
  | 'development'
  | 'registering'
  | 'registered'
  | 'error';

export interface PwaLifecycle {
  registrationStatus: ServiceWorkerRegistrationStatus;
  isOnline: boolean;
  showReconnected: boolean;
  updateAvailable: boolean;
  offlineReady: boolean;
  isUpdating: boolean;
  registrationError: string;
  activateUpdate: () => Promise<void>;
  dismissUpdate: () => void;
  dismissOfflineReady: () => void;
  dismissRegistrationError: () => void;
}

const LEGACY_FONT_CACHE_NAMES = [
  'dumala-google-font-stylesheets',
  'dumala-google-font-files',
];

const removeLegacyFontCaches = async () => {
  if (!('caches' in window)) return;
  await Promise.all(LEGACY_FONT_CACHE_NAMES.map(cacheName => window.caches.delete(cacheName)));
};

export function usePwaLifecycle(): PwaLifecycle {
  const supportsServiceWorker = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  const [isOnline, setIsOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [registrationError, setRegistrationError] = useState('');
  const [registrationStatus, setRegistrationStatus] = useState<ServiceWorkerRegistrationStatus>(() => {
    if (!supportsServiceWorker) return 'unsupported';
    return import.meta.env.PROD ? 'registering' : 'development';
  });
  const wasOffline = useRef(!isOnline);

  const {
    needRefresh: [updateAvailable, setUpdateAvailable],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW: (_workerUrl, registration) => {
      setRegistrationStatus(registration ? 'registered' : 'error');
      void removeLegacyFontCaches().catch(error => {
        console.warn('Dumala could not remove legacy font caches.', error);
      });
      if (!registration) {
        setRegistrationError('Offline support could not start in this browser.');
      }
    },
    onRegisterError: error => {
      console.error('Dumala service worker registration failed.', error);
      setRegistrationStatus('error');
      setRegistrationError('Offline support could not start. Online use is still available.');
    },
  });

  useEffect(() => {
    const handleOffline = () => {
      wasOffline.current = true;
      setIsOnline(false);
      setShowReconnected(false);
    };
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline.current) {
        wasOffline.current = false;
        setShowReconnected(true);
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  useEffect(() => {
    if (!showReconnected) return;
    const timeoutId = window.setTimeout(() => setShowReconnected(false), 4500);
    return () => window.clearTimeout(timeoutId);
  }, [showReconnected]);

  useEffect(() => {
    if (!offlineReady) return;
    const timeoutId = window.setTimeout(() => setOfflineReady(false), 6000);
    return () => window.clearTimeout(timeoutId);
  }, [offlineReady, setOfflineReady]);

  const activateUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateServiceWorker(true);
    } catch (error) {
      console.error('Dumala service worker update failed.', error);
      setRegistrationError('The update could not be applied. The current version is still available.');
      setIsUpdating(false);
    }
  };

  return {
    registrationStatus,
    isOnline,
    showReconnected,
    updateAvailable,
    offlineReady,
    isUpdating,
    registrationError,
    activateUpdate,
    dismissUpdate: () => setUpdateAvailable(false),
    dismissOfflineReady: () => setOfflineReady(false),
    dismissRegistrationError: () => setRegistrationError(''),
  };
}

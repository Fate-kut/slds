/**
 * Service Worker registration and management
 */

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service Worker registered:', registration.scope);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New Service Worker available');
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const success = await registration.unregister();
    console.log('Service Worker unregistered:', success);
    return success;
  } catch (error) {
    console.error('Service Worker unregistration failed:', error);
    return false;
  }
}

export function cacheMaterial(url: string, id: string): void {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_MATERIAL',
      url,
      id,
    });
  }
}

export function removeCachedMaterial(url: string): void {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'REMOVE_CACHED_MATERIAL',
      url,
    });
  }
}

export function onServiceWorkerMessage(
  callback: (event: MessageEvent) => void
): () => void {
  navigator.serviceWorker.addEventListener('message', callback);
  return () => navigator.serviceWorker.removeEventListener('message', callback);
}

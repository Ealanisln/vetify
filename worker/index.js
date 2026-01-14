/**
 * Custom Service Worker Extensions
 *
 * This file is merged with the auto-generated service worker by next-pwa.
 * It handles push notifications and notification click events.
 */

// Push notification event handler
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('[SW] Push event received but no data');
    return;
  }

  try {
    const data = event.data.json();

    const options = {
      body: data.body || '',
      icon: data.icon || '/favicon/android-chrome-192x192.png',
      badge: data.badge || '/favicon/favicon-96x96.png',
      tag: data.tag || 'vetify-notification',
      data: data.data || {},
      actions: data.actions || [],
      vibrate: [100, 50, 100],
      requireInteraction: data.requireInteraction || false,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Vetify', options)
    );
  } catch (error) {
    console.error('[SW] Error handling push event:', error);
  }
});

// Notification click event handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = event.notification.data || {};
  const action = event.action;

  // Determine the URL to open based on the action and notification type
  let urlToOpen = '/dashboard';

  if (action === 'dismiss') {
    return; // Just close the notification
  }

  // Handle different notification types
  const notificationType = notificationData.type;

  switch (notificationType) {
    case 'appointment_reminder':
    case 'appointment_confirmation':
    case 'appointment_cancelled':
      if (notificationData.appointmentId) {
        urlToOpen = `/dashboard/appointments/${notificationData.appointmentId}`;
      } else {
        urlToOpen = '/dashboard/appointments';
      }
      break;

    case 'low_stock_alert':
      urlToOpen = '/dashboard/inventory';
      break;

    case 'treatment_reminder':
      if (notificationData.petId) {
        urlToOpen = `/dashboard/pets/${notificationData.petId}`;
      } else {
        urlToOpen = '/dashboard/pets';
      }
      break;

    case 'new_appointment_request':
      urlToOpen = '/dashboard/appointments';
      break;

    default:
      // Use custom URL if provided
      if (notificationData.url) {
        urlToOpen = notificationData.url;
      }
  }

  // Handle the action button click
  if (action === 'view' && notificationData.viewUrl) {
    urlToOpen = notificationData.viewUrl;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window open
      for (const client of windowClients) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }

      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Push subscription change event (handle subscription expiry)
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: event.newSubscription,
        deviceName: 'Auto-renewed subscription',
      }),
    }).catch((error) => {
      console.error('[SW] Failed to renew push subscription:', error);
    })
  );
});

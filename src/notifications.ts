export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) return false;
  try {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  } catch (e) {
    return false;
  }
};

export const sendBrowserNotification = (title: string, options?: { body?: string; icon?: string }) => {
  // Dispatch in-app event first for instant UI toast feedback
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('simzy-inapp-notification', {
      detail: { title, body: options?.body || '' }
    });
    window.dispatchEvent(event);
  }

  // If browser notification is allowed, send native notification
  if (isNotificationSupported() && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: options?.body,
        icon: options?.icon || 'https://fav.farm/💰',
      });
    } catch (e) {
      console.warn('Native notification failed:', e);
    }
  }
};

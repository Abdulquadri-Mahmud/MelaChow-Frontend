import axios from 'axios';

/**
 * Convert VAPID public key from base64 to Uint8Array
 * Required for subscribing to push notifications
 */
export function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Fetch VAPID public key from backend
 */
export async function getVapidPublicKey() {
    try {
        const response = await axios.get('/api/notifications/vapid-public-key', {
            withCredentials: true,
        });
        return response.data.publicKey;
    } catch (error) {
        console.error('Failed to fetch VAPID public key:', error);
        throw error;
    }
}

/**
 * Send subscription to backend
 */
export async function sendSubscriptionToServer(subscription) {
    try {
        // Determine device type
        let deviceType = 'desktop';
        if (/Mobi|Android/i.test(navigator.userAgent)) {
            deviceType = 'mobile';
        } else if (/Tablet|iPad/i.test(navigator.userAgent)) {
            deviceType = 'tablet';
        }

        const payload = {
            subscription,
            deviceType
        };

        const response = await axios.post('/api/notifications/subscribe', payload, {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Failed to send subscription to server:', error);
        throw error;
    }
}

/**
 * Remove subscription from backend
 */
export async function removeSubscriptionFromServer(subscription) {
    try {
        // Temporary debug logging
        console.log('[Push Service] Unsubscribe payload:', subscription);
        console.log('[Push Service] Subscription endpoint:', subscription?.endpoint);

        const response = await axios.delete('/api/notifications/unsubscribe', {
            data: subscription, // Send subscription data directly, not wrapped
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Failed to remove subscription from server:', error);
        console.error('Error response:', error.response?.data);
        throw error;
    }
}

/**
 * Trigger a test notification
 */
export async function testPushNotification() {
    try {
        const response = await axios.post('/api/notifications/test', {}, {
            withCredentials: true,
        });
        return response.data;
    } catch (error) {
        console.error('Failed to trigger test notification:', error);
        throw error;
    }
}

/**
 * Subscribe user to push notifications
 */
export async function subscribeUserToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push notifications are not supported by this browser');
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const vapidPublicKey = await getVapidPublicKey();
        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey,
        });

        await sendSubscriptionToServer(subscription);
        return subscription;
    } catch (error) {
        console.error('Failed to subscribe user to push notifications:', error);
        throw error;
    }
}

/**
 * Unsubscribe user from push notifications
 */
export async function unsubscribeUserFromPush() {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            // 1. Capture the subscription data FIRST (before it becomes invalid)
            // PushSubscription objects don't always serialize well after unsubscribe()
            const subscriptionData = subscription.toJSON();

            // 2. Remove from server FIRST
            // This ensures the server gets the endpoint it needs to identify the subscription
            await removeSubscriptionFromServer(subscriptionData);

            // 3. Finally unsubscribe on the client
            await subscription.unsubscribe();
        }
        return true;
    } catch (error) {
        console.error('Failed to unsubscribe user from push notifications:', error);
        throw error;
    }
}

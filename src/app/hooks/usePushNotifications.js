'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    subscribeUserToPush,
    unsubscribeUserFromPush
} from '../lib/push-notification-service';
import toast from 'react-hot-toast';

export function usePushNotifications() {
    const [subscription, setSubscription] = useState(null);
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState('default');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /**
     * Listen for messages from Service Worker (Foreground notifications)
     */
    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

        const handleMessage = (event) => {
            if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
                const { title, body } = event.data.payload;
                toast.success(
                    <div className="flex flex-col gap-1">
                        <span className="font-bold text-sm">{title}</span>
                        <span className="text-xs opacity-90">{body}</span>
                    </div>,
                    { duration: 5000 }
                );
            }
        };

        navigator.serviceWorker.addEventListener('message', handleMessage);
        return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
    }, []);

    /**
     * Initialize and check support/status
     */
    useEffect(() => {
        const checkSupport = async () => {
            setLoading(true);
            const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window;
            setIsSupported(pushSupported);

            if (pushSupported) {
                setPermission(Notification.permission);

                try {
                    const registration = await navigator.serviceWorker.ready;
                    const sub = await registration.pushManager.getSubscription();
                    setSubscription(sub);

                    // Sync with localStorage if needed
                    if (sub) {
                        localStorage.setItem('push_notifications_enabled', 'true');
                    }
                } catch (err) {
                    console.error('Error checking push subscription:', err);
                    setError('Failed to check notification status');
                }
            }

            setLoading(false);
        };

        checkSupport();
    }, []);

    /**
     * Subscribe to push notifications
     */
    const subscribe = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // First request permission
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                const sub = await subscribeUserToPush();
                setSubscription(sub);
                localStorage.setItem('push_notifications_enabled', 'true');
                localStorage.setItem('push_prompt_dismissed', 'true'); // Dismiss prompt once subscribed
                return true;
            } else if (result === 'denied') {
                setError('Notification permission denied');
                return false;
            }
        } catch (err) {
            console.error('Subscription error:', err);
            setError(err.message || 'Failed to subscribe to notifications');
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Unsubscribe from push notifications
     */
    const unsubscribe = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            await unsubscribeUserFromPush();
            setSubscription(null);
            localStorage.setItem('push_notifications_enabled', 'false');
            return true;
        } catch (err) {
            console.error('Unsubscription error:', err);
            setError(err.message || 'Failed to unsubscribe from notifications');
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Handle prompt dismissal
     */
    const dismissPrompt = useCallback(() => {
        localStorage.setItem('push_prompt_dismissed', 'true');
    }, []);

    /**
     * Check if prompt should be shown
     */
    const shouldShowPrompt = useCallback(() => {
        if (!isSupported || permission === 'denied' || subscription) {
            return false;
        }

        const dismissed = localStorage.getItem('push_prompt_dismissed');
        return dismissed !== 'true';
    }, [isSupported, permission, subscription]);

    return {
        isSupported,
        subscription,
        permission,
        loading,
        error,
        subscribe,
        unsubscribe,
        shouldShowPrompt,
        dismissPrompt
    };
}

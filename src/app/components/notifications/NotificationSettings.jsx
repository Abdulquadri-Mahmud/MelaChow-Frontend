'use client';

import { usePushNotifications } from '../../hooks/usePushNotifications';
import { Bell, BellOff, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { testPushNotification } from '../../lib/push-notification-service';
import toast from 'react-hot-toast';
import React from 'react';

const NotificationSettings = () => {
    const {
        isSupported,
        subscription,
        permission,
        loading,
        error,
        subscribe,
        unsubscribe
    } = usePushNotifications();

    if (!isSupported) {
        return (
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 text-gray-500">
                    <BellOff size={20} />
                    <div>
                        <p className="font-semibold text-sm">Push Notifications Unsupported</p>
                        <p className="text-xs mt-0.5">Your browser doesn't support push notifications.</p>
                    </div>
                </div>
            </div>
        );
    }

    const isEnabled = !!subscription;
    const isDenied = permission === 'denied';

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${isEnabled ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                        <Bell size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">Push Notifications</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {isEnabled
                                ? 'You are receiving real-time order updates'
                                : isDenied
                                    ? 'Notifications are blocked in browser'
                                    : 'Stay updated with your orders'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {loading && <Loader2 size={18} className="animate-spin text-orange-500" />}

                    <button
                        onClick={isEnabled ? unsubscribe : subscribe}
                        disabled={loading || isDenied}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${isEnabled ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'
                            } ${isDenied ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        role="switch"
                        aria-checked={isEnabled}
                    >
                        <span
                            className={`${isEnabled ? 'translate-x-6' : 'translate-x-1'
                                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                    </button>
                </div>
            </div>

            {isDenied && (
                <div className="flex gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
                    <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                    <div className="text-xs text-red-600 dark:text-red-400">
                        <p className="font-semibold">Notifications are Blocked</p>
                        <p className="mt-0.5">Please update your browser settings to allow notifications for GrubDash.</p>
                    </div>
                </div>
            )}

            {error && !isDenied && (
                <div className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20 text-xs text-amber-600 dark:text-amber-400">
                    <AlertCircle size={18} className="flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {isEnabled && (
                <div className="flex items-center gap-2 text-[10px] text-gray-400 px-1 font-medium uppercase tracking-wider">
                    <CheckCircle2 size={10} className="text-green-500" />
                    Subscription active
                </div>
            )}

            {/* Dev Mode Testing */}
            {process.env.NODE_ENV === 'development' && isEnabled && (
                <div className="mt-4 p-4 border-t border-gray-100 dark:border-gray-800 pt-6">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">Developer Tools</p>
                    <button
                        onClick={async () => {
                            try {
                                toast.loading('Sending test notification...', { id: 'test-push' });
                                await testPushNotification();
                                toast.success('Test notification sent! Check your device.', { id: 'test-push' });
                            } catch (err) {
                                toast.error('Failed to send test notification', { id: 'test-push' });
                            }
                        }}
                        className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        <Bell size={14} /> Send Test Push (Backend)
                    </button>
                    <p className="text-[9px] text-gray-400 mt-2 text-center">
                        This calls POST /api/notifications/test to verify end-to-end integration.
                    </p>
                </div>
            )}
        </div>
    );
};

export default NotificationSettings;

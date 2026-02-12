'use client';

import React from 'react';
import { Bell, Smartphone, Wifi, WifiOff } from 'lucide-react';
import { useNotificationManager } from '@/app/hooks/useNotificationManager';
import NotificationSettings from '@/app/components/notifications/NotificationSettings';
import Header2 from '@/app/components/App_Header/Header2';

export default function NotificationSettingsPage() {
    const {
        isRealtimeConnected,
        isPushEnabled,
        isPushSupported,
        pushPermission
    } = useNotificationManager();

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <Header2 />

            <div className="max-w-2xl mx-auto p-4 space-y-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Notification Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage how you receive updates</p>
                </div>

                {/* Connection Status */}
                <div className="bg-white rounded-2xl p-4 space-y-3 border border-gray-100">
                    <h2 className="font-bold text-sm text-gray-900">Connection Status</h2>

                    {/* Real-time (WebSocket) */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                            {isRealtimeConnected ? (
                                <Wifi size={20} className="text-green-500" />
                            ) : (
                                <WifiOff size={20} className="text-gray-400" />
                            )}
                            <div>
                                <p className="text-sm font-bold text-gray-900">Real-time Updates</p>
                                <p className="text-xs text-gray-500">Instant in-app notifications</p>
                            </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${isRealtimeConnected
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                            {isRealtimeConnected ? 'Active' : 'Inactive'}
                        </div>
                    </div>

                    {/* Push Notifications */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Bell size={20} className={isPushEnabled ? 'text-orange-500' : 'text-gray-400'} />
                            <div>
                                <p className="text-sm font-bold text-gray-900">Push Notifications</p>
                                <p className="text-xs text-gray-500">Alerts when app is closed</p>
                            </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${isPushEnabled
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                            {isPushEnabled ? 'Enabled' : 'Disabled'}
                        </div>
                    </div>
                </div>

                {/* How It Works */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                    <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                        <span>💡</span>
                        How Notifications Work
                    </h3>
                    <ul className="space-y-2 text-sm text-blue-700">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">•</span>
                            <span><strong>App Open:</strong> Instant updates via real-time connection</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">•</span>
                            <span><strong>App Closed:</strong> Push notifications bring you back</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">•</span>
                            <span><strong>Critical Updates:</strong> Both methods ensure you never miss important alerts</span>
                        </li>
                    </ul>
                </div>

                {/* Push Notification Controls */}
                <NotificationSettings />

                {/* Recommendation */}
                {!isPushEnabled && isPushSupported && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                        <p className="text-sm text-amber-800">
                            💡 <strong>Recommendation:</strong> Enable push notifications to stay updated even when the app is closed. You'll never miss order updates or delivery alerts!
                        </p>
                    </div>
                )}

                {/* Troubleshooting */}
                {!isRealtimeConnected && (
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                        <h3 className="font-bold text-gray-900 mb-2">Real-time Connection Inactive</h3>
                        <p className="text-sm text-gray-600 mb-3">
                            Don't worry! We're using backup polling to keep you updated. Real-time will reconnect automatically.
                        </p>
                        <p className="text-xs text-gray-500">
                            If this persists, try refreshing the page or check your internet connection.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useGuestAuth } from '@/lib/hooks/useGuestAuth';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { getProviderConfig } from '@/lib/constants/aiProviderIcons';
import { APP_CONFIG } from '@/lib/config/appConfig';

interface AppHeaderProps {
    title?: string;
    showBack?: boolean;
    backUrl?: string;
}

export default function AppHeader({ title = 'AI Resume Builder', showBack = false, backUrl = '/dashboard' }: AppHeaderProps) {
    const { user } = useAuthStore();
    const { isGuest, usageLimits, upgradeToGoogle } = useGuestAuth();
    const router = useRouter();
    const [llmProvider, setLlmProvider] = useState<'gemini' | 'openai' | 'claude' | null>(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    useEffect(() => {
        if (user) {
            loadLlmConfig();
        }
    }, [user]);

    const loadLlmConfig = async () => {
        if (!user) return;

        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                if (data.llmConfig?.provider) {
                    setLlmProvider(data.llmConfig.provider);
                }
            }
        } catch (error) {
            console.error('Error loading LLM config:', error);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.push('/');
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    const handleUpgrade = () => {
        setShowUpgradeModal(true);
    };

    const getLlmBadge = () => {
        if (!llmProvider) return null;

        const config = getProviderConfig(llmProvider);
        const IconComponent = config.icon;

        return (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.color} text-xs font-medium`}>
                <IconComponent />
                <span>{config.name}</span>
            </div>
        );
    };

    const getUsageBadge = () => {
        if (!isGuest || APP_CONFIG.guest.unlimited) return null;

        const total = APP_CONFIG.guest.limits.resumeGenerations;
        const used = usageLimits.current || 0;
        const percentage = (used / total) * 100;

        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-200 bg-purple-50 text-xs font-medium text-purple-700">
                <span>📊 {used}/{total} resumes</span>
            </div>
        );
    };

    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
                {/* Left Side */}
                <div className="flex items-center gap-4">
                    {showBack && (
                        <button
                            onClick={() => router.push(backUrl)}
                            className="text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            ← Back
                        </button>
                    )}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg"></div>
                        <span className="text-lg font-bold text-gray-900">{title}</span>
                    </div>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-3">
                    {/* LLM Badge */}
                    {getLlmBadge()}

                    {/* Usage Badge (only for guests with limits) */}
                    {getUsageBadge()}

                    {/* User Actions */}
                    {user && (
                        <div className="flex items-center gap-3">
                            {/* Guest User - Show Sign Up */}
                            {isGuest ? (
                                <button
                                    onClick={handleUpgrade}
                                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all text-sm"
                                >
                                    Sign Up
                                </button>
                            ) : (
                                /* Logged-In User - Show Profile & Sign Out */
                                <>
                                    <button
                                        onClick={() => router.push('/profile')}
                                        className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors text-sm"
                                    >
                                        Profile
                                    </button>
                                    <button
                                        onClick={handleSignOut}
                                        className="px-4 py-2 text-gray-700 hover:text-red-600 font-medium transition-colors text-sm"
                                    >
                                        Sign Out
                                    </button>
                                </>
                            )}

                            {/* User Avatar */}
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {isGuest ? '👤' : (user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?')}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Upgrade Modal */}
            {showUpgradeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Upgrade Your Account</h2>
                        <p className="text-gray-600 mb-6">
                            Sign up to get unlimited access and keep all your data!
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={async () => {
                                    try {
                                        await upgradeToGoogle();
                                        setShowUpgradeModal(false);
                                    } catch (error) {
                                        console.error('Upgrade error:', error);
                                    }
                                }}
                                className="w-full px-6 py-3 bg-white border-2 border-gray-300 rounded-lg font-semibold hover:border-gray-400 transition-all flex items-center justify-center gap-2"
                            >
                                <span>🔷</span> Continue with Google
                            </button>
                            <button
                                onClick={() => router.push('/signup')}
                                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                            >
                                Sign Up with Email
                            </button>
                            <button
                                onClick={() => setShowUpgradeModal(false)}
                                className="w-full px-6 py-3 text-gray-600 hover:text-gray-900 font-medium"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}

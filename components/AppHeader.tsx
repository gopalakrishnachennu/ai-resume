'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getProviderConfig } from '@/lib/constants/aiProviderIcons';

interface AppHeaderProps {
    title?: string;
    showBack?: boolean;
    backUrl?: string;
}

export default function AppHeader({ title = 'AI Resume Builder', showBack = false, backUrl = '/dashboard' }: AppHeaderProps) {
    const { user } = useAuthStore();
    const router = useRouter();
    const [llmProvider, setLlmProvider] = useState<'gemini' | 'openai' | 'claude' | null>(null);

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

                    {/* User Info */}
                    {user && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

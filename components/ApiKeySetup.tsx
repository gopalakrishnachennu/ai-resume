'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { getProviderConfig } from '@/lib/constants/aiProviderIcons';
import { GuestCacheService } from '@/lib/services/guestCacheService';
import { getGlobalSettings, checkUsageLimits } from '@/lib/services/guestService';

interface ApiKeySetupProps {
    onComplete: () => void;
    existingProvider?: 'gemini' | 'openai' | 'claude';
    existingKey?: string;
}

export default function ApiKeySetup({ onComplete, existingProvider, existingKey }: ApiKeySetupProps) {
    const { user } = useAuthStore();
    const [provider, setProvider] = useState<'gemini' | 'openai' | 'claude'>(existingProvider || 'gemini');
    const [apiKey, setApiKey] = useState(existingKey || '');
    const [saving, setSaving] = useState(false);
    const [globalKeyAvailable, setGlobalKeyAvailable] = useState(false);
    const [freeTriesLeft, setFreeTriesLeft] = useState(0);
    const [debugInfo, setDebugInfo] = useState({ enabled: false, hasKey: false });

    // Load from cache on mount (for guest users)
    useEffect(() => {
        if (!existingKey && !existingProvider) {
            const cached = GuestCacheService.loadApiKey();
            if (cached) {
                setProvider(cached.provider as 'gemini' | 'openai' | 'claude');
                setApiKey(cached.apiKey);
                console.log('[ApiKeySetup] Loaded from cache');
            }
        }
    }, [existingKey, existingProvider]);

    // Debug: Log user state changes
    useEffect(() => {
        console.log('[ApiKeySetup] User state changed:', user ? `User ID: ${user.uid}` : 'No user');

        const checkGlobalKey = async () => {
            if (!user) return;
            const settings = await getGlobalSettings();
            console.log('[ApiKeySetup] Global Settings:', settings);

            const globalKey = settings?.ai?.globalKey;
            console.log('[ApiKeySetup] Global Key Config:', globalKey);

            setDebugInfo({
                enabled: !!globalKey?.enabled,
                hasKey: !!globalKey?.key
            });

            if (globalKey?.enabled && globalKey?.key) {
                const limit = await checkUsageLimits(user, 'globalApiUsage');
                console.log('[ApiKeySetup] Usage Limit:', limit);

                if (limit.canUse) {
                    setGlobalKeyAvailable(true);
                    setFreeTriesLeft((limit.max || 3) - (limit.current || 0));
                } else {
                    console.log('[ApiKeySetup] Limit reached or cannot use');
                }
            } else {
                console.log('[ApiKeySetup] Global key disabled or missing');
            }
        };
        checkGlobalKey();
    }, [user]);

    const handleSave = async () => {
        if (!user) {
            // Silently wait for user to initialize
            return;
        }

        setSaving(true);

        try {
            // ✅ V2 PIPELINE - Handles validation, save, cache, AND toasts
            const { updateApiKey } = await import('@/lib/core/pipelines');
            const success = await updateApiKey(apiKey.trim(), provider, user);

            if (success) {
                onComplete();
            }
        } catch (error) {
            console.error('Error saving API key:', error);
            // Pipeline already showed error toast, no need to show another
        } finally {
            setSaving(false);
        }
    };

    const getProviderInfo = (prov: string) => {
        switch (prov) {
            case 'gemini':
                return {
                    name: 'Google Gemini',
                    placeholder: 'AIzaSy...',
                    link: 'https://makersuite.google.com/app/apikey',
                    description: 'Free tier available with generous limits'
                };
            case 'openai':
                return {
                    name: 'OpenAI',
                    placeholder: 'sk-...',
                    link: 'https://platform.openai.com/api-keys',
                    description: 'GPT-4 and GPT-3.5 models'
                };
            case 'claude':
                return {
                    name: 'Anthropic Claude',
                    placeholder: 'sk-ant-...',
                    link: 'https://console.anthropic.com/settings/keys',
                    description: 'Claude 3 models'
                };
            default:
                return { name: '', placeholder: '', link: '', description: '' };
        }
    };

    const providerInfo = getProviderInfo(provider);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
                {globalKeyAvailable && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                        <div className="text-2xl">🎁</div>
                        <div>
                            <h4 className="font-semibold text-green-800">Free Tries Available!</h4>
                            <p className="text-sm text-green-700 mt-1">
                                You have <strong>{freeTriesLeft} free generations</strong> left using our Global API Key.
                                You can skip setup below and try it out!
                            </p>
                        </div>
                    </div>
                )}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🤖</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        AI Configuration Required
                    </h2>
                    <p className="text-gray-600 text-sm">
                        Choose your preferred AI provider and enter your API key to enable AI-powered resume generation
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Provider Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select AI Provider
                        </label>
                        <select
                            value={provider}
                            onChange={(e) => setProvider(e.target.value as any)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        >
                            <option value="gemini">🔷 Google Gemini (Recommended)</option>
                            <option value="openai">🟢 OpenAI (GPT-4)</option>
                            <option value="claude">🟣 Anthropic Claude</option>
                        </select>
                    </div>

                    {/* Provider Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-900 font-medium mb-1">
                            {providerInfo.name}
                        </p>
                        <p className="text-xs text-blue-700 mb-2">
                            {providerInfo.description}
                        </p>
                        <a
                            href={providerInfo.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                            Get your API key here →
                        </a>
                    </div>

                    {/* API Key Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            API Key
                        </label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={providerInfo.placeholder}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            🔒 Your API key is encrypted and stored securely
                        </p>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={saving || !apiKey.trim() || !user}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                    >
                        {!user ? 'Initializing...' : saving ? 'Saving...' : 'Save & Continue'}
                    </button>

                    <p className="text-xs text-gray-500 text-center">
                        You can change this later in Profile Settings
                    </p>

                    {globalKeyAvailable && (
                        <button
                            onClick={onComplete}
                            className="w-full mt-2 bg-white border border-green-500 text-green-600 py-3 rounded-lg font-semibold hover:bg-green-50 transition-all shadow-sm"
                        >
                            Skip Setup & Use Free Tries ({freeTriesLeft} left)
                        </button>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-100 text-[10px] text-gray-400 text-center font-mono">
                        <p>Debug: Global Key: {debugInfo.enabled ? 'ON' : 'OFF'} | Key: {debugInfo.hasKey ? 'SET' : 'MISSING'} | Tries: {freeTriesLeft}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

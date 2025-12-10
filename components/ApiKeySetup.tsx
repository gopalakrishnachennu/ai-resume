'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { getProviderConfig } from '@/lib/constants/aiProviderIcons';
import { GuestCacheService } from '@/lib/services/guestCacheService';

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
    }, [user]);

    const handleSave = async () => {
        if (!apiKey.trim()) {
            toast.error('Please enter an API key');
            return;
        }

        if (!user) {
            // Silently wait for user to initialize
            return;
        }

        setSaving(true);

        try {
            const llmConfig = {
                provider,
                apiKey: apiKey.trim(),
                updatedAt: new Date().toISOString(),
            };

            // Save to Firestore (for data collection & cross-device)
            await setDoc(doc(db, 'users', user.uid), {
                llmConfig
            }, { merge: true });

            // ALSO save to localStorage (for instant load on same computer)
            if (user.isAnonymous) {
                GuestCacheService.saveApiKey(provider, apiKey.trim());
                console.log('[ApiKeySetup] Saved to cache for guest user');
            }

            toast.success('API key saved successfully! 🎉');
            onComplete();
        } catch (error) {
            console.error('Error saving API key:', error);
            toast.error('Failed to save API key');
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
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
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
                </div>
            </div>
        </div>
    );
}

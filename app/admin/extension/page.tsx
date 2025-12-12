'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/lib/hooks/useAdminAuth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface ExtensionSettings {
    // Feature Toggles
    flashEnabled: boolean;
    autoFillEnabled: boolean;
    pushToExtensionEnabled: boolean;
    firebaseFallbackEnabled: boolean;

    // Install Method
    installMethod: 'developer' | 'store' | 'enterprise';

    // Extension Download/Install Links
    chromeWebStoreUrl: string;
    developerModeInstructions: string;
    extensionZipUrl: string;

    // Version Info
    currentVersion: string;
    minSupportedVersion: string;

    // Display Settings
    showExtensionPrompt: boolean;
    showInstallGuide: boolean;

    // Last updated
    updatedAt?: any;
}

const defaultSettings: ExtensionSettings = {
    flashEnabled: true,
    autoFillEnabled: true,
    pushToExtensionEnabled: true,
    firebaseFallbackEnabled: true,

    installMethod: 'developer',

    chromeWebStoreUrl: '',
    developerModeInstructions: '1. Open chrome://extensions\n2. Enable Developer Mode\n3. Click "Load unpacked"\n4. Select the extension folder',
    extensionZipUrl: '',

    currentVersion: '2.0.0',
    minSupportedVersion: '2.0.0',

    showExtensionPrompt: true,
    showInstallGuide: true,
};

export default function ExtensionSettingsPage() {
    const { isAuthenticated, isLoading, requireAuth } = useAdminAuth();
    const router = useRouter();
    const [settings, setSettings] = useState<ExtensionSettings>(defaultSettings);
    const [saving, setSaving] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        requireAuth();
    }, [isAuthenticated, isLoading]);

    useEffect(() => {
        if (isAuthenticated) {
            loadSettings();
        }
    }, [isAuthenticated]);

    const loadSettings = async () => {
        try {
            const docRef = doc(db, 'adminSettings', 'extension');
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setSettings({ ...defaultSettings, ...docSnap.data() } as ExtensionSettings);
            }
            setLoaded(true);
        } catch (error) {
            console.error('Error loading extension settings:', error);
            toast.error('Failed to load settings');
            setLoaded(true);
        }
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'adminSettings', 'extension'), {
                ...settings,
                updatedAt: serverTimestamp(),
            });
            toast.success('Extension settings saved!');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings');
        }
        setSaving(false);
    };

    const updateSetting = <K extends keyof ExtensionSettings>(
        key: K,
        value: ExtensionSettings[K]
    ) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    if (isLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    🔌 Extension Settings
                                </h1>
                                <p className="text-sm text-gray-600">Manage JobFiller Pro extension</p>
                            </div>
                        </div>
                        <button
                            onClick={saveSettings}
                            disabled={saving}
                            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {!loaded ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Feature Toggles */}
                        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    ⚡ Feature Toggles
                                </h2>
                                <p className="text-sm text-gray-600">Enable or disable extension features</p>
                            </div>
                            <div className="p-6 space-y-6">
                                <ToggleRow
                                    label="Flash Auto-Fill"
                                    description="Allow users to use Flash button for auto-filling job applications"
                                    enabled={settings.flashEnabled}
                                    onChange={(v) => updateSetting('flashEnabled', v)}
                                />
                                <ToggleRow
                                    label="Push to Extension"
                                    description="Push session data directly to extension (fast mode)"
                                    enabled={settings.pushToExtensionEnabled}
                                    onChange={(v) => updateSetting('pushToExtensionEnabled', v)}
                                />
                                <ToggleRow
                                    label="Firebase Fallback"
                                    description="Use Firebase as fallback when extension not detected"
                                    enabled={settings.firebaseFallbackEnabled}
                                    onChange={(v) => updateSetting('firebaseFallbackEnabled', v)}
                                />
                                <ToggleRow
                                    label="Show Extension Prompt"
                                    description="Show install prompt when extension not detected"
                                    enabled={settings.showExtensionPrompt}
                                    onChange={(v) => updateSetting('showExtensionPrompt', v)}
                                />
                            </div>
                        </section>

                        {/* Install Method */}
                        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    📦 Install Method
                                </h2>
                                <p className="text-sm text-gray-600">How users should install the extension</p>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <InstallMethodCard
                                        title="Developer Mode"
                                        description="Load unpacked from local folder"
                                        icon="🛠️"
                                        selected={settings.installMethod === 'developer'}
                                        onClick={() => updateSetting('installMethod', 'developer')}
                                    />
                                    <InstallMethodCard
                                        title="Chrome Web Store"
                                        description="Install from official store"
                                        icon="🏪"
                                        selected={settings.installMethod === 'store'}
                                        onClick={() => updateSetting('installMethod', 'store')}
                                    />
                                    <InstallMethodCard
                                        title="Enterprise"
                                        description="Force install via policy"
                                        icon="🏢"
                                        selected={settings.installMethod === 'enterprise'}
                                        onClick={() => updateSetting('installMethod', 'enterprise')}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Install Links */}
                        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-teal-50">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    🔗 Install Links
                                </h2>
                                <p className="text-sm text-gray-600">URLs and instructions for installing</p>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Chrome Web Store URL
                                    </label>
                                    <input
                                        type="url"
                                        value={settings.chromeWebStoreUrl}
                                        onChange={(e) => updateSetting('chromeWebStoreUrl', e.target.value)}
                                        placeholder="https://chrome.google.com/webstore/detail/..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Extension ZIP Download URL
                                    </label>
                                    <input
                                        type="url"
                                        value={settings.extensionZipUrl}
                                        onChange={(e) => updateSetting('extensionZipUrl', e.target.value)}
                                        placeholder="https://yoursite.com/extension.zip"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Developer Mode Instructions
                                    </label>
                                    <textarea
                                        value={settings.developerModeInstructions}
                                        onChange={(e) => updateSetting('developerModeInstructions', e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Version Info */}
                        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    📋 Version Info
                                </h2>
                                <p className="text-sm text-gray-600">Extension version requirements</p>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Current Version
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.currentVersion}
                                        onChange={(e) => updateSetting('currentVersion', e.target.value)}
                                        placeholder="2.0.0"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Minimum Supported Version
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.minSupportedVersion}
                                        onChange={(e) => updateSetting('minSupportedVersion', e.target.value)}
                                        placeholder="2.0.0"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Save Button (Mobile) */}
                        <div className="md:hidden">
                            <button
                                onClick={saveSettings}
                                disabled={saving}
                                className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save All Changes'}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// Toggle Row Component
function ToggleRow({
    label,
    description,
    enabled,
    onChange,
}: {
    label: string;
    description: string;
    enabled: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h3 className="font-medium text-gray-900">{label}</h3>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
            <button
                onClick={() => onChange(!enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                />
            </button>
        </div>
    );
}

// Install Method Card Component
function InstallMethodCard({
    title,
    description,
    icon,
    selected,
    onClick,
}: {
    title: string;
    description: string;
    icon: string;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`p-4 rounded-xl border-2 text-left transition-all ${selected
                    ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
        >
            <div className="text-2xl mb-2">{icon}</div>
            <h3 className={`font-semibold ${selected ? 'text-indigo-900' : 'text-gray-900'}`}>
                {title}
            </h3>
            <p className="text-sm text-gray-500">{description}</p>
            {selected && (
                <div className="mt-2 flex items-center text-indigo-600 text-sm font-medium">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Selected
                </div>
            )}
        </button>
    );
}

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
    autoProfileSync: boolean; // Auto sync user profile on dashboard load

    // Install Method
    installMethod: 'developer' | 'store' | 'enterprise';

    // Extension IDs (for messaging)
    extensionId: string; // Manual ID for dev mode
    storeExtensionId: string; // Chrome Web Store ID when approved
    webappUrl: string; // Your webapp URL for externally_connectable

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

    // Groq AI Settings
    groqApiKeys: string; // Multiple keys, one per line
    groqModel: string;
    groqEnabled: boolean;
    groqTemperature: number;
    groqMaxTokensPerField: number;

    // Last updated
    updatedAt?: any;
}

const defaultSettings: ExtensionSettings = {
    flashEnabled: true,
    autoFillEnabled: true,
    pushToExtensionEnabled: true,
    firebaseFallbackEnabled: true,
    autoProfileSync: true, // Enabled by default

    installMethod: 'developer',

    extensionId: '', // Set after loading in dev mode
    storeExtensionId: '', // Set after Chrome Web Store approval
    webappUrl: 'https://ai-resume-gopalakrishnachennu.vercel.app', // Your webapp URL

    chromeWebStoreUrl: '',
    developerModeInstructions: '1. Open chrome://extensions\n2. Enable Developer Mode\n3. Click "Load unpacked"\n4. Select the extension folder',
    extensionZipUrl: '',

    currentVersion: '2.0.0',
    minSupportedVersion: '2.0.0',

    showExtensionPrompt: true,
    showInstallGuide: true,

    // Groq AI Defaults
    groqApiKeys: '',
    groqModel: 'llama-3.1-8b-instant',
    groqEnabled: true,
    groqTemperature: 0.3,
    groqMaxTokensPerField: 150,
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

            // Also sync Groq settings to extension if connected
            if (settings.groqEnabled && settings.groqApiKeys) {
                try {
                    const { syncGroqSettingsToExtension } = await import('@/lib/extensionBridge');
                    const result = await syncGroqSettingsToExtension({
                        groqApiKeys: settings.groqApiKeys,
                        groqModel: settings.groqModel,
                        groqEnabled: settings.groqEnabled,
                        groqTemperature: settings.groqTemperature,
                        groqMaxTokensPerField: settings.groqMaxTokensPerField,
                    });
                    if (result.success) {
                        toast.success(`Extension settings saved! ${result.keyCount} API keys synced.`);
                    } else {
                        toast.success('Settings saved! Extension sync optional.');
                    }
                } catch (syncError) {
                    toast.success('Extension settings saved!');
                }
            } else {
                toast.success('Extension settings saved!');
            }
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
                                <ToggleRow
                                    label="Auto Profile Sync"
                                    description="Automatically sync user profile to extension on dashboard load"
                                    enabled={settings.autoProfileSync}
                                    onChange={(v) => updateSetting('autoProfileSync', v)}
                                />
                            </div>
                        </section>


                        {/* Template Builder Section - NEW */}
                        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-rose-50">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    🎨 Template Builder
                                </h2>
                                <p className="text-sm text-gray-600">Design and manage resume templates for users</p>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-md font-medium text-gray-900">Manage Templates</h3>
                                        <p className="text-sm text-gray-500 mt-1">Create, edit, and publish resume templates available to all users.</p>
                                    </div>
                                    <Link
                                        href="/admin/templates"
                                        className="px-4 py-2 bg-white border border-gray-300 shadow-sm text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                                    >
                                        <span>Launch Builder</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        </section>

                        {/* Extension IDs - CORPORATE CONTROL */}
                        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    🔑 Extension IDs
                                </h2>
                                <p className="text-sm text-gray-600">Configure extension ID for messaging (web app → extension)</p>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <p className="text-sm text-amber-800">
                                        <strong>How to find your Extension ID:</strong> Go to <code className="bg-amber-100 px-1 rounded">chrome://extensions</code>,
                                        enable Developer Mode, and look for the ID under your extension name.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Developer Mode Extension ID
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.extensionId}
                                        onChange={(e) => updateSetting('extensionId', e.target.value)}
                                        placeholder="e.g., abcdefghijklmnopqrstuvwxyzabcdef"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Used when Install Method is &quot;Developer Mode&quot;</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Chrome Web Store Extension ID
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.storeExtensionId}
                                        onChange={(e) => updateSetting('storeExtensionId', e.target.value)}
                                        placeholder="Enter after Chrome Web Store approval"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Used when Install Method is &quot;Chrome Web Store&quot;</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        🌐 Webapp URL (for externally_connectable)
                                    </label>
                                    <input
                                        type="url"
                                        value={settings.webappUrl || ''}
                                        onChange={(e) => updateSetting('webappUrl', e.target.value)}
                                        placeholder="e.g., https://your-app.vercel.app"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        ⚠️ Must match the URL in extension&apos;s <code className="bg-gray-100 px-1 rounded">manifest.json</code> → <code className="bg-gray-100 px-1 rounded">externally_connectable</code>
                                    </p>
                                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                                        <strong>Current manifest allows:</strong>
                                        <ul className="mt-1 ml-4 list-disc">
                                            <li>https://*.vercel.app/*</li>
                                            <li>http://localhost:3000/*</li>
                                        </ul>
                                        If your webapp uses a different URL, update the manifest&apos;s <code className="bg-amber-100 px-1 rounded">externally_connectable.matches</code>
                                    </div>
                                </div>
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

                        {/* Groq AI Settings */}
                        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-cyan-50 to-blue-50">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    🤖 Groq AI Settings
                                </h2>
                                <p className="text-sm text-gray-600">Configure AI-powered form filling with Groq</p>
                            </div>
                            <div className="p-6 space-y-6">
                                <ToggleRow
                                    label="Enable Groq AI"
                                    description="Use AI to fill open-ended questions (cover letters, why interested, etc.)"
                                    enabled={settings.groqEnabled}
                                    onChange={(v) => updateSetting('groqEnabled', v)}
                                />

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-800">
                                        <strong>Free Tier:</strong> Add multiple Groq API keys (one per line) for automatic failover.
                                        When one key hits rate limits, the next key is used automatically.
                                        Get free API keys at <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">console.groq.com</a>
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Groq API Keys (one per line)
                                    </label>
                                    <textarea
                                        value={settings.groqApiKeys}
                                        onChange={(e) => updateSetting('groqApiKeys', e.target.value)}
                                        placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxx&#10;gsk_yyyyyyyyyyyyyyyyyyyyyyyy&#10;gsk_zzzzzzzzzzzzzzzzzzzzzzzz"
                                        rows={5}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {settings.groqApiKeys.split('\n').filter(k => k.trim()).length} keys configured
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Model
                                        </label>
                                        <select
                                            value={settings.groqModel}
                                            onChange={(e) => updateSetting('groqModel', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        >
                                            <option value="llama-3.1-8b-instant">Llama 3.1 8B (Fast & Recommended)</option>
                                            <option value="llama-3.2-3b-preview">Llama 3.2 3B (Fastest)</option>
                                            <option value="llama-3.1-70b-versatile">Llama 3.1 70B (Quality)</option>
                                            <option value="mixtral-8x7b-32768">Mixtral 8x7B (Balanced)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Temperature ({settings.groqTemperature})
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={settings.groqTemperature}
                                            onChange={(e) => updateSetting('groqTemperature', parseFloat(e.target.value))}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Lower = more deterministic</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Max Tokens Per Field
                                        </label>
                                        <input
                                            type="number"
                                            value={settings.groqMaxTokensPerField}
                                            onChange={(e) => updateSetting('groqMaxTokensPerField', parseInt(e.target.value))}
                                            min={50}
                                            max={500}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>
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

'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/lib/hooks/useAdminAuth';
import { APP_CONFIG } from '@/lib/config/appConfig';
import Link from 'next/link';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

type ConfigSection = 'auth' | 'guest' | 'loggedIn' | 'features' | 'ui' | 'ai' | 'storage' | 'analytics' | 'admin';

export default function AdminSettingsPage() {
    const { isAuthenticated, isLoading, requireAuth, logout } = useAdminAuth();
    const [config, setConfig] = useState(APP_CONFIG);
    const [activeSection, setActiveSection] = useState<ConfigSection>('auth');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        requireAuth();
        loadSettings();
    }, [isAuthenticated, isLoading]);

    const loadSettings = async () => {
        try {
            const docRef = doc(db, 'settings', 'global');
            const docSnap = await getDoc(docRef); // getDoc is already imported? No, need to check imports.
            if (docSnap.exists()) {
                const savedConfig = docSnap.data();
                // Merge saved config with default config to ensure all fields exist
                setConfig(prev => ({
                    ...prev,
                    ...savedConfig,
                    guest: {
                        ...prev.guest,
                        ...savedConfig.guest,
                        limits: {
                            ...prev.guest.limits,
                            ...savedConfig.guest?.limits
                        }
                    }
                }));
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            toast.error('Failed to load saved settings');
        }
    };

    if (isLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const handleSave = async () => {
        try {
            await setDoc(doc(db, 'settings', 'global'), config);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
            toast.success('Settings saved to database!');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings');
        }
    };

    const sections = [
        { id: 'auth' as ConfigSection, name: 'Authentication', icon: '🔐' },
        { id: 'guest' as ConfigSection, name: 'Guest Settings', icon: '🎭' },
        { id: 'loggedIn' as ConfigSection, name: 'Logged-In Users', icon: '✅' },
        { id: 'features' as ConfigSection, name: 'Features', icon: '⚡' },
        { id: 'ui' as ConfigSection, name: 'UI/UX', icon: '🎨' },
        { id: 'ai' as ConfigSection, name: 'AI Settings', icon: '🤖' },
        { id: 'storage' as ConfigSection, name: 'Storage', icon: '💾' },
        { id: 'analytics' as ConfigSection, name: 'Analytics', icon: '📊' },
        { id: 'admin' as ConfigSection, name: 'Admin', icon: '👑' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">App Settings</h1>
                                <p className="text-sm text-gray-600">Configure all application settings</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-semibold shadow-lg"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Save Changes
                            </button>
                            <button
                                onClick={logout}
                                className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                                title="Logout"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {saved && (
                <div className="fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
                    ✅ Settings saved successfully!
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-12 gap-6">
                    {/* Sidebar */}
                    <div className="col-span-3">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-24">
                            <nav className="space-y-1">
                                {sections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeSection === section.id
                                            ? 'bg-indigo-50 text-indigo-600 font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="text-xl">{section.icon}</span>
                                        <span>{section.name}</span>
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="col-span-9">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                            {/* Authentication Settings */}
                            {activeSection === 'auth' && (
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6">🔐 Authentication Settings</h2>
                                    <div className="space-y-6">
                                        <ToggleField
                                            label="Enable Authentication"
                                            description="Turn authentication on/off for the entire app"
                                            value={config.auth.enabled}
                                            onChange={(v) => setConfig({ ...config, auth: { ...config.auth, enabled: v } })}
                                        />
                                        <ToggleField
                                            label="Require Login"
                                            description="Force all users to log in (disable guest mode)"
                                            value={config.auth.requireLogin}
                                            onChange={(v) => setConfig({ ...config, auth: { ...config.auth, requireLogin: v } })}
                                        />
                                        <ToggleField
                                            label="Allow Anonymous Users"
                                            description="Enable Firebase anonymous authentication for guests"
                                            value={config.auth.allowAnonymous}
                                            onChange={(v) => setConfig({ ...config, auth: { ...config.auth, allowAnonymous: v } })}
                                        />
                                        <ToggleField
                                            label="Google Sign-In"
                                            description="Enable Google OAuth authentication"
                                            value={config.auth.allowGoogleSignIn}
                                            onChange={(v) => setConfig({ ...config, auth: { ...config.auth, allowGoogleSignIn: v } })}
                                        />
                                        <ToggleField
                                            label="Email/Password Sign-In"
                                            description="Enable traditional email/password authentication"
                                            value={config.auth.allowEmailSignIn}
                                            onChange={(v) => setConfig({ ...config, auth: { ...config.auth, allowEmailSignIn: v } })}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Guest Settings */}
                            {activeSection === 'guest' && (
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6">🎭 Guest User Settings</h2>
                                    <div className="space-y-6">
                                        <ToggleField
                                            label="Enable Guest Mode"
                                            description="Allow users to use the app without signing up"
                                            value={config.guest.enabled}
                                            onChange={(v) => setConfig({ ...config, guest: { ...config.guest, enabled: v } })}
                                        />
                                        <ToggleField
                                            label="Unlimited Access"
                                            description="Give guests unlimited access (no limits)"
                                            value={config.guest.unlimited}
                                            onChange={(v) => setConfig({ ...config, guest: { ...config.guest, unlimited: v } })}
                                        />

                                        {!config.guest.unlimited && (
                                            <>
                                                <div className="border-t pt-6">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Limits</h3>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <NumberField
                                                            label="Resume Generations"
                                                            value={config.guest.limits.resumeGenerations}
                                                            onChange={(v) => setConfig({ ...config, guest: { ...config.guest, limits: { ...config.guest.limits, resumeGenerations: v } } })}
                                                        />
                                                        <NumberField
                                                            label="JD Analyses"
                                                            value={config.guest.limits.jdAnalyses}
                                                            onChange={(v) => setConfig({ ...config, guest: { ...config.guest, limits: { ...config.guest.limits, jdAnalyses: v } } })}
                                                        />
                                                        <NumberField
                                                            label="AI Suggestions"
                                                            value={config.guest.limits.aiSuggestions}
                                                            onChange={(v) => setConfig({ ...config, guest: { ...config.guest, limits: { ...config.guest.limits, aiSuggestions: v } } })}
                                                        />
                                                        <NumberField
                                                            label="PDF Downloads"
                                                            value={config.guest.limits.pdfDownloads}
                                                            onChange={(v) => setConfig({ ...config, guest: { ...config.guest, limits: { ...config.guest.limits, pdfDownloads: v } } })}
                                                        />
                                                        <NumberField
                                                            label="DOCX Downloads"
                                                            value={config.guest.limits.docxDownloads}
                                                            onChange={(v) => setConfig({ ...config, guest: { ...config.guest, limits: { ...config.guest.limits, docxDownloads: v } } })}
                                                        />
                                                        <NumberField
                                                            label="Resume Edits"
                                                            value={config.guest.limits.resumeEdits}
                                                            onChange={(v) => setConfig({ ...config, guest: { ...config.guest, limits: { ...config.guest.limits, resumeEdits: v } } })}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="border-t pt-6">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Expiry Settings</h3>
                                                    <ToggleField
                                                        label="Enable Usage Reset"
                                                        description="Reset usage limits after a certain period"
                                                        value={config.guest.expiry.enabled}
                                                        onChange={(v) => setConfig({ ...config, guest: { ...config.guest, expiry: { ...config.guest.expiry, enabled: v } } })}
                                                    />
                                                    {config.guest.expiry.enabled && (
                                                        <NumberField
                                                            label="Reset After (Days)"
                                                            value={config.guest.expiry.days}
                                                            onChange={(v) => setConfig({ ...config, guest: { ...config.guest, expiry: { ...config.guest.expiry, days: v } } })}
                                                        />
                                                    )}
                                                </div>
                                            </>
                                        )}

                                        <div className="border-t pt-6">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Guest Restrictions</h3>
                                            <div className="space-y-4">
                                                <ToggleField
                                                    label="Can Download PDF"
                                                    value={config.guest.restrictions.canDownloadPDF}
                                                    onChange={(v) => setConfig({ ...config, guest: { ...config.guest, restrictions: { ...config.guest.restrictions, canDownloadPDF: v } } })}
                                                />
                                                <ToggleField
                                                    label="Can Download DOCX"
                                                    value={config.guest.restrictions.canDownloadDOCX}
                                                    onChange={(v) => setConfig({ ...config, guest: { ...config.guest, restrictions: { ...config.guest.restrictions, canDownloadDOCX: v } } })}
                                                />
                                                <ToggleField
                                                    label="Can Save Resumes"
                                                    value={config.guest.restrictions.canSaveResumes}
                                                    onChange={(v) => setConfig({ ...config, guest: { ...config.guest, restrictions: { ...config.guest.restrictions, canSaveResumes: v } } })}
                                                />
                                                <ToggleField
                                                    label="Can Edit Resumes"
                                                    value={config.guest.restrictions.canEditResumes}
                                                    onChange={(v) => setConfig({ ...config, guest: { ...config.guest, restrictions: { ...config.guest.restrictions, canEditResumes: v } } })}
                                                />
                                                <ToggleField
                                                    label="Can View History"
                                                    value={config.guest.restrictions.canViewHistory}
                                                    onChange={(v) => setConfig({ ...config, guest: { ...config.guest, restrictions: { ...config.guest.restrictions, canViewHistory: v } } })}
                                                />
                                                <ToggleField
                                                    label="Can Use AI"
                                                    value={config.guest.restrictions.canUseAI}
                                                    onChange={(v) => setConfig({ ...config, guest: { ...config.guest, restrictions: { ...config.guest.restrictions, canUseAI: v } } })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Features */}
                            {activeSection === 'features' && (
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6">⚡ Feature Toggles</h2>
                                    <div className="space-y-4">
                                        <ToggleField
                                            label="Resume Generation"
                                            description="Enable/disable resume generation feature"
                                            value={config.features.resumeGeneration}
                                            onChange={(v) => setConfig({ ...config, features: { ...config.features, resumeGeneration: v } })}
                                        />
                                        <ToggleField
                                            label="JD Analysis"
                                            description="Enable/disable job description analysis"
                                            value={config.features.jdAnalysis}
                                            onChange={(v) => setConfig({ ...config, features: { ...config.features, jdAnalysis: v } })}
                                        />
                                        <ToggleField
                                            label="AI Enhancement"
                                            description="Enable/disable AI suggestions and enhancements"
                                            value={config.features.aiEnhancement}
                                            onChange={(v) => setConfig({ ...config, features: { ...config.features, aiEnhancement: v } })}
                                        />
                                        <ToggleField
                                            label="PDF Export"
                                            description="Enable/disable PDF download"
                                            value={config.features.pdfExport}
                                            onChange={(v) => setConfig({ ...config, features: { ...config.features, pdfExport: v } })}
                                        />
                                        <ToggleField
                                            label="DOCX Export"
                                            description="Enable/disable DOCX download"
                                            value={config.features.docxExport}
                                            onChange={(v) => setConfig({ ...config, features: { ...config.features, docxExport: v } })}
                                        />
                                        <ToggleField
                                            label="Resume Editor"
                                            description="Enable/disable resume editor"
                                            value={config.features.resumeEditor}
                                            onChange={(v) => setConfig({ ...config, features: { ...config.features, resumeEditor: v } })}
                                        />
                                        <ToggleField
                                            label="Dashboard"
                                            description="Enable/disable dashboard page"
                                            value={config.features.dashboard}
                                            onChange={(v) => setConfig({ ...config, features: { ...config.features, dashboard: v } })}
                                        />
                                        <ToggleField
                                            label="Profile Page"
                                            description="Enable/disable user profile page"
                                            value={config.features.profile}
                                            onChange={(v) => setConfig({ ...config, features: { ...config.features, profile: v } })}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* UI/UX */}
                            {activeSection === 'ui' && (
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6">🎨 UI/UX Settings</h2>
                                    <div className="space-y-6">
                                        <ToggleField
                                            label="Show Upgrade Prompts"
                                            description="Display 'Sign up for unlimited' banners"
                                            value={config.ui.showUpgradePrompts}
                                            onChange={(v) => setConfig({ ...config, ui: { ...config.ui, showUpgradePrompts: v } })}
                                        />
                                        <NumberField
                                            label="Show Upgrade After (Uses)"
                                            description="Number of uses before showing upgrade prompt"
                                            value={config.ui.upgradeAfterUses}
                                            onChange={(v) => setConfig({ ...config, ui: { ...config.ui, upgradeAfterUses: v } })}
                                        />
                                        <TextField
                                            label="Upgrade Message"
                                            description="Custom message for upgrade prompts"
                                            value={config.ui.upgradeMessage}
                                            onChange={(v) => setConfig({ ...config, ui: { ...config.ui, upgradeMessage: v } })}
                                        />
                                        <ToggleField
                                            label="Show Usage Counter"
                                            description="Display '2/3 resumes used' counter"
                                            value={config.ui.showUsageCounter}
                                            onChange={(v) => setConfig({ ...config, ui: { ...config.ui, showUsageCounter: v } })}
                                        />
                                        <ToggleField
                                            label="Show Limit Warning"
                                            description="Warn users before reaching limit"
                                            value={config.ui.showLimitWarning}
                                            onChange={(v) => setConfig({ ...config, ui: { ...config.ui, showLimitWarning: v } })}
                                        />
                                        <NumberField
                                            label="Warning Threshold"
                                            description="Warn when X uses remaining"
                                            value={config.ui.warningThreshold}
                                            onChange={(v) => setConfig({ ...config, ui: { ...config.ui, warningThreshold: v } })}
                                        />
                                        <ToggleField
                                            label="Allow Guest Dashboard"
                                            description="Show dashboard to guest users"
                                            value={config.ui.allowGuestDashboard}
                                            onChange={(v) => setConfig({ ...config, ui: { ...config.ui, allowGuestDashboard: v } })}
                                        />
                                        <ToggleField
                                            label="Allow Guest Profile"
                                            description="Show profile page to guest users"
                                            value={config.ui.allowGuestProfile}
                                            onChange={(v) => setConfig({ ...config, ui: { ...config.ui, allowGuestProfile: v } })}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Add other sections similarly */}
                            {activeSection === 'loggedIn' && (
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6">✅ Logged-In User Settings</h2>
                                    <ToggleField
                                        label="Unlimited Access"
                                        description="Give logged-in users unlimited access"
                                        value={config.loggedIn.unlimited}
                                        onChange={(v) => setConfig({ ...config, loggedIn: { ...config.loggedIn, unlimited: v } })}
                                    />
                                </div>
                            )}

                            {activeSection === 'ai' && (
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6">🤖 AI Settings</h2>
                                    <div className="space-y-4">
                                        <ToggleField
                                            label="Enable AI Features"
                                            value={config.ai.enabled}
                                            onChange={(v) => setConfig({ ...config, ai: { ...config.ai, enabled: v } })}
                                        />
                                        <h3 className="text-lg font-semibold mt-6">AI Providers</h3>
                                        <ToggleField
                                            label="OpenAI"
                                            value={config.ai.providers.openai}
                                            onChange={(v) => setConfig({ ...config, ai: { ...config.ai, providers: { ...config.ai.providers, openai: v } } })}
                                        />
                                        <ToggleField
                                            label="Google Gemini"
                                            value={config.ai.providers.gemini}
                                            onChange={(v) => setConfig({ ...config, ai: { ...config.ai, providers: { ...config.ai.providers, gemini: v } } })}
                                        />
                                        <ToggleField
                                            label="Anthropic Claude"
                                            value={config.ai.providers.anthropic}
                                            onChange={(v) => setConfig({ ...config, ai: { ...config.ai, providers: { ...config.ai.providers, anthropic: v } } })}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeSection === 'storage' && (
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6">💾 Storage Settings</h2>
                                    <div className="space-y-4">
                                        <ToggleField
                                            label="Use Firebase"
                                            value={config.storage.useFirebase}
                                            onChange={(v) => setConfig({ ...config, storage: { ...config.storage, useFirebase: v } })}
                                        />
                                        <ToggleField
                                            label="Use localStorage"
                                            value={config.storage.useLocalStorage}
                                            onChange={(v) => setConfig({ ...config, storage: { ...config.storage, useLocalStorage: v } })}
                                        />
                                        <ToggleField
                                            label="Enable Caching"
                                            value={config.storage.cacheEnabled}
                                            onChange={(v) => setConfig({ ...config, storage: { ...config.storage, cacheEnabled: v } })}
                                        />
                                        <NumberField
                                            label="Cache Duration (seconds)"
                                            value={config.storage.cacheDuration}
                                            onChange={(v) => setConfig({ ...config, storage: { ...config.storage, cacheDuration: v } })}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeSection === 'analytics' && (
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Analytics Settings</h2>
                                    <div className="space-y-4">
                                        <ToggleField
                                            label="Enable Analytics"
                                            value={config.analytics.enabled}
                                            onChange={(v) => setConfig({ ...config, analytics: { ...config.analytics, enabled: v } })}
                                        />
                                        <ToggleField
                                            label="Track Guest Users"
                                            value={config.analytics.trackGuestUsers}
                                            onChange={(v) => setConfig({ ...config, analytics: { ...config.analytics, trackGuestUsers: v } })}
                                        />
                                        <ToggleField
                                            label="Track Usage"
                                            value={config.analytics.trackUsage}
                                            onChange={(v) => setConfig({ ...config, analytics: { ...config.analytics, trackUsage: v } })}
                                        />
                                        <ToggleField
                                            label="Track Errors"
                                            value={config.analytics.trackErrors}
                                            onChange={(v) => setConfig({ ...config, analytics: { ...config.analytics, trackErrors: v } })}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeSection === 'admin' && (
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6">👑 Admin Settings</h2>
                                    <div className="space-y-4">
                                        <ToggleField
                                            label="Enable Admin Panel"
                                            value={config.admin.enabled}
                                            onChange={(v) => setConfig({ ...config, admin: { ...config.admin, enabled: v } })}
                                        />
                                        <ToggleField
                                            label="Allow Config Editing"
                                            value={config.admin.allowConfigEdit}
                                            onChange={(v) => setConfig({ ...config, admin: { ...config.admin, allowConfigEdit: v } })}
                                        />
                                        <ToggleField
                                            label="Require Password"
                                            value={config.admin.requirePassword}
                                            onChange={(v) => setConfig({ ...config, admin: { ...config.admin, requirePassword: v } })}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Reusable Components
function ToggleField({ label, description, value, onChange }: { label: string; description?: string; value: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
                <div className="font-semibold text-gray-900">{label}</div>
                {description && <div className="text-sm text-gray-600 mt-1">{description}</div>}
            </div>
            <button
                onClick={() => onChange(!value)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                />
            </button>
        </div>
    );
}

function NumberField({ label, description, value, onChange }: { label: string; description?: string; value: number; onChange: (v: number) => void }) {
    return (
        <div className="p-4 bg-gray-50 rounded-lg">
            <label className="block font-semibold text-gray-900 mb-2">{label}</label>
            {description && <p className="text-sm text-gray-600 mb-2">{description}</p>}
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
        </div>
    );
}

function TextField({ label, description, value, onChange }: { label: string; description?: string; value: string; onChange: (v: string) => void }) {
    return (
        <div className="p-4 bg-gray-50 rounded-lg">
            <label className="block font-semibold text-gray-900 mb-2">{label}</label>
            {description && <p className="text-sm text-gray-600 mb-2">{description}</p>}
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

// Extension Settings Interface
interface ExtensionSettings {
    // Work Authorization
    workAuthorization: string;
    requireSponsorship: string;

    // Salary & Compensation
    salaryExpectation: string;
    salaryMin: string;
    salaryMax: string;
    salaryCurrency: string;

    // Work Preferences
    workType: string;
    willingToRelocate: string;
    relocateLocations: string;
    startDate: string;
    noticePeriod: string;

    // Background
    securityClearance: string;
    veteranStatus: string;

    // EEO (Optional)
    gender: string;
    ethnicity: string;
    disabilityStatus: string;

    // Custom Answers
    customAnswers: { question: string; answer: string }[];
}

const defaultSettings: ExtensionSettings = {
    workAuthorization: '',
    requireSponsorship: '',
    salaryExpectation: '',
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'USD',
    workType: '',
    willingToRelocate: '',
    relocateLocations: '',
    startDate: '',
    noticePeriod: '',
    securityClearance: '',
    veteranStatus: '',
    gender: '',
    ethnicity: '',
    disabilityStatus: '',
    customAnswers: [],
};

export default function ExtensionSettingsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuthStore();
    const [settings, setSettings] = useState<ExtensionSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        useAuthStore.getState().initialize();
    }, []);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }
        loadSettings();
    }, [user, authLoading]);

    const loadSettings = async () => {
        if (!user) return;

        try {
            const docRef = doc(db, 'users', user.uid, 'settings', 'extension');
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setSettings({ ...defaultSettings, ...docSnap.data() as ExtensionSettings });
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof ExtensionSettings, value: string) => {
        setSettings(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        try {
            const docRef = doc(db, 'users', user.uid, 'settings', 'extension');
            await setDoc(docRef, {
                ...settings,
                updatedAt: serverTimestamp(),
            });
            toast.success('Settings saved!');
            setHasChanges(false);
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-violet-600 border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-slate-600">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Extension Settings
                                </h1>
                                <p className="text-sm text-slate-500">Configure auto-fill preferences for job portals</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving || !hasChanges}
                            className="px-4 py-2 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Save Settings
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                <div className="space-y-8">

                    {/* Work Authorization */}
                    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Work Authorization
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Work Authorization Status</label>
                                    <select
                                        value={settings.workAuthorization}
                                        onChange={(e) => handleChange('workAuthorization', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                    >
                                        <option value="">Select...</option>
                                        <option value="us_citizen">US Citizen</option>
                                        <option value="green_card">Green Card / Permanent Resident</option>
                                        <option value="h1b">H1B Visa</option>
                                        <option value="h1b_transfer">H1B (Transfer Needed)</option>
                                        <option value="l1">L1 Visa</option>
                                        <option value="opt">OPT</option>
                                        <option value="opt_stem">OPT STEM Extension</option>
                                        <option value="cpt">CPT</option>
                                        <option value="ead">EAD</option>
                                        <option value="tn">TN Visa</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Require Sponsorship?</label>
                                    <select
                                        value={settings.requireSponsorship}
                                        onChange={(e) => handleChange('requireSponsorship', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                    >
                                        <option value="">Select...</option>
                                        <option value="no">No - I don't require sponsorship</option>
                                        <option value="yes">Yes - I require sponsorship now</option>
                                        <option value="future">Yes - I will require in the future</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Salary & Compensation */}
                    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Salary & Compensation
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Expected Salary (Annual)</label>
                                <input
                                    type="text"
                                    value={settings.salaryExpectation}
                                    onChange={(e) => handleChange('salaryExpectation', e.target.value)}
                                    placeholder="e.g., $120,000 or Negotiable"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                                    <select
                                        value={settings.salaryCurrency}
                                        onChange={(e) => handleChange('salaryCurrency', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                    >
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                        <option value="INR">INR (₹)</option>
                                        <option value="CAD">CAD (C$)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Minimum</label>
                                    <input
                                        type="text"
                                        value={settings.salaryMin}
                                        onChange={(e) => handleChange('salaryMin', e.target.value)}
                                        placeholder="e.g., 100000"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Maximum</label>
                                    <input
                                        type="text"
                                        value={settings.salaryMax}
                                        onChange={(e) => handleChange('salaryMax', e.target.value)}
                                        placeholder="e.g., 150000"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Work Preferences */}
                    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
                            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Work Preferences
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Work Type</label>
                                    <select
                                        value={settings.workType}
                                        onChange={(e) => handleChange('workType', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                    >
                                        <option value="">Select...</option>
                                        <option value="remote">Remote</option>
                                        <option value="hybrid">Hybrid</option>
                                        <option value="onsite">On-site</option>
                                        <option value="flexible">Flexible / Any</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Willing to Relocate?</label>
                                    <select
                                        value={settings.willingToRelocate}
                                        onChange={(e) => handleChange('willingToRelocate', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                    >
                                        <option value="">Select...</option>
                                        <option value="yes">Yes</option>
                                        <option value="no">No</option>
                                        <option value="maybe">Maybe / Depends on role</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Locations (if relocating)</label>
                                <input
                                    type="text"
                                    value={settings.relocateLocations}
                                    onChange={(e) => handleChange('relocateLocations', e.target.value)}
                                    placeholder="e.g., San Francisco, New York, Austin"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Earliest Start Date</label>
                                    <select
                                        value={settings.startDate}
                                        onChange={(e) => handleChange('startDate', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                    >
                                        <option value="">Select...</option>
                                        <option value="immediately">Immediately</option>
                                        <option value="1_week">1 Week</option>
                                        <option value="2_weeks">2 Weeks</option>
                                        <option value="1_month">1 Month</option>
                                        <option value="2_months">2 Months</option>
                                        <option value="3_months">3+ Months</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Notice Period</label>
                                    <select
                                        value={settings.noticePeriod}
                                        onChange={(e) => handleChange('noticePeriod', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                    >
                                        <option value="">Select...</option>
                                        <option value="none">No notice required</option>
                                        <option value="1_week">1 Week</option>
                                        <option value="2_weeks">2 Weeks</option>
                                        <option value="1_month">1 Month</option>
                                        <option value="2_months">2 Months</option>
                                        <option value="3_months">3 Months</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Background */}
                    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-pink-50">
                            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Background
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Security Clearance</label>
                                    <select
                                        value={settings.securityClearance}
                                        onChange={(e) => handleChange('securityClearance', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                    >
                                        <option value="">Select...</option>
                                        <option value="none">None</option>
                                        <option value="public_trust">Public Trust</option>
                                        <option value="confidential">Confidential</option>
                                        <option value="secret">Secret</option>
                                        <option value="top_secret">Top Secret</option>
                                        <option value="ts_sci">TS/SCI</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Veteran Status</label>
                                    <select
                                        value={settings.veteranStatus}
                                        onChange={(e) => handleChange('veteranStatus', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                    >
                                        <option value="">Select...</option>
                                        <option value="not_veteran">I am not a veteran</option>
                                        <option value="veteran">I am a veteran</option>
                                        <option value="active_duty">Active duty military</option>
                                        <option value="reserve">Reserve / National Guard</option>
                                        <option value="prefer_not">Prefer not to answer</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* EEO Information */}
                    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-gray-50">
                            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                EEO Information
                                <span className="text-xs font-normal text-slate-500">(Optional - for voluntary self-identification)</span>
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-500 mb-4">
                                This information is optional and used only for EEO compliance questions. You can choose &quot;Prefer not to answer&quot; for any field.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                                    <select
                                        value={settings.gender}
                                        onChange={(e) => handleChange('gender', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                    >
                                        <option value="">Select...</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="non_binary">Non-binary</option>
                                        <option value="prefer_not">Prefer not to answer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Ethnicity</label>
                                    <select
                                        value={settings.ethnicity}
                                        onChange={(e) => handleChange('ethnicity', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                    >
                                        <option value="">Select...</option>
                                        <option value="hispanic">Hispanic or Latino</option>
                                        <option value="white">White</option>
                                        <option value="black">Black or African American</option>
                                        <option value="asian">Asian</option>
                                        <option value="native_american">American Indian or Alaska Native</option>
                                        <option value="pacific_islander">Native Hawaiian or Pacific Islander</option>
                                        <option value="two_or_more">Two or More Races</option>
                                        <option value="prefer_not">Prefer not to answer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Disability Status</label>
                                    <select
                                        value={settings.disabilityStatus}
                                        onChange={(e) => handleChange('disabilityStatus', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                    >
                                        <option value="">Select...</option>
                                        <option value="yes">Yes, I have a disability</option>
                                        <option value="no">No, I don't have a disability</option>
                                        <option value="prefer_not">Prefer not to answer</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Info Box */}
                    <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-start gap-3">
                        <svg className="w-5 h-5 text-violet-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="text-sm text-violet-800 font-medium">How it works</p>
                            <p className="text-sm text-violet-600 mt-1">
                                When you click ⚡ Flash on a resume card, these settings will be combined with your resume data and sent to the extension. The extension will use this to auto-fill job portal forms.
                            </p>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}

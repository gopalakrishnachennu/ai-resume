'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-hot-toast';
import {
    getAdminPrompts,
    saveAdminPrompts,
    resetAdminPrompts,
    getCodeDefaults,
    initializeAdminPrompts,
    PROMPT_METADATA,
    PROMPT_VARIABLES,
    MANDATORY_PROMPTS,
    FlatPromptKey,
    PromptConfig,
} from '@/lib/services/promptService';

// Admin emails (add yours here)
const ADMIN_EMAILS = ['gopalakrishnachennu@gmail.com', 'admin@example.com'];

const PHASES = [
    { id: 1, name: 'Phase 1: Job Analysis', color: 'blue' },
    { id: 2, name: 'Phase 2: Resume Generation', color: 'purple' },
    { id: 3, name: 'Phase 3: ATS Scoring', color: 'green' },
    { id: 4, name: 'Phase 4: Improvements', color: 'orange' },
];

export default function AdminPromptsPage() {
    const { user, loading: authLoading } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [prompts, setPrompts] = useState<Record<FlatPromptKey, PromptConfig> | null>(null);
    const [defaults, setDefaults] = useState<Record<FlatPromptKey, PromptConfig> | null>(null);
    const [expandedPrompt, setExpandedPrompt] = useState<FlatPromptKey | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        useAuthStore.getState().initialize();
    }, []);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        // Check admin access
        if (!ADMIN_EMAILS.includes(user.email || '')) {
            toast.error('Admin access required');
            router.push('/dashboard');
            return;
        }

        setIsAdmin(true);
        loadPrompts();
    }, [user, authLoading]);

    const loadPrompts = async () => {
        try {
            // Initialize if first run
            await initializeAdminPrompts();

            const [adminPrompts, codeDefaults] = await Promise.all([
                getAdminPrompts(),
                Promise.resolve(getCodeDefaults()),
            ]);

            setPrompts(adminPrompts?.prompts || codeDefaults);
            setDefaults(codeDefaults);
        } catch (error) {
            console.error('Error loading prompts:', error);
            toast.error('Failed to load prompts');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!prompts) return;

        setSaving(true);
        try {
            await saveAdminPrompts(prompts);
            toast.success('Admin prompts saved! All users will now use these defaults.');
        } catch (error: any) {
            toast.error(error.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleResetAll = async () => {
        if (!defaults) return;
        if (!confirm('Reset ALL admin prompts to code defaults? This affects all users.')) return;

        try {
            await resetAdminPrompts();
            setPrompts({ ...defaults });
            toast.success('Reset to code defaults');
        } catch (error) {
            toast.error('Failed to reset');
        }
    };

    const getPromptsForPhase = (phase: number): FlatPromptKey[] => {
        return Object.keys(PROMPT_METADATA).filter(
            (key) => PROMPT_METADATA[key as FlatPromptKey].phase === phase
        ) as FlatPromptKey[];
    };

    if (loading || !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!prompts) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-slate-700">
                <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="font-bold text-white flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">ADMIN</span>
                                Global Prompt Defaults
                            </h1>
                            <p className="text-xs text-slate-400">Changes affect all users without custom prompts</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleResetAll} className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-xl font-medium">
                            Reset to Code
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? 'Saving...' : '💾 Save Global Defaults'}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
                {/* Warning */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                    <svg className="w-6 h-6 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                        <p className="text-amber-200 font-medium">Admin Mode</p>
                        <p className="text-amber-200/70 text-sm">These are the DEFAULT prompts for all users. Users can override with their own in Prompt Settings.</p>
                    </div>
                </div>

                {/* Phases */}
                {PHASES.map((phase) => {
                    const phasePrompts = getPromptsForPhase(phase.id);
                    if (phasePrompts.length === 0) return null;

                    return (
                        <div key={phase.id} className="space-y-3">
                            <h3 className="font-semibold text-white">{phase.name}</h3>
                            {phasePrompts.map((key) => {
                                const meta = PROMPT_METADATA[key];
                                const isExpanded = expandedPrompt === key;
                                const prompt = prompts[key];

                                return (
                                    <div key={key} className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                                        <button
                                            onClick={() => setExpandedPrompt(isExpanded ? null : key)}
                                            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-700/30"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${meta.mandatory ? 'bg-amber-500' : 'bg-slate-500'}`} />
                                                <span className="text-white font-medium">{meta.name}</span>
                                                {meta.mandatory && <span className="text-xs text-amber-400">Required</span>}
                                            </div>
                                            <svg className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        {isExpanded && (
                                            <div className="px-5 pb-5 space-y-4 border-t border-slate-700 pt-4">
                                                <div>
                                                    <label className="text-sm text-slate-400 mb-2 block">System Prompt</label>
                                                    <textarea
                                                        value={prompt.system}
                                                        onChange={(e) => setPrompts({ ...prompts, [key]: { ...prompt, system: e.target.value } })}
                                                        rows={3}
                                                        className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 text-white font-mono text-sm resize-y focus:border-green-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm text-slate-400 mb-2 block">User Prompt Template</label>
                                                    <textarea
                                                        value={prompt.user}
                                                        onChange={(e) => setPrompts({ ...prompts, [key]: { ...prompt, user: e.target.value } })}
                                                        rows={12}
                                                        className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 text-white font-mono text-sm resize-y focus:border-green-500 outline-none"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-sm text-slate-400 mb-2 block">Max Tokens</label>
                                                        <input
                                                            type="number"
                                                            value={prompt.maxTokens}
                                                            onChange={(e) => setPrompts({ ...prompts, [key]: { ...prompt, maxTokens: parseInt(e.target.value) || 500 } })}
                                                            className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm text-slate-400 mb-2 block">Temperature</label>
                                                        <input
                                                            type="number"
                                                            value={prompt.temperature}
                                                            step={0.1}
                                                            onChange={(e) => setPrompts({ ...prompts, [key]: { ...prompt, temperature: parseFloat(e.target.value) || 0.3 } })}
                                                            className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white"
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        if (defaults) setPrompts({ ...prompts, [key]: { ...defaults[key] } });
                                                        toast.success('Reset to code default');
                                                    }}
                                                    className="text-sm text-slate-400 hover:text-red-400"
                                                >
                                                    Reset this prompt
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </main>
        </div>
    );
}

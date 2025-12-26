'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-hot-toast';
import {
    getActivePrompts,
    saveUserPrompts,
    resetUserPrompts,
    getCodeDefaults,
    PROMPT_METADATA,
    PROMPT_VARIABLES,
    MANDATORY_PROMPTS,
    FlatPromptKey,
    PromptConfig,
} from '@/lib/services/promptService';

// Group prompts by phase
const PHASES = [
    { id: 1, name: 'Phase 1: Job Analysis', description: 'Parse and analyze job descriptions', color: 'blue' },
    { id: 2, name: 'Phase 2: Resume Generation', description: 'Generate resume content', color: 'purple' },
    { id: 3, name: 'Phase 3: ATS Scoring', description: 'Score and analyze resumes', color: 'green' },
    { id: 4, name: 'Phase 4: Improvements', description: 'Suggest improvements', color: 'orange' },
];

const PERSONA_STYLES = [
    { id: 'standard', name: 'Standard (Balanced)' },
    { id: 'professional', name: 'Corporate Professional' },
    { id: 'creative', name: 'Creative & Storytelling' },
    { id: 'technical', name: 'Technical & Precise' },
    { id: 'executive', name: 'Executive (Strategic)' },
];

const PERSONA_TONES = [
    { id: 'confident', name: 'Confident (Action-Oriented)' },
    { id: 'neutral', name: 'Neutral (Objective)' },
    { id: 'humble', name: 'Humble (Team-First)' },
    { id: 'persuasive', name: 'Persuasive (Sales-Focus)' },
];

const EXPERIENCE_LEVELS = [
    { id: 'entry', name: 'Entry Level / Intern' },
    { id: 'mid', name: 'Mid-Senior Level' },
    { id: 'senior', name: 'Senior / Lead' },
    { id: 'executive', name: 'Director / Executive' },
];

function PromptEditor({
    promptKey,
    prompt,
    onChange,
    onReset,
    isExpanded,
    onToggle,
    simpleMode,
}: {
    promptKey: FlatPromptKey;
    prompt: PromptConfig;
    onChange: (prompt: PromptConfig) => void;
    onReset: () => void;
    isExpanded: boolean;
    onToggle: () => void;
    simpleMode: boolean;
}) {
    const meta = PROMPT_METADATA[promptKey];
    const isMandatory = MANDATORY_PROMPTS.includes(promptKey);
    const hasError = isMandatory && (!prompt.system?.trim() || !prompt.user?.trim());

    return (
        <div className={`border rounded-xl overflow-hidden transition-all ${hasError ? 'border-red-300 bg-red-50/50' : 'border-gray-200 bg-white'}`}>
            {/* Header */}
            <button
                onClick={onToggle}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isMandatory ? 'bg-amber-500' : 'bg-gray-300'}`} />
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{meta.name}</span>
                            {isMandatory && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">Required</span>
                            )}
                            {hasError && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded">Empty</span>
                            )}
                            {prompt.customInstructions && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">Has Instructions</span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500">{meta.description}</p>
                    </div>
                </div>
                <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="px-5 pb-5 border-t border-gray-100">
                    <div className="space-y-4 pt-4">
                        {simpleMode ? (
                            // Simple Mode UI
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Custom Instructions
                                        <span className="text-gray-400 font-normal ml-2">Simple instructions to guide the AI</span>
                                    </label>
                                    <select
                                        className="text-xs border-gray-200 rounded-lg text-gray-600 focus:border-purple-500 focus:ring-purple-500"
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const current = prompt.customInstructions || '';
                                                const separator = current.trim() ? '\n' : '';
                                                onChange({ ...prompt, customInstructions: current + separator + e.target.value });
                                                e.target.value = ''; // Reset
                                            }
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Add quick instruction...</option>
                                        <option value="Make the tone professional and corporate.">Professional Tone</option>
                                        <option value="Focus on leadership and team management.">Leadership Focus</option>
                                        <option value="Highlight technical skills and tools.">Tech Heavy</option>
                                        <option value="Keep bullet points concise and result-oriented.">Concise Bullets</option>
                                        <option value="Use active voice and strong action verbs.">Active Voice</option>
                                        <option value="Emphasize quantitative metrics and achievements.">Metrics Focus</option>
                                    </select>
                                </div>
                                <textarea
                                    value={prompt.customInstructions || ''}
                                    onChange={(e) => onChange({ ...prompt, customInstructions: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-sm"
                                    placeholder="e.g. Focus on leadership skills, Make it concise, Use active voice..."
                                />
                                <p className="text-xs text-gray-500 mt-2">These instructions are automatically appended to the AI's behavior.</p>
                            </div>
                        ) : (
                            // Advanced Mode UI
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Custom Instructions
                                    </label>
                                    <textarea
                                        value={prompt.customInstructions || ''}
                                        onChange={(e) => onChange({ ...prompt, customInstructions: e.target.value })}
                                        rows={2}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                        placeholder="Additional instructions..."
                                    />
                                </div>

                                {/* System Prompt */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        System Prompt
                                        <span className="text-gray-400 font-normal ml-2">Sets the AI's behavior</span>
                                    </label>
                                    <textarea
                                        value={prompt.system}
                                        onChange={(e) => onChange({ ...prompt, system: e.target.value })}
                                        rows={3}
                                        className={`w-full px-4 py-3 rounded-lg border ${hasError && !prompt.system?.trim() ? 'border-red-300 bg-red-50' : 'border-gray-200'} focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono text-sm resize-y`}
                                        placeholder="You are an expert..."
                                    />
                                </div>

                                {/* User Prompt Template */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        User Prompt Template
                                        <span className="text-gray-400 font-normal ml-2">Use {'{{ variable }}'} for dynamic content</span>
                                    </label>
                                    <textarea
                                        value={prompt.user}
                                        onChange={(e) => onChange({ ...prompt, user: e.target.value })}
                                        rows={10}
                                        className={`w-full px-4 py-3 rounded-lg border ${hasError && !prompt.user?.trim() ? 'border-red-300 bg-red-50' : 'border-gray-200'} focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono text-sm resize-y`}
                                        placeholder="Analyze this job description..."
                                    />
                                </div>

                                {/* Settings */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Tokens</label>
                                        <input
                                            type="number"
                                            value={prompt.maxTokens}
                                            onChange={(e) => onChange({ ...prompt, maxTokens: parseInt(e.target.value) || 500 })}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                                            min={100}
                                            max={4000}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Temperature</label>
                                        <input
                                            type="number"
                                            value={prompt.temperature}
                                            onChange={(e) => onChange({ ...prompt, temperature: parseFloat(e.target.value) || 0.3 })}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                                            min={0}
                                            max={2}
                                            step={0.1}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Reset Button */}
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={onReset}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Reset to Default
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function PromptSettingsPage() {
    const { user, loading: authLoading } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [prompts, setPrompts] = useState<Record<FlatPromptKey, PromptConfig> | null>(null);
    const [defaults, setDefaults] = useState<Record<FlatPromptKey, PromptConfig> | null>(null);
    const [expandedPrompt, setExpandedPrompt] = useState<FlatPromptKey | null>(null);
    const [showVariables, setShowVariables] = useState(false);
    const simpleMode = true; // Always Simple Mode for end users
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Persona State
    const [targetRole, setTargetRole] = useState('');
    const [selectedStyle, setSelectedStyle] = useState('professional');
    const [selectedTone, setSelectedTone] = useState('confident');
    const [selectedLevel, setSelectedLevel] = useState('mid');

    const [atsOptimized, setAtsOptimized] = useState(true);

    // Advanced Rules State
    const [activeTab, setActiveTab] = useState<'persona' | 'rules'>('persona');
    const [summaryRules, setSummaryRules] = useState('');
    const [experienceRules, setExperienceRules] = useState('');
    const [skillsRules, setSkillsRules] = useState('');
    const [skillsCategorized, setSkillsCategorized] = useState(true); // Default to corporate standard

    useEffect(() => {
        useAuthStore.getState().initialize();
    }, []);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }
        loadPrompts();
    }, [user, authLoading]);

    const loadPrompts = async () => {
        try {
            const [active, codeDefaults] = await Promise.all([
                getActivePrompts(user!.uid),
                Promise.resolve(getCodeDefaults()),
            ]);
            setPrompts(active);
            setDefaults(codeDefaults);
        } catch (error) {
            console.error('Error loading prompts:', error);
            toast.error('Failed to load prompts');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user || !prompts) return;

        // Validate mandatory prompts
        for (const key of MANDATORY_PROMPTS) {
            const prompt = prompts[key];
            if (!prompt.system?.trim() || !prompt.user?.trim()) {
                toast.error(`"${PROMPT_METADATA[key].name}" is required and cannot be empty`);
                setExpandedPrompt(key);
                return;
            }
        }

        setSaving(true);
        try {
            await saveUserPrompts(user.uid, prompts);
            toast.success('Prompts saved successfully! 🎉');
        } catch (error: any) {
            console.error('Error saving prompts:', error);
            toast.error(error.message || 'Failed to save prompts');
        } finally {
            setSaving(false);
        }
    };

    const handleResetPrompt = (key: FlatPromptKey) => {
        if (!prompts || !defaults) return;
        setPrompts({ ...prompts, [key]: { ...defaults[key] } });
        toast.success(`"${PROMPT_METADATA[key].name}" reset to default`);
    };

    const handleResetAll = async () => {
        if (!user || !defaults) return;
        if (!confirm('Reset ALL prompts to defaults? This cannot be undone.')) return;

        try {
            await resetUserPrompts(user.uid);
            setPrompts({ ...defaults });
            toast.success('All prompts reset to defaults');
        } catch (error) {
            toast.error('Failed to reset prompts');
        }
    };

    const getPromptsForPhase = (phase: number): FlatPromptKey[] => {
        return Object.keys(PROMPT_METADATA).filter(
            (key) => PROMPT_METADATA[key as FlatPromptKey].phase === phase
        ) as FlatPromptKey[];
    };

    const handleApplyPersona = () => {
        if (!prompts) return;

        const styleName = PERSONA_STYLES.find(s => s.id === selectedStyle)?.name;
        const toneName = PERSONA_TONES.find(t => t.id === selectedTone)?.name;
        const levelName = EXPERIENCE_LEVELS.find(l => l.id === selectedLevel)?.name;

        const instruction = `PERSONA CONTEXT:
- Role: ${targetRole || 'Professional'}
- Experience Level: ${levelName}
- Writing Style: ${styleName}
- Tone: ${toneName}
${atsOptimized ? '- CRITICAL: Optimize for ATS parsing (use standard keywords, avoid fancy formatting).' : ''}
- Goal: Write high-impact content that gets the candidate hired.`;

        const updatedPrompts = { ...prompts };
        Object.keys(updatedPrompts).forEach((key) => {
            let finalInstruction = instruction;

            // Apply Granular Rules based on key
            if (key.includes('summary')) {
                if (summaryRules.trim()) {
                    finalInstruction += `\n\nSPECIFIC SUMMARY RULES:\n${summaryRules}`;
                }
            } else if (key.includes('experience') || key.includes('resumeGenerator')) {
                if (experienceRules.trim()) {
                    finalInstruction += `\n\nSPECIFIC EXPERIENCE RULES:\n${experienceRules}`;
                }
            } else if (key.includes('skills')) {
                let sRules = skillsRules;
                if (skillsCategorized) {
                    sRules += '\n- Organise skills into clear categories (e.g. Languages, Frameworks, Tools, Cloud).';
                    sRules += '\n- Prioritize hard technical skills over soft skills.';
                }
                if (sRules.trim()) {
                    finalInstruction += `\n\nSPECIFIC SKILLS RULES:\n${sRules}`;
                }
            }

            updatedPrompts[key as FlatPromptKey] = {
                ...updatedPrompts[key as FlatPromptKey],
                customInstructions: finalInstruction
            };
        });

        setPrompts(updatedPrompts);
        toast.success('AI Persona & Rules applied! Click Save to confirm.');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
                        <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
                    </div>
                    <p className="text-gray-600 font-medium">Loading AI Prompts...</p>
                </div>
            </div>
        );
    }

    if (!prompts) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="font-semibold text-gray-900">AI Prompt Settings</h1>
                                <p className="text-xs text-gray-500">Customize AI behavior</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleResetAll}
                            className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
                        >
                            Reset All
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Save Prompts
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                {/* AI Persona Wizard */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white backdrop-blur-sm">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="font-bold text-xl text-white">AI Persona Studio</h2>
                                    <p className="text-purple-100 text-sm">Configure your personal AI career coach in seconds.</p>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex bg-black/20 rounded-lg p-1">
                                <button
                                    onClick={() => setActiveTab('persona')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'persona' ? 'bg-white text-purple-700 shadow' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                                >
                                    Persona Profile
                                </button>
                                <button
                                    onClick={() => setActiveTab('rules')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'rules' ? 'bg-white text-purple-700 shadow' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                                >
                                    Granular Rules
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        {activeTab === 'persona' ? (
                            <div className="grid gap-6 md:grid-cols-2 animate-fadeIn">
                                {/* Left Column: Role & Level */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Role</label>
                                        <input
                                            type="text"
                                            value={targetRole}
                                            onChange={(e) => setTargetRole(e.target.value)}
                                            placeholder="e.g. Senior Product Manager"
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-purple-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {EXPERIENCE_LEVELS.map(level => (
                                                <button
                                                    key={level.id}
                                                    onClick={() => setSelectedLevel(level.id)}
                                                    className={`px-3 py-2 text-sm rounded-lg border transition-all text-left ${selectedLevel === level.id ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium' : 'border-gray-200 hover:border-gray-300'}`}
                                                >
                                                    {level.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Style & Tone */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Writing Style</label>
                                        <select
                                            value={selectedStyle}
                                            onChange={(e) => setSelectedStyle(e.target.value)}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-purple-500 outline-none bg-white"
                                        >
                                            {PERSONA_STYLES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tone of Voice</label>
                                        <div className="flex flex-wrap gap-2">
                                            {PERSONA_TONES.map(tone => (
                                                <button
                                                    key={tone.id}
                                                    onClick={() => setSelectedTone(tone.id)}
                                                    className={`px-3 py-1.5 text-sm rounded-full border transition-all ${selectedTone === tone.id ? 'border-purple-500 bg-purple-500 text-white shadow-md' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                                >
                                                    {tone.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 pt-2">
                                        <button
                                            onClick={() => setAtsOptimized(!atsOptimized)}
                                            className={`relative w-12 h-6 rounded-full transition-colors ${atsOptimized ? 'bg-green-500' : 'bg-gray-300'}`}
                                        >
                                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${atsOptimized ? 'translate-x-6' : ''}`} />
                                        </button>
                                        <span className="text-sm font-medium text-gray-700">ATS Optimized Mode</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // RULES TAB
                            <div className="grid gap-6 md:grid-cols-2 animate-fadeIn">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Summary Section Rules
                                        <span className="block text-xs font-normal text-gray-400">Applied only to Summary generators</span>
                                    </label>
                                    <textarea
                                        value={summaryRules}
                                        onChange={(e) => setSummaryRules(e.target.value)}
                                        rows={6}
                                        placeholder="e.g. Include at least 2 numerical achievements. Avoid mentioning high school."
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-sm resize-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Experience Section Rules
                                        <span className="block text-xs font-normal text-gray-400">Applied to Resume & Experience generators</span>
                                    </label>
                                    <textarea
                                        value={experienceRules}
                                        onChange={(e) => setExperienceRules(e.target.value)}
                                        rows={6}
                                        placeholder="e.g. Current company should have 7 bullet points, past companies 5-6 points. Focus on quantifiable metrics."
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-sm resize-none"
                                    />
                                    <p className="text-xs text-gray-500">
                                        Tip: You can use conditional logic like "If current job, do X".
                                    </p>
                                </div>
                                <div className="space-y-2 md:col-span-2 border-t pt-4 border-gray-100">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Skills Section Rules
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={skillsCategorized}
                                                onChange={(e) => setSkillsCategorized(e.target.checked)}
                                                className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                                id="catSkills"
                                            />
                                            <label htmlFor="catSkills" className="text-xs text-gray-600 cursor-pointer select-none">
                                                Use Corporate Categorization (Languages, Tools, etc.)
                                            </label>
                                        </div>
                                    </div>
                                    <textarea
                                        value={skillsRules}
                                        onChange={(e) => setSkillsRules(e.target.value)}
                                        rows={4}
                                        placeholder="e.g. List Cloud technologies first. Do not mention Microsoft Word."
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-sm resize-none"
                                    />
                                </div>
                            </div>
                        )}
                    </div>


                    <div className="px-6 pb-6 pt-2 border-t border-gray-100 mt-2 bg-gray-50/50 flex justify-between items-center">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1"
                        >
                            {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Individual Prompts'}
                            <svg className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={handleApplyPersona}
                            className="px-6 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 hover:shadow-lg transform active:scale-95 transition-all flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Apply Persona to All Prompts
                        </button>
                    </div>
                </div>

                {/* Individual Prompts (Hidden by default) */}
                {showAdvanced && (
                    <div className="space-y-8 animate-fadeIn">
                        {PHASES.map((phase) => {
                            const phasePrompts = getPromptsForPhase(phase.id);
                            if (phasePrompts.length === 0) return null;

                            const colorClasses: Record<string, string> = {
                                blue: 'from-blue-500 to-blue-600',
                                purple: 'from-purple-500 to-purple-600',
                                green: 'from-emerald-500 to-emerald-600',
                                orange: 'from-orange-500 to-orange-600',
                            };

                            return (
                                <div key={phase.id} className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClasses[phase.color]} flex items-center justify-center text-white font-bold shadow-md`}>
                                            {phase.id}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{phase.name}</h3>
                                            <p className="text-sm text-gray-500">{phase.description}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pl-13">
                                        {phasePrompts.map((key) => (
                                            <PromptEditor
                                                key={key}
                                                promptKey={key}
                                                prompt={prompts[key]}
                                                onChange={(updated) => setPrompts({ ...prompts, [key]: updated })}
                                                onReset={() => handleResetPrompt(key)}
                                                isExpanded={expandedPrompt === key}
                                                onToggle={() => setExpandedPrompt(expandedPrompt === key ? null : key)}
                                                simpleMode={simpleMode}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                    </div>
                )}
            </main>
        </div>
    );
}

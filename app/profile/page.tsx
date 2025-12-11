'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

// Section component for collapsible cards
function Section({
    title,
    icon,
    children,
    defaultOpen = true,
    accentColor = 'blue',
    badge,
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
    accentColor?: 'blue' | 'purple' | 'green' | 'orange' | 'pink';
    badge?: React.ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const contentRef = useRef<HTMLDivElement>(null);

    const colorClasses = {
        blue: 'from-blue-500 to-blue-600',
        purple: 'from-purple-500 to-purple-600',
        green: 'from-emerald-500 to-emerald-600',
        orange: 'from-orange-500 to-orange-600',
        pink: 'from-pink-500 to-pink-600',
    };

    return (
        <div className="group">
            <div
                className={`
                    bg-white rounded-2xl shadow-sm border border-gray-100 
                    overflow-hidden transition-all duration-300 ease-out
                    hover:shadow-md hover:border-gray-200
                `}
            >
                {/* Header */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left transition-colors hover:bg-gray-50/50"
                >
                    <div className="flex items-center gap-4">
                        <div className={`
                            w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[accentColor]}
                            flex items-center justify-center text-white shadow-lg
                            group-hover:scale-105 transition-transform duration-300
                        `}>
                            {icon}
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {badge}
                        <div className={`
                            w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center
                            transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}
                        `}>
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </button>

                {/* Content */}
                <div
                    className={`
                        transition-all duration-300 ease-out overflow-hidden
                        ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
                    `}
                >
                    <div className="px-6 pb-6 pt-2">
                        <div className="border-t border-gray-100 pt-6">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Floating label input component
function FloatingInput({
    label,
    type = 'text',
    value,
    onChange,
    icon,
    placeholder,
}: {
    label: string;
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    icon?: React.ReactNode;
    placeholder?: string;
}) {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value && value.length > 0;

    return (
        <div className="relative group">
            <div className="relative">
                {icon && (
                    <div className={`
                        absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200
                        ${isFocused ? 'text-blue-500' : 'text-gray-400'}
                    `}>
                        {icon}
                    </div>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={isFocused ? placeholder : ''}
                    className={`
                        w-full px-4 py-4 ${icon ? 'pl-12' : ''} rounded-xl
                        border-2 transition-all duration-200 outline-none
                        bg-gray-50/50 text-gray-900 text-base
                        ${isFocused
                            ? 'border-blue-500 bg-white shadow-sm shadow-blue-500/10'
                            : 'border-gray-200 hover:border-gray-300'
                        }
                    `}
                />
                <label className={`
                    absolute left-${icon ? '12' : '4'} transition-all duration-200 pointer-events-none
                    ${isFocused || hasValue
                        ? '-top-2.5 text-xs font-medium bg-white px-2 ' + (isFocused ? 'text-blue-500' : 'text-gray-500')
                        : 'top-4 text-gray-500'
                    }
                `} style={{ left: icon ? '48px' : '16px' }}>
                    {label}
                </label>
            </div>
        </div>
    );
}

// Skill tag component
function SkillTag({
    skill,
    onRemove,
    color = 'blue',
}: {
    skill: string;
    onRemove: () => void;
    color?: 'blue' | 'green' | 'purple';
}) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200',
        green: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200',
        purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200',
    };

    return (
        <span className={`
            inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
            border transition-all duration-200 ${colorClasses[color]}
            animate-fadeIn
        `}>
            {skill}
            <button
                onClick={onRemove}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
            >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </span>
    );
}

export default function ProfilePage() {
    const { user, loading: authLoading } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const [profile, setProfile] = useState({
        phone: '',
        location: '',
        linkedin: '',
        github: '',
        portfolio: '',
    });

    const [experience, setExperience] = useState([
        {
            company: '',
            title: '',
            location: '',
            startDate: '',
            endDate: '',
            current: false,
            bullets: [''],
        },
    ]);

    const [education, setEducation] = useState([
        {
            school: '',
            degree: '',
            field: '',
            location: '',
            graduationDate: '',
            gpa: '',
        },
    ]);

    const [skills, setSkills] = useState({
        technical: [] as string[],
        soft: [] as string[],
        tools: [] as string[],
    });

    const [techSkillInput, setTechSkillInput] = useState('');
    const [toolInput, setToolInput] = useState('');

    // LLM Configuration
    const [llmConfig, setLlmConfig] = useState({
        provider: 'gemini' as 'gemini' | 'openai' | 'claude',
        apiKey: '',
    });
    const [showApiKey, setShowApiKey] = useState(false);

    useEffect(() => {
        useAuthStore.getState().initialize();
    }, []);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }
        loadProfile();
    }, [user, authLoading]);

    const loadProfile = async () => {
        if (!user) return;

        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));

            if (userDoc.exists()) {
                const data = userDoc.data();

                if (data.profile) setProfile(data.profile);
                if (data.baseExperience && data.baseExperience.length > 0) {
                    setExperience(data.baseExperience);
                }
                if (data.baseEducation && data.baseEducation.length > 0) {
                    setEducation(data.baseEducation);
                }
                if (data.baseSkills) setSkills(data.baseSkills);
                if (data.llmConfig) setLlmConfig(data.llmConfig);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);

        try {
            await updateDoc(doc(db, 'users', user.uid), {
                profile,
                experience,
                education,
                baseExperience: experience,
                baseEducation: education,
                baseSkills: skills,
                llmConfig,
            });

            setSaveSuccess(true);
            toast.success('Profile saved successfully! 🎉');
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (error) {
            console.error('Error saving:', error);
            toast.error('Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const addExperience = () => {
        setExperience([
            ...experience,
            {
                company: '',
                title: '',
                location: '',
                startDate: '',
                endDate: '',
                current: false,
                bullets: [''],
            },
        ]);
    };

    const removeExperience = (index: number) => {
        setExperience(experience.filter((_, i) => i !== index));
    };

    const addEducation = () => {
        setEducation([
            ...education,
            {
                school: '',
                degree: '',
                field: '',
                location: '',
                graduationDate: '',
                gpa: '',
            },
        ]);
    };

    const removeEducation = (index: number) => {
        setEducation(education.filter((_, i) => i !== index));
    };

    const addSkill = (type: 'technical' | 'soft' | 'tools', value: string) => {
        if (!value.trim()) return;
        // Split by comma and add multiple skills
        const newSkills = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
        setSkills({
            ...skills,
            [type]: [...skills[type], ...newSkills.filter(s => !skills[type].includes(s))],
        });
        if (type === 'technical') setTechSkillInput('');
        if (type === 'tools') setToolInput('');
    };

    const removeSkill = (type: 'technical' | 'soft' | 'tools', index: number) => {
        setSkills({
            ...skills,
            [type]: skills[type].filter((_, i) => i !== index),
        });
    };

    // Calculate profile completion
    const calculateCompletion = () => {
        let completed = 0;
        let total = 8;

        if (profile.phone) completed++;
        if (profile.location) completed++;
        if (profile.linkedin || profile.github) completed++;
        if (experience[0]?.company) completed++;
        if (education[0]?.school) completed++;
        if (skills.technical.length > 0) completed++;
        if (skills.tools.length > 0) completed++;
        if (llmConfig.apiKey) completed++;

        return Math.round((completed / total) * 100);
    };

    const completionPercentage = calculateCompletion();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-gray-600 font-medium">Loading your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
                <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                                {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                                <h1 className="font-semibold text-gray-900">Profile Settings</h1>
                                <p className="text-xs text-gray-500">{user?.email}</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`
                            px-6 py-2.5 rounded-xl font-semibold transition-all duration-300
                            flex items-center gap-2 shadow-lg
                            ${saveSuccess
                                ? 'bg-emerald-500 text-white'
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl hover:scale-105'
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                    >
                        {saving ? (
                            <>
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Saving...
                            </>
                        ) : saveSuccess ? (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Saved!
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Save Profile
                            </>
                        )}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
                {/* Profile Completion Card */}
                <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold">Profile Completion</h2>
                            <p className="text-white/80 text-sm mt-1">Complete your profile for better resume generation</p>
                        </div>
                        <div className="relative w-20 h-20">
                            <svg className="w-20 h-20 transform -rotate-90">
                                <circle
                                    cx="40" cy="40" r="34"
                                    stroke="rgba(255,255,255,0.2)"
                                    strokeWidth="6"
                                    fill="none"
                                />
                                <circle
                                    cx="40" cy="40" r="34"
                                    stroke="white"
                                    strokeWidth="6"
                                    fill="none"
                                    strokeDasharray={`${completionPercentage * 2.14} 214`}
                                    strokeLinecap="round"
                                    className="transition-all duration-700"
                                />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">
                                {completionPercentage}%
                            </span>
                        </div>
                    </div>
                    <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white rounded-full transition-all duration-700"
                            style={{ width: `${completionPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Personal Information */}
                <Section
                    title="Personal Information"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    }
                    accentColor="blue"
                >
                    <div className="grid md:grid-cols-2 gap-4">
                        <FloatingInput
                            label="Phone Number"
                            type="tel"
                            value={profile.phone}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            placeholder="+1 (555) 000-0000"
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            }
                        />
                        <FloatingInput
                            label="Location"
                            value={profile.location}
                            onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                            placeholder="San Francisco, CA"
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            }
                        />
                        <FloatingInput
                            label="LinkedIn URL"
                            type="url"
                            value={profile.linkedin}
                            onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                            placeholder="linkedin.com/in/yourname"
                            icon={
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                </svg>
                            }
                        />
                        <FloatingInput
                            label="GitHub URL"
                            type="url"
                            value={profile.github}
                            onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                            placeholder="github.com/yourname"
                            icon={
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                            }
                        />
                    </div>
                </Section>

                {/* AI Configuration */}
                <Section
                    title="AI Configuration"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    }
                    accentColor="purple"
                    defaultOpen={true}
                    badge={
                        llmConfig.apiKey ? (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                                ✓ Configured
                            </span>
                        ) : (
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                                Setup Required
                            </span>
                        )
                    }
                >
                    <p className="text-sm text-gray-600 mb-6">
                        Configure your preferred AI provider for intelligent resume generation
                    </p>

                    <div className="space-y-6">
                        {/* Provider Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Select AI Provider
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'gemini', name: 'Google Gemini', icon: '🔷', desc: 'Free tier available', color: 'blue' },
                                    { id: 'openai', name: 'OpenAI GPT-4', icon: '🟢', desc: 'Most powerful', color: 'green' },
                                    { id: 'claude', name: 'Anthropic Claude', icon: '🟣', desc: 'Great for writing', color: 'purple' },
                                ].map((provider) => (
                                    <button
                                        key={provider.id}
                                        onClick={() => setLlmConfig({ ...llmConfig, provider: provider.id as any })}
                                        className={`
                                            p-4 rounded-xl border-2 transition-all duration-200 text-left
                                            ${llmConfig.provider === provider.id
                                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                            }
                                        `}
                                    >
                                        <div className="text-2xl mb-2">{provider.icon}</div>
                                        <div className="font-medium text-gray-900 text-sm">{provider.name}</div>
                                        <div className="text-xs text-gray-500 mt-1">{provider.desc}</div>
                                        {llmConfig.provider === provider.id && (
                                            <div className="mt-2">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                    Selected
                                                </span>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* API Key Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                API Key
                            </label>
                            <div className="relative">
                                <input
                                    type={showApiKey ? 'text' : 'password'}
                                    value={llmConfig.apiKey}
                                    onChange={(e) => setLlmConfig({ ...llmConfig, apiKey: e.target.value })}
                                    className="w-full px-4 py-4 pr-24 rounded-xl border-2 border-gray-200 bg-gray-50/50 focus:border-blue-500 focus:bg-white focus:outline-none transition-all font-mono text-sm"
                                    placeholder={
                                        llmConfig.provider === 'gemini' ? 'AIzaSy...' :
                                            llmConfig.provider === 'openai' ? 'sk-...' :
                                                'sk-ant-...'
                                    }
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    {showApiKey ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Your API key is encrypted and stored securely
                                </p>
                                <a
                                    href={
                                        llmConfig.provider === 'gemini' ? 'https://makersuite.google.com/app/apikey' :
                                            llmConfig.provider === 'openai' ? 'https://platform.openai.com/api-keys' :
                                                'https://console.anthropic.com/settings/keys'
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                >
                                    Get API Key
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* Work Experience */}
                <Section
                    title="Work Experience"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    }
                    accentColor="green"
                    badge={
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            {experience.length} position{experience.length !== 1 ? 's' : ''}
                        </span>
                    }
                >
                    <div className="space-y-6">
                        {experience.map((exp, index) => (
                            <div
                                key={index}
                                className="relative bg-gray-50 rounded-xl p-6 border border-gray-100"
                            >
                                {/* Position Number & Remove Button */}
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="w-7 h-7 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center text-sm font-bold">
                                            {index + 1}
                                        </span>
                                        <span className="text-sm font-medium text-gray-600">
                                            {exp.company || 'New Position'}
                                        </span>
                                    </div>
                                    {experience.length > 1 && (
                                        <button
                                            onClick={() => removeExperience(index)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                <div className="grid md:grid-cols-2 gap-4 mb-4">
                                    <FloatingInput
                                        label="Company Name"
                                        value={exp.company}
                                        onChange={(e) => {
                                            const newExp = [...experience];
                                            newExp[index].company = e.target.value;
                                            setExperience(newExp);
                                        }}
                                        placeholder="e.g., Google"
                                    />
                                    <FloatingInput
                                        label="Job Title"
                                        value={exp.title}
                                        onChange={(e) => {
                                            const newExp = [...experience];
                                            newExp[index].title = e.target.value;
                                            setExperience(newExp);
                                        }}
                                        placeholder="e.g., Senior Software Engineer"
                                    />
                                </div>

                                <div className="mb-4">
                                    <FloatingInput
                                        label="Location"
                                        value={exp.location}
                                        onChange={(e) => {
                                            const newExp = [...experience];
                                            newExp[index].location = e.target.value;
                                            setExperience(newExp);
                                        }}
                                        placeholder="e.g., San Francisco, CA (or Remote)"
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-2">Start Date</label>
                                        <input
                                            type="month"
                                            value={exp.startDate}
                                            onChange={(e) => {
                                                const newExp = [...experience];
                                                newExp[index].startDate = e.target.value;
                                                setExperience(newExp);
                                            }}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:border-blue-500 focus:outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-2">End Date</label>
                                        <input
                                            type="month"
                                            value={exp.endDate}
                                            onChange={(e) => {
                                                const newExp = [...experience];
                                                newExp[index].endDate = e.target.value;
                                                setExperience(newExp);
                                            }}
                                            disabled={exp.current}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:border-blue-500 focus:outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400"
                                        />
                                    </div>
                                </div>

                                <label className="flex items-center gap-3 mb-4 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={exp.current}
                                            onChange={(e) => {
                                                const newExp = [...experience];
                                                newExp[index].current = e.target.checked;
                                                if (e.target.checked) newExp[index].endDate = '';
                                                setExperience(newExp);
                                            }}
                                            className="sr-only"
                                        />
                                        <div className={`
                                            w-10 h-6 rounded-full transition-colors duration-200
                                            ${exp.current ? 'bg-emerald-500' : 'bg-gray-300'}
                                        `}>
                                            <div className={`
                                                w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200
                                                ${exp.current ? 'translate-x-5' : 'translate-x-1'}
                                                mt-1
                                            `} />
                                        </div>
                                    </div>
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900">I currently work here</span>
                                </label>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-2">Key Achievements</label>
                                    <textarea
                                        value={exp.bullets[0]}
                                        onChange={(e) => {
                                            const newExp = [...experience];
                                            newExp[index].bullets[0] = e.target.value;
                                            setExperience(newExp);
                                        }}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:border-blue-500 focus:outline-none transition-all resize-none"
                                        placeholder="• Increased team productivity by 40% through automation&#10;• Led a team of 5 engineers to deliver key features&#10;• Reduced system downtime by 99.9%"
                                        rows={4}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">One achievement per line. Start each with an action verb.</p>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={addExperience}
                            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-medium hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/50 transition-all flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Another Position
                        </button>
                    </div>
                </Section>

                {/* Education */}
                <Section
                    title="Education"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                        </svg>
                    }
                    accentColor="orange"
                    badge={
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            {education.length} degree{education.length !== 1 ? 's' : ''}
                        </span>
                    }
                >
                    <div className="space-y-6">
                        {education.map((edu, index) => (
                            <div
                                key={index}
                                className="relative bg-gray-50 rounded-xl p-6 border border-gray-100"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="w-7 h-7 bg-orange-100 text-orange-700 rounded-lg flex items-center justify-center text-sm font-bold">
                                            {index + 1}
                                        </span>
                                        <span className="text-sm font-medium text-gray-600">
                                            {edu.school || 'New Education'}
                                        </span>
                                    </div>
                                    {education.length > 1 && (
                                        <button
                                            onClick={() => removeEducation(index)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                <div className="grid md:grid-cols-2 gap-4 mb-4">
                                    <FloatingInput
                                        label="School / University"
                                        value={edu.school}
                                        onChange={(e) => {
                                            const newEdu = [...education];
                                            newEdu[index].school = e.target.value;
                                            setEducation(newEdu);
                                        }}
                                        placeholder="e.g., Stanford University"
                                    />
                                    <FloatingInput
                                        label="Degree"
                                        value={edu.degree}
                                        onChange={(e) => {
                                            const newEdu = [...education];
                                            newEdu[index].degree = e.target.value;
                                            setEducation(newEdu);
                                        }}
                                        placeholder="e.g., Bachelor of Science"
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <FloatingInput
                                        label="Field of Study"
                                        value={edu.field}
                                        onChange={(e) => {
                                            const newEdu = [...education];
                                            newEdu[index].field = e.target.value;
                                            setEducation(newEdu);
                                        }}
                                        placeholder="e.g., Computer Science"
                                    />
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-2">Graduation Date</label>
                                        <input
                                            type="month"
                                            value={edu.graduationDate}
                                            onChange={(e) => {
                                                const newEdu = [...education];
                                                newEdu[index].graduationDate = e.target.value;
                                                setEducation(newEdu);
                                            }}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:border-blue-500 focus:outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={addEducation}
                            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-medium hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50/50 transition-all flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Another Degree
                        </button>
                    </div>
                </Section>

                {/* Skills */}
                <Section
                    title="Skills & Technologies"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    }
                    accentColor="pink"
                    badge={
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            {skills.technical.length + skills.tools.length} skills
                        </span>
                    }
                >
                    <div className="space-y-6">
                        {/* Technical Skills */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Technical Skills
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={techSkillInput}
                                    onChange={(e) => setTechSkillInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addSkill('technical', techSkillInput);
                                        }
                                    }}
                                    className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50/50 focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                                    placeholder="Type skills separated by commas (e.g., Python, JavaScript, React)"
                                />
                                <button
                                    onClick={() => addSkill('technical', techSkillInput)}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                            {skills.technical.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {skills.technical.map((skill, index) => (
                                        <SkillTag
                                            key={index}
                                            skill={skill}
                                            onRemove={() => removeSkill('technical', index)}
                                            color="blue"
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Tools & Technologies */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Tools & Technologies
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={toolInput}
                                    onChange={(e) => setToolInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addSkill('tools', toolInput);
                                        }
                                    }}
                                    className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50/50 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
                                    placeholder="Type tools separated by commas (e.g., Git, Docker, AWS)"
                                />
                                <button
                                    onClick={() => addSkill('tools', toolInput)}
                                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                            {skills.tools.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {skills.tools.map((tool, index) => (
                                        <SkillTag
                                            key={index}
                                            skill={tool}
                                            onRemove={() => removeSkill('tools', index)}
                                            color="green"
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </Section>

                {/* Save Button (Mobile Sticky) */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-gray-200/50">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`
                            w-full py-4 rounded-xl font-semibold transition-all duration-300
                            flex items-center justify-center gap-2 shadow-lg
                            ${saveSuccess
                                ? 'bg-emerald-500 text-white'
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                            }
                            disabled:opacity-50
                        `}
                    >
                        {saving ? 'Saving...' : saveSuccess ? '✓ Saved!' : '✨ Save Profile'}
                    </button>
                </div>

                {/* Bottom Spacer for Mobile */}
                <div className="h-24 md:h-8" />
            </main>
        </div>
    );
}

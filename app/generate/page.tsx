'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import ApiKeySetup from '@/components/ApiKeySetup';
import { JobProcessingService } from '@/lib/llm-black-box/services/jobProcessing';
import { useGuestAuth } from '@/lib/hooks/useGuestAuth';
import { UpgradePrompt } from '@/components/guest/UpgradePrompt';
import ProfilePrompt from '@/components/ProfilePrompt';
import { checkUsageLimits, incrementUsage, getGlobalSettings } from '@/lib/services/guestService';
import { GuestCacheService } from '@/lib/services/guestCacheService';
import { authService } from '@/lib/services/auth';

export default function GeneratePage() {
    const { user } = useAuthStore();
    const { usageLimits, incrementUsage: incrementGuestUsage, checkLimit, loading: guestAuthLoading } = useGuestAuth();
    const router = useRouter();
    const [jobDescription, setJobDescription] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [analysis, setAnalysis] = useState<any>(null);
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [manualTitle, setManualTitle] = useState('');
    const [manualCompany, setManualCompany] = useState('');

    // API Key state
    const [showApiKeySetup, setShowApiKeySetup] = useState(false);
    const [llmConfig, setLlmConfig] = useState<any>(null);
    const [checkingApiKey, setCheckingApiKey] = useState(false);

    // Guest upgrade prompt
    const [showUpgrade, setShowUpgrade] = useState(false);

    // Profile prompt
    const [showProfilePrompt, setShowProfilePrompt] = useState(false);
    const [profilePromptMessage, setProfilePromptMessage] = useState('');

    // User menu
    const [showUserMenu, setShowUserMenu] = useState(false);

    // Free tries counter
    const [freeTriesInfo, setFreeTriesInfo] = useState<{ used: number; total: number; available: boolean } | null>(null);

    const tryUseGlobalApiKey = async () => {
        if (!user) return false;

        const settings = await getGlobalSettings();
        const globalKey = settings?.ai?.globalKey;

        if (!globalKey?.enabled || !globalKey?.key) {
            return false;
        }

        const limit = await checkUsageLimits(user, 'globalApiUsage');
        if (!limit.canUse) {
            return false;
        }

        setLlmConfig({
            provider: globalKey.provider,
            apiKey: globalKey.key,
            isGlobal: true,
        });
        return true;
    };

    // Restore data from localStorage
    useEffect(() => {
        const savedJD = localStorage.getItem('draft_jobDescription');
        const savedAnalysis = localStorage.getItem('draft_analysis');

        if (savedJD) setJobDescription(savedJD);
        if (savedAnalysis) {
            try {
                setAnalysis(JSON.parse(savedAnalysis));
            } catch (e) {
                console.error('Failed to parse saved analysis:', e);
            }
        }
    }, []);

    // Auto-save job description
    useEffect(() => {
        if (jobDescription) {
            localStorage.setItem('draft_jobDescription', jobDescription);
        }
    }, [jobDescription]);

    // Auto-save analysis
    useEffect(() => {
        if (analysis) {
            localStorage.setItem('draft_analysis', JSON.stringify(analysis));
        }
    }, [analysis]);

    // Load free tries info
    useEffect(() => {
        const loadFreeTriesInfo = async () => {
            if (!user) return;
            const settings = await getGlobalSettings();
            const globalKey = settings?.ai?.globalKey;

            if (globalKey?.enabled && globalKey?.key) {
                const limit = await checkUsageLimits(user, 'globalApiUsage');
                setFreeTriesInfo({
                    used: limit.current || 0,
                    total: limit.max || 3,
                    available: limit.canUse
                });
            } else {
                setFreeTriesInfo(null);
            }
        };
        loadFreeTriesInfo();
    }, [user]);

    // Check API key after guest auth completes
    useEffect(() => {
        if (!guestAuthLoading && user) {
            checkApiKey();
        }
    }, [guestAuthLoading, user]);

    // Load JD from URL parameter if present
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const jdId = params.get('jd');
        if (jdId && user) {
            loadJobDescription(jdId);
        }
    }, [user]);

    const loadJobDescription = async (jdId: string) => {
        try {
            const jdDoc = await getDoc(doc(db, 'jobs', jdId));
            if (jdDoc.exists()) {
                const jdData = jdDoc.data();
                setJobDescription(jdData.originalDescription || '');
                if (jdData.parsedData) {
                    setAnalysis(jdData.parsedData);
                    toast.success('Loaded previous job analysis!');
                }
            }
        } catch (error) {
            console.error('Error loading JD:', error);
        }
    };

    const checkApiKey = async () => {
        if (!user) return;
        setCheckingApiKey(true);

        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.data();

            if (userData?.llmConfig?.apiKey) {
                setLlmConfig(userData.llmConfig);
            } else {
                const hasGlobal = await tryUseGlobalApiKey();
                if (!hasGlobal) {
                    setShowApiKeySetup(true);
                }
            }
        } catch (error) {
            console.error('Error checking API key:', error);
        } finally {
            setCheckingApiKey(false);
        }
    };

    const handleAnalyze = async () => {
        if (jobDescription.length < 100) {
            toast.error('Please enter a longer job description (at least 100 characters)');
            return;
        }

        if (!user) {
            toast.error('Please sign in to continue');
            return;
        }

        const canAnalyze = await checkLimit('jdAnalyses');
        if (!canAnalyze) {
            setShowUpgrade(true);
            return;
        }

        let apiKeyToUse = llmConfig?.apiKey;
        let providerToUse = llmConfig?.provider;

        // JD Analysis is FREE - no limit check here
        // Only Resume Generation counts toward free tries limit

        // If no API key, try to get global key
        if (!apiKeyToUse) {
            const settings = await getGlobalSettings();
            const globalKey = settings?.ai?.globalKey;

            if (globalKey?.enabled && globalKey?.key) {
                // JD Analysis doesn't check limit - it's free
                apiKeyToUse = globalKey.key;
                providerToUse = globalKey.provider;
            } else {
                setShowApiKeySetup(true);
                return;
            }
        }

        setAnalyzing(true);
        toast.loading('Analyzing job description...', { id: 'analyze' });

        try {
            const result = await JobProcessingService.processJobDescription(
                `job_${Date.now()}`,
                user.uid,
                jobDescription,
                { provider: providerToUse, apiKey: apiKeyToUse }
            );

            setAnalysis(result.jobAnalysis);

            if (result.cached) {
                toast.success('Analysis loaded from cache!', { id: 'analyze' });
            } else {
                toast.success('Job analysis complete!', { id: 'analyze' });
                await incrementGuestUsage('jdAnalyses');
                // Note: globalApiUsage is NOT incremented here
                // Only Resume Generation counts toward free tries limit
            }

        } catch (error: any) {
            console.error('Analysis error:', error);
            toast.error(error.message || 'Failed to analyze job description', { id: 'analyze' });
        } finally {
            setAnalyzing(false);
        }
    };

    const handleManualEntry = () => {
        if (!manualTitle.trim()) {
            toast.error('Please enter a job title');
            return;
        }

        setAnalysis({
            title: manualTitle,
            company: manualCompany.trim() || '',  // Empty string allows proper fallback handling
            keywords: {
                technical: [],
                soft: [],
                tools: []
            },
            requirements: {
                mustHave: [],
                niceToHave: []
            },
            isManual: true
        });
    };

    const handleGenerateResume = async () => {
        if (!user) {
            toast.error('Please sign in to continue');
            return;
        }

        // Check profile completion - either has experience data or display name
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();

        // Check for ANY profile data - user has saved something
        const hasProfileData = userData && (
            userData.baseExperience?.length > 0 ||
            userData.baseEducation?.length > 0 ||
            userData.baseSkills?.technical?.length > 0 ||
            userData.profile?.phone ||
            user.displayName
        );

        if (!hasProfileData) {
            setProfilePromptMessage('Please complete your profile with at least some basic information before generating a resume.');
            setShowProfilePrompt(true);
            return;
        }

        const canGenerate = await checkLimit('resumeGenerations');
        if (!canGenerate) {
            setShowUpgrade(true);
            return;
        }

        let apiKeyToUse = llmConfig?.apiKey;
        let providerToUse = llmConfig?.provider;
        let usedGlobalKey = llmConfig?.isGlobal || false;

        // CHECK 1: If already using global key from llmConfig, re-check limit
        if (llmConfig?.isGlobal) {
            const globalLimit = await checkUsageLimits(user, 'globalApiUsage');
            if (!globalLimit.canUse) {
                toast.error(`You've used all ${globalLimit.max} free tries. Please add your own API key.`);
                setLlmConfig(null); // Clear the global config
                setShowApiKeySetup(true);
                return;
            }
        }

        // CHECK 2: If no API key, try to get global key
        if (!apiKeyToUse) {
            const settings = await getGlobalSettings();
            const globalKey = settings?.ai?.globalKey;

            if (globalKey?.enabled && globalKey?.key) {
                // Check if user has free tries left
                const globalLimit = await checkUsageLimits(user, 'globalApiUsage');
                if (!globalLimit.canUse) {
                    toast.error(`You've used all ${globalLimit.max} free tries. Please add your own API key.`);
                    setShowApiKeySetup(true);
                    return;
                }
                apiKeyToUse = globalKey.key;
                providerToUse = globalKey.provider;
                usedGlobalKey = true;
            } else {
                setShowApiKeySetup(true);
                return;
            }
        }

        setGenerating(true);
        toast.loading('Generating your tailored resume...', { id: 'generate' });

        try {
            const resumeId = `resume_${Date.now()}_${user.uid.slice(0, 8)}`;

            // Import and use resume generation service
            const { ResumeGenerationService } = await import('@/lib/llm-black-box/services/resumeGeneration');

            const result = await ResumeGenerationService.generateResume(
                resumeId,
                user.uid,
                userData as any,
                analysis,
                { provider: providerToUse, apiKey: apiKeyToUse }
            );

            // Save resume to Firestore
            const resumeData = {
                userId: user.uid,
                jobTitle: analysis.title,
                jobCompany: analysis.company,
                jobDescription: jobDescription,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                // Build personalInfo from available data
                personalInfo: {
                    fullName: user.displayName || user.email?.split('@')[0] || 'User',
                    email: user.email || '',
                    phone: userData?.profile?.phone || '',
                    location: userData?.profile?.location || '',
                    linkedin: userData?.profile?.linkedin || '',
                    github: userData?.profile?.github || '',
                    portfolio: userData?.profile?.portfolio || '',
                },
                professionalSummary: result.resume.professionalSummary,
                technicalSkills: result.resume.technicalSkills,
                experience: result.resume.experience,
                education: result.resume.education,
                cached: result.cached,
                tokensUsed: result.tokensUsed,
                processingTime: result.processingTime,
            };

            await setDoc(doc(db, 'resumes', resumeId), resumeData);
            console.log('[Generate] Resume saved to resumes collection:', resumeId, 'userId:', user.uid);

            // Clear localStorage
            localStorage.removeItem('draft_jobDescription');
            localStorage.removeItem('draft_analysis');

            toast.success('Resume generated successfully!', { id: 'generate' });
            await incrementGuestUsage('resumeGenerations');

            // Increment global API usage if we used the global key
            if (usedGlobalKey) {
                await incrementUsage(user, 'globalApiUsage');
                // Refresh free tries counter
                const settings = await getGlobalSettings();
                const globalKey = settings?.ai?.globalKey;
                if (globalKey?.enabled) {
                    const limit = await checkUsageLimits(user, 'globalApiUsage');
                    setFreeTriesInfo({
                        used: limit.current || 0,
                        total: limit.max || 3,
                        available: limit.canUse
                    });
                }
            }

            // Redirect to editor
            router.push(`/editor/${resumeId}`);

        } catch (error: any) {
            console.error('Generation error:', error);
            toast.error(error.message || 'Failed to generate resume', { id: 'generate' });
        } finally {
            setGenerating(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await authService.signout();
            toast.success('Signed out successfully');
            router.push('/');
        } catch (error) {
            toast.error('Failed to sign out');
        }
    };

    // Loading states
    if (guestAuthLoading || checkingApiKey) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-slate-600 font-medium">
                        {guestAuthLoading ? 'Initializing...' : 'Checking configuration...'}
                    </p>
                </div>
            </div>
        );
    }

    const currentStep = !analysis ? 1 : 2;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
            {/* API Key Setup Modal */}
            {showApiKeySetup && (
                <ApiKeySetup
                    onComplete={(skipped) => {
                        setShowApiKeySetup(false);
                        if (!skipped) {
                            checkApiKey();
                        } else {
                            tryUseGlobalApiKey().then((success) => {
                                if (!success) {
                                    setShowApiKeySetup(true);
                                }
                            });
                        }
                    }}
                />
            )}

            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                <span className="font-medium hidden sm:inline">Back</span>
                            </Link>
                            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                            <h1 className="text-lg font-semibold text-slate-900">Generate Resume</h1>
                        </div>

                        {/* Free Tries Counter */}
                        {freeTriesInfo && freeTriesInfo.available && (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-full">
                                <span className="text-emerald-600 text-xs">🎁</span>
                                <span className="text-xs font-medium text-emerald-700">
                                    {freeTriesInfo.total - freeTriesInfo.used} Free Tries Left
                                </span>
                            </div>
                        )}
                        {freeTriesInfo && !freeTriesInfo.available && (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
                                <span className="text-amber-600 text-xs">⚠️</span>
                                <span className="text-xs font-medium text-amber-700">No Free Tries Left</span>
                            </div>
                        )}

                        {/* Step Indicator */}
                        <div className="hidden md:flex items-center gap-3">
                            <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                    {currentStep > 1 ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : '1'}
                                </div>
                                <span className="text-sm font-medium">Analyze JD</span>
                            </div>
                            <div className={`w-12 h-0.5 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                            <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                    2
                                </div>
                                <span className="text-sm font-medium">Generate</span>
                            </div>
                        </div>

                        {/* User Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            </button>

                            {showUserMenu && (
                                <>
                                    <div className="fixed inset-0" onClick={() => setShowUserMenu(false)}></div>
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                                        <div className="px-4 py-2 border-b border-slate-100">
                                            <p className="text-sm font-medium text-slate-900 truncate">{user?.displayName || 'User'}</p>
                                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                        </div>
                                        <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                            </svg>
                                            Dashboard
                                        </Link>
                                        <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            Profile
                                        </Link>
                                        <div className="border-t border-slate-100 mt-2 pt-2">
                                            <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                {!analysis ? (
                    // Step 1: Job Description Input
                    <div className="space-y-8">
                        {/* Hero Section */}
                        <div className="text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-4">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                AI-Powered Resume Builder
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
                                Create Your Perfect Resume
                            </h1>
                            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                                Paste the job description and our AI will craft a tailored resume that highlights your relevant experience
                            </p>
                        </div>

                        {/* JD Input Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            {!showManualEntry ? (
                                <div className="p-6 sm:p-8">
                                    {/* Textarea */}
                                    <div className="relative">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-sm font-semibold text-slate-900">
                                                Job Description
                                            </label>
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${jobDescription.length >= 100
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                {jobDescription.length} / 100+ chars
                                            </span>
                                        </div>
                                        <textarea
                                            value={jobDescription}
                                            onChange={(e) => setJobDescription(e.target.value)}
                                            placeholder="Paste the complete job posting here...

The more details you include, the better your resume will be tailored. Include:
• Required skills and qualifications
• Responsibilities  
• Company information
• Nice-to-have requirements"
                                            className="w-full h-72 sm:h-80 p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white resize-none text-slate-900 placeholder-slate-400 text-sm transition-all"
                                        />

                                        {/* Progress bar */}
                                        <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 rounded-full ${jobDescription.length >= 100 ? 'bg-emerald-500' : 'bg-amber-400'
                                                    }`}
                                                style={{ width: `${Math.min(100, (jobDescription.length / 100) * 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-6 space-y-3">
                                        <button
                                            onClick={handleAnalyze}
                                            disabled={analyzing || jobDescription.length < 100}
                                            className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all"
                                        >
                                            {analyzing ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    Analyzing with AI...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                    </svg>
                                                    Analyze Job Description
                                                </>
                                            )}
                                        </button>

                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-slate-200"></div>
                                            </div>
                                            <div className="relative flex justify-center">
                                                <span className="px-4 bg-white text-sm text-slate-400">or</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setShowManualEntry(true)}
                                            className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 hover:border-slate-300 transition-all"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Enter Details Manually
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // Manual Entry Form
                                <div className="p-6 sm:p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-lg font-semibold text-slate-900">Enter Job Details</h2>
                                        <button
                                            onClick={() => setShowManualEntry(false)}
                                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            ← Use AI Instead
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Job Title <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={manualTitle}
                                                onChange={(e) => setManualTitle(e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white text-slate-900 placeholder-slate-400 transition-all"
                                                placeholder="e.g., Senior Software Engineer"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Company Name <span className="text-slate-400">(Optional)</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={manualCompany}
                                                onChange={(e) => setManualCompany(e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white text-slate-900 placeholder-slate-400 transition-all"
                                                placeholder="e.g., Google"
                                            />
                                        </div>

                                        <button
                                            onClick={handleManualEntry}
                                            disabled={!manualTitle.trim()}
                                            className="w-full flex items-center justify-center gap-2 py-4 mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            Continue to Generate
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Tips Section */}
                            <div className="px-6 sm:px-8 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-100">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900 mb-1">Pro Tips</h3>
                                        <ul className="text-xs text-slate-600 space-y-1">
                                            <li>• Include the full job posting for best results</li>
                                            <li>• Make sure your profile is complete before generating</li>
                                            <li>• AI will extract keywords to optimize your resume for ATS</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Step 2: Analysis Results
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900">Analysis Complete</h2>
                                </div>
                                <p className="text-slate-600">Review the extracted information and generate your tailored resume</p>
                            </div>
                            <button
                                onClick={() => {
                                    setAnalysis(null);
                                    localStorage.removeItem('draft_analysis');
                                }}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Analyze Different Job
                            </button>
                        </div>

                        {/* Job Info Card */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-bold mb-1">{analysis.title}</h3>
                                    <p className="text-slate-300">{analysis.company}</p>
                                    {analysis.yearsExperience && (
                                        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-sm">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {analysis.yearsExperience}+ years experience
                                        </div>
                                    )}
                                </div>
                                {analysis.isManual && (
                                    <span className="px-2.5 py-1 bg-amber-400/20 text-amber-300 text-xs font-medium rounded-full">
                                        Manual Entry
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Skills Grid */}
                        {!analysis.isManual && (
                            <div className="grid md:grid-cols-2 gap-4">
                                {/* Technical Skills */}
                                {analysis.keywords?.technical?.length > 0 && (
                                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                                </svg>
                                            </div>
                                            <h4 className="font-semibold text-slate-900">Technical Skills</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {analysis.keywords.technical.map((skill: string, i: number) => (
                                                <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Soft Skills */}
                                {analysis.keywords?.soft?.length > 0 && (
                                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                            </div>
                                            <h4 className="font-semibold text-slate-900">Soft Skills</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {analysis.keywords.soft.map((skill: string, i: number) => (
                                                <span key={i} className="px-2.5 py-1 bg-purple-50 text-purple-700 text-sm font-medium rounded-lg">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Tools */}
                                {analysis.keywords?.tools?.length > 0 && (
                                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                            <h4 className="font-semibold text-slate-900">Tools & Technologies</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {analysis.keywords.tools.map((tool: string, i: number) => (
                                                <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg">
                                                    {tool}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Requirements Summary */}
                                {(analysis.requirements?.mustHave?.length > 0 || analysis.requirements?.niceToHave?.length > 0) && (
                                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <h4 className="font-semibold text-slate-900">Requirements</h4>
                                        </div>
                                        <div className="space-y-3">
                                            {analysis.requirements.mustHave?.slice(0, 3).map((req: string, i: number) => (
                                                <div key={i} className="flex items-start gap-2">
                                                    <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    <span className="text-sm text-slate-600 line-clamp-1">{req}</span>
                                                </div>
                                            ))}
                                            {analysis.requirements.mustHave?.length > 3 && (
                                                <p className="text-xs text-slate-400">+{analysis.requirements.mustHave.length - 3} more requirements</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Generate Button */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <div className="flex-1 text-center sm:text-left">
                                    <h3 className="font-semibold text-slate-900 mb-1">Ready to generate your resume?</h3>
                                    <p className="text-sm text-slate-500">Your resume will be tailored using the extracted keywords and your profile data</p>
                                </div>
                                <button
                                    onClick={handleGenerateResume}
                                    disabled={generating}
                                    className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all whitespace-nowrap"
                                >
                                    {generating ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                            </svg>
                                            Generate Resume
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Modals */}
            <UpgradePrompt show={showUpgrade} onClose={() => setShowUpgrade(false)} />
            <ProfilePrompt
                show={showProfilePrompt}
                onClose={() => setShowProfilePrompt(false)}
                message={profilePromptMessage}
            />
        </div>
    );
}

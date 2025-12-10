'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import ApiKeySetup from '@/components/ApiKeySetup';
import AppHeader from '@/components/AppHeader';
import { JobProcessingService } from '@/lib/llm-black-box/services/jobProcessing';
import { useGuestAuth } from '@/lib/hooks/useGuestAuth';
import { UpgradePrompt } from '@/components/guest/UpgradePrompt';
import ProfilePrompt from '@/components/ProfilePrompt';
import { GuestCacheService } from '@/lib/services/guestCacheService';

export default function GeneratePage() {
    const { user } = useAuthStore();
    const { usageLimits, trackUsage, loading: guestAuthLoading } = useGuestAuth();
    const router = useRouter();
    const [jobDescription, setJobDescription] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
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

    // ✅ RESTORE data from localStorage on mount (survives refresh)
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

    // ✅ SAVE job description to localStorage (auto-save)
    useEffect(() => {
        if (jobDescription) {
            localStorage.setItem('draft_jobDescription', jobDescription);
        }
    }, [jobDescription]);

    // ✅ SAVE analysis to localStorage (auto-save)
    useEffect(() => {
        if (analysis) {
            localStorage.setItem('draft_analysis', JSON.stringify(analysis));
        }
    }, [analysis]);

    // Check API key after guest auth completes
    useEffect(() => {
        if (!guestAuthLoading && user) {
            checkApiKey();
        }
    }, [guestAuthLoading, user]);

    // Load JD from URL parameter if present
    useEffect(() => {
        const loadJDFromUrl = async () => {
            const params = new URLSearchParams(window.location.search);
            const jdId = params.get('jdId');

            if (jdId && user) {
                try {
                    const jdDoc = await getDoc(doc(db, 'jobs', jdId));
                    if (jdDoc.exists()) {
                        const jdData = jdDoc.data();
                        setJobDescription(jdData.originalDescription || '');
                        toast.success('Job description loaded!');
                    }
                } catch (error) {
                    console.error('Error loading JD:', error);
                    toast.error('Failed to load job description');
                }
            }
        };

        loadJDFromUrl();
    }, [user]);

    const checkApiKey = async () => {
        if (!user) {
            setCheckingApiKey(false);
            return;
        }

        setCheckingApiKey(true);

        try {
            // For guest users: Check cache FIRST for instant load
            if (user.isAnonymous) {
                const cached = GuestCacheService.loadApiKey();
                if (cached) {
                    setLlmConfig(cached);
                    setShowApiKeySetup(false);
                    setCheckingApiKey(false);
                    console.log('[Generate] Loaded API key from cache (instant!)');
                    return;
                }
            }

            // Then check Firebase (for logged-in users or if cache miss)
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.llmConfig?.apiKey) {
                    setLlmConfig(userData.llmConfig);
                    setShowApiKeySetup(false);

                    // Cache for guest users
                    if (user.isAnonymous) {
                        GuestCacheService.saveApiKey(userData.llmConfig.provider, userData.llmConfig.apiKey);
                    }
                } else {
                    setShowApiKeySetup(true);
                }
            } else {
                setShowApiKeySetup(true);
            }
        } catch (error) {
            console.error('Error checking API key:', error);
            setShowApiKeySetup(true);
        } finally {
            setCheckingApiKey(false);
        }
    };

    const handleManualEntry = () => {
        if (!manualTitle.trim()) {
            toast.error('Please enter a job title');
            return;
        }

        const manualAnalysis = {
            title: manualTitle,
            company: manualCompany || '',
            keywords: {
                technical: [],
                soft: [],
                tools: []
            },
            requirements: {
                mustHave: [],
                niceToHave: []
            },
            yearsExperience: 0
        };

        setAnalysis(manualAnalysis);
        toast.success('Ready to generate resume!');
    };

    const handleAnalyze = async () => {
        if (jobDescription.length < 100) {
            toast.error('Please paste a complete job description (at least 100 characters)');
            return;
        }

        if (!llmConfig?.apiKey) {
            toast.error('Please configure your API key first');
            setShowApiKeySetup(true);
            return;
        }

        if (!user) {
            toast.error('Please sign in to continue');
            return;
        }

        setAnalyzing(true);

        try {
            // Generate unique job ID
            const jobId = `job_${Date.now()}_${user.uid}`;

            // Use new JobProcessingService with LLM Black Box
            const result = await JobProcessingService.processJobDescription(
                jobId,
                user.uid,
                jobDescription,
                {
                    provider: llmConfig.provider,
                    apiKey: llmConfig.apiKey,
                }
            );

            // Transform to expected format
            const transformedAnalysis = {
                title: result.jobAnalysis.title,
                company: result.jobAnalysis.company,
                keywords: {
                    technical: result.jobAnalysis.requiredSkills.slice(0, 10),
                    soft: result.jobAnalysis.keywords.filter(k =>
                        ['leadership', 'communication', 'teamwork', 'problem-solving'].includes(k.toLowerCase())
                    ),
                    tools: result.jobAnalysis.preferredSkills.slice(0, 5),
                },
                requirements: {
                    mustHave: result.jobAnalysis.qualifications,
                    niceToHave: result.jobAnalysis.responsibilities.slice(0, 3),
                },
                yearsExperience: result.jobAnalysis.yearsRequired,
            };

            setAnalysis(transformedAnalysis);

            // Show cache status
            if (result.cached) {
                toast.success(`✅ Job analyzed from cache! (0 tokens used)`, {
                    duration: 3000,
                    icon: '⚡',
                });
            } else {
                toast.success(`✅ Job analyzed! (${result.tokensUsed} tokens, ${result.processingTime}ms)`, {
                    duration: 3000,
                });
            }

        } catch (error: any) {
            console.error('Analysis error:', error);
            toast.error(error.message || 'Failed to analyze job description. Please try again.');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleGenerateResume = async () => {
        // Check usage limits for guest users
        if (!usageLimits.canUse) {
            setShowUpgrade(true);
            toast.error('You\'ve reached your free limit. Sign up for unlimited access!');
            return;
        }

        if (!user || !analysis) {
            toast.error('Missing required data');
            return;
        }

        if (!llmConfig?.apiKey) {
            toast.error('Please configure your API key first');
            setShowApiKeySetup(true);
            return;
        }

        try {
            toast.loading('Generating your resume...', { id: 'generate' });

            // Step 1: Fetch user profile from Firebase
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists()) {
                toast.dismiss('generate');
                setProfilePromptMessage('Please complete your profile to generate a resume');
                setShowProfilePrompt(true);
                return;
            }

            const userData = userDoc.data();

            // Step 2: Transform user data to UserProfile format
            const userProfile = {
                personalInfo: {
                    name: userData.profile?.name || userData.name || user.displayName || '',
                    email: userData.profile?.email || userData.email || user.email || '',
                    phone: userData.profile?.phone || userData.phone || '',
                    location: userData.profile?.location || userData.location || '',
                    linkedin: userData.profile?.linkedin || userData.linkedin || '',
                    github: userData.profile?.github || userData.github || '',
                },
                experience: (userData.baseExperience || userData.experience || []).map((exp: any) => ({
                    company: exp.company || '',
                    title: exp.title || '',
                    location: exp.location || '',
                    startDate: exp.startDate || '',
                    endDate: exp.endDate || '',
                    current: exp.current || false,
                })),
                education: (userData.baseEducation || userData.education || []).map((edu: any) => ({
                    school: edu.school || '',
                    degree: edu.degree || '',
                    field: edu.field || '',
                    graduationDate: edu.graduationDate || '',
                })),
            };

            // Validate user has experience
            if (!userProfile.experience || userProfile.experience.length === 0) {
                toast.dismiss('generate');
                setProfilePromptMessage('Please add your work experience to generate a resume');
                setShowProfilePrompt(true);
                return;
            }

            // Step 3: Transform analysis to JobAnalysis format
            const jobAnalysis = {
                title: analysis.title || '',
                company: analysis.company || '',
                requiredSkills: analysis.keywords?.technical || [],
                preferredSkills: analysis.keywords?.tools || [],
                keywords: [
                    ...(analysis.keywords?.technical || []),
                    ...(analysis.keywords?.soft || []),
                    ...(analysis.keywords?.tools || []),
                ],
                experienceLevel: 'Mid' as const,
                yearsRequired: analysis.yearsExperience || 0,
                qualifications: analysis.requirements?.mustHave || [],
                responsibilities: analysis.requirements?.niceToHave || [],
            };

            // Step 4: Generate resume using AI
            toast.loading('AI is generating your resume sections...', { id: 'generate' });

            const { ResumeGenerationService } = await import('@/lib/llm-black-box/services/resumeGeneration');

            const resumeId = `resume_${Date.now()}_${user.uid}`;

            const result = await ResumeGenerationService.generateResume(
                resumeId,
                user.uid,
                userProfile,
                jobAnalysis,
                {
                    provider: llmConfig.provider,
                    apiKey: llmConfig.apiKey,
                }
            );

            // Step 5: Create resume document in Firestore
            toast.loading('Saving your resume...', { id: 'generate' });

            const resumeData = {
                userId: user.uid,
                jobTitle: analysis.title,
                jobCompany: analysis.company,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),

                // Personal Info
                personalInfo: userProfile.personalInfo,

                // AI-Generated Content
                professionalSummary: result.resume.professionalSummary,
                technicalSkills: result.resume.technicalSkills,
                experience: result.resume.experience,
                education: result.resume.education,

                // Metadata
                cached: result.cached,
                tokensUsed: result.tokensUsed,
                processingTime: result.processingTime,
            };

            await setDoc(doc(db, 'resumes', resumeId), resumeData);

            // Step 6: Show success and redirect
            if (result.cached) {
                toast.success(`✅ Resume generated from cache! (0 tokens)`, {
                    id: 'generate',
                    duration: 3000,
                    icon: '⚡',
                });
            } else {
                toast.success(`✅ Resume generated! (${result.tokensUsed} tokens, ${result.processingTime}ms)`, {
                    id: 'generate',
                    duration: 3000,
                });
            }

            // Track usage for guest users
            await trackUsage('resumeGenerations');

            // Redirect to editor
            setTimeout(() => {
                router.push(`/editor/${resumeId}`);
            }, 1000);

        } catch (error: any) {
            console.error('Resume generation error:', error);
            toast.error(error.message || 'Failed to generate resume. Please try again.', {
                id: 'generate',
            });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* API Key Setup Modal */}
            {showApiKeySetup && (
                <ApiKeySetup
                    onComplete={() => {
                        setShowApiKeySetup(false);
                        checkApiKey();
                    }}
                />
            )}

            {/* Guest Auth Loading State */}
            {guestAuthLoading && (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Initializing...</p>
                    </div>
                </div>
            )}

            {/* API Key Loading State */}
            {!guestAuthLoading && checkingApiKey && (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Checking configuration...</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <AppHeader title="Generate Resume" showBack={true} backUrl="/dashboard" />

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 py-12">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Generate AI-Optimized Resume
                    </h1>
                    <p className="text-xl text-gray-600">
                        Paste the job description below and let AI create a perfectly tailored resume
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {!analysis ? (
                        // Step 1: Job Description Input
                        <div className="space-y-6">
                            <div>
                                <label className="block text-lg font-semibold text-gray-900 mb-2">
                                    Job Description *
                                </label>
                                <p className="text-sm text-gray-600 mb-4">
                                    Copy and paste the complete job posting you're applying for
                                </p>
                                <textarea
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    placeholder="Paste the job description here...

Example:
We are looking for a Senior Software Engineer with 5+ years of experience in:
• Python, Django, FastAPI
• AWS, Docker, Kubernetes
• PostgreSQL, Redis
..."
                                    className="w-full h-96 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                                />
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-sm text-gray-500">
                                        {jobDescription.length} characters
                                        {jobDescription.length < 100 && (
                                            <span className="text-orange-600 ml-2">
                                                (minimum 100 required)
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>

                            {!showManualEntry ? (
                                <>
                                    <button
                                        onClick={handleAnalyze}
                                        disabled={analyzing || jobDescription.length < 100}
                                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl text-lg font-bold hover:shadow-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        {analyzing ? (
                                            <span className="flex items-center justify-center gap-3">
                                                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Analyzing with AI...
                                            </span>
                                        ) : (
                                            '🤖 Analyze Job Description with AI'
                                        )}
                                    </button>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-300"></div>
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-2 bg-white text-gray-500">Or</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setShowManualEntry(true)}
                                        className="w-full border-2 border-gray-300 text-gray-700 py-4 rounded-xl text-lg font-bold hover:border-gray-400 hover:bg-gray-50 transition-all"
                                    >
                                        ✏️ Enter Job Details Manually (Skip AI)
                                    </button>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Job Title *
                                        </label>
                                        <input
                                            type="text"
                                            value={manualTitle}
                                            onChange={(e) => setManualTitle(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., Senior Software Engineer"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Company Name (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={manualCompany}
                                            onChange={(e) => setManualCompany(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., Google"
                                        />
                                    </div>

                                    <button
                                        onClick={handleManualEntry}
                                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl text-lg font-bold hover:shadow-2xl transition-all"
                                    >
                                        ✨ Continue to Resume
                                    </button>

                                    <button
                                        onClick={() => setShowManualEntry(false)}
                                        className="w-full text-gray-600 hover:text-gray-800 py-2"
                                    >
                                        ← Back to AI Analysis
                                    </button>
                                </div>
                            )}

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="font-semibold text-blue-900 mb-2">💡 Pro Tips:</h3>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• AI analysis extracts keywords automatically but may fail on free tier</li>
                                    <li>• Manual entry is faster and more reliable</li>
                                    <li>• Your profile data will be used to generate the resume</li>
                                    <li>• Make sure to complete your profile first!</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        // Step 2: Analysis Results
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Analysis Complete! ✨</h2>
                                <button
                                    onClick={() => setAnalysis(null)}
                                    className="text-blue-600 hover:text-blue-700 font-semibold"
                                >
                                    ← Analyze Different Job
                                </button>
                            </div>

                            {/* Job Info */}
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {analysis.title}
                                </h3>
                                <p className="text-gray-700">
                                    {analysis.company}
                                </p>
                                {analysis.yearsExperience && (
                                    <p className="text-sm text-gray-600 mt-2">
                                        Required Experience: {analysis.yearsExperience}+ years
                                    </p>
                                )}
                            </div>

                            {/* Keywords */}
                            <div>
                                <h3 className="font-bold text-gray-900 mb-3">Technical Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.keywords.technical.map((skill: string, index: number) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-gray-900 mb-3">Soft Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.keywords.soft.map((skill: string, index: number) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-gray-900 mb-3">Tools & Technologies</h3>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.keywords.tools.map((tool: string, index: number) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                                        >
                                            {tool}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Requirements */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-3">Must Have</h3>
                                    <ul className="space-y-2">
                                        {analysis.requirements.mustHave.map((req: string, index: number) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <span className="text-green-600 mt-1">✓</span>
                                                <span className="text-gray-700">{req}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-bold text-gray-900 mb-3">Nice to Have</h3>
                                    <ul className="space-y-2">
                                        {analysis.requirements.niceToHave.map((req: string, index: number) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <span className="text-blue-600 mt-1">○</span>
                                                <span className="text-gray-700">{req}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Generate Button */}
                            <button
                                onClick={handleGenerateResume}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl text-lg font-bold hover:shadow-2xl transition-all transform hover:scale-105"
                            >
                                ✨ Generate Tailored Resume
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Upgrade Prompt Modal */}
            <UpgradePrompt show={showUpgrade} onClose={() => setShowUpgrade(false)} />

            {/* Profile Prompt Modal */}
            <ProfilePrompt
                show={showProfilePrompt}
                onClose={() => setShowProfilePrompt(false)}
                message={profilePromptMessage}
            />
        </div>
    );
}

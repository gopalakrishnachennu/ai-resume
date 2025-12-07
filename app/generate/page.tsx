'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { toast } from 'react-hot-toast';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export default function GeneratePage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [jobDescription, setJobDescription] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<any>(null);
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [manualTitle, setManualTitle] = useState('');
    const [manualCompany, setManualCompany] = useState('');

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

        setAnalyzing(true);

        try {
            const model = genAI.getGenerativeModel({
                model: 'gemini-2.5-flash',
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 512,
                }
            });

            const prompt = `Extract from this job description and return ONLY valid JSON (no text before/after):

${jobDescription.substring(0, 1000)}

JSON format:
{"title":"job title","company":"company or empty","keywords":{"technical":["skill1","skill2"],"soft":["skill1"],"tools":["tool1"]},"requirements":{"mustHave":["req1"],"niceToHave":["req1"]},"yearsExperience":5}`;

            const result = await model.generateContent(prompt);
            const response = result.response;

            // Wait for the full response
            const text = await response.text();

            console.log('AI Response (full):', text);
            console.log('Response length:', text.length);

            // Try to extract JSON from the response
            let parsedAnalysis;

            // Clean markdown formatting
            let jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

            // Try to find JSON object in the text
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonText = jsonMatch[0];
            }

            console.log('Extracted JSON text:', jsonText);

            // Try to parse as-is first
            try {
                parsedAnalysis = JSON.parse(jsonText);
                console.log('Successfully parsed JSON:', parsedAnalysis);
            } catch (firstError) {
                console.log('Initial parse failed, attempting to fix...');

                // Try to fix incomplete JSON
                try {
                    // Count braces
                    const openBraces = (jsonText.match(/\{/g) || []).length;
                    const closeBraces = (jsonText.match(/\}/g) || []).length;

                    if (openBraces > closeBraces) {
                        // Add missing closing braces
                        const missing = openBraces - closeBraces;
                        jsonText += '}'.repeat(missing);
                        console.log('Added', missing, 'closing braces');
                    }

                    // Try parsing again
                    parsedAnalysis = JSON.parse(jsonText);
                    console.log('Successfully parsed after fixing braces:', parsedAnalysis);
                } catch (secondError) {
                    console.error('JSON Parse Error:', secondError);
                    console.error('Failed to parse:', jsonText);

                    // Use fallback data
                    parsedAnalysis = {
                        title: "Software Engineer",
                        company: "Company Name",
                        keywords: {
                            technical: ["Python", "JavaScript", "AWS"],
                            soft: ["Communication", "Leadership"],
                            tools: ["Git", "Docker"]
                        },
                        requirements: {
                            mustHave: ["5+ years experience"],
                            niceToHave: ["Additional skills"]
                        },
                        yearsExperience: 5
                    };
                    toast.error('AI response was incomplete. Using fallback data.');
                }
            }

            // Validate and fill missing fields
            if (!parsedAnalysis.title) parsedAnalysis.title = "Position";
            if (!parsedAnalysis.company) parsedAnalysis.company = "";
            if (!parsedAnalysis.keywords) parsedAnalysis.keywords = { technical: [], soft: [], tools: [] };
            if (!parsedAnalysis.keywords.technical) parsedAnalysis.keywords.technical = [];
            if (!parsedAnalysis.keywords.soft) parsedAnalysis.keywords.soft = [];
            if (!parsedAnalysis.keywords.tools) parsedAnalysis.keywords.tools = [];
            if (!parsedAnalysis.requirements) parsedAnalysis.requirements = { mustHave: [], niceToHave: [] };
            if (!parsedAnalysis.requirements.mustHave) parsedAnalysis.requirements.mustHave = [];
            if (!parsedAnalysis.requirements.niceToHave) parsedAnalysis.requirements.niceToHave = [];
            if (!parsedAnalysis.yearsExperience) parsedAnalysis.yearsExperience = 0;

            console.log('Final analysis:', parsedAnalysis);
            setAnalysis(parsedAnalysis);
            toast.success('Job description analyzed! 🎉');
        } catch (error: any) {
            console.error('Analysis error:', error);
            toast.error('Failed to analyze job description. Please try again.');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleGenerateResume = () => {
        // Store analysis in localStorage for now
        localStorage.setItem('jobAnalysis', JSON.stringify(analysis));
        localStorage.setItem('jobDescription', jobDescription);

        // Navigate to editor (we'll build this next)
        router.push('/editor/new');
        toast.success('Generating your resume...');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg"></div>
                        <span className="text-xl font-bold text-gray-900">AI Resume Builder</span>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </header>

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
        </div>
    );
}

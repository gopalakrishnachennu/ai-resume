'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGuestAuth } from '@/lib/hooks/useGuestAuth';
import { toast } from 'react-hot-toast';
import { ApplicationService } from '@/lib/services/applicationService';

// JSON Resume schema interface
interface JSONResume {
    basics?: {
        name?: string;
        email?: string;
        phone?: string;
        location?: {
            city?: string;
            region?: string;
            country?: string;
        };
        summary?: string;
        profiles?: Array<{
            network?: string;
            url?: string;
        }>;
    };
    work?: Array<{
        company?: string;
        position?: string;
        startDate?: string;
        endDate?: string;
        summary?: string;
        highlights?: string[];
    }>;
    education?: Array<{
        institution?: string;
        area?: string;
        studyType?: string;
        startDate?: string;
        endDate?: string;
    }>;
    skills?: Array<{
        name?: string;
        keywords?: string[];
    }>;
}

export default function ImportPage() {
    const router = useRouter();
    const { user, isGuest } = useGuestAuth();
    const [jsonInput, setJsonInput] = useState('');
    const [resumeName, setResumeName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);
    const [parseError, setParseError] = useState('');

    // Parse JSON and convert to app format
    const parseJSONResume = (jsonStr: string) => {
        try {
            const parsed: JSONResume = JSON.parse(jsonStr);
            setParseError('');

            // Convert to app format
            const resumeData = {
                personalInfo: {
                    fullName: parsed.basics?.name || '',
                    email: parsed.basics?.email || '',
                    phone: parsed.basics?.phone || '',
                    location: parsed.basics?.location
                        ? `${parsed.basics.location.city || ''}, ${parsed.basics.location.region || ''}`
                        : '',
                    linkedin: parsed.basics?.profiles?.find(p => p.network?.toLowerCase() === 'linkedin')?.url || '',
                    portfolio: parsed.basics?.profiles?.find(p => p.network?.toLowerCase() !== 'linkedin')?.url || '',
                },
                professionalSummary: parsed.basics?.summary || '',
                technicalSkills: parsed.skills?.reduce((acc, skill) => {
                    if (skill.name && skill.keywords) {
                        acc[skill.name] = skill.keywords;
                    }
                    return acc;
                }, {} as Record<string, string[]>) || {},
                experience: parsed.work?.map(job => ({
                    company: job.company || '',
                    title: job.position || '',
                    startDate: job.startDate || '',
                    endDate: job.endDate || 'Present',
                    description: job.summary || '',
                    highlights: job.highlights || [],
                })) || [],
                education: parsed.education?.map(edu => ({
                    institution: edu.institution || '',
                    degree: edu.studyType || '',
                    field: edu.area || '',
                    graduationDate: edu.endDate || '',
                })) || [],
            };

            setPreviewData(resumeData);
            return resumeData;
        } catch (e) {
            setParseError('Invalid JSON format. Please check your input.');
            setPreviewData(null);
            return null;
        }
    };

    // Handle JSON input change with debounced parsing
    const handleJsonChange = (value: string) => {
        setJsonInput(value);
        if (value.trim()) {
            parseJSONResume(value);
        } else {
            setPreviewData(null);
            setParseError('');
        }
    };

    // Handle file upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setJsonInput(content);
            parseJSONResume(content);
        };
        reader.readAsText(file);
    };

    // Create application and navigate to editor
    const handleFormatResume = async () => {
        if (!previewData) {
            toast.error('Please provide valid JSON resume data');
            return;
        }

        const userId = user?.uid || (isGuest ? 'guest' : null);
        if (!userId) {
            toast.error('Please sign in to continue');
            router.push('/login');
            return;
        }

        setIsLoading(true);
        try {
            const appId = await ApplicationService.createFromImport(
                userId,
                previewData,
                resumeName || undefined
            );

            toast.success('Resume imported successfully!');
            router.push(`/editor/${appId}`);
        } catch (error) {
            console.error('Error creating import:', error);
            toast.error('Failed to import resume. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Sample JSON Resume for users to reference
    const sampleJson = `{
  "basics": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "(555) 123-4567",
    "location": { "city": "San Francisco", "region": "CA" },
    "summary": "Experienced software engineer...",
    "profiles": [
      { "network": "LinkedIn", "url": "https://linkedin.com/in/johndoe" }
    ]
  },
  "work": [
    {
      "company": "Tech Corp",
      "position": "Senior Developer",
      "startDate": "2020-01",
      "endDate": "Present",
      "summary": "Led development of...",
      "highlights": ["Increased performance by 40%"]
    }
  ],
  "education": [
    {
      "institution": "University of Technology",
      "area": "Computer Science",
      "studyType": "Bachelor's",
      "endDate": "2019"
    }
  ],
  "skills": [
    { "name": "Programming", "keywords": ["JavaScript", "Python", "Go"] },
    { "name": "Frameworks", "keywords": ["React", "Node.js", "Django"] }
  ]
}`;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
            {/* Header */}
            <header className="glass border-b border-white/20 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                            AI Resume Builder
                        </span>
                    </Link>

                    <div className="flex gap-4">
                        <Link
                            href="/dashboard"
                            className="px-5 py-2.5 text-slate-600 hover:text-slate-900 font-medium transition-all"
                        >
                            Dashboard
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">
                        Quick Format Resume
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Import your resume in JSON Resume format, format it beautifully, and download as PDF or DOCX.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Input Section */}
                    <div className="space-y-6">
                        {/* Resume Name */}
                        <div className="glass rounded-2xl p-6 border border-white/50">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Resume Name (Optional)
                            </label>
                            <input
                                type="text"
                                value={resumeName}
                                onChange={(e) => setResumeName(e.target.value)}
                                placeholder="e.g., Software Engineer Resume"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                        </div>

                        {/* JSON Input */}
                        <div className="glass rounded-2xl p-6 border border-white/50">
                            <div className="flex justify-between items-center mb-4">
                                <label className="text-sm font-semibold text-slate-700">
                                    JSON Resume Data
                                </label>
                                <label className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-600 transition-colors">
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    📁 Upload JSON
                                </label>
                            </div>
                            <textarea
                                value={jsonInput}
                                onChange={(e) => handleJsonChange(e.target.value)}
                                placeholder="Paste your JSON Resume here..."
                                className="w-full h-80 px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono text-sm resize-none transition-all"
                            />
                            {parseError && (
                                <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                    <span>⚠️</span> {parseError}
                                </p>
                            )}
                        </div>

                        {/* Sample JSON Reference */}
                        <details className="glass rounded-2xl p-6 border border-white/50">
                            <summary className="cursor-pointer text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors">
                                📋 View Sample JSON Format
                            </summary>
                            <pre className="mt-4 p-4 bg-slate-900 text-slate-100 rounded-xl text-xs overflow-auto max-h-60">
                                {sampleJson}
                            </pre>
                            <button
                                onClick={() => handleJsonChange(sampleJson)}
                                className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Use this sample →
                            </button>
                        </details>
                    </div>

                    {/* Preview Section */}
                    <div className="space-y-6">
                        <div className="glass rounded-2xl p-6 border border-white/50 min-h-[500px]">
                            <h3 className="text-sm font-semibold text-slate-700 mb-4">
                                Preview
                            </h3>

                            {previewData ? (
                                <div className="space-y-4 text-sm">
                                    {/* Personal Info */}
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                                        <h4 className="font-bold text-slate-900 text-lg">
                                            {previewData.personalInfo.fullName || 'No name provided'}
                                        </h4>
                                        <div className="text-slate-600 space-y-1 mt-2">
                                            {previewData.personalInfo.email && (
                                                <p>📧 {previewData.personalInfo.email}</p>
                                            )}
                                            {previewData.personalInfo.phone && (
                                                <p>📱 {previewData.personalInfo.phone}</p>
                                            )}
                                            {previewData.personalInfo.location && (
                                                <p>📍 {previewData.personalInfo.location}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    {previewData.professionalSummary && (
                                        <div>
                                            <h5 className="font-semibold text-slate-800 mb-1">Summary</h5>
                                            <p className="text-slate-600 line-clamp-3">
                                                {previewData.professionalSummary}
                                            </p>
                                        </div>
                                    )}

                                    {/* Experience */}
                                    {previewData.experience?.length > 0 && (
                                        <div>
                                            <h5 className="font-semibold text-slate-800 mb-2">
                                                Experience ({previewData.experience.length})
                                            </h5>
                                            {previewData.experience.slice(0, 2).map((exp: any, i: number) => (
                                                <div key={i} className="bg-slate-50 rounded-lg p-3 mb-2">
                                                    <p className="font-medium text-slate-800">{exp.title}</p>
                                                    <p className="text-slate-500 text-xs">
                                                        {exp.company} • {exp.startDate} - {exp.endDate}
                                                    </p>
                                                </div>
                                            ))}
                                            {previewData.experience.length > 2 && (
                                                <p className="text-slate-400 text-xs">
                                                    +{previewData.experience.length - 2} more...
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Education */}
                                    {previewData.education?.length > 0 && (
                                        <div>
                                            <h5 className="font-semibold text-slate-800 mb-2">
                                                Education ({previewData.education.length})
                                            </h5>
                                            {previewData.education.slice(0, 1).map((edu: any, i: number) => (
                                                <div key={i} className="bg-slate-50 rounded-lg p-3">
                                                    <p className="font-medium text-slate-800">
                                                        {edu.degree} in {edu.field}
                                                    </p>
                                                    <p className="text-slate-500 text-xs">{edu.institution}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Skills */}
                                    {Object.keys(previewData.technicalSkills || {}).length > 0 && (
                                        <div>
                                            <h5 className="font-semibold text-slate-800 mb-2">Skills</h5>
                                            <div className="flex flex-wrap gap-1">
                                                {Object.entries(previewData.technicalSkills)
                                                    .flatMap(([_, skills]: [string, any]) => skills)
                                                    .slice(0, 8)
                                                    .map((skill: string, i: number) => (
                                                        <span
                                                            key={i}
                                                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-80 text-slate-400">
                                    <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-center">
                                        Paste or upload your JSON resume<br />to see a preview
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={handleFormatResume}
                            disabled={!previewData || isLoading}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${previewData && !isLoading
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Creating...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Format Resume & Open Editor
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

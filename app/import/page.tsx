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
    const [detectedFormat, setDetectedFormat] = useState<'json' | 'text' | null>(null);

    // Detect input format
    const detectFormat = (input: string): 'json' | 'text' => {
        const trimmed = input.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            return 'json';
        }
        return 'text';
    };

    // Parse plain text resume using regex
    const parseTextResume = (text: string) => {
        try {
            setParseError('');

            // Normalize line endings and clean up text
            const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

            // Extract email
            const emailMatch = cleanText.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
            const email = emailMatch ? emailMatch[0] : '';

            // Extract phone
            const phoneMatch = cleanText.match(/(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
            const phone = phoneMatch ? phoneMatch[0] : '';

            // Extract name (first non-empty line that looks like a name)
            const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);
            let name = '';
            for (const line of lines.slice(0, 5)) {
                if (line.match(/^[A-Z][a-z]+(\s+[A-Z][a-z]+)+$/) && !line.match(/Summary|Experience|Skills|Education/i)) {
                    name = line;
                    break;
                }
            }

            // Define section patterns (case-insensitive)
            const sectionPatterns = {
                summary: /\n(?:Professional\s+)?Summary\s*\n/i,
                skills: /\n(?:Core\s+|Technical\s+)?Skills\s*\n/i,
                experience: /\n(?:Professional\s+)?(?:Experience|Work History|Employment)\s*\n/i,
                education: /\nEducation\s*\n/i,
            };

            // Find section positions
            const findSection = (pattern: RegExp) => {
                const match = cleanText.match(pattern);
                return match ? cleanText.indexOf(match[0]) : -1;
            };

            const summaryStart = findSection(sectionPatterns.summary);
            const skillsStart = findSection(sectionPatterns.skills);
            const expStart = findSection(sectionPatterns.experience);
            const eduStart = findSection(sectionPatterns.education);

            // Extract sections by position
            const extractSection = (start: number, ...nextStarts: number[]) => {
                if (start === -1) return '';
                const validNexts = nextStarts.filter(n => n > start);
                const end = validNexts.length > 0 ? Math.min(...validNexts) : cleanText.length;
                return cleanText.substring(start, end);
            };

            // Helper to clean section headers - more robust
            const removeHeader = (text: string, headerPattern: RegExp) => {
                // Try exact regex match first (safest)
                const match = text.match(headerPattern);
                if (match) {
                    // Check if match is at the very beginning
                    if (text.indexOf(match[0]) === 0) {
                        return text.substring(match[0].length).trim();
                    }
                }
                // Fallback: Remove first line if it looks like a header
                const textLines = text.trim().split('\n');
                const firstLine = textLines[0];
                if (firstLine && firstLine.length < 50 && (firstLine.match(/Summary|Experience|Work|Employment|Skills|Education/i))) {
                    return textLines.slice(1).join('\n').trim();
                }
                return text;
            };

            // Get section text with clean headers
            const summaryRaw = extractSection(summaryStart, skillsStart, expStart, eduStart);
            const summary = removeHeader(summaryRaw, sectionPatterns.summary);

            const expRaw = extractSection(expStart, eduStart, skillsStart, summaryStart);
            const expText = removeHeader(expRaw, sectionPatterns.experience);

            const eduRaw = extractSection(eduStart, expStart, skillsStart, summaryStart);
            const eduText = removeHeader(eduRaw, sectionPatterns.education);

            const skillsRaw = extractSection(skillsStart, summaryStart, expStart, eduStart);
            const skillsText = removeHeader(skillsRaw, sectionPatterns.skills);

            // Parse experience entries - Date-Anchored Approach (Robust to spacing)
            const experience: any[] = [];

            // Helper to parse a single line for date range
            const parseDateRange = (line: string) => {
                const match = line.match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(?:19|20)\d{2}|(?:19|20)\d{2})\s*[-–—to]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(?:19|20)\d{2}|(?:19|20)\d{2}|Present|Current)/i);
                return match ? { start: match[1], end: match[2], raw: match[0] } : null;
            };

            const expLines = expText.split('\n').map(l => l.trim()).filter(Boolean);

            // Find all lines that contain a date range - these are our "Anchors"
            const dateIndices = expLines.map((line, idx) => parseDateRange(line) ? idx : -1).filter(idx => idx !== -1);

            if (dateIndices.length > 0) {
                // Sort indices just in case
                dateIndices.sort((a, b) => a - b);

                for (let i = 0; i < dateIndices.length; i++) {
                    const dateLineIdx = dateIndices[i];
                    const nextDateLineIdx = i < dateIndices.length - 1 ? dateIndices[i + 1] : expLines.length;

                    // Metadata for this entry
                    const dateRange = parseDateRange(expLines[dateLineIdx]);
                    let startDate = dateRange?.start || '';
                    let endDate = dateRange?.end || 'Present';

                    let title = '';
                    let company = '';
                    let location = '';

                    // Look back 1-2 lines for Title and Company
                    let headerStartIdx = dateLineIdx;

                    // Helper to identify header candidate (short, non-bullet)
                    const isHeaderLine = (l: string) => l.length < 80 && !l.match(/^[\s•\-*]+/);

                    const prevLine1 = dateLineIdx > 0 ? expLines[dateLineIdx - 1] : null;
                    const prevLine2 = dateLineIdx > 1 ? expLines[dateLineIdx - 2] : null;

                    if (prevLine1 && isHeaderLine(prevLine1)) {
                        headerStartIdx = dateLineIdx - 1;
                        if (prevLine2 && isHeaderLine(prevLine2)) {
                            headerStartIdx = dateLineIdx - 2;
                        }
                    }

                    // Assign Title/Company based on Position of Date
                    if (headerStartIdx === dateLineIdx - 2) {
                        // Case: Title \n Company \n Date
                        title = expLines[dateLineIdx - 2];
                        company = expLines[dateLineIdx - 1];
                    } else if (headerStartIdx === dateLineIdx - 1) {
                        // Case: Title \n Date (or Company \n Date)
                        const line1 = expLines[dateLineIdx - 1];
                        // Heuristic: If line matches known Big Companies or has Inc/LLC, it is company. Else Title.
                        if (line1.match(/Inc|Ltd|LLC|Corp/i)) {
                            company = line1;
                            title = 'Unknown Title';
                        } else {
                            title = line1;
                            // Check if Date line has Company?
                            const inlineParts = expLines[dateLineIdx].replace(parseDateRange(expLines[dateLineIdx])?.raw || '', '').trim();
                            if (inlineParts.length > 3) company = inlineParts;
                            else company = 'Unknown Company';
                        }
                    } else {
                        // Case: Inline (Title | Date or Date - Company)
                        const textLine = expLines[dateLineIdx];
                        const textBefore = textLine.substring(0, textLine.indexOf(startDate)).trim();
                        if (textBefore.length > 2) {
                            if (textBefore.includes('|') || textBefore.includes(' - ') || textBefore.includes(' – ')) {
                                const parts = textBefore.split(/[|\-–—]/);
                                title = parts[0].trim();
                                company = parts[1]?.trim() || '';
                            } else {
                                title = textBefore;
                                company = 'Unknown Company';
                            }
                        } else {
                            // Maybe Date came first?
                            const textAfter = textLine.substring(textLine.indexOf(endDate) + endDate.length).trim();
                            if (textAfter.length > 2) {
                                title = textAfter;
                                company = 'Unknown Company'; // Or split title/company
                            }
                        }
                    }

                    if (!title) title = 'Unknown Title';
                    if (!company) company = 'Unknown Company';

                    // Determine End of Description (Start of Next Header)
                    let descEndIdx = nextDateLineIdx;
                    if (i < dateIndices.length - 1) {
                        // Go backward from nextDate to find its header
                        const nextPrev1 = nextDateLineIdx > 0 ? expLines[nextDateLineIdx - 1] : null;
                        const nextPrev2 = nextDateLineIdx > 1 ? expLines[nextDateLineIdx - 2] : null;
                        if (nextPrev1 && isHeaderLine(nextPrev1)) {
                            descEndIdx = nextDateLineIdx - 1;
                            if (nextPrev2 && isHeaderLine(nextPrev2)) {
                                descEndIdx = nextDateLineIdx - 2;
                            }
                        }
                    }

                    const bullets = [];
                    for (let k = dateLineIdx + 1; k < descEndIdx; k++) {
                        const line = expLines[k];
                        if (line.match(/^[\s•\-*]+/)) {
                            bullets.push(line.replace(/^[\s•\-*]+/, '').trim());
                        } else if (line.length > 3) {
                            bullets.push(line);
                        }
                    }

                    // Logic to split Company/Location
                    if (company && (company.includes(' - ') || company.includes(' – '))) {
                        const parts = company.split(/[–-]/);
                        company = parts[0].trim();
                        location = parts[1].trim();
                    }

                    experience.push({
                        company,
                        title,
                        location,
                        startDate,
                        endDate,
                        description: '',
                        highlights: bullets
                    });
                }
            } else {
                // Fallback: Block splitting (same as before but simplifed)
                const blocks = expText.split(/\n\s*\n+/).filter(b => b.trim().length > 10);
                for (const block of blocks) {
                    const lines = block.split('\n').filter(l => l.trim());
                    if (lines.length > 0) {
                        experience.push({
                            company: 'Unknown Company',
                            title: lines[0],
                            startDate: '',
                            endDate: '',
                            highlights: lines.slice(1)
                        });
                    }
                }
            }

            // Parse education - Date-Anchored Approach
            const education: any[] = [];
            if (eduText) {
                const eduLines = eduText.split('\n').map(l => l.trim()).filter(Boolean);
                const eduIndices = eduLines.map((line, idx) => line.match(/\b(?:19|20)\d{2}\b/) ? idx : -1).filter(idx => idx !== -1);

                if (eduIndices.length > 0) {
                    for (let i = 0; i < eduIndices.length; i++) {
                        const idx = eduIndices[i];
                        const yearMatches = eduLines[idx].match(/\b(?:19|20)\d{2}\b/g);
                        const graduationDate = yearMatches ? yearMatches[yearMatches.length - 1] : '';

                        // Look around date line
                        const contextLines = [
                            eduLines[idx - 1] || '',
                            eduLines[idx] || '',
                        ].filter(Boolean);

                        let institution = '';
                        let degree = '';

                        for (const line of contextLines) {
                            if (!institution && line.match(/(?:University|College|Institute|School|Academy)/i)) {
                                institution = line;
                            } else if (!degree && line.match(/(?:Bachelor|Master|PhD|B\.S|M\.S|MBA|Associate|Diploma)/i)) {
                                degree = line;
                            }
                        }

                        if (!institution) institution = contextLines.find(l => l !== degree && !l.match(/\d{4}/)) || 'Unknown Institution';
                        if (!degree) degree = contextLines.find(l => l !== institution && !l.match(/\d{4}/)) || 'Unknown Degree';

                        education.push({
                            institution,
                            degree,
                            field: '',
                            graduationDate
                        });
                    }
                } else {
                    // Fallback check for single line parsing
                    const blocks = eduText.split(/\n\s*\n+/);
                    for (const block of blocks) {
                        if (block.length > 10) education.push({ institution: block.split('\n')[0], degree: 'Unknown Degree', graduationDate: '' });
                    }
                }
            }

            const technicalSkills: Record<string, string[]> = {};
            const skillLines = skillsText.split('\n').filter(l => l.trim());
            for (const line of skillLines) {
                const kvMatch = line.match(/^\*{0,2}([^:*]+)\*{0,2}:\s*(.+)$/);
                if (kvMatch) {
                    const category = kvMatch[1].trim();
                    const skills = kvMatch[2].split(/[,;]/).map(s => s.trim()).filter(Boolean);
                    technicalSkills[category] = skills;
                } else {
                    const skills = line.split(/[,;]/).map(s => s.replace(/^[\s•\-*]+/, '').trim()).filter(s => s.length > 1);
                    if (skills.length > 0) {
                        const existingKey = Object.keys(technicalSkills).find(k => k === 'Other Skills');
                        if (existingKey) {
                            technicalSkills[existingKey].push(...skills);
                        } else {
                            technicalSkills['Other Skills'] = skills;
                        }
                    }
                }
            }

            const resumeData = {
                personalInfo: {
                    fullName: name,
                    email,
                    phone,
                    location: '',
                    linkedin: '',
                    portfolio: '',
                },
                professionalSummary: summary,
                technicalSkills,
                experience,
                education,
            };

            setPreviewData(resumeData);
            return resumeData;
        } catch (e) {
            console.error('Text parse error:', e);
            setParseError('Could not parse text. Try using the JSON format for best results.');
            setPreviewData(null);
            return null;
        }
    };

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

    // Handle input change with smart format detection
    const handleJsonChange = (value: string) => {
        setJsonInput(value);
        if (!value.trim()) {
            setPreviewData(null);
            setParseError('');
            setDetectedFormat(null);
            return;
        }

        const format = detectFormat(value);
        setDetectedFormat(format);

        if (format === 'json') {
            parseJSONResume(value);
        } else {
            parseTextResume(value);
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
            // The handleJsonChange will now detect the format and parse accordingly
            handleJsonChange(content);
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
                        Paste your resume in <strong>any format</strong> (JSON or plain text), preview it, and open in the editor.
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

                        {/* Input - Now accepts any format */}
                        <div className="glass rounded-2xl p-6 border border-white/50">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-semibold text-slate-700">
                                        Paste Your Resume
                                    </label>
                                    {detectedFormat && (
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${detectedFormat === 'json'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-green-100 text-green-700'
                                            }`}>
                                            {detectedFormat === 'json' ? '📦 JSON' : '📝 Text'}
                                        </span>
                                    )}
                                </div>
                                <label className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-600 transition-colors">
                                    <input
                                        type="file"
                                        accept=".json,.txt,.md"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    📁 Upload File
                                </label>
                            </div>
                            <textarea
                                value={jsonInput}
                                onChange={(e) => handleJsonChange(e.target.value)}
                                placeholder={`Paste your resume here (JSON or Plain Text)...

Examples:
• JSON: { "basics": { "name": "John Doe" }, ... }
• Plain Text:
  Name: John Doe
  Summary: Experienced engineer...
  Experience:
  Senior Engineer at Google | Jan 2020 - Present
  - Led team of 5 engineers
  Skills:
  Cloud: AWS, Azure, GCP`}
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

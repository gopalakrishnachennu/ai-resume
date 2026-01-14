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

            // Extract name
            const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);
            let name = '';
            for (const line of lines.slice(0, 5)) {
                if (line.match(/^[A-Z][a-z]+(\s+[A-Z][a-z]+)+$/) && !line.match(/Summary|Experience|Skills|Education/i)) {
                    name = line;
                    break;
                }
            }

            // Define section patterns
            const sectionPatterns = {
                summary: /\n(?:Professional\s+)?Summary\s*\n/i,
                skills: /\n(?:Core\s+|Technical\s+)?Skills\s*\n/i,
                experience: /\n(?:Professional\s+)?(?:Experience|Work History|Employment)\s*\n/i,
                education: /\nEducation\s*\n/i,
            };

            const findSection = (pattern: RegExp) => {
                const match = cleanText.match(pattern);
                return match ? cleanText.indexOf(match[0]) : -1;
            };

            const summaryStart = findSection(sectionPatterns.summary);
            const skillsStart = findSection(sectionPatterns.skills);
            const expStart = findSection(sectionPatterns.experience);
            const eduStart = findSection(sectionPatterns.education);

            const extractSection = (start: number, ...nextStarts: number[]) => {
                if (start === -1) return '';
                const validNexts = nextStarts.filter(n => n > start);
                const end = validNexts.length > 0 ? Math.min(...validNexts) : cleanText.length;
                return cleanText.substring(start, end);
            };

            const removeHeader = (text: string, headerPattern: RegExp) => {
                const match = text.match(headerPattern);
                if (match) {
                    if (text.indexOf(match[0]) === 0) {
                        return text.substring(match[0].length).trim();
                    }
                }
                const textLines = text.trim().split('\n');
                const firstLine = textLines[0];
                if (firstLine && firstLine.length < 50 && (firstLine.match(/Summary|Experience|Work|Employment|Skills|Education/i))) {
                    return textLines.slice(1).join('\n').trim();
                }
                return text;
            };

            const summaryRaw = extractSection(summaryStart, skillsStart, expStart, eduStart);
            const summary = removeHeader(summaryRaw, sectionPatterns.summary);

            const expRaw = extractSection(expStart, eduStart, skillsStart, summaryStart);
            const expText = removeHeader(expRaw, sectionPatterns.experience);

            const eduRaw = extractSection(eduStart, expStart, skillsStart, summaryStart);
            const eduText = removeHeader(eduRaw, sectionPatterns.education);

            const skillsRaw = extractSection(skillsStart, summaryStart, expStart, eduStart);
            const skillsText = removeHeader(skillsRaw, sectionPatterns.skills);

            // Normalization helper (MM/YYYY -> YYYY-MM)
            const normalizeDate = (dateStr: string) => {
                if (!dateStr || dateStr.toLowerCase().includes('present')) return 'Present';

                // FORCE NOON to avoid Timezone Rollback (e.g., "2025" -> "2024-12-31")
                // If strictly "YYYY", map to "YYYY-01" to avoid confusion
                if (dateStr.match(/^\d{4}$/)) return `${dateStr}-01`;

                const date = new Date(dateStr + (dateStr.includes(':') ? '' : ' 12:00:00'));
                if (!isNaN(date.getTime())) {
                    const year = date.getFullYear();
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    return `${year}-${month}`;
                }
                // Fallback for year only regex
                const yearMatch = dateStr.match(/\d{4}/);
                if (yearMatch) return `${yearMatch[0]}-01`;
                return dateStr;
            };

            // Helper to parse a single line for date range
            const parseDateRange = (line: string) => {
                const match = line.match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(?:19|20)\d{2}|(?:19|20)\d{2})\s*[-–—to]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(?:19|20)\d{2}|(?:19|20)\d{2}|Present|Current)/i);
                return match ? { start: match[1], end: match[2], raw: match[0] } : null;
            };

            // Parse Experience (Date-Anchored)
            const experience: any[] = [];
            const expLines = expText.split('\n').map(l => l.trim()).filter(Boolean);
            const dateIndices = expLines.map((line, idx) => parseDateRange(line) ? idx : -1).filter(idx => idx !== -1);

            if (dateIndices.length > 0) {
                dateIndices.sort((a, b) => a - b);

                for (let i = 0; i < dateIndices.length; i++) {
                    const dateLineIdx = dateIndices[i];
                    const nextDateLineIdx = i < dateIndices.length - 1 ? dateIndices[i + 1] : expLines.length;

                    const dateRange = parseDateRange(expLines[dateLineIdx]);
                    let startDate = normalizeDate(dateRange?.start || '');
                    let endDate = normalizeDate(dateRange?.end || 'Present');

                    let title = '';
                    let company = '';
                    let location = '';

                    let headerStartIdx = dateLineIdx;
                    const isHeaderLine = (l: string) => l.length < 80 && !l.match(/^[\s•\-*]+/);

                    const prevLine1 = dateLineIdx > 0 ? expLines[dateLineIdx - 1] : null;
                    const prevLine2 = dateLineIdx > 1 ? expLines[dateLineIdx - 2] : null;

                    if (prevLine1 && isHeaderLine(prevLine1)) {
                        headerStartIdx = dateLineIdx - 1;
                        if (prevLine2 && isHeaderLine(prevLine2)) {
                            headerStartIdx = dateLineIdx - 2;
                        }
                    }

                    if (headerStartIdx === dateLineIdx - 2) {
                        title = expLines[dateLineIdx - 2];
                        company = expLines[dateLineIdx - 1];
                    } else if (headerStartIdx === dateLineIdx - 1) {
                        const line1 = expLines[dateLineIdx - 1];
                        if (line1.match(/Inc|Ltd|LLC|Corp/i)) {
                            company = line1;
                            title = 'Unknown Title';
                        } else {
                            title = line1;
                            const inlineParts = expLines[dateLineIdx].replace(parseDateRange(expLines[dateLineIdx])?.raw || '', '').trim();
                            if (inlineParts.length > 3) company = inlineParts;
                            else company = 'Unknown Company';
                        }
                    } else {
                        const textLine = expLines[dateLineIdx];
                        const textBefore = textLine.substring(0, textLine.indexOf(dateRange?.start || '')).trim();
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
                            const textAfter = textLine.substring(textLine.indexOf(dateRange?.end || '') + (dateRange?.end?.length || 0)).trim();
                            if (textAfter.length > 2) {
                                title = textAfter;
                                company = 'Unknown Company';
                            }
                        }
                    }

                    if (!title) title = 'Unknown Title';
                    if (!company) company = 'Unknown Company';

                    let descEndIdx = nextDateLineIdx;
                    if (i < dateIndices.length - 1) {
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

            // Parse Education (Enhanced with Date-Anchor)
            const education: any[] = [];
            if (eduText) {
                const eduLines = eduText.split('\n').map(l => l.trim()).filter(Boolean);

                // Helper to find SINGLE date strings (not just ranges)
                const parseEduDate = (l: string) => {
                    // Try range first
                    const dr = parseDateRange(l);
                    if (dr && dr.end) return { date: dr.end, raw: dr.raw };
                    if (dr && dr.start) return { date: dr.start, raw: dr.raw };

                    // Try single Month Year (e.g. "May 2025")
                    const singleDateMatch = l.match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(?:19|20)\d{2}/i);
                    if (singleDateMatch) return { date: singleDateMatch[0], raw: singleDateMatch[0] };

                    // Fallback to just Year
                    const yearMatch = l.match(/\b(?:19|20)\d{2}\b/);
                    if (yearMatch) return { date: yearMatch[0], raw: yearMatch[0] };

                    return null;
                };

                const eduIndices = eduLines.map((line, idx) => parseEduDate(line) ? idx : -1).filter(idx => idx !== -1);

                if (eduIndices.length > 0) {
                    for (let i = 0; i < eduIndices.length; i++) {
                        const idx = eduIndices[i];
                        const dateInfo = parseEduDate(eduLines[idx]);
                        const graduationDate = normalizeDate(dateInfo?.date || '');

                        // Context: Look at current line (minus date) and previous line
                        const currentLineClean = eduLines[idx].replace(dateInfo?.raw || '', '').replace(/[–-]/g, '').trim();
                        const prevLine = idx > 0 ? eduLines[idx - 1] : '';

                        let institution = '';
                        let degree = '';

                        // Check strictly
                        const isDegree = (s: string) => s.match(/(?:Bachelor|Master|PhD|B\.S|M\.S|MBA|Associate|Diploma|Certificate|Science in)/i);
                        const isInst = (s: string) => s.match(/(?:University|College|Institute|School|Academy)/i);

                        if (isDegree(currentLineClean)) degree = currentLineClean;
                        else if (isInst(currentLineClean)) institution = currentLineClean;

                        if (!degree && isDegree(prevLine)) degree = prevLine;
                        if (!institution && isInst(prevLine)) institution = prevLine;

                        // Fallbacks
                        if (!institution && !degree) {
                            if (currentLineClean.length > 5) institution = currentLineClean;
                            if (prevLine.length > 5 && institution !== prevLine) degree = prevLine;
                        }

                        // Final swap if Degree looks like Institution
                        if (degree && isInst(degree) && !institution) {
                            const temp = degree;
                            degree = institution || 'Unknown Degree';
                            institution = temp;
                        }

                        education.push({
                            institution: institution || 'Unknown Institution',
                            degree: degree || 'Unknown Degree',
                            field: '',
                            graduationDate
                        });
                    }
                } else {
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

    // Sample JSON Resume
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

    // Sample Plain Text Resume
    const sampleText = `John Doe

San Francisco, CA
📧 john.doe@example.com | 📞 (555) 123-4567

Professional Summary

Experienced software engineer with 5+ years building scalable web applications. Expertise in React, Node.js, and cloud infrastructure. Passionate about clean code and agile delivery.

Core Skills

Programming: JavaScript, TypeScript, Python, Go
Frameworks: React, Node.js, Django, Express
Cloud: AWS, Azure, Docker, Kubernetes
Tools: Git, CI/CD, Terraform

Professional Experience

Senior Developer
Tech Corp – San Francisco, CA
Jan 2020 – Present

Led development of microservices architecture serving 1M+ users.
Reduced API response time by 40% through optimization.
Mentored junior developers and conducted code reviews.

Software Engineer
StartupXYZ – Remote
June 2017 – Dec 2019

Built React-based dashboard for real-time analytics.
Implemented CI/CD pipelines using GitHub Actions.
Collaborated with design team to improve UX.

Education

Bachelor of Science in Computer Science
University of Technology – May 2017`;

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
                                placeholder={`Paste your resume here (JSON or Plain Text)...`}
                                className="w-full h-80 px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono text-sm resize-none transition-all"
                            />
                            {parseError && (
                                <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                    <span>⚠️</span> {parseError}
                                </p>
                            )}
                        </div>

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

                        <details className="glass rounded-2xl p-6 border border-white/50">
                            <summary className="cursor-pointer text-sm font-semibold text-slate-700 hover:text-green-600 transition-colors">
                                📝 View Sample Text Format
                            </summary>
                            <pre className="mt-4 p-4 bg-slate-800 text-green-100 rounded-xl text-xs overflow-auto max-h-60 whitespace-pre-wrap">
                                {sampleText}
                            </pre>
                            <button
                                onClick={() => handleJsonChange(sampleText)}
                                className="mt-3 text-sm text-green-600 hover:text-green-700 font-medium"
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
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                                        <h4 className="font-bold text-slate-900 text-lg">
                                            {previewData.personalInfo.fullName || 'No name provided'}
                                        </h4>
                                        <div className="text-slate-600 space-y-1 mt-2">
                                            {previewData.personalInfo.email && (
                                                <p>📧 {previewData.personalInfo.email}</p>
                                            )}
                                        </div>
                                    </div>

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
                                                    <p className="text-slate-500 text-xs">{edu.institution} • {edu.graduationDate}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

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

                                    {/* Parsing Scorecard */}
                                    {detectedFormat === 'text' && (
                                        <div className="mt-4 pt-4 border-t border-slate-200">
                                            <h5 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                                📊 Parsing Quality
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${(() => {
                                                        const checks = [
                                                            !!previewData.personalInfo?.fullName,
                                                            !!previewData.personalInfo?.email,
                                                            !!previewData.personalInfo?.phone,
                                                            !!previewData.professionalSummary,
                                                            Object.keys(previewData.technicalSkills || {}).length > 0,
                                                            previewData.experience?.length > 0,
                                                            previewData.experience?.some((e: any) => e.startDate),
                                                            previewData.education?.length > 0,
                                                        ];
                                                        const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
                                                        if (score >= 80) return 'bg-green-100 text-green-700';
                                                        if (score >= 50) return 'bg-yellow-100 text-yellow-700';
                                                        return 'bg-red-100 text-red-700';
                                                    })()
                                                    }`}>
                                                    {(() => {
                                                        const checks = [
                                                            !!previewData.personalInfo?.fullName,
                                                            !!previewData.personalInfo?.email,
                                                            !!previewData.personalInfo?.phone,
                                                            !!previewData.professionalSummary,
                                                            Object.keys(previewData.technicalSkills || {}).length > 0,
                                                            previewData.experience?.length > 0,
                                                            previewData.experience?.some((e: any) => e.startDate),
                                                            previewData.education?.length > 0,
                                                        ];
                                                        return Math.round((checks.filter(Boolean).length / checks.length) * 100) + '%';
                                                    })()}
                                                </span>
                                            </h5>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className={`flex items-center gap-1 ${previewData.personalInfo?.fullName ? 'text-green-600' : 'text-amber-500'}`}>
                                                    {previewData.personalInfo?.fullName ? '✅' : '⚠️'} Name
                                                </div>
                                                <div className={`flex items-center gap-1 ${previewData.personalInfo?.email ? 'text-green-600' : 'text-amber-500'}`}>
                                                    {previewData.personalInfo?.email ? '✅' : '⚠️'} Email
                                                </div>
                                                <div className={`flex items-center gap-1 ${previewData.personalInfo?.phone ? 'text-green-600' : 'text-slate-400'}`}>
                                                    {previewData.personalInfo?.phone ? '✅' : '○'} Phone
                                                </div>
                                                <div className={`flex items-center gap-1 ${previewData.personalInfo?.linkedin ? 'text-green-600' : 'text-slate-400'}`}>
                                                    {previewData.personalInfo?.linkedin ? '✅' : '○'} LinkedIn
                                                </div>
                                                <div className={`flex items-center gap-1 ${previewData.professionalSummary ? 'text-green-600' : 'text-amber-500'}`}>
                                                    {previewData.professionalSummary ? '✅' : '⚠️'} Summary
                                                </div>
                                                <div className={`flex items-center gap-1 ${Object.keys(previewData.technicalSkills || {}).length > 0 ? 'text-green-600' : 'text-amber-500'}`}>
                                                    {Object.keys(previewData.technicalSkills || {}).length > 0 ? '✅' : '⚠️'} Skills
                                                </div>
                                                <div className={`flex items-center gap-1 ${previewData.experience?.length > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                    {previewData.experience?.length > 0 ? '✅' : '❌'} Experience ({previewData.experience?.length || 0})
                                                </div>
                                                <div className={`flex items-center gap-1 ${previewData.experience?.some((e: any) => e.startDate) ? 'text-green-600' : 'text-amber-500'}`}>
                                                    {previewData.experience?.some((e: any) => e.startDate) ? '✅' : '⚠️'} Dates Found
                                                </div>
                                                <div className={`flex items-center gap-1 ${previewData.education?.length > 0 ? 'text-green-600' : 'text-amber-500'}`}>
                                                    {previewData.education?.length > 0 ? '✅' : '⚠️'} Education ({previewData.education?.length || 0})
                                                </div>
                                                <div className={`flex items-center gap-1 ${previewData.education?.some((e: any) => e.graduationDate) ? 'text-green-600' : 'text-slate-400'}`}>
                                                    {previewData.education?.some((e: any) => e.graduationDate) ? '✅' : '○'} Grad Date
                                                </div>
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

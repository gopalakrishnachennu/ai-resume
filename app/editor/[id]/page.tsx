'use client';

import { CSSProperties, ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useGuestAuth } from '@/lib/hooks/useGuestAuth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import { formatMonthYear } from '@/lib/utils/dateFormat';
import SettingsPanel from '@/components/SettingsPanel';
import { ResumeSettings, DEFAULT_ATS_SETTINGS, FONT_STACKS } from '@/lib/types/resumeSettings';
import { parseFormattedText } from '@/lib/utils/textFormatter';
import { handleFormattedPaste } from '@/lib/utils/pasteHandler';
import RichTextEditor from '@/components/RichTextEditor';

interface Section {
    id: string;
    name: string;
    type: 'summary' | 'experience' | 'education' | 'skills' | 'custom';
    visible: boolean;
    order: number;
}

const PAGE_WIDTH_IN = 8.5;
const PAGE_HEIGHT_IN = 11;
const PX_PER_IN = 96;
const PREVIEW_SCALE = 0.72;

export default function EditorPage() {
    const params = useParams();
    const router = useRouter();

    const { user } = useAuthStore();
    const { isGuest, restrictions, checkLimit, incrementUsage } = useGuestAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [resumeData, setResumeData] = useState({
        personalInfo: {
            name: '',
            email: '',
            phone: '',
            location: '',
            linkedin: '',
            github: '',
        },
        summary: '',
        experience: [] as any[],
        education: [] as any[],
        skills: {
            technical: [] as string[],
        },
    });

    const [sections, setSections] = useState<Section[]>([
        { id: 'summary', name: 'Professional Summary', type: 'summary', visible: true, order: 0 },
        { id: 'skills', name: 'Skills', type: 'skills', visible: true, order: 1 },
        { id: 'experience', name: 'Experience', type: 'experience', visible: true, order: 2 },
        { id: 'education', name: 'Education', type: 'education', visible: true, order: 3 },
    ]);

    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary', 'experience', 'education', 'skills']));
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [editingSectionName, setEditingSectionName] = useState('');

    const [jobAnalysis, setJobAnalysis] = useState<any>(null);
    const [jobTitle, setJobTitle] = useState('');
    const [jobCompany, setJobCompany] = useState('');
    const [atsScore, setAtsScore] = useState(0);
    const [techSkillInput, setTechSkillInput] = useState('');

    // Settings state
    const [settings, setSettings] = useState<ResumeSettings>(DEFAULT_ATS_SETTINGS);
    const [showSettings, setShowSettings] = useState(false);
    const [paginatedPages, setPaginatedPages] = useState<ReactNode[][]>([]);

    const measurementRef = useRef<HTMLDivElement>(null);

    const sortedSections = useMemo(() => [...sections].sort((a, b) => a.order - b.order), [sections]);

    const pageContentStyle = useMemo(() => ({
        fontFamily: FONT_STACKS[settings.fontFamily],
        lineHeight: settings.lineSpacing,
        paddingTop: `${settings.margins.top}in`,
        paddingBottom: `${settings.margins.bottom}in`,
        paddingLeft: `${settings.margins.left}in`,
        paddingRight: `${settings.margins.right}in`,
        boxSizing: 'border-box' as const,
    }), [settings]);

    const pageBlocks = useMemo<ReactNode[]>(() => {
        const blocks: ReactNode[] = [];
        const gapTight = `${Math.max(2, settings.paragraphSpacing / 2)}pt`;
        const gapParagraph = `${settings.paragraphSpacing}pt`;
        const gapSection = `${settings.sectionSpacing}pt`;

        const addBlock = (key: string, content: ReactNode, style?: CSSProperties) => {
            blocks.push(
                <div key={key} style={{ marginBottom: gapTight, ...style }}>
                    {content}
                </div>
            );
        };

        // Header
        addBlock(
            'header-name',
            <div className={settings.alignment === 'center' ? 'text-center' : 'text-left'}>
                <h1
                    className="font-bold"
                    style={{ fontSize: `${settings.fontSize.name}pt`, color: settings.fontColor.name, marginBottom: '4pt' }}
                >
                    {resumeData.personalInfo.name || 'Your Name'}
                </h1>
            </div>,
            { marginBottom: gapParagraph }
        );

        addBlock(
            'header-contact',
            <p
                className={settings.alignment === 'center' ? 'text-center' : 'text-left'}
                style={{ fontSize: `${settings.fontSize.contact}pt`, color: settings.fontColor.contact }}
            >
                {[
                    resumeData.personalInfo.email,
                    resumeData.personalInfo.phone,
                    resumeData.personalInfo.location,
                    resumeData.personalInfo.linkedin && (
                        <a
                            key="linkedin"
                            href={resumeData.personalInfo.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: settings.fontColor.contact, textDecoration: 'none' }}
                        >
                            LinkedIn
                        </a>
                    ),
                    resumeData.personalInfo.github && (
                        <a
                            key="github"
                            href={resumeData.personalInfo.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: settings.fontColor.contact, textDecoration: 'none' }}
                        >
                            GitHub
                        </a>
                    )
                ].filter(Boolean).reduce((acc, item, idx) => {
                    if (idx === 0) return [item];
                    return [...acc, ` ${settings.contactSeparator} `, item];
                }, [] as any[])}
            </p>,
            { marginBottom: gapSection }
        );

        const renderSectionHeading = (section: Section) => (
            <h2
                className={settings.headerStyle === 'bold' ? 'font-bold' : ''}
                style={{
                    fontSize: `${settings.fontSize.headers}pt`,
                    color: settings.fontColor.headers,
                    marginBottom: gapParagraph,
                    paddingBottom: settings.sectionDivider ? '2pt' : '0',
                    borderBottom: settings.sectionDivider ? `${settings.dividerWeight}px solid ${settings.dividerColor}` : 'none',
                }}
            >
                {settings.headerCase === 'UPPERCASE' ? section.name.toUpperCase() : section.name}
            </h2>
        );

        sortedSections.forEach(section => {
            if (!section.visible) return;

            if (section.type === 'summary' && resumeData.summary) {
                addBlock(`heading-${section.id}`, renderSectionHeading(section), { marginBottom: gapTight, marginTop: gapTight });
                const paragraphs = resumeData.summary.split(/\n+/).filter(p => p.trim());
                paragraphs.forEach((p, idx) => {
                    addBlock(
                        `summary-${idx}`,
                        <p style={{ fontSize: `${settings.fontSize.body}pt`, color: settings.fontColor.body }}>
                            {parseFormattedText(p)}
                        </p>,
                        { marginBottom: idx === paragraphs.length - 1 ? gapSection : gapParagraph }
                    );
                });
            }

            if (section.type === 'experience' && resumeData.experience.length > 0) {
                addBlock(`heading-${section.id}`, renderSectionHeading(section), { marginBottom: gapTight, marginTop: gapTight });

                resumeData.experience.forEach((exp, expIdx) => {
                    addBlock(
                        `exp-title-${expIdx}`,
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold" style={{ fontSize: `${settings.fontSize.body}pt`, color: settings.fontColor.body }}>{exp.title}</h3>
                            <span className="whitespace-nowrap ml-3" style={{ fontSize: `${settings.fontSize.body}pt`, color: settings.fontColor.contact }}>
                                {formatMonthYear(exp.startDate)} - {exp.current ? 'Present' : formatMonthYear(exp.endDate)}
                            </span>
                        </div>,
                        { marginBottom: gapTight }
                    );

                    addBlock(
                        `exp-meta-${expIdx}`,
                        <div className="flex justify-between items-start">
                            <p className="italic" style={{ fontSize: `${settings.fontSize.body}pt`, color: settings.fontColor.contact }}>
                                {exp.company}
                            </p>
                            <p className="italic whitespace-nowrap ml-3" style={{ fontSize: `${settings.fontSize.body}pt`, color: settings.fontColor.contact }}>
                                {exp.location}
                            </p>
                        </div>,
                        { marginBottom: gapTight }
                    );

                    exp.bullets
                        .filter((b: string) => b.trim())
                        .forEach((bullet: string, bulletIdx: number) => {
                            addBlock(
                                `exp-bullet-${expIdx}-${bulletIdx}`,
                                <div style={{ display: 'flex', gap: '6pt' }}>
                                    <span style={{ fontSize: `${settings.fontSize.body}pt`, color: settings.fontColor.body }}>{settings.bulletStyle}</span>
                                    <span style={{ fontSize: `${settings.fontSize.body}pt`, color: settings.fontColor.body }}>
                                        {parseFormattedText(bullet)}
                                    </span>
                                </div>,
                                { marginBottom: gapTight }
                            );
                        });

                    addBlock(`exp-spacer-${expIdx}`, <div />, { marginBottom: gapSection });
                });
            }

            if (section.type === 'education' && resumeData.education.length > 0) {
                addBlock(`heading-${section.id}`, renderSectionHeading(section), { marginBottom: gapTight, marginTop: gapTight });
                resumeData.education.forEach((edu, eduIdx) => {
                    addBlock(
                        `edu-title-${eduIdx}`,
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold" style={{ fontSize: `${settings.fontSize.body}pt`, color: settings.fontColor.body }}>
                                {edu.degree} {edu.field}
                            </h3>
                            <span className="whitespace-nowrap ml-3" style={{ fontSize: `${settings.fontSize.body}pt`, color: settings.fontColor.contact }}>
                                {formatMonthYear(edu.graduationDate)}
                            </span>
                        </div>,
                        { marginBottom: gapTight }
                    );

                    addBlock(
                        `edu-meta-${eduIdx}`,
                        <div className="flex justify-between items-start">
                            <p className="italic" style={{ fontSize: `${settings.fontSize.body}pt`, color: settings.fontColor.contact }}>
                                {edu.school}
                            </p>
                            <p className="italic whitespace-nowrap ml-3" style={{ fontSize: `${settings.fontSize.body}pt`, color: settings.fontColor.contact }}>
                                {edu.location}
                            </p>
                        </div>,
                        { marginBottom: gapSection }
                    );
                });
            }

            if (section.type === 'skills' && resumeData.skills.technical.length > 0) {
                addBlock(`heading-${section.id}`, renderSectionHeading(section), { marginBottom: gapTight, marginTop: gapTight });
                resumeData.skills.technical.forEach((skillLine, idx) => {
                    addBlock(
                        `skill-${idx}`,
                        <p style={{ fontSize: `${settings.fontSize.body}pt`, color: settings.fontColor.body }}>
                            {parseFormattedText(skillLine)}
                        </p>,
                        { marginBottom: idx === resumeData.skills.technical.length - 1 ? gapSection : gapTight }
                    );
                });
            }
        });

        return blocks;
    }, [resumeData, settings, sortedSections]);

    // Convert markdown-style **bold** into pdfmake rich text segments
    const formatPdfText = (text: string) => {
        const segments: any[] = [];
        const regex = /\*\*(.+?)\*\*/g;
        let lastIndex = 0;
        let match;
        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                segments.push({ text: text.slice(lastIndex, match.index) });
            }
            segments.push({ text: match[1], bold: true });
            lastIndex = regex.lastIndex;
        }
        if (lastIndex < text.length) {
            segments.push({ text: text.slice(lastIndex) });
        }
        return segments.length ? segments : [{ text }];
    };

    const formatDocxRuns = (text: string, docx: any, runOptions: { font: string; size: number; color: string }) => {
        const { TextRun } = docx;
        const runs: any[] = [];
        const regex = /\*\*(.+?)\*\*/g;
        let lastIndex = 0;
        let match;
        const baseRun = (t: string, bold = false) => new TextRun({ text: t, bold, font: runOptions.font, size: runOptions.size, color: runOptions.color });

        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                runs.push(baseRun(text.slice(lastIndex, match.index)));
            }
            runs.push(baseRun(match[1], true));
            lastIndex = regex.lastIndex;
        }
        if (lastIndex < text.length) {
            runs.push(baseRun(text.slice(lastIndex)));
        }
        return runs.length ? runs : [baseRun(text)];
    };

    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            await useAuthStore.getState().initialize();
            setAuthLoading(false);
        };
        initAuth();
    }, []);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }
        loadData();
    }, [user, authLoading]);

    // ✅ AUTO-SAVE to localStorage
    useEffect(() => {
        if (resumeData && Object.keys(resumeData).length > 0 && !loading) {
            const draftKey = `draft_resume_${params.id}`;
            localStorage.setItem(draftKey, JSON.stringify({
                resumeData,
                sections,
                settings,
                updatedAt: Date.now()
            }));
        }
    }, [resumeData, sections, settings, params.id, loading]);

    const loadData = async () => {
        try {
            // ✅ Check for local draft first (survives refresh)
            const draftKey = `draft_resume_${params.id}`;
            const savedDraft = localStorage.getItem(draftKey);

            if (savedDraft) {
                try {
                    const draft = JSON.parse(savedDraft);
                    // Only use draft if it's recent (e.g., less than 24 hours)
                    if (Date.now() - draft.updatedAt < 24 * 60 * 60 * 1000) {
                        setResumeData(draft.resumeData);
                        if (draft.sections) setSections(draft.sections);
                        if (draft.settings) setSettings(draft.settings);

                        const analysisStr = localStorage.getItem('jobAnalysis');
                        if (analysisStr) setJobAnalysis(JSON.parse(analysisStr));

                        setLoading(false);
                        toast.success('Restored unsaved changes');
                        return;
                    }
                } catch (e) {
                    console.error('Error parsing draft:', e);
                }
            }

            const analysisStr = localStorage.getItem('jobAnalysis');
            if (analysisStr) {
                setJobAnalysis(JSON.parse(analysisStr));
            }

            // If editing existing resume, load it
            if (params.id !== 'new') {
                // Try loading from new 'resumes' collection first (AI-generated)
                let resumeDoc = await getDoc(doc(db, 'resumes', params.id as string));

                // If not found, try old 'appliedResumes' collection
                if (!resumeDoc.exists()) {
                    resumeDoc = await getDoc(doc(db, 'appliedResumes', params.id as string));
                }

                if (resumeDoc.exists()) {
                    const resumeData = resumeDoc.data();

                    // Load job title and company
                    setJobTitle(resumeData.jobTitle || '');
                    setJobCompany(resumeData.jobCompany || '');

                    // Check if this is AI-generated resume (new format)
                    if (resumeData.professionalSummary || resumeData.technicalSkills) {
                        // Load AI-generated content
                        setResumeData({
                            personalInfo: resumeData.personalInfo || {
                                name: user?.displayName || '',
                                email: user?.email || '',
                                phone: '',
                                location: '',
                                linkedin: '',
                                github: '',
                            },
                            summary: resumeData.professionalSummary || '',
                            experience: (resumeData.experience || []).map((exp: any) => ({
                                company: exp.company,
                                title: exp.title,
                                location: exp.location,
                                startDate: exp.startDate,
                                endDate: exp.endDate,
                                current: exp.current,
                                bullets: exp.responsibilities || exp.bullets || [],  // Map responsibilities to bullets
                            })),
                            education: resumeData.education || [],
                            skills: {
                                technical: resumeData.technicalSkills ?
                                    Object.entries(resumeData.technicalSkills)
                                        .map(([category, skills]) => `**${category}**: ${skills}`)
                                    : [],
                            },
                        });

                        setLoading(false);
                        toast.success('AI-generated resume loaded!');
                        return;
                    }

                    // Old format - load resume data
                    if (resumeData.resumeData) {
                        setResumeData(resumeData.resumeData);
                    }

                    // Load sections order
                    if (resumeData.sections) {
                        setSections(resumeData.sections);
                    }

                    // Load custom settings
                    if (resumeData.settings) {
                        setSettings(resumeData.settings);
                    }

                    setLoading(false);
                    return;
                }
            }

            // Otherwise, load from user profile (new resume)
            const userDoc = await getDoc(doc(db, 'users', user!.uid));

            if (userDoc.exists()) {
                const userData = userDoc.data();

                setResumeData({
                    personalInfo: {
                        name: user?.displayName || '',
                        email: user?.email || '',
                        phone: userData.profile?.phone || '',
                        location: userData.profile?.location || '',
                        linkedin: userData.profile?.linkedin || '',
                        github: userData.profile?.github || '',
                    },
                    summary: `Experienced professional with expertise in ${userData.baseSkills?.technical?.slice(0, 3).join(', ') || 'various technologies'}`,
                    experience: userData.baseExperience || [],
                    education: userData.baseEducation || [],
                    skills: {
                        technical: userData.baseSkills?.technical || [],
                    },
                });

                calculateATS();
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateATS = () => {
        let score = 0;
        if (resumeData.personalInfo.name) score += 5;
        if (resumeData.personalInfo.email) score += 5;
        if (resumeData.personalInfo.phone) score += 5;
        if (resumeData.summary) score += 10;
        if (resumeData.experience.length > 0) score += 10;
        if (resumeData.education.length > 0) score += 5;

        if (jobAnalysis) {
            const allKeywords = [
                ...jobAnalysis.keywords.technical,
                ...jobAnalysis.keywords.soft,
                ...jobAnalysis.keywords.tools,
            ].map((k: string) => k.toLowerCase());

            const resumeText = JSON.stringify(resumeData).toLowerCase();
            const matchedKeywords = allKeywords.filter((keyword: string) =>
                resumeText.includes(keyword.toLowerCase())
            );

            score += Math.min(60, (matchedKeywords.length / allKeywords.length) * 60);
        }

        setAtsScore(Math.round(score));
    };

    useEffect(() => {
        calculateATS();
    }, [resumeData]);

    const handleSave = async () => {
        if (!user) {
            toast.error('Please login to save');
            return;
        }

        if (!user) {
            toast.error('Please login to save');
            return;
        }

        if (isGuest) {
            if (!restrictions.canSaveResumes) {
                toast.error('Guest saving is disabled. Please upgrade.');
                return;
            }
            const limit = await checkLimit('resumeEdits');
            if (!limit.canUse) {
                toast.error(`Edit limit reached (${limit.current}/${limit.max})`);
                return;
            }
        }

        setSaving(true);

        try {
            const resumeId = params.id === 'new' ? `resume_${Date.now()}` : params.id;

            const atsScoreData = {
                total: atsScore,
                formatting: 95,
                content: 85,
                keywords: atsScore,
            };

            // Check if this is an AI-generated resume (from 'resumes' collection)
            const resumeDocRef = doc(db, 'resumes', resumeId as string);
            const resumeDoc = await getDoc(resumeDocRef);

            if (resumeDoc.exists()) {
                // Update existing AI-generated resume with ATS score and editable fields
                await setDoc(resumeDocRef, {
                    ...resumeDoc.data(),
                    jobTitle: jobTitle || jobAnalysis?.title || 'Untitled',
                    jobCompany: jobCompany || jobAnalysis?.company || '',
                    atsScore: atsScoreData,
                    updatedAt: serverTimestamp(),
                }, { merge: true });

                toast.success('Resume updated! 🎉');
            } else {
                // Save to appliedResumes (old format)
                await setDoc(doc(db, 'appliedResumes', resumeId as string), {
                    userId: user.uid,
                    jobTitle: jobAnalysis?.title || 'Untitled',
                    company: jobAnalysis?.company || '',
                    jobDescription: localStorage.getItem('jobDescription') || '',
                    resumeData,
                    sections,
                    settings,
                    atsScore: atsScoreData,
                    status: 'draft',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });

                toast.success('Resume saved! 🎉');
            }

            router.push('/dashboard');
        } catch (error) {
            console.error('Error saving:', error);
            toast.error('Failed to save resume');
        } finally {
            setSaving(false);
            if (isGuest) await incrementUsage('resumeEdits');
        }
    };

    const generatePDF = async () => {
        if (isGuest) {
            if (!restrictions.canDownloadPDF) {
                toast.error('Guest PDF download is disabled. Please upgrade.');
                return;
            }
            const limit = await checkLimit('pdfDownloads');
            if (!limit.canUse) {
                toast.error(`PDF download limit reached (${limit.current}/${limit.max})`);
                return;
            }
        }

        try {
            const pdfMakeModule = await import('pdfmake/build/pdfmake');
            const pdfMake = (pdfMakeModule as any).default || pdfMakeModule;
            const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
            const pdfFonts = (pdfFontsModule as any).default || pdfFontsModule;

            // Attach default Roboto font VFS (browser-safe)
            (pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || (pdfMake as any).vfs;

            const sortedSections = [...sections].sort((a, b) => a.order - b.order);
            const headerCase = (name: string) => settings.headerCase === 'UPPERCASE' ? name.toUpperCase() : name;
            const pt = (inches: number) => inches * 72;

            // pdfmake browser bundle only ships Roboto in its vfs. We alias all choices to Roboto so exports succeed.
            const getPdfFontFamily = () => 'Roboto';

            // Ensure fonts resolve (avoid missing Helvetica errors)
            const robotoFont = {
                normal: 'Roboto-Regular.ttf',
                bold: 'Roboto-Medium.ttf',
                italics: 'Roboto-Italic.ttf',
                bolditalics: 'Roboto-MediumItalic.ttf',
            };

            (pdfMake as any).fonts = {
                Roboto: robotoFont,
                Calibri: robotoFont,
                Arial: robotoFont,
                Helvetica: robotoFont,
                'Times New Roman': robotoFont,
                Georgia: robotoFont,
            };

            const content: any[] = [];

            const addSectionHeader = (sectionName: string) => {
                content.push({
                    text: headerCase(sectionName),
                    style: 'sectionHeader',
                    margin: [0, 12, 0, settings.sectionDivider ? 4 : 8],
                });

                if (settings.sectionDivider) {
                    content.push({
                        canvas: [
                            {
                                type: 'line',
                                x1: 0,
                                y1: 0,
                                x2: 515,
                                y2: 0,
                                lineWidth: settings.dividerWeight,
                                lineColor: settings.dividerColor,
                            },
                        ],
                        margin: [0, 0, 0, 8],
                    });
                }
            };

            content.push({
                text: resumeData.personalInfo.name || 'Your Name',
                style: 'name',
                alignment: 'center',
                margin: [0, 0, 0, 6],
            });

            const contactPieces = [
                resumeData.personalInfo.email,
                resumeData.personalInfo.phone,
                resumeData.personalInfo.location,
                resumeData.personalInfo.linkedin,
                resumeData.personalInfo.github,
            ].filter(Boolean);

            if (contactPieces.length) {
                content.push({
                    text: contactPieces.join(` ${settings.contactSeparator} `),
                    style: 'contact',
                    alignment: 'center',
                    margin: [0, 0, 0, 12],
                });
            }

            sortedSections.forEach(section => {
                if (!section.visible) return;

                if (section.type === 'summary' && resumeData.summary) {
                    addSectionHeader(section.name);
                    content.push({ text: formatPdfText(resumeData.summary), style: 'body', margin: [0, 0, 0, 8] });
                }

                if (section.type === 'experience' && resumeData.experience.length > 0) {
                    addSectionHeader(section.name);
                    resumeData.experience.forEach((exp: any) => {
                        content.push({
                            margin: [0, 0, 0, 10],
                            stack: [
                                {
                                    columns: [
                                        { text: exp.title, style: 'bodyBold', width: '*' },
                                        { text: `${formatMonthYear(exp.startDate)} - ${exp.current ? 'Present' : formatMonthYear(exp.endDate)}`, style: 'muted', alignment: 'right' },
                                    ],
                                },
                                {
                                    columns: [
                                        { text: exp.company, style: 'italic' },
                                        { text: exp.location, style: 'italic', alignment: 'right' },
                                    ],
                                    margin: [0, 2, 0, 4],
                                },
                                {
                                    ul: exp.bullets
                                        .filter((b: string) => b.trim())
                                        .map((b: string) => formatPdfText(b)),
                                    style: 'body',
                                    margin: [0, 0, 0, 0],
                                },
                            ],
                        });
                    });
                }

                if (section.type === 'education' && resumeData.education.length > 0) {
                    addSectionHeader(section.name);
                    resumeData.education.forEach((edu: any) => {
                        content.push({
                            margin: [0, 0, 0, 8],
                            stack: [
                                {
                                    columns: [
                                        { text: `${edu.degree} ${edu.field}`.trim(), style: 'bodyBold', width: '*' },
                                        { text: formatMonthYear(edu.graduationDate), style: 'muted', alignment: 'right' },
                                    ],
                                },
                                {
                                    columns: [
                                        { text: edu.school, style: 'italic' },
                                        { text: edu.location, style: 'italic', alignment: 'right' },
                                    ],
                                },
                            ],
                        });
                    });
                }

                if (section.type === 'skills' && resumeData.skills.technical.length > 0) {
                    addSectionHeader(section.name);
                    resumeData.skills.technical.forEach((skillLine, idx) => {
                        content.push({ text: formatPdfText(skillLine), style: 'body', margin: [0, 0, 0, idx === resumeData.skills.technical.length - 1 ? 8 : 4] });
                    });
                }
            });

            const docDefinition: any = {
                pageSize: 'LETTER',
                pageMargins: [pt(settings.margins.left), pt(settings.margins.top), pt(settings.margins.right), pt(settings.margins.bottom)],
                defaultStyle: {
                    font: getPdfFontFamily(),
                    fontSize: settings.fontSize.body,
                    lineHeight: settings.lineSpacing,
                    color: settings.fontColor.body,
                },
                styles: {
                    name: { fontSize: settings.fontSize.name, bold: true, color: settings.fontColor.name },
                    contact: { fontSize: settings.fontSize.contact, color: settings.fontColor.contact },
                    sectionHeader: {
                        fontSize: settings.fontSize.headers,
                        bold: settings.headerStyle === 'bold',
                        color: settings.fontColor.headers,
                        margin: [0, 8, 0, 4],
                    },
                    body: { fontSize: settings.fontSize.body, color: settings.fontColor.body },
                    bodyBold: { fontSize: settings.fontSize.body, color: settings.fontColor.body, bold: true },
                    italic: { fontSize: settings.fontSize.body, color: settings.fontColor.contact, italics: true },
                    muted: { fontSize: settings.fontSize.body, color: settings.fontColor.contact },
                },
                content,
            };

            const selectedFont = getPdfFontFamily();
            docDefinition.defaultStyle.font = selectedFont;

            pdfMake
                .createPdf(docDefinition)
                .download(`${resumeData.personalInfo.name || 'Resume'}_Resume.pdf`, async () => {
                    toast.success('PDF downloaded! 📄');
                    if (isGuest) await incrementUsage('pdfDownloads');
                });
        } catch (error) {
            console.error('PDF generation error:', error);
            toast.error('Failed to generate PDF');
        }
    };

    const generateDOCX = async () => {
        if (isGuest) {
            if (!restrictions.canDownloadDOCX) {
                toast.error('Guest DOCX download is disabled. Please upgrade.');
                return;
            }
            const limit = await checkLimit('docxDownloads');
            if (!limit.canUse) {
                toast.error(`DOCX download limit reached (${limit.current}/${limit.max})`);
                return;
            }
        }

        try {
            const docxModule = await import('docx');
            const fileSaverModule = await import('file-saver');
            const saveAs = (fileSaverModule as any).saveAs || (fileSaverModule as any).default;
            if (!saveAs) {
                throw new Error('saveAs not available');
            }

            const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docxModule as any;

            const px = (pt: number) => pt * 2; // docx uses half-points
            const letterWidth = 8.5 * 1440;
            const letterHeight = 11 * 1440;

            const heading = (text: string) => new Paragraph({
                children: [new TextRun({ text, bold: settings.headerStyle === 'bold', size: px(settings.fontSize.headers), color: settings.fontColor.headers, font: settings.fontFamily })],
                spacing: { before: 80, after: settings.sectionDivider ? 60 : 60 },
                border: settings.sectionDivider ? {
                    bottom: {
                        color: settings.dividerColor.replace('#', ''),
                        space: 1,
                        style: docxModule.BorderStyle.SINGLE,
                        size: settings.dividerWeight * 8,
                    },
                } : undefined,
            });

            const bodyParagraph = (text: string, opts: any = {}) => new Paragraph({
                children: formatDocxRuns(text, docxModule, { font: settings.fontFamily, size: px(settings.fontSize.body), color: settings.fontColor.body }),
                alignment: AlignmentType.LEFT,
                spacing: { after: opts.after ?? 60 },
            });

            const sectionChildren: any[] = [];

            // Name
            sectionChildren.push(new Paragraph({
                children: [
                    new TextRun({ text: resumeData.personalInfo.name || 'Your Name', bold: true, size: px(settings.fontSize.name), color: settings.fontColor.name, font: settings.fontFamily }),
                ],
                heading: HeadingLevel.TITLE,
                alignment: settings.alignment === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT,
                spacing: { after: 80 },
            }));

            // Contact
            const contactParts = [
                resumeData.personalInfo.email,
                resumeData.personalInfo.phone,
                resumeData.personalInfo.location,
                resumeData.personalInfo.linkedin,
                resumeData.personalInfo.github,
            ].filter(Boolean);
            if (contactParts.length) {
                sectionChildren.push(new Paragraph({
                    children: [new TextRun({ text: contactParts.join(` ${settings.contactSeparator} `), size: px(settings.fontSize.contact), color: settings.fontColor.contact, font: settings.fontFamily })],
                    alignment: settings.alignment === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT,
                    spacing: { after: 200 },
                }));
            }



            const sortedSectionsDoc = [...sections].sort((a, b) => a.order - b.order).filter(s => s.visible);

            sortedSectionsDoc.forEach(section => {
                if (section.type === 'summary' && resumeData.summary) {
                    sectionChildren.push(heading(section.name));
                    sectionChildren.push(bodyParagraph(resumeData.summary, { after: 80 }));
                }

                if (section.type === 'experience' && resumeData.experience.length > 0) {
                    sectionChildren.push(heading(section.name));
                    resumeData.experience.forEach((exp: any) => {
                        sectionChildren.push(new Paragraph({
                            children: [
                                new TextRun({ text: exp.title || '', bold: true, size: px(settings.fontSize.body), color: settings.fontColor.body, font: settings.fontFamily }),
                                new TextRun({ text: `  ${formatMonthYear(exp.startDate)} - ${exp.current ? 'Present' : formatMonthYear(exp.endDate)}`, color: settings.fontColor.contact, size: px(settings.fontSize.body), font: settings.fontFamily }),
                            ],
                            spacing: { after: 40 },
                        }));
                        sectionChildren.push(new Paragraph({
                            children: [
                                new TextRun({ text: exp.company || '', italics: true, size: px(settings.fontSize.body), color: settings.fontColor.contact, font: settings.fontFamily }),
                                new TextRun({ text: exp.location ? `  ${exp.location}` : '', italics: true, size: px(settings.fontSize.body), color: settings.fontColor.contact, font: settings.fontFamily }),
                            ],
                            spacing: { after: 60 },
                        }));
                        exp.bullets.filter((b: string) => b.trim()).forEach((b: string) => {
                            sectionChildren.push(new Paragraph({
                                children: [
                                    new TextRun({ text: `${settings.bulletStyle} `, size: px(settings.fontSize.body), color: settings.fontColor.body, font: settings.fontFamily }),
                                    ...formatDocxRuns(b, docxModule, { font: settings.fontFamily, size: px(settings.fontSize.body), color: settings.fontColor.body }),
                                ],
                                spacing: { after: 40 },
                            }));
                        });
                        sectionChildren.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
                    });
                }

                if (section.type === 'education' && resumeData.education.length > 0) {
                    sectionChildren.push(heading(section.name));

                    resumeData.education.forEach((edu: any) => {
                        sectionChildren.push(new Paragraph({
                            children: [
                                new TextRun({ text: `${edu.degree} ${edu.field}`.trim(), bold: true, size: px(settings.fontSize.body), color: settings.fontColor.body, font: settings.fontFamily }),
                                new TextRun({ text: edu.graduationDate ? `  ${formatMonthYear(edu.graduationDate)}` : '', color: settings.fontColor.contact, size: px(settings.fontSize.body), font: settings.fontFamily }),
                            ],
                            spacing: { after: 40 },
                        }));
                        sectionChildren.push(new Paragraph({
                            children: [
                                new TextRun({ text: edu.school || '', italics: true, size: px(settings.fontSize.body), color: settings.fontColor.contact, font: settings.fontFamily }),
                                new TextRun({ text: edu.location ? `  ${edu.location}` : '', italics: true, size: px(settings.fontSize.body), color: settings.fontColor.contact, font: settings.fontFamily }),
                            ],
                            spacing: { after: 120 },
                        }));
                    });
                }

                if (section.type === 'skills' && resumeData.skills.technical.length > 0) {
                    sectionChildren.push(heading(section.name));

                    resumeData.skills.technical.forEach((skillLine: string, idx: number) => {
                        sectionChildren.push(bodyParagraph(skillLine, { after: idx === resumeData.skills.technical.length - 1 ? 80 : 40 }));
                    });
                }
            });

            const doc = new Document({
                sections: [
                    {
                        properties: {
                            page: {
                                size: { width: letterWidth, height: letterHeight },
                                margin: {
                                    top: settings.margins.top * 1440,
                                    bottom: settings.margins.bottom * 1440,
                                    left: settings.margins.left * 1440,
                                    right: settings.margins.right * 1440,
                                },
                            },
                        },
                        children: sectionChildren,
                    },
                ],
                styles: {
                    default: {
                        document: {
                            run: {
                                font: settings.fontFamily,
                                size: px(settings.fontSize.body),
                            },
                        },
                    },
                },
            });

            const blob = await Packer.toBlob(doc);
            saveAs(blob, `${resumeData.personalInfo.name || 'Resume'}_Resume.docx`);
            toast.success('DOCX downloaded! 📄');
            if (isGuest) await incrementUsage('docxDownloads');
        } catch (error) {
            console.error('DOCX generation error:', error);
            toast.error('Failed to generate DOCX');
        }
    };

    const toggleSection = (id: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const moveSectionUp = (index: number) => {
        if (index === 0) return;
        const newSections = [...sections];
        [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
        newSections.forEach((s, i) => s.order = i);
        setSections(newSections);
    };

    const moveSectionDown = (index: number) => {
        if (index === sections.length - 1) return;
        const newSections = [...sections];
        [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
        newSections.forEach((s, i) => s.order = i);
        setSections(newSections);
    };

    const toggleSectionVisibility = (id: string) => {
        setSections(sections.map(s => s.id === id ? { ...s, visible: !s.visible } : s));
    };

    const startEditingSectionName = (section: Section) => {
        setEditingSectionId(section.id);
        setEditingSectionName(section.name);
    };

    const saveSectionName = () => {
        if (editingSectionId && editingSectionName.trim()) {
            setSections(sections.map(s =>
                s.id === editingSectionId ? { ...s, name: editingSectionName.trim() } : s
            ));
        }
        setEditingSectionId(null);
        setEditingSectionName('');
    };

    const addExperience = () => {
        setResumeData({
            ...resumeData,
            experience: [
                ...resumeData.experience,
                {
                    company: '',
                    title: '',
                    location: '',
                    startDate: '',
                    endDate: '',
                    current: false,
                    bullets: [''],
                },
            ],
        });
    };

    const removeExperience = (index: number) => {
        setResumeData({
            ...resumeData,
            experience: resumeData.experience.filter((_, i) => i !== index),
        });
    };

    const updateExperience = (index: number, field: string, value: any) => {
        const newExp = [...resumeData.experience];
        newExp[index] = { ...newExp[index], [field]: value };
        setResumeData({ ...resumeData, experience: newExp });
    };

    const addEducation = () => {
        setResumeData({
            ...resumeData,
            education: [
                ...resumeData.education,
                {
                    school: '',
                    degree: '',
                    field: '',
                    location: '',
                    graduationDate: '',
                },
            ],
        });
    };

    const removeEducation = (index: number) => {
        setResumeData({
            ...resumeData,
            education: resumeData.education.filter((_, i) => i !== index),
        });
    };

    const updateEducation = (index: number, field: string, value: any) => {
        const newEdu = [...resumeData.education];
        newEdu[index] = { ...newEdu[index], [field]: value };
        setResumeData({ ...resumeData, education: newEdu });
    };

    const addSkill = (value: string) => {
        if (!value.trim()) return;
        setResumeData({
            ...resumeData,
            skills: {
                ...resumeData.skills,
                technical: [...resumeData.skills.technical, value.trim()],
            },
        });
        setTechSkillInput('');
    };

    const removeSkill = (index: number) => {
        setResumeData({
            ...resumeData,
            skills: {
                ...resumeData.skills,
                technical: resumeData.skills.technical.filter((_, i) => i !== index),
            },
        });
    };

    // Custom Section functions
    const addCustomSection = () => {
        const sectionName = prompt('Enter section name (e.g., Projects, Certifications, Awards):');
        if (!sectionName || !sectionName.trim()) return;

        const newSection: Section = {
            id: `custom_${Date.now()}`,
            name: sectionName.trim(),
            type: 'custom',
            visible: true,
            order: sections.length,
        };

        setSections([...sections, newSection]);

        // Add to resume data
        setResumeData({
            ...resumeData,
            [newSection.id]: {
                items: [],
            },
        });

        toast.success(`Added "${sectionName}" section!`);
    };

    useLayoutEffect(() => {
        const paginate = () => {
            const container = measurementRef.current;
            if (!container) return;

            const styles = window.getComputedStyle(container);
            const paddingTop = parseFloat(styles.paddingTop || '0');
            const paddingBottom = parseFloat(styles.paddingBottom || '0');
            const containerHeight = container.clientHeight || (PAGE_HEIGHT_IN * PX_PER_IN);
            const availableHeight = Math.max(200, containerHeight - paddingTop - paddingBottom);
            const blockNodes = Array.from(container.children) as HTMLElement[];
            const newPages: ReactNode[][] = [];
            let currentPage: ReactNode[] = [];
            let usedHeight = 0;

            blockNodes.forEach((node, index) => {
                const styles = window.getComputedStyle(node);
                const marginBottom = parseFloat(styles.marginBottom || '0');
                const blockHeight = node.getBoundingClientRect().height + marginBottom;

                if (usedHeight + blockHeight > availableHeight && currentPage.length) {
                    newPages.push(currentPage);
                    currentPage = [];
                    usedHeight = 0;
                }

                currentPage.push(pageBlocks[index]);
                usedHeight += blockHeight;
            });

            if (currentPage.length) {
                newPages.push(currentPage);
            }

            setPaginatedPages(newPages);
        };

        const raf = requestAnimationFrame(paginate);
        return () => cancelAnimationFrame(raf);
    }, [pageBlocks, settings.margins.bottom, settings.margins.top]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading editor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Minimal Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-[1800px] mx-auto px-6 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                            <span>←</span> Dashboard
                        </button>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <div>
                            <input
                                type="text"
                                value={jobTitle || jobAnalysis?.title || 'Resume Editor'}
                                onChange={(e) => setJobTitle(e.target.value)}
                                onBlur={handleSave}
                                className="text-sm font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 -ml-1"
                                placeholder="Job Title"
                            />
                            <input
                                type="text"
                                value={jobCompany || jobAnalysis?.company || 'Untitled'}
                                onChange={(e) => setJobCompany(e.target.value)}
                                onBlur={handleSave}
                                className="text-xs text-gray-500 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 -ml-1 mt-0.5"
                                placeholder="Company"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className={`px-4 py-1.5 rounded-full font-semibold text-xs ${atsScore >= 80 ? 'bg-green-50 text-green-700 border border-green-200' :
                            atsScore >= 60 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            ATS {atsScore}%
                        </div>

                        <button
                            onClick={() => setShowSettings(true)}
                            className="px-4 py-1.5 bg-white text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-all border border-gray-300"
                        >
                            ⚙️ Settings
                        </button>

                        <button
                            onClick={generatePDF}
                            className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-all border border-gray-200"
                        >
                            📥 PDF
                        </button>

                        <button
                            onClick={generateDOCX}
                            className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-all border border-gray-200"
                        >
                            📄 DOCX
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-5 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-all disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : '💾 Save'}
                        </button>
                    </div>
                </div>
            </header>

            {/* Full-Width Content */}
            <main className="max-w-[1800px] mx-auto px-6 py-6">
                <div className="grid grid-cols-2 gap-6">
                    {/* Editor Panel */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                            <h2 className="text-sm font-semibold text-gray-700">✏️ Edit Resume</h2>
                        </div>

                        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                            {/* Personal Info */}
                            <div className="mb-5 p-5 bg-gray-50 rounded-lg border border-gray-200">
                                <h3 className="font-semibold text-gray-700 mb-4 text-sm">Personal Information</h3>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={resumeData.personalInfo.name}
                                        onChange={(e) => setResumeData({
                                            ...resumeData,
                                            personalInfo: { ...resumeData.personalInfo, name: e.target.value }
                                        })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all"
                                        placeholder="Full Name"
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="email"
                                            value={resumeData.personalInfo.email}
                                            onChange={(e) => setResumeData({
                                                ...resumeData,
                                                personalInfo: { ...resumeData.personalInfo, email: e.target.value }
                                            })}
                                            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all"
                                            placeholder="Email"
                                        />
                                        <input
                                            type="tel"
                                            value={resumeData.personalInfo.phone}
                                            onChange={(e) => setResumeData({
                                                ...resumeData,
                                                personalInfo: { ...resumeData.personalInfo, phone: e.target.value }
                                            })}
                                            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all"
                                            placeholder="Phone"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={resumeData.personalInfo.location}
                                        onChange={(e) => setResumeData({
                                            ...resumeData,
                                            personalInfo: { ...resumeData.personalInfo, location: e.target.value }
                                        })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all"
                                        placeholder="Location (City, State)"
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="url"
                                            value={resumeData.personalInfo.linkedin}
                                            onChange={(e) => setResumeData({
                                                ...resumeData,
                                                personalInfo: { ...resumeData.personalInfo, linkedin: e.target.value }
                                            })}
                                            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all"
                                            placeholder="LinkedIn URL"
                                        />
                                        <input
                                            type="url"
                                            value={resumeData.personalInfo.github}
                                            onChange={(e) => setResumeData({
                                                ...resumeData,
                                                personalInfo: { ...resumeData.personalInfo, github: e.target.value }
                                            })}
                                            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all"
                                            placeholder="GitHub URL (optional)"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Sections */}
                            {sortedSections.map((section, index) => (
                                <div key={section.id} className="mb-4 rounded-lg border border-gray-200 overflow-hidden bg-white">
                                    {/* Section Header */}
                                    <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
                                        <div className="flex items-center gap-3 flex-1">
                                            <button
                                                onClick={() => toggleSection(section.id)}
                                                className="text-gray-500 hover:text-gray-700 transition-colors text-sm"
                                            >
                                                {expandedSections.has(section.id) ? '▼' : '▶'}
                                            </button>

                                            {editingSectionId === section.id ? (
                                                <input
                                                    type="text"
                                                    value={editingSectionName}
                                                    onChange={(e) => setEditingSectionName(e.target.value)}
                                                    onBlur={saveSectionName}
                                                    onKeyPress={(e) => e.key === 'Enter' && saveSectionName()}
                                                    className="px-3 py-1 border border-gray-400 rounded-lg text-sm font-semibold flex-1"
                                                    autoFocus
                                                />
                                            ) : (
                                                <h3
                                                    onClick={() => startEditingSectionName(section)}
                                                    className="font-semibold text-gray-700 text-sm cursor-pointer hover:text-gray-900 transition-colors flex-1"
                                                >
                                                    {section.name}
                                                </h3>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => toggleSectionVisibility(section.id)}
                                                className="p-1.5 text-gray-500 hover:text-gray-700 transition-colors text-xs"
                                                title={section.visible ? 'Hide' : 'Show'}
                                            >
                                                {section.visible ? '👁️' : '👁️‍🗨️'}
                                            </button>
                                            <button
                                                onClick={() => moveSectionUp(index)}
                                                disabled={index === 0}
                                                className="p-1.5 text-gray-500 hover:text-gray-700 disabled:opacity-30 transition-colors text-xs"
                                            >
                                                ↑
                                            </button>
                                            <button
                                                onClick={() => moveSectionDown(index)}
                                                disabled={index === sections.length - 1}
                                                className="p-1.5 text-gray-500 hover:text-gray-700 disabled:opacity-30 transition-colors text-xs"
                                            >
                                                ↓
                                            </button>
                                        </div>
                                    </div>

                                    {/* Section Content */}
                                    {expandedSections.has(section.id) && section.visible && (
                                        <div className="p-5">
                                            {/* Summary */}
                                            {section.type === 'summary' && (
                                                <textarea
                                                    value={resumeData.summary}
                                                    onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                                                    onPaste={(e) => handleFormattedPaste(e, resumeData.summary, (newValue) => {
                                                        setResumeData({ ...resumeData, summary: newValue });
                                                    })}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all resize-none"
                                                    rows={3}
                                                    placeholder="Brief professional summary... (Paste bold text and it will auto-convert to **bold**)"
                                                />
                                            )}

                                            {/* Experience */}
                                            {section.type === 'experience' && (
                                                <div className="space-y-3">
                                                    <button
                                                        onClick={addExperience}
                                                        className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-all"
                                                    >
                                                        + Add Experience
                                                    </button>

                                                    {resumeData.experience.map((exp, idx) => (
                                                        <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-2.5 bg-gray-50">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-xs font-semibold text-gray-600">Position #{idx + 1}</span>
                                                                <button
                                                                    onClick={() => removeExperience(idx)}
                                                                    className="text-red-600 hover:text-red-700 text-xs font-medium"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>

                                                            <input
                                                                type="text"
                                                                value={exp.title}
                                                                onChange={(e) => updateExperience(idx, 'title', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400"
                                                                placeholder="Job Title"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={exp.company}
                                                                onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400"
                                                                placeholder="Company"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={exp.location}
                                                                onChange={(e) => updateExperience(idx, 'location', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400"
                                                                placeholder="Location (City, State)"
                                                            />
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <input
                                                                    type="month"
                                                                    value={exp.startDate}
                                                                    onChange={(e) => updateExperience(idx, 'startDate', e.target.value)}
                                                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400"
                                                                />
                                                                <input
                                                                    type="month"
                                                                    value={exp.endDate}
                                                                    onChange={(e) => updateExperience(idx, 'endDate', e.target.value)}
                                                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400"
                                                                    disabled={exp.current}
                                                                />
                                                            </div>
                                                            <label className="flex items-center gap-2 text-xs text-gray-700">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={exp.current}
                                                                    onChange={(e) => updateExperience(idx, 'current', e.target.checked)}
                                                                    className="rounded"
                                                                />
                                                                Currently working here
                                                            </label>
                                                            <textarea
                                                                value={exp.bullets?.join('\n') || ''}
                                                                onChange={(e) => updateExperience(idx, 'bullets', e.target.value.split('\n'))}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400 resize-none"
                                                                placeholder="Key achievements (one per line)"
                                                                rows={6}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Education */}
                                            {section.type === 'education' && (
                                                <div className="space-y-3">
                                                    <button
                                                        onClick={addEducation}
                                                        className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-all"
                                                    >
                                                        + Add Education
                                                    </button>

                                                    {resumeData.education.map((edu, idx) => (
                                                        <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-2.5 bg-gray-50">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-xs font-semibold text-gray-600">Degree #{idx + 1}</span>
                                                                <button
                                                                    onClick={() => removeEducation(idx)}
                                                                    className="text-red-600 hover:text-red-700 text-xs font-medium"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>

                                                            <input
                                                                type="text"
                                                                value={edu.school}
                                                                onChange={(e) => updateEducation(idx, 'school', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400"
                                                                placeholder="School Name"
                                                            />
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={edu.degree}
                                                                    onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                                                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400"
                                                                    placeholder="Degree (e.g., B.Sc.)"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={edu.field}
                                                                    onChange={(e) => updateEducation(idx, 'field', e.target.value)}
                                                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400"
                                                                    placeholder="Field"
                                                                />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={edu.location}
                                                                onChange={(e) => updateEducation(idx, 'location', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400"
                                                                placeholder="Location (City, State)"
                                                            />
                                                            <input
                                                                type="month"
                                                                value={edu.graduationDate}
                                                                onChange={(e) => updateEducation(idx, 'graduationDate', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}


                                            {/* Skills */}
                                            {section.type === 'skills' && (
                                                <div className="space-y-3">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Technical Skills - Paste from Word with formatting!
                                                    </label>
                                                    <RichTextEditor
                                                        value={resumeData.skills.technical.join('\n')}
                                                        onChange={(newValue) => {
                                                            const lines = newValue.split('\n').filter(line => line.trim());
                                                            setResumeData({
                                                                ...resumeData,
                                                                skills: {
                                                                    ...resumeData.skills,
                                                                    technical: lines,
                                                                },
                                                            });
                                                        }}
                                                        placeholder="Paste your skills from Word - formatting will be preserved!"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                        minHeight="200px"
                                                    />
                                                    <p className="text-xs text-gray-500">
                                                        ✨ Paste directly from Word - bold text and line breaks preserved!
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Add Custom Section Button */}
                            <button
                                onClick={addCustomSection}
                                className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <span className="text-lg">+</span> Add Custom Section
                            </button>
                        </div>
                    </div>

                    {/* Preview Panel - PDF-like View */}
                    <div className="bg-gray-100 rounded-lg sticky top-24" style={{ maxHeight: 'calc(100vh - 120px)' }}>
                        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                            <h2 className="text-sm font-semibold text-gray-700">👁️ Live Preview</h2>
                        </div>

                        {/* PDF Viewer Container */}
                        <div
                            className="bg-gray-100"
                            style={{
                                maxHeight: 'calc(100vh - 180px)',
                                overflow: 'auto',
                                padding: '16px 24px',
                            }}
                        >
                            <div className="w-full flex flex-col items-center" style={{ gap: '8px' }}>
                                {(paginatedPages.length ? paginatedPages : [pageBlocks]).map((page, pageIndex, arr) => (
                                    <div key={pageIndex} className="flex flex-col items-center w-full" style={{ gap: '4px' }}>
                                        <div
                                            className="relative bg-white shadow-2xl border border-gray-200 overflow-hidden"
                                            style={{
                                                width: `${PAGE_WIDTH_IN * PX_PER_IN * PREVIEW_SCALE}px`,
                                                height: `${PAGE_HEIGHT_IN * PX_PER_IN * PREVIEW_SCALE}px`,
                                                boxSizing: 'border-box',
                                            }}
                                        >
                                            <div
                                                className="absolute inset-0"
                                                style={{
                                                    width: `${PAGE_WIDTH_IN * PX_PER_IN}px`,
                                                    height: `${PAGE_HEIGHT_IN * PX_PER_IN}px`,
                                                    transform: `scale(${PREVIEW_SCALE})`,
                                                    transformOrigin: 'top left',
                                                }}
                                            >
                                                <div className="absolute right-3 top-3 text-[10px] text-gray-400">Page {pageIndex + 1}</div>
                                                <div style={pageContentStyle}>{page}</div>
                                            </div>
                                        </div>
                                        {pageIndex < arr.length - 1 && (
                                            <div className="flex items-center w-[92%]" style={{ gap: '6px', marginTop: '-2px', marginBottom: '2px' }}>
                                                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-red-600 whitespace-nowrap">Page break up</span>
                                                <div className="h-[1.5px] flex-1 bg-red-500/80" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Hidden measurement layer used to calculate pagination (kept out of view) */}
                            <div
                                ref={measurementRef}
                                className="pointer-events-none"
                                style={{
                                    position: 'absolute',
                                    left: '-9999px',
                                    top: 0,
                                    height: `${PAGE_HEIGHT_IN}in`,
                                    width: `${PAGE_WIDTH_IN}in`,
                                    ...pageContentStyle,
                                }}
                            >
                                {pageBlocks}
                            </div>
                        </div> {/* Close PDF viewer container (line 855) */}
                    </div> {/* Close preview panel (line 849) */}
                </div> {/* Close grid */}
            </main>

            {/* Settings Panel */}
            {showSettings && (
                <SettingsPanel
                    settings={settings}
                    onSettingsChange={setSettings}
                    onClose={() => setShowSettings(false)}
                />
            )}
        </div>
    );
}

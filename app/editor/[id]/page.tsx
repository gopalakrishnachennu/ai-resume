'use client';

import { CSSProperties, ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { calculateResumeScore } from '@/lib/scorers/atsScorer';
import { analyzeResume } from '@/app/actions/atsAnalysis';
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
import { TemplateService } from '@/lib/services/templateService';
import { TemplateSchema, BUILTIN_CLASSIC_TEMPLATE, BUILTIN_MODERN_TEMPLATE } from '@/lib/types/templateSchema';
import { TemplateRenderer } from '@/components/TemplateRenderer';
import { convertTemplateToPdfMake } from '@/lib/utils/templateToPdfMake';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import { SaveIndicator } from '@/components/SaveIndicator';

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

    const { user, loading: authLoading } = useAuthStore();
    const { isGuest, restrictions, checkLimit, incrementUsage } = useGuestAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const DEFAULT_RESUME_DATA = {
        personalInfo: {
            name: '',
            email: '',
            phone: '',
            location: '',
            linkedin: '',
            github: '',
        },
        summary: '',
        experience: [],
        education: [],
        skills: {
            technical: [],
        },
        technicalSkills: {}, // Ensure this exists
    };

    const [resumeData, setResumeData] = useState<{
        personalInfo: {
            name: string;
            email: string;
            phone: string;
            location: string;
            linkedin: string;
            github: string;
        };
        summary: string;
        experience: any[];
        education: any[];
        skills: {
            technical: string[];
        };
        technicalSkills?: Record<string, string[] | string>;
        [key: string]: any;
    }>(DEFAULT_RESUME_DATA);

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
    // UNIFIED TEMPLATE SYSTEM: Always have an active template (Classic, Modern, or Custom)
    const [activeTemplate, setActiveTemplate] = useState<TemplateSchema>(BUILTIN_CLASSIC_TEMPLATE);

    // Load active template when selection changes
    // UNIFIED PIPELINE: Always use a template (builtin Classic/Modern or Custom)
    useEffect(() => {
        const loadTemplate = async () => {
            let template: TemplateSchema;

            // If custom template is selected, load from Firestore
            if (settings.selectedTemplateId) {
                try {
                    const customTemplate = await TemplateService.getTemplateById(settings.selectedTemplateId);
                    if (customTemplate) {
                        template = customTemplate;
                    } else {
                        template = BUILTIN_CLASSIC_TEMPLATE;
                    }
                } catch (e) {
                    console.error('Failed to load custom template:', e);
                    template = BUILTIN_CLASSIC_TEMPLATE;
                }
            } else {
                // Use builtin templates
                template = settings.template === 'modern' ? BUILTIN_MODERN_TEMPLATE : BUILTIN_CLASSIC_TEMPLATE;
            }

            // Apply User Settings Overrides
            // This ensures manual tweaks in the Settings Panel are reflected in the Active Template
            setActiveTemplate({
                ...template,
                dateFormat: settings.dateFormat === 'Month YYYY' ? 'MMMM YYYY' : settings.dateFormat as any,
                typography: {
                    ...template.typography,
                    fontFamily: settings.fontFamily,
                    bodyAlignment: settings.bodyAlignment,
                    sizes: {
                        name: settings.fontSize.name,
                        sectionHeader: settings.fontSize.headers,
                        body: settings.fontSize.body,
                        itemTitle: settings.fontSize.body + 2,
                    },
                    colors: {
                        name: settings.fontColor.name,
                        headers: settings.fontColor.headers,
                        body: settings.fontColor.body,
                        accent: settings.fontColor.accent || template.typography.colors.accent,
                        links: template.typography.colors.links || settings.fontColor.accent,
                    },
                },
                page: {
                    ...template.page,
                    margins: settings.margins,
                    lineSpacing: settings.lineSpacing,
                },
                sectionHeaders: {
                    ...template.sectionHeaders,
                    divider: settings.sectionDivider,
                    style: (settings.headerStyle === 'bold' && settings.headerCase === 'UPPERCASE') ? 'bold-uppercase' :
                        (settings.headerStyle === 'bold') ? 'bold' :
                            (settings.headerCase === 'UPPERCASE') ? 'uppercase' :
                                template.sectionHeaders.style,
                },
                experience: {
                    ...template.experience,
                    bulletStyle: settings.bulletStyle as any,
                    spacing: {
                        beforeItem: settings.sectionSpacing,
                        afterItem: settings.paragraphSpacing,
                    },
                },
                education: {
                    ...template.education,
                    spacing: {
                        beforeItem: settings.sectionSpacing,
                        afterItem: settings.paragraphSpacing,
                    },
                },
                header: {
                    ...template.header,
                    // For custom templates, use the template's alignment. For builtin, allow settings override.
                    nameAlign: settings.selectedTemplateId ? template.header.nameAlign : settings.alignment as any,
                }
            });
        };
        loadTemplate();
    }, [settings]);

    const [paginatedPages, setPaginatedPages] = useState<ReactNode[][]>([]);

    // Custom section modal state
    const [showAddSectionModal, setShowAddSectionModal] = useState(false);
    const [newSectionName, setNewSectionName] = useState('');


    const measurementRef = useRef<HTMLDivElement>(null);

    // ===== AUTO-SAVE INTEGRATION =====
    // Create a combined data object to track for auto-save
    const autoSaveData = useMemo(() => ({
        resumeData,
        sections,
    }), [resumeData, sections]);

    // Wrap handleSave for auto-save (will be defined below, use ref)
    const handleSaveRef = useRef<(() => Promise<void>) | undefined>(undefined);
    // Silent save for auto-save (no redirect, no toast)
    const silentSaveRef = useRef<(() => Promise<void>) | undefined>(undefined);

    const {
        isSaving: autoSaveInProgress,
        lastSaved,
        hasUnsavedChanges,
        error: autoSaveError,
    } = useAutoSave(
        autoSaveData,
        async () => {
            // Use silent save (no redirect, no toast) for auto-save
            if (silentSaveRef.current) {
                await silentSaveRef.current();
            }
        },
        {
            delay: 2000,
            // Only enable auto-save after initial load is complete and user is logged in
            enabled: !!user && params.id !== 'new' && !loading,
        }
    );

    // Warn user before leaving with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

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
        // ✅ Use Template Renderer if custom template is selected & loaded
        if (activeTemplate) {
            // Map custom sections data
            const customSectionsData: Record<string, any> = {};
            sections.forEach(s => {
                if (s.type === 'custom') {
                    customSectionsData[s.id] = (resumeData as any)[s.id];
                }
            });

            // Call function directly (it returns ReactNode[])
            return TemplateRenderer({
                data: resumeData,
                template: activeTemplate,
                sections: sortedSections,
                customSections: customSectionsData
            });
        }

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

        // Header - Template-aware (Modern = left-aligned with accent color)
        const isModern = settings.template === 'modern';
        const headerAlignment = isModern ? 'left' : settings.alignment;
        const nameColor = isModern ? settings.fontColor.accent : settings.fontColor.name;

        addBlock(
            'header-name',
            <div className={headerAlignment === 'center' ? 'text-center' : 'text-left'}>
                <h1
                    className="font-bold"
                    style={{ fontSize: `${settings.fontSize.name}pt`, color: nameColor, marginBottom: '4pt' }}
                >
                    {resumeData.personalInfo.name || 'Your Name'}
                </h1>
            </div>,
            { marginBottom: gapParagraph }
        );

        addBlock(
            'header-contact',
            <p
                className={headerAlignment === 'center' ? 'text-center' : 'text-left'}
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

        // Section headings - use accent color for modern template
        const headingColor = isModern ? settings.fontColor.accent : settings.fontColor.headers;

        const renderSectionHeading = (section: Section) => (
            <h2
                className={settings.headerStyle === 'bold' ? 'font-bold' : ''}
                style={{
                    fontSize: `${settings.fontSize.headers}pt`,
                    color: headingColor,
                    marginBottom: gapParagraph,
                    paddingBottom: settings.sectionDivider ? '2pt' : '0',
                    borderBottom: settings.sectionDivider ? `${settings.dividerWeight}px solid ${isModern ? settings.fontColor.accent : settings.dividerColor}` : 'none',
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

            if (section.type === 'skills' && resumeData.skills?.technical?.length > 0) {
                addBlock(`heading-${section.id}`, renderSectionHeading(section), { marginBottom: gapTight, marginTop: gapTight });
                resumeData.skills.technical.forEach((skillLine, idx) => {
                    addBlock(
                        `skill-${idx}`,
                        <div style={{ display: 'flex', gap: '6pt' }}>
                            <span style={{ fontSize: `${settings.fontSize.body}pt`, color: settings.fontColor.body }}>{settings.bulletStyle}</span>
                            <span style={{ fontSize: `${settings.fontSize.body}pt`, color: settings.fontColor.body }}>
                                {parseFormattedText(skillLine)}
                            </span>
                        </div>,
                        { marginBottom: idx === resumeData.skills.technical.length - 1 ? gapSection : gapTight }
                    );
                });
            }

            if (section.type === 'custom') {
                const customData = (resumeData as any)[section.id];
                if (customData && customData.items && customData.items.length > 0) {
                    addBlock(`heading-${section.id}`, renderSectionHeading(section), { marginBottom: gapTight, marginTop: gapTight });

                    customData.items.forEach((item: any, idx: number) => {
                        if (item.title) {
                            addBlock(
                                `custom-title-${section.id}-${idx}`,
                                <h3 className="font-bold" style={{ fontSize: `${settings.fontSize.body}pt`, color: settings.fontColor.body }}>
                                    {item.title}
                                </h3>,
                                { marginBottom: item.description ? '2pt' : gapTight }
                            );
                        }
                        if (item.description) {
                            addBlock(
                                `custom-desc-${section.id}-${idx}`,
                                <p style={{ fontSize: `${settings.fontSize.body}pt`, color: settings.fontColor.body }}>
                                    {parseFormattedText(item.description)}
                                </p>,
                                { marginBottom: idx === customData.items.length - 1 ? gapSection : gapTight }
                            );
                        }
                    });
                }
            }
        });

        return blocks;
    }, [resumeData, settings, sortedSections, activeTemplate]);

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

    useEffect(() => {
        useAuthStore.getState().initialize();
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

    // ✅ AUTO-SAVE Settings to User Profile (Debounced)
    useEffect(() => {
        if (!user?.uid || loading || !settings) return;

        const timer = setTimeout(async () => {
            // Check if settings differ from defaults significantly or just save always?
            // "save once changed as per the userr" -> Implies strictly saving current preferences.

            try {
                // We only want to save global preferences if they are NOT specific to a single resume?
                // Actually, user wants "everytime they want to create a resume... configurations must beee save once changed"
                // This implies the LAST used settings become the new defaults.

                await setDoc(doc(db, 'users', user.uid), {
                    defaultSettings: settings
                }, { merge: true });

                // console.log('Saved user default settings'); 
            } catch (err) {
                console.error('Error saving user settings:', err);
            }
        }, 2000); // 2s debounce

        return () => clearTimeout(timer);
    }, [settings, user, loading]);



    const loadData = async () => {
        try {
            // --- FETCH USER PROFILE (Unified Name Fallback) ---
            let profileName = user?.displayName || '';
            let profileData: any = {};

            if (user?.uid) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        profileData = userData; // Store for new resume creation
                        if (userData.profile && userData.profile.firstName) {
                            profileName = `${userData.profile.firstName} ${userData.profile.lastName || ''}`.trim();
                        }
                    }
                } catch (err) {
                    console.error('Error fetching profile for name:', err);
                }
            }

            // ✅ Check for local draft first (survives refresh)
            const draftKey = `draft_resume_${params.id}`;
            const savedDraft = localStorage.getItem(draftKey);

            // Apply default settings from profile if available (and not a draft restoration)
            if (profileData.defaultSettings) {
                setSettings({ ...DEFAULT_ATS_SETTINGS, ...profileData.defaultSettings });
            }

            if (savedDraft) {
                try {
                    const draft = JSON.parse(savedDraft);
                    // Only use draft if it's recent (e.g., less than 24 hours)
                    if (Date.now() - draft.updatedAt < 24 * 60 * 60 * 1000) {
                        // Apply name fallback to draft if empty
                        const draftData = draft.resumeData;
                        if (draftData && (!draftData.personalInfo?.name || draftData.personalInfo?.name?.trim() === '')) {
                            if (!draftData.personalInfo) draftData.personalInfo = { name: '', email: '', phone: '', location: '', linkedin: '', github: '' };
                            draftData.personalInfo.name = profileName;
                        }

                        // DEEP CLEAN THE LOCAL DRAFT (same as Firestore loading)
                        setResumeData({
                            ...DEFAULT_RESUME_DATA,
                            personalInfo: {
                                ...DEFAULT_RESUME_DATA.personalInfo,
                                ...(draftData.personalInfo || {}),
                                name: draftData.personalInfo?.name || profileName,
                            },
                            summary: draftData.summary || '',
                            skills: {
                                technical: Array.isArray(draftData.skills?.technical) ? draftData.skills.technical : [],
                            },
                            experience: Array.isArray(draftData.experience) ? draftData.experience.filter((x: any) => x).map((exp: any) => ({
                                ...exp,
                                title: exp.title || '',
                                company: exp.company || '',
                                location: exp.location || '',
                                startDate: exp.startDate || '',
                                endDate: exp.endDate || '',
                                current: !!exp.current,
                                bullets: Array.isArray(exp.bullets) ? exp.bullets : [],
                            })) : [],
                            education: Array.isArray(draftData.education) ? draftData.education.filter((x: any) => x).map((edu: any) => ({
                                ...edu,
                                school: edu.school || '',
                                degree: edu.degree || '',
                                field: edu.field || '',
                                location: edu.location || '',
                                graduationDate: edu.graduationDate || '',
                            })) : [],
                            technicalSkills: draftData.technicalSkills || {},
                        });

                        // Deep clean sections and settings from draft
                        if (Array.isArray(draft.sections)) setSections(draft.sections);
                        if (draft.settings) {
                            setSettings({
                                ...DEFAULT_ATS_SETTINGS,
                                ...draft.settings,
                                margins: { ...DEFAULT_ATS_SETTINGS.margins, ...(draft.settings.margins || {}) },
                                fontSize: { ...DEFAULT_ATS_SETTINGS.fontSize, ...(draft.settings.fontSize || {}) },
                                fontColor: { ...DEFAULT_ATS_SETTINGS.fontColor, ...(draft.settings.fontColor || {}) },
                            });
                        }

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
                // ====== IMPORTED RESUME (Quick Format Flow) ======
                // Check if this is an imported resume from applications collection
                if ((params.id as string).startsWith('app_import_')) {
                    const { getDoc, doc } = await import('firebase/firestore');
                    const appDoc = await getDoc(doc(db, 'applications', params.id as string));

                    if (appDoc.exists()) {
                        const appData = appDoc.data();

                        // Load job title and company
                        setJobTitle(appData.jobTitle || 'Imported Resume');
                        setJobCompany(appData.jobCompany || '');

                        // Load the embedded resume data directly
                        if (appData.resume) {
                            const resume = appData.resume;
                            setResumeData({
                                ...DEFAULT_RESUME_DATA,
                                personalInfo: {
                                    ...DEFAULT_RESUME_DATA.personalInfo,
                                    name: resume.personalInfo?.fullName || resume.personalInfo?.name || profileName,
                                    email: resume.personalInfo?.email || '',
                                    phone: resume.personalInfo?.phone || '',
                                    location: resume.personalInfo?.location || '',
                                    linkedin: resume.personalInfo?.linkedin || '',
                                    github: resume.personalInfo?.portfolio || resume.personalInfo?.github || '',
                                },
                                summary: resume.professionalSummary || '',
                                experience: (() => {
                                    let foundCurrent = false;
                                    return (resume.experience || []).map((exp: any) => {
                                        const shouldBeCurrent = !foundCurrent && (exp.endDate === 'Present' || exp.current);
                                        if (shouldBeCurrent) foundCurrent = true;
                                        return {
                                            company: exp.company || '',
                                            title: exp.title || '',
                                            location: exp.location || '',
                                            startDate: exp.startDate || '',
                                            endDate: exp.endDate || '',
                                            current: shouldBeCurrent || false,
                                            bullets: exp.highlights || exp.bullets || (exp.description ? [exp.description] : []),
                                        };
                                    });
                                })(),
                                education: (resume.education || []).map((edu: any) => ({
                                    school: edu.institution || edu.school || '',
                                    degree: edu.degree || '',
                                    field: edu.field || '',
                                    location: edu.location || '',
                                    graduationDate: edu.graduationDate || '',
                                })),
                                skills: {
                                    ...DEFAULT_RESUME_DATA.skills,
                                    technical: resume.technicalSkills
                                        ? Object.entries(resume.technicalSkills)
                                            .map(([category, skills]) => `**${category}**: ${Array.isArray(skills) ? skills.join(', ') : skills}`)
                                        : [],
                                },
                                // PRESERVE the map for TemplateRenderer!
                                technicalSkills: resume.technicalSkills || DEFAULT_RESUME_DATA.technicalSkills,
                            });

                            setLoading(false);
                            toast.success('Imported resume loaded!');
                            return;
                        }
                    }
                }

                // ====== AI-GENERATED RESUME ======
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



                    // CASE 1: AI-Generated Resume (New Format)
                    // Detect if it follows the AI schema (professionalSummary, technicalSkills, or experience with 'position')
                    const isAiFormat = resumeData.professionalSummary ||
                        resumeData.technicalSkills ||
                        (Array.isArray(resumeData.experience) && resumeData.experience[0]?.position);

                    if (isAiFormat) {
                        setResumeData({
                            ...DEFAULT_RESUME_DATA,
                            personalInfo: {
                                ...DEFAULT_RESUME_DATA.personalInfo,
                                ...(resumeData.personalInfo || {}),
                                name: resumeData.personalInfo?.name || profileName,
                                email: user?.email || '',
                            },
                            summary: resumeData.professionalSummary || '',
                            experience: (resumeData.experience || []).filter((x: any) => x).map((exp: any) => ({
                                company: exp.company || '',
                                title: exp.position || exp.title || '',
                                location: exp.location || '',
                                startDate: exp.startDate || '',
                                endDate: exp.endDate || '',
                                current: exp.current || false,
                                bullets: Array.isArray(exp.responsibilities)
                                    ? exp.responsibilities.filter((b: any) => b && typeof b === 'string')
                                    : Array.isArray(exp.bullets)
                                        ? exp.bullets.filter((b: any) => b && typeof b === 'string')
                                        : [],
                            })),
                            education: (resumeData.education || []).filter((x: any) => x).map((edu: any) => ({
                                school: edu.institution || edu.school || '',
                                degree: edu.degree || '',
                                field: edu.field || '',
                                location: edu.location || '',
                                graduationDate: edu.graduationDate || '',
                            })),
                            skills: {
                                ...DEFAULT_RESUME_DATA.skills,
                                technical: resumeData.technicalSkills
                                    ? Object.entries(resumeData.technicalSkills)
                                        .filter(([_, skills]) => skills) // Filter out null/undefined categories
                                        .map(([category, skills]) => `**${category}**: ${Array.isArray(skills) ? skills.filter(s => s).join(', ') : skills || ''}`)
                                    : [],
                            },
                            technicalSkills: resumeData.technicalSkills || DEFAULT_RESUME_DATA.technicalSkills,
                        });
                        setAtsScore(resumeData.atsScore || 0);
                        setLoading(false);
                        return; // Exit early for AI resumes
                    }

                    // CASE 2: Legacy Nested Format (resumeData.resumeData)
                    if (resumeData.resumeData) {
                        const legacyData = resumeData.resumeData;
                        setResumeData({
                            ...DEFAULT_RESUME_DATA,
                            ...legacyData,
                            personalInfo: {
                                ...DEFAULT_RESUME_DATA.personalInfo,
                                ...legacyData.personalInfo,
                                name: legacyData.personalInfo?.name || profileName,
                            },
                            skills: {
                                technical: Array.isArray(legacyData.skills?.technical) ? legacyData.skills.technical : [],
                            },
                            experience: Array.isArray(legacyData.experience) ? legacyData.experience.filter((x: any) => x).map((exp: any) => ({
                                ...exp,
                                title: exp.title || '',
                                company: exp.company || '',
                                location: exp.location || '',
                                startDate: exp.startDate || '',
                                endDate: exp.endDate || '',
                                current: !!exp.current,
                                bullets: Array.isArray(exp.bullets) ? exp.bullets : [],
                            })) : [],
                            education: Array.isArray(legacyData.education) ? legacyData.education.filter((x: any) => x).map((edu: any) => ({
                                ...edu,
                                school: edu.school || '',
                                degree: edu.degree || '',
                                field: edu.field || '',
                                location: edu.location || '',
                                graduationDate: edu.graduationDate || '',
                            })) : [],
                            technicalSkills: legacyData.technicalSkills || {},
                        });

                        // Load aux data
                        // Load aux data
                        if (Array.isArray(resumeData.sections)) setSections(resumeData.sections);
                        if (resumeData.settings) {
                            setSettings({
                                ...DEFAULT_ATS_SETTINGS,
                                ...resumeData.settings,
                                // Ensure critical nested objects exist
                                margins: { ...DEFAULT_ATS_SETTINGS.margins, ...(resumeData.settings.margins || {}) },
                                fontSize: { ...DEFAULT_ATS_SETTINGS.fontSize, ...(resumeData.settings.fontSize || {}) },
                                fontColor: { ...DEFAULT_ATS_SETTINGS.fontColor, ...(resumeData.settings.fontColor || {}) },
                            });
                        }

                        setLoading(false);
                        return;
                    }

                    // CASE 3: Standard Flat Format
                    setResumeData({
                        ...DEFAULT_RESUME_DATA,
                        ...resumeData,
                        personalInfo: {
                            ...DEFAULT_RESUME_DATA.personalInfo,
                            ...resumeData.personalInfo,
                            name: resumeData.personalInfo?.name || profileName,
                        },
                        skills: {
                            technical: Array.isArray(resumeData.skills?.technical) ? resumeData.skills.technical : [],
                        },
                        // DEEP CLEAN: Ensure every item in experience/education is a valid object
                        experience: Array.isArray(resumeData.experience) ? resumeData.experience.filter((x: any) => x).map((exp: any) => ({
                            ...exp,
                            title: exp.title || '',
                            company: exp.company || '',
                            location: exp.location || '',
                            startDate: exp.startDate || '',
                            endDate: exp.endDate || '',
                            current: !!exp.current,
                            bullets: Array.isArray(exp.bullets) ? exp.bullets : [],
                        })) : [],
                        education: Array.isArray(resumeData.education) ? resumeData.education.filter((x: any) => x).map((edu: any) => ({
                            ...edu,
                            school: edu.school || '',
                            degree: edu.degree || '',
                            field: edu.field || '',
                            location: edu.location || '',
                            graduationDate: edu.graduationDate || '',
                        })) : [],
                        technicalSkills: resumeData.technicalSkills || {},
                    } as any);

                    // Validate custom sections
                    if (Array.isArray(resumeData.sections)) {
                        setSections(resumeData.sections);
                    } else if (resumeData.sections) {
                        // Attempt to recover if it's an object map (old format?) - likely not needed but good safety
                        setSections([]);
                    }

                    if (resumeData.settings) {
                        setSettings({
                            ...DEFAULT_ATS_SETTINGS,
                            ...resumeData.settings,
                            // Ensure critical nested objects exist
                            margins: { ...DEFAULT_ATS_SETTINGS.margins, ...(resumeData.settings.margins || {}) },
                            fontSize: { ...DEFAULT_ATS_SETTINGS.fontSize, ...(resumeData.settings.fontSize || {}) },
                            fontColor: { ...DEFAULT_ATS_SETTINGS.fontColor, ...(resumeData.settings.fontColor || {}) },
                        });
                    }

                    setLoading(false);
                    return;
                }
            }

            // Otherwise, load from user profile (new resume)
            // Note: We already fetched profileData/profileName at the top

            if (profileData) {
                setResumeData({
                    personalInfo: {
                        name: profileName,
                        email: user?.email || '',
                        phone: profileData.profile?.phone || '',
                        location: profileData.profile?.location || '',
                        linkedin: profileData.profile?.linkedin || '',
                        github: profileData.profile?.github || '',
                    },
                    summary: `Experienced professional with expertise in ${profileData.baseSkills?.technical?.slice(0, 3).join(', ') || 'various technologies'}`,
                    experience: profileData.baseExperience || [],
                    education: profileData.baseEducation || [],
                    skills: {
                        technical: profileData.baseSkills?.technical || [],
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

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [advancedAnalysis, setAdvancedAnalysis] = useState<any>(null);

    // === ATS Score Calculation (Hybrid: Local + Server) ===
    const calculateATS = async (forceServer = false) => {
        // 1. Instant Local Calculation (Lite)
        const localResult = calculateResumeScore({
            personalInfo: resumeData.personalInfo,
            experience: resumeData.experience,
            education: resumeData.education,
            skills: resumeData.skills,
            technicalSkills: resumeData.technicalSkills,
            summary: resumeData.summary,
        });

        // Show local score immediately
        setAtsScore(localResult.total);

        // 2. Server-Side Deep Scan (Optional / Debounced)
        // If we have a Job Description OR explicitly requested, run deep scan
        // We avoid running this on every keystroke
        if (forceServer || (jobAnalysis && !advancedAnalysis)) {
            setIsAnalyzing(true);
            try {
                // Pass resume data AND job description text if available
                const deepResult = await analyzeResume({
                    personalInfo: resumeData.personalInfo,
                    experience: resumeData.experience,
                    education: resumeData.education,
                    skills: resumeData.skills,
                    technicalSkills: resumeData.technicalSkills,
                    summary: resumeData.summary,
                }, jobAnalysis ? JSON.stringify(jobAnalysis) : undefined);

                setAdvancedAnalysis(deepResult);

                // If deep scan is higher/different, we could update the main score
                // Or keep them separate. For now, let's use the Deep Result total if available
                if (deepResult) {
                    setAtsScore(deepResult.totalScore);
                }
            } catch (err) {
                console.error("Deep scan failed:", err);
            } finally {
                setIsAnalyzing(false);
            }
        }
    };

    // Debounce effect for local updates, but only trigger server on specific conditions
    useEffect(() => {
        const timer = setTimeout(() => {
            calculateATS(false);
        }, 1000);
        return () => clearTimeout(timer);
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

        // Company name is now read-only (set during generation/import)
        // No validation needed here - company comes from original source

        setSaving(true);

        try {
            const resumeId = params.id === 'new' ? `resume_${Date.now()}` : params.id;

            const atsScoreData = {
                total: atsScore,
                formatting: 95,
                content: 85,
                keywords: atsScore,
            };

            // ====== IMPORTED RESUME (Quick Format Flow) ======
            // Save back to applications collection
            if ((params.id as string).startsWith('app_import_')) {
                const appDocRef = doc(db, 'applications', params.id as string);

                // Convert editor format back to storage format
                const updatedResume = {
                    personalInfo: {
                        fullName: resumeData.personalInfo.name,
                        email: resumeData.personalInfo.email,
                        phone: resumeData.personalInfo.phone,
                        location: resumeData.personalInfo.location,
                        linkedin: resumeData.personalInfo.linkedin,
                        portfolio: resumeData.personalInfo.github,
                    },
                    professionalSummary: resumeData.summary,
                    experience: resumeData.experience.map(exp => ({
                        company: exp.company,
                        title: exp.title,
                        location: exp.location,
                        startDate: exp.startDate,
                        endDate: exp.current ? 'Present' : exp.endDate,
                        highlights: exp.bullets,
                    })),
                    education: resumeData.education.map(edu => ({
                        institution: edu.school,
                        degree: edu.degree,
                        field: edu.field,
                        location: edu.location,
                        graduationDate: edu.graduationDate,
                    })),
                    technicalSkills: resumeData.skills.technical.reduce((acc: any, line: string) => {
                        const match = line.match(/^\*\*(.+?)\*\*:\s*(.+)$/);
                        if (match) {
                            acc[match[1]] = match[2].split(',').map(s => s.trim());
                        } else {
                            acc['Skills'] = acc['Skills'] || [];
                            acc['Skills'].push(line);
                        }
                        return acc;
                    }, {}),
                };

                await setDoc(appDocRef, {
                    jobTitle: jobTitle || 'Imported Resume',
                    jobCompany: jobCompany || 'Quick Format',
                    resume: updatedResume,
                    atsScore: atsScoreData.total,
                    settings,
                    sections,
                    updatedAt: serverTimestamp(),
                }, { merge: true });

                // Clear local draft
                localStorage.removeItem(`draft_resume_${params.id}`);

                toast.success('Resume saved! 🎉');
                router.push('/dashboard');
                return;
            }

            // ====== AI-GENERATED RESUME ======
            // Check if this is an AI-generated resume (from 'resumes' collection)
            const resumeDocRef = doc(db, 'resumes', resumeId as string);
            const resumeDoc = await getDoc(resumeDocRef);

            if (resumeDoc.exists()) {
                // Update existing AI-generated resume with ATS score, settings, and editable fields
                await setDoc(resumeDocRef, {
                    ...resumeDoc.data(),
                    jobTitle: jobTitle || jobAnalysis?.title || 'Untitled',
                    jobCompany: jobCompany || jobAnalysis?.company || '',
                    atsScore: atsScoreData,
                    resumeData, // ✅ Save content edits
                    settings,  // Save formatting settings
                    sections,  // Save section order
                    updatedAt: serverTimestamp(),
                }, { merge: true });

                // Clear local draft to prevent stale data
                localStorage.removeItem(`draft_resume_${params.id}`);

                toast.success('Resume updated! 🎉');
            } else {
                // Save to appliedResumes (old format)
                await setDoc(doc(db, 'appliedResumes', resumeId as string), {
                    userId: user.uid,
                    jobTitle: jobTitle || jobAnalysis?.title || 'Untitled',
                    jobCompany: jobCompany || jobAnalysis?.company || '',  // Use consistent field name
                    company: jobCompany || jobAnalysis?.company || '',      // Keep for backwards compatibility
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

    // Connect handleSave to manual save ref
    handleSaveRef.current = handleSave;

    // ===== SILENT SAVE FOR AUTO-SAVE (No redirect, no toast) =====
    const performSilentSave = async () => {
        if (!user || params.id === 'new') return;

        try {
            const resumeId = params.id as string;
            const atsScoreData = {
                total: atsScore,
                formatting: 95,
                content: 85,
                keywords: atsScore,
            };

            // Custom sections data
            const customSectionsData: Record<string, any> = {};
            sections.filter(s => s.type === 'custom').forEach(s => {
                if ((resumeData as any)[s.id]) {
                    customSectionsData[s.id] = (resumeData as any)[s.id];
                }
            });

            // Imported resume
            if (resumeId.startsWith('app_import_')) {
                const appDocRef = doc(db, 'applications', resumeId);
                await setDoc(appDocRef, {
                    updatedResume: {
                        personalInfo: {
                            fullName: resumeData.personalInfo.name,
                            email: resumeData.personalInfo.email,
                            phone: resumeData.personalInfo.phone,
                            location: resumeData.personalInfo.location,
                            linkedin: resumeData.personalInfo.linkedin,
                            portfolio: resumeData.personalInfo.github,
                        },
                        professionalSummary: resumeData.summary,
                        experience: resumeData.experience,
                        education: resumeData.education,
                        skills: resumeData.skills.technical,
                        technicalSkills: resumeData.technicalSkills,
                        customSections: customSectionsData,
                    },
                    settings,
                    sections,
                    updatedAt: serverTimestamp(),
                }, { merge: true });
                return;
            }

            // AI-generated resume
            const resumeDocRef = doc(db, 'resumes', resumeId);
            const resumeDoc = await getDoc(resumeDocRef);

            if (resumeDoc.exists()) {
                await setDoc(resumeDocRef, {
                    ...resumeDoc.data(),
                    jobTitle: jobTitle || jobAnalysis?.title || 'Untitled',
                    jobCompany: jobCompany || jobAnalysis?.company || '',
                    atsScore: atsScoreData,
                    resumeData,
                    settings,
                    sections,
                    updatedAt: serverTimestamp(),
                }, { merge: true });
                return;
            }

            // Fall back to appliedResumes
            await setDoc(doc(db, 'appliedResumes', resumeId), {
                userId: user.uid,
                jobTitle: jobTitle || jobAnalysis?.title || 'Untitled',
                jobCompany: jobCompany || jobAnalysis?.company || '',
                company: jobCompany || jobAnalysis?.company || '',
                resumeData,
                sections,
                settings,
                atsScore: atsScoreData,
                status: 'draft',
                updatedAt: serverTimestamp(),
            }, { merge: true });

        } catch (error) {
            console.error('Auto-save error:', error);
            throw error; // Re-throw so useAutoSave can handle it
        }
    };

    // Connect silentSave to auto-save ref
    silentSaveRef.current = performSilentSave;

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
                Aptos: robotoFont,
                Arial: robotoFont,
                Helvetica: robotoFont,
                'Times New Roman': robotoFont,
                Georgia: robotoFont,
            };

            const content: any[] = [];

            if (activeTemplate) {
                const customSectionsData: Record<string, any> = {};
                sections.forEach(s => {
                    if (s.type === 'custom') {
                        customSectionsData[s.id] = (resumeData as any)[s.id];
                    }
                });
                content.push(...convertTemplateToPdfMake(resumeData, activeTemplate, sortedSections, customSectionsData));
            } else {
                // Template-aware settings (modern = left-aligned with accent colors)
                const isModernPdf = settings.template === 'modern';
                const headerAlignmentPdf = isModernPdf ? 'left' : 'center';
                const accentColorPdf = settings.fontColor.accent || '#1D4ED8';
                const nameColorPdf = isModernPdf ? accentColorPdf : settings.fontColor.name;
                const headingColorPdf = isModernPdf ? accentColorPdf : settings.fontColor.headers;
                const dividerColorPdf = isModernPdf ? accentColorPdf : settings.dividerColor;

                const addSectionHeader = (sectionName: string) => {
                    content.push({
                        text: headerCase(sectionName),
                        style: 'sectionHeader',
                        color: headingColorPdf,
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
                                    lineColor: dividerColorPdf,
                                },
                            ],
                            margin: [0, 0, 0, 8],
                        });
                    }
                };

                content.push({
                    text: resumeData.personalInfo.name || 'Your Name',
                    style: 'name',
                    color: nameColorPdf,
                    alignment: headerAlignmentPdf,
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
                        alignment: headerAlignmentPdf,
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
                            content.push({ text: formatPdfText(`${settings.bulletStyle} ${skillLine}`), style: 'body', margin: [0, 0, 0, idx === resumeData.skills.technical.length - 1 ? 8 : 4] });
                        });
                    }

                    if (section.type === 'custom') {
                        const customData = (resumeData as any)[section.id];
                        if (customData && customData.items && customData.items.length > 0) {
                            addSectionHeader(section.name);
                            customData.items.forEach((item: any, idx: number) => {
                                if (item.title) {
                                    content.push({ text: item.title, style: 'bodyBold', margin: [0, 0, 0, 2] });
                                }
                                if (item.description) {
                                    content.push({ text: formatPdfText(item.description), style: 'body', margin: [0, 0, 0, idx === customData.items.length - 1 ? 8 : 4] });
                                }
                            });
                        }
                    }
                });

            }

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

            const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, TabStopType, TabStopPosition, BorderStyle } = docxModule as any;

            const px = (pt: number) => pt * 2; // docx uses half-points
            const letterWidth = 8.5 * 1440;
            const letterHeight = 11 * 1440;
            // Calculate right tab position based on page width and margins
            const rightTabPos = Math.round((8.5 - settings.margins.left - settings.margins.right) * 1440);

            // === USE ACTIVE TEMPLATE FOR COLORS & STYLING ===
            const t = activeTemplate;
            const headerAlignmentDocx = t.header.nameAlign === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT;
            const nameColorDocx = t.typography.colors.name.replace('#', '');
            const headingColorDocx = t.typography.colors.headers.replace('#', '');
            const bodyColorDocx = t.typography.colors.body.replace('#', '');
            const accentColorDocx = t.typography.colors.accent.replace('#', '');
            const isUppercase = t.sectionHeaders.style.includes('uppercase');
            const isBoldHeaders = t.sectionHeaders.style.includes('bold');
            const hasDivider = t.sectionHeaders.divider;

            const heading = (text: string) => new Paragraph({
                children: [new TextRun({
                    text: isUppercase ? text.toUpperCase() : text,
                    bold: isBoldHeaders,
                    size: px(t.typography.sizes.sectionHeader),
                    color: headingColorDocx,
                    font: t.typography.fontFamily
                })],
                spacing: { before: 80, after: hasDivider ? 60 : 60 },
                border: hasDivider ? {
                    bottom: {
                        color: accentColorDocx,
                        space: 1,
                        style: BorderStyle.SINGLE,
                        size: 8,
                    },
                } : undefined,
            });

            const bodyParagraph = (text: string, opts: any = {}) => new Paragraph({
                children: formatDocxRuns(text, docxModule, { font: t.typography.fontFamily, size: px(t.typography.sizes.body), color: bodyColorDocx }),
                alignment: t.typography.bodyAlignment === 'justify' ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
                spacing: { after: opts.after ?? 60 },
            });

            // === DYNAMIC ROW RENDERER (matches TemplateRenderer logic) ===
            const renderDocxRow = (row: any, fieldData: Record<string, string | undefined>, isFirstRow: boolean = false): any => {
                // Filter visible fields (hide empty if template says so)
                const visibleFields = row.fields.filter((field: any) => {
                    const value = fieldData[field.name];
                    return t.header.hideEmptyFields ? !!value?.trim() : true;
                });

                if (visibleFields.length === 0) return null;

                // Build TextRuns for each field with separators
                const textRuns: any[] = [];
                visibleFields.forEach((field: any, i: number) => {
                    const value = fieldData[field.name] || '';
                    if (!value) return;

                    const isLast = i === visibleFields.length - 1;
                    const separator = isLast ? '' : (field.separator || '');

                    // Field text
                    textRuns.push(new TextRun({
                        text: value,
                        bold: field.style === 'bold',
                        italics: field.style === 'italic',
                        size: field.fontSize === 'small' ? px(t.typography.sizes.body - 1) : px(isFirstRow ? t.typography.sizes.itemTitle : t.typography.sizes.body),
                        color: bodyColorDocx,
                        font: t.typography.fontFamily,
                    }));

                    // Separator
                    if (separator) {
                        textRuns.push(new TextRun({
                            text: separator,
                            size: px(t.typography.sizes.body),
                            color: bodyColorDocx,
                            font: t.typography.fontFamily,
                        }));
                    }
                });

                // Handle alignment: space-between uses tab stops, others use alignment
                if (row.align === 'space-between' && visibleFields.length >= 2) {
                    // For space-between: first field left, last field right-aligned via tab
                    const leftFields = visibleFields.slice(0, -1);
                    const rightField = visibleFields[visibleFields.length - 1];

                    const leftRuns: any[] = [];
                    leftFields.forEach((field: any, i: number) => {
                        const value = fieldData[field.name] || '';
                        if (!value) return;
                        const isLast = i === leftFields.length - 1;
                        const separator = isLast ? '' : (field.separator || '');

                        leftRuns.push(new TextRun({
                            text: value,
                            bold: field.style === 'bold',
                            italics: field.style === 'italic',
                            size: px(isFirstRow ? t.typography.sizes.itemTitle : t.typography.sizes.body),
                            color: bodyColorDocx,
                            font: t.typography.fontFamily,
                        }));

                        if (separator) {
                            leftRuns.push(new TextRun({
                                text: separator,
                                size: px(t.typography.sizes.body),
                                color: bodyColorDocx,
                                font: t.typography.fontFamily,
                            }));
                        }
                    });

                    // Tab + Right field
                    leftRuns.push(new TextRun({ text: '\t' }));
                    leftRuns.push(new TextRun({
                        text: fieldData[rightField.name] || '',
                        bold: rightField.style === 'bold',
                        italics: rightField.style === 'italic',
                        size: px(t.typography.sizes.body),
                        color: bodyColorDocx,
                        font: t.typography.fontFamily,
                    }));

                    return new Paragraph({
                        children: leftRuns,
                        tabStops: [{ type: TabStopType.RIGHT, position: rightTabPos }],
                        spacing: { after: 40 },
                    });
                }

                // Standard alignment
                const alignmentMap: Record<string, any> = {
                    'left': AlignmentType.LEFT,
                    'center': AlignmentType.CENTER,
                    'right': AlignmentType.RIGHT,
                };

                return new Paragraph({
                    children: textRuns,
                    alignment: alignmentMap[row.align] || AlignmentType.LEFT,
                    spacing: { after: 40 },
                });
            };

            const sectionChildren: any[] = [];

            // Name (dynamic style from template)
            const isNameBold = t.header.nameStyle.includes('bold');
            const isNameUppercase = t.header.nameStyle.includes('uppercase');
            const nameText = isNameUppercase
                ? (resumeData.personalInfo.name || 'Your Name').toUpperCase()
                : (resumeData.personalInfo.name || 'Your Name');

            sectionChildren.push(new Paragraph({
                children: [
                    new TextRun({ text: nameText, bold: isNameBold, size: px(t.typography.sizes.name), color: nameColorDocx, font: t.typography.fontFamily }),
                ],
                heading: HeadingLevel.TITLE,
                alignment: headerAlignmentDocx,
                spacing: { after: 80 },
            }));

            // Contact (dynamic rows from template)
            const contactData: Record<string, string | undefined> = {
                email: resumeData.personalInfo.email,
                phone: resumeData.personalInfo.phone,
                location: resumeData.personalInfo.location,
                linkedin: resumeData.personalInfo.linkedin,
                github: resumeData.personalInfo.github,
            };

            t.header.contactRows.forEach((row: any) => {
                const rowParagraph = renderDocxRow(row, contactData, false);
                if (rowParagraph) {
                    // Override alignment to match header alignment
                    rowParagraph.properties = {
                        ...rowParagraph.properties,
                        alignment: headerAlignmentDocx,
                    };
                    sectionChildren.push(rowParagraph);
                }
            });
            // Add spacing after contact
            sectionChildren.push(new Paragraph({ spacing: { after: 200 }, children: [] }));



            const sortedSectionsDoc = [...sections].sort((a, b) => a.order - b.order).filter(s => s.visible);

            sortedSectionsDoc.forEach(section => {
                if (section.type === 'summary' && resumeData.summary) {
                    sectionChildren.push(heading(section.name));
                    sectionChildren.push(bodyParagraph(resumeData.summary, { after: 80 }));
                }

                if (section.type === 'experience' && resumeData.experience.length > 0) {
                    sectionChildren.push(heading(section.name));
                    resumeData.experience.forEach((exp: any, expIndex: number) => {
                        // Build field data for row rendering
                        const dates = `${formatMonthYear(exp.startDate)} - ${exp.current ? 'Present' : formatMonthYear(exp.endDate)}`;
                        const expData: Record<string, string | undefined> = {
                            title: exp.title,
                            company: exp.company,
                            location: exp.location,
                            dates: dates,
                        };

                        // Render each template row dynamically
                        t.experience.rows.forEach((row: any, rowIndex: number) => {
                            const rowParagraph = renderDocxRow(row, expData, rowIndex === 0);
                            if (rowParagraph) {
                                sectionChildren.push(rowParagraph);
                            }
                        });

                        // Render bullets
                        exp.bullets.filter((b: string) => b.trim()).forEach((b: string) => {
                            sectionChildren.push(new Paragraph({
                                children: [
                                    new TextRun({ text: `${t.experience.bulletStyle} `, size: px(t.typography.sizes.body), color: bodyColorDocx, font: t.typography.fontFamily }),
                                    ...formatDocxRuns(b, docxModule, { font: t.typography.fontFamily, size: px(t.typography.sizes.body), color: bodyColorDocx }),
                                ],
                                spacing: { after: 40 },
                                alignment: t.typography.bodyAlignment === 'justify' ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
                            }));
                        });
                        sectionChildren.push(new Paragraph({ spacing: { after: t.experience.spacing.afterItem || 120 }, children: [] }));
                    });
                }

                if (section.type === 'education' && resumeData.education.length > 0) {
                    sectionChildren.push(heading(section.name));

                    resumeData.education.forEach((edu: any, eduIndex: number) => {
                        // Build field data for row rendering
                        const eduData: Record<string, string | undefined> = {
                            degree: edu.degree,
                            field: edu.field,
                            school: edu.school,
                            location: edu.location,
                            dates: edu.graduationDate ? formatMonthYear(edu.graduationDate) : '',
                            gpa: t.education.showGPA && edu.gpa ? `GPA: ${edu.gpa}` : undefined,
                        };

                        // Render each template row dynamically
                        t.education.rows.forEach((row: any, rowIndex: number) => {
                            const rowParagraph = renderDocxRow(row, eduData, rowIndex === 0);
                            if (rowParagraph) {
                                sectionChildren.push(rowParagraph);
                            }
                        });

                        // Spacing after item
                        sectionChildren.push(new Paragraph({ spacing: { after: t.education.spacing.afterItem || 120 }, children: [] }));
                    });
                }

                if (section.type === 'skills') {
                    const hasTechnicalSkills = resumeData.technicalSkills && Object.keys(resumeData.technicalSkills).length > 0;
                    const hasArraySkills = resumeData.skills.technical.length > 0;

                    if (hasTechnicalSkills || hasArraySkills) {
                        sectionChildren.push(heading(section.name));

                        // Primary: Categorized Skills (technicalSkills map)
                        if (hasTechnicalSkills) {
                            Object.entries(resumeData.technicalSkills!).forEach(([category, skills]) => {
                                // Format camelCase to Title Case
                                const formattedCategory = category
                                    .replace(/([A-Z])/g, ' $1')
                                    .replace(/^./, str => str.toUpperCase())
                                    .trim();
                                const skillText = Array.isArray(skills) ? skills.join(', ') : skills;

                                sectionChildren.push(new Paragraph({
                                    children: [
                                        new TextRun({ text: `${t.experience.bulletStyle} `, size: px(t.typography.sizes.body), color: bodyColorDocx, font: t.typography.fontFamily }),
                                        new TextRun({ text: `${formattedCategory}:`, bold: true, size: px(t.typography.sizes.body), color: bodyColorDocx, font: t.typography.fontFamily }),
                                        new TextRun({ text: ` ${skillText}`, size: px(t.typography.sizes.body), color: bodyColorDocx, font: t.typography.fontFamily }),
                                    ],
                                    spacing: { after: 40 },
                                    alignment: t.typography.bodyAlignment === 'justify' ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
                                }));
                            });
                        }
                        // Fallback: Array Skills
                        else if (hasArraySkills) {
                            resumeData.skills.technical.forEach((skillLine: string, idx: number) => {
                                sectionChildren.push(bodyParagraph(`${t.experience.bulletStyle} ${skillLine}`, { after: idx === resumeData.skills.technical.length - 1 ? 80 : 40 }));
                            });
                        }
                    }
                }

                if (section.type === 'custom') {
                    const customData = (resumeData as any)[section.id];
                    if (customData && customData.items && customData.items.length > 0) {
                        sectionChildren.push(heading(section.name));
                        customData.items.forEach((item: any, idx: number) => {
                            if (item.title) {
                                sectionChildren.push(new Paragraph({
                                    children: [new TextRun({ text: item.title, bold: true, size: px(t.typography.sizes.body), color: bodyColorDocx, font: t.typography.fontFamily })],
                                    spacing: { after: 40 },
                                }));
                            }
                            if (item.description) {
                                sectionChildren.push(bodyParagraph(item.description, { after: idx === customData.items.length - 1 ? 120 : 60 }));
                            }
                        });
                    }
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
                {
                    company: '',
                    title: '',
                    location: '',
                    startDate: '',
                    endDate: '',
                    current: false,
                    bullets: [''],
                },
                ...resumeData.experience,
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

        // If setting 'current' to true, uncheck all other experiences
        if (field === 'current' && value === true) {
            newExp.forEach((exp, i) => {
                if (i !== index) {
                    newExp[i] = { ...newExp[i], current: false };
                }
            });
        }

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
            technicalSkills: undefined, // Clear mapped skills to show new list edits
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
            technicalSkills: undefined, // Clear mapped skills to show new list edits
        });
    };

    // Custom Section functions
    const addCustomSection = () => {
        if (!newSectionName.trim()) return;

        const newSection: Section = {
            id: `custom_${Date.now()}`,
            name: newSectionName.trim(),
            type: 'custom',
            visible: true,
            order: sections.length,
        };

        setSections([...sections, newSection]);
        setExpandedSections(prev => new Set([...prev, newSection.id]));

        // Add to resume data with empty items array
        setResumeData({
            ...resumeData,
            [newSection.id]: {
                items: [{ title: '', description: '' }], // Start with one empty item
            },
        });

        setNewSectionName('');
        setShowAddSectionModal(false);
        toast.success(`Added "${newSection.name}" section!`);
    };

    // Add item to custom section
    const addCustomItem = (sectionId: string) => {
        const sectionData = (resumeData as any)[sectionId];
        if (!sectionData) return;

        setResumeData({
            ...resumeData,
            [sectionId]: {
                items: [...sectionData.items, { title: '', description: '' }],
            },
        });
    };

    // Update item in custom section
    const updateCustomItem = (sectionId: string, itemIndex: number, field: 'title' | 'description', value: string) => {
        const sectionData = (resumeData as any)[sectionId];
        if (!sectionData) return;

        const updatedItems = [...sectionData.items];
        updatedItems[itemIndex] = { ...updatedItems[itemIndex], [field]: value };

        setResumeData({
            ...resumeData,
            [sectionId]: {
                items: updatedItems,
            },
        });
    };

    // Remove item from custom section
    const removeCustomItem = (sectionId: string, itemIndex: number) => {
        const sectionData = (resumeData as any)[sectionId];
        if (!sectionData || sectionData.items.length <= 1) return;

        setResumeData({
            ...resumeData,
            [sectionId]: {
                items: sectionData.items.filter((_: any, i: number) => i !== itemIndex),
            },
        });
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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-slate-600 font-medium">Loading editor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50">
                <div className="max-w-[1800px] mx-auto px-6 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Dashboard
                        </button>
                        <div className="h-6 w-px bg-slate-200"></div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <input
                                    type="text"
                                    value={jobTitle || jobAnalysis?.title || resumeData.experience[0]?.title || 'Resume Editor'}
                                    onChange={(e) => setJobTitle(e.target.value)}
                                    onBlur={handleSave}
                                    className="text-sm font-semibold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 -ml-1 block"
                                    placeholder="Job Title"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className={`px-3 py-1.5 rounded-full font-semibold text-xs flex items-center gap-1.5 ${atsScore >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            atsScore >= 60 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            <span className="font-bold">ATS {atsScore}%</span>
                        </div>

                        {/* Auto-Save Status Indicator */}
                        <SaveIndicator
                            isSaving={autoSaveInProgress || saving}
                            lastSaved={lastSaved}
                            hasUnsavedChanges={hasUnsavedChanges}
                            error={autoSaveError}
                        />

                        <button
                            onClick={() => setShowSettings(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-all border border-slate-200"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Settings
                        </button>

                        <button
                            onClick={generatePDF}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-all border border-slate-200"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            PDF
                        </button>

                        <button
                            onClick={generateDOCX}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-all border border-slate-200"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            DOCX
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-all disabled:opacity-50 shadow-sm"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </header>

            {/* Full-Width Content */}
            <main className="max-w-[1800px] mx-auto px-6 py-6 h-[calc(100vh-80px)]">
                <div className="grid grid-cols-2 gap-6 h-full">
                    {/* Editor Panel */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                        <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 px-6 py-4 border-b border-slate-200 flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <h2 className="text-sm font-semibold text-slate-800">Edit Resume</h2>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {/* Advanced Analysis Feedback */}
                            {advancedAnalysis && (
                                <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl animate-fadeIn">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-semibold text-indigo-900 mb-1">Analysis Complete</h3>
                                            <div className="text-xs text-indigo-700 space-y-1 mb-3">
                                                <p>Keywords: {advancedAnalysis.sections.keywords.score}/40 &bull; Quality: {advancedAnalysis.sections.quality.score}/35 &bull; Format: {advancedAnalysis.sections.formatting.score}/25</p>
                                            </div>

                                            {advancedAnalysis.feedback.length > 0 && (
                                                <div className="space-y-2 bg-white/60 p-3 rounded-lg">
                                                    {advancedAnalysis.feedback.map((tip: string, i: number) => (
                                                        <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                                                            <span className="text-indigo-500 mt-0.5">•</span>
                                                            {tip}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setAdvancedAnalysis(null)}
                                            className="text-indigo-400 hover:text-indigo-600"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Personal Info */}
                            <div className="mb-5 p-5 bg-slate-50/50 rounded-xl border border-slate-200">
                                <h3 className="font-semibold text-slate-800 mb-4 text-sm">Personal Information</h3>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={resumeData.personalInfo.name}
                                        onChange={(e) => setResumeData({
                                            ...resumeData,
                                            personalInfo: { ...resumeData.personalInfo, name: e.target.value }
                                        })}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                                            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            placeholder="Email"
                                        />
                                        <input
                                            type="tel"
                                            value={resumeData.personalInfo.phone}
                                            onChange={(e) => setResumeData({
                                                ...resumeData,
                                                personalInfo: { ...resumeData.personalInfo, phone: e.target.value }
                                            })}
                                            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                                            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            placeholder="LinkedIn URL"
                                        />
                                        <input
                                            type="url"
                                            value={resumeData.personalInfo.github}
                                            onChange={(e) => setResumeData({
                                                ...resumeData,
                                                personalInfo: { ...resumeData.personalInfo, github: e.target.value }
                                            })}
                                            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            placeholder="GitHub URL (optional)"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Sections */}
                            {sortedSections.map((section, index) => (
                                <div key={section.id} className="mb-4 rounded-xl border border-slate-200 overflow-hidden bg-white">
                                    {/* Section Header */}
                                    <div className="flex items-center justify-between px-5 py-3 bg-slate-50/50 border-b border-slate-100">
                                        <div className="flex items-center gap-3 flex-1">
                                            <button
                                                onClick={() => toggleSection(section.id)}
                                                className="w-6 h-6 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-all"
                                            >
                                                <svg className={`w-4 h-4 transition-transform ${expandedSections.has(section.id) ? 'rotate-0' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>

                                            {editingSectionId === section.id ? (
                                                <input
                                                    type="text"
                                                    value={editingSectionName}
                                                    onChange={(e) => setEditingSectionName(e.target.value)}
                                                    onBlur={saveSectionName}
                                                    onKeyPress={(e) => e.key === 'Enter' && saveSectionName()}
                                                    className="px-3 py-1 border border-blue-400 rounded-lg text-sm font-semibold flex-1 focus:ring-2 focus:ring-blue-500"
                                                    autoFocus
                                                />
                                            ) : (
                                                <h3
                                                    onClick={() => startEditingSectionName(section)}
                                                    className="font-semibold text-slate-800 text-sm cursor-pointer hover:text-blue-600 transition-colors flex-1"
                                                >
                                                    {section.name}
                                                </h3>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => toggleSectionVisibility(section.id)}
                                                className={`p-1.5 rounded-md transition-all ${section.visible ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50' : 'text-slate-300'}`}
                                                title={section.visible ? 'Hide' : 'Show'}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    {section.visible ? (
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    ) : (
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                    )}
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => moveSectionUp(index)}
                                                disabled={index === 0}
                                                className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 disabled:opacity-30 disabled:hover:bg-transparent rounded-md transition-all"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => moveSectionDown(index)}
                                                disabled={index === sections.length - 1}
                                                className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 disabled:opacity-30 disabled:hover:bg-transparent rounded-md transition-all"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
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
                                                            {/* Only show 'Currently working here' for the first/most recent position */}
                                                            {idx === 0 && (
                                                                <label className="flex items-center gap-2 text-xs text-gray-700">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={exp.current}
                                                                        onChange={(e) => updateExperience(idx, 'current', e.target.checked)}
                                                                        className="rounded"
                                                                    />
                                                                    Currently working here
                                                                </label>
                                                            )}
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
                                                        value={(resumeData.skills?.technical || []).join('\n')}
                                                        onChange={(newValue) => {
                                                            const lines = newValue.split('\n').filter(line => line.trim());
                                                            setResumeData({
                                                                ...resumeData,
                                                                skills: {
                                                                    ...resumeData.skills,
                                                                    technical: lines,
                                                                },
                                                                technicalSkills: undefined, // Force preview to use new manual list
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

                                            {/* Custom Sections - Title + Description */}
                                            {section.type === 'custom' && (
                                                <div className="space-y-3">
                                                    <button
                                                        onClick={() => addCustomItem(section.id)}
                                                        className="w-full px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                        </svg>
                                                        Add Item
                                                    </button>

                                                    {((resumeData as any)[section.id]?.items || []).map((item: any, idx: number) => (
                                                        <div key={idx} className="border border-slate-200 rounded-xl p-4 space-y-2.5 bg-slate-50/50">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-xs font-semibold text-slate-600">Item #{idx + 1}</span>
                                                                <button
                                                                    onClick={() => removeCustomItem(section.id, idx)}
                                                                    className="text-red-500 hover:text-red-600 text-xs font-medium"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>

                                                            <input
                                                                type="text"
                                                                value={item.title || ''}
                                                                onChange={(e) => updateCustomItem(section.id, idx, 'title', e.target.value)}
                                                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                                placeholder="Title (e.g., AWS Certified Solutions Architect)"
                                                            />
                                                            <textarea
                                                                value={item.description || ''}
                                                                onChange={(e) => updateCustomItem(section.id, idx, 'description', e.target.value)}
                                                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                                                                rows={2}
                                                                placeholder="Description (e.g., Amazon Web Services, 2024)"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                        </div>

                        {/* Sticky Add Custom Section Button */}
                        <div className="p-4 border-t border-slate-200 bg-white flex-shrink-0">
                            <button
                                onClick={() => setShowAddSectionModal(true)}
                                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Custom Section
                            </button>
                        </div>
                    </div>

                    {/* Preview Panel - PDF-like View */}
                    <div className="bg-slate-100 rounded-2xl h-full flex flex-col overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 px-6 py-4 border-b border-slate-200 rounded-t-2xl flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <h2 className="text-sm font-semibold text-slate-800">Live Preview</h2>
                            </div>
                        </div>

                        {/* PDF Viewer Container */}
                        <div className="flex-1 overflow-auto p-4 bg-slate-100">
                            <div className="w-full flex flex-col items-center" style={{ gap: '8px' }}>
                                {(paginatedPages.length ? paginatedPages : [pageBlocks]).map((page, pageIndex, arr) => (
                                    <div key={pageIndex} className="flex flex-col items-center w-full" style={{ gap: '4px' }}>
                                        <div
                                            className="relative bg-white shadow-lg border border-slate-200 overflow-hidden rounded-sm"
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
            </main >

            {/* Settings Panel */}
            {
                showSettings && (
                    <SettingsPanel
                        settings={settings}
                        onSettingsChange={setSettings}
                        onClose={() => setShowSettings(false)}
                    />
                )
            }

            {/* Add Custom Section Modal */}
            {
                showAddSectionModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Custom Section</h3>
                            <p className="text-sm text-slate-600 mb-4">
                                Create a new section for your resume (e.g., Projects, Certifications, Awards, Publications)
                            </p>
                            <input
                                type="text"
                                value={newSectionName}
                                onChange={(e) => setNewSectionName(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addCustomSection()}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all mb-4"
                                placeholder="Section name..."
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowAddSectionModal(false);
                                        setNewSectionName('');
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={addCustomSection}
                                    disabled={!newSectionName.trim()}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Create Section
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }


        </div >
    );
}

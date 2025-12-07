'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
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

export default function EditorPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
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
        { id: 'experience', name: 'Experience', type: 'experience', visible: true, order: 1 },
        { id: 'education', name: 'Education', type: 'education', visible: true, order: 2 },
        { id: 'skills', name: 'Skills', type: 'skills', visible: true, order: 3 },
    ]);

    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary', 'experience', 'education', 'skills']));
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [editingSectionName, setEditingSectionName] = useState('');

    const [jobAnalysis, setJobAnalysis] = useState<any>(null);
    const [atsScore, setAtsScore] = useState(0);
    const [techSkillInput, setTechSkillInput] = useState('');

    // Settings state
    const [settings, setSettings] = useState<ResumeSettings>(DEFAULT_ATS_SETTINGS);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }
        loadData();
    }, [user]);

    const loadData = async () => {
        try {
            const analysisStr = localStorage.getItem('jobAnalysis');
            if (analysisStr) {
                setJobAnalysis(JSON.parse(analysisStr));
            }

            // If editing existing resume, load it
            if (params.id !== 'new') {
                const resumeDoc = await getDoc(doc(db, 'appliedResumes', params.id as string));

                if (resumeDoc.exists()) {
                    const resumeData = resumeDoc.data();

                    // Load resume data
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
        if (!user || !jobAnalysis) return;

        setSaving(true);

        try {
            const resumeId = params.id === 'new' ? `resume_${Date.now()}` : params.id;

            await setDoc(doc(db, 'appliedResumes', resumeId as string), {
                userId: user.uid,
                jobTitle: jobAnalysis.title,
                company: jobAnalysis.company,
                jobDescription: localStorage.getItem('jobDescription') || '',
                resumeData,
                sections,
                settings, // Save user's custom settings
                atsScore: {
                    total: atsScore,
                    formatting: 95,
                    content: 85,
                    keywords: atsScore,
                },
                status: 'draft',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            toast.success('Resume saved! 🎉');
            router.push('/dashboard');
        } catch (error) {
            console.error('Error saving:', error);
            toast.error('Failed to save resume');
        } finally {
            setSaving(false);
        }
    };

    const generatePDF = async () => {
        try {
            const pdfMake = (await import('pdfmake/build/pdfmake')).default;
            const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default;

            (pdfMake as any).vfs = pdfFonts.pdfMake.vfs;

            const sortedSections = [...sections].sort((a, b) => a.order - b.order);

            const content: any[] = [
                {
                    text: resumeData.personalInfo.name,
                    style: 'header',
                    alignment: 'center',
                },
                {
                    text: [
                        resumeData.personalInfo.email,
                        ' | ',
                        resumeData.personalInfo.phone,
                        ' | ',
                        resumeData.personalInfo.location,
                    ].filter(Boolean).join(''),
                    style: 'contact',
                    alignment: 'center',
                    margin: [0, 5, 0, 20],
                },
            ];

            sortedSections.forEach(section => {
                if (!section.visible) return;

                if (section.type === 'summary' && resumeData.summary) {
                    content.push(
                        { text: section.name.toUpperCase(), style: 'sectionHeader' },
                        { text: resumeData.summary, margin: [0, 5, 0, 15] }
                    );
                }

                if (section.type === 'experience' && resumeData.experience.length > 0) {
                    content.push({ text: section.name.toUpperCase(), style: 'sectionHeader' });
                    resumeData.experience.forEach((exp: any) => {
                        content.push({
                            stack: [
                                {
                                    columns: [
                                        { text: exp.title, bold: true, width: '*' },
                                        {
                                            text: `${formatMonthYear(exp.startDate)} - ${exp.current ? 'Present' : formatMonthYear(exp.endDate)}`,
                                            alignment: 'right',
                                            width: 'auto'
                                        },
                                    ],
                                },
                                { text: `${exp.company} | ${exp.location}`, italics: true, margin: [0, 2, 0, 5] },
                                {
                                    ul: exp.bullets.filter((b: string) => b.trim()),
                                    margin: [0, 5, 0, 10],
                                },
                            ],
                            margin: [0, 0, 0, 15],
                        });
                    });
                }

                if (section.type === 'education' && resumeData.education.length > 0) {
                    content.push({ text: section.name.toUpperCase(), style: 'sectionHeader' });
                    resumeData.education.forEach((edu: any) => {
                        content.push({
                            stack: [
                                {
                                    columns: [
                                        { text: `${edu.degree} ${edu.field}`, bold: true, width: '*' },
                                        { text: formatMonthYear(edu.graduationDate), alignment: 'right', width: 'auto' },
                                    ],
                                },
                                { text: `${edu.school} | ${edu.location}`, italics: true, margin: [0, 2, 0, 10] },
                            ],
                        });
                    });
                }

                if (section.type === 'skills' && resumeData.skills.technical.length > 0) {
                    content.push(
                        { text: section.name.toUpperCase(), style: 'sectionHeader', margin: [0, 15, 0, 5] },
                        {
                            text: resumeData.skills.technical.join(', '),
                            margin: [0, 0, 0, 5],
                        }
                    );
                }
            });

            const docDefinition: any = {
                content,
                styles: {
                    header: {
                        fontSize: 24,
                        bold: true,
                        color: '#1a1a1a',
                    },
                    contact: {
                        fontSize: 10,
                        color: '#4a4a4a',
                    },
                    sectionHeader: {
                        fontSize: 14,
                        bold: true,
                        color: '#1a1a1a',
                        margin: [0, 10, 0, 5],
                    },
                },
            };

            pdfMake.createPdf(docDefinition).download(`${resumeData.personalInfo.name}_Resume.pdf`);
            toast.success('PDF downloaded! 📄');
        } catch (error) {
            console.error('PDF generation error:', error);
            toast.error('Failed to generate PDF');
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

    const sortedSections = [...sections].sort((a, b) => a.order - b.order);

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
                            <h1 className="text-sm font-semibold text-gray-900">
                                {jobAnalysis?.title || 'Resume Editor'}
                            </h1>
                            <p className="text-xs text-gray-500">
                                {jobAnalysis?.company || 'Untitled'}
                            </p>
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
                                                                value={exp.bullets[0] || ''}
                                                                onChange={(e) => updateExperience(idx, 'bullets', [e.target.value])}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400 resize-none"
                                                                placeholder="Key achievements (one per line)"
                                                                rows={2}
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
                    <div className="bg-gray-100 rounded-lg overflow-hidden sticky top-24" style={{ maxHeight: 'calc(100vh - 120px)' }}>
                        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                            <h2 className="text-sm font-semibold text-gray-700">👁️ Live Preview</h2>
                        </div>

                        {/* PDF Viewer Container */}
                        <div className="p-6 overflow-y-auto bg-gray-100" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                            {/* Paper with shadow - Letter size (8.5" x 11") */}
                            <div
                                className="bg-white mx-auto shadow-2xl"
                                style={{
                                    width: '8.5in',
                                    minHeight: '11in',
                                    transform: 'scale(0.65)',
                                    transformOrigin: 'top center',
                                    marginBottom: '-200px',
                                }}
                            >
                                <div
                                    style={{
                                        fontFamily: FONT_STACKS[settings.fontFamily],
                                        lineHeight: settings.lineSpacing,
                                        paddingTop: `${settings.margins.top}in`,
                                        paddingBottom: `${settings.margins.bottom}in`,
                                        paddingLeft: `${settings.margins.left}in`,
                                        paddingRight: `${settings.margins.right}in`,
                                    }}
                                >
                                    {/* Header */}
                                    <div className={`${settings.alignment === 'center' ? 'text-center' : 'text-left'}`} style={{ marginBottom: `${settings.sectionSpacing * 1.5}pt` }}>
                                        <h1
                                            className="font-bold"
                                            style={{
                                                fontSize: `${settings.fontSize.name}pt`,
                                                color: settings.fontColor.name,
                                                marginBottom: '4pt',
                                            }}
                                        >
                                            {resumeData.personalInfo.name || 'Your Name'}
                                        </h1>
                                        <p
                                            style={{
                                                fontSize: `${settings.fontSize.contact}pt`,
                                                color: settings.fontColor.contact,
                                            }}
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
                                            ].filter(Boolean).reduce((acc, item, idx, arr) => {
                                                if (idx === 0) return [item];
                                                return [...acc, ` ${settings.contactSeparator} `, item];
                                            }, [] as any[])}
                                        </p>
                                    </div>

                                    {/* Dynamic Sections */}
                                    {sortedSections.map(section => {
                                        if (!section.visible) return null;

                                        return (
                                            <div key={section.id}>
                                                {section.type === 'summary' && resumeData.summary && (
                                                    <div style={{ marginBottom: `${settings.sectionSpacing}pt` }}>
                                                        <h2
                                                            className={settings.headerStyle === 'bold' ? 'font-bold' : ''}
                                                            style={{
                                                                fontSize: `${settings.fontSize.headers}pt`,
                                                                color: settings.fontColor.headers,
                                                                marginBottom: `${settings.paragraphSpacing}pt`,
                                                                paddingBottom: '2pt',
                                                                borderBottom: settings.sectionDivider ? `${settings.dividerWeight}px solid ${settings.dividerColor}` : 'none',
                                                            }}
                                                        >
                                                            {settings.headerCase === 'UPPERCASE' ? section.name.toUpperCase() : section.name}
                                                        </h2>
                                                        <p style={{ fontSize: `${settings.fontSize.body}pt`, color: settings.fontColor.body }}>{parseFormattedText(resumeData.summary)}</p>
                                                    </div>
                                                )}

                                                {section.type === 'experience' && resumeData.experience.length > 0 && (
                                                    <div style={{ marginBottom: `${settings.sectionSpacing}pt` }}>
                                                        <h2
                                                            className={settings.headerStyle === 'bold' ? 'font-bold' : ''}
                                                            style={{
                                                                fontSize: `${settings.fontSize.headers}pt`,
                                                                color: settings.fontColor.headers,
                                                                marginBottom: `${settings.paragraphSpacing}pt`,
                                                                paddingBottom: '2pt',
                                                                borderBottom: settings.sectionDivider ? `${settings.dividerWeight}px solid ${settings.dividerColor}` : 'none',
                                                            }}
                                                        >
                                                            {settings.headerCase === 'UPPERCASE' ? section.name.toUpperCase() : section.name}
                                                        </h2>
                                                        {resumeData.experience.map((exp, index) => (
                                                            <div key={index} style={{ marginBottom: `${settings.paragraphSpacing}pt` }}>
                                                                <div className="flex justify-between items-start" style={{ marginBottom: '2pt' }}>
                                                                    <h3 className="font-bold" style={{ fontSize: `${settings.fontSize.body}pt`, color: settings.fontColor.body }}>{exp.title}</h3>
                                                                    <span className="whitespace-nowrap ml-3" style={{ fontSize: `${settings.fontSize.body}pt`, color: settings.fontColor.contact }}>
                                                                        {formatMonthYear(exp.startDate)} - {exp.current ? 'Present' : formatMonthYear(exp.endDate)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between items-start" style={{ marginBottom: '4pt' }}>
                                                                    <p className="italic" style={{ fontSize: `${settings.fontSize.body}pt`, color: settings.fontColor.contact }}>
                                                                        {exp.company}
                                                                    </p>
                                                                    <p className="italic whitespace-nowrap ml-3" style={{ fontSize: `${settings.fontSize.body}pt`, color: settings.fontColor.contact }}>
                                                                        {exp.location}
                                                                    </p>
                                                                </div>
                                                                <ul className="list-inside" style={{ fontSize: `${settings.fontSize.body}pt`, color: settings.fontColor.body, paddingLeft: '20px' }}>
                                                                    {exp.bullets.filter((b: string) => b.trim()).map((bullet: string, i: number) => (
                                                                        <li key={i} style={{ marginBottom: '2pt' }}>{settings.bulletStyle} {parseFormattedText(bullet)}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {section.type === 'education' && resumeData.education.length > 0 && (
                                                    <div style={{ marginBottom: `${settings.sectionSpacing}pt` }}>
                                                        <h2
                                                            className={settings.headerStyle === 'bold' ? 'font-bold' : ''}
                                                            style={{
                                                                fontSize: `${settings.fontSize.headers}pt`,
                                                                color: settings.fontColor.headers,
                                                                marginBottom: `${settings.paragraphSpacing}pt`,
                                                                paddingBottom: '2pt',
                                                                borderBottom: settings.sectionDivider ? `${settings.dividerWeight}px solid ${settings.dividerColor}` : 'none',
                                                            }}
                                                        >
                                                            {settings.headerCase === 'UPPERCASE' ? section.name.toUpperCase() : section.name}
                                                        </h2>
                                                        {resumeData.education.map((edu, index) => (
                                                            <div key={index} style={{ marginBottom: `${settings.paragraphSpacing}pt` }}>
                                                                <div className="flex justify-between items-start" style={{ marginBottom: '2pt' }}>
                                                                    <h3 className="font-bold" style={{ fontSize: `${settings.fontSize.body}pt`, color: settings.fontColor.body }}>{edu.degree} {edu.field}</h3>
                                                                    <span className="whitespace-nowrap ml-3" style={{ fontSize: `${settings.fontSize.body}pt`, color: settings.fontColor.contact }}>{formatMonthYear(edu.graduationDate)}</span>
                                                                </div>
                                                                <div className="flex justify-between items-start">
                                                                    <p className="italic" style={{ fontSize: `${settings.fontSize.body}pt`, color: settings.fontColor.contact }}>
                                                                        {edu.school}
                                                                    </p>
                                                                    <p className="italic whitespace-nowrap ml-3" style={{ fontSize: `${settings.fontSize.body}pt`, color: settings.fontColor.contact }}>
                                                                        {edu.location}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {section.type === 'skills' && resumeData.skills.technical.length > 0 && (
                                                    <div style={{ marginBottom: `${settings.sectionSpacing}pt` }}>
                                                        <h2
                                                            className={settings.headerStyle === 'bold' ? 'font-bold' : ''}
                                                            style={{
                                                                fontSize: `${settings.fontSize.headers}pt`,
                                                                color: settings.fontColor.headers,
                                                                marginBottom: `${settings.paragraphSpacing}pt`,
                                                                paddingBottom: '2pt',
                                                                borderBottom: settings.sectionDivider ? `${settings.dividerWeight}px solid ${settings.dividerColor}` : 'none',
                                                            }}
                                                        >
                                                            {settings.headerCase === 'UPPERCASE' ? section.name.toUpperCase() : section.name}
                                                        </h2>
                                                        <div>
                                                            {resumeData.skills.technical.map((skillLine, idx) => (
                                                                <p
                                                                    key={idx}
                                                                    style={{
                                                                        fontSize: `${settings.fontSize.body}pt`,
                                                                        color: settings.fontColor.body,
                                                                        lineHeight: settings.lineSpacing,
                                                                        marginBottom: idx < resumeData.skills.technical.length - 1 ? '4pt' : '0',
                                                                        textAlign: 'left',
                                                                        wordSpacing: 'normal',
                                                                    }}
                                                                >
                                                                    {parseFormattedText(skillLine)}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div> {/* Close content div (line 867) */}
                            </div> {/* Close paper div (line 857) */}
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

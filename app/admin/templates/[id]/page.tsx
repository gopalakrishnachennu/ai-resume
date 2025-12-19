'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { TemplateService } from '@/lib/services/templateService';
import {
    TemplateSchema,
    TemplateRow,
    TemplateField,
    SectionType,
    HEADER_FIELDS,
    EXPERIENCE_FIELDS,
    EDUCATION_FIELDS,
    createEmptyRow,
    createField,
} from '@/lib/types/templateSchema';
import { toast } from 'react-hot-toast';

// Font options
const FONT_OPTIONS = [
    'Roboto', 'Inter', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
    'Source Sans Pro', 'Raleway', 'Nunito', 'Work Sans', 'Arial', 'Times New Roman',
];

export default function TemplateEditorPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const templateId = params.id as string;

    const [template, setTemplate] = useState<TemplateSchema | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'header' | 'sections' | 'experience' | 'education' | 'skills' | 'styles'>('general');

    useEffect(() => {
        loadTemplate();
    }, [templateId]);

    const loadTemplate = async () => {
        setLoading(true);
        try {
            const t = await TemplateService.getTemplateById(templateId);
            if (!t) {
                toast.error('Template not found');
                router.push('/admin/templates');
                return;
            }
            setTemplate(t);
        } catch (error) {
            console.error('Error loading template:', error);
            toast.error('Failed to load template');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!template) return;
        setSaving(true);
        try {
            // Check if it's a built-in template
            if (template.id === 'ats-default' || template.id === 'modern-default') {
                toast.error('Cannot save built-in templates. Clone it first!');
                setSaving(false);
                return;
            }
            await TemplateService.updateTemplate(template.id, template);
            toast.success('Template saved!');
        } catch (error: any) {
            console.error('Error saving template:', error);
            toast.error(error.message || 'Failed to save template');
        } finally {
            setSaving(false);
        }
    };

    const updateTemplate = (updates: Partial<TemplateSchema>) => {
        if (!template) return;
        setTemplate({ ...template, ...updates });
    };

    // === ROW EDITOR COMPONENT ===
    const RowEditor = ({
        rows,
        fieldOptions,
        onChange,
        label,
    }: {
        rows: TemplateRow[];
        fieldOptions: readonly string[];
        onChange: (rows: TemplateRow[]) => void;
        label: string;
    }) => {
        const addRow = () => {
            onChange([...rows, createEmptyRow()]);
        };

        const removeRow = (index: number) => {
            onChange(rows.filter((_, i) => i !== index));
        };

        const updateRow = (index: number, updates: Partial<TemplateRow>) => {
            const newRows = [...rows];
            newRows[index] = { ...newRows[index], ...updates };
            onChange(newRows);
        };

        const addField = (rowIndex: number) => {
            const newRows = [...rows];
            const availableFields = fieldOptions.filter(
                f => !newRows[rowIndex].fields.some(ef => ef.name === f)
            );
            if (availableFields.length === 0) return;
            newRows[rowIndex].fields.push(createField(availableFields[0]));
            onChange(newRows);
        };

        const removeField = (rowIndex: number, fieldIndex: number) => {
            const newRows = [...rows];
            newRows[rowIndex].fields.splice(fieldIndex, 1);
            onChange(newRows);
        };

        const updateField = (rowIndex: number, fieldIndex: number, updates: Partial<TemplateField>) => {
            const newRows = [...rows];
            newRows[rowIndex].fields[fieldIndex] = { ...newRows[rowIndex].fields[fieldIndex], ...updates };
            onChange(newRows);
        };

        return (
            <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700">{label}</label>
                {rows.map((row, rowIndex) => (
                    <div key={rowIndex} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-slate-600">Row {rowIndex + 1}</span>
                            <div className="flex items-center gap-2">
                                <select
                                    value={row.align}
                                    onChange={e => updateRow(rowIndex, { align: e.target.value as any })}
                                    className="text-xs px-2 py-1 border rounded"
                                >
                                    <option value="left">Left</option>
                                    <option value="center">Center</option>
                                    <option value="right">Right</option>
                                    <option value="space-between">Space Between</option>
                                </select>
                                {rows.length > 1 && (
                                    <button
                                        onClick={() => removeRow(rowIndex)}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 items-center">
                            {row.fields.map((field, fieldIndex) => (
                                <div key={fieldIndex} className="flex items-center gap-1 bg-white border rounded-lg p-2">
                                    <select
                                        value={field.name}
                                        onChange={e => updateField(rowIndex, fieldIndex, { name: e.target.value })}
                                        className="text-sm border-none bg-transparent focus:ring-0"
                                    >
                                        {fieldOptions.map(f => (
                                            <option key={f} value={f}>{f}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={field.style}
                                        onChange={e => updateField(rowIndex, fieldIndex, { style: e.target.value as any })}
                                        className="text-xs px-1 py-0.5 border rounded"
                                        title="Style"
                                    >
                                        <option value="normal">Normal</option>
                                        <option value="bold">Bold</option>
                                        <option value="italic">Italic</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={field.separator}
                                        onChange={e => updateField(rowIndex, fieldIndex, { separator: e.target.value })}
                                        placeholder="sep"
                                        className="w-12 text-xs px-1 py-0.5 border rounded text-center"
                                        title="Separator after field"
                                    />
                                    <button
                                        onClick={() => removeField(rowIndex, fieldIndex)}
                                        className="text-red-400 hover:text-red-600"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => addField(rowIndex)}
                                className="px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                            >
                                + Field
                            </button>
                        </div>
                    </div>
                ))}
                <button
                    onClick={addRow}
                    className="w-full py-2 border-2 border-dashed border-slate-300 text-slate-500 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                    + Add Row
                </button>
            </div>
        );
    };

    // === SECTION ORDER EDITOR ===
    const SectionOrderEditor = () => {
        const allSections: SectionType[] = ['summary', 'skills', 'experience', 'education', 'custom'];
        const currentOrder = template?.sectionOrder || [];

        const moveSection = (index: number, direction: 'up' | 'down') => {
            const newOrder = [...currentOrder];
            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            if (targetIndex < 0 || targetIndex >= newOrder.length) return;
            [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
            updateTemplate({ sectionOrder: newOrder });
        };

        const toggleSection = (section: SectionType) => {
            if (currentOrder.includes(section)) {
                updateTemplate({ sectionOrder: currentOrder.filter(s => s !== section) });
            } else {
                updateTemplate({ sectionOrder: [...currentOrder, section] });
            }
        };

        return (
            <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700">Section Order</label>
                <div className="space-y-2">
                    {currentOrder.map((section, index) => (
                        <div
                            key={section}
                            className="flex items-center justify-between bg-white border rounded-lg p-3"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-lg">
                                    {section === 'summary' && '📝'}
                                    {section === 'skills' && '🛠️'}
                                    {section === 'experience' && '💼'}
                                    {section === 'education' && '🎓'}
                                    {section === 'custom' && '📋'}
                                </span>
                                <span className="font-medium capitalize">{section}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => moveSection(index, 'up')}
                                    disabled={index === 0}
                                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                                >
                                    ↑
                                </button>
                                <button
                                    onClick={() => moveSection(index, 'down')}
                                    disabled={index === currentOrder.length - 1}
                                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                                >
                                    ↓
                                </button>
                                <button
                                    onClick={() => toggleSection(section)}
                                    className="p-1 text-red-400 hover:text-red-600 ml-2"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add hidden sections */}
                {allSections.filter(s => !currentOrder.includes(s)).length > 0 && (
                    <div className="pt-2 border-t">
                        <p className="text-xs text-slate-500 mb-2">Hidden sections (click to add):</p>
                        <div className="flex flex-wrap gap-2">
                            {allSections.filter(s => !currentOrder.includes(s)).map(section => (
                                <button
                                    key={section}
                                    onClick={() => toggleSection(section)}
                                    className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm hover:bg-blue-100 hover:text-blue-600"
                                >
                                    + {section}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!template) return null;

    const isBuiltIn = template.id === 'ats-default' || template.id === 'modern-default';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/templates" className="text-slate-600 hover:text-slate-900">
                            ← Back
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">{template.name}</h1>
                            {isBuiltIn && (
                                <span className="text-xs text-amber-600">Built-in template (clone to edit)</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {template.atsCompatible && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                                ATS Compatible ✓
                            </span>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={saving || isBuiltIn}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-6">
                {/* Built-in Warning */}
                {isBuiltIn && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <p className="text-amber-800">
                            ⚠️ This is a built-in template. To make changes, clone it first from the template list.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-12 gap-6">
                    {/* Sidebar - Tabs */}
                    <div className="col-span-3">
                        <nav className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            {[
                                { id: 'general', label: '📋 General', icon: '' },
                                { id: 'header', label: '👤 Header', icon: '' },
                                { id: 'sections', label: '📑 Sections', icon: '' },
                                { id: 'experience', label: '💼 Experience', icon: '' },
                                { id: 'education', label: '🎓 Education', icon: '' },
                                { id: 'skills', label: '🛠️ Skills', icon: '' },
                                { id: 'styles', label: '🎨 Styles', icon: '' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`w-full px-4 py-3 text-left font-medium transition-colors ${activeTab === tab.id
                                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                                            : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Main Content */}
                    <div className="col-span-9">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            {/* General Tab */}
                            {activeTab === 'general' && (
                                <div className="space-y-6">
                                    <h2 className="text-lg font-bold text-slate-900">General Settings</h2>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Template Name</label>
                                        <input
                                            type="text"
                                            value={template.name}
                                            onChange={e => updateTemplate({ name: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                                            disabled={isBuiltIn}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                        <textarea
                                            value={template.description}
                                            onChange={e => updateTemplate({ description: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                                            rows={3}
                                            disabled={isBuiltIn}
                                        />
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={template.atsCompatible}
                                                onChange={e => updateTemplate({ atsCompatible: e.target.checked })}
                                                className="rounded"
                                                disabled={isBuiltIn}
                                            />
                                            <span className="text-sm">ATS Compatible</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={template.hideEmptySections}
                                                onChange={e => updateTemplate({ hideEmptySections: e.target.checked })}
                                                className="rounded"
                                                disabled={isBuiltIn}
                                            />
                                            <span className="text-sm">Hide Empty Sections</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Header Tab */}
                            {activeTab === 'header' && (
                                <div className="space-y-6">
                                    <h2 className="text-lg font-bold text-slate-900">Header Layout</h2>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Name Alignment</label>
                                        <div className="flex gap-2">
                                            {['left', 'center', 'right'].map(align => (
                                                <button
                                                    key={align}
                                                    onClick={() => updateTemplate({
                                                        header: { ...template.header, nameAlign: align as any }
                                                    })}
                                                    className={`px-4 py-2 rounded-lg capitalize ${template.header.nameAlign === align
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-slate-100 text-slate-700'
                                                        }`}
                                                    disabled={isBuiltIn}
                                                >
                                                    {align}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Name Style</label>
                                        <select
                                            value={template.header.nameStyle}
                                            onChange={e => updateTemplate({
                                                header: { ...template.header, nameStyle: e.target.value as any }
                                            })}
                                            className="w-full px-4 py-2 border rounded-xl"
                                            disabled={isBuiltIn}
                                        >
                                            <option value="normal">Normal</option>
                                            <option value="bold">Bold</option>
                                            <option value="uppercase">Uppercase</option>
                                            <option value="bold-uppercase">Bold + Uppercase</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={template.header.showIcons}
                                                onChange={e => updateTemplate({
                                                    header: { ...template.header, showIcons: e.target.checked }
                                                })}
                                                className="rounded"
                                                disabled={isBuiltIn}
                                            />
                                            <span className="text-sm">Show Icons</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={template.header.hideEmptyFields}
                                                onChange={e => updateTemplate({
                                                    header: { ...template.header, hideEmptyFields: e.target.checked }
                                                })}
                                                className="rounded"
                                                disabled={isBuiltIn}
                                            />
                                            <span className="text-sm">Hide Empty Fields</span>
                                        </label>
                                    </div>

                                    <RowEditor
                                        rows={template.header.contactRows}
                                        fieldOptions={HEADER_FIELDS}
                                        onChange={rows => updateTemplate({
                                            header: { ...template.header, contactRows: rows }
                                        })}
                                        label="Contact Rows"
                                    />
                                </div>
                            )}

                            {/* Sections Tab */}
                            {activeTab === 'sections' && (
                                <div className="space-y-6">
                                    <h2 className="text-lg font-bold text-slate-900">Section Configuration</h2>

                                    <SectionOrderEditor />

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Section Header Style</label>
                                        <select
                                            value={template.sectionHeaders.style}
                                            onChange={e => updateTemplate({
                                                sectionHeaders: { ...template.sectionHeaders, style: e.target.value as any }
                                            })}
                                            className="w-full px-4 py-2 border rounded-xl"
                                            disabled={isBuiltIn}
                                        >
                                            <option value="bold">Bold</option>
                                            <option value="uppercase">Uppercase</option>
                                            <option value="bold-uppercase">Bold + Uppercase</option>
                                            <option value="underline">Underline</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={template.sectionHeaders.divider}
                                                onChange={e => updateTemplate({
                                                    sectionHeaders: { ...template.sectionHeaders, divider: e.target.checked }
                                                })}
                                                className="rounded"
                                                disabled={isBuiltIn}
                                            />
                                            <span className="text-sm">Show Divider</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Experience Tab */}
                            {activeTab === 'experience' && (
                                <div className="space-y-6">
                                    <h2 className="text-lg font-bold text-slate-900">Experience Layout</h2>

                                    <RowEditor
                                        rows={template.experience.rows}
                                        fieldOptions={EXPERIENCE_FIELDS}
                                        onChange={rows => updateTemplate({
                                            experience: { ...template.experience, rows }
                                        })}
                                        label="Experience Item Rows"
                                    />

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Bullet Style</label>
                                        <div className="flex gap-2">
                                            {['•', '-', '▸', '◦', '→'].map(bullet => (
                                                <button
                                                    key={bullet}
                                                    onClick={() => updateTemplate({
                                                        experience: { ...template.experience, bulletStyle: bullet as any }
                                                    })}
                                                    className={`w-10 h-10 rounded-lg text-lg ${template.experience.bulletStyle === bullet
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-slate-100 text-slate-700'
                                                        }`}
                                                    disabled={isBuiltIn}
                                                >
                                                    {bullet}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={template.experience.wrapLongText}
                                            onChange={e => updateTemplate({
                                                experience: { ...template.experience, wrapLongText: e.target.checked }
                                            })}
                                            className="rounded"
                                            disabled={isBuiltIn}
                                        />
                                        <span className="text-sm">Wrap Long Text (recommended for ATS)</span>
                                    </label>
                                </div>
                            )}

                            {/* Education Tab */}
                            {activeTab === 'education' && (
                                <div className="space-y-6">
                                    <h2 className="text-lg font-bold text-slate-900">Education Layout</h2>

                                    <RowEditor
                                        rows={template.education.rows}
                                        fieldOptions={EDUCATION_FIELDS}
                                        onChange={rows => updateTemplate({
                                            education: { ...template.education, rows }
                                        })}
                                        label="Education Item Rows"
                                    />

                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={template.education.showGPA}
                                            onChange={e => updateTemplate({
                                                education: { ...template.education, showGPA: e.target.checked }
                                            })}
                                            className="rounded"
                                            disabled={isBuiltIn}
                                        />
                                        <span className="text-sm">Show GPA</span>
                                    </label>
                                </div>
                            )}

                            {/* Skills Tab */}
                            {activeTab === 'skills' && (
                                <div className="space-y-6">
                                    <h2 className="text-lg font-bold text-slate-900">Skills Layout</h2>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Layout Style</label>
                                        <div className="flex gap-2">
                                            {['inline', 'bullets', 'categories'].map(layout => (
                                                <button
                                                    key={layout}
                                                    onClick={() => updateTemplate({
                                                        skills: { ...template.skills, layout: layout as any }
                                                    })}
                                                    className={`px-4 py-2 rounded-lg capitalize ${template.skills.layout === layout
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-slate-100 text-slate-700'
                                                        }`}
                                                    disabled={isBuiltIn}
                                                >
                                                    {layout}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Separator</label>
                                        <input
                                            type="text"
                                            value={template.skills.separator}
                                            onChange={e => updateTemplate({
                                                skills: { ...template.skills, separator: e.target.value }
                                            })}
                                            className="w-32 px-4 py-2 border rounded-xl"
                                            placeholder=", "
                                            disabled={isBuiltIn}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Styles Tab */}
                            {activeTab === 'styles' && (
                                <div className="space-y-6">
                                    <h2 className="text-lg font-bold text-slate-900">Typography & Colors</h2>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Font Family</label>
                                        <select
                                            value={template.typography.fontFamily}
                                            onChange={e => updateTemplate({
                                                typography: { ...template.typography, fontFamily: e.target.value }
                                            })}
                                            className="w-full px-4 py-2 border rounded-xl"
                                            disabled={isBuiltIn}
                                        >
                                            {FONT_OPTIONS.map(font => (
                                                <option key={font} value={font}>{font}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Name Size</label>
                                            <input
                                                type="number"
                                                value={template.typography.sizes.name}
                                                onChange={e => updateTemplate({
                                                    typography: {
                                                        ...template.typography,
                                                        sizes: { ...template.typography.sizes, name: parseInt(e.target.value) }
                                                    }
                                                })}
                                                className="w-full px-3 py-2 border rounded-lg"
                                                disabled={isBuiltIn}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Header Size</label>
                                            <input
                                                type="number"
                                                value={template.typography.sizes.sectionHeader}
                                                onChange={e => updateTemplate({
                                                    typography: {
                                                        ...template.typography,
                                                        sizes: { ...template.typography.sizes, sectionHeader: parseInt(e.target.value) }
                                                    }
                                                })}
                                                className="w-full px-3 py-2 border rounded-lg"
                                                disabled={isBuiltIn}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Title Size</label>
                                            <input
                                                type="number"
                                                value={template.typography.sizes.itemTitle}
                                                onChange={e => updateTemplate({
                                                    typography: {
                                                        ...template.typography,
                                                        sizes: { ...template.typography.sizes, itemTitle: parseInt(e.target.value) }
                                                    }
                                                })}
                                                className="w-full px-3 py-2 border rounded-lg"
                                                disabled={isBuiltIn}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Body Size</label>
                                            <input
                                                type="number"
                                                value={template.typography.sizes.body}
                                                onChange={e => updateTemplate({
                                                    typography: {
                                                        ...template.typography,
                                                        sizes: { ...template.typography.sizes, body: parseInt(e.target.value) }
                                                    }
                                                })}
                                                className="w-full px-3 py-2 border rounded-lg"
                                                disabled={isBuiltIn}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-5 gap-4">
                                        {Object.entries(template.typography.colors).map(([key, value]) => (
                                            <div key={key}>
                                                <label className="block text-xs font-medium text-slate-600 mb-1 capitalize">{key}</label>
                                                <input
                                                    type="color"
                                                    value={value}
                                                    onChange={e => updateTemplate({
                                                        typography: {
                                                            ...template.typography,
                                                            colors: { ...template.typography.colors, [key]: e.target.value }
                                                        }
                                                    })}
                                                    className="w-full h-10 rounded-lg cursor-pointer"
                                                    disabled={isBuiltIn}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Date Format</label>
                                        <select
                                            value={template.dateFormat}
                                            onChange={e => updateTemplate({ dateFormat: e.target.value as any })}
                                            className="w-full px-4 py-2 border rounded-xl"
                                            disabled={isBuiltIn}
                                        >
                                            <option value="MMM YYYY">Jan 2024</option>
                                            <option value="MM/YYYY">01/2024</option>
                                            <option value="MMMM YYYY">January 2024</option>
                                            <option value="YYYY">2024</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Margin Top (in)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={template.page.margins.top}
                                                onChange={e => updateTemplate({
                                                    page: {
                                                        ...template.page,
                                                        margins: { ...template.page.margins, top: parseFloat(e.target.value) }
                                                    }
                                                })}
                                                className="w-full px-3 py-2 border rounded-lg"
                                                disabled={isBuiltIn}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Margin Bottom</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={template.page.margins.bottom}
                                                onChange={e => updateTemplate({
                                                    page: {
                                                        ...template.page,
                                                        margins: { ...template.page.margins, bottom: parseFloat(e.target.value) }
                                                    }
                                                })}
                                                className="w-full px-3 py-2 border rounded-lg"
                                                disabled={isBuiltIn}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Margin Left</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={template.page.margins.left}
                                                onChange={e => updateTemplate({
                                                    page: {
                                                        ...template.page,
                                                        margins: { ...template.page.margins, left: parseFloat(e.target.value) }
                                                    }
                                                })}
                                                className="w-full px-3 py-2 border rounded-lg"
                                                disabled={isBuiltIn}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Margin Right</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={template.page.margins.right}
                                                onChange={e => updateTemplate({
                                                    page: {
                                                        ...template.page,
                                                        margins: { ...template.page.margins, right: parseFloat(e.target.value) }
                                                    }
                                                })}
                                                className="w-full px-3 py-2 border rounded-lg"
                                                disabled={isBuiltIn}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { ResumeSettings } from '@/lib/types/resumeSettings';
import { TemplateService } from '@/lib/services/templateService';
import { TemplateSchema } from '@/lib/types/templateSchema';

interface SettingsPanelProps {
    settings: ResumeSettings;
    onSettingsChange: (settings: ResumeSettings) => void;
    onClose: () => void;
}

export default function SettingsPanel({ settings, onSettingsChange, onClose }: SettingsPanelProps) {
    const [customTemplates, setCustomTemplates] = useState<TemplateSchema[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);

    // Load custom templates on mount
    useEffect(() => {
        const loadTemplates = async () => {
            setLoadingTemplates(true);
            try {
                const templates = await TemplateService.getPublishedTemplates();
                // Filter out the built-in ones (we show those separately)
                setCustomTemplates(templates.filter(t =>
                    t.id !== 'ats-default' && t.id !== 'modern-default'
                ));
            } catch (error) {
                console.error('Failed to load templates:', error);
            } finally {
                setLoadingTemplates(false);
            }
        };
        loadTemplates();
    }, []);

    const updateSetting = (path: string, value: any) => {
        const keys = path.split('.');
        const newSettings = { ...settings };

        if (keys.length === 1) {
            (newSettings as any)[keys[0]] = value;
        } else if (keys.length === 2) {
            (newSettings as any)[keys[0]] = {
                ...(newSettings as any)[keys[0]],
                [keys[1]]: value,
            };
        }

        onSettingsChange(newSettings);
    };

    const selectCustomTemplate = async (templateId: string) => {
        // Load the template and apply its settings
        try {
            const template = customTemplates.find(t => t.id === templateId);
            if (!template) return;

            // Map template settings to ResumeSettings format
            const newSettings: ResumeSettings = {
                ...settings,
                selectedTemplateId: templateId,
                // Typography
                fontFamily: (template.typography?.fontFamily || settings.fontFamily) as any,
                fontSize: {
                    name: template.typography?.sizes?.name || settings.fontSize.name,
                    headers: template.typography?.sizes?.sectionHeader || settings.fontSize.headers,
                    body: template.typography?.sizes?.body || settings.fontSize.body,
                    contact: template.typography?.sizes?.body || settings.fontSize.contact,
                },
                fontColor: {
                    name: template.typography?.colors?.name || settings.fontColor.name,
                    headers: template.typography?.colors?.headers || settings.fontColor.headers,
                    body: template.typography?.colors?.body || settings.fontColor.body,
                    contact: template.typography?.colors?.body || settings.fontColor.contact,
                    accent: template.typography?.colors?.accent || settings.fontColor.accent,
                },
                // Margins
                margins: template.page?.margins || settings.margins,
                lineSpacing: template.page?.lineSpacing || settings.lineSpacing,
                sectionSpacing: template.experience?.spacing?.beforeItem || settings.sectionSpacing,
                paragraphSpacing: template.experience?.spacing?.afterItem || settings.paragraphSpacing,
                // Other settings - map to compatible types
                bulletStyle: ['•', '-', '◦', '➤', '◆', '★', '❀', '■', '▸', '›'].includes(template.experience?.bulletStyle || '')
                    ? (template.experience?.bulletStyle as any)
                    : settings.bulletStyle,
                sectionDivider: template.sectionHeaders?.divider ?? settings.sectionDivider,
                headerStyle: template.sectionHeaders?.style?.includes('bold') ? 'bold' : 'regular',
                headerCase: template.sectionHeaders?.style?.includes('uppercase') ? 'UPPERCASE' : 'Title Case',
                alignment: (template.header?.nameAlign === 'left' || template.header?.nameAlign === 'center')
                    ? template.header.nameAlign
                    : settings.alignment,
                bodyAlignment: template.typography?.bodyAlignment || settings.bodyAlignment,
                dateFormat: (template.dateFormat as any) || settings.dateFormat,
            };

            onSettingsChange(newSettings);
        } catch (error) {
            console.error('Error applying template:', error);
            // Fallback: just set the template ID
            onSettingsChange({
                ...settings,
                selectedTemplateId: templateId,
            });
        }
    };

    const clearCustomTemplate = () => {
        // Remove custom template selection
        const { selectedTemplateId, ...rest } = settings;
        onSettingsChange(rest as ResumeSettings);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-white/20 animate-slideUp">
                {/* Header with animated gradient */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white px-6 py-5 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(99,102,241,0.15),transparent_50%)]"></div>
                    <div className="relative z-10">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="bg-white/10 p-1.5 rounded-lg">⚙️</span>
                            Resume Settings
                        </h2>
                        <p className="text-xs text-indigo-300 mt-1 font-medium">ATS-Optimized Formatting</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="relative z-10 w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-200 hover:scale-105"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-slate-50 to-white">
                    {/* Template Selection */}
                    <div className="border border-indigo-100 rounded-xl p-5 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/50 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="text-indigo-600">🎨</span> Template Style
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => {
                                    // Clear custom template when selecting Classic
                                    onSettingsChange({ ...settings, template: 'classic', selectedTemplateId: undefined });
                                }}
                                className={`p-4 rounded-lg border-2 transition-all ${settings.template === 'classic' && !settings.selectedTemplateId
                                    ? 'border-indigo-600 bg-white shadow-md'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                            >
                                <div className="text-center">
                                    <p className="font-bold text-gray-900">Classic</p>
                                    <p className="text-xs text-gray-500 mt-1">Centered header, traditional layout</p>
                                </div>
                            </button>
                            <button
                                onClick={() => {
                                    // Clear custom template when selecting Modern
                                    onSettingsChange({ ...settings, template: 'modern', selectedTemplateId: undefined });
                                }}
                                className={`p-4 rounded-lg border-2 transition-all ${settings.template === 'modern' && !settings.selectedTemplateId
                                    ? 'border-indigo-600 bg-white shadow-md'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                            >
                                <div className="text-center">
                                    <p className="font-bold text-gray-900">Modern</p>
                                    <p className="text-xs text-gray-500 mt-1">Left-aligned, accent colors</p>
                                </div>
                            </button>
                        </div>
                        {settings.template === 'modern' && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Accent Color
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={settings.fontColor.accent}
                                        onChange={(e) => updateSetting('fontColor.accent', e.target.value)}
                                        className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-600">
                                        Used for section headings & name
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Custom Templates */}
                        {customTemplates.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-sm font-medium text-gray-700 mb-3">Custom Templates</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {customTemplates.map(template => (
                                        <button
                                            key={template.id}
                                            onClick={() => selectCustomTemplate(template.id)}
                                            className={`p-3 rounded-lg border-2 transition-all text-left ${settings.selectedTemplateId === template.id
                                                ? 'border-indigo-600 bg-indigo-50 shadow-md'
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium text-gray-900 text-sm">{template.name}</p>
                                                {template.atsCompatible && (
                                                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">ATS</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{template.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {loadingTemplates && (
                            <div className="mt-4 text-center text-sm text-gray-500">
                                Loading custom templates...
                            </div>
                        )}
                    </div>

                    {/* Font Settings */}
                    <div className="border border-blue-100 rounded-xl p-5 bg-gradient-to-br from-blue-50/50 via-white to-cyan-50/30 shadow-sm hover:shadow-md transition-all duration-300">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="bg-blue-100 p-1.5 rounded-lg">🔤</span>
                            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Font Settings</span>
                        </h3>

                        <div className="space-y-4">
                            {/* Font Family */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Font Family
                                </label>
                                <select
                                    value={settings.fontFamily}
                                    onChange={(e) => updateSetting('fontFamily', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400"
                                >
                                    <option value="Calibri">Calibri (Recommended)</option>
                                    <option value="Aptos">Aptos (Modern)</option>
                                    <option value="Arial">Arial</option>
                                    <option value="Times New Roman">Times New Roman</option>
                                    <option value="Georgia">Georgia</option>
                                    <option value="Helvetica">Helvetica</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">ATS-friendly fonts only</p>
                            </div>

                            {/* Font Sizes */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Name Size (pt)
                                    </label>
                                    <input
                                        type="number"
                                        min="18"
                                        max="24"
                                        value={settings.fontSize.name}
                                        onChange={(e) => updateSetting('fontSize.name', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Headers Size (pt)
                                    </label>
                                    <input
                                        type="number"
                                        min="12"
                                        max="14"
                                        value={settings.fontSize.headers}
                                        onChange={(e) => updateSetting('fontSize.headers', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Body Size (pt)
                                    </label>
                                    <input
                                        type="number"
                                        min="10"
                                        max="12"
                                        value={settings.fontSize.body}
                                        onChange={(e) => updateSetting('fontSize.body', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Contact Size (pt)
                                    </label>
                                    <input
                                        type="number"
                                        min="9"
                                        max="11"
                                        value={settings.fontSize.contact}
                                        onChange={(e) => updateSetting('fontSize.contact', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Layout Settings */}
                    <div className="border border-emerald-100 rounded-xl p-5 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 shadow-sm hover:shadow-md transition-all duration-300">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="bg-emerald-100 p-1.5 rounded-lg">📐</span>
                            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Layout & Spacing</span>
                        </h3>

                        <div className="space-y-4">
                            {/* Margins */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Margins (inches)
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    <input
                                        type="number"
                                        step="0.25"
                                        min="0.5"
                                        max="1.5"
                                        value={settings.margins.top}
                                        onChange={(e) => updateSetting('margins.top', parseFloat(e.target.value))}
                                        className="px-2 py-2 border border-gray-300 rounded-lg text-sm text-center"
                                        placeholder="Top"
                                    />
                                    <input
                                        type="number"
                                        step="0.25"
                                        min="0.5"
                                        max="1.5"
                                        value={settings.margins.right}
                                        onChange={(e) => updateSetting('margins.right', parseFloat(e.target.value))}
                                        className="px-2 py-2 border border-gray-300 rounded-lg text-sm text-center"
                                        placeholder="Right"
                                    />
                                    <input
                                        type="number"
                                        step="0.25"
                                        min="0.5"
                                        max="1.5"
                                        value={settings.margins.bottom}
                                        onChange={(e) => updateSetting('margins.bottom', parseFloat(e.target.value))}
                                        className="px-2 py-2 border border-gray-300 rounded-lg text-sm text-center"
                                        placeholder="Bottom"
                                    />
                                    <input
                                        type="number"
                                        step="0.25"
                                        min="0.5"
                                        max="1.5"
                                        value={settings.margins.left}
                                        onChange={(e) => updateSetting('margins.left', parseFloat(e.target.value))}
                                        className="px-2 py-2 border border-gray-300 rounded-lg text-sm text-center"
                                        placeholder="Left"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Minimum 0.5" for ATS compatibility</p>
                            </div>

                            {/* Line Spacing */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Line Spacing
                                    </label>
                                    <select
                                        value={settings.lineSpacing}
                                        onChange={(e) => updateSetting('lineSpacing', parseFloat(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400"
                                    >
                                        <option value="1.0">1.0 (Compact)</option>
                                        <option value="1.15">1.15 (Recommended)</option>
                                        <option value="1.5">1.5 (Spacious)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Paragraph Spacing (pt)
                                    </label>
                                    <input
                                        type="number"
                                        min="2"
                                        max="18"
                                        value={settings.paragraphSpacing}
                                        onChange={(e) => updateSetting('paragraphSpacing', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400"
                                    />
                                </div>
                            </div>

                            {/* Density Mode & Section Spacing */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Density Mode
                                    </label>
                                    <select
                                        value={settings.densityMode}
                                        onChange={(e) => updateSetting('densityMode', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400"
                                    >
                                        <option value="compact">Compact (More Content)</option>
                                        <option value="normal">Normal (Balanced)</option>
                                        <option value="spacious">Spacious (More White Space)</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">Adjusts all spacing automatically</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Section Spacing (pt)
                                    </label>
                                    <input
                                        type="number"
                                        min="8"
                                        max="24"
                                        value={settings.sectionSpacing}
                                        onChange={(e) => updateSetting('sectionSpacing', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Formatting Settings */}
                    <div className="border border-purple-100 rounded-xl p-5 bg-gradient-to-br from-purple-50/50 via-white to-pink-50/30 shadow-sm hover:shadow-md transition-all duration-300">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="bg-purple-100 p-1.5 rounded-lg">✨</span>
                            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Formatting</span>
                        </h3>

                        <div className="space-y-4">
                            {/* Date Format */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date Format
                                </label>
                                <select
                                    value={settings.dateFormat}
                                    onChange={(e) => updateSetting('dateFormat', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400"
                                >
                                    <option value="MMM YYYY">Aug 2021 (Recommended)</option>
                                    <option value="MM/YYYY">08/2021</option>
                                    <option value="Month YYYY">August 2021</option>
                                </select>
                            </div>

                            {/* Text Alignment */}
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700">
                                    Justify Body Text
                                    <p className="text-xs text-gray-400 font-normal">Aligned to both left and right edges</p>
                                </label>
                                <button
                                    onClick={() => updateSetting('bodyAlignment', settings.bodyAlignment === 'justify' ? 'left' : 'justify')}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.bodyAlignment === 'justify' ? 'bg-blue-600' : 'bg-gray-200'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.bodyAlignment === 'justify' ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Bullet Style */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bullet Style
                                </label>
                                <select
                                    value={settings.bulletStyle}
                                    onChange={(e) => updateSetting('bulletStyle', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400"
                                >
                                    <option value="•">• Round (Recommended)</option>
                                    <option value="-">- Dash</option>
                                    <option value="◦">◦ Circle</option>
                                    <option value="➤">➤ Arrow</option>
                                    <option value="◆">◆ Diamond</option>
                                    <option value="★">★ Star</option>
                                    <option value="❀">❀ Flower</option>
                                    <option value="■">■ Square</option>
                                    <option value="▸">▸ Triangle</option>
                                    <option value="›">› Chevron</option>
                                </select>
                            </div>

                            {/* Header Style */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Header Style
                                    </label>
                                    <select
                                        value={settings.headerStyle}
                                        onChange={(e) => updateSetting('headerStyle', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400"
                                    >
                                        <option value="bold">Bold</option>
                                        <option value="regular">Regular</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Header Case
                                    </label>
                                    <select
                                        value={settings.headerCase}
                                        onChange={(e) => updateSetting('headerCase', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400"
                                    >
                                        <option value="UPPERCASE">UPPERCASE</option>
                                        <option value="Title Case">Title Case</option>
                                    </select>
                                </div>
                            </div>

                            {/* Contact Separator */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Contact Info Separator
                                </label>
                                <select
                                    value={settings.contactSeparator}
                                    onChange={(e) => updateSetting('contactSeparator', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400"
                                >
                                    <option value="|">| Pipe (Recommended)</option>
                                    <option value="•">• Bullet</option>
                                    <option value="-">- Dash</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section Dividers */}
                    <div className="border border-orange-100 rounded-xl p-5 bg-gradient-to-br from-orange-50/50 via-white to-amber-50/30 shadow-sm hover:shadow-md transition-all duration-300">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="bg-orange-100 p-1.5 rounded-lg">━</span>
                            <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Section Dividers</span>
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={settings.sectionDivider}
                                    onChange={(e) => updateSetting('sectionDivider', e.target.checked)}
                                    className="w-4 h-4 rounded"
                                />
                                <label className="text-sm font-medium text-gray-700">
                                    Show section dividers
                                </label>
                            </div>

                            {settings.sectionDivider && (
                                <div className="grid grid-cols-2 gap-4 pl-7">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Line Weight (px)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="3"
                                            value={settings.dividerWeight}
                                            onChange={(e) => updateSetting('dividerWeight', parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Line Color
                                        </label>
                                        <select
                                            value={settings.dividerColor}
                                            onChange={(e) => updateSetting('dividerColor', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-400"
                                        >
                                            <option value="#e5e5e5">Light Gray (Recommended)</option>
                                            <option value="#cccccc">Medium Gray</option>
                                            <option value="#1a1a1a">Black</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200/50 px-6 py-4 bg-gradient-to-r from-slate-50 via-white to-slate-50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs">✓</span>
                        <p className="text-sm text-gray-600 font-medium">
                            All settings are ATS-optimized
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02]"
                    >
                        Apply Settings
                    </button>
                </div>
            </div>
        </div>
    );
}

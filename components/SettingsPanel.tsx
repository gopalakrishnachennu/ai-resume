'use client';

import { useState, useEffect } from 'react';
import { ResumeSettings } from '@/lib/types/resumeSettings';
import { TemplateService } from '@/lib/services/templateService';
import { TemplateSchema } from '@/lib/types/templateSchema';
import { useAuthStore } from '@/store/authStore';

interface SettingsPanelProps {
    settings: ResumeSettings;
    onSettingsChange: (settings: ResumeSettings) => void;
    onClose: () => void;
}

export default function SettingsPanel({ settings, onSettingsChange, onClose }: SettingsPanelProps) {
    const [customTemplates, setCustomTemplates] = useState<TemplateSchema[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);

    const { user } = useAuthStore();

    // Load custom templates on mount
    useEffect(() => {
        const loadTemplates = async () => {
            setLoadingTemplates(true);
            try {
                // 1. Fetch published templates
                const publishedTemplates = await TemplateService.getPublishedTemplates();

                // 2. Fetch user's own templates (if logged in)
                let userTemplates: TemplateSchema[] = [];
                if (user?.uid) {
                    userTemplates = await TemplateService.getUserTemplates(user.uid);
                }

                // 3. Merge lists: User templates + Published templates (avoid duplicates)
                const allTemplates = [...userTemplates];

                publishedTemplates.forEach(pub => {
                    // Only add if not already present (e.g. if user created a published template)
                    if (!allTemplates.some(t => t.id === pub.id)) {
                        allTemplates.push(pub);
                    }
                });

                // Filter out the built-in ones (we show those separately in the UI)
                const filtered = allTemplates.filter(t =>
                    t.id !== 'ats-default' && t.id !== 'modern-default'
                );

                setCustomTemplates(filtered);
            } catch (error) {
                console.error('Failed to load templates:', error);
            } finally {
                setLoadingTemplates(false);
            }
        };
        loadTemplates();
    }, [user]);

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
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
                {/* Minimal Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
                        <p className="text-sm text-gray-500">Customize your resume</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Clean Content */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {/* Template */}
                    <div className="mb-8">
                        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Template</h3>
                        <div className="flex gap-3">
                            <button
                                onClick={() => onSettingsChange({ ...settings, template: 'classic', selectedTemplateId: undefined })}
                                className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-all ${settings.template === 'classic' && !settings.selectedTemplateId
                                    ? 'border-gray-900 bg-gray-900 text-white'
                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                            >
                                Classic
                            </button>
                            <button
                                onClick={() => onSettingsChange({ ...settings, template: 'modern', selectedTemplateId: undefined })}
                                className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-all ${settings.template === 'modern' && !settings.selectedTemplateId
                                    ? 'border-gray-900 bg-gray-900 text-white'
                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                            >
                                Modern
                            </button>
                        </div>

                        {/* Custom Templates */}
                        {customTemplates.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-xs text-gray-400 mb-2">Custom</p>
                                <div className="space-y-2">
                                    {customTemplates.map(template => (
                                        <button
                                            key={template.id}
                                            onClick={() => selectCustomTemplate(template.id)}
                                            className={`w-full py-2.5 px-4 rounded-lg border text-left text-sm transition-all flex justify-between items-center ${settings.selectedTemplateId === template.id
                                                ? 'border-gray-900 bg-gray-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <span className={settings.selectedTemplateId === template.id ? 'font-medium text-gray-900' : 'text-gray-600'}>
                                                {template.name}
                                            </span>
                                            {template.atsCompatible && (
                                                <span className="text-xs text-green-600 font-medium">ATS</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {loadingTemplates && (
                            <div className="mt-3 text-sm text-gray-400">Loading...</div>
                        )}
                    </div>

                    {/* Accent Color */}
                    <div className="mb-8">
                        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Accent Color</h3>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={settings.fontColor.accent}
                                onChange={(e) => updateSetting('fontColor.accent', e.target.value)}
                                className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer"
                            />
                            <div className="flex gap-2">
                                {['#000000', '#2563eb', '#7c3aed', '#059669', '#dc2626', '#ea580c'].map(color => (
                                    <button
                                        key={color}
                                        onClick={() => updateSetting('fontColor.accent', color)}
                                        className={`w-7 h-7 rounded-full transition-all ${settings.fontColor.accent === color ? 'ring-2 ring-offset-2 ring-gray-300' : 'hover:scale-110'
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Font */}
                    <div className="mb-8">
                        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Typography</h3>

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

                    {/* Layout */}
                    <div className="mb-8">
                        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Layout</h3>

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

                    {/* Formatting */}
                    <div className="mb-8">
                        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Formatting</h3>

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
                    <div className="mb-8">
                        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Dividers</h3>

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
                <div className="border-t border-gray-100 px-6 py-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div >
    );
}

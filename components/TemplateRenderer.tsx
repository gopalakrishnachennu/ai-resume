'use client';

import React, { CSSProperties, ReactNode } from 'react';
import {
    TemplateSchema,
    TemplateRow,
    TemplateField,
    DEFAULT_ATS_TEMPLATE,
} from '@/lib/types/templateSchema';
import { FONT_STACKS } from '@/lib/types/resumeSettings';
import { parseFormattedText } from '@/lib/utils/textFormatter';
import { formatMonthYear } from '@/lib/utils/dateFormat';

// Debug logger for TemplateRenderer
const rendererLog = {
    info: (msg: string, data?: any) => console.log(`%c[RENDERER] ${msg}`, 'color: #10b981', data ?? ''),
    warn: (msg: string, data?: any) => console.warn(`%c[RENDERER] ${msg}`, 'color: #f59e0b', data ?? ''),
    error: (msg: string, data?: any) => console.error(`%c[RENDERER] ${msg}`, 'color: #ef4444', data ?? ''),
    debug: (msg: string, data?: any) => console.debug(`%c[RENDERER] ${msg}`, 'color: #6b7280', data ?? ''),
};

// Helper to safely convert any value to a renderable string
function safeString(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return value.filter(v => typeof v === 'string').join(', ');
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch {
            return '[object]';
        }
    }
    return String(value);
}

interface ResumeData {
    personalInfo: {
        name: string;
        email: string;
        phone: string;
        location: string;
        linkedin: string;
        github: string;
    };
    summary: string;
    experience: Array<{
        company: string;
        title: string;
        location?: string;
        startDate?: string;
        endDate?: string;
        current?: boolean;
        achievements?: string[];
        bullets?: string[];
        highlights?: string[];
        responsibilities?: string[];
    }>;
    education: Array<{
        school: string;
        degree: string;
        field?: string;
        location?: string;
        graduationYear?: string;
        graduationDate?: string;
        gpa?: string;
    }>;
    skills: {
        technical: string[];
    };
    technicalSkills?: Record<string, string[] | string>;
}

interface TemplateRendererProps {
    data: ResumeData;
    template: TemplateSchema;
    sections?: Array<{ id: string; name: string; type: string; visible: boolean }>;
    customSections?: Record<string, { items: Array<{ title?: string; description?: string }> }>;
}

/**
 * Template Renderer
 * Renders resume data according to a template schema
 */
export function TemplateRenderer({
    data,
    template,
    sections,
    customSections = {},
}: TemplateRendererProps): ReactNode[] {
    rendererLog.info('TemplateRenderer starting...', {
        hasData: !!data,
        hasTemplate: !!template
    });

    const blocks: ReactNode[] = [];
    let blockIndex = 0;


    const t = template || DEFAULT_ATS_TEMPLATE;

    // Get font stack
    const fontStack = FONT_STACKS[t.typography.fontFamily as keyof typeof FONT_STACKS] || t.typography.fontFamily;

    // === HELPER: Render a template row ===
    const renderRow = (
        row: TemplateRow,
        fieldData: Record<string, string | undefined>,
        key: string
    ): ReactNode => {
        const visibleFields = row.fields.filter(field => {
            const value = fieldData[field.name];
            return t.header.hideEmptyFields ? !!value?.trim() : true;
        });

        if (visibleFields.length === 0) return null;

        const rowStyle: CSSProperties = {
            display: 'flex',
            justifyContent: row.align === 'space-between' ? 'space-between' :
                row.align === 'center' ? 'center' :
                    row.align === 'right' ? 'flex-end' : 'flex-start',
            flexWrap: 'wrap',
            gap: '4px',
        };

        // For space-between: group left fields and ONE right field based on TEMPLATE definition
        // This ensures that if the 'Right' field (e.g. Dates) is missing, the others (Degree, Field) don't get split.
        if (row.align === 'space-between' && visibleFields.length > 1) {
            // Find the field that is SUPPOSED to be on the right (the last defined field in the template)
            const rightMostTemplateFieldName = row.fields[row.fields.length - 1].name;

            // Check if the actual last visible field IS that right-most field
            const lastVisibleField = visibleFields[visibleFields.length - 1];
            const isLastVisibleTheRightAnchor = lastVisibleField.name === rightMostTemplateFieldName;

            let leftFields, rightField;

            // Strict Mode: Only push to right if it matches the template's right-most field
            // Exception: If the template only has 2 fields total (e.g. School, Location) and both are visible, we always split.
            if (isLastVisibleTheRightAnchor || row.fields.length === 2) {
                leftFields = visibleFields.slice(0, -1);
                rightField = visibleFields[visibleFields.length - 1];
            } else {
                // The intended right field is missing. Keep everything on the left.
                leftFields = visibleFields;
                rightField = null;
            }

            return (
                <div key={key} style={rowStyle}>
                    {/* Left group - fields together */}
                    <span>
                        {leftFields.map((field, i) => {
                            const value = fieldData[field.name] || '';
                            if (!value) return null;
                            const isLast = i === leftFields.length - 1;
                            const separator = isLast ? '' : field.separator;
                            const fieldStyle: CSSProperties = {
                                fontWeight: field.style === 'bold' ? 'bold' : 'normal',
                                fontStyle: field.style === 'italic' ? 'italic' : 'normal',
                                fontSize: field.fontSize === 'small' ? `${t.typography.sizes.body - 1}pt` : 'inherit',
                            };
                            return (
                                <span key={`${key}-${field.name}`}>
                                    <span style={fieldStyle}>{value}</span>
                                    {separator && <span style={{ color: t.typography.colors.body }}>{separator}</span>}
                                </span>
                            );
                        })}
                    </span>
                    {/* Right field - dates/location */}
                    <span>
                        {(() => {
                            if (!rightField) return null; // No right field to render
                            const value = fieldData[rightField.name] || '';
                            if (!value) return null;
                            const fieldStyle: CSSProperties = {
                                fontWeight: rightField.style === 'bold' ? 'bold' : 'normal',
                                fontStyle: rightField.style === 'italic' ? 'italic' : 'normal',
                                fontSize: rightField.fontSize === 'small' ? `${t.typography.sizes.body - 1}pt` : 'inherit',
                            };
                            return <span style={fieldStyle}>{value}</span>;
                        })()}
                    </span>
                </div>
            );
        }

        // Default rendering for non-space-between rows
        return (
            <div key={key} style={rowStyle}>
                {visibleFields.map((field, i) => {
                    const value = fieldData[field.name] || '';
                    if (!value) return null;

                    const isLast = i === visibleFields.length - 1;
                    const separator = isLast ? '' : field.separator;

                    const fieldStyle: CSSProperties = {
                        fontWeight: field.style === 'bold' ? 'bold' : 'normal',
                        fontStyle: field.style === 'italic' ? 'italic' : 'normal',
                        fontSize: field.fontSize === 'small' ? `${t.typography.sizes.body - 1}pt` : 'inherit',
                    };

                    return (
                        <span key={`${key}-${field.name}`}>
                            <span style={fieldStyle}>{value}</span>
                            {separator && <span style={{ color: t.typography.colors.body }}>{separator}</span>}
                        </span>
                    );
                })}
            </div>
        );
    };

    // === HELPER: Format date ===
    const formatDate = (dateStr?: string): string => {
        if (!dateStr) return '';
        if (dateStr.toLowerCase() === 'present') return 'Present';

        try {
            // Handle YYYY-MM format directly to avoid timezone issues
            const yyyyMmMatch = dateStr.match(/^(\d{4})-(\d{2})$/);
            if (yyyyMmMatch) {
                const year = parseInt(yyyyMmMatch[1]);
                const month = parseInt(yyyyMmMatch[2]) - 1; // 0-indexed
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const monthNamesFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

                switch (t.dateFormat) {
                    case 'MM/YYYY':
                        return `${String(month + 1).padStart(2, '0')}/${year}`;
                    case 'MMMM YYYY':
                        return `${monthNamesFull[month]} ${year}`;
                    case 'YYYY':
                        return String(year);
                    case 'MMM YYYY':
                    default:
                        return `${monthNames[month]} ${year}`;
                }
            }

            // Fallback for other date formats
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;

            switch (t.dateFormat) {
                case 'MM/YYYY':
                    return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                case 'MMMM YYYY':
                    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                case 'YYYY':
                    return String(date.getFullYear());
                case 'MMM YYYY':
                default:
                    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            }
        } catch {
            return dateStr;
        }
    };

    // === HELPER: Render section header ===
    const renderSectionHeader = (name: string): ReactNode => {
        const headerStyle: CSSProperties = {
            fontSize: `${t.typography.sizes.sectionHeader}pt`,
            fontWeight: t.sectionHeaders.style.includes('bold') ? 'bold' : 'normal',
            textTransform: t.sectionHeaders.style.includes('uppercase') ? 'uppercase' : 'none',
            textDecoration: t.sectionHeaders.style === 'underline' ? 'underline' : 'none',
            color: t.typography.colors.headers,
            borderBottom: t.sectionHeaders.divider
                ? `1px solid ${t.typography.colors.accent}`
                : 'none',
            paddingBottom: t.sectionHeaders.divider ? '4px' : '0',
            marginBottom: '8px',
        };

        return <div style={headerStyle}>{name}</div>;
    };

    // === RENDER HEADER ===
    const renderHeader = (): void => {
        // Name
        const nameStyle: CSSProperties = {
            fontSize: `${t.typography.sizes.name}pt`,
            fontWeight: t.header.nameStyle.includes('bold') ? 'bold' : 'normal',
            textTransform: t.header.nameStyle.includes('uppercase') ? 'uppercase' : 'none',
            color: t.typography.colors.name,
            textAlign: t.header.nameAlign,
            marginBottom: '6px',
        };

        blocks.push(
            <div key={`header-name-${blockIndex++}`} style={nameStyle}>
                {data.personalInfo.name || 'Your Name'}
            </div>
        );

        // Contact rows
        const contactData: Record<string, string | undefined> = {
            email: data.personalInfo.email,
            phone: data.personalInfo.phone,
            location: data.personalInfo.location,
            linkedin: data.personalInfo.linkedin,
            github: data.personalInfo.github,
        };

        t.header.contactRows.forEach((row, i) => {
            const contactRow = renderRow(row, contactData, `contact-row-${i}`);
            if (contactRow) {
                blocks.push(
                    <div
                        key={`header-contact-${blockIndex++}`}
                        style={{
                            fontSize: `${t.typography.sizes.body}pt`,
                            color: t.typography.colors.body,
                            textAlign: t.header.nameAlign,
                        }}
                    >
                        {contactRow}
                    </div>
                );
            }
        });
    };

    // === RENDER SUMMARY ===
    const renderSummary = (): void => {
        if (!data.summary) return;

        blocks.push(
            <div key={`summary-header-${blockIndex++}`} style={{ marginTop: '12px' }}>
                {renderSectionHeader('Professional Summary')}
            </div>
        );

        blocks.push(
            <div
                key={`summary-content-${blockIndex++}`}
                style={{
                    fontSize: `${t.typography.sizes.body}pt`,
                    color: t.typography.colors.body,
                    textAlign: t.typography.bodyAlignment || t.summary.align || 'left',
                    lineHeight: 1.4,
                }}
            >
                {parseFormattedText(data.summary)}
            </div>
        );
    };

    // === RENDER SKILLS ===
    // SINGLE FORMAT: Key: Value bullets (e.g., • **Security & Compliance**: IAM, KMS)
    const renderSkills = (): void => {
        const hasTechnicalSkills = data.technicalSkills && Object.keys(data.technicalSkills).length > 0;
        const hasArraySkills = data.skills?.technical?.length > 0;

        if (!hasTechnicalSkills && !hasArraySkills) return;

        blocks.push(
            <div key={`skills-header-${blockIndex++}`} style={{ marginTop: '12px' }}>
                {renderSectionHeader('Skills')}
            </div>
        );

        // Primary: Categorized Skills (technicalSkills map)
        if (hasTechnicalSkills) {
            Object.entries(data.technicalSkills!)
                .filter(([_, skills]) => skills) // Filter out null/undefined skill categories
                .forEach(([category, skills]) => {
                    // Format camelCase to Title Case (e.g., "securityCompliance" -> "Security Compliance")
                    const formattedCategory = category
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, str => str.toUpperCase())
                        .trim();

                    // CRITICAL: Ensure skillText is ALWAYS a string
                    // skills can be: string | string[] | object | null | undefined
                    let skillText: string;
                    if (typeof skills === 'string') {
                        skillText = skills;
                    } else if (Array.isArray(skills)) {
                        skillText = skills.filter(s => s && typeof s === 'string').join(', ');
                    } else if (skills && typeof skills === 'object') {
                        // Handle nested object case - flatten to string
                        try {
                            skillText = Object.values(skills)
                                .flat()
                                .filter(s => s && typeof s === 'string')
                                .join(', ');
                        } catch {
                            skillText = '';
                        }
                    } else {
                        skillText = '';
                    }

                    if (!skillText) return; // Skip empty skill categories

                    blocks.push(
                        <div
                            key={`skill-cat-${blockIndex++}`}
                            style={{
                                display: 'flex',
                                gap: '6px',
                                fontSize: `${t.typography.sizes.body}pt`,
                                color: t.typography.colors.body,
                                marginBottom: '4px',
                                lineHeight: 1.4,
                            }}
                        >
                            <span>{t.experience.bulletStyle}</span>
                            <span>
                                <strong>{formattedCategory}:</strong> {parseFormattedText(skillText)}
                            </span>
                        </div>
                    );
                });
            return;
        }

        // Fallback: Render each skill line as its own bullet
        // Each line is already formatted as "**Category**: skills" from loadData
        if (hasArraySkills) {
            data.skills.technical
                .filter((skillLine: string | null | undefined): skillLine is string => !!skillLine)
                .forEach((skillLine: string, idx: number) => {
                    blocks.push(
                        <div
                            key={`skill-line-${blockIndex++}-${idx}`}
                            style={{
                                display: 'flex',
                                gap: '6px',
                                fontSize: `${t.typography.sizes.body}pt`,
                                color: t.typography.colors.body,
                                marginBottom: '4px',
                                lineHeight: 1.4,
                            }}
                        >
                            <span>{t.experience.bulletStyle}</span>
                            <span>{parseFormattedText(skillLine)}</span>
                        </div>
                    );
                });
        }
    };

    // === RENDER EXPERIENCE ===
    const renderExperience = (): void => {
        if (!data.experience?.length) return;

        blocks.push(
            <div key={`exp-header-${blockIndex++}`} style={{ marginTop: '12px' }}>
                {renderSectionHeader('Experience')}
            </div>
        );

        data.experience.forEach((exp, expIndex) => {
            const endDate = exp.current ? 'Present' : formatDate(exp.endDate);
            const dates = [formatDate(exp.startDate), endDate]
                .filter(Boolean)
                .join(' - ');

            const expData: Record<string, string | undefined> = {
                title: exp.title,
                company: exp.company,
                location: exp.location,
                dates: dates,
            };

            // Render experience rows
            t.experience.rows.forEach((row, rowIndex) => {
                const renderedRow = renderRow(row, expData, `exp-${expIndex}-row-${rowIndex}`);
                if (renderedRow) {
                    blocks.push(
                        <div
                            key={`exp-${expIndex}-row-${blockIndex++}`}
                            style={{
                                fontSize: rowIndex === 0 ? `${t.typography.sizes.itemTitle}pt` : `${t.typography.sizes.body}pt`,
                                color: t.typography.colors.body,
                                marginTop: rowIndex === 0 && expIndex > 0 ? `${t.experience.spacing.beforeItem}px` : '0',
                            }}
                        >
                            {renderedRow}
                        </div>
                    );
                }
            });

            // Render achievements
            // Render achievements/bullets
            const bullets = exp.achievements || (exp as any).bullets || (exp as any).highlights || (exp as any).responsibilities || [];

            if (bullets.length) {
                bullets
                    .filter((achievement: string | null | undefined): achievement is string => !!achievement)
                    .forEach((achievement: string, achIndex: number) => {
                        blocks.push(
                            <div
                                key={`exp-${expIndex}-ach-${blockIndex++}`}
                                style={{
                                    display: 'flex',
                                    gap: '6px',
                                    fontSize: `${t.typography.sizes.body}pt`,
                                    color: t.typography.colors.body,
                                    marginLeft: `${t.experience.bulletIndent}px`,
                                }}
                            >
                                <span>{t.experience.bulletStyle}</span>
                                <span style={{
                                    flex: 1,
                                    overflowWrap: t.experience.wrapLongText ? 'break-word' : 'normal',
                                    textAlign: t.typography.bodyAlignment || 'left'
                                }}>
                                    {parseFormattedText(achievement)}
                                </span>
                            </div>
                        );
                    });
            }
        });
    };

    // === RENDER EDUCATION ===
    const renderEducation = (): void => {
        if (!data.education?.length) return;

        blocks.push(
            <div key={`edu-header-${blockIndex++}`} style={{ marginTop: '12px' }}>
                {renderSectionHeader('Education')}
            </div>
        );

        data.education.forEach((edu, eduIndex) => {
            // Format graduation date using template's date format setting
            const rawDate = edu.graduationDate || edu.graduationYear;
            const formattedDate = rawDate ? formatDate(rawDate) : undefined;

            const eduData: Record<string, string | undefined> = {
                degree: edu.degree,
                field: edu.field,
                school: edu.school,
                location: edu.location,
                dates: formattedDate,
                gpa: t.education.showGPA && edu.gpa ? `GPA: ${edu.gpa}` : undefined,
            };

            // Best practice: Ensure education has essential rows (fallback if template missing them)
            const defaultEducationRows: TemplateRow[] = [
                {
                    align: 'space-between',
                    fields: [
                        { name: 'degree', style: 'bold', separator: ' in ' },
                        { name: 'field', style: 'normal', separator: '' },
                        { name: 'dates', style: 'normal', separator: '' },
                    ],
                },
                {
                    align: 'space-between',
                    fields: [
                        { name: 'school', style: 'italic', separator: '' },
                        { name: 'location', style: 'normal', separator: '' },
                    ],
                },
            ];

            // Use template rows if they exist and have location, otherwise use default rows
            const templateHasLocation = t.education.rows.some(row =>
                row.fields.some(f => f.name === 'location')
            );
            const educationRows = templateHasLocation ? t.education.rows : defaultEducationRows;

            educationRows.forEach((row, rowIndex) => {
                const renderedRow = renderRow(row, eduData, `edu-${eduIndex}-row-${rowIndex}`);
                if (renderedRow) {
                    blocks.push(
                        <div
                            key={`edu-${eduIndex}-row-${blockIndex++}`}
                            style={{
                                fontSize: rowIndex === 0 ? `${t.typography.sizes.itemTitle}pt` : `${t.typography.sizes.body}pt`,
                                color: t.typography.colors.body,
                                marginTop: rowIndex === 0 && eduIndex > 0 ? `${t.education.spacing.beforeItem}px` : '0',
                            }}
                        >
                            {renderedRow}
                        </div>
                    );
                }
            });

            // Show GPA if enabled and exists
            if (t.education.showGPA && edu.gpa) {
                blocks.push(
                    <div
                        key={`edu-${eduIndex}-gpa-${blockIndex++}`}
                        style={{
                            fontSize: `${t.typography.sizes.body}pt`,
                            color: t.typography.colors.body,
                        }}
                    >
                        GPA: {edu.gpa}
                    </div>
                );
            }
        });
    };

    // === RENDER CUSTOM SECTIONS ===
    const renderCustomSection = (sectionId: string, sectionName: string): void => {
        const customData = customSections[sectionId];
        if (!customData?.items?.length) return;

        blocks.push(
            <div key={`custom-${sectionId}-header-${blockIndex++}`} style={{ marginTop: '12px' }}>
                {renderSectionHeader(sectionName)}
            </div>
        );

        customData.items.forEach((item, i) => {
            if (item.title) {
                blocks.push(
                    <div
                        key={`custom-${sectionId}-title-${blockIndex++}`}
                        style={{
                            fontWeight: 'bold',
                            fontSize: `${t.typography.sizes.body}pt`,
                            color: t.typography.colors.body,
                        }}
                    >
                        {item.title}
                    </div>
                );
            }
            if (item.description) {
                blocks.push(
                    <div
                        key={`custom-${sectionId}-desc-${blockIndex++}`}
                        style={{
                            fontSize: `${t.typography.sizes.body}pt`,
                            color: t.typography.colors.body,
                        }}
                    >
                        {parseFormattedText(item.description)}
                    </div>
                );
            }
        });
    };

    // === RENDER ALL SECTIONS IN ORDER ===
    try {
        rendererLog.debug('Rendering header...');
        renderHeader();
        rendererLog.debug('Header rendered OK');
    } catch (err) {
        rendererLog.error('CRASH in header', err);
        throw err;
    }

    // Default section order + custom sections
    let sectionOrder = t.sectionOrder || ['summary', 'skills', 'experience', 'education'];

    // Add 'custom' to sectionOrder if there are custom sections (so they get rendered)
    if (sections && sections.some(s => s.type === 'custom' && s.visible)) {
        if (!sectionOrder.includes('custom')) {
            sectionOrder = [...sectionOrder, 'custom'];
        }
    }

    sectionOrder.forEach(sectionType => {
        // Check if section should be visible (if sections array provided)
        if (sections) {
            const sectionConfig = sections.find(s => s.type === sectionType);
            if (sectionConfig && !sectionConfig.visible) return;
        }

        try {
            switch (sectionType) {
                case 'summary':
                    rendererLog.debug('Rendering summary...');
                    renderSummary();
                    rendererLog.debug('Summary rendered OK');
                    break;
                case 'skills':
                    rendererLog.debug('Rendering skills...', {
                        hasTechnicalSkills: !!data.technicalSkills && Object.keys(data.technicalSkills).length > 0,
                        hasArraySkills: data.skills?.technical?.length > 0,
                        technicalSkillsKeys: data.technicalSkills ? Object.keys(data.technicalSkills) : [],
                    });
                    renderSkills();
                    rendererLog.debug('Skills rendered OK');
                    break;
                case 'experience':
                    rendererLog.debug('Rendering experience...', { count: data.experience?.length });
                    renderExperience();
                    rendererLog.debug('Experience rendered OK');
                    break;
                case 'education':
                    rendererLog.debug('Rendering education...', { count: data.education?.length });
                    renderEducation();
                    rendererLog.debug('Education rendered OK');
                    break;
                case 'custom':
                    // Render all custom sections
                    if (sections) {
                        sections
                            .filter(s => s.type === 'custom' && s.visible)
                            .forEach(s => {
                                rendererLog.debug('Rendering custom section...', { id: s.id, name: s.name });
                                renderCustomSection(s.id, s.name);
                            });
                    }
                    break;
            }
        } catch (err) {
            rendererLog.error(`CRASH in section: ${sectionType}`, err);
            // Re-throw to show in console
            throw err;
        }
    });

    return blocks;
}

/**
 * Get page content styles from template
 */
export function getTemplatePageStyles(template: TemplateSchema): CSSProperties {
    const fontStack = FONT_STACKS[template.typography.fontFamily as keyof typeof FONT_STACKS] || template.typography.fontFamily;

    return {
        fontFamily: fontStack,
        lineHeight: template.page.lineSpacing || 1.15,
        paddingTop: `${template.page.margins.top}in`,
        paddingBottom: `${template.page.margins.bottom}in`,
        paddingLeft: `${template.page.margins.left}in`,
        paddingRight: `${template.page.margins.right}in`,
    };
}

export default TemplateRenderer;


import { TemplateSchema, TemplateRow, TemplateField, DEFAULT_ATS_TEMPLATE } from '@/lib/types/templateSchema';

/**
 * Convert markdown-style **bold** into pdfmake rich text segments
 */
function formatPdfText(text: string): any[] {
    if (!text) return [{ text: '' }];
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
}

/**
 * Format date based on template settings
 */
function formatDate(dateStr: string | undefined, format: string = 'MMM YYYY'): string {
    if (!dateStr) return '';
    if (dateStr.toLowerCase() === 'present') return 'Present';

    try {
        const date = new Date(dateStr);
        // Handle invalid dates
        if (isNaN(date.getTime())) return dateStr;

        switch (format) {
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
}

/**
 * Convert Template Schema + Resume Data to PdfMake Content Array
 */
export function convertTemplateToPdfMake(
    data: any,
    template: TemplateSchema | null,
    sections: { id: string; name: string; type: string; visible: boolean }[],
    customSectionsData: Record<string, any> = {}
): any[] {
    const t = template || DEFAULT_ATS_TEMPLATE;
    const content: any[] = [];

    // Helper: Map alignment
    const mapAlign = (align: string) => {
        if (align === 'space-between') return 'justify'; // pdfmake doesn't have space-between, use columns instead
        return align;
    };

    // Helper: Render Row
    const renderRow = (row: TemplateRow, fieldData: Record<string, string | undefined>): any => {
        // Filter visible fields
        const visibleFields = row.fields.filter(field => {
            const value = fieldData[field.name];
            return t.header.hideEmptyFields ? !!value?.trim() : true;
        });

        if (visibleFields.length === 0) return null;

        // If space-between, use columns
        if (row.align === 'space-between') {
            const columns = visibleFields.map((field, i) => {
                const value = fieldData[field.name] || '';
                const style: any = {
                    text: value,
                    bold: field.style === 'bold',
                    italics: field.style === 'italic',
                    fontSize: field.fontSize === 'small' ? t.typography.sizes.body - 1 : t.typography.sizes.body,
                    color: t.typography.colors.body
                };

                // First item left, last item right, middle?
                // For simplified space-between with 2 items:
                let align = 'left';
                if (visibleFields.length > 1) {
                    if (i === visibleFields.length - 1) align = 'right';
                    else if (i === 0) align = 'left';
                    else align = 'center';
                }

                return { ...style, alignment: align };
            });
            return { columns, columnGap: 10 };
        }

        // standard flow (left/center/right)
        const textParts: any[] = [];
        visibleFields.forEach((field, i) => {
            const value = fieldData[field.name] || '';
            if (!value) return;

            textParts.push({
                text: value,
                bold: field.style === 'bold',
                italics: field.style === 'italic',
                fontSize: field.fontSize === 'small' ? t.typography.sizes.body - 1 : t.typography.sizes.body,
                color: t.typography.colors.body
            } as any);

            // Separator
            if (i < visibleFields.length - 1 && field.separator) {
                textParts.push({ text: field.separator, color: t.typography.colors.body });
            }
        });

        return {
            text: textParts,
            alignment: row.align,
        };
    };

    // Helper: Section Header
    const addSectionHeader = (name: string) => {
        content.push({
            text: t.sectionHeaders.style.includes('uppercase') ? name.toUpperCase() : name,
            bold: t.sectionHeaders.style.includes('bold'),
            decoration: t.sectionHeaders.style === 'underline' ? 'underline' : undefined,
            fontSize: t.typography.sizes.sectionHeader,
            color: t.typography.colors.headers,
            margin: [0, 8, 0, t.sectionHeaders.divider ? 2 : 4],
        });

        if (t.sectionHeaders.divider) {
            content.push({
                canvas: [{
                    type: 'line',
                    x1: 0, y1: 0, x2: 515, y2: 0, // Approx width, hard to get perfect without page context
                    lineWidth: 1,
                    lineColor: t.typography.colors.accent, // Use accent for divider in custom templates usually
                }],
                margin: [0, 0, 0, 6],
            });
        }
    };

    // === HEADER ===
    // Name
    content.push({
        text: t.header.nameStyle.includes('uppercase') ? (data.personalInfo.name || 'Your Name').toUpperCase() : (data.personalInfo.name || 'Your Name'),
        bold: t.header.nameStyle.includes('bold'),
        fontSize: t.typography.sizes.name,
        color: t.typography.colors.name,
        alignment: t.header.nameAlign,
        margin: [0, 0, 0, 4],
    });

    // Contact Rows
    const contactData = {
        email: data.personalInfo.email,
        phone: data.personalInfo.phone,
        location: data.personalInfo.location,
        linkedin: data.personalInfo.linkedin,
        github: data.personalInfo.github,
    };

    t.header.contactRows.forEach(row => {
        const rowBlock = renderRow(row, contactData);
        if (rowBlock) {
            // Force contact info color/size overrides if needed, but renderRow uses body size
            // Usually contact info is body size or slightly smaller. Schema doesn't differentiate contact size.
            content.push({
                ...rowBlock,
                margin: [0, 0, 0, 2]
            });
        }
    });

    content.push({ text: '', margin: [0, 0, 0, 8] }); // Spacing after header

    // === SECTIONS ===
    const sectionOrder = t.sectionOrder || ['summary', 'skills', 'experience', 'education'];

    sectionOrder.forEach(sectionType => {
        // Check visibility
        if (sections) {
            const s = sections.find(sec => sec.type === sectionType);
            if (s && !s.visible) return;
        }

        switch (sectionType) {
            case 'summary':
                if (data.summary) {
                    addSectionHeader('Professional Summary');
                    content.push({
                        // formatPdfText returns array of text segments
                        text: formatPdfText(data.summary),
                        fontSize: t.typography.sizes.body,
                        color: t.typography.colors.body,
                        alignment: t.typography.bodyAlignment || t.summary.align || 'left',
                        margin: [0, 0, 0, 8],
                        lineHeight: t.page.lineSpacing
                    });
                }
                break;

            case 'skills':
                const hasTechnicalSkills = data.technicalSkills && Object.keys(data.technicalSkills).length > 0;
                const hasArraySkills = data.skills?.technical?.length > 0;

                if (hasTechnicalSkills || hasArraySkills) {
                    addSectionHeader('Skills');

                    // Primary: Categorized Skills (technicalSkills map)
                    if (hasTechnicalSkills) {
                        // Use pdfMake's ul for proper bullet formatting
                        const skillItems = Object.entries(data.technicalSkills!).map(([category, skills]) => {
                            // Format camelCase to Title Case
                            const formattedCategory = category
                                .replace(/([A-Z])/g, ' $1')
                                .replace(/^./, str => str.toUpperCase())
                                .trim();
                            const skillText = Array.isArray(skills) ? skills.join(', ') : String(skills);

                            return {
                                text: [
                                    { text: `${formattedCategory}: `, bold: true, color: t.typography.colors.body },
                                    ...formatPdfText(skillText)
                                ],
                                fontSize: t.typography.sizes.body,
                                color: t.typography.colors.body
                            };
                        });

                        content.push({
                            ul: skillItems,
                            margin: [0, 0, 0, 8],
                            lineHeight: t.page.lineSpacing,
                            markerColor: t.typography.colors.body
                        });
                    }
                    // Fallback: Array Skills
                    else if (hasArraySkills) {
                        if (t.skills.layout === 'bullets') {
                            // Bullet list
                            const skillItems = data.skills.technical.map((skill: string) => ({
                                text: formatPdfText(skill),
                                fontSize: t.typography.sizes.body,
                                color: t.typography.colors.body,
                                markerColor: t.typography.colors.body,
                                alignment: t.typography.bodyAlignment || 'left'
                            }));

                            content.push({
                                ul: skillItems,
                                margin: [0, 0, 0, 8],
                                lineHeight: t.page.lineSpacing
                            });
                        } else {
                            // Inline
                            content.push({
                                text: data.skills.technical.join(t.skills.separator || ', '),
                                fontSize: t.typography.sizes.body,
                                color: t.typography.colors.body,
                                alignment: t.typography.bodyAlignment || 'left',
                                margin: [0, 0, 0, 8],
                                lineHeight: t.page.lineSpacing
                            });
                        }
                    }
                }
                break;

            case 'experience':
                if (data.experience?.length) {
                    addSectionHeader('Experience');
                    data.experience.forEach((exp: any, i: number) => {
                        const expData = {
                            title: exp.title,
                            company: exp.company,
                            location: exp.location,
                            dates: `${formatDate(exp.startDate, t.dateFormat)} - ${exp.current ? 'Present' : formatDate(exp.endDate, t.dateFormat)}`
                        };

                        // Rows
                        t.experience.rows.forEach(row => {
                            const rowBlock = renderRow(row, expData);
                            if (rowBlock) {
                                // Add marginTop for first row of item (except first item)
                                const marginTop = (i > 0 && row === t.experience.rows[0]) ? t.experience.spacing.beforeItem : 0;
                                content.push({
                                    ...rowBlock,
                                    margin: [0, marginTop, 0, 0] // 0 bottom, handled by spacing or next item
                                });
                            }
                        });

                        // Achievements
                        if (exp.highlights || exp.bullets || exp.responsibilities) { // normalize
                            const bullets = exp.highlights || exp.bullets || exp.responsibilities || [];
                            if (bullets.length) {
                                content.push({
                                    ul: bullets.map((b: string) => ({
                                        text: formatPdfText(b),
                                        fontSize: t.typography.sizes.body,
                                        color: t.typography.colors.body,
                                        alignment: t.typography.bodyAlignment || 'left'
                                    })),
                                    margin: [t.experience.bulletIndent, 2, 0, 4], // indent
                                    liteHeight: t.page.lineSpacing
                                });
                            }
                        }
                    });
                }
                break;

            case 'education':
                if (data.education?.length) {
                    addSectionHeader('Education');
                    data.education.forEach((edu: any, i: number) => {
                        const eduData = {
                            degree: edu.degree,
                            field: edu.field,
                            school: edu.school,
                            dates: edu.graduationYear || edu.graduationDate || '', // normalize
                            gpa: t.education.showGPA && edu.gpa ? `GPA: ${edu.gpa}` : undefined,
                        };

                        t.education.rows.forEach(row => {
                            const rowBlock = renderRow(row, eduData);
                            if (rowBlock) {
                                const marginTop = (i > 0 && row === t.education.rows[0]) ? t.education.spacing.beforeItem : 0;
                                content.push({
                                    ...rowBlock,
                                    margin: [0, marginTop, 0, 0]
                                });
                            }
                        });

                        // GPA row separate if enabled? No, usually in fields.

                        // Spacing after item
                        content.push({ text: '', margin: [0, 0, 0, t.education.spacing.afterItem] });
                    });
                }
                break;

            case 'custom':
                // Find all custom sections
                if (sections) {
                    sections.filter(s => s.type === 'custom' && s.visible).forEach(customSec => {
                        const customData = customSectionsData[customSec.id];
                        if (customData?.items?.length) {
                            addSectionHeader(customSec.name);

                            customData.items.forEach((item: any, idx: number) => {
                                if (item.title) {
                                    content.push({
                                        text: item.title,
                                        bold: true,
                                        fontSize: t.typography.sizes.body,
                                        color: t.typography.colors.body,
                                        margin: [0, 2, 0, 0]
                                    });
                                }
                                if (item.description) {
                                    content.push({
                                        text: formatPdfText(item.description),
                                        fontSize: t.typography.sizes.body,
                                        color: t.typography.colors.body,
                                        margin: [0, 0, 0, 4]
                                    });
                                }
                            });
                        }
                    });
                }
                break;
        }
    });

    return content;
}

/**
 * ResumeExportService - Generates PDF and DOCX files from resume data
 * Extracted from editor for reuse in Flash button flow
 */

// Default settings for PDF/DOCX generation - ALL BLACK TEXT
export const defaultExportSettings = {
    fontSize: { name: 22, contact: 11, headers: 13, body: 11 },
    fontFamily: 'Calibri',
    fontColor: { name: '#000000', headers: '#000000', body: '#000000', contact: '#000000' },
    margins: { top: 0.5, bottom: 0.5, left: 0.75, right: 0.75 },
    lineSpacing: 1.0,
    paragraphSpacing: 4, // in pt
    sectionSpacing: 16, // in pt
    sectionDivider: true,
    dividerColor: '#D3D3D3',
    dividerWeight: 1,
    bulletStyle: '•',
    headerCase: 'Title Case' as 'UPPERCASE' | 'Title Case',
    headerStyle: 'bold',
    contactSeparator: '|',
    alignment: 'center',
    dateFormat: 'MMM yyyy', // "Aug 2021" format
};

// Default sections order
const defaultSections = [
    { id: 'summary', name: 'Summary', type: 'summary', visible: true, order: 1 },
    { id: 'experience', name: 'Experience', type: 'experience', visible: true, order: 2 },
    { id: 'education', name: 'Education', type: 'education', visible: true, order: 3 },
    { id: 'skills', name: 'Technical Skills', type: 'skills', visible: true, order: 4 },
];

// Format date helper
const formatMonthYear = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.toLowerCase() === 'present') return 'Present';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
        return dateStr;
    }
};

// Format text for PDF (handle markdown-like syntax)
const formatPdfText = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
};

// Resume data interface for export
export interface ExportResumeData {
    personalInfo: {
        name?: string;
        fullName?: string;
        email?: string;
        phone?: string;
        location?: string;
        linkedin?: string;
        github?: string;
    };
    summary?: string;
    professionalSummary?: string;
    experience: Array<{
        title?: string;
        company?: string;
        location?: string;
        startDate?: string;
        endDate?: string;
        current?: boolean;
        bullets?: string[];
        highlights?: string[];
        responsibilities?: string[];
    }>;
    education: Array<{
        degree?: string;
        field?: string;
        school?: string;
        institution?: string;
        location?: string;
        graduationDate?: string;
        endDate?: string;
    }>;
    skills?: {
        technical?: string[];
    };
    technicalSkills?: Record<string, string[] | string>;
}

export class ResumeExportService {
    /**
     * Generate PDF blob from resume data
     */
    static async generatePDFBlob(
        resumeData: ExportResumeData,
        settings = defaultExportSettings
    ): Promise<Blob> {
        const pdfMakeModule = await import('pdfmake/build/pdfmake');
        const pdfMake = (pdfMakeModule as any).default || pdfMakeModule;
        const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
        const pdfFonts = (pdfFontsModule as any).default || pdfFontsModule;

        // Attach default Roboto font VFS
        (pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || (pdfMake as any).vfs;

        const headerCase = (name: string) => settings.headerCase === 'UPPERCASE' ? name.toUpperCase() : name;
        const pt = (inches: number) => inches * 72;

        // Font mappings (browser bundle only has Roboto)
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

        // Calculate page width for divider line (Letter width - margins)
        const pageWidth = 8.5 * 72 - pt(settings.margins.left) - pt(settings.margins.right);

        const addSectionHeader = (sectionName: string) => {
            content.push({
                text: headerCase(sectionName),
                style: 'sectionHeader',
                margin: [0, (settings as any).sectionSpacing || 16, 0, settings.sectionDivider ? 2 : 4],
            });

            if (settings.sectionDivider) {
                content.push({
                    canvas: [{
                        type: 'line',
                        x1: 0, y1: 0, x2: pageWidth, y2: 0,
                        lineWidth: settings.dividerWeight,
                        lineColor: settings.dividerColor,
                    }],
                    margin: [0, 0, 0, 4],
                });
            }
        };

        // Name
        const name = resumeData.personalInfo?.name || resumeData.personalInfo?.fullName || 'Your Name';
        content.push({
            text: name,
            style: 'name',
            alignment: 'center',
            margin: [0, 0, 0, 6],
        });

        // Contact
        const contactPieces = [
            resumeData.personalInfo?.email,
            resumeData.personalInfo?.phone,
            resumeData.personalInfo?.location,
            resumeData.personalInfo?.linkedin,
            resumeData.personalInfo?.github,
        ].filter(Boolean);

        if (contactPieces.length) {
            content.push({
                text: contactPieces.join(` ${settings.contactSeparator} `),
                style: 'contact',
                alignment: 'center',
                margin: [0, 0, 0, 12],
            });
        }

        // Summary
        const summary = resumeData.summary || resumeData.professionalSummary;
        if (summary) {
            addSectionHeader('Summary');
            content.push({ text: formatPdfText(summary), style: 'body', margin: [0, 0, 0, 4] });
        }

        if (resumeData.experience && resumeData.experience.length > 0) {
            addSectionHeader('Experience');
            resumeData.experience.forEach((exp) => {
                const bullets = exp.bullets || exp.highlights || exp.responsibilities || [];
                content.push({
                    margin: [0, 0, 0, 8],
                    stack: [
                        {
                            columns: [
                                { text: exp.title || '', style: 'bodyBold', width: '*' },
                                { text: `${formatMonthYear(exp.startDate || '')} - ${exp.current ? 'Present' : formatMonthYear(exp.endDate || '')}`, style: 'body', alignment: 'right' },
                            ],
                        },
                        {
                            columns: [
                                { text: exp.company || '', style: 'italic' },
                                { text: exp.location || '', style: 'italic', alignment: 'right' },
                            ],
                            margin: [0, 1, 0, 2],
                        },
                        {
                            ul: bullets.filter((b: string) => b.trim()).map((b: string) => formatPdfText(b)),
                            style: 'body',
                            margin: [0, 0, 0, 0],
                        },
                    ],
                });
            });
        }

        // Education
        if (resumeData.education && resumeData.education.length > 0) {
            addSectionHeader('Education');
            resumeData.education.forEach((edu) => {
                content.push({
                    margin: [0, 0, 0, 8],
                    stack: [
                        {
                            columns: [
                                { text: `${edu.degree || ''} ${edu.field || ''}`.trim(), style: 'bodyBold', width: '*' },
                                { text: formatMonthYear(edu.graduationDate || edu.endDate || ''), style: 'body', alignment: 'right' },
                            ],
                        },
                        {
                            columns: [
                                { text: edu.school || edu.institution || '', style: 'italic' },
                                { text: edu.location || '', style: 'italic', alignment: 'right' },
                            ],
                        },
                    ],
                });
            });
        }

        // Skills
        const technicalSkills = resumeData.skills?.technical || [];
        const skillLines: string[] = [];

        // Handle skills from technicalSkills object
        if (resumeData.technicalSkills) {
            Object.entries(resumeData.technicalSkills).forEach(([category, skills]) => {
                if (Array.isArray(skills) && skills.length > 0) {
                    const formattedCategory = category.replace(/([A-Z])/g, ' $1').trim();
                    skillLines.push(`${formattedCategory}: ${skills.join(', ')}`);
                } else if (typeof skills === 'string' && skills.trim()) {
                    const formattedCategory = category.replace(/([A-Z])/g, ' $1').trim();
                    skillLines.push(`${formattedCategory}: ${skills}`);
                }
            });
        }

        const allSkills = [...technicalSkills, ...skillLines];
        if (allSkills.length > 0) {
            addSectionHeader('Technical Skills');
            allSkills.forEach((skillLine, idx) => {
                content.push({ text: formatPdfText(skillLine), style: 'body', margin: [0, 0, 0, idx === allSkills.length - 1 ? 8 : 4] });
            });
        }

        const docDefinition: any = {
            pageSize: 'LETTER',
            pageMargins: [pt(settings.margins.left), pt(settings.margins.top), pt(settings.margins.right), pt(settings.margins.bottom)],
            defaultStyle: {
                font: 'Roboto',
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

        return new Promise((resolve, reject) => {
            try {
                pdfMake.createPdf(docDefinition).getBlob((blob: Blob) => {
                    resolve(blob);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Generate DOCX blob from resume data
     */
    static async generateDOCXBlob(
        resumeData: ExportResumeData,
        settings = defaultExportSettings
    ): Promise<Blob> {
        const docxModule = await import('docx');
        const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, TabStopType, BorderStyle } = docxModule as any;

        const px = (pt: number) => pt * 2; // docx uses half-points
        const letterWidth = 8.5 * 1440;
        const letterHeight = 11 * 1440;
        const rightTabPos = Math.round((8.5 - settings.margins.left - settings.margins.right) * 1440);

        const heading = (text: string) => new Paragraph({
            children: [new TextRun({ text, bold: settings.headerStyle === 'bold', size: px(settings.fontSize.headers), color: settings.fontColor.headers, font: settings.fontFamily })],
            spacing: { before: 80, after: settings.sectionDivider ? 60 : 60 },
            border: settings.sectionDivider ? {
                bottom: {
                    color: settings.dividerColor.replace('#', ''),
                    space: 1,
                    style: BorderStyle.SINGLE,
                    size: settings.dividerWeight * 8,
                },
            } : undefined,
        });

        const bodyParagraph = (text: string, opts: any = {}) => new Paragraph({
            children: [new TextRun({ text, size: px(settings.fontSize.body), color: settings.fontColor.body, font: settings.fontFamily })],
            alignment: AlignmentType.LEFT,
            spacing: { after: opts.after ?? 60 },
        });

        const sectionChildren: any[] = [];

        // Name
        const name = resumeData.personalInfo?.name || resumeData.personalInfo?.fullName || 'Your Name';
        sectionChildren.push(new Paragraph({
            children: [new TextRun({ text: name, bold: true, size: px(settings.fontSize.name), color: settings.fontColor.name, font: settings.fontFamily })],
            heading: HeadingLevel.TITLE,
            alignment: settings.alignment === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT,
            spacing: { after: 80 },
        }));

        // Contact
        const contactParts = [
            resumeData.personalInfo?.email,
            resumeData.personalInfo?.phone,
            resumeData.personalInfo?.location,
            resumeData.personalInfo?.linkedin,
            resumeData.personalInfo?.github,
        ].filter(Boolean);

        if (contactParts.length) {
            sectionChildren.push(new Paragraph({
                children: [new TextRun({ text: contactParts.join(` ${settings.contactSeparator} `), size: px(settings.fontSize.contact), color: settings.fontColor.contact, font: settings.fontFamily })],
                alignment: settings.alignment === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT,
                spacing: { after: 200 },
            }));
        }

        // Summary
        const summary = resumeData.summary || resumeData.professionalSummary;
        if (summary) {
            sectionChildren.push(heading('SUMMARY'));
            sectionChildren.push(bodyParagraph(summary, { after: 80 }));
        }

        // Experience
        if (resumeData.experience && resumeData.experience.length > 0) {
            sectionChildren.push(heading('EXPERIENCE'));
            resumeData.experience.forEach((exp) => {
                // Title + Date
                sectionChildren.push(new Paragraph({
                    children: [
                        new TextRun({ text: exp.title || '', bold: true, size: px(settings.fontSize.body), color: settings.fontColor.body, font: settings.fontFamily }),
                        new TextRun({ text: '\t' }),
                        new TextRun({ text: `${formatMonthYear(exp.startDate || '')} - ${exp.current ? 'Present' : formatMonthYear(exp.endDate || '')}`, color: settings.fontColor.contact, size: px(settings.fontSize.body), font: settings.fontFamily }),
                    ],
                    tabStops: [{ type: TabStopType.RIGHT, position: rightTabPos }],
                    spacing: { after: 40 },
                }));

                // Company + Location
                sectionChildren.push(new Paragraph({
                    children: [
                        new TextRun({ text: exp.company || '', italics: true, size: px(settings.fontSize.body), color: settings.fontColor.contact, font: settings.fontFamily }),
                        new TextRun({ text: '\t' }),
                        new TextRun({ text: exp.location || '', italics: true, size: px(settings.fontSize.body), color: settings.fontColor.contact, font: settings.fontFamily }),
                    ],
                    tabStops: [{ type: TabStopType.RIGHT, position: rightTabPos }],
                    spacing: { after: 60 },
                }));

                // Bullets
                const bullets = exp.bullets || exp.highlights || exp.responsibilities || [];
                bullets.filter((b: string) => b.trim()).forEach((b: string) => {
                    sectionChildren.push(new Paragraph({
                        children: [
                            new TextRun({ text: `${settings.bulletStyle} `, size: px(settings.fontSize.body), color: settings.fontColor.body, font: settings.fontFamily }),
                            new TextRun({ text: b, size: px(settings.fontSize.body), color: settings.fontColor.body, font: settings.fontFamily }),
                        ],
                        spacing: { after: 40 },
                    }));
                });
                sectionChildren.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
            });
        }

        // Education
        if (resumeData.education && resumeData.education.length > 0) {
            sectionChildren.push(heading('EDUCATION'));
            resumeData.education.forEach((edu) => {
                sectionChildren.push(new Paragraph({
                    children: [
                        new TextRun({ text: `${edu.degree || ''} ${edu.field || ''}`.trim(), bold: true, size: px(settings.fontSize.body), color: settings.fontColor.body, font: settings.fontFamily }),
                        new TextRun({ text: '\t' }),
                        new TextRun({ text: formatMonthYear(edu.graduationDate || edu.endDate || ''), color: settings.fontColor.contact, size: px(settings.fontSize.body), font: settings.fontFamily }),
                    ],
                    tabStops: [{ type: TabStopType.RIGHT, position: rightTabPos }],
                    spacing: { after: 40 },
                }));
                sectionChildren.push(new Paragraph({
                    children: [
                        new TextRun({ text: edu.school || edu.institution || '', italics: true, size: px(settings.fontSize.body), color: settings.fontColor.contact, font: settings.fontFamily }),
                        new TextRun({ text: '\t' }),
                        new TextRun({ text: edu.location || '', italics: true, size: px(settings.fontSize.body), color: settings.fontColor.contact, font: settings.fontFamily }),
                    ],
                    tabStops: [{ type: TabStopType.RIGHT, position: rightTabPos }],
                    spacing: { after: 120 },
                }));
            });
        }

        // Skills
        const technicalSkills = resumeData.skills?.technical || [];
        const skillLines: string[] = [];

        if (resumeData.technicalSkills) {
            Object.entries(resumeData.technicalSkills).forEach(([category, skills]) => {
                if (Array.isArray(skills) && skills.length > 0) {
                    const formattedCategory = category.replace(/([A-Z])/g, ' $1').trim();
                    skillLines.push(`${formattedCategory}: ${skills.join(', ')}`);
                } else if (typeof skills === 'string' && skills.trim()) {
                    const formattedCategory = category.replace(/([A-Z])/g, ' $1').trim();
                    skillLines.push(`${formattedCategory}: ${skills}`);
                }
            });
        }

        const allSkills = [...technicalSkills, ...skillLines];
        if (allSkills.length > 0) {
            sectionChildren.push(heading('TECHNICAL SKILLS'));
            allSkills.forEach((skillLine, idx) => {
                sectionChildren.push(bodyParagraph(skillLine, { after: idx === allSkills.length - 1 ? 80 : 40 }));
            });
        }

        const doc = new Document({
            sections: [{
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
            }],
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

        return await Packer.toBlob(doc);
    }
}

'use strict';

/**
 * Template Schema Types
 * Defines the structure for resume templates that admins can create and users can select.
 */

// === TEMPLATE FIELD ===
export interface TemplateField {
    name: string; // 'title', 'company', 'email', 'phone', 'linkedin', 'github', 'location', 'dates', 'degree', 'school', 'gpa', 'field'
    style: 'bold' | 'italic' | 'normal';
    separator: string; // What comes after this field: ' - ', ' | ', ', ', ''
    fontSize?: 'inherit' | 'small';
}

// === TEMPLATE ROW ===
export interface TemplateRow {
    fields: TemplateField[];
    align: 'left' | 'center' | 'right' | 'space-between';
}

// === COMPLETE TEMPLATE SCHEMA ===
export interface TemplateSchema {
    id: string;
    name: string;
    description: string;
    thumbnail?: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    version: number;
    isPublished: boolean;

    // === ATS COMPATIBILITY ===
    atsCompatible: boolean;
    atsWarning?: string;

    // === BUILTIN FLAG ===
    isBuiltIn?: boolean;  // True for Classic/Modern presets

    // === PAGE LAYOUT ===
    page: {
        margins: { top: number; right: number; bottom: number; left: number };
        lineSpacing: number;
    };

    // === TYPOGRAPHY ===
    typography: {
        fontFamily: string;
        sizes: {
            name: number;
            sectionHeader: number;
            itemTitle: number;
            body: number;
        };
        colors: {
            name: string;
            headers: string;
            body: string;
            accent: string;
            links: string;
        };
    };

    // === HEADER ===
    header: {
        nameAlign: 'left' | 'center' | 'right';
        nameStyle: 'normal' | 'bold' | 'uppercase' | 'bold-uppercase';
        contactRows: TemplateRow[];
        showIcons: boolean;
        hideEmptyFields: boolean;
    };

    // === SECTIONS ===
    sectionOrder: SectionType[];
    hideEmptySections: boolean;

    sectionHeaders: {
        style: 'bold' | 'uppercase' | 'bold-uppercase' | 'underline';
        divider: boolean;
        dividerStyle: 'line' | 'double' | 'none';
    };

    // === SUMMARY ===
    summary: {
        align: 'left' | 'justify';
    };

    // === EXPERIENCE ===
    experience: {
        rows: TemplateRow[];
        bulletStyle: '•' | '-' | '▸' | '◦' | '→';
        bulletIndent: number;
        spacing: { beforeItem: number; afterItem: number };
        wrapLongText: boolean;
    };

    // === EDUCATION ===
    education: {
        rows: TemplateRow[];
        showGPA: boolean;
        spacing: { beforeItem: number; afterItem: number };
    };

    // === SKILLS ===
    skills: {
        layout: 'inline' | 'bullets' | 'categories' | 'key-value';
        separator: string;
        showCategoryNames: boolean;
    };

    // === CUSTOM SECTIONS ===
    customSections: {
        defaultLayout: TemplateRow[];
    };

    // === LINKS ===
    links: {
        style: 'underline' | 'color' | 'plain';
        color: string;
    };

    // === PAGE NUMBERS ===
    pageNumbers: {
        show: boolean;
        position: 'bottom-center' | 'bottom-right';
        format: 'Page X' | 'X of Y' | 'X';
    };

    // === HEADER REPEAT ===
    headerOnFirstPageOnly: boolean;

    // === DATE FORMAT ===
    dateFormat: 'MMM YYYY' | 'MM/YYYY' | 'MMMM YYYY' | 'YYYY';
}

// === SECTION TYPES ===
export type SectionType = 'summary' | 'skills' | 'experience' | 'education' | 'custom';

// === AVAILABLE FIELDS PER SECTION ===
export const HEADER_FIELDS = ['email', 'phone', 'linkedin', 'github', 'location', 'website'] as const;
export const EXPERIENCE_FIELDS = ['title', 'company', 'location', 'dates'] as const;
export const EDUCATION_FIELDS = ['degree', 'field', 'school', 'dates', 'gpa'] as const;
export const CUSTOM_FIELDS = ['title', 'description', 'dates'] as const;

export type HeaderFieldName = typeof HEADER_FIELDS[number];
export type ExperienceFieldName = typeof EXPERIENCE_FIELDS[number];
export type EducationFieldName = typeof EDUCATION_FIELDS[number];
export type CustomFieldName = typeof CUSTOM_FIELDS[number];

// === DEFAULT ATS TEMPLATE ===
export const DEFAULT_ATS_TEMPLATE: TemplateSchema = {
    id: 'ats-default',
    name: 'ATS Professional',
    description: 'Clean, ATS-friendly template optimized for applicant tracking systems',
    createdBy: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
    isPublished: true,

    atsCompatible: true,

    page: {
        margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
        lineSpacing: 1.15,
    },

    typography: {
        fontFamily: 'Roboto',
        sizes: { name: 24, sectionHeader: 14, itemTitle: 11, body: 11 },
        colors: { name: '#1a1a1a', headers: '#1a1a1a', body: '#333333', accent: '#2563eb', links: '#2563eb' },
    },

    header: {
        nameAlign: 'center',
        nameStyle: 'bold',
        contactRows: [
            {
                align: 'center',
                fields: [
                    { name: 'email', style: 'normal', separator: ' | ' },
                    { name: 'phone', style: 'normal', separator: ' | ' },
                    { name: 'location', style: 'normal', separator: ' | ' },
                    { name: 'linkedin', style: 'normal', separator: '' },
                ],
            },
        ],
        showIcons: false,
        hideEmptyFields: true,
    },

    sectionOrder: ['summary', 'skills', 'experience', 'education'],
    hideEmptySections: true,

    sectionHeaders: {
        style: 'bold-uppercase',
        divider: true,
        dividerStyle: 'line',
    },

    summary: { align: 'left' },

    experience: {
        rows: [
            {
                align: 'space-between',
                fields: [
                    { name: 'title', style: 'bold', separator: '' },
                    { name: 'dates', style: 'normal', separator: '' },
                ],
            },
            {
                align: 'space-between',
                fields: [
                    { name: 'company', style: 'italic', separator: '' },
                    { name: 'location', style: 'normal', separator: '' },
                ],
            },
        ],
        bulletStyle: '•',
        bulletIndent: 12,
        spacing: { beforeItem: 4, afterItem: 8 },
        wrapLongText: true,
    },

    education: {
        rows: [
            {
                align: 'space-between',
                fields: [
                    { name: 'degree', style: 'bold', separator: ' in ' },
                    { name: 'field', style: 'normal', separator: '' },
                    { name: 'dates', style: 'normal', separator: '' },
                ],
            },
            {
                align: 'left',
                fields: [{ name: 'school', style: 'italic', separator: '' }],
            },
        ],
        showGPA: true,
        spacing: { beforeItem: 4, afterItem: 8 },
    },

    skills: {
        layout: 'key-value',
        separator: ', ',
        showCategoryNames: true,
    },

    customSections: {
        defaultLayout: [
            {
                align: 'left',
                fields: [
                    { name: 'title', style: 'bold', separator: '' },
                ],
            },
        ],
    },

    links: {
        style: 'color',
        color: '#2563eb',
    },

    pageNumbers: {
        show: true,
        position: 'bottom-right',
        format: 'Page X',
    },

    headerOnFirstPageOnly: true,
    dateFormat: 'MMM YYYY',
};

// === DEFAULT MODERN TEMPLATE ===
export const DEFAULT_MODERN_TEMPLATE: TemplateSchema = {
    ...DEFAULT_ATS_TEMPLATE,
    id: 'modern-default',
    name: 'Modern Clean',
    description: 'Contemporary design with subtle accents, ATS-compatible',

    typography: {
        fontFamily: 'Inter',
        sizes: { name: 28, sectionHeader: 13, itemTitle: 11, body: 10 },
        colors: { name: '#111827', headers: '#1f2937', body: '#374151', accent: '#0ea5e9', links: '#0ea5e9' },
    },

    header: {
        ...DEFAULT_ATS_TEMPLATE.header,
        nameAlign: 'left',
        showIcons: true,
    },

    sectionHeaders: {
        style: 'uppercase',
        divider: true,
        dividerStyle: 'line',
    },
};

// ============================================================
// BUILTIN TEMPLATES FOR EDITOR (Classic & Modern preset styles)
// These match the hardcoded Classic/Modern styles in the editor
// ============================================================

// CLASSIC: All black, centered header, traditional layout
export const BUILTIN_CLASSIC_TEMPLATE: TemplateSchema = {
    ...DEFAULT_ATS_TEMPLATE,
    id: 'builtin-classic',
    name: 'Classic',
    description: 'Traditional centered layout with all black text',
    isBuiltIn: true,

    typography: {
        fontFamily: 'Arial',
        sizes: { name: 24, sectionHeader: 14, itemTitle: 11, body: 11 },
        // ALL BLACK - no accent colors
        colors: { name: '#000000', headers: '#000000', body: '#000000', accent: '#000000', links: '#000000' },
    },

    header: {
        nameAlign: 'center',
        nameStyle: 'bold',
        contactRows: [
            {
                align: 'center',
                fields: [
                    { name: 'email', style: 'normal', separator: ' | ' },
                    { name: 'phone', style: 'normal', separator: ' | ' },
                    { name: 'location', style: 'normal', separator: ' | ' },
                    { name: 'linkedin', style: 'normal', separator: '' },
                ],
            },
        ],
        showIcons: false,
        hideEmptyFields: true,
    },

    sectionHeaders: {
        style: 'bold-uppercase',
        divider: true,
        dividerStyle: 'line',
    },
};

// MODERN: Accent colors, left-aligned header, contemporary look
export const BUILTIN_MODERN_TEMPLATE: TemplateSchema = {
    ...DEFAULT_ATS_TEMPLATE,
    id: 'builtin-modern',
    name: 'Modern',
    description: 'Contemporary design with accent colors',
    isBuiltIn: true,

    typography: {
        fontFamily: 'Inter',
        sizes: { name: 24, sectionHeader: 14, itemTitle: 11, body: 11 },
        // Accent color for headers/links
        colors: { name: '#2563eb', headers: '#2563eb', body: '#000000', accent: '#2563eb', links: '#2563eb' },
    },

    header: {
        nameAlign: 'left',
        nameStyle: 'bold',
        contactRows: [
            {
                align: 'left',
                fields: [
                    { name: 'email', style: 'normal', separator: ' | ' },
                    { name: 'phone', style: 'normal', separator: ' | ' },
                    { name: 'location', style: 'normal', separator: ' | ' },
                    { name: 'linkedin', style: 'normal', separator: '' },
                ],
            },
        ],
        showIcons: false,
        hideEmptyFields: true,
    },

    sectionHeaders: {
        style: 'bold-uppercase',
        divider: true,
        dividerStyle: 'line',
    },
};

// === HELPER: Create empty row ===
export function createEmptyRow(): TemplateRow {
    return {
        fields: [],
        align: 'left',
    };
}

// === HELPER: Create field ===
export function createField(name: string, style: 'bold' | 'italic' | 'normal' = 'normal', separator: string = ''): TemplateField {
    return { name, style, separator };
}

// === HELPER: Validate template ===
export function validateTemplate(template: Partial<TemplateSchema>): string[] {
    const errors: string[] = [];

    if (!template.name?.trim()) {
        errors.push('Template name is required');
    }

    if (!template.header?.contactRows?.length) {
        errors.push('At least one contact row is required');
    }

    if (!template.experience?.rows?.length) {
        errors.push('At least one experience row is required');
    }

    if (!template.education?.rows?.length) {
        errors.push('At least one education row is required');
    }

    if (!template.sectionOrder?.length) {
        errors.push('At least one section must be in the order');
    }

    return errors;
}

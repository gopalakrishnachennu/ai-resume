// Resume formatting settings interface
export interface ResumeSettings {
    // Template Selection
    template: 'classic' | 'modern';

    // Font Settings
    fontFamily: 'Calibri' | 'Arial' | 'Times New Roman' | 'Georgia' | 'Helvetica';
    fontSize: {
        name: number;        // 18-28
        headers: number;     // 11-16
        body: number;        // 9-12
        contact: number;     // 9-11
    };
    fontColor: {
        name: string;
        headers: string;
        body: string;
        contact: string;
        accent: string;      // Dynamic accent color for headings/name
    };

    // Layout Settings
    margins: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
    lineSpacing: number;     // 1.0 - 2.0
    paragraphSpacing: number; // 2-18pt
    sectionSpacing: number;   // 8-24pt

    // Formatting
    alignment: 'left' | 'center';  // For name only
    bodyAlignment: 'left';
    dateFormat: 'MMM YYYY' | 'MM/YYYY' | 'Month YYYY';
    bulletStyle: '•' | '-' | '◦' | '➤' | '◆' | '★' | '❀' | '■' | '▸' | '›';

    // Section Settings
    sectionDivider: boolean;
    dividerColor: string;
    dividerWeight: number;

    // Header Settings
    headerStyle: 'bold' | 'regular';
    headerCase: 'UPPERCASE' | 'Title Case';

    // Contact Info
    contactSeparator: '|' | '•' | '-';

    // Density Mode
    densityMode: 'compact' | 'normal' | 'spacious';
}

export const DEFAULT_ATS_SETTINGS: ResumeSettings = {
    template: 'classic',
    fontFamily: 'Times New Roman',
    fontSize: {
        name: 24,
        headers: 13,
        body: 11,
        contact: 10,
    },
    fontColor: {
        name: '#000000',      // Pure black
        headers: '#000000',   // Pure black
        body: '#000000',      // Pure black
        contact: '#000000',   // Pure black
        accent: '#1D4ED8',    // Blue accent color for modern template
    },
    margins: {
        top: 0.5,
        bottom: 0.5,
        left: 0.75,
        right: 0.75,
    },
    lineSpacing: 1.1,
    paragraphSpacing: 4,
    sectionSpacing: 16,  // Increased for better spacing
    alignment: 'center',
    bodyAlignment: 'left',
    dateFormat: 'MMM YYYY',
    bulletStyle: '•',
    sectionDivider: true,
    dividerColor: '#000000',
    dividerWeight: 1,
    headerStyle: 'bold',
    headerCase: 'Title Case',
    contactSeparator: '|',
    densityMode: 'compact',
};

// ATS-approved font stacks
export const FONT_STACKS = {
    'Calibri': '"Calibri", "Helvetica Neue", Arial, sans-serif',
    'Arial': 'Arial, "Helvetica Neue", Helvetica, sans-serif',
    'Times New Roman': '"Times New Roman", Times, Georgia, serif',
    'Georgia': 'Georgia, Times, "Times New Roman", serif',
    'Helvetica': '"Helvetica Neue", Helvetica, Arial, sans-serif',
    'Aptos': '"Aptos", "Segoe UI", "Helvetica Neue", Arial, sans-serif', // New Microsoft default
};

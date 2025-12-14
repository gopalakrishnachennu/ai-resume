export interface WorkHistory {
    company: string;
    title: string;
    startDate: string; // YYYY-MM-DD
    endDate?: string; // YYYY-MM-DD or 'Present'
    description: string;
    location?: string;
}

export interface Education {
    school: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate: string;
    gpa?: string;
}

export interface Profile {
    // Tier 1: Identity
    identity: {
        firstName: string;
        lastName: string;
        fullName: string;
        email: string;
        phone: string;
        location: {
            address: string;
            city: string;
            state: string;
            zip: string;
            country: string;
        };
        linkedin: string;
        github: string;
        portfolio: string;
        website?: string;
    };

    // Tier 2: Work Authorization & Logistics
    authorization: {
        workAuth: 'citizen' | 'greencard' | 'visa' | 'other';
        needSponsor: boolean;
        willingToRelocate: boolean;
        canTravel: boolean;
        travelPercent: number;
        securityClearance?: string;
    };

    // Tier 2: Role Preferences
    role: {
        targetTitle: string;
        salaryMin: number;
        salaryMax: number;
        salaryCurrency: string;
        workMode: 'remote' | 'hybrid' | 'onsite';
        startDate: string; // "Immediate" or date
        noticePeriod: string; // "2 weeks"
    };

    // Tier 3: Experience & Education
    experience: {
        totalYears: number;
        currentCompany: string; // Derived or explicit
        currentTitle: string;   // Derived or explicit
        history: WorkHistory[];
    };

    education: {
        history: Education[];
        highestDegree?: string;
    };

    // Tier 3: Skills
    skills: {
        technical: string[];
        soft: string[];
        languages: { name: string; level: string }[];
        certifications: string[];
    };

    // Tier 2: EEO Compliance
    compliance: {
        gender: string;
        ethnicity: string;
        veteran: string;
        disability: string;
    };

    // Meta
    meta?: {
        lastUpdated: number;
        resumeUrl?: string;
    };
}

// Helper to create an empty profile
export const createEmptyProfile = (): Profile => ({
    identity: {
        firstName: '', lastName: '', fullName: '', email: '', phone: '',
        location: { address: '', city: '', state: '', zip: '', country: '' },
        linkedin: '', github: '', portfolio: ''
    },
    authorization: {
        workAuth: 'citizen', needSponsor: false, willingToRelocate: false,
        canTravel: false, travelPercent: 0
    },
    role: {
        targetTitle: '', salaryMin: 0, salaryMax: 0, salaryCurrency: 'USD',
        workMode: 'onsite', startDate: '', noticePeriod: ''
    },
    experience: { totalYears: 0, currentCompany: '', currentTitle: '', history: [] },
    education: { history: [] },
    skills: { technical: [], soft: [], languages: [], certifications: [] },
    compliance: { gender: '', ethnicity: '', veteran: '', disability: '' }
});

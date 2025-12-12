import { doc, setDoc, getDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Application } from './applicationService';

export interface ActiveSession {
    userId: string;
    applicationId: string;
    jobUrl: string;
    active: boolean;

    // Personal Info (split for forms)
    personalInfo: {
        fullName: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        location: string;
        city: string;
        state: string;
        country: string;
        linkedin: string;
        github: string;
        portfolio: string;
        twitter: string;
        otherUrl: string;
    };

    professionalSummary: string;

    experience: Array<{
        company: string;
        title: string;
        location: string;
        startDate: string;
        endDate: string;
        current: boolean;
        responsibilities: string[];
    }>;

    education: Array<{
        institution: string;
        degree: string;
        field: string;
        graduationDate: string;
        gpa?: string;
    }>;

    skills: {
        languages: string[];
        frameworks: string[];
        tools: string[];
        databases: string[];
        cloud: string[];
        all: string;
    };

    // Job Info
    jobTitle: string;
    jobCompany: string;
    jobDescription: string;

    // Extension Settings
    extensionSettings: {
        workAuthorization: string;
        requireSponsorship: string;
        authorizedCountries: string;
        currentSalary: string;
        salaryExpectation: string;
        salaryMin: string;
        salaryMax: string;
        salaryCurrency: string;
        totalExperience: string;
        defaultExperience: string;
        highestEducation: string;
        workType: string;
        willingToRelocate: string;
        relocateLocations: string;
        noticePeriod: string;
        expectedJoiningDate: string;
        companiesToExclude: string;
        securityClearance: string;
        veteranStatus: string;
        drivingLicense: string;
        gender: string;
        ethnicity: string;
        disabilityStatus: string;
    };

    // Files
    pdfUrl?: string;
    docxUrl?: string;

    // Metadata
    createdAt: Timestamp;
    expiresAt: Timestamp;
}

export class SessionService {
    private static COLLECTION = 'activeSession';

    /**
     * Create or update active session for a user
     */
    static async createSession(
        userId: string,
        app: Application,
        jobUrl: string,
        extensionSettings: Record<string, string>
    ): Promise<void> {
        const resume = (app as any).resume || {};
        const personalInfo = resume.personalInfo || {};

        // Split full name into first/last
        const fullName = personalInfo.fullName || '';
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Parse location
        const location = personalInfo.location || '';
        const locationParts = location.split(',').map((p: string) => p.trim());
        const city = locationParts[0] || '';
        const state = locationParts[1] || '';
        const country = locationParts[2] || 'USA';

        // Transform skills
        const technicalSkills = resume.technicalSkills || {};
        const allSkills: string[] = [];
        Object.values(technicalSkills).forEach((category: unknown) => {
            if (Array.isArray(category)) {
                allSkills.push(...category);
            } else if (typeof category === 'string') {
                allSkills.push(...category.split(',').map(s => s.trim()));
            }
        });

        const session: Omit<ActiveSession, 'createdAt' | 'expiresAt'> & { createdAt: ReturnType<typeof serverTimestamp>; expiresAt: Timestamp } = {
            userId,
            applicationId: app.id,
            jobUrl,
            active: true,

            personalInfo: {
                fullName,
                firstName,
                lastName,
                email: personalInfo.email || '',
                phone: personalInfo.phone || '',
                location,
                city,
                state,
                country,
                linkedin: extensionSettings.linkedinUrl || personalInfo.linkedin || '',
                github: extensionSettings.githubUrl || personalInfo.github || '',
                portfolio: extensionSettings.portfolioUrl || personalInfo.portfolio || '',
                twitter: extensionSettings.twitterUrl || '',
                otherUrl: extensionSettings.otherUrl || '',
            },

            professionalSummary: resume.professionalSummary || '',

            experience: (resume.experience || []).map((exp: any) => ({
                company: exp.company || '',
                title: exp.title || '',
                location: exp.location || '',
                startDate: exp.startDate || '',
                endDate: exp.endDate || 'Present',
                current: !exp.endDate || exp.endDate.toLowerCase().includes('present'),
                responsibilities: exp.highlights || exp.responsibilities || [],
            })),

            education: (resume.education || []).map((edu: any) => ({
                institution: edu.institution || edu.school || '',
                degree: edu.degree || '',
                field: edu.field || edu.major || '',
                graduationDate: edu.graduationDate || edu.endDate || '',
                gpa: edu.gpa || '',
            })),

            skills: {
                languages: technicalSkills.languages || technicalSkills.programmingLanguages || [],
                frameworks: technicalSkills.frameworks || technicalSkills.librariesFrameworks || [],
                tools: technicalSkills.tools || technicalSkills.developerTools || [],
                databases: technicalSkills.databases || [],
                cloud: technicalSkills.cloud || technicalSkills.cloudPlatforms || [],
                all: allSkills.join(', '),
            },

            jobTitle: app.jobTitle || '',
            jobCompany: app.jobCompany || '',
            jobDescription: app.jobDescription || '',

            extensionSettings: {
                workAuthorization: extensionSettings.workAuthorization || '',
                requireSponsorship: extensionSettings.requireSponsorship || '',
                authorizedCountries: extensionSettings.authorizedCountries || '',
                currentSalary: extensionSettings.currentSalary || '',
                salaryExpectation: extensionSettings.salaryExpectation || '',
                salaryMin: extensionSettings.salaryMin || '',
                salaryMax: extensionSettings.salaryMax || '',
                salaryCurrency: extensionSettings.salaryCurrency || 'USD',
                totalExperience: extensionSettings.totalExperience || '',
                defaultExperience: extensionSettings.defaultExperience || '',
                highestEducation: extensionSettings.highestEducation || '',
                workType: extensionSettings.workType || '',
                willingToRelocate: extensionSettings.willingToRelocate || '',
                relocateLocations: extensionSettings.relocateLocations || '',
                noticePeriod: extensionSettings.noticePeriod || '',
                expectedJoiningDate: extensionSettings.expectedJoiningDate || '',
                companiesToExclude: extensionSettings.companiesToExclude || '',
                securityClearance: extensionSettings.securityClearance || '',
                veteranStatus: extensionSettings.veteranStatus || '',
                drivingLicense: extensionSettings.drivingLicense || '',
                gender: extensionSettings.gender || '',
                ethnicity: extensionSettings.ethnicity || '',
                disabilityStatus: extensionSettings.disabilityStatus || '',
            },

            createdAt: serverTimestamp(),
            expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)), // 24 hours
        };

        await setDoc(doc(db, this.COLLECTION, userId), session);
        console.log(`[SessionService] Created active session for user: ${userId}`);
    }

    /**
     * Get active session for a user
     */
    static async getSession(userId: string): Promise<ActiveSession | null> {
        const docSnap = await getDoc(doc(db, this.COLLECTION, userId));
        if (docSnap.exists()) {
            return docSnap.data() as ActiveSession;
        }
        return null;
    }

    /**
     * Clear active session
     */
    static async clearSession(userId: string): Promise<void> {
        await deleteDoc(doc(db, this.COLLECTION, userId));
        console.log(`[SessionService] Cleared session for user: ${userId}`);
    }

    /**
     * Upload PDF to Firebase Storage
     */
    static async uploadPDF(userId: string, pdfBlob: Blob, filename: string): Promise<string> {
        const storageRef = ref(storage, `sessions/${userId}/${filename}.pdf`);
        await uploadBytes(storageRef, pdfBlob);
        const url = await getDownloadURL(storageRef);

        // Update session with PDF URL
        await setDoc(doc(db, this.COLLECTION, userId), { pdfUrl: url }, { merge: true });

        return url;
    }

    /**
     * Upload DOCX to Firebase Storage
     */
    static async uploadDOCX(userId: string, docxBlob: Blob, filename: string): Promise<string> {
        const storageRef = ref(storage, `sessions/${userId}/${filename}.docx`);
        await uploadBytes(storageRef, docxBlob);
        const url = await getDownloadURL(storageRef);

        // Update session with DOCX URL
        await setDoc(doc(db, this.COLLECTION, userId), { docxUrl: url }, { merge: true });

        return url;
    }
}

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
     * Handles both generated resumes (from editor) and imported resumes (from import page)
     */
    static async createSession(
        userId: string,
        app: Application,
        jobUrl: string,
        extensionSettings: Record<string, string>
    ): Promise<void> {
        const resume = (app as any).resume || {};
        const personalInfo = resume.personalInfo || {};

        // Handle name - generated uses 'name', imported uses 'fullName'
        const fullName = personalInfo.name || personalInfo.fullName || '';
        const nameParts = fullName.trim().split(' ').filter((p: string) => p);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Parse location - handle "City, State, Country" format
        const location = personalInfo.location || '';
        const locationParts = location.split(',').map((p: string) => p.trim());
        const city = locationParts[0] || '';
        const state = locationParts[1] || '';
        const country = locationParts[2] || (locationParts.length <= 2 ? 'USA' : '');

        // Transform skills - handle multiple possible structures
        // Generated: skills.technical[] (array of formatted strings like "Category: skill1, skill2")
        // Imported: technicalSkills.{category} (object with arrays)
        // Or: skills.all (comma-separated string)
        const skillsData = resume.skills || {};
        const technicalSkills = resume.technicalSkills || {};

        // Extract individual skill arrays from technicalSkills
        let languages: string[] = technicalSkills.languages || technicalSkills.programmingLanguages || [];
        let frameworks: string[] = technicalSkills.frameworks || technicalSkills.librariesFrameworks || [];
        let tools: string[] = technicalSkills.tools || technicalSkills.developerTools || [];
        let databases: string[] = technicalSkills.databases || [];
        let cloud: string[] = technicalSkills.cloud || technicalSkills.cloudPlatforms || [];

        // Build all skills array from multiple sources
        const allSkillsArray: string[] = [];

        // Source 1: From technicalSkills object (imported resumes)
        Object.values(technicalSkills).forEach((category: unknown) => {
            if (Array.isArray(category)) {
                allSkillsArray.push(...category);
            } else if (typeof category === 'string') {
                allSkillsArray.push(...category.split(',').map(s => s.trim()).filter(s => s));
            }
        });

        // Source 2: From skills.technical array (generated resumes) - parse "Category: skill1, skill2" format
        if (Array.isArray(skillsData.technical)) {
            skillsData.technical.forEach((line: string) => {
                const parts = line.split(':');
                if (parts.length > 1) {
                    const categoryName = parts[0].toLowerCase().trim();
                    const skills = parts[1].split(',').map(s => s.trim()).filter(s => s);
                    allSkillsArray.push(...skills);

                    // Auto-categorize based on category name
                    if (categoryName.includes('language') || categoryName.includes('programming')) {
                        languages.push(...skills);
                    } else if (categoryName.includes('framework') || categoryName.includes('librar')) {
                        frameworks.push(...skills);
                    } else if (categoryName.includes('tool') || categoryName.includes('developer')) {
                        tools.push(...skills);
                    } else if (categoryName.includes('database') || categoryName.includes('data')) {
                        databases.push(...skills);
                    } else if (categoryName.includes('cloud') || categoryName.includes('platform')) {
                        cloud.push(...skills);
                    }
                }
            });
        }

        // Source 3: From skills.all string (if exists)
        if (typeof skillsData.all === 'string' && skillsData.all) {
            const skillsFromAll = skillsData.all.split(',').map((s: string) => s.trim()).filter((s: string) => s);
            allSkillsArray.push(...skillsFromAll);

            // Auto-categorize known skills
            skillsFromAll.forEach((skill: string) => {
                const s = skill.toLowerCase();
                if (['python', 'javascript', 'typescript', 'java', 'go', 'rust', 'c++', 'c#', 'ruby', 'php', 'bash'].some(l => s.includes(l))) {
                    languages.push(skill);
                } else if (['react', 'angular', 'vue', 'django', 'flask', 'spring', 'node', 'express', 'fastapi'].some(f => s.includes(f))) {
                    frameworks.push(skill);
                } else if (['aws', 'azure', 'gcp', 'cloud', 'kubernetes', 'docker', 'eks', 'ecs'].some(c => s.includes(c))) {
                    cloud.push(skill);
                } else if (['postgres', 'mysql', 'mongo', 'redis', 'sql', 'database', 'dynamodb'].some(d => s.includes(d))) {
                    databases.push(skill);
                } else if (['terraform', 'helm', 'jenkins', 'gitlab', 'github', 'git', 'ci/cd', 'ansible', 'prometheus', 'grafana', 'loki'].some(t => s.includes(t))) {
                    tools.push(skill);
                }
            });
        }

        // Get summary - handle both field names
        const professionalSummary = resume.professionalSummary || resume.summary || '';

        // Transform experience - handle ALL possible bullet field names
        const experience = (resume.experience || []).map((exp: any) => {
            // Handle many different bullet field names
            const bullets = exp.bullets || exp.highlights || exp.responsibilities ||
                exp.description || exp.achievements || exp.duties ||
                exp.details || exp.items || exp.points || exp.tasks || [];
            const bulletArray = Array.isArray(bullets) ? bullets : (typeof bullets === 'string' ? [bullets] : []);

            // Handle date formats and "current" job detection
            const endDate = exp.endDate || '';
            const isCurrent = exp.current || !endDate || endDate.toLowerCase().includes('present');

            return {
                company: exp.company || '',
                title: exp.title || exp.position || '',
                location: exp.location || '',
                startDate: exp.startDate || '',
                endDate: isCurrent ? 'Present' : endDate,
                current: isCurrent,
                responsibilities: bulletArray.filter((b: string) => b && b.trim()),
            };
        });

        // Transform education - handle different field names
        const education = (resume.education || []).map((edu: any) => ({
            institution: edu.institution || edu.school || '',
            degree: edu.degree || '',
            field: edu.field || edu.major || edu.fieldOfStudy || '',
            graduationDate: edu.graduationDate || edu.endDate || '',
            gpa: edu.gpa || '',
        }));

        // Build session object
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

            professionalSummary,
            experience,
            education,

            skills: {
                languages: Array.isArray(languages) ? languages : [],
                frameworks: Array.isArray(frameworks) ? frameworks : [],
                tools: Array.isArray(tools) ? tools : [],
                databases: Array.isArray(databases) ? databases : [],
                cloud: Array.isArray(cloud) ? cloud : [],
                all: [...new Set(allSkillsArray)].join(', '), // Remove duplicates
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
        console.log(`[SessionService] Created active session for user: ${userId}`, {
            name: fullName,
            experienceCount: experience.length,
            educationCount: education.length,
            skillCount: allSkillsArray.length,
        });
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

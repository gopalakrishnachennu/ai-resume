import { db } from '@/lib/firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
    serverTimestamp,
} from 'firebase/firestore';

// Application status types
export type ApplicationStatus = 'draft' | 'generated' | 'applied' | 'interview' | 'offer' | 'rejected';

// Application interface
export interface Application {
    id: string;
    userId: string;

    // Job Description Data
    jobId?: string;
    jobTitle: string;
    jobCompany: string;
    jobDescription?: string;
    analyzedAt?: Timestamp;

    // Resume Data
    resumeId?: string;
    hasResume: boolean;
    resume?: {
        personalInfo: any;
        professionalSummary: string;
        technicalSkills: any;
        experience: any[];
        education: any[];
    };
    generatedAt?: Timestamp;
    updatedAt: Timestamp;

    // Status & Metadata
    status: ApplicationStatus;
    atsScore?: number | { total: number;[key: string]: any };
    version: number;

    // Legacy fields for backwards compatibility
    createdAt: Timestamp;
}

// Search options
export interface SearchOptions {
    status?: ApplicationStatus | 'all';
    searchField?: 'title' | 'company' | 'skills' | 'all';
    searchQuery?: string;
    sortBy?: 'newest' | 'oldest' | 'ats-high' | 'ats-low';
}

/**
 * ApplicationService - Manages unified job applications
 */
export class ApplicationService {
    private static COLLECTION = 'applications';

    /**
     * Create a new application from JD analysis
     */
    static async createFromAnalysis(
        userId: string,
        jobId: string,
        jobTitle: string,
        jobCompany: string,
        jobDescription: string
    ): Promise<string> {
        const appId = `app_${Date.now()}_${userId.slice(-6)}`;

        const application: Omit<Application, 'id'> = {
            userId,
            jobId,
            jobTitle,
            jobCompany,
            jobDescription,
            analyzedAt: Timestamp.now(),
            hasResume: false,
            status: 'draft',
            version: 1,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        await setDoc(doc(db, this.COLLECTION, appId), application);
        console.log(`[ApplicationService] Created application: ${appId}`);

        return appId;
    }

    /**
     * Update application with generated resume
     */
    static async updateWithResume(
        appId: string,
        resumeData: {
            personalInfo: any;
            professionalSummary: string;
            technicalSkills: any;
            experience: any[];
            education: any[];
        },
        atsScore?: number
    ): Promise<void> {
        const appRef = doc(db, this.COLLECTION, appId);
        const existing = await getDoc(appRef);

        const updateData: any = {
            hasResume: true,
            resume: resumeData,
            status: 'generated',
            generatedAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            version: existing.exists() ? (existing.data().version || 1) + 1 : 1,
        };

        if (atsScore !== undefined) {
            updateData.atsScore = atsScore;
        }

        await updateDoc(appRef, updateData);
        console.log(`[ApplicationService] Updated application with resume: ${appId}`);
    }

    /**
     * Update application status
     */
    static async updateStatus(appId: string, status: ApplicationStatus): Promise<void> {
        await updateDoc(doc(db, this.COLLECTION, appId), {
            status,
            updatedAt: Timestamp.now(),
        });
        console.log(`[ApplicationService] Status updated: ${appId} -> ${status}`);
    }

    /**
     * Get all applications for a user with filtering
     */
    static async getApplications(
        userId: string,
        options: SearchOptions = {}
    ): Promise<Application[]> {
        const { status = 'all', searchField = 'all', searchQuery = '', sortBy = 'newest' } = options;

        // Base query
        let q = query(
            collection(db, this.COLLECTION),
            where('userId', '==', userId)
        );

        const snapshot = await getDocs(q);
        let applications: Application[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as Application));

        // Filter by status
        if (status !== 'all') {
            applications = applications.filter(app => app.status === status);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            applications = applications.filter(app => {
                if (searchField === 'title' || searchField === 'all') {
                    if (app.jobTitle?.toLowerCase().includes(query)) return true;
                }
                if (searchField === 'company' || searchField === 'all') {
                    if (app.jobCompany?.toLowerCase().includes(query)) return true;
                }
                if (searchField === 'skills' || searchField === 'all') {
                    const skills = app.resume?.technicalSkills;
                    if (skills) {
                        const skillsText = typeof skills === 'object'
                            ? Object.values(skills).join(' ').toLowerCase()
                            : String(skills).toLowerCase();
                        if (skillsText.includes(query)) return true;
                    }
                }
                return false;
            });
        }

        // Helper to safely get timestamp as milliseconds
        const getMillis = (ts: any): number => {
            if (!ts) return 0;
            if (typeof ts.toMillis === 'function') return ts.toMillis();
            if (ts.seconds) return ts.seconds * 1000; // Firestore Timestamp object
            if (ts instanceof Date) return ts.getTime();
            if (typeof ts === 'string') return new Date(ts).getTime();
            if (typeof ts === 'number') return ts;
            return 0;
        };

        // Sort
        applications.sort((a, b) => {
            switch (sortBy) {
                case 'oldest':
                    return getMillis(a.createdAt) - getMillis(b.createdAt);
                case 'ats-high': {
                    const getScore = (val: any) => typeof val === 'object' ? (val?.total || 0) : (val || 0);
                    return getScore(b.atsScore) - getScore(a.atsScore);
                }
                case 'ats-low': {
                    const getScore = (val: any) => typeof val === 'object' ? (val?.total || 0) : (val || 0);
                    return getScore(a.atsScore) - getScore(b.atsScore);
                }
                case 'newest':
                default:
                    return getMillis(b.createdAt) - getMillis(a.createdAt);
            }
        });

        return applications;
    }

    /**
     * Get single application by ID
     */
    static async getById(appId: string): Promise<Application | null> {
        const docSnap = await getDoc(doc(db, this.COLLECTION, appId));
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...docSnap.data() } as Application;
    }

    /**
     * Delete application
     */
    static async delete(appId: string): Promise<void> {
        await deleteDoc(doc(db, this.COLLECTION, appId));
        console.log(`[ApplicationService] Deleted: ${appId}`);
    }

    /**
     * Migrate existing resumes and jobs to applications
     */
    static async migrateUserData(userId: string): Promise<{ migrated: number; skipped: number }> {
        let migrated = 0;
        let skipped = 0;

        try {
            // Get existing resumes
            const resumesQuery = query(
                collection(db, 'resumes'),
                where('userId', '==', userId)
            );
            const resumesSnapshot = await getDocs(resumesQuery);

            for (const resumeDoc of resumesSnapshot.docs) {
                const resume = resumeDoc.data();

                // Check if already migrated
                const existingApp = await this.findByResumeId(userId, resumeDoc.id);
                if (existingApp) {
                    skipped++;
                    continue;
                }

                // Create application from resume
                const appId = `app_${resumeDoc.id}`;
                const application: Omit<Application, 'id'> & { atsScore?: number } = {
                    userId,
                    jobTitle: resume.jobTitle || 'Untitled',
                    jobCompany: resume.jobCompany || resume.company || '',
                    hasResume: true,
                    resumeId: resumeDoc.id,
                    resume: {
                        personalInfo: resume.personalInfo || {},
                        professionalSummary: resume.professionalSummary || '',
                        technicalSkills: resume.technicalSkills || {},
                        experience: resume.experience || [],
                        education: resume.education || [],
                    },
                    status: 'generated',
                    version: 1,
                    createdAt: resume.createdAt || Timestamp.now(),
                    generatedAt: resume.createdAt || Timestamp.now(),
                    updatedAt: resume.updatedAt || Timestamp.now(),
                };

                // Only add optional fields if they have values (Firebase rejects undefined)
                if (resume.jobDescription) {
                    (application as any).jobDescription = resume.jobDescription;
                }
                if (resume.atsScore?.total !== undefined) {
                    application.atsScore = resume.atsScore.total;
                }

                await setDoc(doc(db, this.COLLECTION, appId), application);
                migrated++;
            }

            // Get jobs without resumes (draft applications)
            const jobsQuery = query(
                collection(db, 'jobs'),
                where('userId', '==', userId)
            );
            const jobsSnapshot = await getDocs(jobsQuery);

            for (const jobDoc of jobsSnapshot.docs) {
                const job = jobDoc.data();

                // Check if already has resume application
                const hasResume = await this.findByJobTitle(userId, job.parsedData?.title);
                if (hasResume) {
                    skipped++;
                    continue;
                }

                // Create draft application from job
                const appId = `app_${jobDoc.id}`;
                const existingApp = await getDoc(doc(db, this.COLLECTION, appId));
                if (existingApp.exists()) {
                    skipped++;
                    continue;
                }

                const application: Omit<Application, 'id'> = {
                    userId,
                    jobId: jobDoc.id,
                    jobTitle: job.parsedData?.title || 'Untitled',
                    jobCompany: job.parsedData?.company || '',
                    jobDescription: job.originalDescription,
                    hasResume: false,
                    status: 'draft',
                    version: 1,
                    createdAt: job.createdAt || Timestamp.now(),
                    analyzedAt: job.createdAt || Timestamp.now(),
                    updatedAt: Timestamp.now(),
                };

                await setDoc(doc(db, this.COLLECTION, appId), application);
                migrated++;
            }

            console.log(`[ApplicationService] Migration complete: ${migrated} migrated, ${skipped} skipped`);
            return { migrated, skipped };

        } catch (error) {
            console.error('[ApplicationService] Migration error:', error);
            return { migrated, skipped };
        }
    }

    /**
     * Create application from imported JSON resume (Quick Format flow)
     */
    static async createFromImport(
        userId: string,
        resumeData: {
            personalInfo: any;
            professionalSummary: string;
            technicalSkills: any;
            experience: any[];
            education: any[];
        },
        resumeName?: string
    ): Promise<string> {
        const appId = `app_import_${Date.now()}_${userId.slice(-6)}`;

        const application: Omit<Application, 'id'> = {
            userId,
            jobTitle: resumeName || 'Imported Resume',
            jobCompany: 'Quick Format',
            hasResume: true,
            resume: resumeData,
            status: 'generated',
            version: 1,
            createdAt: Timestamp.now(),
            generatedAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        await setDoc(doc(db, this.COLLECTION, appId), application);
        console.log(`[ApplicationService] Created imported application: ${appId}`);

        return appId;
    }

    /**
     * Add job description to an existing application (no AI processing)
     */
    static async addJobDescription(
        appId: string,
        jobTitle: string,
        jobCompany: string,
        jobDescription: string
    ): Promise<void> {
        await updateDoc(doc(db, this.COLLECTION, appId), {
            jobTitle,
            jobCompany,
            jobDescription,
            updatedAt: Timestamp.now(),
        });
        console.log(`[ApplicationService] Added JD to application: ${appId}`);
    }

    /**
     * Find application by resume ID
     */
    private static async findByResumeId(userId: string, resumeId: string): Promise<Application | null> {
        const q = query(
            collection(db, this.COLLECTION),
            where('userId', '==', userId),
            where('resumeId', '==', resumeId)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Application;
    }

    /**
     * Find application by job title (for deduplication)
     */
    private static async findByJobTitle(userId: string, jobTitle?: string): Promise<Application | null> {
        if (!jobTitle) return null;
        const q = query(
            collection(db, this.COLLECTION),
            where('userId', '==', userId),
            where('jobTitle', '==', jobTitle),
            where('hasResume', '==', true)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Application;
    }

    /**
     * Check if application exists for similar job
     */
    static async findExistingApplication(
        userId: string,
        jobTitle: string,
        jobCompany: string
    ): Promise<Application | null> {
        const q = query(
            collection(db, this.COLLECTION),
            where('userId', '==', userId),
            where('jobTitle', '==', jobTitle),
            where('jobCompany', '==', jobCompany)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Application;
    }
}

// Status configuration for UI
export const APPLICATION_STATUSES: {
    value: ApplicationStatus;
    label: string;
    color: string;
    bgColor: string;
    icon: string;
}[] = [
        { value: 'draft', label: 'Draft', color: 'text-slate-600', bgColor: 'bg-slate-100', icon: '📝' },
        { value: 'generated', label: 'Generated', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: '✅' },
        { value: 'applied', label: 'Applied', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: '📤' },
        { value: 'interview', label: 'Interview', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: '📞' },
        { value: 'offer', label: 'Offer', color: 'text-emerald-600', bgColor: 'bg-emerald-100', icon: '🎉' },
        { value: 'rejected', label: 'Rejected', color: 'text-red-600', bgColor: 'bg-red-100', icon: '❌' },
    ];

export function getStatusConfig(status: ApplicationStatus) {
    return APPLICATION_STATUSES.find(s => s.value === status) || APPLICATION_STATUSES[0];
}

/**
 * Applied Jobs Service - Fetches and manages applied jobs with Q&A
 */

import {
    collection,
    getDocs,
    query,
    orderBy,
    limit,
    doc,
    deleteDoc,
    Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface AppliedJobQA {
    q: string;
    a: string;
    cat?: string;
}

export interface AppliedJob {
    id: string;
    url: string;
    title: string;
    platform: string;
    jobTitle: string;
    company: string;
    appliedAt: Date;
    questionsAnswered: number;
    qa: AppliedJobQA[];
    jobDescription?: string;
    resumeId?: string;
    submissionTrigger?: string;
}

/**
 * Fetch all applied jobs for a user
 */
export async function getAppliedJobs(userId: string): Promise<AppliedJob[]> {
    try {
        const appliedJobsRef = collection(db, 'users', userId, 'appliedJobs');
        const q = query(appliedJobsRef, orderBy('appliedAt', 'desc'), limit(100));
        const snapshot = await getDocs(q);

        const jobs: AppliedJob[] = [];

        snapshot.forEach((doc) => {
            const data = doc.data();

            // Parse Q&A array
            const qa: AppliedJobQA[] = [];
            if (Array.isArray(data.qa)) {
                data.qa.forEach((item: any) => {
                    if (item.q && item.a) {
                        qa.push({
                            q: item.q,
                            a: item.a,
                            cat: item.cat || ''
                        });
                    }
                });
            }

            // Convert timestamp
            let appliedAt = new Date();
            if (data.appliedAt) {
                if (data.appliedAt instanceof Timestamp) {
                    appliedAt = data.appliedAt.toDate();
                } else if (typeof data.appliedAt === 'string') {
                    appliedAt = new Date(data.appliedAt);
                }
            }

            jobs.push({
                id: doc.id,
                url: data.url || '',
                title: data.title || '',
                platform: data.platform || 'Unknown',
                jobTitle: data.jobTitle || 'Unknown Position',
                company: data.company || 'Unknown Company',
                appliedAt,
                questionsAnswered: data.questionsAnswered || qa.length,
                qa,
                jobDescription: data.jobDescription || '',
                resumeId: data.resumeId || '',
                submissionTrigger: data.submissionTrigger || ''
            });
        });

        return jobs;
    } catch (error) {
        console.error('Error fetching applied jobs:', error);
        return [];
    }
}

/**
 * Delete an applied job
 */
export async function deleteAppliedJob(userId: string, jobId: string): Promise<boolean> {
    try {
        const jobRef = doc(db, 'users', userId, 'appliedJobs', jobId);
        await deleteDoc(jobRef);
        return true;
    } catch (error) {
        console.error('Error deleting applied job:', error);
        return false;
    }
}

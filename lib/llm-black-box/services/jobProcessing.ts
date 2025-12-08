/**
 * Job Processing Service
 * 
 * Handles job description parsing with:
 * - Firebase cache integration
 * - LLM Black Box execution
 * - Real-time Firestore updates
 * - HIGH priority processing
 */

import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { LLMBlackBox } from '../index';
import { FirebaseCacheManager } from '../cache/cacheManager';

export interface JobAnalysis {
    title: string;
    company: string;
    requiredSkills: string[];
    preferredSkills: string[];
    keywords: string[];
    experienceLevel: 'Entry' | 'Mid' | 'Senior' | 'Lead' | 'Executive';
    yearsRequired: number;
    qualifications: string[];
    responsibilities: string[];
}

export interface JobDocument {
    userId: string;
    hash: string;
    originalDescription: string;
    parsedData?: JobAnalysis;
    cached: boolean;
    hitCount: number;
    tokensUsed: number;
    createdAt: any;
    expiresAt: any;
}

export class JobProcessingService {
    /**
     * Process job description with caching
     * This is the main entry point for job analysis
     */
    static async processJobDescription(
        jobId: string,
        userId: string,
        jobDescription: string,
        userConfig: {
            provider: 'openai' | 'claude' | 'gemini';
            apiKey: string;
        }
    ): Promise<{
        jobAnalysis: JobAnalysis;
        cached: boolean;
        tokensUsed: number;
        processingTime: number;
    }> {
        const startTime = Date.now();

        console.log(`🔍 Processing job: ${jobId}`);

        // Step 1: Generate hash for caching
        const hash = FirebaseCacheManager.generateKey(jobDescription);

        // Step 2: Check Firebase cache
        const cached = await FirebaseCacheManager.get<JobAnalysis>('job', hash);

        if (cached) {
            // Cache hit! Update job document and return
            await this.updateJobDocument(jobId, userId, jobDescription, hash, cached.data, true, 0);

            const processingTime = Date.now() - startTime;
            console.log(`✅ Job processed from cache in ${processingTime}ms`);

            return {
                jobAnalysis: cached.data,
                cached: true,
                tokensUsed: 0,
                processingTime,
            };
        }

        // Step 3: Cache miss - Call LLM Black Box
        console.log(`🤖 Calling LLM for job analysis...`);

        const { data, response } = await LLMBlackBox.executeJSON<JobAnalysis>(
            'phase1',
            'jobParser',
            { job_description: jobDescription },
            userConfig,
            { debug: true }
        );

        // Step 4: Cache the result
        await FirebaseCacheManager.set(
            'job',
            hash,
            data,
            response.tokensUsed.total
        );

        // Step 5: Update job document
        await this.updateJobDocument(
            jobId,
            userId,
            jobDescription,
            hash,
            data,
            false,
            response.tokensUsed.total
        );

        const processingTime = Date.now() - startTime;
        console.log(`✅ Job processed with LLM in ${processingTime}ms`);

        return {
            jobAnalysis: data,
            cached: false,
            tokensUsed: response.tokensUsed.total,
            processingTime,
        };
    }

    /**
     * Update job document in Firestore
     */
    private static async updateJobDocument(
        jobId: string,
        userId: string,
        originalDescription: string,
        hash: string,
        parsedData: JobAnalysis,
        cached: boolean,
        tokensUsed: number
    ): Promise<void> {
        const jobRef = doc(db, 'jobs', jobId);

        // Check if document exists to increment hitCount
        const existing = await getDoc(jobRef);
        const hitCount = existing.exists() ? (existing.data().hitCount || 0) + 1 : 1;

        const now = Date.now();
        const expiresAt = new Date(now + 24 * 60 * 60 * 1000); // 24 hours

        const jobDoc: Partial<JobDocument> = {
            userId,
            hash,
            originalDescription,
            parsedData,
            cached,
            hitCount,
            tokensUsed: existing.exists() ? existing.data().tokensUsed + tokensUsed : tokensUsed,
            expiresAt,
        };

        if (!existing.exists()) {
            (jobDoc as any).createdAt = serverTimestamp();
        }

        await setDoc(jobRef, jobDoc, { merge: true });

        console.log(`💾 Updated job document: ${jobId} (hit #${hitCount})`);
    }

    /**
     * Extract keywords from job description
     * Separate call for more focused keyword extraction
     */
    static async extractKeywords(
        jobDescription: string,
        userConfig: {
            provider: 'openai' | 'claude' | 'gemini';
            apiKey: string;
        }
    ): Promise<string[]> {
        const hash = FirebaseCacheManager.generateKey(`keywords_${jobDescription}`);

        // Check cache
        const cached = await FirebaseCacheManager.get<string[]>('job', hash);
        if (cached) {
            console.log(`✅ Keywords from cache`);
            return cached.data;
        }

        // Call LLM
        const { data } = await LLMBlackBox.executeJSON<string[]>(
            'phase1',
            'keywordExtractor',
            { job_description: jobDescription },
            userConfig
        );

        // Cache result
        await FirebaseCacheManager.set('job', hash, data, 200);

        return data;
    }

    /**
     * Detect experience level
     */
    static async detectExperienceLevel(
        jobDescription: string,
        userConfig: {
            provider: 'openai' | 'claude' | 'gemini';
            apiKey: string;
        }
    ): Promise<{
        level: 'Entry' | 'Mid' | 'Senior' | 'Lead' | 'Executive';
        yearsMin: number;
        yearsMax: number;
        reasoning: string;
    }> {
        const hash = FirebaseCacheManager.generateKey(`experience_${jobDescription}`);

        // Check cache
        const cached = await FirebaseCacheManager.get<any>('job', hash);
        if (cached) {
            console.log(`✅ Experience level from cache`);
            return cached.data;
        }

        // Call LLM
        const { data } = await LLMBlackBox.executeJSON(
            'phase1',
            'experienceDetector',
            { job_description: jobDescription },
            userConfig
        );

        // Cache result
        await FirebaseCacheManager.set('job', hash, data, 150);

        return data;
    }

    /**
     * Get job analysis by ID
     */
    static async getJobAnalysis(jobId: string): Promise<JobAnalysis | null> {
        try {
            const jobRef = doc(db, 'jobs', jobId);
            const jobDoc = await getDoc(jobRef);

            if (!jobDoc.exists()) {
                return null;
            }

            const data = jobDoc.data() as JobDocument;
            return data.parsedData || null;

        } catch (error) {
            console.error('Error getting job analysis:', error);
            return null;
        }
    }

    /**
     * Check if job is cached
     */
    static async isJobCached(jobDescription: string): Promise<boolean> {
        const hash = FirebaseCacheManager.generateKey(jobDescription);
        return await FirebaseCacheManager.has('job', hash);
    }
}

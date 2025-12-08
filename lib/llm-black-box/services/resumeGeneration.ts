/**
 * Resume Generation Service
 * 
 * Generates natural-sounding resume content based on:
 * - User profile (experience WITHOUT responsibilities)
 * - Job analysis
 * 
 * AI Generates:
 * 1. Professional Summary (human-like, not robotic)
 * 2. Responsibilities for EACH company (natural bullets)
 * 3. Technical Skills (key:value pairs, categorized)
 */

import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { LLMBlackBox } from '../index';
import { FirebaseCacheManager } from '../cache/cacheManager';
import { JobAnalysis } from './jobProcessing';

export interface UserProfile {
    personalInfo: {
        name: string;
        email: string;
        phone: string;
        location: string;
        linkedin?: string;
        github?: string;
    };
    experience: Array<{
        company: string;
        title: string;
        location: string;
        startDate: string;
        endDate: string;
        current: boolean;
    }>;
    education: Array<{
        school: string;
        degree: string;
        field: string;
        graduationDate: string;
    }>;
}

export interface GeneratedResume {
    professionalSummary: string;
    technicalSkills: Record<string, string>; // Key:Value pairs
    experience: Array<{
        company: string;
        title: string;
        location: string;
        startDate: string;
        endDate: string;
        current: boolean;
        responsibilities: string[]; // AI-generated, natural
    }>;
    education: Array<{
        school: string;
        degree: string;
        field: string;
        graduationDate: string;
    }>;
}

export class ResumeGenerationService {
    /**
     * Generate complete resume from user profile + job analysis
     */
    static async generateResume(
        resumeId: string,
        userId: string,
        userProfile: UserProfile,
        jobAnalysis: JobAnalysis,
        userConfig: {
            provider: 'openai' | 'claude' | 'gemini';
            apiKey: string;
        }
    ): Promise<{
        resume: GeneratedResume;
        cached: boolean;
        tokensUsed: number;
        processingTime: number;
    }> {
        const startTime = Date.now();

        console.log(`📝 Generating resume: ${resumeId}`);

        // Generate cache key from profile + job
        const cacheKey = this.generateCacheKey(userProfile, jobAnalysis);

        // Check cache
        const cached = await FirebaseCacheManager.get<GeneratedResume>('resume_section', cacheKey);

        if (cached) {
            const processingTime = Date.now() - startTime;
            console.log(`✅ Resume from cache in ${processingTime}ms`);

            return {
                resume: cached.data,
                cached: true,
                tokensUsed: 0,
                processingTime,
            };
        }

        // Generate all sections in parallel for speed
        const [summary, skills, experienceWithResponsibilities] = await Promise.all([
            this.generateProfessionalSummary(userProfile, jobAnalysis, userConfig),
            this.generateTechnicalSkills(userProfile, jobAnalysis, userConfig),
            this.generateExperienceResponsibilities(userProfile, jobAnalysis, userConfig),
        ]);

        // Combine into complete resume
        const resume: GeneratedResume = {
            professionalSummary: summary,
            technicalSkills: skills,
            experience: experienceWithResponsibilities,
            education: userProfile.education,
        };

        // Calculate total tokens
        const totalTokens = 2500; // Approximate for all sections

        // Cache the result
        await FirebaseCacheManager.set('resume_section', cacheKey, resume, totalTokens);

        const processingTime = Date.now() - startTime;
        console.log(`✅ Resume generated in ${processingTime}ms`);

        return {
            resume,
            cached: false,
            tokensUsed: totalTokens,
            processingTime,
        };
    }

    /**
     * Generate professional summary (human-like, not robotic)
     */
    private static async generateProfessionalSummary(
        userProfile: UserProfile,
        jobAnalysis: JobAnalysis,
        userConfig: any
    ): Promise<string> {
        // Calculate years of experience
        const yearsExp = this.calculateYearsOfExperience(userProfile.experience);

        // Get most recent role
        const recentRole = userProfile.experience[0];

        // Prepare variables for template
        const vars = {
            job_title: jobAnalysis.title,
            years_experience: yearsExp,
            current_title: recentRole.title,
            current_company: recentRole.company,
            required_skills: jobAnalysis.requiredSkills.slice(0, 5).join(', '),
            job_keywords: jobAnalysis.keywords.slice(0, 5).join(', '),
            user_name: userProfile.personalInfo.name,
        };

        // Use execute (not executeJSON) since prompt returns plain text
        const result = await LLMBlackBox.execute(
            'phase2',
            'summaryWriter',
            vars,
            userConfig
        );

        return result.content.trim();
    }

    /**
   * Generate technical skills as key:value pairs
   * Example: { "Languages": "Python, JavaScript, SQL", "Cloud": "AWS, Azure" }
   */
    private static async generateTechnicalSkills(
        userProfile: UserProfile,
        jobAnalysis: JobAnalysis,
        userConfig: any
    ): Promise<Record<string, string>> {
        // Extract skills from experience titles
        const experienceTitles = userProfile.experience.map(exp => exp.title).join(', ');

        const vars = {
            user_skills: experienceTitles, // Use their titles as base
            required_skills: jobAnalysis.requiredSkills.join(', '),
            preferred_skills: jobAnalysis.preferredSkills.join(', '),
        };

        const result = await LLMBlackBox.execute(
            'phase2',
            'skillsOptimizer',
            vars,
            userConfig
        );

        // Parse the response using LLMRouter which handles markdown
        try {
            const { LLMRouter } = await import('../core/llmRouter');
            const parsed = LLMRouter.parseJSON(result.content);

            // Convert to key:value string format
            const skillsKeyValue: Record<string, string> = {};
            for (const [category, skills] of Object.entries(parsed)) {
                if (Array.isArray(skills)) {
                    skillsKeyValue[category] = skills.join(', ');
                } else {
                    skillsKeyValue[category] = String(skills);
                }
            }

            return skillsKeyValue;
        } catch (error) {
            console.error('Failed to parse skills:', error);
            // Return default structure
            return {
                "Technical": jobAnalysis.requiredSkills.slice(0, 5).join(', '),
                "Tools": jobAnalysis.preferredSkills.slice(0, 3).join(', '),
            };
        }
    }

    /**
     * Generate responsibilities for EACH company (natural, not robotic)
     */
    private static async generateExperienceResponsibilities(
        userProfile: UserProfile,
        jobAnalysis: JobAnalysis,
        userConfig: any
    ): Promise<GeneratedResume['experience']> {
        const experienceWithResponsibilities = [];

        // Generate responsibilities for each company
        for (const exp of userProfile.experience) {
            const vars = {
                company: exp.company,
                title: exp.title,
                location: exp.location,
                start_date: exp.startDate,
                end_date: exp.current ? 'Present' : exp.endDate,
                job_title: jobAnalysis.title,
                job_keywords: jobAnalysis.keywords.slice(0, 8).join(', '),
                required_skills: jobAnalysis.requiredSkills.slice(0, 8).join(', '),
            };

            // Use the prompt registry (NO hardcoded prompts!)
            const result = await LLMBlackBox.execute(
                'phase2',
                'experienceWriter',
                vars,
                userConfig
            );

            // Parse responsibilities using LLMRouter
            let responsibilities: string[] = [];
            try {
                const { LLMRouter } = await import('../core/llmRouter');
                const parsed = LLMRouter.parseJSON(result.content);
                responsibilities = Array.isArray(parsed) ? parsed : Object.values(parsed);
            } catch (error) {
                console.error(`Failed to parse responsibilities for ${exp.company}:`, error);
                // Fallback - but still try to be useful
                responsibilities = [
                    `${exp.title} responsibilities at ${exp.company}`,
                    `Worked with technologies relevant to ${jobAnalysis.title}`,
                ];
            }

            experienceWithResponsibilities.push({
                ...exp,
                responsibilities,
            });
        }

        return experienceWithResponsibilities;
    }

    /**
     * Calculate total years of experience
     */
    private static calculateYearsOfExperience(experience: UserProfile['experience']): number {
        let totalMonths = 0;

        for (const exp of experience) {
            const start = new Date(exp.startDate);
            const end = exp.current ? new Date() : new Date(exp.endDate);

            const months = (end.getFullYear() - start.getFullYear()) * 12 +
                (end.getMonth() - start.getMonth());

            totalMonths += months;
        }

        return Math.round(totalMonths / 12);
    }

    /**
     * Generate cache key
     */
    private static generateCacheKey(userProfile: UserProfile, jobAnalysis: JobAnalysis): string {
        const key = JSON.stringify({
            experience: userProfile.experience.map(e => `${e.company}_${e.title}`),
            jobTitle: jobAnalysis.title,
            requiredSkills: jobAnalysis.requiredSkills.slice(0, 5),
        });

        return FirebaseCacheManager.generateKey(key);
    }
}

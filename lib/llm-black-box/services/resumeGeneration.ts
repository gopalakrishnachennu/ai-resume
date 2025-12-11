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
import { LLMRouter } from '../core/llmRouter';
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
            this.generateProfessionalSummary(userProfile, jobAnalysis, userId, userConfig),
            this.generateTechnicalSkills(userProfile, jobAnalysis, userId, userConfig),
            this.generateExperienceResponsibilities(userProfile, jobAnalysis, userId, userConfig),
        ]);

        // ALWAYS generate job titles to match the target JD (dynamic!)
        console.log('🎯 Generating ATS-optimized job titles for target role:', jobAnalysis.title);

        let finalExperience = experienceWithResponsibilities;

        try {
            const generatedTitles = await this.generateJobTitles(userProfile, jobAnalysis, userId, userConfig);

            // Apply generated titles to experience
            finalExperience = experienceWithResponsibilities.map((exp, idx) => ({
                ...exp,
                title: generatedTitles[idx] || exp.title, // Use AI-generated title
            }));

            console.log('✅ Job titles applied:', generatedTitles);
        } catch (error) {
            console.error('⚠️ Failed to generate titles, keeping originals:', error);
        }

        // Combine into complete resume
        const resume: GeneratedResume = {
            professionalSummary: summary,
            technicalSkills: skills,
            experience: finalExperience,
            education: userProfile.education,
        };

        // Calculate total tokens (always includes title generation now)
        const totalTokens = 2800; // Includes title generation

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
 * Generate professional summary with enhanced ATS optimization
 */
    private static async generateProfessionalSummary(
        userProfile: UserProfile,
        jobAnalysis: JobAnalysis,
        userId: string,
        userConfig: any
    ): Promise<string> {
        // Calculate years of experience
        const yearsExp = this.calculateYearsOfExperience(userProfile.experience);

        // Get most recent role
        const recentRole = userProfile.experience[0];

        // Collect all responsibilities for context
        const allResponsibilities = userProfile.experience
            .map(exp => (exp as any).responsibilities?.join('. ') || '')
            .filter(Boolean)
            .join('. ');

        // Build full job description context
        const jobDescription = `
Title: ${jobAnalysis.title}
Company: ${jobAnalysis.company || 'Not specified'}
Required Skills: ${jobAnalysis.requiredSkills.join(', ')}
Preferred Skills: ${jobAnalysis.preferredSkills.join(', ')}
Experience Level: ${jobAnalysis.experienceLevel || 'Mid'}
    `.trim();

        // Prepare skills section (will be generated in parallel, so use placeholder)
        const skillsSection = jobAnalysis.requiredSkills.slice(0, 8).join(', ');

        // Prepare variables for template
        const vars = {
            job_description: jobDescription,
            years_experience: yearsExp,
            all_responsibilities: allResponsibilities || 'No responsibilities provided',
            skills_section: skillsSection,
            current_title: recentRole.title,
        };

        // Use execute (not executeJSON) since prompt returns plain text
        const result = await LLMBlackBox.execute(
            'phase2',
            'summaryWriter',
            vars,
            userConfig,
            { userId }
        );

        console.log('✅ Generated professional summary');
        return result.content.trim();
    }


    /**
   * Generate technical skills as key:value pairs with dynamic categories
   * Example: { "Cloud Platforms": "AWS, Azure, GCP", "DevOps & Automation": "Docker, Kubernetes" }
   */
    private static async generateTechnicalSkills(
        userProfile: UserProfile,
        jobAnalysis: JobAnalysis,
        userId: string,
        userConfig: any
    ): Promise<Record<string, string>> {
        // Extract skills from user profile
        const userSkills = userProfile.experience
            .map(exp => exp.title)
            .filter(Boolean)
            .join(', ');

        // Collect all responsibilities for context
        const responsibilitiesText = userProfile.experience
            .map(exp => (exp as any).responsibilities?.join('. ') || '') // Cast to any because UserProfile doesn't have responsibilities
            .filter(Boolean)
            .join('. ');

        // Get full job description context
        const jobDescription = `
Title: ${jobAnalysis.title}
Company: ${jobAnalysis.company || 'Not specified'}
Required Skills: ${jobAnalysis.requiredSkills.join(', ')}
Preferred Skills: ${jobAnalysis.preferredSkills.join(', ')}
    `.trim();

        const vars = {
            job_description: jobDescription,
            responsibilities_text: responsibilitiesText || 'No responsibilities provided',
            user_skills: userSkills || 'No skills provided',
        };

        const result = await LLMBlackBox.execute(
            'phase2',
            'skillsOptimizer',
            vars,
            userConfig,
            { userId }
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

            console.log('✅ Generated skills with dynamic categories:', Object.keys(skillsKeyValue));
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
 * Generate responsibilities for EACH company with career progression
 */
    private static async generateExperienceResponsibilities(
        userProfile: UserProfile,
        jobAnalysis: JobAnalysis,
        userId: string,
        userConfig: any
    ): Promise<GeneratedResume['experience']> {
        const experienceWithResponsibilities = [];
        const totalCompanies = userProfile.experience.length;

        // Build full job description context
        const jobDescription = `
Title: ${jobAnalysis.title}
Company: ${jobAnalysis.company || 'Not specified'}
Required Skills: ${jobAnalysis.requiredSkills.join(', ')}
Preferred Skills: ${jobAnalysis.preferredSkills.join(', ')}
    `.trim();

        // Build skills section context
        const skillsSection = jobAnalysis.requiredSkills.slice(0, 10).join(', ');

        // Generate responsibilities for each company
        for (let idx = 0; idx < userProfile.experience.length; idx++) {
            const exp = userProfile.experience[idx];

            // Calculate years at company
            const startDate = new Date(exp.startDate);
            const endDate = exp.current ? new Date() : new Date(exp.endDate);
            const yearsAtCompany = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365 * 10)) / 10);

            const vars = {
                job_description: jobDescription,
                company: exp.company,
                title: exp.title,
                years_at_company: yearsAtCompany,
                company_index: idx, // 0 = most recent
                total_companies: totalCompanies,
                skills_section: skillsSection,
            };

            // Use the prompt registry
            const result = await LLMBlackBox.execute(
                'phase2',
                'experienceWriter',
                vars,
                userConfig,
                { userId }
            );

            // Parse responsibilities using LLMRouter
            let responsibilities: string[] = [];
            try {
                const { LLMRouter } = await import('../core/llmRouter');
                const parsed = LLMRouter.parseJSON(result.content);
                responsibilities = Array.isArray(parsed) ? parsed : Object.values(parsed);

                console.log(`✅ Generated ${responsibilities.length} bullets for ${exp.company} (index ${idx})`);
            } catch (error) {
                console.error(`Failed to parse responsibilities for ${exp.company}:`, error);
                // Fallback
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
     * Generate ATS-optimized job titles with career progression
     */
    private static async generateJobTitles(
        userProfile: UserProfile,
        jobAnalysis: JobAnalysis,
        userId: string,
        userConfig: { provider: 'openai' | 'claude' | 'gemini'; apiKey: string }
    ): Promise<string[]> {
        try {
            // Prepare companies list
            const companiesList = userProfile.experience
                .map((exp, idx) => `${idx + 1}. ${exp.company} (${exp.startDate} - ${exp.current ? 'Present' : exp.endDate})`)
                .join('\n');

            // Extract top keywords from JD (handle both array and object formats)
            const keywords = jobAnalysis.keywords as any;
            const technicalKeywords = Array.isArray(keywords.technical) ? keywords.technical : [];
            const toolsKeywords = Array.isArray(keywords.tools) ? keywords.tools : [];

            const jdKeywords = [
                ...technicalKeywords.slice(0, 3),
                ...toolsKeywords.slice(0, 2),
            ].join(', ');

            const vars = {
                target_job_title: jobAnalysis.title,
                target_company: jobAnalysis.company || 'Target Company',
                jd_keywords: jdKeywords,
                companies: companiesList,
            };

            const { data } = await LLMBlackBox.executeJSON<{ titles: string[] }>(
                'phase4',
                'jobTitleGenerator',
                vars,
                userConfig,
                { userId }
            );

            console.log('✅ Generated job titles:', data.titles);
            return data.titles;
        } catch (error) {
            console.error('⚠️ Error generating job titles:', error);
            // Fallback: use target title with seniority progression
            return userProfile.experience.map((_, idx) => {
                if (idx === 0) return jobAnalysis.title; // Most recent = exact match
                if (idx === 1) return `${jobAnalysis.title.replace('Senior ', '').replace('Lead ', '')}`; // Remove seniority
                return `Junior ${jobAnalysis.title.replace('Senior ', '').replace('Lead ', '')}`; // Earlier = junior
            });
        }
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

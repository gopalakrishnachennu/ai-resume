/**
 * Resume Generation Pipeline
 * 
 * Handles resume generation with AI, validation, and storage.
 * Supports multiple AI providers (Gemini, OpenAI, Claude).
 */

import { PipelineConfig, PipelineStage } from '@/lib/types/Core';
import { db } from '@/lib/firebase';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

// ============================================================================
// TYPES
// ============================================================================

interface ResumeInput {
    jobDescription: string;
    profile: any;
    experience: any[];
    education: any[];
    skills: string[];
    provider: 'gemini' | 'openai' | 'claude';
    apiKey: string;
}

// ============================================================================
// PIPELINE STAGES
// ============================================================================

/**
 * Stage 1: Validate Input
 */
const validateResumeInputStage: PipelineStage = {
    name: 'validate-resume-input',
    description: 'Validate resume generation input',

    execute: async (context) => {
        const { jobDescription, profile, provider, apiKey } = context.input as ResumeInput;

        if (!jobDescription || !jobDescription.trim()) {
            throw new Error('Job description is required');
        }

        if (!profile || !profile.fullName) {
            throw new Error('Profile information is required');
        }

        if (!provider) {
            throw new Error('AI provider is required');
        }

        if (!apiKey || !apiKey.trim()) {
            throw new Error('API key is required');
        }

        console.log('[ResumePipeline] Input validated');

        return {
            ...context.input,
            validated: true,
        };
    },

    onError: async (error, context) => {
        console.error('[ResumePipeline] Validation failed:', error);
        toast.error(`❌ ${error.message}`);
    },
};

/**
 * Stage 2: Generate Resume with AI
 */
const generateResumeStage: PipelineStage = {
    name: 'generate-resume',
    description: 'Generate resume using AI',

    execute: async (context) => {
        const { jobDescription, profile, experience, education, skills, provider, apiKey } = context.input as ResumeInput;

        toast('🤖 Generating your resume...', {
            icon: '⏳',
            duration: 2000,
        });

        // Get the appropriate plugin
        const { pluginRegistry } = await import('@/lib/core');

        let pluginName: string;
        switch (provider) {
            case 'gemini':
                pluginName = 'gemini-plugin';
                break;
            case 'openai':
                pluginName = 'openai-plugin';
                break;
            case 'claude':
                pluginName = 'claude-plugin';
                break;
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }

        // Build prompt
        const prompt = buildResumePrompt(jobDescription, profile, experience, education, skills);

        // Generate with AI
        const resumeContent = await pluginRegistry.executePlugin(pluginName, {
            action: 'generate',
            apiKey,
            prompt,
            systemPrompt: 'You are an expert resume writer. Create professional, ATS-optimized resumes.',
        });

        console.log('[ResumePipeline] Resume generated');

        return {
            ...context.input,
            resumeContent,
            generated: true,
        };
    },

    onError: async (error, context) => {
        console.error('[ResumePipeline] Generation failed:', error);
        toast.error('❌ Failed to generate resume. Please try again.');
        throw error;
    },
};

/**
 * Stage 3: Save to Firebase
 */
const saveResumeStage: PipelineStage = {
    name: 'save-resume',
    description: 'Save generated resume to database',

    execute: async (context) => {
        const { user } = context;
        const { resumeContent, jobDescription, provider } = context.input as any;

        if (!user) {
            // For guests, skip saving
            console.log('[ResumePipeline] Guest user - skipping save');
            return {
                ...context.input,
                saved: false,
            };
        }

        // Save to resumes collection
        const resumeData = {
            userId: user.uid,
            content: resumeContent,
            jobDescription,
            provider,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const resumeRef = await addDoc(collection(db, 'resumes'), resumeData);

        console.log('[ResumePipeline] Resume saved:', resumeRef.id);

        return {
            ...context.input,
            resumeId: resumeRef.id,
            saved: true,
        };
    },

    onError: async (error, context) => {
        console.error('[ResumePipeline] Save failed:', error);
        toast('⚠️ Resume generated but not saved', {
            icon: '⚠️',
        });
        // Don't throw - resume is still generated
    },
};

/**
 * Stage 4: Track Usage
 */
const trackUsageStage: PipelineStage = {
    name: 'track-usage',
    description: 'Track resume generation usage',

    execute: async (context) => {
        const { user } = context;

        if (user?.isAnonymous) {
            // Track guest usage
            const { incrementUsage } = await import('@/lib/services/guestService');
            await incrementUsage(user as any, 'resumeGenerations');
            console.log('[ResumePipeline] Guest usage tracked');
        }

        return context.input;
    },

    onError: async (error, context) => {
        console.error('[ResumePipeline] Usage tracking failed:', error);
        // Don't throw - not critical
    },
};

/**
 * Stage 5: Show Success
 */
const notifyResumeSuccessStage: PipelineStage = {
    name: 'notify-resume-success',
    description: 'Show success notification',

    execute: async (context) => {
        const { saved } = context.input as any;

        if (saved) {
            toast.success('✅ Resume generated and saved!', {
                duration: 3000,
                position: 'top-right',
            });
        } else {
            toast.success('✅ Resume generated!', {
                duration: 3000,
                position: 'top-right',
            });
        }

        console.log('[ResumePipeline] Success notification shown');

        return context.input;
    },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function buildResumePrompt(
    jobDescription: string,
    profile: any,
    experience: any[],
    education: any[],
    skills: string[]
): string {
    return `
Generate a professional, ATS-optimized resume for the following job:

JOB DESCRIPTION:
${jobDescription}

CANDIDATE PROFILE:
Name: ${profile.fullName}
Email: ${profile.email}
Phone: ${profile.phone || 'N/A'}
Location: ${profile.location || 'N/A'}
Title: ${profile.title || 'N/A'}
Summary: ${profile.summary || 'N/A'}

EXPERIENCE:
${experience.map(exp => `
- ${exp.title} at ${exp.company}
  ${exp.startDate} - ${exp.endDate || 'Present'}
  ${exp.description || ''}
`).join('\n')}

EDUCATION:
${education.map(edu => `
- ${edu.degree} from ${edu.institution}
  ${edu.graduationDate || 'N/A'}
`).join('\n')}

SKILLS:
${skills.join(', ')}

Please create a professional resume that:
1. Is tailored to the job description
2. Highlights relevant experience and skills
3. Is ATS-optimized
4. Uses action verbs and quantifiable achievements
5. Is well-formatted and professional

Return the resume in a clean, professional format.
`;
}

// ============================================================================
// PIPELINE CONFIGURATION
// ============================================================================

export const resumePipeline: PipelineConfig = {
    name: 'resume-generation',
    description: 'Generate resume with AI, validation, and storage',

    stages: [
        validateResumeInputStage,
        generateResumeStage,
        saveResumeStage,
        trackUsageStage,
        notifyResumeSuccessStage,
    ],

    timeout: 60000, // 60 seconds
    retryAttempts: 2, // Only 2 retries for AI generation
    retryDelay: 2000,
    rollbackOnError: false, // Don't rollback - AI generation is expensive
    enabled: true,
};

// ============================================================================
// HELPER FUNCTION
// ============================================================================

export async function generateResume(
    input: ResumeInput,
    user: any
): Promise<{ success: boolean; resumeContent?: string; resumeId?: string }> {
    try {
        const { pipelineManager } = await import('@/lib/core');

        if (!pipelineManager.getRegisteredPipelines().has('resume-generation')) {
            pipelineManager.registerPipeline(resumePipeline);
        }

        const result = await pipelineManager.execute(
            'resume-generation',
            input,
            user
        );

        return {
            success: result.success,
            resumeContent: result.data?.resumeContent,
            resumeId: result.data?.resumeId,
        };
    } catch (error) {
        console.error('[ResumePipeline] Execution failed:', error);
        return { success: false };
    }
}

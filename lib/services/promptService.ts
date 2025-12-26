/**
 * Prompt Service - Firebase CRUD for AI Prompts
 * 
 * Priority: User prompts → Admin globals → Code defaults
 */

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { PROMPT_REGISTRY, PromptTemplate, PromptRegistry } from '@/lib/llm-black-box/prompts';

// Firestore paths
const ADMIN_PROMPTS_PATH = 'settings/prompts';

// Flatten registry for easier storage/retrieval
export type FlatPromptKey =
    | 'phase1.jobParser' | 'phase1.keywordExtractor' | 'phase1.experienceDetector'
    | 'phase2.resumeGenerator' | 'phase2.summaryWriter' | 'phase2.skillsOptimizer' | 'phase2.experienceWriter'
    | 'phase3.atsScorer' | 'phase3.keywordMatcher' | 'phase3.formatChecker'
    | 'phase4.suggestionGenerator' | 'phase4.summaryImprover' | 'phase4.experienceOptimizer' | 'phase4.skillsEnhancer' | 'phase4.jobTitleGenerator';

export interface PromptConfig {
    system: string;
    user: string;
    maxTokens: number;
    temperature: number;
    description?: string;
    customInstructions?: string; // Appended to system prompt dynamically
}

export interface StoredPrompts {
    version: string;
    lastUpdated: any;
    prompts: Record<FlatPromptKey, PromptConfig>;
}

export interface PersonaConfig {
    targetRole: string;
    experienceLevel: string;
    writingStyle: string;
    tone: string;
    atsOptimized: boolean;
    summaryRules: string;
    experienceRules: string;
    skillsRules: string;
    skillsCategorized: boolean;
}

// Define mandatory prompts that cannot be empty
export const MANDATORY_PROMPTS: FlatPromptKey[] = [
    'phase1.jobParser',
    'phase2.resumeGenerator',
    'phase2.summaryWriter',
    'phase2.skillsOptimizer',
    'phase2.experienceWriter',
];

// Prompt metadata for UI
export const PROMPT_METADATA: Record<FlatPromptKey, { name: string; description: string; phase: number; mandatory: boolean }> = {
    'phase1.jobParser': { name: 'Job Parser', description: 'Parse job description into structured data', phase: 1, mandatory: true },
    'phase1.keywordExtractor': { name: 'Keyword Extractor', description: 'Extract ATS keywords from job', phase: 1, mandatory: false },
    'phase1.experienceDetector': { name: 'Experience Detector', description: 'Detect required experience level', phase: 1, mandatory: false },
    'phase2.resumeGenerator': { name: 'Resume Generator', description: 'Generate complete resume content', phase: 2, mandatory: true },
    'phase2.summaryWriter': { name: 'Summary Writer', description: 'Write professional summary', phase: 2, mandatory: true },
    'phase2.skillsOptimizer': { name: 'Skills Optimizer', description: 'Optimize skills section', phase: 2, mandatory: true },
    'phase2.experienceWriter': { name: 'Experience Writer', description: 'Write experience bullets', phase: 2, mandatory: true },
    'phase3.atsScorer': { name: 'ATS Scorer', description: 'Score resume for ATS compatibility', phase: 3, mandatory: false },
    'phase3.keywordMatcher': { name: 'Keyword Matcher', description: 'Match keywords in resume', phase: 3, mandatory: false },
    'phase3.formatChecker': { name: 'Format Checker', description: 'Check ATS format compatibility', phase: 3, mandatory: false },
    'phase4.suggestionGenerator': { name: 'Suggestion Generator', description: 'Generate improvement suggestions', phase: 4, mandatory: false },
    'phase4.summaryImprover': { name: 'Summary Improver', description: 'Improve professional summary', phase: 4, mandatory: false },
    'phase4.experienceOptimizer': { name: 'Experience Optimizer', description: 'Optimize experience bullets', phase: 4, mandatory: false },
    'phase4.skillsEnhancer': { name: 'Skills Enhancer', description: 'Enhance skills section', phase: 4, mandatory: false },
    'phase4.jobTitleGenerator': { name: 'Job Title Generator', description: 'Generate ATS-optimized titles', phase: 4, mandatory: false },
};

// Variable templates available in prompts
export const PROMPT_VARIABLES = [
    { name: 'job_description', description: 'Full job posting text' },
    { name: 'job_title', description: 'Target job title' },
    { name: 'job_keywords', description: 'Extracted keywords from job' },
    { name: 'required_skills', description: 'Required skills from job' },
    { name: 'experience_level', description: 'Required experience level' },
    { name: 'user_name', description: 'User\'s full name' },
    { name: 'user_email', description: 'User\'s email address' },
    { name: 'user_phone', description: 'User\'s phone number' },
    { name: 'user_location', description: 'User\'s location' },
    { name: 'user_experience', description: 'User\'s work experience' },
    { name: 'user_education', description: 'User\'s education' },
    { name: 'user_skills', description: 'User\'s skills list' },
    { name: 'skills_section', description: 'Generated skills section' },
    { name: 'resume_content', description: 'Full resume content' },
    { name: 'current_title', description: 'Current job title' },
    { name: 'years_experience', description: 'Years of experience' },
];

/**
 * Flatten the nested PromptRegistry into a flat Record
 */
function flattenRegistry(registry: PromptRegistry): Record<FlatPromptKey, PromptConfig> {
    const flat: Record<string, PromptConfig> = {};

    for (const [phaseKey, phasePrompts] of Object.entries(registry)) {
        if (phaseKey === 'version') continue;
        for (const [promptKey, prompt] of Object.entries(phasePrompts as Record<string, PromptTemplate>)) {
            flat[`${phaseKey}.${promptKey}`] = {
                system: prompt.system,
                user: prompt.user,
                maxTokens: prompt.maxTokens,
                temperature: prompt.temperature,
                description: prompt.description,
            };
        }
    }

    return flat as Record<FlatPromptKey, PromptConfig>;
}

/**
 * Get code defaults as flat record
 */
export function getCodeDefaults(): Record<FlatPromptKey, PromptConfig> {
    return flattenRegistry(PROMPT_REGISTRY);
}

/**
 * Get admin global prompts from Firebase
 */
export async function getAdminPrompts(): Promise<StoredPrompts | null> {
    try {
        const docSnap = await getDoc(doc(db, ADMIN_PROMPTS_PATH));
        if (!docSnap.exists()) return null;
        return docSnap.data() as StoredPrompts;
    } catch (error) {
        console.error('[PromptService] Error getting admin prompts:', error);
        return null;
    }
}

/**
 * Save admin global prompts to Firebase
 */
export async function saveAdminPrompts(prompts: Record<FlatPromptKey, PromptConfig>): Promise<void> {
    const stored: StoredPrompts = {
        version: PROMPT_REGISTRY.version,
        lastUpdated: serverTimestamp(),
        prompts,
    };
    await setDoc(doc(db, ADMIN_PROMPTS_PATH), stored);
    console.log('[PromptService] Admin prompts saved');
}

/**
 * Initialize admin prompts with code defaults (first run)
 */
export async function initializeAdminPrompts(): Promise<void> {
    const existing = await getAdminPrompts();
    if (!existing) {
        console.log('[PromptService] First run - initializing admin prompts with code defaults');
        await saveAdminPrompts(getCodeDefaults());
    }
}

/**
 * Reset admin prompts to code defaults
 */
export async function resetAdminPrompts(): Promise<void> {
    await saveAdminPrompts(getCodeDefaults());
    console.log('[PromptService] Admin prompts reset to code defaults');
}

/**
 * Get user's custom prompts from Firebase
 */
export async function getUserPrompts(userId: string): Promise<StoredPrompts | null> {
    try {
        const docSnap = await getDoc(doc(db, 'users', userId, 'prompts', 'custom'));
        if (!docSnap.exists()) return null;
        return docSnap.data() as StoredPrompts;
    } catch (error) {
        console.error('[PromptService] Error getting user prompts:', error);
        return null;
    }
}

/**
 * Save user's custom prompts to Firebase
 */
export async function saveUserPrompts(userId: string, prompts: Record<FlatPromptKey, PromptConfig>): Promise<void> {
    // Validate mandatory prompts are not empty
    for (const key of MANDATORY_PROMPTS) {
        const prompt = prompts[key];
        if (!prompt.system?.trim() || !prompt.user?.trim()) {
            throw new Error(`Mandatory prompt "${PROMPT_METADATA[key].name}" cannot be empty`);
        }
    }

    const stored: StoredPrompts = {
        version: PROMPT_REGISTRY.version,
        lastUpdated: serverTimestamp(),
        prompts,
    };
    await setDoc(doc(db, 'users', userId, 'prompts', 'custom'), stored);
    console.log('[PromptService] User prompts saved');
}

/**
 * Reset user prompts (delete custom, fall back to admin/defaults)
 */
export async function resetUserPrompts(userId: string): Promise<void> {
    await deleteDoc(doc(db, 'users', userId, 'prompts', 'custom'));
    console.log('[PromptService] User prompts reset');
}

/**
 * Get the active prompts for a user
 * Priority: User prompts → Admin prompts → Code defaults
 */
export async function getActivePrompts(userId?: string): Promise<Record<FlatPromptKey, PromptConfig>> {
    // Try user prompts first
    if (userId) {
        const userPrompts = await getUserPrompts(userId);
        if (userPrompts?.prompts) {
            console.log('[PromptService] Using user custom prompts');
            return userPrompts.prompts;
        }
    }

    // Try admin prompts
    const adminPrompts = await getAdminPrompts();
    if (adminPrompts?.prompts) {
        console.log('[PromptService] Using admin global prompts');
        return adminPrompts.prompts;
    }

    // Fall back to code defaults
    console.log('[PromptService] Using code defaults');
    return getCodeDefaults();
}

/**
 * Get a specific prompt by key
 */
export async function getPrompt(key: FlatPromptKey, userId?: string): Promise<PromptConfig> {
    const prompts = await getActivePrompts(userId);
    return prompts[key];
}

/**
 * Get user's persona configuration
 */
export async function getPersonaConfig(userId: string): Promise<PersonaConfig | null> {
    try {
        const docSnap = await getDoc(doc(db, 'users', userId, 'settings', 'persona'));
        if (!docSnap.exists()) return null;
        return docSnap.data() as PersonaConfig;
    } catch (error) {
        console.error('[PromptService] Error getting persona config:', error);
        return null;
    }
}

/**
 * Save user's persona configuration
 */
export async function savePersonaConfig(userId: string, config: PersonaConfig): Promise<void> {
    await setDoc(doc(db, 'users', userId, 'settings', 'persona'), config);
    console.log('[PromptService] Persona config saved');
}

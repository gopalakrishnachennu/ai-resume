/**
 * LLM Black Box - Main Interface
 * 
 * Central hub for all LLM operations with:
 * - In-memory prompt templates
 * - Jinja-style template engine
 * - Prompt caching
 * - Token optimization
 * - Multi-provider routing
 * - Dynamic prompt loading from Firebase
 * 
 * Usage:
 * ```typescript
 * const result = await LLMBlackBox.executeWithUser(
 *   'phase1', 'jobParser',
 *   { job_description: '...' },
 *   { provider: 'gemini', apiKey: '...' },
 *   userId // Optional: load user's custom prompts
 * );
 * ```
 */

import { PROMPT_REGISTRY, PromptTemplate } from './prompts';
import { TemplateEngine } from './engine/templateEngine';
import { PromptCache } from './engine/promptCache';
import { TokenOptimizer } from './core/tokenOptimizer';
import { LLMRouter, LLMRequest, LLMResponse } from './core/llmRouter';
import { getActivePrompts, FlatPromptKey, PromptConfig } from '@/lib/services/promptService';

// In-memory cache for dynamic prompts
let _dynamicPrompts: Record<FlatPromptKey, PromptConfig> | null = null;
let _dynamicPromptsUserId: string | null = null;

export interface BlackBoxRequest {
    phase: keyof typeof PROMPT_REGISTRY;
    promptKey: string;
    vars: Record<string, any>;
    userConfig: {
        provider: 'openai' | 'claude' | 'gemini';
        apiKey: string;
        model?: string;
    };
    options?: {
        skipCache?: boolean;
        skipOptimization?: boolean;
        debug?: boolean;
    };
}

export interface BlackBoxResponse extends LLMResponse {
    promptUsed: string;
    optimization: {
        originalTokens: number;
        optimizedTokens: number;
        savings: number;
        savingsPercent: number;
    };
    cacheHit: boolean;
}

export interface ExecuteOptions {
    skipCache?: boolean;
    skipOptimization?: boolean;
    debug?: boolean;
    userId?: string;
    forceReloadPrompts?: boolean;
}

export class LLMBlackBox {
    /**
     * Pick a prompt template, preferring dynamic Firebase prompts when loaded
     */
    private static resolveTemplate(
        phase: keyof typeof PROMPT_REGISTRY,
        promptKey: string
    ): PromptTemplate {
        const dynamicPrompt = this.getDynamicPrompt(String(phase), promptKey);
        const phasePrompts = PROMPT_REGISTRY[phase] as any;
        const registryTemplate: PromptTemplate = phasePrompts?.[promptKey];

        if (dynamicPrompt) {
            let systemPrompts = dynamicPrompt.system;
            // Append user custom instructions if present (for Simplified Mode)
            if (dynamicPrompt.customInstructions?.trim()) {
                systemPrompts += `\n\nCRITICAL USER INSTRUCTIONS:\n${dynamicPrompt.customInstructions}`;
            }

            return {
                system: systemPrompts,
                user: dynamicPrompt.user,
                maxTokens: dynamicPrompt.maxTokens,
                temperature: dynamicPrompt.temperature,
            };
        }

        if (!registryTemplate) {
            throw new Error(`Prompt not found: ${phase}.${promptKey}`);
        }

        return registryTemplate;
    }

    /**
     * Render a prompt with validation + caching
     */
    private static renderPrompt(
        fullKey: string,
        template: PromptTemplate,
        vars: Record<string, any>,
        skipCache: boolean = false
    ): string {
        if (!skipCache) {
            const cached = PromptCache.get(fullKey, vars);
            if (cached) return cached;
        }

        const validation = TemplateEngine.validate(template.user);
        if (!validation.valid) {
            console.error(`Template validation failed for ${fullKey}:`, validation.errors);
            throw new Error(`Invalid template: ${validation.errors.join(', ')}`);
        }

        const varCheck = TemplateEngine.hasRequiredVars(template.user, vars);
        if (!varCheck.valid) {
            console.warn(`Missing variables for ${fullKey}:`, varCheck.missing);
        }

        const rendered = TemplateEngine.render(template.user, vars);

        if (!skipCache) {
            PromptCache.set(fullKey, vars, rendered);
        }

        return rendered;
    }

    /**
     * Get rendered prompt with caching
     * This is the core method that combines template + cache
     */
    static getPrompt(
        phase: keyof typeof PROMPT_REGISTRY,
        promptKey: string,
        vars: Record<string, any>,
        skipCache: boolean = false
    ): string {
        const fullKey = `${phase}.${promptKey}`;

        const template = this.resolveTemplate(phase, promptKey);
        return this.renderPrompt(fullKey, template, vars, skipCache);
    }

    /**
     * Execute LLM request with full pipeline
     * This is the main method you'll use
     */
    static async execute(
        phase: keyof typeof PROMPT_REGISTRY,
        promptKey: string,
        vars: Record<string, any>,
        userConfig: {
            provider: 'openai' | 'claude' | 'gemini';
            apiKey: string;
            model?: string;
        },
        options?: ExecuteOptions
    ): Promise<BlackBoxResponse> {
        const startTime = Date.now();
        const fullKey = `${phase}.${promptKey}`;

        // Load dynamic prompts (per-user or admin defaults)
        await this.loadDynamicPrompts(options?.userId, options?.forceReloadPrompts);

        if (options?.debug) {
            console.log(`🚀 Executing: ${fullKey}`);
            console.log('Variables:', Object.keys(vars));
        }

        // Step 1: Get rendered prompt (with caching)
        const template = this.resolveTemplate(phase, promptKey);
        const prompt = this.renderPrompt(fullKey, template, vars, options?.skipCache);

        // Step 3: Optimize tokens (unless skipped)
        let optimizedPrompt = prompt;
        let optimization = {
            originalTokens: 0,
            optimizedTokens: 0,
            savings: 0,
            savingsPercent: 0,
        };

        if (!options?.skipOptimization) {
            const result = TokenOptimizer.optimize(prompt, vars);
            optimizedPrompt = result.optimized;
            optimization = {
                originalTokens: result.originalTokens,
                optimizedTokens: result.optimizedTokens,
                savings: result.savings,
                savingsPercent: result.savingsPercent,
            };

            if (options?.debug) {
                console.log(`💰 Token optimization: ${result.savingsPercent}% saved`);
                console.log(`   Original: ${result.originalTokens} tokens`);
                console.log(`   Optimized: ${result.optimizedTokens} tokens`);
            }
        }

        // Step 4: Route to LLM provider
        const llmRequest: LLMRequest = {
            provider: userConfig.provider,
            apiKey: userConfig.apiKey,
            system: template.system,
            user: optimizedPrompt,
            maxTokens: template.maxTokens,
            temperature: template.temperature,
            model: userConfig.model,
        };

        const llmResponse = await LLMRouter.call(llmRequest);

        // Step 5: Validate response
        if (!LLMRouter.validateResponse(llmResponse)) {
            throw new Error('Invalid response from LLM');
        }

        const totalTime = Date.now() - startTime;

        if (options?.debug) {
            console.log(`✅ Completed in ${totalTime}ms`);
            console.log(`   Tokens used: ${llmResponse.tokensUsed.total}`);
        }

        return {
            ...llmResponse,
            promptUsed: optimizedPrompt,
            optimization,
            cacheHit: PromptCache.has(fullKey, vars),
        };
    }

    /**
     * Load dynamic prompts from Firebase for a user
     * Caches in memory for performance
     */
    static async loadDynamicPrompts(userId?: string, forceReload: boolean = false): Promise<void> {
        // Skip if same user's prompts are already loaded
        if (!forceReload && _dynamicPrompts && _dynamicPromptsUserId === userId) {
            return;
        }

        try {
            _dynamicPrompts = await getActivePrompts(userId);
            _dynamicPromptsUserId = userId || null;
            // Clear template cache when switching users/admin defaults to avoid stale renders
            PromptCache.clear();
            console.log(`[LLMBlackBox] Loaded dynamic prompts for user: ${userId || 'default'}`);
        } catch (error) {
            console.error('[LLMBlackBox] Failed to load dynamic prompts, using defaults');
            _dynamicPrompts = null;
            _dynamicPromptsUserId = null;
            PromptCache.clear();
        }
    }

    /**
     * Get a dynamic prompt from Firebase cache
     */
    static getDynamicPrompt(phase: string, promptKey: string): PromptConfig | null {
        if (!_dynamicPrompts) return null;
        const key = `${phase}.${promptKey}` as FlatPromptKey;
        return _dynamicPrompts[key] || null;
    }

    /**
     * Execute with user's custom prompts from Firebase
     * This is the recommended method for user-facing operations
     */
    static async executeWithUser(
        phase: keyof typeof PROMPT_REGISTRY,
        promptKey: string,
        vars: Record<string, any>,
        userConfig: {
            provider: 'openai' | 'claude' | 'gemini';
            apiKey: string;
            model?: string;
        },
        userId?: string,
        options?: ExecuteOptions
    ): Promise<BlackBoxResponse> {
        return this.execute(phase, promptKey, vars, userConfig, {
            skipCache: options?.skipCache ?? true, // default: avoid shared cache for user prompts
            skipOptimization: options?.skipOptimization,
            debug: options?.debug,
            userId,
            forceReloadPrompts: options?.forceReloadPrompts,
        });
    }

    /**
     * Clear dynamic prompt cache (forces reload on next call)
     */
    static clearDynamicPrompts() {
        _dynamicPrompts = null;
        _dynamicPromptsUserId = null;
    }

    /**
     * Execute and parse JSON response
     * Convenience method for prompts that return JSON
     */
    static async executeJSON<T = any>(
        phase: keyof typeof PROMPT_REGISTRY,
        promptKey: string,
        vars: Record<string, any>,
        userConfig: {
            provider: 'openai' | 'claude' | 'gemini';
            apiKey: string;
            model?: string;
        },
        options?: ExecuteOptions
    ): Promise<{ data: T; response: BlackBoxResponse }> {
        const response = await this.execute(phase, promptKey, vars, userConfig, options);
        const data = LLMRouter.parseJSON<T>(response.content);

        return { data, response };
    }

    /**
     * Batch execute multiple prompts with shared context
     * More efficient than individual calls
     */
    static async executeBatch(
        requests: Array<{
            phase: keyof typeof PROMPT_REGISTRY;
            promptKey: string;
            vars: Record<string, any>;
        }>,
        userConfig: {
            provider: 'openai' | 'claude' | 'gemini';
            apiKey: string;
        },
        sharedContext?: Record<string, any>,
        options?: ExecuteOptions
    ): Promise<BlackBoxResponse[]> {
        // TODO: Implement batch optimization
        // For now, execute sequentially
        const results: BlackBoxResponse[] = [];

        for (const request of requests) {
            const result = await this.execute(
                request.phase,
                request.promptKey,
                { ...sharedContext, ...request.vars },
                userConfig,
                options
            );
            results.push(result);
        }

        return results;
    }

    /**
     * Get cache statistics
     */
    static getCacheStats() {
        return PromptCache.getStats();
    }

    /**
     * Get detailed debug info
     */
    static getDebugInfo() {
        return {
            cache: PromptCache.getDebugInfo(),
            prompts: {
                version: PROMPT_REGISTRY.version,
                phases: Object.keys(PROMPT_REGISTRY).filter(k => k !== 'version'),
                totalPrompts: this.countPrompts(),
            },
        };
    }

    /**
     * Count total prompts in registry
     */
    private static countPrompts(): number {
        let count = 0;
        for (const phase of Object.keys(PROMPT_REGISTRY)) {
            if (phase === 'version') continue;
            const phasePrompts = PROMPT_REGISTRY[phase as keyof typeof PROMPT_REGISTRY];
            count += Object.keys(phasePrompts).length;
        }
        return count;
    }

    /**
     * Clear all caches
     */
    static clearCache() {
        PromptCache.clear();
    }

    /**
     * Validate all templates in registry
     * Useful for testing
     */
    static validateAllTemplates(): {
        valid: boolean;
        errors: Array<{ key: string; errors: string[] }>;
    } {
        const errors: Array<{ key: string; errors: string[] }> = [];

        for (const phase of Object.keys(PROMPT_REGISTRY)) {
            if (phase === 'version') continue;

            const phasePrompts = PROMPT_REGISTRY[phase as keyof typeof PROMPT_REGISTRY];
            for (const promptKey of Object.keys(phasePrompts)) {
                const template = (phasePrompts as any)[promptKey] as PromptTemplate;
                const validation = TemplateEngine.validate(template.user);

                if (!validation.valid) {
                    errors.push({
                        key: `${phase}.${promptKey}`,
                        errors: validation.errors,
                    });
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }
}

// Export everything for convenience
export * from './prompts';
export * from './engine/templateEngine';
export * from './engine/promptCache';
export * from './core/tokenOptimizer';
export * from './core/llmRouter';

/**
 * LLM Black Box - Main Interface
 * 
 * Central hub for all LLM operations with:
 * - In-memory prompt templates
 * - Jinja-style template engine
 * - Prompt caching
 * - Token optimization
 * - Multi-provider routing
 * 
 * Usage:
 * ```typescript
 * const result = await LLMBlackBox.execute(
 *   'phase1', 'jobParser',
 *   { job_description: '...' },
 *   { provider: 'gemini', apiKey: '...' }
 * );
 * ```
 */

import { PROMPT_REGISTRY, PromptTemplate } from './prompts';
import { TemplateEngine } from './engine/templateEngine';
import { PromptCache } from './engine/promptCache';
import { TokenOptimizer } from './core/tokenOptimizer';
import { LLMRouter, LLMRequest, LLMResponse } from './core/llmRouter';

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

export class LLMBlackBox {
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

        // Check cache first (unless skipped)
        if (!skipCache) {
            const cached = PromptCache.get(fullKey, vars);
            if (cached) {
                return cached;
            }
        }

        // Get template from registry
        const phasePrompts = PROMPT_REGISTRY[phase] as any;
        const template: PromptTemplate = phasePrompts?.[promptKey];

        if (!template) {
            throw new Error(`Prompt not found: ${fullKey}`);
        }

        // Validate template syntax
        const validation = TemplateEngine.validate(template.user);
        if (!validation.valid) {
            console.error(`Template validation failed for ${fullKey}:`, validation.errors);
            throw new Error(`Invalid template: ${validation.errors.join(', ')}`);
        }

        // Check if all required variables are present
        const varCheck = TemplateEngine.hasRequiredVars(template.user, vars);
        if (!varCheck.valid) {
            console.warn(`Missing variables for ${fullKey}:`, varCheck.missing);
            // Don't throw - let template engine handle with empty strings
        }

        // Render template
        const rendered = TemplateEngine.render(template.user, vars);

        // Cache rendered prompt
        if (!skipCache) {
            PromptCache.set(fullKey, vars, rendered);
        }

        return rendered;
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
        options?: {
            skipCache?: boolean;
            skipOptimization?: boolean;
            debug?: boolean;
        }
    ): Promise<BlackBoxResponse> {
        const startTime = Date.now();
        const fullKey = `${phase}.${promptKey}`;

        if (options?.debug) {
            console.log(`🚀 Executing: ${fullKey}`);
            console.log('Variables:', Object.keys(vars));
        }

        // Step 1: Get rendered prompt (with caching)
        const prompt = this.getPrompt(phase, promptKey, vars, options?.skipCache);

        // Step 2: Get template config
        const phasePrompts = PROMPT_REGISTRY[phase] as any;
        const template: PromptTemplate = phasePrompts[promptKey];

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
        options?: {
            skipCache?: boolean;
            skipOptimization?: boolean;
            debug?: boolean;
        }
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
        sharedContext?: Record<string, any>
    ): Promise<BlackBoxResponse[]> {
        // TODO: Implement batch optimization
        // For now, execute sequentially
        const results: BlackBoxResponse[] = [];

        for (const request of requests) {
            const result = await this.execute(
                request.phase,
                request.promptKey,
                { ...sharedContext, ...request.vars },
                userConfig
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

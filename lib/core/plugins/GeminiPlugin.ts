/**
 * Gemini AI Plugin
 * 
 * Manages Google Gemini AI API interactions.
 * Provides resume generation and content optimization.
 */

import { Plugin, PluginConfig, PluginMetadata, PluginStatus } from '@/lib/types/Core';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiPlugin implements Plugin {
    metadata: PluginMetadata = {
        name: 'gemini-plugin',
        version: '1.0.0',
        description: 'Google Gemini AI integration for resume generation',
        author: 'AI Resume Builder',
        category: 'ai',
        tags: ['ai', 'gemini', 'google', 'llm'],
    };

    config: PluginConfig = {
        enabled: true,
        settings: {
            model: 'gemini-2.0-flash-exp',
            temperature: 0.7,
            maxTokens: 8000,
            timeout: 30000,
        },
    };

    private metrics = {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        totalExecutionTime: 0,
        totalTokensUsed: 0,
    };

    private genAI: GoogleGenerativeAI | null = null;

    /**
     * Load hook
     */
    async onLoad() {
        console.log('[GeminiPlugin] Loading...');
    }

    /**
     * Initialize hook
     */
    async onInitialize() {
        console.log('[GeminiPlugin] Initializing...');
    }

    /**
     * Enable hook
     */
    async onEnable() {
        console.log('[GeminiPlugin] Enabled');
    }

    /**
     * Disable hook
     */
    async onDisable() {
        console.log('[GeminiPlugin] Disabled');
        this.genAI = null;
    }

    /**
     * Unload hook
     */
    async onUnload() {
        console.log('[GeminiPlugin] Unloading...');
        this.genAI = null;
    }

    /**
     * Execute plugin functionality
     */
    async execute(context: GeminiContext): Promise<any> {
        const startTime = Date.now();
        this.metrics.totalCalls++;

        try {
            const { action, apiKey, prompt, systemPrompt } = context;

            // Initialize Gemini with API key
            if (!this.genAI || context.apiKey) {
                this.genAI = new GoogleGenerativeAI(apiKey);
            }

            let result;
            switch (action) {
                case 'generate':
                    result = await this.generateContent(prompt, systemPrompt);
                    break;
                case 'chat':
                    result = await this.chat(prompt, context.history);
                    break;
                default:
                    throw new Error(`Unknown action: ${action}`);
            }

            this.metrics.successfulCalls++;
            this.metrics.totalExecutionTime += Date.now() - startTime;

            return result;
        } catch (error) {
            this.metrics.failedCalls++;
            this.metrics.totalExecutionTime += Date.now() - startTime;
            throw error;
        }
    }

    /**
     * Validate plugin
     */
    async validate(): Promise<boolean> {
        // Can't validate without API key
        return true;
    }

    /**
     * Get plugin status
     */
    async getStatus(): Promise<PluginStatus> {
        const averageExecutionTime = this.metrics.totalCalls > 0
            ? this.metrics.totalExecutionTime / this.metrics.totalCalls
            : 0;

        return {
            loaded: true,
            enabled: this.config.enabled,
            healthy: true,
            metrics: {
                totalCalls: this.metrics.totalCalls,
                successfulCalls: this.metrics.successfulCalls,
                failedCalls: this.metrics.failedCalls,
                averageExecutionTime,
            },
        };
    }

    // ========================================================================
    // AI OPERATIONS
    // ========================================================================

    /**
     * Generate content
     */
    private async generateContent(prompt: string, systemPrompt?: string): Promise<string> {
        if (!this.genAI) {
            throw new Error('Gemini not initialized');
        }

        try {
            const model = this.genAI.getGenerativeModel({
                model: this.config.settings.model,
            });

            const fullPrompt = systemPrompt
                ? `${systemPrompt}\n\n${prompt}`
                : prompt;

            const result = await model.generateContent(fullPrompt);
            const response = result.response;
            const text = response.text();

            // Track tokens (approximate)
            this.metrics.totalTokensUsed += Math.ceil(text.length / 4);

            return text;
        } catch (error: any) {
            console.error('[GeminiPlugin] Generate content error:', error);

            // Handle specific errors
            if (error.message?.includes('API key')) {
                throw new Error('Invalid Gemini API key');
            }
            if (error.message?.includes('quota')) {
                throw new Error('Gemini API quota exceeded');
            }

            throw error;
        }
    }

    /**
     * Chat with history
     */
    private async chat(prompt: string, history?: Array<{ role: string; content: string }>): Promise<string> {
        if (!this.genAI) {
            throw new Error('Gemini not initialized');
        }

        try {
            const model = this.genAI.getGenerativeModel({
                model: this.config.settings.model,
            });

            const chat = model.startChat({
                history: history?.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }],
                })) || [],
            });

            const result = await chat.sendMessage(prompt);
            const response = result.response;
            const text = response.text();

            // Track tokens (approximate)
            this.metrics.totalTokensUsed += Math.ceil(text.length / 4);

            return text;
        } catch (error: any) {
            console.error('[GeminiPlugin] Chat error:', error);

            if (error.message?.includes('API key')) {
                throw new Error('Invalid Gemini API key');
            }
            if (error.message?.includes('quota')) {
                throw new Error('Gemini API quota exceeded');
            }

            throw error;
        }
    }

    /**
     * Get metrics including token usage
     */
    public getMetrics() {
        return {
            ...this.metrics,
            averageExecutionTime: this.metrics.totalCalls > 0
                ? this.metrics.totalExecutionTime / this.metrics.totalCalls
                : 0,
        };
    }
}

// ============================================================================
// TYPES
// ============================================================================

interface GeminiContext {
    action: 'generate' | 'chat';
    apiKey: string;
    prompt: string;
    systemPrompt?: string;
    history?: Array<{ role: string; content: string }>;
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const geminiPlugin = new GeminiPlugin();

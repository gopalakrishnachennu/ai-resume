/**
 * OpenAI Plugin
 * 
 * Manages OpenAI API interactions for resume generation.
 * Supports GPT-4 and GPT-3.5-turbo models.
 */

import { Plugin, PluginConfig, PluginMetadata, PluginStatus } from '@/lib/types/Core';
import OpenAI from 'openai';

export class OpenAIPlugin implements Plugin {
    metadata: PluginMetadata = {
        name: 'openai-plugin',
        version: '1.0.0',
        description: 'OpenAI GPT integration for resume generation',
        author: 'AI Resume Builder',
        category: 'ai',
        tags: ['ai', 'openai', 'gpt', 'llm'],
    };

    config: PluginConfig = {
        enabled: true,
        settings: {
            model: 'gpt-4-turbo-preview',
            temperature: 0.7,
            maxTokens: 4000,
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

    private openai: OpenAI | null = null;

    async onLoad() {
        console.log('[OpenAIPlugin] Loading...');
    }

    async onInitialize() {
        console.log('[OpenAIPlugin] Initializing...');
    }

    async onEnable() {
        console.log('[OpenAIPlugin] Enabled');
    }

    async onDisable() {
        console.log('[OpenAIPlugin] Disabled');
        this.openai = null;
    }

    async onUnload() {
        console.log('[OpenAIPlugin] Unloading...');
        this.openai = null;
    }

    async execute(context: OpenAIContext): Promise<any> {
        const startTime = Date.now();
        this.metrics.totalCalls++;

        try {
            const { action, apiKey, prompt, systemPrompt } = context;

            if (!this.openai || context.apiKey) {
                this.openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
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

    async validate(): Promise<boolean> {
        return true;
    }

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

    private async generateContent(prompt: string, systemPrompt?: string): Promise<string> {
        if (!this.openai) {
            throw new Error('OpenAI not initialized');
        }

        try {
            const messages: any[] = [];

            if (systemPrompt) {
                messages.push({
                    role: 'system',
                    content: systemPrompt,
                });
            }

            messages.push({
                role: 'user',
                content: prompt,
            });

            const completion = await this.openai.chat.completions.create({
                model: this.config.settings.model,
                messages,
                temperature: this.config.settings.temperature,
                max_tokens: this.config.settings.maxTokens,
            });

            const text = completion.choices[0]?.message?.content || '';

            // Track tokens
            if (completion.usage) {
                this.metrics.totalTokensUsed += completion.usage.total_tokens;
            }

            return text;
        } catch (error: any) {
            console.error('[OpenAIPlugin] Generate content error:', error);

            if (error.code === 'invalid_api_key') {
                throw new Error('Invalid OpenAI API key');
            }
            if (error.code === 'insufficient_quota') {
                throw new Error('OpenAI API quota exceeded');
            }

            throw error;
        }
    }

    private async chat(prompt: string, history?: Array<{ role: string; content: string }>): Promise<string> {
        if (!this.openai) {
            throw new Error('OpenAI not initialized');
        }

        try {
            const messages: any[] = history?.map(msg => ({
                role: msg.role,
                content: msg.content,
            })) || [];

            messages.push({
                role: 'user',
                content: prompt,
            });

            const completion = await this.openai.chat.completions.create({
                model: this.config.settings.model,
                messages,
                temperature: this.config.settings.temperature,
                max_tokens: this.config.settings.maxTokens,
            });

            const text = completion.choices[0]?.message?.content || '';

            if (completion.usage) {
                this.metrics.totalTokensUsed += completion.usage.total_tokens;
            }

            return text;
        } catch (error: any) {
            console.error('[OpenAIPlugin] Chat error:', error);

            if (error.code === 'invalid_api_key') {
                throw new Error('Invalid OpenAI API key');
            }
            if (error.code === 'insufficient_quota') {
                throw new Error('OpenAI API quota exceeded');
            }

            throw error;
        }
    }

    public getMetrics() {
        return {
            ...this.metrics,
            averageExecutionTime: this.metrics.totalCalls > 0
                ? this.metrics.totalExecutionTime / this.metrics.totalCalls
                : 0,
        };
    }
}

interface OpenAIContext {
    action: 'generate' | 'chat';
    apiKey: string;
    prompt: string;
    systemPrompt?: string;
    history?: Array<{ role: string; content: string }>;
}

export const openaiPlugin = new OpenAIPlugin();

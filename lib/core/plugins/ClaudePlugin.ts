/**
 * Claude Plugin
 * 
 * Manages Anthropic Claude API interactions for resume generation.
 * Supports Claude 3 models (Opus, Sonnet, Haiku).
 */

import { Plugin, PluginConfig, PluginMetadata, PluginStatus } from '@/lib/types/Core';
import Anthropic from '@anthropic-ai/sdk';

export class ClaudePlugin implements Plugin {
    metadata: PluginMetadata = {
        name: 'claude-plugin',
        version: '1.0.0',
        description: 'Anthropic Claude AI integration for resume generation',
        author: 'AI Resume Builder',
        category: 'ai',
        tags: ['ai', 'claude', 'anthropic', 'llm'],
    };

    config: PluginConfig = {
        enabled: true,
        settings: {
            model: 'claude-3-5-sonnet-20241022',
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

    private anthropic: Anthropic | null = null;

    async onLoad() {
        console.log('[ClaudePlugin] Loading...');
    }

    async onInitialize() {
        console.log('[ClaudePlugin] Initializing...');
    }

    async onEnable() {
        console.log('[ClaudePlugin] Enabled');
    }

    async onDisable() {
        console.log('[ClaudePlugin] Disabled');
        this.anthropic = null;
    }

    async onUnload() {
        console.log('[ClaudePlugin] Unloading...');
        this.anthropic = null;
    }

    async execute(context: ClaudeContext): Promise<any> {
        const startTime = Date.now();
        this.metrics.totalCalls++;

        try {
            const { action, apiKey, prompt, systemPrompt } = context;

            if (!this.anthropic || context.apiKey) {
                this.anthropic = new Anthropic({
                    apiKey,
                    dangerouslyAllowBrowser: true
                });
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
        if (!this.anthropic) {
            throw new Error('Claude not initialized');
        }

        try {
            const message = await this.anthropic.messages.create({
                model: this.config.settings.model,
                max_tokens: this.config.settings.maxTokens,
                temperature: this.config.settings.temperature,
                system: systemPrompt || undefined,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            });

            const text = message.content[0]?.type === 'text'
                ? message.content[0].text
                : '';

            // Track tokens
            if (message.usage) {
                this.metrics.totalTokensUsed += message.usage.input_tokens + message.usage.output_tokens;
            }

            return text;
        } catch (error: any) {
            console.error('[ClaudePlugin] Generate content error:', error);

            if (error.status === 401) {
                throw new Error('Invalid Claude API key');
            }
            if (error.status === 429) {
                throw new Error('Claude API rate limit exceeded');
            }

            throw error;
        }
    }

    private async chat(prompt: string, history?: Array<{ role: string; content: string }>): Promise<string> {
        if (!this.anthropic) {
            throw new Error('Claude not initialized');
        }

        try {
            const messages: any[] = history?.map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content,
            })) || [];

            messages.push({
                role: 'user',
                content: prompt,
            });

            const message = await this.anthropic.messages.create({
                model: this.config.settings.model,
                max_tokens: this.config.settings.maxTokens,
                temperature: this.config.settings.temperature,
                messages,
            });

            const text = message.content[0]?.type === 'text'
                ? message.content[0].text
                : '';

            if (message.usage) {
                this.metrics.totalTokensUsed += message.usage.input_tokens + message.usage.output_tokens;
            }

            return text;
        } catch (error: any) {
            console.error('[ClaudePlugin] Chat error:', error);

            if (error.status === 401) {
                throw new Error('Invalid Claude API key');
            }
            if (error.status === 429) {
                throw new Error('Claude API rate limit exceeded');
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

interface ClaudeContext {
    action: 'generate' | 'chat';
    apiKey: string;
    prompt: string;
    systemPrompt?: string;
    history?: Array<{ role: string; content: string }>;
}

export const claudePlugin = new ClaudePlugin();

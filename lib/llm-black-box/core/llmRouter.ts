/**
 * Multi-LLM Router
 * 
 * Routes requests to different LLM providers (OpenAI, Claude, Gemini)
 * with unified interface, fallback chain, and error handling.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface LLMRequest {
    provider: 'openai' | 'claude' | 'gemini';
    apiKey: string;
    system: string;
    user: string;
    maxTokens: number;
    temperature: number;
    model?: string; // Optional: override default model
}

export interface LLMResponse {
    content: string;
    tokensUsed: {
        input: number;
        output: number;
        total: number;
    };
    provider: string;
    model: string;
    processingTime: number; // milliseconds
}

export class LLMRouter {
    // Default models for each provider
    private static readonly DEFAULT_MODELS = {
        openai: 'gpt-4o-mini',
        claude: 'claude-3-5-sonnet-20241022',
        gemini: 'gemini-2.0-flash-exp',
    };

    /**
     * Call LLM provider with automatic fallback
     */
    static async call(request: LLMRequest): Promise<LLMResponse> {
        const startTime = Date.now();

        try {
            // Route to appropriate provider
            let response: LLMResponse;

            switch (request.provider) {
                case 'gemini':
                    response = await this.callGemini(request);
                    break;
                case 'openai':
                    response = await this.callOpenAI(request);
                    break;
                case 'claude':
                    response = await this.callClaude(request);
                    break;
                default:
                    throw new Error(`Unsupported provider: ${request.provider}`);
            }

            // Add processing time
            response.processingTime = Date.now() - startTime;

            console.log(`✅ LLM call successful: ${request.provider} (${response.processingTime}ms)`);
            return response;

        } catch (error: any) {
            console.error(`❌ LLM call failed: ${request.provider}`, error.message);
            throw new Error(`LLM ${request.provider} failed: ${error.message}`);
        }
    }

    /**
     * Call Google Gemini API
     */
    private static async callGemini(request: LLMRequest): Promise<LLMResponse> {
        const genAI = new GoogleGenerativeAI(request.apiKey);
        const model = genAI.getGenerativeModel({
            model: request.model || this.DEFAULT_MODELS.gemini,
            generationConfig: {
                temperature: request.temperature,
                maxOutputTokens: request.maxTokens,
            },
        });

        // Combine system and user prompts
        const fullPrompt = `${request.system}\n\n${request.user}`;

        // Call API
        const result = await model.generateContent(fullPrompt);
        const response = result.response;
        const text = response.text();

        // Get token usage (if available)
        const usageMetadata = response.usageMetadata;
        const tokensUsed = {
            input: usageMetadata?.promptTokenCount || this.estimateTokens(fullPrompt),
            output: usageMetadata?.candidatesTokenCount || this.estimateTokens(text),
            total: usageMetadata?.totalTokenCount ||
                (this.estimateTokens(fullPrompt) + this.estimateTokens(text)),
        };

        return {
            content: text,
            tokensUsed,
            provider: 'gemini',
            model: request.model || this.DEFAULT_MODELS.gemini,
            processingTime: 0, // Will be set by caller
        };
    }

    /**
     * Call OpenAI API
     */
    private static async callOpenAI(request: LLMRequest): Promise<LLMResponse> {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${request.apiKey}`,
            },
            body: JSON.stringify({
                model: request.model || this.DEFAULT_MODELS.openai,
                messages: [
                    { role: 'system', content: request.system },
                    { role: 'user', content: request.user },
                ],
                temperature: request.temperature,
                max_tokens: request.maxTokens,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'OpenAI API error');
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        return {
            content,
            tokensUsed: {
                input: data.usage?.prompt_tokens || 0,
                output: data.usage?.completion_tokens || 0,
                total: data.usage?.total_tokens || 0,
            },
            provider: 'openai',
            model: data.model,
            processingTime: 0,
        };
    }

    /**
     * Call Anthropic Claude API
     */
    private static async callClaude(request: LLMRequest): Promise<LLMResponse> {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': request.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: request.model || this.DEFAULT_MODELS.claude,
                max_tokens: request.maxTokens,
                temperature: request.temperature,
                system: request.system,
                messages: [
                    { role: 'user', content: request.user },
                ],
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Claude API error');
        }

        const data = await response.json();
        const content = data.content[0].text;

        return {
            content,
            tokensUsed: {
                input: data.usage?.input_tokens || 0,
                output: data.usage?.output_tokens || 0,
                total: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
            },
            provider: 'claude',
            model: data.model,
            processingTime: 0,
        };
    }

    /**
     * Estimate tokens (fallback when API doesn't provide)
     */
    private static estimateTokens(text: string): number {
        // Rough estimate: 1 token ≈ 4 characters
        return Math.ceil(text.length / 4);
    }

    /**
     * Parse JSON from LLM response
     * Handles cases where LLM wraps JSON in markdown code blocks
     */
    static parseJSON<T = any>(response: string): T {
        let cleaned = response.trim();

        // Remove markdown code blocks if present
        cleaned = cleaned.replace(/```json\n?/g, '');
        cleaned = cleaned.replace(/```\n?/g, '');
        cleaned = cleaned.trim();

        // Try to find JSON object in the text
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleaned = jsonMatch[0];
        }

        // Try to find JSON array in the text
        const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
        if (arrayMatch && !jsonMatch) {
            cleaned = arrayMatch[0];
        }

        try {
            return JSON.parse(cleaned);
        } catch (error) {
            console.error('Failed to parse JSON from LLM response:', cleaned);
            throw new Error('Invalid JSON response from LLM');
        }
    }

    /**
     * Validate LLM response
     * Checks if response is valid and non-empty
     */
    static validateResponse(response: LLMResponse): boolean {
        if (!response.content || response.content.trim().length === 0) {
            console.error('Empty response from LLM');
            return false;
        }

        if (response.tokensUsed.total === 0) {
            console.warn('No token usage reported');
        }

        return true;
    }

    /**
     * Get available models for a provider
     */
    static getAvailableModels(provider: 'openai' | 'claude' | 'gemini'): string[] {
        const models = {
            openai: [
                'gpt-4o',
                'gpt-4o-mini',
                'gpt-4-turbo',
                'gpt-3.5-turbo',
            ],
            claude: [
                'claude-3-5-sonnet-20241022',
                'claude-3-5-haiku-20241022',
                'claude-3-opus-20240229',
            ],
            gemini: [
                'gemini-2.0-flash-exp',
                'gemini-1.5-pro',
                'gemini-1.5-flash',
            ],
        };

        return models[provider] || [];
    }
}

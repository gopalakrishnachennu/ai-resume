// Groq Client - Fast API client with multi-key failover
// Optimized for free tier usage with automatic key rotation

const GroqClient = {
    apiKeys: [],
    currentKeyIndex: 0,
    model: 'gemma2-2b-it',
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',

    // Configuration
    config: {
        maxRetries: 3,
        temperature: 0.3,  // Lower = more deterministic
        timeout: 30000,    // 30 seconds
        defaultMaxTokens: 800
    },

    // Load API keys from storage (with Firebase fallback)
    loadKeys: async () => {
        try {
            const result = await chrome.storage.local.get([
                'groqApiKeys',
                'groqSettings',
                'flashSession',
                'firebaseProjectId'
            ]);

            // First, try direct groqApiKeys array
            if (result.groqApiKeys && Array.isArray(result.groqApiKeys) && result.groqApiKeys.length > 0) {
                GroqClient.apiKeys = result.groqApiKeys.filter(k => k && k.trim());
            }

            // Fallback 1: Check flashSession.extensionSettings for Groq API key
            if (GroqClient.apiKeys.length === 0 && result.flashSession?.extensionSettings) {
                const es = result.flashSession.extensionSettings;
                const flashKey = es.groqApiKey || es.groqApiKeys;
                if (flashKey) {
                    const keys = String(flashKey).split('\n').map(k => k.trim()).filter(k => k.length > 0);
                    if (keys.length > 0) {
                        GroqClient.apiKeys = keys;
                        console.log(`[Groq] Loaded ${keys.length} API key(s) from flashSession.extensionSettings`);
                        await chrome.storage.local.set({ groqApiKeys: keys });
                    }
                }
            }

            // Fallback 2: Fetch from Firebase adminSettings/extension
            if (GroqClient.apiKeys.length === 0) {
                const projectId = result.firebaseProjectId || 'ai-resume-builder-app';
                try {
                    console.log('[Groq] Fetching settings from Firebase...');
                    const firebaseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/adminSettings/extension`;
                    const response = await fetch(firebaseUrl);

                    if (response.ok) {
                        const data = await response.json();
                        const fields = data.fields || {};

                        // Extract groqApiKeys from Firestore format
                        const groqApiKeysField = fields.groqApiKeys?.stringValue || '';
                        const groqEnabled = fields.groqEnabled?.booleanValue !== false;
                        const groqModel = fields.groqModel?.stringValue || 'llama-3.1-8b-instant';

                        if (groqEnabled && groqApiKeysField) {
                            const keys = String(groqApiKeysField).split('\n').map(k => k.trim()).filter(k => k.length > 0);
                            if (keys.length > 0) {
                                GroqClient.apiKeys = keys;
                                GroqClient.model = groqModel;
                                console.log(`[Groq] Loaded ${keys.length} API key(s) from Firebase adminSettings`);

                                // Store for future use
                                await chrome.storage.local.set({
                                    groqApiKeys: keys,
                                    groqSettings: {
                                        model: groqModel,
                                        temperature: fields.groqTemperature?.doubleValue || 0.3,
                                        enabled: groqEnabled
                                    }
                                });
                            }
                        }
                    }
                } catch (firebaseError) {
                    console.log('[Groq] Firebase fetch failed:', firebaseError.message);
                }
            }

            if (result.groqSettings) {
                if (result.groqSettings.model) GroqClient.model = result.groqSettings.model;
                if (result.groqSettings.temperature) GroqClient.config.temperature = result.groqSettings.temperature;
            }

            console.log(`[Groq] Loaded ${GroqClient.apiKeys.length} API keys`);
            return GroqClient.apiKeys.length > 0;
        } catch (error) {
            console.error('[Groq] Error loading keys:', error);
            return false;
        }
    },

    // Check if client is ready
    isReady: () => {
        return GroqClient.apiKeys.length > 0;
    },

    // Main completion method with failover
    complete: async (prompt, maxTokens = null) => {
        if (!GroqClient.isReady()) {
            await GroqClient.loadKeys();
            if (!GroqClient.isReady()) {
                throw new Error('No Groq API keys configured. Please add keys in Admin > Extension Settings.');
            }
        }

        const tokens = maxTokens || GroqClient.config.defaultMaxTokens;
        let lastError = null;

        // Try each key until one works
        for (let attempt = 0; attempt < GroqClient.apiKeys.length; attempt++) {
            const keyIndex = (GroqClient.currentKeyIndex + attempt) % GroqClient.apiKeys.length;
            const apiKey = GroqClient.apiKeys[keyIndex];

            try {
                const response = await GroqClient.makeRequest(apiKey, prompt, tokens);

                // Success - remember this key for next time
                GroqClient.currentKeyIndex = keyIndex;
                return response;
            } catch (error) {
                lastError = error;

                // Rate limit or quota exceeded - try next key
                if (error.status === 429 || error.status === 402 || error.status === 503) {
                    console.log(`[Groq] Key ${keyIndex + 1} exhausted (${error.status}), trying next...`);
                    continue;
                }

                // Auth error - key might be invalid
                if (error.status === 401) {
                    console.error(`[Groq] Key ${keyIndex + 1} is invalid`);
                    continue;
                }

                // Other errors - throw immediately
                throw error;
            }
        }

        // All keys exhausted
        throw new Error(`All ${GroqClient.apiKeys.length} API keys exhausted. Last error: ${lastError?.message || 'Unknown'}`);
    },

    // Make actual API request
    makeRequest: async (apiKey, prompt, maxTokens) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), GroqClient.config.timeout);

        try {
            const response = await fetch(GroqClient.baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: GroqClient.model,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: parseInt(maxTokens) || 800,  // MUST be integer
                    temperature: parseFloat(GroqClient.config.temperature) || 0.3,
                    top_p: 0.9
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const error = new Error(`Groq API error: ${response.status}`);
                error.status = response.status;

                try {
                    const errorData = await response.json();
                    error.message = errorData.error?.message || error.message;
                } catch { }

                throw error;
            }

            const data = await response.json();

            if (!data.choices || !data.choices[0]) {
                throw new Error('Invalid response from Groq API');
            }

            return data.choices[0].message.content;
        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                error.message = 'Request timeout';
                error.status = 408;
            }

            throw error;
        }
    },

    // Parse JSON response from LLM
    parseJsonResponse: (response) => {
        try {
            // Try direct parse
            return JSON.parse(response);
        } catch {
            // Try to extract JSON from markdown code block
            const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[1].trim());
                } catch { }
            }

            // Try to find JSON object in response
            const objectMatch = response.match(/\{[\s\S]*\}/);
            if (objectMatch) {
                try {
                    return JSON.parse(objectMatch[0]);
                } catch { }
            }

            throw new Error('Failed to parse JSON response from AI');
        }
    },

    // Build batch prompt for multiple fields
    buildBatchPrompt: (fields, session) => {
        const skills = typeof session.skills === 'string'
            ? session.skills
            : (session.skills?.all || FieldResolver?.formatSkills?.(session.skills) || '');

        const yearsExp = FieldResolver?.calculateYears?.(session.experience) ||
            session.experience?.length || 0;

        return `You are filling a job application for ${session.jobTitle || 'a position'} at ${session.jobCompany || 'a company'}.

PROFILE:
- Name: ${session.personalInfo?.firstName || ''} ${session.personalInfo?.lastName || ''}
- Email: ${session.personalInfo?.email || ''}
- Skills: ${skills.substring(0, 200)}
- Current Role: ${session.experience?.[0]?.position || 'Professional'} at ${session.experience?.[0]?.company || 'Company'}
- Experience: ${yearsExp} years

RULES:
1. Be professional and concise
2. Match response length to field type:
   - Short input (< 100 chars): 1-2 sentences max
   - Textarea: 2-4 sentences
3. For select/radio: Return EXACT option text only
4. For Yes/No questions: Return only "Yes" or "No"
5. If unsure or cannot answer: Return empty string ""
6. Return ONLY valid JSON, no markdown

QUESTIONS:
${fields.map((f, i) => {
            const type = f.tagName === 'textarea' ? 'textarea' : 'input';
            const maxLen = f.maxLength ? `, max ${f.maxLength} chars` : '';
            const options = GroqClient.getFieldOptions(f);
            const optStr = options ? ` [Options: ${options.join(', ')}]` : '';
            return `[${i}] (${type}${maxLen}) "${f.label || f.placeholder || f.ariaLabel}"${optStr}`;
        }).join('\n')}

RESPONSE (JSON only):`;
    },

    // Get options from field for prompt
    getFieldOptions: (field) => {
        if (!field.element) return null;

        if (field.tagName === 'select') {
            const opts = Array.from(field.element.options)
                .filter(o => o.value)
                .map(o => o.text.trim())
                .slice(0, 10); // Limit to 10 options
            return opts.length > 0 ? opts : null;
        }

        if (field.type === 'radio' && field.element.name) {
            const radios = document.querySelectorAll(`input[name="${field.element.name}"]`);
            const opts = Array.from(radios).map(r => {
                const label = r.closest('label')?.textContent?.trim() || r.value;
                return label;
            }).slice(0, 10);
            return opts.length > 0 ? opts : null;
        }

        return null;
    },

    // Rotate to next key
    rotateKey: () => {
        GroqClient.currentKeyIndex = (GroqClient.currentKeyIndex + 1) % GroqClient.apiKeys.length;
    },

    // Get status info
    getStatus: () => {
        return {
            ready: GroqClient.isReady(),
            keyCount: GroqClient.apiKeys.length,
            currentKeyIndex: GroqClient.currentKeyIndex,
            model: GroqClient.model
        };
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GroqClient;
}

// AI Answer Engine - Intelligent answer generation for job application forms
// Uses Chrome Built-in AI (Gemini Nano), Ollama, and pattern matching fallbacks

const AIAnswerEngine = {
    // Provider priority
    PROVIDERS: {
        CHROME_AI: 'chrome_ai',
        OLLAMA: 'ollama',
        GEMINI_API: 'gemini_api',
        PATTERN: 'pattern'
    },

    // State
    state: {
        isInitialized: false,
        chromeAIAvailable: false,
        ollamaAvailable: false,
        activeSession: null,
        answerCache: new Map(),
        generationCount: 0
    },

    // Configuration
    config: {
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3.2',
        maxCacheSize: 100,
        cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours
        maxRetries: 2
    },

    // Question types that benefit from AI
    AI_QUESTION_PATTERNS: [
        /why.*(?:interested|apply|want|join|this)/i,
        /tell.*about.*yourself/i,
        /describe.*experience/i,
        /what.*(?:strength|weakness|skill)/i,
        /how.*(?:contribute|add value|fit)/i,
        /cover\s*letter/i,
        /motivation/i,
        /career.*goal/i,
        /salary.*expectation/i,
        /availability/i,
        /notice.*period/i
    ],

    /**
     * Initialize the AI engine
     */
    async init() {
        await this.checkChromeAI();
        await this.checkOllama();
        await this.loadCache();

        this.state.isInitialized = true;

        console.log('[JobFiller] AI Engine initialized:', {
            chromeAI: this.state.chromeAIAvailable,
            ollama: this.state.ollamaAvailable
        });
    },

    /**
     * Check if Chrome's Built-in AI is available
     */
    async checkChromeAI() {
        try {
            if ('ai' in window && 'languageModel' in window.ai) {
                const capabilities = await window.ai.languageModel.capabilities();
                this.state.chromeAIAvailable = capabilities.available === 'readily';

                if (this.state.chromeAIAvailable) {
                    console.log('[JobFiller] Chrome AI available');
                }
            }
        } catch (error) {
            console.log('[JobFiller] Chrome AI not available:', error.message);
            this.state.chromeAIAvailable = false;
        }
    },

    /**
     * Check if Ollama is running locally
     */
    async checkOllama() {
        try {
            const response = await fetch(`${this.config.ollamaUrl}/api/tags`, {
                method: 'GET',
                signal: AbortSignal.timeout(2000)
            });

            if (response.ok) {
                const data = await response.json();
                this.state.ollamaAvailable = data.models?.length > 0;

                if (this.state.ollamaAvailable) {
                    console.log('[JobFiller] Ollama available with models:', data.models.map(m => m.name));
                }
            }
        } catch (error) {
            // Ollama not running, that's ok
            this.state.ollamaAvailable = false;
        }
    },

    /**
     * Generate an answer for a question
     * @param {string} question - The question to answer
     * @param {Object} context - Context (profile, JD, etc.)
     * @returns {Object} { answer, provider, confidence }
     */
    async generateAnswer(question, context = {}) {
        if (!question || question.trim().length < 5) {
            return { answer: null, provider: null, confidence: 0 };
        }

        // Check cache first
        const cacheKey = this.getCacheKey(question, context);
        const cached = this.state.answerCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.config.cacheExpiry) {
            return { ...cached.result, fromCache: true };
        }

        // Determine if this question needs AI
        const needsAI = this.needsAIAnswer(question);

        let result;

        if (needsAI && this.state.chromeAIAvailable) {
            result = await this.generateWithChromeAI(question, context);
        } else if (needsAI && this.state.ollamaAvailable) {
            result = await this.generateWithOllama(question, context);
        }

        // Fallback to pattern-based if AI failed or not needed
        if (!result || !result.answer) {
            result = await this.generateWithPatterns(question, context);
        }

        // Cache the result
        if (result && result.answer) {
            this.cacheResult(cacheKey, result);
        }

        return result || { answer: null, provider: null, confidence: 0 };
    },

    /**
     * Generate answer using Chrome's Built-in AI
     */
    async generateWithChromeAI(question, context) {
        try {
            // Create session if needed
            if (!this.state.activeSession) {
                this.state.activeSession = await window.ai.languageModel.create({
                    systemPrompt: this.buildSystemPrompt(context)
                });
            }

            const prompt = this.buildPrompt(question, context);
            const answer = await this.state.activeSession.prompt(prompt);

            this.state.generationCount++;

            return {
                answer: this.cleanAnswer(answer),
                provider: this.PROVIDERS.CHROME_AI,
                confidence: 0.9
            };
        } catch (error) {
            console.error('[JobFiller] Chrome AI error:', error);

            // Reset session on error
            this.state.activeSession = null;

            return null;
        }
    },

    /**
     * Generate answer using Ollama (local LLM)
     */
    async generateWithOllama(question, context) {
        try {
            const prompt = this.buildFullPrompt(question, context);

            const response = await fetch(`${this.config.ollamaUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.config.ollamaModel,
                    prompt,
                    stream: false,
                    options: {
                        temperature: 0.7,
                        num_predict: 500
                    }
                }),
                signal: AbortSignal.timeout(30000)
            });

            if (!response.ok) {
                throw new Error('Ollama request failed');
            }

            const data = await response.json();
            this.state.generationCount++;

            return {
                answer: this.cleanAnswer(data.response),
                provider: this.PROVIDERS.OLLAMA,
                confidence: 0.85
            };
        } catch (error) {
            console.error('[JobFiller] Ollama error:', error);
            return null;
        }
    },

    /**
     * Generate answer using pattern matching and templates
     */
    /**
     * Generate answer using pattern matching and templates (Enhanced v2.0)
     */
    async generateWithPatterns(question, context) {
        const profile = context.profile || {};
        const jd = context.jobDescription || {}; // Should be passed from main.js context

        // Enhance context with direct values if avail
        const jobTitle = context.jobTitle || jd.title || 'this role';
        const companyName = context.company || jd.company || 'your company';
        const jdSkills = context.jdKeywords || jd.skills || [];

        const questionLower = question.toLowerCase();

        // Helper: Get overlap skills between profile and JD
        const getMatchedSkills = () => {
            const userSkills = this.getTopSkills(profile).split(', ');
            // Simple string matching
            const matched = userSkills.filter(s =>
                jdSkills.some(js => js.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(js.toLowerCase()))
            );
            return matched.length > 0 ? matched.join(', ') : (userSkills.slice(0, 3).join(', ') || 'my technical skills');
        };

        // Common question patterns with template responses
        const templates = {
            // Why interested / motivation (Context-Aware)
            interest: {
                patterns: [/why/i, /interested/i, /motivation/i, /attracts/i, /reason/i, /doing/i],
                generate: () => {
                    const skills = getMatchedSkills();
                    return `I am excited about the ${jobTitle} position at ${companyName} because it aligns perfectly with my professional background. My experience in ${skills} makes me well-suited to contribute immediately. I am particularly drawn to ${companyName}'s mission and the opportunity to work on impactful projects.`;
                }
            },

            // Tell about yourself (Context-Aware)
            aboutYou: {
                patterns: [/tell.*about/i, /introduce/i, /who.*are.*you/i, /bio/i, /background/i],
                generate: () => {
                    const name = `${profile.personalInfo?.firstName || ''} ${profile.personalInfo?.lastName || ''}`.trim();
                    const title = profile.experience?.[0]?.title || 'Professional';
                    const years = this.calculateYearsOfExperience(profile);
                    const skills = this.getTopSkills(profile);

                    return `I am ${name ? name + ', ' : ''}a ${title} with ${years ? years + ' years of' : 'extensive'} experience in ${skills}. Throughout my career, I have focused on delivering high-quality results and solving complex problems. I am now looking to leverage my expertise in a challenging environment like ${companyName}.`;
                }
            },

            // Strengths (Context-Aware)
            strengths: {
                patterns: [/strength/i, /best.*quality/i, /excel.*at/i, /greatest/i, /good at/i],
                generate: () => {
                    const skills = getMatchedSkills();
                    return `My greatest strengths are in ${skills}. I pride myself on my ability to learn quickly and adapt to new technologies. At ${companyName}, I would leverage these strengths to ensure project success and effective team collaboration.`;
                }
            },

            // Weaknesses
            weaknesses: {
                patterns: [/weakness/i, /improve/i, /failure/i, /challenge/i],
                generate: () => {
                    return `I sometimes focus too much on small details, which can slow me down. To improve, I've started using time-boxing techniques and prioritization frameworks. This has helped me maintain high quality while ensuring I always meet deadlines effectively.`;
                }
            },

            // Salary expectation
            salary: {
                patterns: [/salary/i, /compensation/i, /pay/i, /expect/i, /range/i],
                generate: () => {
                    if (profile.preferences?.salaryExpectation) {
                        return `${profile.preferences.salaryExpectation}. However, I am flexible and open to discussion based on the complete benefits package.`;
                    }
                    return `I am flexible regarding salary and more focused on the opportunity. I am open to a market-competitive rate for this level of responsibility.`;
                }
            },

            // Availability / Start date
            availability: {
                patterns: [/start/i, /available/i, /notice/i, /when/i],
                generate: () => {
                    if (profile.preferences?.noticePeriod) {
                        return profile.preferences.noticePeriod;
                    }
                    return `I can be available to start within 2 weeks of an offer, but I can be flexible if an earlier or later start date is required.`;
                }
            },

            // Work authorization
            workAuth: {
                patterns: [/authorized/i, /visa/i, /sponsorship/i, /citizen/i, /permit/i, /legal/i],
                generate: () => {
                    if (profile.preferences?.workAuthorization !== undefined) {
                        // Convert boolean to text if needed, or use stored string
                        if (typeof profile.preferences.workAuthorization === 'boolean') {
                            return profile.preferences.workAuthorization
                                ? 'Yes, I am authorized to work in this country for any employer.'
                                : 'I would require visa sponsorship for this position.';
                        }
                        return profile.preferences.workAuthorization;
                    }
                    return 'Yes, I am authorized to work in this country.';
                }
            },

            // Career goals (Context-Aware)
            careerGoals: {
                patterns: [/goal/i, /future/i, /5 years/i, /five years/i, /see yourself/i],
                generate: () => {
                    return `My goal is to grow as a leader in the ${jobTitle} field. Over the next few years, I aim to deepen my technical expertise while taking on more responsibility in driving strategy and mentorship. I see ${companyName} as the perfect place to achieve these mutual goals.`;
                }
            },

            // Relocation
            relocation: {
                patterns: [/relocate/i, /move/i, /location/i],
                generate: () => {
                    if (profile.preferences?.relocation !== undefined) {
                        return profile.preferences.relocation ? "Yes, I am open to relocating for the right opportunity." : "I prefer to work from my current location or remotely.";
                    }
                    return "I am open to discussing relocation options for this role.";
                }
            }
        };

        // Find matching template
        for (const [key, template] of Object.entries(templates)) {
            if (template.patterns.some(p => p.test(questionLower))) {
                return {
                    answer: template.generate(),
                    provider: this.PROVIDERS.PATTERN,
                    confidence: 0.8, // Bumped confidence for v2
                    templateUsed: key
                };
            }
        }

        // Generic fallback if no specific pattern matches but it's clearly a question
        if (question.includes('?')) {
            return {
                answer: `I am very interested in this role at ${companyName}. Based on my experience in ${this.getTopSkills(profile)}, I am confident I can make a meaningful contribution to the team.`,
                provider: this.PROVIDERS.PATTERN,
                confidence: 0.5
            };
        }

        return {
            answer: null,
            provider: null,
            confidence: 0
        };
    },

    /**
     * Build system prompt for AI
     */
    buildSystemPrompt(context) {
        const profile = context.profile || {};

        return `You are an expert job application assistant. Your task is to help craft professional, concise responses for job application forms.

CANDIDATE PROFILE:
- Name: ${profile.personalInfo?.firstName || ''} ${profile.personalInfo?.lastName || ''}
- Email: ${profile.personalInfo?.email || ''}
- Experience: ${this.summarizeExperience(profile)}
- Skills: ${this.getTopSkills(profile)}
- Education: ${this.summarizeEducation(profile)}

GUIDELINES:
- Be professional, confident, and concise
- Tailor responses to the job when context is provided
- Use first person ("I am", "I have")
- Keep answers between 50-150 words unless specified
- Be honest and authentic
- Highlight relevant experience and skills`;
    },

    /**
     * Build prompt for specific question
     */
    buildPrompt(question, context) {
        let prompt = `Please answer this job application question:\n\n"${question}"`;

        if (context.jobTitle) {
            prompt += `\n\nJob Title: ${context.jobTitle}`;
        }
        if (context.company) {
            prompt += `\nCompany: ${context.company}`;
        }
        if (context.jdKeywords?.length) {
            prompt += `\nKey requirements: ${context.jdKeywords.slice(0, 5).join(', ')}`;
        }

        prompt += '\n\nProvide a professional, concise answer:';

        return prompt;
    },

    /**
     * Build full prompt with system context (for Ollama)
     */
    buildFullPrompt(question, context) {
        return `${this.buildSystemPrompt(context)}

---

QUESTION: ${question}

${context.jobTitle ? `JOB: ${context.jobTitle}` : ''}
${context.company ? `COMPANY: ${context.company}` : ''}

Please provide a professional, concise answer (50-150 words):`;
    },

    /**
     * Check if question needs AI-powered answer
     */
    needsAIAnswer(question) {
        return this.AI_QUESTION_PATTERNS.some(pattern => pattern.test(question));
    },

    /**
     * Clean and format AI-generated answer
     */
    cleanAnswer(text) {
        if (!text) return null;

        return text
            .trim()
            .replace(/^["']|["']$/g, '') // Remove surrounding quotes
            .replace(/^(Answer:|Response:)/i, '') // Remove prefixes
            .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
            .trim();
    },

    // Helper methods
    getCacheKey(question, context) {
        const normalized = question.toLowerCase().replace(/\s+/g, ' ').trim();
        const contextKey = `${context.jobTitle || ''}-${context.company || ''}`;
        return `${normalized}-${contextKey}`;
    },

    cacheResult(key, result) {
        // Limit cache size
        if (this.state.answerCache.size >= this.config.maxCacheSize) {
            const firstKey = this.state.answerCache.keys().next().value;
            this.state.answerCache.delete(firstKey);
        }

        this.state.answerCache.set(key, {
            result,
            timestamp: Date.now()
        });
    },

    async loadCache() {
        try {
            const result = await chrome.storage.local.get('aiAnswerCache');
            if (result.aiAnswerCache) {
                this.state.answerCache = new Map(Object.entries(result.aiAnswerCache));
            }
        } catch (e) { /* ignore */ }
    },

    async saveCache() {
        try {
            const cacheObj = Object.fromEntries(this.state.answerCache);
            await chrome.storage.local.set({ aiAnswerCache: cacheObj });
        } catch (e) { /* ignore */ }
    },

    calculateYearsOfExperience(profile) {
        if (!profile?.experience?.length) return '';
        let totalMonths = 0;
        profile.experience.forEach(exp => {
            if (exp.startDate) {
                const start = new Date(exp.startDate);
                const end = exp.endDate ? new Date(exp.endDate) : new Date();
                totalMonths += (end - start) / (1000 * 60 * 60 * 24 * 30);
            }
        });
        const years = Math.round(totalMonths / 12);
        return years > 0 ? years : '';
    },

    getTopSkills(profile) {
        const skills = [];
        if (profile?.skills?.technical) skills.push(...profile.skills.technical.slice(0, 3));
        if (profile?.skills?.soft) skills.push(profile.skills.soft[0]);
        return skills.slice(0, 4).join(', ') || 'problem-solving and communication';
    },

    summarizeExperience(profile) {
        if (!profile?.experience?.length) return 'Not specified';
        const latest = profile.experience[0];
        return `${latest.title || 'Professional'} at ${latest.company || 'Company'}`;
    },

    summarizeEducation(profile) {
        if (!profile?.education?.length) return 'Not specified';
        const latest = profile.education[0];
        return `${latest.degree || 'Degree'} from ${latest.school || 'University'}`;
    },

    /**
     * Get engine status for UI
     */
    getStatus() {
        return {
            initialized: this.state.isInitialized,
            chromeAI: this.state.chromeAIAvailable,
            ollama: this.state.ollamaAvailable,
            generationCount: this.state.generationCount,
            cacheSize: this.state.answerCache.size
        };
    },

    /**
     * Reset session (useful if switching jobs)
     */
    resetSession() {
        this.state.activeSession = null;
    },

    /**
     * Save a user-edited answer for learning
     */
    async learnFromEdit(question, originalAnswer, editedAnswer, context = {}) {
        try {
            const result = await chrome.storage.local.get('learnedAnswers');
            const learned = result.learnedAnswers || [];

            learned.push({
                question,
                originalAnswer,
                editedAnswer,
                context,
                timestamp: Date.now()
            });

            // Keep last 200
            if (learned.length > 200) learned.splice(0, learned.length - 200);

            await chrome.storage.local.set({ learnedAnswers: learned });

            // Also update cache with edited answer
            const cacheKey = this.getCacheKey(question, context);
            this.cacheResult(cacheKey, {
                answer: editedAnswer,
                provider: 'learned',
                confidence: 0.95
            });

        } catch (error) {
            console.error('[JobFiller] Error saving learned answer:', error);
        }
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIAnswerEngine;
}

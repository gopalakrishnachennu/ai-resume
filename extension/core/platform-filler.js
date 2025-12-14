/**
 * PlatformFiller - Main orchestrator for PSQA form filling
 * 
 * Coordinates:
 * 1. Platform adapter (DOM handling)
 * 2. Intent classifier (question classification)
 * 3. Tiered resolver (answer resolution)
 * 4. Verification pass
 */
const PlatformFiller = {
    adapter: null,
    profile: null,
    results: [],
    stats: {
        total: 0,
        filled: 0,
        verified: 0,
        aiUsed: 0,
        failed: 0
    },

    /**
     * Initialize filler with profile data
     */
    async init(profile) {
        this.profile = profile;
        this.results = [];
        this.stats = { total: 0, filled: 0, verified: 0, aiUsed: 0, failed: 0 };

        // Get appropriate adapter
        this.adapter = AdapterRegistry.getAdapter();
        if (!this.adapter) {
            throw new Error('No adapter available for this platform');
        }

        // Set profile in resolver
        TieredResolver.setProfile(profile);

        // Wait for form to be ready
        const ready = await this.adapter.waitUntilReady();
        if (!ready) {
            console.warn('[PlatformFiller] Form not ready, proceeding anyway');
        }

        console.log(`[PlatformFiller] Initialized for ${this.adapter.platformName}`);
        return this.adapter.platformName;
    },

    /**
     * Fill all fields on current form
     */
    async fillAll() {
        if (!this.adapter || !this.profile) {
            throw new Error('PlatformFiller not initialized');
        }

        const startTime = Date.now();
        this.results = [];

        // Phase 1: Find all question blocks
        const blocks = this.adapter.findQuestionBlocks();
        this.stats.total = blocks.length;
        console.log(`[PlatformFiller] Found ${blocks.length} question blocks`);

        if (blocks.length === 0) {
            return this.getResults();
        }

        // Phase 2: Extract and classify all questions
        const classified = [];
        for (const block of blocks) {
            try {
                const question = this.adapter.extractQuestion(block);
                const classification = IntentClassifier.classify(question);
                classified.push({ block, question, classification });
            } catch (error) {
                console.error('[PlatformFiller] Extract error:', error);
            }
        }

        // Phase 3: Separate deterministic vs templates vs AI
        const deterministic = [];
        const tryTemplates = [];
        const needsAI = [];

        for (const item of classified) {
            const { question, classification } = item;

            if (classification.resolver === 'ai') {
                // Check if it matches a template first
                if (window.QuestionTemplates) {
                    const templateName = QuestionTemplates.findTemplate(question.rawText || question.text);
                    if (templateName) {
                        tryTemplates.push({ ...item, templateName });
                        continue;
                    }
                }
                needsAI.push(item);
            } else {
                const resolved = TieredResolver.resolve(question, classification);
                if (resolved.answer !== null && resolved.confidence > 0.5) {
                    deterministic.push({ ...item, resolved });
                } else {
                    // Couldn't resolve, try templates then AI
                    if (window.QuestionTemplates) {
                        const templateName = QuestionTemplates.findTemplate(question.rawText || question.text);
                        if (templateName) {
                            tryTemplates.push({ ...item, templateName });
                            continue;
                        }
                    }
                    needsAI.push(item);
                }
            }
        }

        console.log(`[PlatformFiller] Deterministic: ${deterministic.length}, Templates: ${tryTemplates.length}, AI: ${needsAI.length}`);

        // Phase 4: Fill deterministic fields
        for (const item of deterministic) {
            await this.fillField(item.block, item.question, item.resolved.answer, item.resolved.source);
            await this.wait(200); // Small delay between fields
        }

        // Phase 5: Fill template-based fields
        for (const item of tryTemplates) {
            const answer = QuestionTemplates.generateAnswer(item.templateName, this.profile);
            if (answer) {
                await this.fillField(item.block, item.question, answer, 'template');
                await this.wait(200);
            } else {
                // Template failed, send to AI
                needsAI.push(item);
            }
        }

        // Phase 6: Fill AI fields (if GroqClient available)
        if (needsAI.length > 0) {
            await this.fillWithAI(needsAI);
        }

        // Phase 6: Verification pass
        await this.runVerification();

        const duration = Date.now() - startTime;
        console.log(`[PlatformFiller] Complete in ${duration}ms. Filled: ${this.stats.filled}/${this.stats.total}`);

        return this.getResults();
    },

    /**
     * Fill a single field
     */
    async fillField(block, question, answer, source) {
        try {
            const success = await this.adapter.fillAnswer(block, answer);

            this.results.push({
                question: question.text.substring(0, 60),
                type: question.type,
                answer: String(answer).substring(0, 50),
                source,
                success,
                verified: false // Will be set in verification pass
            });

            if (success) {
                this.stats.filled++;
            } else {
                this.stats.failed++;
            }

            return success;
        } catch (error) {
            console.error(`[PlatformFiller] Fill error for "${question.text.substring(0, 30)}":`, error);
            this.stats.failed++;
            return false;
        }
    },

    /**
     * Fill fields using AI (Groq)
     */
    async fillWithAI(items) {
        if (!window.GroqClient || !GroqClient.isReady()) {
            // Try to load Groq keys
            if (window.GroqClient) {
                await GroqClient.loadKeys();
            }

            if (!window.GroqClient || !GroqClient.isReady()) {
                console.log('[PlatformFiller] Groq not configured, skipping AI fill');
                return;
            }
        }

        console.log(`[PlatformFiller] Processing ${items.length} questions with AI`);
        this.stats.aiUsed = items.length;

        // Batch questions for efficiency
        const questions = items.map(item => item.question);

        try {
            const prompt = this.buildAIPrompt(questions);
            const response = await GroqClient.complete(prompt, 1500);
            const answers = this.parseAIResponse(response, questions.length);

            // Fill each answer
            for (let i = 0; i < items.length; i++) {
                const { block, question } = items[i];
                const answer = answers[i];

                if (answer) {
                    await this.fillField(block, question, answer, 'ai');
                    await this.wait(200);
                }
            }
        } catch (error) {
            console.error('[PlatformFiller] AI fill error:', error);
        }
    },

    /**
     * Build AI prompt for batch questions
     */
    buildAIPrompt(questions) {
        const pi = this.profile?.personalInfo || {};
        const es = this.profile?.extensionSettings || {};
        const skills = this.profile?.skills?.all || '';

        const questionList = questions.map((q, i) => {
            let desc = `${i + 1}. "${q.rawText || q.text}"`;
            if (q.type !== 'text' && q.type !== 'textarea') {
                desc += ` (${q.type})`;
            }
            if (q.options && q.options.length > 0) {
                const opts = q.options.map(o => typeof o === 'string' ? o : o.text).slice(0, 5);
                desc += ` Options: ${opts.join(', ')}`;
            }
            return desc;
        }).join('\n');

        return `Fill job application. Be concise and professional.

CANDIDATE:
- Name: ${pi.fullName || `${pi.firstName || ''} ${pi.lastName || ''}`}
- Experience: ${es.totalExperience || '5'} years
- Skills: ${skills.substring(0, 200)}

QUESTIONS:
${questionList}

Return JSON array with answers:
[{"q": 1, "a": "answer"}, {"q": 2, "a": "answer"}, ...]

Rules:
- Keep answers brief (1-2 sentences for text, exact match for dropdowns)
- For options, return exact option text
- Be professional and confident`;
    },

    /**
     * Parse AI response
     */
    parseAIResponse(response, expectedCount) {
        const answers = new Array(expectedCount).fill(null);

        try {
            // Find JSON array in response
            const jsonMatch = response.match(/\[[\s\S]*?\]/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                for (const item of parsed) {
                    const idx = (item.q || item.question) - 1;
                    if (idx >= 0 && idx < expectedCount) {
                        answers[idx] = item.a || item.answer;
                    }
                }
            }
        } catch (error) {
            console.error('[PlatformFiller] AI parse error:', error);
        }

        return answers;
    },

    /**
     * Run verification pass
     */
    async runVerification() {
        console.log('[PlatformFiller] Running verification pass');

        for (const result of this.results) {
            if (!result.success) continue;

            const block = this.findBlockByQuestion(result.question);
            if (block) {
                const verified = this.adapter.verify(block, result.answer);
                result.verified = verified;
                if (verified) {
                    this.stats.verified++;
                }
            }
        }
    },

    /**
     * Find block by question text
     */
    findBlockByQuestion(questionText) {
        const blocks = this.adapter.findQuestionBlocks();
        for (const block of blocks) {
            const q = this.adapter.extractQuestion(block);
            if (q.text.substring(0, 60) === questionText) {
                return block;
            }
        }
        return null;
    },

    /**
     * Get results summary
     */
    getResults() {
        return {
            platform: this.adapter?.platformName || 'Unknown',
            stats: { ...this.stats },
            results: [...this.results],
            stepInfo: this.adapter?.getStepInfo() || { current: 1, total: 1, isMultiStep: false }
        };
    },

    /**
     * Advance to next step (multi-step forms)
     */
    async advanceStep() {
        if (!this.adapter) return false;
        return await this.adapter.advanceStep();
    },

    /**
     * Fill all steps (for multi-step forms)
     */
    async fillAllSteps() {
        const allResults = [];
        let stepCount = 0;
        const maxSteps = 10; // Safety limit

        while (stepCount < maxSteps) {
            const stepInfo = this.adapter.getStepInfo();
            console.log(`[PlatformFiller] Step ${stepInfo.current}/${stepInfo.total}`);

            // Fill current step
            const stepResult = await this.fillAll();
            allResults.push(stepResult);

            // Check if done
            if (!stepInfo.isMultiStep || stepInfo.current >= stepInfo.total) {
                break;
            }

            // Advance to next step
            const advanced = await this.advanceStep();
            if (!advanced) {
                console.log('[PlatformFiller] Could not advance to next step');
                break;
            }

            stepCount++;
            await this.wait(1000); // Wait for page load
        }

        return allResults;
    },

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// Export
if (typeof window !== 'undefined') {
    window.PlatformFiller = PlatformFiller;
}

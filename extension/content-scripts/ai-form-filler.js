// AI Form Filler - Orchestrates intelligent form filling using tiered approach
// Tier 1: Deterministic (session data) → Tier 2: Rules → Tier 3: Templates → Tier 4: AI

const AIFormFiller = {
    session: null,
    stats: {
        tier1: 0,
        tier2: 0,
        tier3: 0,
        tier4: 0,
        cached: 0,
        failed: 0
    },

    // Main entry point - fill all fields intelligently
    fillFields: async (detectedFields, session, options = {}) => {
        console.log('[AIFiller] Starting intelligent form filling...');
        AIFormFiller.session = session;
        AIFormFiller.resetStats();

        const startTime = performance.now();
        const results = {
            filled: [],
            skipped: [],
            errors: [],
            stats: {}
        };

        if (!session) {
            results.errors.push({ error: 'No session data available' });
            return results;
        }

        // Collect all fields from all categories
        const allFields = AIFormFiller.collectFields(detectedFields);
        console.log(`[AIFiller] Processing ${allFields.length} fields`);

        // Separate fields by tier
        const tier1to3Fields = [];
        const tier4Fields = [];

        for (const field of allFields) {
            const resolution = FieldResolver.resolve(field, session);

            if (resolution) {
                tier1to3Fields.push({ field, resolution });
                AIFormFiller.stats[`tier${resolution.tier}`]++;
            } else if (AIFormFiller.needsAI(field)) {
                tier4Fields.push(field);
            } else {
                results.skipped.push({ field, reason: 'cannot_resolve' });
            }
        }

        console.log(`[AIFiller] Tier 1-3: ${tier1to3Fields.length}, Tier 4 (AI): ${tier4Fields.length}`);

        // Fill Tier 1-3 fields (fast, no AI)
        for (const { field, resolution } of tier1to3Fields) {
            try {
                await AIFormFiller.fillField(field, resolution.value);
                results.filled.push({
                    field: field.classification || field.label,
                    value: resolution.value?.substring(0, 50),
                    tier: resolution.tier,
                    source: resolution.source
                });
            } catch (error) {
                results.errors.push({
                    field: field.classification || field.label,
                    error: error.message
                });
                AIFormFiller.stats.failed++;
            }
        }

        // Fill Tier 4 fields (AI) - batch request
        if (tier4Fields.length > 0 && GroqClient.isReady()) {
            try {
                await AIFormFiller.fillWithAI(tier4Fields, session, results);
            } catch (error) {
                console.error('[AIFiller] AI batch error:', error);
                results.errors.push({ error: `AI batch failed: ${error.message}` });
            }
        } else if (tier4Fields.length > 0) {
            console.warn('[AIFiller] Groq not configured, skipping AI fields');
            tier4Fields.forEach(f => {
                results.skipped.push({ field: f.label, reason: 'no_ai_config' });
            });
        }

        // Calculate stats
        const endTime = performance.now();
        results.stats = {
            ...AIFormFiller.stats,
            total: allFields.length,
            filled: results.filled.length,
            timeMs: Math.round(endTime - startTime)
        };

        console.log(`[AIFiller] Complete in ${results.stats.timeMs}ms. Filled: ${results.stats.filled}/${results.stats.total}`);
        return results;
    },

    // Collect all fields into flat array
    collectFields: (detectedFields) => {
        const fields = [];
        const categories = ['personal', 'experience', 'education', 'skills', 'preferences',
            'documents', 'demographics', 'misc', 'other'];

        for (const cat of categories) {
            if (detectedFields[cat] && Array.isArray(detectedFields[cat])) {
                fields.push(...detectedFields[cat]);
            }
        }

        return fields.filter(f => f.element && AIFormFiller.isVisible(f.element));
    },

    // Check if field needs AI
    needsAI: (field) => {
        // Textarea or long text input
        if (field.tagName === 'textarea') return true;
        if (field.maxLength && field.maxLength > 200) return true;

        // Unknown classification with text input
        if ((field.classification === 'unknown' || !field.classification) &&
            field.type !== 'checkbox' && field.type !== 'radio') {
            // Check if it has a question-like label
            const label = (field.label || field.placeholder || '').toLowerCase();
            if (label.includes('?') || label.includes('describe') ||
                label.includes('explain') || label.includes('why')) {
                return true;
            }
        }

        return false;
    },

    // Fill fields using AI (batch)
    fillWithAI: async (fields, session, results) => {
        console.log(`[AIFiller] Batch AI for ${fields.length} fields`);

        // Check cache first
        const questions = fields.map(f => f.label || f.placeholder || f.ariaLabel || 'Unknown question');
        const { cached, notCached } = await ResponseCache.batchGet(questions, session.jobCompany, session.jobTitle);

        // Fill cached responses immediately
        for (const [indexStr, answer] of Object.entries(cached)) {
            const index = parseInt(indexStr, 10);
            const field = fields[index];

            try {
                const validation = ResponseValidator.validate(field, answer);
                if (validation.valid) {
                    await AIFormFiller.fillField(field, validation.value || answer);
                    results.filled.push({
                        field: field.label || field.classification,
                        value: answer?.substring(0, 50),
                        tier: 4,
                        source: 'cache'
                    });
                    AIFormFiller.stats.cached++;
                }
            } catch (error) {
                results.errors.push({ field: field.label, error: error.message });
            }
        }

        // If all cached, we're done
        if (notCached.length === 0) {
            console.log('[AIFiller] All responses from cache');
            return;
        }

        // Build batch prompt for uncached fields
        const uncachedFields = notCached.map(nc => fields[nc.index]);
        const prompt = GroqClient.buildBatchPrompt(uncachedFields, session);

        // Calculate tokens needed
        const totalMaxLen = uncachedFields.reduce((sum, f) => {
            if (f.tagName === 'textarea') return sum + 150;
            if (f.maxLength) return sum + Math.min(f.maxLength / 4, 100);
            return sum + 50;
        }, 0);
        const maxTokens = Math.min(Math.max(totalMaxLen, 400), 1500);

        // Make AI request
        let aiResponses = {};
        try {
            const rawResponse = await GroqClient.complete(prompt, maxTokens);
            aiResponses = GroqClient.parseJsonResponse(rawResponse);
        } catch (error) {
            console.error('[AIFiller] Groq error:', error);
            throw error;
        }

        // Process and validate responses
        const toCache = [];

        for (let i = 0; i < uncachedFields.length; i++) {
            const field = uncachedFields[i];
            const answer = aiResponses[i.toString()] || aiResponses[i];
            const question = field.label || field.placeholder;

            if (!answer || answer === '') {
                results.skipped.push({ field: question, reason: 'ai_empty' });
                continue;
            }

            const validation = ResponseValidator.validate(field, answer);

            if (validation.valid) {
                try {
                    await AIFormFiller.fillField(field, validation.value || answer);
                    results.filled.push({
                        field: question,
                        value: answer?.substring(0, 50),
                        tier: 4,
                        source: 'ai'
                    });
                    AIFormFiller.stats.tier4++;

                    // Queue for caching
                    toCache.push({ question, answer: validation.value || answer });
                } catch (error) {
                    results.errors.push({ field: question, error: error.message });
                    AIFormFiller.stats.failed++;
                }
            } else {
                results.errors.push({
                    field: question,
                    error: `Validation failed: ${validation.reason}`,
                    received: answer
                });
                AIFormFiller.stats.failed++;
            }
        }

        // Cache successful responses
        if (toCache.length > 0) {
            await ResponseCache.batchSet(toCache, session.jobCompany, session.jobTitle);
        }
    },

    // Fill a single field
    fillField: async (field, value) => {
        const element = field.element;
        if (!element) throw new Error('No element reference');

        // Skip if already has same value
        if (element.value === value) return;

        // Scroll into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await AIFormFiller.delay(50);

        // Focus
        element.focus();
        await AIFormFiller.delay(30);

        // Set value based on element type
        if (element.tagName === 'SELECT') {
            await AIFormFiller.fillSelect(element, value);
        } else if (element.type === 'checkbox') {
            const checked = /^(yes|true|1)$/i.test(String(value).trim());
            if (element.checked !== checked) {
                element.checked = checked;
                element.dispatchEvent(new Event('change', { bubbles: true }));
            }
        } else if (element.type === 'radio') {
            await AIFormFiller.fillRadio(element, value);
        } else {
            await AIFormFiller.setInputValue(element, value);
        }

        // Highlight success
        AIFormFiller.highlightElement(element);
        await AIFormFiller.delay(100);
    },

    // Set input value (React compatible)
    setInputValue: async (element, value) => {
        const nativeInputSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 'value'
        )?.set;
        const nativeTextareaSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype, 'value'
        )?.set;

        if (element.tagName === 'TEXTAREA' && nativeTextareaSetter) {
            nativeTextareaSetter.call(element, value);
        } else if (nativeInputSetter) {
            nativeInputSetter.call(element, value);
        } else {
            element.value = value;
        }

        // Dispatch events
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));

        // React compatibility
        const tracker = element._valueTracker;
        if (tracker) tracker.setValue('');
        element.dispatchEvent(new Event('input', { bubbles: true }));
    },

    // Fill select dropdown
    fillSelect: async (element, value) => {
        const lowerValue = value.toLowerCase();

        for (const option of element.options) {
            if (option.value.toLowerCase() === lowerValue ||
                option.text.toLowerCase() === lowerValue ||
                option.text.toLowerCase().includes(lowerValue)) {
                element.value = option.value;
                element.dispatchEvent(new Event('change', { bubbles: true }));
                return;
            }
        }
    },

    // Fill radio button
    fillRadio: async (element, value) => {
        const name = element.name;
        if (!name) return;

        const radios = document.querySelectorAll(`input[name="${name}"]`);
        const lowerValue = value.toLowerCase();

        for (const radio of radios) {
            const label = radio.closest('label')?.textContent?.toLowerCase() || radio.value.toLowerCase();

            if (radio.value.toLowerCase() === lowerValue || label.includes(lowerValue)) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
                radio.click();
                return;
            }
        }
    },

    // Check if element is visible
    isVisible: (element) => {
        if (!element) return false;
        const style = window.getComputedStyle(element);
        return style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0' &&
            element.offsetParent !== null;
    },

    // Highlight filled element
    highlightElement: (element) => {
        element.style.transition = 'all 0.3s ease';
        element.style.outline = '2px solid #22c55e';
        element.style.outlineOffset = '2px';

        setTimeout(() => {
            element.style.outline = '';
            element.style.outlineOffset = '';
        }, 2000);
    },

    // Delay helper
    delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

    // Reset stats
    resetStats: () => {
        AIFormFiller.stats = { tier1: 0, tier2: 0, tier3: 0, tier4: 0, cached: 0, failed: 0 };
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIFormFiller;
}

/**
 * CanonicalQuestion - Standardized question format
 * 
 * Platform-agnostic representation of form questions.
 * This is what we cache, classify, and send to AI.
 */
class CanonicalQuestion {
    constructor({
        id = null,
        text = '',
        type = 'text',
        options = null,
        required = false,
        platform = 'unknown',
        block = null,
        metadata = {}
    }) {
        this.id = id || this.generateId(text);
        this.text = this.normalizeText(text);
        this.rawText = text;
        this.type = type; // 'text' | 'textarea' | 'radio' | 'checkbox' | 'select' | 'file'
        this.options = options; // Array for radio/select/checkbox
        this.required = required;
        this.platform = platform;
        this.block = block; // Reference to DOM block
        this.metadata = metadata; // Platform-specific data
    }

    /**
     * Generate stable hash ID from question text
     */
    generateId(text) {
        const normalized = this.normalizeText(text);
        let hash = 0;
        for (let i = 0; i < normalized.length; i++) {
            const char = normalized.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return `q_${Math.abs(hash).toString(16)}`;
    }

    /**
     * Normalize text for comparison
     */
    normalizeText(text) {
        return (text || '')
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Check if this is a simple mappable field (name, email, phone, etc.)
     */
    isSimpleField() {
        const simplePatterns = [
            /first\s*name/i, /last\s*name/i, /full\s*name/i,
            /email/i, /phone/i, /mobile/i, /cell/i,
            /city/i, /state/i, /country/i, /zip/i, /postal/i,
            /linkedin/i, /github/i, /portfolio/i, /website/i,
            /address/i, /street/i
        ];
        return simplePatterns.some(p => p.test(this.rawText));
    }

    /**
     * Check if this is a yes/no question
     */
    isYesNo() {
        // Check by input type
        if (this.type === 'radio' || this.type === 'checkbox') {
            const optText = (this.options || [])
                .map(o => typeof o === 'string' ? o : o.text || o.label || '')
                .join(' ')
                .toLowerCase();
            return /\byes\b|\bno\b/i.test(optText);
        }

        // Check question pattern
        const yesNoPatterns = [
            /are you/i, /do you/i, /have you/i, /will you/i, /can you/i,
            /authorized/i, /eligible/i, /require/i, /willing/i
        ];
        return yesNoPatterns.some(p => p.test(this.rawText));
    }

    /**
     * Check if this is an EEO/demographic question
     */
    isEEO() {
        return /gender|race|ethnic|veteran|disability|sex\b|demographic/i.test(this.rawText);
    }

    /**
     * Check if this needs AI to answer
     */
    needsAI() {
        // Long-form questions typically need AI
        if (this.type === 'textarea') {
            const complexPatterns = [
                /why/i, /describe/i, /explain/i, /tell us/i,
                /cover letter/i, /experience with/i, /about yourself/i
            ];
            return complexPatterns.some(p => p.test(this.rawText));
        }
        return false;
    }

    /**
     * Get input element from metadata
     */
    getInputElement() {
        return this.metadata.inputElement || null;
    }
}

// Export for content scripts
if (typeof window !== 'undefined') {
    window.CanonicalQuestion = CanonicalQuestion;
}

// Prediction Engine - Intelligent form filling with pattern learning
// Learns from user inputs and predicts optimal field values

const PredictionEngine = {
    // Storage keys
    STORAGE_KEY: 'jf_predictions',
    PATTERNS_KEY: 'jf_field_patterns',

    // Question clusters (semantically similar questions)
    questionClusters: {
        motivation: [
            /why.*this.*role/i, /why.*this.*job/i, /why.*this.*position/i,
            /what.*interests.*you/i, /what.*attracts.*you/i,
            /why.*want.*work/i, /why.*apply/i, /motivation/i
        ],
        experience: [
            /years.*experience/i, /how.*long/i, /experience.*with/i,
            /background.*in/i, /worked.*with/i
        ],
        salary: [
            /salary.*expectation/i, /expected.*salary/i, /compensation/i,
            /desired.*salary/i, /pay.*expectation/i, /salary.*requirement/i
        ],
        availability: [
            /start.*date/i, /available.*start/i, /when.*start/i,
            /notice.*period/i, /availability/i, /earliest.*start/i
        ],
        relocation: [
            /willing.*relocate/i, /open.*relocation/i, /relocate/i,
            /move.*to/i, /relocation.*assistance/i
        ],
        visa: [
            /work.*authorization/i, /visa.*status/i, /sponsorship/i,
            /legally.*authorized/i, /require.*sponsorship/i, /work.*permit/i
        ],
        commute: [
            /commute/i, /travel.*to/i, /onsite/i, /remote/i, /hybrid/i,
            /work.*from.*office/i
        ],
        strength: [
            /greatest.*strength/i, /top.*skill/i, /strongest/i,
            /what.*good.*at/i, /excel.*at/i
        ],
        weakness: [
            /weakness/i, /improve.*on/i, /challenge/i, /difficult/i,
            /area.*development/i
        ],
        cover_letter: [
            /cover.*letter/i, /letter.*application/i, /introduction/i,
            /tell.*about.*yourself/i
        ]
    },

    // Default answers for common question types
    defaultAnswers: {
        visa: {
            authorized: "Yes, I am legally authorized to work in this country without requiring visa sponsorship.",
            sponsorship: "I would require visa sponsorship for this position."
        },
        relocation: {
            yes: "Yes, I am open to relocation for the right opportunity.",
            no: "I prefer to work in my current location but am flexible for exceptional opportunities."
        },
        remote: {
            yes: "I am comfortable with remote work and have experience with remote collaboration tools.",
            hybrid: "I am flexible and comfortable with hybrid work arrangements."
        }
    },

    // Confidence thresholds
    thresholds: {
        high: 0.9,
        medium: 0.6,
        low: 0.3
    },

    // Learned patterns (loaded from storage)
    patterns: new Map(),

    // Current predictions
    predictions: [],

    /**
     * Initialize the prediction engine
     */
    async init() {
        await this.loadPatterns();
        console.log(`[JobFiller] Prediction Engine initialized with ${this.patterns.size} patterns`);
    },

    /**
     * Load patterns from storage
     */
    async loadPatterns() {
        try {
            const result = await chrome.storage.local.get(this.PATTERNS_KEY);
            if (result[this.PATTERNS_KEY]) {
                const data = result[this.PATTERNS_KEY];
                this.patterns = new Map(Object.entries(data));
            }
        } catch (error) {
            console.error('[JobFiller] Error loading patterns:', error);
        }
    },

    /**
     * Save patterns to storage
     */
    async savePatterns() {
        try {
            const data = Object.fromEntries(this.patterns);
            await chrome.storage.local.set({ [this.PATTERNS_KEY]: data });
        } catch (error) {
            console.error('[JobFiller] Error saving patterns:', error);
        }
    },

    /**
     * Generate predictions for detected fields
     * @param {Array} fields - Detected form fields
     * @param {Object} profile - User profile
     * @param {Object} context - Additional context (JD, platform, etc.)
     * @returns {Array} Predictions with confidence scores
     */
    predict(fields, profile, context = {}) {
        this.predictions = [];

        fields.forEach(field => {
            const prediction = this.predictField(field, profile, context);
            if (prediction) {
                this.predictions.push(prediction);
            }
        });

        // Sort by confidence
        this.predictions.sort((a, b) => b.confidence - a.confidence);

        return this.predictions;
    },

    /**
     * Predict value for a single field
     */
    predictField(field, profile, context) {
        const fieldKey = this.getFieldKey(field);
        const fieldLabel = this.getFieldLabel(field);
        const fieldType = field.type || field.element?.type || 'text';

        // Get prediction from multiple sources
        const sources = [
            this.predictFromProfile(field, profile),
            this.predictFromPatterns(fieldKey, fieldLabel),
            this.predictFromQuestionClusters(fieldLabel, profile, context),
            this.predictFromContext(field, context)
        ].filter(Boolean);

        if (sources.length === 0) {
            return null;
        }

        // Merge predictions, prefer higher confidence
        const best = sources.reduce((a, b) => a.confidence > b.confidence ? a : b);

        return {
            field,
            fieldKey,
            fieldLabel,
            fieldType,
            value: best.value,
            confidence: best.confidence,
            source: best.source,
            alternates: sources.filter(s => s !== best).slice(0, 2),
            needsReview: best.confidence < this.thresholds.high
        };
    },

    /**
     * Predict from user profile
     */
    predictFromProfile(field, profile) {
        if (!profile) return null;

        const key = this.getFieldKey(field);
        const label = this.getFieldLabel(field).toLowerCase();

        // Profile field mappings
        const mappings = {
            // Personal
            'firstName|first_name|fname': profile.personalInfo?.firstName,
            'lastName|last_name|lname': profile.personalInfo?.lastName,
            'fullName|full_name|name': `${profile.personalInfo?.firstName || ''} ${profile.personalInfo?.lastName || ''}`.trim(),
            'email': profile.personalInfo?.email,
            'phone|mobile|cell': profile.personalInfo?.phone,
            'address|street': profile.personalInfo?.address,
            'city': profile.personalInfo?.city,
            'state|province': profile.personalInfo?.state,
            'zip|postal': profile.personalInfo?.zipCode,
            'country': profile.personalInfo?.country,
            'linkedin': profile.personalInfo?.linkedin,
            'github': profile.personalInfo?.github,
            'portfolio|website': profile.personalInfo?.portfolio,

            // Experience
            'company|employer': profile.experience?.[0]?.company,
            'title|position|jobTitle': profile.experience?.[0]?.title,
            'years.*experience': this.calculateYearsOfExperience(profile),

            // Education
            'school|university|college': profile.education?.[0]?.school,
            'degree': profile.education?.[0]?.degree,
            'major|field.*study': profile.education?.[0]?.major,
            'gpa': profile.education?.[0]?.gpa
        };

        for (const [pattern, value] of Object.entries(mappings)) {
            if (value && new RegExp(pattern, 'i').test(key + ' ' + label)) {
                return {
                    value: String(value),
                    confidence: 0.95,
                    source: 'profile'
                };
            }
        }

        return null;
    },

    /**
     * Predict from learned patterns
     */
    predictFromPatterns(fieldKey, fieldLabel) {
        // Try exact key match
        if (this.patterns.has(fieldKey)) {
            const pattern = this.patterns.get(fieldKey);
            return {
                value: pattern.value,
                confidence: Math.min(0.9, 0.7 + (pattern.usageCount * 0.05)),
                source: 'learned'
            };
        }

        // Try fuzzy label match
        const normalizedLabel = this.normalizeText(fieldLabel);
        for (const [key, pattern] of this.patterns) {
            if (this.normalizeText(key).includes(normalizedLabel) ||
                normalizedLabel.includes(this.normalizeText(key))) {
                return {
                    value: pattern.value,
                    confidence: 0.7,
                    source: 'learned-fuzzy'
                };
            }
        }

        return null;
    },

    /**
     * Predict from question clusters
     */
    predictFromQuestionClusters(fieldLabel, profile, context) {
        const normalizedLabel = fieldLabel.toLowerCase();

        for (const [cluster, patterns] of Object.entries(this.questionClusters)) {
            const matched = patterns.some(p => p.test(normalizedLabel));
            if (!matched) continue;

            // Generate response based on cluster
            const response = this.generateClusterResponse(cluster, profile, context);
            if (response) {
                return {
                    value: response,
                    confidence: 0.75,
                    source: `cluster:${cluster}`
                };
            }
        }

        return null;
    },

    /**
     * Generate response for a question cluster
     */
    generateClusterResponse(cluster, profile, context) {
        const jdKeywords = context.jdKeywords || [];
        const companyName = context.company || 'this company';

        switch (cluster) {
            case 'motivation':
                if (profile?.preferences?.targetRoles?.length > 0) {
                    const role = profile.preferences.targetRoles[0];
                    return `I am excited about this ${role} opportunity because it aligns with my professional goals and experience. ` +
                        `My background in ${this.getTopSkills(profile)} makes me well-suited for this role.`;
                }
                break;

            case 'salary':
                if (profile?.preferences?.salaryExpectation) {
                    return profile.preferences.salaryExpectation;
                }
                break;

            case 'availability':
                if (profile?.preferences?.noticePeriod) {
                    return profile.preferences.noticePeriod;
                }
                return "I am available to start within 2 weeks of receiving an offer.";

            case 'relocation':
                const relo = profile?.preferences?.willingToRelocate;
                return relo ? this.defaultAnswers.relocation.yes : this.defaultAnswers.relocation.no;

            case 'visa':
                const authorized = profile?.preferences?.workAuthorization;
                return authorized ? this.defaultAnswers.visa.authorized : this.defaultAnswers.visa.sponsorship;

            case 'experience':
                const years = this.calculateYearsOfExperience(profile);
                return years ? `${years} years` : null;

            case 'cover_letter':
                return this.generateCoverLetter(profile, context);

            case 'strength':
                return `My greatest strengths include ${this.getTopSkills(profile)}. ` +
                    `I consistently deliver results through these capabilities.`;

            case 'weakness':
                return `I continuously work on improving my skills. One area I focus on is ` +
                    `balancing perfectionism with meeting deadlines efficiently.`;
        }

        return null;
    },

    /**
     * Predict from JD context
     */
    predictFromContext(field, context) {
        if (!context.jdKeywords?.length) return null;

        const fieldLabel = this.getFieldLabel(field).toLowerCase();

        // If field asks about skills and we have JD keywords
        if (/skill|experience|technology|proficiency/i.test(fieldLabel)) {
            const relevantSkills = context.jdKeywords.slice(0, 5).join(', ');
            return {
                value: `My relevant skills include: ${relevantSkills}`,
                confidence: 0.65,
                source: 'jd-context'
            };
        }

        return null;
    },

    /**
     * Learn from user input
     */
    learn(fieldKey, value, context = {}) {
        if (!value || value.length < 2) return;

        const existing = this.patterns.get(fieldKey);
        if (existing) {
            existing.usageCount++;
            existing.lastUsed = Date.now();
            if (value !== existing.value) {
                existing.value = value; // Update to latest
            }
        } else {
            this.patterns.set(fieldKey, {
                value,
                usageCount: 1,
                createdAt: Date.now(),
                lastUsed: Date.now(),
                context
            });
        }

        this.savePatterns();
    },

    /**
     * Get prediction summary for UI
     */
    getSummary() {
        const total = this.predictions.length;
        const high = this.predictions.filter(p => p.confidence >= this.thresholds.high).length;
        const medium = this.predictions.filter(p =>
            p.confidence >= this.thresholds.medium && p.confidence < this.thresholds.high
        ).length;
        const low = this.predictions.filter(p => p.confidence < this.thresholds.medium).length;

        return {
            total,
            high,
            medium,
            low,
            autoFillable: high,
            needsReview: medium + low,
            averageConfidence: total > 0
                ? Math.round(this.predictions.reduce((sum, p) => sum + p.confidence, 0) / total * 100)
                : 0
        };
    },

    /**
     * Get predictions by confidence level
     */
    getByConfidence(level) {
        switch (level) {
            case 'high':
                return this.predictions.filter(p => p.confidence >= this.thresholds.high);
            case 'medium':
                return this.predictions.filter(p =>
                    p.confidence >= this.thresholds.medium && p.confidence < this.thresholds.high
                );
            case 'low':
                return this.predictions.filter(p => p.confidence < this.thresholds.medium);
            default:
                return this.predictions;
        }
    },

    // Helper methods

    getFieldKey(field) {
        const el = field.element || field;
        return el.name || el.id || el.getAttribute('data-automation-id') ||
            el.getAttribute('aria-label') || el.placeholder || '';
    },

    getFieldLabel(field) {
        const el = field.element || field;
        if (el.id) {
            const label = document.querySelector(`label[for="${el.id}"]`);
            if (label) return label.textContent.trim();
        }
        const parent = el.closest('label');
        if (parent) return parent.textContent.trim();
        return el.placeholder || el.getAttribute('aria-label') || '';
    },

    normalizeText(text) {
        return text.toLowerCase().replace(/[^a-z0-9]/g, '');
    },

    calculateYearsOfExperience(profile) {
        if (!profile?.experience?.length) return null;
        let totalMonths = 0;
        profile.experience.forEach(exp => {
            if (exp.startDate) {
                const start = new Date(exp.startDate);
                const end = exp.endDate ? new Date(exp.endDate) : new Date();
                totalMonths += (end - start) / (1000 * 60 * 60 * 24 * 30);
            }
        });
        return Math.round(totalMonths / 12);
    },

    getTopSkills(profile) {
        const skills = [];
        if (profile?.skills?.technical) skills.push(...profile.skills.technical.slice(0, 3));
        if (profile?.skills?.soft) skills.push(profile.skills.soft[0]);
        return skills.slice(0, 4).join(', ') || 'problem-solving and adaptability';
    },

    generateCoverLetter(profile, context) {
        const name = profile?.personalInfo?.firstName || 'there';
        const role = context.jobTitle || 'this position';
        const company = context.company || 'your company';
        const skills = this.getTopSkills(profile);

        return `Dear Hiring Manager,\n\n` +
            `I am writing to express my strong interest in the ${role} position at ${company}. ` +
            `With my experience in ${skills}, I am confident I would be a valuable addition to your team.\n\n` +
            `I look forward to discussing how my skills and experience align with your needs.\n\n` +
            `Best regards,\n${profile?.personalInfo?.firstName || ''} ${profile?.personalInfo?.lastName || ''}`;
    },

    /**
     * Clear all learned patterns
     */
    async clearPatterns() {
        this.patterns.clear();
        await chrome.storage.local.remove(this.PATTERNS_KEY);
        console.log('[JobFiller] Cleared all learned patterns');
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PredictionEngine;
}

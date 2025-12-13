// Field Resolver - Resolves form fields using Tier 1-3 (No AI)
// Prioritizes deterministic values from Flash session

const FieldResolver = {
    // Tier 1: Direct mappings from session data
    tier1Mappings: {
        // Personal Info
        firstName: session => session.personalInfo?.firstName,
        lastName: session => session.personalInfo?.lastName,
        fullName: session => `${session.personalInfo?.firstName || ''} ${session.personalInfo?.lastName || ''}`.trim(),
        middleName: session => session.personalInfo?.middleName || '',
        email: session => session.personalInfo?.email,
        phone: session => session.personalInfo?.phone,
        address: session => session.personalInfo?.location?.address,
        addressLine2: session => session.personalInfo?.location?.address2 || session.personalInfo?.location?.apt || '',
        city: session => session.personalInfo?.location?.city,
        state: session => session.personalInfo?.location?.state,
        zipCode: session => session.personalInfo?.location?.zipCode,
        country: session => session.personalInfo?.location?.country || 'United States',
        linkedin: session => session.personalInfo?.linkedin,
        github: session => session.personalInfo?.github,
        website: session => session.personalInfo?.portfolio || session.personalInfo?.website,
        twitter: session => session.personalInfo?.twitter,
        currentLocation: session => {
            const loc = session.personalInfo?.location;
            if (!loc) return '';
            const parts = [loc.city, loc.state, loc.country].filter(Boolean);
            return parts.join(', ');
        },

        // Experience
        company: session => session.experience?.[0]?.company,
        position: session => session.experience?.[0]?.position || session.experience?.[0]?.title,
        yearsOfExp: session => FieldResolver.calculateYears(session.experience).toString(),
        responsibilities: session => FieldResolver.formatResponsibilities(session.experience?.[0]?.responsibilities),

        // Education
        school: session => session.education?.[0]?.institution || session.education?.[0]?.school,
        degree: session => session.education?.[0]?.degree,
        fieldOfStudy: session => session.education?.[0]?.field || session.education?.[0]?.major,
        gpa: session => session.education?.[0]?.gpa,
        graduationDate: session => session.education?.[0]?.endDate || session.education?.[0]?.graduationDate,

        // Skills - flattened for easy access
        skills: session => FieldResolver.formatSkills(session.skills),

        // Preferences
        salary: session => session.preferences?.salaryExpectation?.min?.toString() || '',
        noticePeriod: session => session.preferences?.noticePeriod || 'Immediately',
        workType: session => session.preferences?.jobTypes?.[0] || 'Full-time',
        remoteWork: session => session.preferences?.workArrangement?.[0] || 'Remote'
    },

    // Tier 2: Yes/No question patterns
    yesNoPatterns: {
        'authorized to work': session => session.preferences?.workAuthorized !== false,
        'legally authorized': session => session.preferences?.workAuthorized !== false,
        'eligible to work': session => session.preferences?.workAuthorized !== false,
        'work authorization': session => session.preferences?.workAuthorized !== false,
        'require sponsorship': session => session.preferences?.sponsorshipRequired === true,
        'need sponsorship': session => session.preferences?.sponsorshipRequired === true,
        'visa sponsorship': session => session.preferences?.sponsorshipRequired === true,
        'willing to relocate': session => session.preferences?.willingToRelocate === true,
        'open to relocation': session => session.preferences?.willingToRelocate === true,
        'relocate for': session => session.preferences?.willingToRelocate === true,
        'willing to commute': session => true,
        'in the office': session => true,
        'office 3 days': session => true,
        'office days': session => true,
        'hybrid role': session => true,
        'comfortable with': session => true,
        'work remotely': session => true,
        'remote work': session => true,
        'work from home': session => true,
        '18 years': session => true,
        'over 18': session => true,
        'legal age': session => true,
        'background check': session => true,
        'consent to background': session => true,
        'drug test': session => true,
        'drug screening': session => true,
        'non-compete': session => false,
        'currently employed': session => session.experience?.[0]?.current === true,
        'presently working': session => session.experience?.[0]?.current === true
    },

    // Resolve field value (main entry point)
    resolve: (field, session) => {
        if (!field || !session) return null;

        // Try Tier 1: Direct mapping
        const tier1Value = FieldResolver.resolveTier1(field, session);
        if (tier1Value !== null && tier1Value !== undefined && tier1Value !== '') {
            return { value: tier1Value, tier: 1, source: 'session' };
        }

        // Try Tier 2: Yes/No resolution
        const tier2Value = FieldResolver.resolveTier2(field, session);
        if (tier2Value !== null) {
            return { value: tier2Value, tier: 2, source: 'rule' };
        }

        // Try Tier 2b: Select/Radio option matching
        const tier2bValue = FieldResolver.resolveSelect(field, session);
        if (tier2bValue !== null) {
            return { value: tier2bValue, tier: 2, source: 'match' };
        }

        // Try Tier 3: Templates (if AnswerTemplates is available)
        if (typeof AnswerTemplates !== 'undefined') {
            const templateKey = AnswerTemplates.matchTemplate(field.label || field.placeholder);
            if (templateKey) {
                const templateValue = AnswerTemplates.generateAnswer(templateKey, session);
                if (templateValue) {
                    return { value: templateValue, tier: 3, source: 'template' };
                }
            }
        }

        // Cannot resolve - needs AI (Tier 4)
        return null;
    },

    // Tier 1: Direct session mapping
    resolveTier1: (field, session) => {
        const classification = field.classification;
        if (!classification || classification === 'unknown') return null;

        const mapper = FieldResolver.tier1Mappings[classification];
        if (mapper) {
            try {
                return mapper(session);
            } catch (e) {
                console.warn('[FieldResolver] Tier 1 error:', e);
            }
        }
        return null;
    },

    // Tier 2: Yes/No questions
    resolveTier2: (field, session) => {
        const questionText = (field.label || field.placeholder || field.ariaLabel || '').toLowerCase();
        if (!questionText) return null;

        // Check if it's a Yes/No type field
        const isYesNoField = field.type === 'radio' || field.type === 'checkbox' ||
            field.tagName === 'select' ||
            questionText.includes('?');

        if (!isYesNoField) return null;

        for (const [pattern, resolver] of Object.entries(FieldResolver.yesNoPatterns)) {
            if (questionText.includes(pattern)) {
                const result = resolver(session);
                return result ? 'Yes' : 'No';
            }
        }

        return null;
    },

    // Tier 2b: Select/Radio option matching
    resolveSelect: (field, session) => {
        if (field.tagName !== 'select' && field.type !== 'radio') return null;

        const element = field.element;
        if (!element) return null;

        const options = FieldResolver.getOptions(element);
        if (options.length === 0) return null;

        const questionText = (field.label || '').toLowerCase();

        // Country matching
        if (questionText.includes('country')) {
            const country = session.personalInfo?.location?.country || 'United States';
            return FieldResolver.fuzzyMatch(options, country);
        }

        // State matching
        if (questionText.includes('state') || questionText.includes('province')) {
            const state = session.personalInfo?.location?.state;
            if (state) return FieldResolver.fuzzyMatch(options, state);
        }

        // Degree matching
        if (questionText.includes('degree') || questionText.includes('education level')) {
            const degree = session.education?.[0]?.degree;
            if (degree) return FieldResolver.fuzzyMatch(options, degree);
        }

        // Years of experience
        if (questionText.includes('years') && questionText.includes('experience')) {
            const years = FieldResolver.calculateYears(session.experience);
            return FieldResolver.findClosestNumeric(options, years);
        }

        // Work arrangement
        if (questionText.includes('work') && (questionText.includes('type') || questionText.includes('arrangement') || questionText.includes('location'))) {
            const pref = session.preferences?.workArrangement?.[0] || 'Remote';
            return FieldResolver.fuzzyMatch(options, pref);
        }

        // Employment type
        if (questionText.includes('employment') && questionText.includes('type')) {
            const type = session.preferences?.jobTypes?.[0] || 'Full-time';
            return FieldResolver.fuzzyMatch(options, type);
        }

        return null;
    },

    // Get options from select or radio group
    getOptions: (element) => {
        if (element.tagName === 'SELECT') {
            return Array.from(element.options)
                .filter(o => o.value && o.value !== '')
                .map(o => ({ value: o.value, text: o.text.trim() }));
        }

        if (element.type === 'radio') {
            const name = element.name;
            const radios = document.querySelectorAll(`input[name="${name}"]`);
            return Array.from(radios).map(r => ({
                value: r.value,
                text: FieldResolver.getRadioLabel(r)
            }));
        }

        return [];
    },

    // Get label for radio button
    getRadioLabel: (radio) => {
        const label = radio.closest('label');
        if (label) return label.textContent.trim();

        if (radio.id) {
            const forLabel = document.querySelector(`label[for="${radio.id}"]`);
            if (forLabel) return forLabel.textContent.trim();
        }

        const next = radio.nextSibling;
        if (next && next.nodeType === Node.TEXT_NODE) {
            return next.textContent.trim();
        }

        return radio.value;
    },

    // Fuzzy match option
    fuzzyMatch: (options, target) => {
        if (!target) return null;
        const lowerTarget = target.toLowerCase();

        // Exact match
        for (const opt of options) {
            if (opt.text.toLowerCase() === lowerTarget || opt.value.toLowerCase() === lowerTarget) {
                return opt.value;
            }
        }

        // Contains match
        for (const opt of options) {
            if (opt.text.toLowerCase().includes(lowerTarget) || lowerTarget.includes(opt.text.toLowerCase())) {
                return opt.value;
            }
        }

        // Partial word match
        const targetWords = lowerTarget.split(/\s+/);
        for (const opt of options) {
            const optWords = opt.text.toLowerCase().split(/\s+/);
            if (targetWords.some(tw => optWords.some(ow => ow.includes(tw) || tw.includes(ow)))) {
                return opt.value;
            }
        }

        return null;
    },

    // Find closest numeric option
    findClosestNumeric: (options, target) => {
        let closest = null;
        let minDiff = Infinity;

        for (const opt of options) {
            // Extract number from option text
            const match = opt.text.match(/\d+/);
            if (match) {
                const num = parseInt(match[0], 10);
                const diff = Math.abs(num - target);
                if (diff < minDiff) {
                    minDiff = diff;
                    closest = opt.value;
                }
            }

            // Check for ranges like "5-10 years"
            const rangeMatch = opt.text.match(/(\d+)\s*[-–]\s*(\d+)/);
            if (rangeMatch) {
                const low = parseInt(rangeMatch[1], 10);
                const high = parseInt(rangeMatch[2], 10);
                if (target >= low && target <= high) {
                    return opt.value;
                }
            }
        }

        return closest;
    },

    // Calculate total years of experience
    calculateYears: (experience) => {
        if (!experience || experience.length === 0) return 0;

        let totalMonths = 0;
        for (const exp of experience) {
            const start = exp.startDate ? new Date(exp.startDate) : null;
            const end = exp.current ? new Date() : (exp.endDate ? new Date(exp.endDate) : null);

            if (start && end && !isNaN(start) && !isNaN(end)) {
                totalMonths += (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
            }
        }

        return Math.max(1, Math.floor(totalMonths / 12));
    },

    // Format skills for text fields
    formatSkills: (skills) => {
        if (!skills) return '';

        // If already a string
        if (typeof skills === 'string') return skills;
        if (skills.all) return skills.all;

        // Flatten skills object
        const allSkills = [];

        if (skills.technical) {
            if (skills.technical.programming) allSkills.push(...skills.technical.programming);
            if (skills.technical.frameworks) allSkills.push(...skills.technical.frameworks);
            if (skills.technical.tools) allSkills.push(...skills.technical.tools);
        }

        if (skills.soft) allSkills.push(...skills.soft);

        return allSkills.join(', ');
    },

    // Format responsibilities
    formatResponsibilities: (responsibilities) => {
        if (!responsibilities) return '';
        if (typeof responsibilities === 'string') return responsibilities;
        if (Array.isArray(responsibilities)) {
            return responsibilities.map(r => `• ${r}`).join('\n');
        }
        return '';
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FieldResolver;
}

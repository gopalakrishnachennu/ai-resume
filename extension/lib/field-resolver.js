// Field Resolver - Resolves form fields using Tier 1-3 (No AI)
// Prioritizes deterministic values from Flash session

const FieldResolver = {
    // Tier 1: Direct mappings from session data
    // Uses extensionSettings for preferences, personalInfo for personal data
    tier1Mappings: {
        // Personal Info (from personalInfo object)
        firstName: session => session.personalInfo?.firstName,
        lastName: session => session.personalInfo?.lastName,
        fullName: session => session.personalInfo?.fullName || `${session.personalInfo?.firstName || ''} ${session.personalInfo?.lastName || ''}`.trim(),
        middleName: session => session.personalInfo?.middleName || '',
        email: session => session.personalInfo?.email,
        phone: session => session.personalInfo?.phone,
        address: session => session.personalInfo?.address || session.personalInfo?.location?.address,
        addressLine2: session => session.personalInfo?.addressLine2 || session.personalInfo?.location?.address2 || '',
        city: session => session.personalInfo?.city || session.personalInfo?.location?.city,
        state: session => session.personalInfo?.state || session.personalInfo?.location?.state,
        zipCode: session => session.personalInfo?.zipCode || session.personalInfo?.location?.zipCode,
        country: session => session.personalInfo?.country || session.personalInfo?.location?.country || 'United States',
        currentLocation: session => {
            const pi = session.personalInfo || {};
            const city = pi.city || pi.location?.city || '';
            const state = pi.state || pi.location?.state || '';
            const country = pi.country || pi.location?.country || '';
            return [city, state, country].filter(Boolean).join(', ');
        },

        // Social Links (from personalInfo)
        linkedin: session => session.personalInfo?.linkedin,
        github: session => session.personalInfo?.github,
        twitter: session => session.personalInfo?.twitter,
        website: session => session.personalInfo?.portfolio || session.personalInfo?.website,
        portfolio: session => session.personalInfo?.portfolio || session.personalInfo?.website,
        otherUrl: session => session.personalInfo?.otherUrl,

        // Experience
        company: session => session.experience?.[0]?.company,
        position: session => session.experience?.[0]?.position || session.experience?.[0]?.title,
        title: session => session.experience?.[0]?.title || session.experience?.[0]?.position,
        yearsOfExp: session => {
            const es = session.extensionSettings;
            if (es?.defaultExperience) return es.defaultExperience;
            if (es?.totalExperience) return es.totalExperience.replace(/[^0-9]/g, '');
            return FieldResolver.calculateYears(session.experience).toString();
        },
        responsibilities: session => FieldResolver.formatResponsibilities(session.experience?.[0]?.responsibilities),

        // Education
        school: session => session.education?.[0]?.institution || session.education?.[0]?.school,
        degree: session => session.education?.[0]?.degree,
        fieldOfStudy: session => session.education?.[0]?.field || session.education?.[0]?.major,
        gpa: session => session.education?.[0]?.gpa,
        graduationDate: session => session.education?.[0]?.endDate || session.education?.[0]?.graduationDate,
        highestEducation: session => session.extensionSettings?.highestEducation || session.education?.[0]?.degree,

        // Skills
        skills: session => FieldResolver.formatSkills(session.skills),

        // Work Authorization (from extensionSettings)
        workAuthorization: session => session.extensionSettings?.workAuthorization || 'Authorized',
        authorizedCountries: session => session.extensionSettings?.authorizedCountries || 'United States',

        // Sponsorship (from extensionSettings)
        sponsorship: session => {
            const need = session.extensionSettings?.requireSponsorship;
            if (need === 'yes') return 'Yes';
            if (need === 'no') return 'No';
            return 'No';
        },
        requireSponsorship: session => session.extensionSettings?.requireSponsorship === 'yes' ? 'Yes' : 'No',

        // Salary (from extensionSettings)
        salary: session => session.extensionSettings?.salaryExpectation || session.extensionSettings?.salaryMin || '',
        salaryExpectation: session => session.extensionSettings?.salaryExpectation || '',
        currentSalary: session => session.extensionSettings?.currentSalary || '',
        salaryMin: session => session.extensionSettings?.salaryMin || '',
        salaryMax: session => session.extensionSettings?.salaryMax || '',
        salaryCurrency: session => session.extensionSettings?.salaryCurrency || 'USD',

        // Experience & Education (from extensionSettings)
        totalExperience: session => session.extensionSettings?.totalExperience || '',
        defaultExperience: session => session.extensionSettings?.defaultExperience || '',

        // Work Preferences (from extensionSettings)
        workType: session => session.extensionSettings?.workType || 'Full-time',
        noticePeriod: session => session.extensionSettings?.noticePeriod || 'Immediately',
        willingToRelocate: session => session.extensionSettings?.willingToRelocate === 'yes' ? 'Yes' : 'No',
        relocateLocations: session => session.extensionSettings?.relocateLocations || '',
        expectedJoiningDate: session => session.extensionSettings?.expectedJoiningDate || '',
        companiesToExclude: session => session.extensionSettings?.companiesToExclude || '',

        // Background (from extensionSettings)
        securityClearance: session => session.extensionSettings?.securityClearance === 'yes' ? 'Yes' : 'No',
        veteranStatus: session => session.extensionSettings?.veteranStatus === 'yes' ? 'Yes' : 'No',
        veteran: session => session.extensionSettings?.veteranStatus === 'yes' ? 'Yes' : 'No',
        drivingLicense: session => session.extensionSettings?.drivingLicense === 'yes' ? 'Yes' : 'No',

        // EEO Information (from extensionSettings)
        gender: session => FieldResolver.formatEEO(session.extensionSettings?.gender),
        ethnicity: session => FieldResolver.formatEEO(session.extensionSettings?.ethnicity),
        race: session => FieldResolver.formatEEO(session.extensionSettings?.ethnicity),
        disabilityStatus: session => FieldResolver.formatDisability(session.extensionSettings?.disabilityStatus),
        disability: session => FieldResolver.formatDisability(session.extensionSettings?.disabilityStatus)
    },

    // Tier 2: Yes/No question patterns
    // Uses extensionSettings for all preference data
    yesNoPatterns: {
        // Work Authorization questions
        'authorized to work': session => session.extensionSettings?.workAuthorization && session.extensionSettings.workAuthorization !== 'none',
        'legally authorized': session => session.extensionSettings?.workAuthorization && session.extensionSettings.workAuthorization !== 'none',
        'eligible to work': session => session.extensionSettings?.workAuthorization && session.extensionSettings.workAuthorization !== 'none',
        'work authorization': session => session.extensionSettings?.workAuthorization && session.extensionSettings.workAuthorization !== 'none',
        'authorized in us': session => session.extensionSettings?.authorizedCountries?.toLowerCase().includes('united states'),
        'authorized in india': session => session.extensionSettings?.authorizedCountries?.toLowerCase().includes('india'),

        // Sponsorship questions
        'require sponsorship': session => session.extensionSettings?.requireSponsorship === 'yes',
        'need sponsorship': session => session.extensionSettings?.requireSponsorship === 'yes',
        'visa sponsorship': session => session.extensionSettings?.requireSponsorship === 'yes',
        'require visa': session => session.extensionSettings?.requireSponsorship === 'yes',
        'do not require': session => session.extensionSettings?.requireSponsorship !== 'yes',
        'not require sponsorship': session => session.extensionSettings?.requireSponsorship !== 'yes',

        // Relocation questions
        'willing to relocate': session => session.extensionSettings?.willingToRelocate === 'yes',
        'open to relocation': session => session.extensionSettings?.willingToRelocate === 'yes',
        'relocate for': session => session.extensionSettings?.willingToRelocate === 'yes',
        'able to relocate': session => session.extensionSettings?.willingToRelocate === 'yes',

        // Office/Remote questions
        'willing to commute': session => true,
        'in the office': session => session.extensionSettings?.workType !== 'remote',
        'office 3 days': session => session.extensionSettings?.workType === 'hybrid' || session.extensionSettings?.workType === 'flexible',
        'office days': session => session.extensionSettings?.workType !== 'remote',
        'hybrid role': session => session.extensionSettings?.workType === 'hybrid' || session.extensionSettings?.workType === 'flexible',
        'comfortable with': session => true,
        'work remotely': session => session.extensionSettings?.workType === 'remote' || session.extensionSettings?.workType === 'flexible',
        'remote work': session => session.extensionSettings?.workType === 'remote' || session.extensionSettings?.workType === 'flexible',
        'work from home': session => session.extensionSettings?.workType === 'remote' || session.extensionSettings?.workType === 'flexible',

        // Standard questions (always true)
        '18 years': session => true,
        'over 18': session => true,
        'legal age': session => true,
        'background check': session => true,
        'consent to background': session => true,
        'drug test': session => true,
        'drug screening': session => true,

        // Security/Background
        'security clearance': session => session.extensionSettings?.securityClearance === 'yes',
        'clearance': session => session.extensionSettings?.securityClearance === 'yes',

        // Veteran status
        'veteran': session => session.extensionSettings?.veteranStatus === 'yes',
        'military': session => session.extensionSettings?.veteranStatus === 'yes',
        'served in': session => session.extensionSettings?.veteranStatus === 'yes',

        // Driving license
        'driver': session => session.extensionSettings?.drivingLicense === 'yes',
        'driving license': session => session.extensionSettings?.drivingLicense === 'yes',
        'valid license': session => session.extensionSettings?.drivingLicense === 'yes',

        // Disability
        'disability': session => session.extensionSettings?.disabilityStatus === 'yes',
        'disabled': session => session.extensionSettings?.disabilityStatus === 'yes',

        // Other
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
    // Uses extensionSettings for all preference dropdowns
    resolveSelect: (field, session) => {
        if (field.tagName !== 'select' && field.type !== 'radio') return null;

        const element = field.element;
        if (!element) return null;

        const options = FieldResolver.getOptions(element);
        if (options.length === 0) return null;

        const questionText = (field.label || field.placeholder || '').toLowerCase();
        const es = session.extensionSettings || {};

        // Country matching
        if (questionText.includes('country')) {
            const country = session.personalInfo?.country || session.personalInfo?.location?.country || 'United States';
            return FieldResolver.fuzzyMatch(options, country);
        }

        // State matching
        if (questionText.includes('state') || questionText.includes('province')) {
            const state = session.personalInfo?.state || session.personalInfo?.location?.state;
            if (state) return FieldResolver.fuzzyMatch(options, state);
        }

        // Degree/Education level matching
        if (questionText.includes('degree') || questionText.includes('education level') || questionText.includes('highest education')) {
            const degree = es.highestEducation || session.education?.[0]?.degree;
            if (degree) return FieldResolver.fuzzyMatch(options, degree);
        }

        // Years of experience
        if (questionText.includes('years') && questionText.includes('experience')) {
            const years = parseInt(es.defaultExperience) || parseInt(es.totalExperience) || FieldResolver.calculateYears(session.experience);
            return FieldResolver.findClosestNumeric(options, years);
        }

        // Work type/arrangement
        if (questionText.includes('work') && (questionText.includes('type') || questionText.includes('arrangement') || questionText.includes('location') || questionText.includes('preference'))) {
            const workType = es.workType || 'flexible';
            return FieldResolver.fuzzyMatch(options, workType);
        }

        // Employment type
        if (questionText.includes('employment') && questionText.includes('type')) {
            return FieldResolver.fuzzyMatch(options, 'Full-time');
        }

        // Sponsorship required dropdown
        if (questionText.includes('sponsorship') || questionText.includes('visa')) {
            const needsSponsorship = es.requireSponsorship === 'yes';
            return FieldResolver.fuzzyMatch(options, needsSponsorship ? 'Yes' : 'No');
        }

        // Work authorization dropdown
        if (questionText.includes('authorization') || questionText.includes('work status')) {
            const auth = es.workAuthorization || 'opt';
            return FieldResolver.fuzzyMatch(options, auth);
        }

        // Relocation dropdown
        if (questionText.includes('relocate') || questionText.includes('relocation')) {
            const willing = es.willingToRelocate === 'yes';
            return FieldResolver.fuzzyMatch(options, willing ? 'Yes' : 'No');
        }

        // Notice period dropdown
        if (questionText.includes('notice') || questionText.includes('availability') || questionText.includes('start date')) {
            const notice = es.noticePeriod || 'immediately';
            return FieldResolver.fuzzyMatch(options, notice);
        }

        // Gender dropdown
        if (questionText.includes('gender') || questionText.includes('sex')) {
            const gender = es.gender || '';
            if (gender) return FieldResolver.fuzzyMatch(options, gender);
        }

        // Ethnicity/Race dropdown
        if (questionText.includes('ethnicity') || questionText.includes('race') || questionText.includes('ethnic')) {
            const ethnicity = es.ethnicity || '';
            if (ethnicity) return FieldResolver.fuzzyMatch(options, ethnicity);
        }

        // Veteran status dropdown
        if (questionText.includes('veteran') || questionText.includes('military')) {
            const veteran = es.veteranStatus === 'yes';
            return FieldResolver.fuzzyMatch(options, veteran ? 'I am a veteran' : 'I am not a veteran');
        }

        // Disability dropdowns
        if (questionText.includes('disability') || questionText.includes('disabled')) {
            const disabled = es.disabilityStatus;
            if (disabled === 'yes') return FieldResolver.fuzzyMatch(options, 'I have a disability');
            if (disabled === 'no') return FieldResolver.fuzzyMatch(options, 'I do not have a disability');
            return FieldResolver.fuzzyMatch(options, 'decline');
        }

        // Salary expectation dropdown
        if (questionText.includes('salary') || questionText.includes('compensation')) {
            const salaryExp = es.salaryExpectation || es.salaryMin || '';
            if (salaryExp) return FieldResolver.findClosestNumeric(options, parseInt(salaryExp.replace(/[^0-9]/g, '')));
        }

        // Currency dropdown
        if (questionText.includes('currency')) {
            const currency = es.salaryCurrency || 'USD';
            return FieldResolver.fuzzyMatch(options, currency);
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
    },

    // Format EEO data (capitalize first letter)
    formatEEO: (value) => {
        if (!value) return '';
        // Capitalize first letter of each word
        return value.replace(/\b\w/g, l => l.toUpperCase());
    },

    // Format disability status
    formatDisability: (value) => {
        if (!value) return '';
        if (value === 'yes') return 'I have a disability';
        if (value === 'no') return 'I do not have a disability';
        return 'I do not wish to disclose';
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FieldResolver;
}

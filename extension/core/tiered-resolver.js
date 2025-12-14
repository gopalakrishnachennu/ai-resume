/**
 * TieredResolver - Resolves answers using classifier output
 */
const TieredResolver = {
    profile: null,

    /**
     * Set profile data for resolution
     */
    setProfile(profile) {
        this.profile = profile;
    },

    /**
     * Resolve answer for a classified question
     * @param {CanonicalQuestion} question 
     * @param {{tier, intent, resolver, configKey?, staticValue?}} classification 
     * @returns {{answer: any, source: string, confidence: number}}
     */
    resolve(question, classification) {
        const { intent, resolver, configKey, staticValue } = classification;
        const pi = this.profile?.personalInfo || {};
        const es = this.profile?.extensionSettings || {};
        const exp = this.profile?.experience || [];

        switch (resolver) {
            case 'direct':
                return this.resolveDirect(intent, pi, es, exp);

            case 'yesno':
                return this.resolveYesNo(intent, configKey, staticValue, es);

            case 'eeo':
                return this.resolveEEO(intent, es, question);

            case 'ai':
                return { answer: null, source: 'ai', confidence: 0 };

            default:
                return { answer: null, source: 'unknown', confidence: 0 };
        }
    },

    /**
     * Resolve Tier 1: Direct field mappings
     */
    resolveDirect(intent, pi, es, exp) {
        const currentJob = exp[0] || {};

        const mappings = {
            // Personal
            firstName: pi.firstName,
            lastName: pi.lastName,
            fullName: pi.fullName || `${pi.firstName || ''} ${pi.lastName || ''}`.trim(),
            middleName: pi.middleName || '',
            preferredName: pi.preferredName || pi.firstName,

            // Contact
            email: pi.email,
            phone: pi.phone || pi.mobile,

            // Social
            linkedin: pi.linkedin || pi.linkedinUrl,
            github: pi.github || pi.githubUrl,
            portfolio: pi.portfolio || pi.website || pi.personalSite,
            twitter: pi.twitter,

            // Location
            city: pi.city || this.extractCity(pi.location),
            state: pi.state || this.extractState(pi.location),
            country: pi.country || 'United States',
            zipCode: pi.zipCode || pi.postalCode || pi.zip,
            address: pi.address || pi.streetAddress,
            addressLine2: pi.addressLine2 || '',

            // Job
            salary: es.salaryExpectation || es.expectedSalary || es.currentSalary,
            experience: es.totalExperience || es.yearsExperience || this.calculateExperience(exp),
            company: currentJob.company || currentJob.employer,
            jobTitle: currentJob.title || currentJob.position || currentJob.role,
            noticePeriod: es.noticePeriod || es.availability || 'Immediately',

            // Education
            school: this.profile?.education?.[0]?.school || this.profile?.education?.[0]?.institution,
            degree: this.profile?.education?.[0]?.degree,
            major: this.profile?.education?.[0]?.major || this.profile?.education?.[0]?.fieldOfStudy,
            gpa: this.profile?.education?.[0]?.gpa,
            graduationDate: this.profile?.education?.[0]?.graduationDate || this.profile?.education?.[0]?.endDate
        };

        const answer = mappings[intent];
        return {
            answer: answer || null,
            source: 'direct',
            confidence: answer ? 1.0 : 0
        };
    },

    /**
     * Resolve Tier 2: Yes/No questions
     */
    resolveYesNo(intent, configKey, staticValue, es) {
        // If we have a static value (e.g., "Are you over 18?" → always true)
        if (staticValue !== undefined) {
            return { answer: staticValue, source: 'static', confidence: 1.0 };
        }

        // Look up from config
        if (configKey && es[configKey] !== undefined) {
            const val = es[configKey];
            let answer;

            if (typeof val === 'boolean') {
                answer = val;
            } else if (typeof val === 'string') {
                answer = val.toLowerCase() === 'yes' || val.toLowerCase() === 'true';
            } else {
                answer = Boolean(val);
            }

            return { answer, source: 'config', confidence: 0.95 };
        }

        // Default answers for common intents
        const defaults = {
            workAuth: true,        // Default: authorized to work
            sponsorship: false,    // Default: don't need sponsorship
            relocate: true,        // Default: willing to relocate
            legalAge: true,        // Default: over 18
            criminal: false,       // Default: no criminal record
            nonCompete: false,     // Default: no non-compete
            termsAgree: true,      // Default: agree to terms
            certifyAccurate: true  // Default: certify accurate
        };

        if (defaults[intent] !== undefined) {
            return { answer: defaults[intent], source: 'default', confidence: 0.7 };
        }

        return { answer: null, source: 'unknown', confidence: 0 };
    },

    /**
     * Resolve Tier 3: EEO/Demographic
     */
    resolveEEO(intent, es, question) {
        const mappings = {
            gender: es.gender,
            ethnicity: es.ethnicity || es.race,
            veteranStatus: this.formatVeteran(es.veteranStatus),
            disabilityStatus: this.formatDisability(es.disabilityStatus),
            sexualOrientation: es.sexualOrientation || 'Prefer not to say'
        };

        let answer = mappings[intent];

        // If question has options, try to match
        if (!answer && question.options && question.options.length > 0) {
            // Look for "prefer not to" or "decline" option
            const declineOption = question.options.find(o => {
                const text = (typeof o === 'string' ? o : o.text || '').toLowerCase();
                return /prefer\s*not|decline|not\s*dis|rather\s*not/i.test(text);
            });

            if (declineOption) {
                answer = typeof declineOption === 'string' ? declineOption : declineOption.text;
            }
        }

        return {
            answer: answer || null,
            source: 'eeo',
            confidence: answer ? 0.9 : 0
        };
    },

    // Helper methods
    extractCity(location) {
        if (!location) return null;
        if (typeof location === 'object') return location.city;
        const parts = String(location).split(',');
        return parts[0]?.trim() || null;
    },

    extractState(location) {
        if (!location) return null;
        if (typeof location === 'object') return location.state;
        const parts = String(location).split(',');
        return parts[1]?.trim() || null;
    },

    calculateExperience(experiences) {
        if (!experiences || experiences.length === 0) return null;

        let totalMonths = 0;
        for (const exp of experiences) {
            const start = new Date(exp.startDate || exp.start);
            const end = exp.current || !exp.endDate ? new Date() : new Date(exp.endDate || exp.end);

            if (!isNaN(start) && !isNaN(end)) {
                totalMonths += (end - start) / (1000 * 60 * 60 * 24 * 30);
            }
        }

        return Math.round(totalMonths / 12);
    },

    formatVeteran(status) {
        if (!status) return null;
        if (status === 'yes' || status === true) return 'I am a protected veteran';
        if (status === 'no' || status === false) return 'I am not a protected veteran';
        return status;
    },

    formatDisability(status) {
        if (!status) return null;
        if (status === 'yes' || status === true) return 'Yes, I have a disability';
        if (status === 'no' || status === false) return 'No, I do not have a disability';
        return status;
    }
};

// Export
if (typeof window !== 'undefined') {
    window.TieredResolver = TieredResolver;
}

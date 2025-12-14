/**
 * IntentClassifier - Classifies questions DETERMINISTICALLY first
 * 
 * Order:
 * 1. Exact field mappings (firstName, email, etc.)
 * 2. Binary yes/no patterns
 * 3. EEO/Demographic patterns
 * 4. AI (last resort)
 */
const IntentClassifier = {
    /**
     * Classify a canonical question
     * @param {CanonicalQuestion} question 
     * @returns {{tier: number, intent: string, resolver: string, configKey?: string, staticValue?: any}}
     */
    classify(question) {
        const text = question.rawText || question.text;
        const normalizedText = text.toLowerCase();

        // Tier 1: Direct field mappings
        const tier1Match = this.matchTier1(normalizedText);
        if (tier1Match) {
            return { tier: 1, intent: tier1Match, resolver: 'direct' };
        }

        // Tier 2: Yes/No patterns
        if (question.isYesNo() || this.looksLikeYesNo(normalizedText)) {
            const tier2Match = this.matchYesNo(normalizedText);
            if (tier2Match) {
                return {
                    tier: 2,
                    intent: tier2Match.intent,
                    resolver: 'yesno',
                    configKey: tier2Match.configKey,
                    staticValue: tier2Match.staticValue
                };
            }
        }

        // Tier 3: EEO/Demographic
        if (question.isEEO()) {
            const tier3Match = this.matchEEO(normalizedText);
            if (tier3Match) {
                return { tier: 3, intent: tier3Match, resolver: 'eeo' };
            }
        }

        // Tier 4: AI needed
        return { tier: 4, intent: 'unknown', resolver: 'ai' };
    },

    /**
     * Match Tier 1: Direct field mappings
     */
    matchTier1(text) {
        const mappings = [
            // Personal Info
            { patterns: [/first\s*name/i, /given\s*name/i, /fname/i], intent: 'firstName' },
            { patterns: [/last\s*name/i, /family\s*name/i, /surname/i, /lname/i], intent: 'lastName' },
            { patterns: [/full\s*name/i, /your\s*name/i, /^name$/i], intent: 'fullName' },
            { patterns: [/middle\s*name/i], intent: 'middleName' },
            { patterns: [/preferred\s*name/i, /nickname/i], intent: 'preferredName' },

            // Contact
            { patterns: [/email/i, /e-mail/i], intent: 'email' },
            { patterns: [/phone/i, /mobile/i, /cell/i, /tel(?:ephone)?/i], intent: 'phone' },

            // Social/Links
            { patterns: [/linkedin/i], intent: 'linkedin' },
            { patterns: [/github/i], intent: 'github' },
            { patterns: [/portfolio/i, /personal\s*(?:site|website)/i], intent: 'portfolio' },
            { patterns: [/twitter/i, /x\.com/i], intent: 'twitter' },

            // Location
            { patterns: [/city/i], intent: 'city' },
            { patterns: [/state/i, /province/i, /region/i], intent: 'state' },
            { patterns: [/country/i, /nation/i], intent: 'country' },
            { patterns: [/zip/i, /postal/i, /post\s*code/i], intent: 'zipCode' },
            { patterns: [/address\s*(?:line\s*)?1?$/i, /street/i], intent: 'address' },
            { patterns: [/address\s*(?:line\s*)?2/i, /apt|suite|unit/i], intent: 'addressLine2' },

            // Job related
            { patterns: [/salary/i, /compensation/i, /expected\s*pay/i, /pay\s*expect/i], intent: 'salary' },
            { patterns: [/years?\s*(?:of\s*)?experience/i, /experience\s*(?:in\s*)?years?/i], intent: 'experience' },
            { patterns: [/current\s*(?:company|employer)/i, /company\s*name/i], intent: 'company' },
            { patterns: [/current\s*(?:title|position|role)/i, /job\s*title/i], intent: 'jobTitle' },
            { patterns: [/notice\s*period/i, /when.*start/i, /start\s*date/i, /availability/i], intent: 'noticePeriod' },

            // Education
            { patterns: [/school|university|college|institution/i], intent: 'school' },
            { patterns: [/degree/i, /education\s*level/i], intent: 'degree' },
            { patterns: [/major|field\s*of\s*study/i], intent: 'major' },
            { patterns: [/gpa|grade/i], intent: 'gpa' },
            { patterns: [/graduation/i], intent: 'graduationDate' }
        ];

        for (const { patterns, intent } of mappings) {
            if (patterns.some(p => p.test(text))) {
                return intent;
            }
        }
        return null;
    },

    /**
     * Check if question looks like yes/no
     */
    looksLikeYesNo(text) {
        const yesNoIndicators = [
            /^(?:are|do|have|will|can|is|did|would|could)\s+you/i,
            /authorized/i, /eligible/i, /require/i, /willing/i,
            /able\s*to/i, /agree/i, /confirm/i
        ];
        return yesNoIndicators.some(p => p.test(text));
    },

    /**
     * Match Tier 2: Yes/No patterns
     */
    matchYesNo(text) {
        const patterns = [
            // Work Authorization
            {
                patterns: [/authorized.*work/i, /legally.*work/i, /eligible.*work/i, /right.*work/i, /permitted.*work/i],
                intent: 'workAuth', configKey: 'workAuthorization', yesIfConfigTrue: true
            },

            // Sponsorship
            {
                patterns: [/require.*sponsor/i, /need.*sponsor/i, /visa.*sponsor/i, /sponsorship.*require/i],
                intent: 'sponsorship', configKey: 'requireSponsorship'
            },

            // Relocation
            {
                patterns: [/willing.*relocate/i, /open.*relocation/i, /relocate/i, /move.*location/i],
                intent: 'relocate', configKey: 'willingToRelocate'
            },

            // Work Preferences
            {
                patterns: [/work.*remote/i, /remote.*work/i, /work.*from.*home/i],
                intent: 'remote', configKey: 'preferRemote'
            },
            {
                patterns: [/work.*office/i, /on-?site/i, /in.*office/i],
                intent: 'onsite', configKey: 'willingOnsite'
            },

            // Background
            {
                patterns: [/security.*clearance/i, /clearance/i],
                intent: 'clearance', configKey: 'securityClearance'
            },
            {
                patterns: [/driver.*license/i, /driving.*license/i, /valid.*license/i, /license.*drive/i],
                intent: 'drivingLicense', configKey: 'drivingLicense'
            },

            // Legal
            {
                patterns: [/18.*(?:years?)?.*old/i, /legal.*age/i, /(?:at\s*)?least.*18/i],
                intent: 'legalAge', staticValue: true
            },
            {
                patterns: [/felony/i, /convicted/i, /criminal/i, /background.*check/i],
                intent: 'criminal', staticValue: false
            },
            {
                patterns: [/non.*compete/i, /non-compete/i, /restrictive.*covenant/i],
                intent: 'nonCompete', staticValue: false
            },

            // Acknowledgments
            {
                patterns: [/agree.*terms/i, /accept.*terms/i, /terms.*conditions/i],
                intent: 'termsAgree', staticValue: true
            },
            {
                patterns: [/certify.*accurate/i, /information.*correct/i, /truthful/i],
                intent: 'certifyAccurate', staticValue: true
            }
        ];

        for (const p of patterns) {
            if (p.patterns.some(regex => regex.test(text))) {
                return {
                    intent: p.intent,
                    configKey: p.configKey,
                    staticValue: p.staticValue
                };
            }
        }
        return null;
    },

    /**
     * Match Tier 3: EEO/Demographic
     */
    matchEEO(text) {
        if (/gender|sex\b|(?:identify.*as)/i.test(text) && !/sex.*orient/i.test(text)) return 'gender';
        if (/race|ethnic|heritage/i.test(text)) return 'ethnicity';
        if (/veteran|military|armed\s*forces|served/i.test(text)) return 'veteranStatus';
        if (/disability|disabled|impairment/i.test(text)) return 'disabilityStatus';
        if (/sexual.*orient|lgbtq?/i.test(text)) return 'sexualOrientation';
        return null;
    }
};

// Export
if (typeof window !== 'undefined') {
    window.IntentClassifier = IntentClassifier;
}

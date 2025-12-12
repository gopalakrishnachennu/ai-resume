// Answer Assistant - Generates tailored responses from JD + profile
// Works fully locally (no network calls)

const AnswerAssistant = {
    /**
     * Generate an answer for a free-text question using JD + profile
     * @param {string} question
     * @param {Object} profile
     * @param {Object} options - { tone: 'concise'|'enthusiastic'|'formal', length: 'concise'|'standard'|'detailed' }
     * @returns {Object} { answer, context }
     */
    generate(question, profile, options = {}) {
        const tone = options.tone || 'concise';
        const length = options.length || 'standard';

        const jd = JDMatcher.extractJobDescription();
        const matchResult = profile ? JDMatcher.calculateMatchScore(jd, profile) : null;

        const topSkills = this.pickTopSkills(profile, jd);
        const highlights = this.buildHighlights(profile, topSkills);
        const jdSummary = this.summarizeJD(jd);

        const sentences = this.composeSentences(question, profile, jdSummary, highlights, tone);
        const targetCount = this.getSentenceCount(length);
        const answer = sentences.slice(0, targetCount).join(' ');

        return {
            answer,
            context: {
                jobTitle: jd.title,
                company: jd.company,
                location: jd.location,
                matchScore: matchResult?.score,
                missingSkills: matchResult?.missingSkills?.slice(0, 5) || [],
                tone,
                length
            }
        };
    },

    /**
     * Persist an answer in the local library
     */
    async saveToLibrary(entry) {
        const result = await chrome.storage.local.get('answerLibrary');
        const library = result.answerLibrary || [];
        const newEntry = {
            id: `ans_${Date.now()}`,
            createdAt: new Date().toISOString(),
            ...entry
        };

        library.unshift(newEntry);
        if (library.length > 20) library.length = 20; // keep last 20

        await chrome.storage.local.set({ answerLibrary: library });
        return newEntry;
    },

    /**
     * Get saved answers
     */
    async getLibrary() {
        const result = await chrome.storage.local.get('answerLibrary');
        return result.answerLibrary || [];
    },

    /**
     * Pick top skills from profile that overlap JD or are strongest
     */
    pickTopSkills(profile, jd) {
        const profileSkills = JDMatcher.extractProfileSkills(profile) || [];
        const jdSkills = jd?.skills || [];

        const overlap = profileSkills.filter(s => jdSkills.some(js => js.toLowerCase() === s.toLowerCase()));
        const extras = profileSkills.filter(s => !overlap.includes(s));

        return [...overlap.slice(0, 4), ...extras.slice(0, 2)];
    },

    /**
     * Build short highlight bullets from the profile
     */
    buildHighlights(profile, skills) {
        const highlights = [];

        if (!profile) return highlights;

        const experience = profile.experience?.[0];
        if (experience?.company && experience?.position) {
            highlights.push(`Currently ${experience.position} at ${experience.company}`);
        }

        if (profile.professionalSummary?.short) {
            highlights.push(profile.professionalSummary.short);
        }

        if (skills && skills.length) {
            highlights.push(`Strengths: ${skills.slice(0, 5).join(', ')}`);
        }

        return highlights.slice(0, 3);
    },

    /**
     * Summarize the job description for context
     */
    summarizeJD(jd) {
        if (!jd) return '';

        const parts = [];
        if (jd.title) parts.push(jd.title);
        if (jd.company) parts.push(`at ${jd.company}`);
        if (jd.location) parts.push(`(${jd.location})`);

        const mustHave = jd.skills?.slice(0, 3).join(', ');
        if (mustHave) parts.push(`Key skills: ${mustHave}`);

        return parts.join(' ');
    },

    /**
     * Compose sentences honoring tone
     */
    composeSentences(question, profile, jdSummary, highlights, tone) {
        const sentences = [];

        const intro = this.buildIntro(profile, jdSummary, tone);
        if (intro) sentences.push(intro);

        const relevance = this.buildRelevance(question, profile, highlights, tone);
        if (relevance) sentences.push(relevance);

        const impact = this.buildImpact(profile, tone);
        if (impact) sentences.push(impact);

        const close = this.buildClose(tone);
        if (close) sentences.push(close);

        return sentences.filter(Boolean);
    },

    buildIntro(profile, jdSummary, tone) {
        const name = profile?.personalInfo?.firstName || 'I';
        const base = jdSummary ? `${name} appreciate the fit for ${jdSummary}` : `${name} appreciate this opportunity`;
        return this.applyTone(base, tone);
    },

    buildRelevance(question, profile, highlights, tone) {
        const recent = profile?.experience?.[0];
        const years = FormFiller?.prototype?.calculateYearsOfExperience
            ? FormFiller.prototype.calculateYearsOfExperience.call({ profile })
            : null;

        const parts = [];
        if (recent?.position && recent?.company) {
            parts.push(`I recently worked as ${recent.position} at ${recent.company}`);
        }
        if (years) {
            parts.push(`bringing about ${years}+ years of experience`);
        }
        if (highlights?.length) {
            parts.push(highlights[0]);
        }

        const base = parts.length ? parts.join(', ') : 'My background aligns well';
        const answerToQuestion = question ? ` In response to "${question}", I focus on clarity, ownership, and outcomes.` : '';

        return this.applyTone(base + '.' + answerToQuestion, tone);
    },

    buildImpact(profile, tone) {
        const exp = profile?.experience?.[0];
        const bullet = exp?.responsibilities?.[0];
        const impact = bullet || 'I deliver measurable results and keep communication crisp.';
        return this.applyTone(impact, tone);
    },

    buildClose(tone) {
        const closes = {
            concise: 'I can start quickly and keep momentum.',
            enthusiastic: 'Excited to contribute and hit the ground running.',
            formal: 'I welcome the chance to contribute and discuss further.'
        };
        return closes[tone] || closes.concise;
    },

    applyTone(text, tone) {
        if (tone === 'enthusiastic') {
            return text.replace('appreciate', 'am excited about');
        }
        if (tone === 'formal') {
            return text.replace('appreciate', 'am interested in');
        }
        return text;
    },

    getSentenceCount(length) {
        switch (length) {
            case 'concise':
                return 2;
            case 'detailed':
                return 4;
            default:
                return 3;
        }
    }
};

// Export for tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnswerAssistant;
}

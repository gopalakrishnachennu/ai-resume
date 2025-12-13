// Answer Templates - Generates contextual answers for common job application questions
// These provide instant responses without AI (Tier 3)

const AnswerTemplates = {
    // Template definitions
    templates: {
        whyInterested: {
            id: 'whyInterested',
            name: 'Why Interested in Role',
            patterns: ['why interested', 'why this role', 'why do you want', 'what excites you', 'motivation for applying'],
            generate: (session) => {
                const skills = session.skills?.technical?.programming?.slice(0, 3).join(', ') ||
                    session.skills?.all?.split(',').slice(0, 3).join(', ') ||
                    'relevant technologies';
                const years = AnswerTemplates.calculateYears(session.experience);
                return `I am excited about the ${session.jobTitle || 'opportunity'} role at ${session.jobCompany || 'your company'} because it aligns perfectly with my background in ${skills}. With ${years}+ years of experience, I am confident I can contribute immediately to your team's success.`;
            },
            defaultTemplate: 'I am excited about the {{jobTitle}} role at {{jobCompany}} because it aligns with my skills in {{skills}}. With {{years}}+ years of experience, I can contribute immediately.'
        },

        aboutYourself: {
            id: 'aboutYourself',
            name: 'About Yourself / Summary',
            patterns: ['about yourself', 'describe yourself', 'tell us about', 'professional summary', 'introduce yourself'],
            generate: (session) => {
                if (session.professionalSummary?.default) {
                    return session.professionalSummary.default;
                }
                const role = session.experience?.[0]?.position || 'professional';
                const skills = session.skills?.all?.substring(0, 100) || 'various technologies';
                return `I am an experienced ${role} with expertise in ${skills}. I am passionate about delivering high-quality work and collaborating with talented teams to achieve exceptional results.`;
            },
            defaultTemplate: 'I am an experienced {{currentRole}} with expertise in {{skills}}. I am passionate about delivering high-quality work and collaborating with talented teams.'
        },

        howDidYouHear: {
            id: 'howDidYouHear',
            name: 'How Did You Hear About Us',
            patterns: ['how did you hear', 'where did you find', 'referral source', 'how did you learn', 'discover this'],
            generate: () => 'LinkedIn',
            defaultTemplate: 'LinkedIn'
        },

        startDate: {
            id: 'startDate',
            name: 'Start Date / Availability',
            patterns: ['start date', 'when can you start', 'availability', 'earliest start', 'how soon'],
            generate: (session) => session.preferences?.noticePeriod || 'Immediately',
            defaultTemplate: 'Immediately'
        },

        salaryExpectation: {
            id: 'salaryExpectation',
            name: 'Salary Expectation',
            patterns: ['salary expectation', 'expected salary', 'compensation', 'desired salary', 'pay requirement'],
            generate: (session) => {
                const salary = session.preferences?.salaryExpectation?.min;
                return salary ? salary.toString() : '';
            },
            defaultTemplate: '{{salaryMin}}'
        },

        coverLetter: {
            id: 'coverLetter',
            name: 'Cover Letter',
            patterns: ['cover letter', 'letter of interest', 'message to hiring'],
            generate: (session) => {
                const name = `${session.personalInfo?.firstName || ''} ${session.personalInfo?.lastName || ''}`.trim();
                const company = session.experience?.[0]?.company || 'leading companies';
                const skills = session.skills?.technical?.programming?.slice(0, 3).join(', ') ||
                    session.skills?.all?.split(',').slice(0, 3).join(', ') ||
                    'relevant technologies';
                return `Dear Hiring Manager,

I am writing to express my strong interest in the ${session.jobTitle || 'advertised'} position at ${session.jobCompany || 'your company'}. With my experience at ${company} and expertise in ${skills}, I am confident I would be a valuable addition to your team.

I look forward to discussing how my background aligns with your needs.

Best regards,
${name}`;
            },
            defaultTemplate: 'Dear Hiring Manager,\n\nI am excited to apply for {{jobTitle}} at {{jobCompany}}...'
        },

        whyLeaving: {
            id: 'whyLeaving',
            name: 'Why Leaving Current Job',
            patterns: ['why leaving', 'reason for leaving', 'why looking', 'seeking new opportunity'],
            generate: (session) => {
                return `I am seeking new challenges and growth opportunities that align with my career goals. The ${session.jobTitle || 'opportunity'} at ${session.jobCompany || 'your company'} represents an exciting next step in my professional journey.`;
            },
            defaultTemplate: 'I am seeking new challenges and growth opportunities that align with my career goals.'
        },

        strengthsWeaknesses: {
            id: 'strengthsWeaknesses',
            name: 'Strengths',
            patterns: ['strength', 'strong point', 'best quality'],
            generate: (session) => {
                const skills = session.skills?.technical?.programming?.slice(0, 2).join(' and ') || 'problem-solving and technical expertise';
                return `My key strengths include ${skills}, along with strong communication skills and the ability to work effectively in team environments.`;
            },
            defaultTemplate: 'My key strengths include {{skills}}, strong communication, and teamwork.'
        }
    },

    // Calculate years of experience
    calculateYears: (experience) => {
        if (!experience || experience.length === 0) return 0;
        let totalMonths = 0;

        for (const exp of experience) {
            const start = exp.startDate ? new Date(exp.startDate) : null;
            const end = exp.current ? new Date() : (exp.endDate ? new Date(exp.endDate) : null);

            if (start && end) {
                totalMonths += (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
            }
        }

        return Math.max(1, Math.floor(totalMonths / 12));
    },

    // Match question to template
    matchTemplate: (questionText) => {
        if (!questionText) return null;
        const lowerQ = questionText.toLowerCase();

        for (const [key, template] of Object.entries(AnswerTemplates.templates)) {
            if (template.patterns.some(pattern => lowerQ.includes(pattern))) {
                return key;
            }
        }
        return null;
    },

    // Generate answer from template
    generateAnswer: (templateKey, session) => {
        const template = AnswerTemplates.templates[templateKey];
        if (!template) return null;

        try {
            return template.generate(session);
        } catch (error) {
            console.error('[Templates] Error generating answer:', error);
            return null;
        }
    },

    // Get all template definitions (for settings UI)
    getAllTemplates: () => {
        return Object.values(AnswerTemplates.templates).map(t => ({
            id: t.id,
            name: t.name,
            patterns: t.patterns,
            defaultTemplate: t.defaultTemplate
        }));
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnswerTemplates;
}

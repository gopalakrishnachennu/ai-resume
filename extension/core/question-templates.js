/**
 * QuestionTemplates - Pre-built answers for common job application questions
 * 
 * These templates use placeholders that get replaced with profile data.
 * Format: {fieldName} - replaced with profile data
 */
const QuestionTemplates = {
    patterns: [
        // "What excites you about this role?"
        {
            patterns: [
                /what\s*(?:is)?\s*(?:most)?\s*excit(?:es?|ing)/i,
                /why\s*(?:are\s*you|do\s*you\s*want)/i,
                /what\s*interests?\s*you/i,
                /why\s*this\s*(?:role|position|job)/i
            ],
            template: "whyExcited"
        },

        // "Why would we be excited to work with you?"
        {
            patterns: [
                /why\s*(?:would\s*)?we\s*(?:be\s*)?excited/i,
                /why\s*should\s*we\s*hire/i,
                /what\s*makes\s*you\s*(?:a\s*)?(?:good|great|strong)/i,
                /what\s*(?:can|would|do)\s*you\s*bring/i
            ],
            template: "whyHireMe"
        },

        // "Tell us about yourself"
        {
            patterns: [
                /tell\s*(?:us|me)\s*about\s*yourself/i,
                /describe\s*yourself/i,
                /introduce\s*yourself/i
            ],
            template: "aboutMe"
        },

        // Cover letter
        {
            patterns: [
                /cover\s*letter/i,
                /letter\s*of\s*(?:interest|introduction)/i
            ],
            template: "coverLetter"
        },

        // "What are your strengths?"
        {
            patterns: [
                /(?:your|describe)\s*(?:key\s*)?strengths?/i,
                /what\s*(?:are|is)\s*your\s*(?:biggest|main|key)?\s*strength/i
            ],
            template: "strengths"
        },

        // "Why are you leaving your current job?"
        {
            patterns: [
                /why\s*(?:are\s*you)?\s*leaving/i,
                /reason\s*for\s*leaving/i,
                /why\s*(?:do\s*you)?\s*want\s*to\s*leave/i
            ],
            template: "whyLeaving"
        },

        // "What is your expected salary?"
        {
            patterns: [
                /(?:salary|compensation)\s*(?:expectation|requirement)/i,
                /(?:expected|desired)\s*(?:salary|pay|compensation)/i
            ],
            template: "salaryExpectation"
        },

        // Additional information / anything else
        {
            patterns: [
                /additional\s*(?:information|comments)/i,
                /anything\s*(?:else|you\s*want)/i,
                /other\s*(?:information|comments)/i
            ],
            template: "additional"
        }
    ],

    // Pre-built templates with placeholders
    templates: {
        whyExcited: `I'm excited about this {roleName} position because it aligns perfectly with my {experience} years of experience in {skills}. The opportunity to contribute to {company}'s mission while growing my expertise in this space is exactly what I'm looking for at this stage of my career.`,

        whyHireMe: `With {experience} years of hands-on experience in {skills}, I bring a proven track record of delivering results. My background at {currentCompany} has equipped me with the skills to hit the ground running. I'm passionate about this field and committed to adding immediate value to your team.`,

        aboutMe: `I'm a {jobTitle} with {experience} years of experience specializing in {skills}. Currently at {currentCompany}, I've developed expertise in solving complex problems and delivering quality work. I'm now seeking new opportunities to grow and make a greater impact.`,

        coverLetter: `Dear Hiring Manager,

I am writing to express my strong interest in the {roleName} position at {company}.

With {experience} years of experience in {skills}, I have developed a comprehensive skill set that aligns well with this role. In my current position at {currentCompany}, I have consistently delivered results and collaborated effectively with cross-functional teams.

I am particularly drawn to {company}'s mission and believe my background makes me an excellent fit for your team. I am excited about the opportunity to contribute my expertise and grow with your organization.

Thank you for considering my application. I look forward to discussing how I can contribute to your team.

Best regards,
{fullName}`,

        strengths: `My key strengths include strong problem-solving abilities, effective communication, and expertise in {skills}. I excel at translating complex requirements into actionable solutions and have a proven track record of meeting deadlines while maintaining quality.`,

        whyLeaving: `I'm looking for new opportunities to grow professionally and take on more challenging responsibilities. While I've valued my time at my current company, I'm ready for a role that allows me to leverage my {skills} expertise at a higher level.`,

        salaryExpectation: `{salary}`,

        additional: `I'm flexible with start dates and excited about this opportunity. Please feel free to contact me at {email} or {phone} to discuss the role further. Thank you for your consideration.`
    },

    /**
     * Find matching template for a question
     */
    findTemplate(questionText) {
        const text = questionText.toLowerCase();

        for (const { patterns, template } of this.patterns) {
            if (patterns.some(p => p.test(text))) {
                return template;
            }
        }
        return null;
    },

    /**
     * Generate answer from template using profile data
     */
    generateAnswer(templateName, profile) {
        const template = this.templates[templateName];
        if (!template) return null;

        const pi = profile.personalInfo || {};
        const es = profile.extensionSettings || {};
        const exp = profile.experience || [];
        const currentJob = exp[0] || {};

        // Build replacement map
        const replacements = {
            // Personal
            fullName: pi.fullName || `${pi.firstName || ''} ${pi.lastName || ''}`.trim(),
            firstName: pi.firstName || '',
            lastName: pi.lastName || '',
            email: pi.email || '',
            phone: pi.phone || '',

            // Current job
            currentCompany: currentJob.company || 'my current company',
            jobTitle: currentJob.title || 'professional',

            // Skills and experience
            skills: this.formatSkills(profile.skills?.all) || 'my field',
            experience: es.totalExperience || this.calculateExperience(exp) || '5',

            // Target job
            roleName: es.targetRole || 'this position',
            company: es.targetCompany || 'your company',

            // Salary
            salary: es.salaryExpectation || es.expectedSalary || 'Negotiable based on total compensation'
        };

        // Replace all placeholders
        let answer = template;
        for (const [key, value] of Object.entries(replacements)) {
            answer = answer.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        }

        return answer;
    },

    formatSkills(skillsStr) {
        if (!skillsStr) return null;
        const skills = String(skillsStr).split(',').map(s => s.trim()).filter(s => s);
        if (skills.length === 0) return null;
        if (skills.length <= 3) return skills.join(', ');
        return skills.slice(0, 3).join(', ') + ' and more';
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

        return Math.max(1, Math.round(totalMonths / 12));
    }
};

// Export
if (typeof window !== 'undefined') {
    window.QuestionTemplates = QuestionTemplates;
}

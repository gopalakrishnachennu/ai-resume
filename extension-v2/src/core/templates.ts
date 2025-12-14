import { Profile } from "./profile";

export interface TemplateConfig {
    patterns: RegExp[];
    generate: (profile: Profile, jobContext?: JobContext) => string;
}

export interface JobContext {
    jobTitle?: string;
    company?: string;
    description?: string;
}

/**
 * Templates for open-ended questions (Tier 5)
 * These handle questions that can't be mapped to simple profile fields
 */
export const TEMPLATES: TemplateConfig[] = [
    // Why do you want to work here?
    {
        patterns: [
            /why.*work.*here/i,
            /why.*interested/i,
            /why.*apply/i,
            /what.*attract.*company/i,
            /why.*join.*us/i
        ],
        generate: (profile, job) => {
            const role = job?.jobTitle || profile.role.targetTitle || "this role";
            const company = job?.company || "your organization";
            const skills = profile.skills.technical.slice(0, 3).join(", ");

            return `I am excited about the opportunity to bring my expertise in ${skills} to ${company}. ` +
                `The ${role} position aligns perfectly with my career goals, and I am drawn to the ` +
                `company's mission and values. I believe my ${profile.experience.totalYears || "several"} years ` +
                `of experience would allow me to make meaningful contributions to your team.`;
        }
    },

    // Tell me about yourself / Professional summary
    {
        patterns: [
            /tell.*about.*yourself/i,
            /describe.*yourself/i,
            /professional.*summary/i,
            /about.*you/i,
            /introduce.*yourself/i
        ],
        generate: (profile) => {
            const years = profile.experience.totalYears || "several";
            const title = profile.role.targetTitle || profile.experience.currentTitle || "professional";
            const skills = profile.skills.technical.slice(0, 4).join(", ");

            return `I am a ${title} with ${years} years of experience. ` +
                `My core competencies include ${skills}. ` +
                `I am passionate about delivering high-quality work and continuously learning new technologies.`;
        }
    },

    // What are your strengths?
    {
        patterns: [
            /what.*strength/i,
            /your.*strength/i,
            /greatest.*strength/i,
            /top.*skill/i
        ],
        generate: (profile) => {
            const tech = profile.skills.technical.slice(0, 3);
            const soft = profile.skills.soft.slice(0, 2);
            const combined = [...tech, ...soft].join(", ");

            return `My key strengths include ${combined}. ` +
                `I excel at problem-solving and collaborating with cross-functional teams to deliver results.`;
        }
    },

    // What are your weaknesses?
    {
        patterns: [
            /what.*weakness/i,
            /your.*weakness/i,
            /area.*improvement/i,
            /what.*improve/i
        ],
        generate: () => {
            return `I sometimes focus too much on details, which I've learned to balance by setting clear priorities. ` +
                `I've been working on delegating more effectively and trusting my team members with responsibilities.`;
        }
    },

    // Where do you see yourself in 5 years?
    {
        patterns: [
            /where.*5.*year/i,
            /where.*five.*year/i,
            /career.*goal/i,
            /long.*term.*goal/i,
            /future.*plan/i
        ],
        generate: (profile) => {
            const title = profile.role.targetTitle || "leadership role";
            return `In five years, I see myself in a ${title} where I can drive strategic initiatives ` +
                `and mentor junior team members. I am committed to continuous learning and growing with an organization ` +
                `that values innovation and professional development.`;
        }
    },

    // Why are you leaving your current job?
    {
        patterns: [
            /why.*leaving/i,
            /why.*leave.*current/i,
            /reason.*change/i,
            /why.*looking/i
        ],
        generate: () => {
            return `I am seeking new challenges and opportunities for growth that align with my career goals. ` +
                `While I've learned a great deal in my current role, I am excited about the possibility of ` +
                `contributing to a new team and expanding my skill set.`;
        }
    },

    // Salary expectations (open-ended text)
    {
        patterns: [
            /salary.*expect/i,
            /compensation.*expect/i,
            /desired.*salary/i,
            /what.*salary/i
        ],
        generate: (profile) => {
            const min = profile.role.salaryMin;
            const max = profile.role.salaryMax;
            if (min && max) {
                return `My salary expectation is in the range of $${min.toLocaleString()} to $${max.toLocaleString()}, ` +
                    `depending on the total compensation package and benefits.`;
            }
            return `I am open to discussing compensation based on the responsibilities of the role and ` +
                `the overall benefits package.`;
        }
    },

    // Cover letter / Additional information
    {
        patterns: [
            /cover.*letter/i,
            /additional.*information/i,
            /anything.*else/i,
            /what.*else.*know/i
        ],
        generate: (profile, job) => {
            const company = job?.company || "your organization";
            const skills = profile.skills.technical.slice(0, 3).join(", ");

            return `I am enthusiastic about the opportunity to join ${company}. ` +
                `With my background in ${skills} and proven track record of delivering results, ` +
                `I am confident I would be a strong addition to your team. I look forward to discussing ` +
                `how I can contribute to your success.`;
        }
    },

    // How did you hear about us?
    {
        patterns: [
            /how.*hear.*about/i,
            /where.*find.*job/i,
            /source.*application/i,
            /how.*discover/i
        ],
        generate: () => {
            return `LinkedIn`;
        }
    }
];

/**
 * Find a matching template for the given question
 */
export function findTemplate(question: string): TemplateConfig | null {
    const normalized = question.toLowerCase().trim();

    for (const template of TEMPLATES) {
        if (template.patterns.some(p => p.test(normalized))) {
            return template;
        }
    }

    return null;
}

/**
 * Generate answer using template
 */
export function generateFromTemplate(
    template: TemplateConfig,
    profile: Profile,
    jobContext?: JobContext
): string {
    return template.generate(profile, jobContext);
}

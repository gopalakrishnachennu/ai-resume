// JD Matcher - Extracts job descriptions and calculates match score
// Compares job requirements with user profile

const JDMatcher = {
    // Skill categories for matching
    SKILL_CATEGORIES: {
        programming: [
            'javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'php', 'swift',
            'kotlin', 'typescript', 'scala', 'r', 'matlab', 'perl', 'shell', 'bash', 'sql',
            'html', 'css', 'nodejs', 'node.js', 'react', 'angular', 'vue', 'svelte',
            'django', 'flask', 'spring', 'express', 'fastapi', 'rails'
        ],
        cloud: [
            'aws', 'azure', 'gcp', 'google cloud', 'cloudformation', 'terraform',
            'kubernetes', 'k8s', 'docker', 'ec2', 's3', 'lambda', 'ecs', 'eks',
            'cloud computing', 'serverless', 'microservices'
        ],
        data: [
            'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
            'data analysis', 'machine learning', 'ml', 'ai', 'deep learning', 'tensorflow',
            'pytorch', 'pandas', 'numpy', 'spark', 'hadoop', 'etl', 'data pipeline',
            'tableau', 'power bi', 'data visualization'
        ],
        devops: [
            'ci/cd', 'jenkins', 'github actions', 'gitlab', 'circleci', 'travis',
            'ansible', 'puppet', 'chef', 'monitoring', 'prometheus', 'grafana',
            'linux', 'unix', 'networking', 'security', 'devops', 'sre'
        ],
        soft: [
            'communication', 'leadership', 'teamwork', 'problem solving', 'analytical',
            'agile', 'scrum', 'project management', 'collaboration', 'mentoring',
            'presentation', 'stakeholder', 'cross-functional'
        ]
    },

    // Experience level keywords
    EXPERIENCE_LEVELS: {
        entry: ['entry', 'junior', 'associate', '0-2 years', '1-2 years', 'new grad', 'graduate'],
        mid: ['mid', '2-5 years', '3-5 years', '2+ years', '3+ years'],
        senior: ['senior', 'sr', 'lead', '5+ years', '5-10 years', '7+ years', 'staff'],
        principal: ['principal', 'architect', 'director', '10+ years', 'expert']
    },

    /**
     * Extract job description from the current page
     * @returns {Object} Extracted JD data
     */
    extractJobDescription() {
        const jd = {
            title: '',
            company: '',
            description: '',
            requirements: [],
            skills: [],
            experienceLevel: 'unknown',
            location: ''
        };

        try {
            // Extract job title
            jd.title = this.extractJobTitle();

            // Extract company name
            jd.company = this.extractCompanyName();

            // Extract main description text
            jd.description = this.extractDescriptionText();

            // Extract skills from description
            jd.skills = this.extractSkills(jd.description);

            // Determine experience level
            jd.experienceLevel = this.determineExperienceLevel(jd.description + ' ' + jd.title);

            // Extract location
            jd.location = this.extractLocation();

            Utils.log(`Extracted JD: ${jd.title} at ${jd.company}, ${jd.skills.length} skills found`);
        } catch (error) {
            Utils.log('Error extracting JD: ' + error.message, 'error');
        }

        return jd;
    },

    /**
     * Extract job title from page
     */
    extractJobTitle() {
        const selectors = [
            'h1[class*="title"]', 'h1[class*="job"]',
            '[class*="job-title"]', '[class*="jobTitle"]',
            '[data-testid*="title"]', '.job-title', '#job-title',
            'h1', '.posting-headline h1'
        ];

        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el && el.textContent.trim().length > 3) {
                return el.textContent.trim().slice(0, 100);
            }
        }

        // Fallback to document title
        const title = document.title.split(/[-–|]/)[0].trim();
        return title.slice(0, 100);
    },

    /**
     * Extract company name from page
     */
    extractCompanyName() {
        const selectors = [
            '[class*="company-name"]', '[class*="companyName"]',
            '[class*="employer"]', '[data-testid*="company"]',
            '.company-name', '#company-name',
            '[class*="organization"]'
        ];

        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el && el.textContent.trim().length > 1) {
                return el.textContent.trim().slice(0, 50);
            }
        }

        return 'Unknown Company';
    },

    /**
     * Extract job description text
     */
    extractDescriptionText() {
        const selectors = [
            '[class*="job-description"]', '[class*="jobDescription"]',
            '[class*="description"]', '[class*="details"]',
            '[data-testid*="description"]', '.job-description',
            '#job-description', '[class*="posting-content"]',
            'article', 'main'
        ];

        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el && el.textContent.trim().length > 100) {
                return el.textContent.trim().slice(0, 5000);
            }
        }

        // Fallback to body text
        return document.body.innerText.slice(0, 5000);
    },

    /**
     * Extract skills from text
     * @param {string} text - Text to analyze
     * @returns {Array} Found skills
     */
    extractSkills(text) {
        const normalizedText = text.toLowerCase();
        const foundSkills = new Set();

        // Check all skill categories
        Object.values(this.SKILL_CATEGORIES).forEach(skills => {
            skills.forEach(skill => {
                if (normalizedText.includes(skill.toLowerCase())) {
                    foundSkills.add(skill);
                }
            });
        });

        return Array.from(foundSkills);
    },

    /**
     * Determine experience level from text
     */
    determineExperienceLevel(text) {
        const normalizedText = text.toLowerCase();

        for (const [level, keywords] of Object.entries(this.EXPERIENCE_LEVELS)) {
            if (keywords.some(kw => normalizedText.includes(kw))) {
                return level;
            }
        }

        return 'mid'; // Default to mid-level
    },

    /**
     * Extract location from page
     */
    extractLocation() {
        const selectors = [
            '[class*="location"]', '[class*="Location"]',
            '[data-testid*="location"]', '.job-location'
        ];

        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el && el.textContent.trim().length > 2) {
                return el.textContent.trim().slice(0, 50);
            }
        }

        return '';
    },

    /**
     * Calculate match score between JD and profile
     * @param {Object} jd - Extracted job description
     * @param {Object} profile - User profile
     * @returns {Object} Match result
     */
    calculateMatchScore(jd, profile) {
        if (!jd || !profile) {
            return { score: 0, breakdown: {}, matchedSkills: [], missingSkills: [] };
        }

        const result = {
            score: 0,
            breakdown: {
                skills: 0,
                experience: 0,
                education: 0
            },
            matchedSkills: [],
            missingSkills: [],
            recommendations: []
        };

        // 1. Skills matching (60% weight)
        const profileSkills = this.extractProfileSkills(profile);
        const jdSkills = jd.skills || [];

        jdSkills.forEach(skill => {
            const normalizedSkill = skill.toLowerCase();
            const isMatched = profileSkills.some(ps =>
                ps.toLowerCase().includes(normalizedSkill) ||
                normalizedSkill.includes(ps.toLowerCase())
            );

            if (isMatched) {
                result.matchedSkills.push(skill);
            } else {
                result.missingSkills.push(skill);
            }
        });

        if (jdSkills.length > 0) {
            result.breakdown.skills = Math.round((result.matchedSkills.length / jdSkills.length) * 100);
        } else {
            result.breakdown.skills = 50; // Neutral if no skills detected
        }

        // 2. Experience matching (30% weight)
        result.breakdown.experience = this.matchExperience(jd, profile);

        // 3. Education matching (10% weight)
        result.breakdown.education = this.matchEducation(jd, profile);

        // Calculate overall score (weighted)
        result.score = Math.round(
            (result.breakdown.skills * 0.6) +
            (result.breakdown.experience * 0.3) +
            (result.breakdown.education * 0.1)
        );

        // Generate recommendations
        if (result.missingSkills.length > 0) {
            result.recommendations.push(`Consider highlighting: ${result.missingSkills.slice(0, 3).join(', ')}`);
        }

        if (result.score < 50) {
            result.recommendations.push('This role may require additional skills or experience');
        } else if (result.score >= 80) {
            result.recommendations.push('Strong match! Your profile aligns well with this role');
        }

        return result;
    },

    /**
     * Extract skills from user profile
     */
    extractProfileSkills(profile) {
        const skills = [];

        // Direct skills array
        if (profile.skills) {
            if (Array.isArray(profile.skills)) {
                skills.push(...profile.skills);
            } else if (typeof profile.skills === 'object') {
                // Skills object with categories
                Object.values(profile.skills).forEach(category => {
                    if (Array.isArray(category)) {
                        skills.push(...category);
                    }
                });
            }
        }

        // Extract from experience descriptions
        if (profile.experience) {
            profile.experience.forEach(exp => {
                if (exp.description) {
                    const foundSkills = this.extractSkills(exp.description);
                    skills.push(...foundSkills);
                }
                if (exp.technologies) {
                    skills.push(...exp.technologies);
                }
            });
        }

        return [...new Set(skills)]; // Deduplicate
    },

    /**
     * Match experience level
     */
    matchExperience(jd, profile) {
        const profileYears = this.calculateProfileYears(profile);
        const requiredLevel = jd.experienceLevel;

        const levelRanges = {
            entry: [0, 2],
            mid: [2, 5],
            senior: [5, 10],
            principal: [10, 30]
        };

        const range = levelRanges[requiredLevel] || [0, 5];

        if (profileYears >= range[0] && profileYears <= range[1] + 2) {
            return 100; // Good match
        } else if (profileYears >= range[0] - 1) {
            return 75; // Close
        } else if (profileYears >= range[0] - 2) {
            return 50; // Stretch
        }

        return 25; // Mismatch
    },

    /**
     * Calculate years of experience from profile
     */
    calculateProfileYears(profile) {
        if (!profile.experience || profile.experience.length === 0) {
            return 0;
        }

        let totalYears = 0;
        const currentYear = new Date().getFullYear();

        profile.experience.forEach(exp => {
            if (exp.startDate) {
                const startYear = parseInt(exp.startDate.split('-')[0]) || parseInt(exp.startDate);
                const endYear = exp.endDate === 'Present' || !exp.endDate
                    ? currentYear
                    : parseInt(exp.endDate.split('-')[0]) || parseInt(exp.endDate);

                totalYears += Math.max(0, endYear - startYear);
            }
        });

        return totalYears;
    },

    /**
     * Match education
     */
    matchEducation(jd, profile) {
        const jdText = jd.description.toLowerCase();

        // Check for degree requirements
        const requiresPhD = /ph\.?d|doctorate/i.test(jdText);
        const requiresMasters = /master'?s|m\.?s\.|mba/i.test(jdText);
        const requiresBachelors = /bachelor'?s|b\.?s\.|b\.?a\./i.test(jdText);

        if (!profile.education || profile.education.length === 0) {
            return requiresBachelors || requiresMasters || requiresPhD ? 30 : 70;
        }

        const hasPhD = profile.education.some(e => /ph\.?d|doctorate/i.test(e.degree || ''));
        const hasMasters = profile.education.some(e => /master|m\.?s\.|mba/i.test(e.degree || ''));
        const hasBachelors = profile.education.some(e => /bachelor|b\.?s\.|b\.?a\./i.test(e.degree || ''));

        if (requiresPhD && hasPhD) return 100;
        if (requiresPhD && !hasPhD) return 40;
        if (requiresMasters && (hasMasters || hasPhD)) return 100;
        if (requiresMasters && hasBachelors) return 70;
        if (requiresBachelors && (hasBachelors || hasMasters || hasPhD)) return 100;

        return 80; // Default good match
    },

    /**
     * Get match score label
     */
    getScoreLabel(score) {
        if (score >= 85) return 'Excellent Match';
        if (score >= 70) return 'Good Match';
        if (score >= 50) return 'Moderate Match';
        if (score >= 30) return 'Stretch Role';
        return 'Low Match';
    },

    /**
     * Get score color
     */
    getScoreColor(score) {
        if (score >= 85) return '#10b981'; // Green
        if (score >= 70) return '#22c55e'; // Light green
        if (score >= 50) return '#f59e0b'; // Yellow
        if (score >= 30) return '#f97316'; // Orange
        return '#ef4444'; // Red
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JDMatcher;
}

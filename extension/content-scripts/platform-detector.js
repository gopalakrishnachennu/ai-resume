// Platform Detector - Identifies the job portal/ATS system
// Provides platform-specific selectors and behaviors

const PlatformDetector = {
    platforms: {
        linkedin: {
            name: 'LinkedIn',
            patterns: ['linkedin.com'],
            selectors: {
                easyApplyButton: '.jobs-apply-button',
                modal: '.jobs-easy-apply-modal, .artdeco-modal',
                formContainer: '.jobs-easy-apply-content, form',
                nextButton: 'button[aria-label*="next"], button[aria-label*="Continue"], button[data-easy-apply-next-button]',
                submitButton: 'button[aria-label*="submit"], button[aria-label*="Submit"]',
                closeButton: 'button[aria-label="Dismiss"]',
                fieldGroups: '.jobs-easy-apply-form-section'
            },
            specialHandling: true
        },
        indeed: {
            name: 'Indeed',
            patterns: ['indeed.com', 'indeed.', 'myindeed'],
            selectors: {
                applyButton: '.indeed-apply-button, #applyButtonLinkContainer',
                formContainer: '#ia-container, form, .ia-Application',
                fieldGroups: '.ia-Questions, .ia-Resume'
            }
        },
        glassdoor: {
            name: 'Glassdoor',
            patterns: ['glassdoor.com'],
            selectors: {
                applyButton: '.applyButton',
                formContainer: '.applicationContainer, form'
            }
        },
        workday: {
            name: 'Workday',
            patterns: ['myworkdayjobs.com', 'wd1.myworkdayjobs', 'wd3.myworkdayjobs', 'wd5.myworkdayjobs'],
            selectors: {
                formContainer: '[data-automation-id="jobPostingPage"], form',
                applyButton: '[data-automation-id="applyButton"]',
                sections: '[data-automation-id="formSection"]'
            },
            iframeMode: true
        },
        greenhouse: {
            name: 'Greenhouse',
            patterns: ['greenhouse.io', 'boards.greenhouse.io'],
            selectors: {
                formContainer: '#application_form, form',
                applyButton: '.submit-button',
                fieldGroups: '.field'
            }
        },
        lever: {
            name: 'Lever',
            patterns: ['lever.co', 'jobs.lever.co'],
            selectors: {
                formContainer: '.application-form, form',
                applyButton: '.submit-btn',
                fieldGroups: '.application-question'
            }
        },
        smartrecruiters: {
            name: 'SmartRecruiters',
            patterns: ['smartrecruiters.com'],
            selectors: {
                formContainer: '.application-form, form',
                fieldGroups: '.question-group'
            }
        },
        icims: {
            name: 'iCIMS',
            patterns: ['icims.com'],
            selectors: {
                formContainer: '.iCIMS_MainWrapper, form'
            }
        },
        taleo: {
            name: 'Taleo',
            patterns: ['taleo.net'],
            selectors: {
                formContainer: '#requisitionDescriptionInterface, form'
            }
        },
        ashby: {
            name: 'Ashby',
            patterns: ['ashbyhq.com'],
            selectors: {
                formContainer: '.ashby-application-form, form'
            }
        },
        bamboohr: {
            name: 'BambooHR',
            patterns: ['bamboohr.com'],
            selectors: {
                formContainer: '.application-form, form'
            }
        },
        workable: {
            name: 'Workable',
            patterns: ['workable.com', 'apply.workable.com'],
            selectors: {
                formContainer: '.application-form, form'
            }
        },
        recruitee: {
            name: 'Recruitee',
            patterns: ['recruitee.com', 'jobs.recruitee'],
            selectors: {
                formContainer: '.application-form, form',
                applyButton: 'button[type="submit"], .application-form button'
            }
        },
        jobvite: {
            name: 'Jobvite',
            patterns: ['jobvite.com'],
            selectors: {
                formContainer: '.jv-application-form, form'
            }
        },
        wellfound: {
            name: 'Wellfound (AngelList)',
            patterns: ['wellfound.com', 'angel.co'],
            selectors: {
                formContainer: '.application-form, form'
            }
        },
        ziprecruiter: {
            name: 'ZipRecruiter',
            patterns: ['ziprecruiter.com'],
            selectors: {
                formContainer: '.apply-form, form'
            }
        },
        monster: {
            name: 'Monster',
            patterns: ['monster.com'],
            selectors: {
                formContainer: '.apply-form, form'
            }
        },
        careerbuilder: {
            name: 'CareerBuilder',
            patterns: ['careerbuilder.com'],
            selectors: {
                formContainer: '.apply-form, form'
            }
        },
        dice: {
            name: 'Dice',
            patterns: ['dice.com'],
            selectors: {
                formContainer: '.apply-form, form'
            }
        },
        generic: {
            name: 'Generic',
            patterns: [],
            selectors: {
                formContainer: 'form, .application-form, .apply-form, .job-application'
            }
        }
    },

    /**
     * Detect the current platform
     * @returns {Object} Platform configuration
     */
    detect() {
        const hostname = window.location.hostname.toLowerCase();
        const pathname = window.location.pathname.toLowerCase();
        const fullUrl = hostname + pathname;

        for (const [key, platform] of Object.entries(this.platforms)) {
            if (platform.patterns.some(pattern => fullUrl.includes(pattern))) {
                console.log(`[JobFiller] Detected platform: ${platform.name}`);
                return { id: key, ...platform };
            }
        }

        // Check if page looks like a job application
        if (this.looksLikeJobPage()) {
            console.log('[JobFiller] Generic job application page detected');
            return { id: 'generic', ...this.platforms.generic };
        }

        return null;
    },

    /**
     * Check if the page looks like a job application
     * @returns {boolean}
     */
    looksLikeJobPage() {
        const jobKeywords = [
            'apply', 'application', 'career', 'job', 'position', 'hiring',
            'resume', 'cv', 'employment', 'candidate', 'recruit'
        ];

        const pageText = document.body?.innerText?.toLowerCase() || '';
        const pathname = window.location.pathname.toLowerCase();
        const title = document.title.toLowerCase();

        // Check URL patterns
        if (pathname.match(/(apply|application|careers?|jobs?|position)/)) {
            return true;
        }

        // Check title
        if (jobKeywords.some(keyword => title.includes(keyword))) {
            return true;
        }

        // Check for form with resume/job-related fields
        const hasResumeField = document.querySelector('input[type="file"][accept*="pdf"], input[name*="resume"], input[name*="cv"]');
        const hasJobFields = document.querySelector('input[name*="experience"], input[name*="education"], textarea[name*="cover"]');

        if (hasResumeField || hasJobFields) {
            return true;
        }

        // Count job-related form fields
        let jobFieldCount = 0;
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            const name = input.name?.toLowerCase() || '';
            const label = input.getAttribute('aria-label')?.toLowerCase() || '';
            const placeholder = input.placeholder?.toLowerCase() || '';
            const combined = name + label + placeholder;

            if (combined.match(/(name|email|phone|experience|education|skill|linkedin|github|portfolio)/)) {
                jobFieldCount++;
            }
        });

        return jobFieldCount >= 3;
    },

    /**
     * Get the form container for current platform
     * @param {Object} platform - Platform configuration
     * @returns {HTMLElement|null}
     */
    getFormContainer(platform) {
        if (!platform?.selectors?.formContainer) {
            return document.querySelector('form');
        }

        return document.querySelector(platform.selectors.formContainer);
    },

    /**
     * Check if LinkedIn Easy Apply modal is open
     * @returns {boolean}
     */
    isLinkedInEasyApplyOpen() {
        return !!document.querySelector('.jobs-easy-apply-modal, .artdeco-modal[data-test-modal]');
    },

    /**
     * Get all form elements on page
     * @returns {NodeList}
     */
    getAllFormElements() {
        return document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select');
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlatformDetector;
}

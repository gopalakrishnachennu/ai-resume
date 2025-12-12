// ATS Handlers - Platform-specific automation for major ATS systems
// Provides specialized handling for LinkedIn Easy Apply, Workday, and Greenhouse

const ATSHandlers = {
    // Current platform reference
    currentPlatform: null,

    /**
     * Initialize handler for detected platform
     * @param {Object} platform - Platform configuration from PlatformDetector
     */
    init(platform) {
        this.currentPlatform = platform;
        console.log(`[JobFiller] ATS Handler initialized for: ${platform?.name || 'Generic'}`);
    },

    /**
     * Get the appropriate handler for current platform
     * @returns {Object} Platform-specific handler
     */
    getHandler() {
        if (!this.currentPlatform) return this.handlers.generic;

        const handlerId = this.currentPlatform.id;
        return this.handlers[handlerId] || this.handlers.generic;
    },

    /**
     * Platform-specific handlers
     */
    handlers: {
        /**
         * LinkedIn Easy Apply Handler
         */
        linkedin: {
            name: 'LinkedIn Easy Apply',

            /**
             * Detect current step in multi-step modal
             * @returns {Object} Step information
             */
            getStepInfo() {
                const modal = document.querySelector('.jobs-easy-apply-modal, .artdeco-modal');
                if (!modal) return { current: 0, total: 0, isMultiStep: false };

                // Try to find step indicator in footer
                const footer = modal.querySelector('.jobs-easy-apply-footer, .artdeco-modal__actionbar');
                const stepText = footer?.textContent || '';

                // Match patterns like "Step 1 of 4" or "1/4"
                const stepMatch = stepText.match(/(\d+)\s*(?:of|\/)\s*(\d+)/i);
                if (stepMatch) {
                    return {
                        current: parseInt(stepMatch[1]),
                        total: parseInt(stepMatch[2]),
                        isMultiStep: true
                    };
                }

                // Check for progress dots
                const progressDots = modal.querySelectorAll('.artdeco-completeness-meter-linear__progress-element, .progress-bar-item');
                if (progressDots.length > 1) {
                    const activeDot = Array.from(progressDots).findIndex(dot =>
                        dot.classList.contains('active') || dot.classList.contains('artdeco-completeness-meter-linear__progress-element--complete')
                    );
                    return {
                        current: activeDot + 1,
                        total: progressDots.length,
                        isMultiStep: true
                    };
                }

                return { current: 1, total: 1, isMultiStep: false };
            },

            /**
             * Get form fields in current modal
             */
            getFormFields() {
                const modal = document.querySelector('.jobs-easy-apply-modal, .artdeco-modal');
                if (!modal) return [];

                return modal.querySelectorAll(
                    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), ' +
                    'textarea, select, ' +
                    '[role="combobox"], [role="listbox"]'
                );
            },

            /**
             * Get next button element
             */
            getNextButton() {
                const modal = document.querySelector('.jobs-easy-apply-modal, .artdeco-modal');
                if (!modal) return null;

                return modal.querySelector(
                    'button[aria-label*="next" i], ' +
                    'button[aria-label*="continue" i], ' +
                    'button[data-easy-apply-next-button], ' +
                    'button.artdeco-button--primary:not([aria-label*="submit" i])'
                );
            },

            /**
             * Get submit button element
             */
            getSubmitButton() {
                const modal = document.querySelector('.jobs-easy-apply-modal, .artdeco-modal');
                if (!modal) return null;

                return modal.querySelector(
                    'button[aria-label*="submit" i], ' +
                    'button[aria-label*="Send application" i], ' +
                    'button[data-control-name="submit_unify"]'
                );
            },

            /**
             * Get review button (for review step)
             */
            getReviewButton() {
                const modal = document.querySelector('.jobs-easy-apply-modal, .artdeco-modal');
                if (!modal) return null;

                return modal.querySelector(
                    'button[aria-label*="review" i], ' +
                    'button[aria-label*="Review" i]'
                );
            },

            /**
             * Advance to next step
             * @returns {Promise<boolean>} Success status
             */
            async advanceStep() {
                const nextBtn = this.getNextButton();
                const reviewBtn = this.getReviewButton();
                const targetBtn = nextBtn || reviewBtn;

                if (targetBtn && !targetBtn.disabled) {
                    targetBtn.click();
                    // Wait for DOM update
                    await new Promise(resolve => setTimeout(resolve, 500));
                    return true;
                }
                return false;
            },

            /**
             * Get LinkedIn-specific field mappings
             */
            getFieldMappings() {
                return {
                    // LinkedIn uses specific data attributes
                    phoneType: '[data-test-single-typeahead-entity-form-component]',
                    countryCode: '[data-test-text-entity-list-form-component]',
                    resumeUpload: 'input[name="file"]',
                    additionalQuestions: '.jobs-easy-apply-form-section__question'
                };
            },

            /**
             * Check if on cover letter step
             */
            isCoverLetterStep() {
                const modal = document.querySelector('.jobs-easy-apply-modal, .artdeco-modal');
                if (!modal) return false;

                const coverLetterField = modal.querySelector(
                    'textarea[name*="cover"], ' +
                    '[data-test-text-area-for-cover-letter], ' +
                    '.jobs-easy-apply-form-section__label-subtitle'
                );

                if (coverLetterField) {
                    const labelText = modal.textContent?.toLowerCase() || '';
                    return labelText.includes('cover letter');
                }
                return false;
            }
        },

        /**
         * Workday Handler
         */
        workday: {
            name: 'Workday',

            /**
             * Get step information for Workday multi-page forms
             */
            getStepInfo() {
                // Workday uses various progress indicators
                const progressBar = document.querySelector('[data-automation-id="progressBar"], .WDPT .progressBar');
                const steps = document.querySelectorAll('[data-automation-id="step"], .stepIndicator');

                if (steps.length > 0) {
                    const activeStep = Array.from(steps).findIndex(step =>
                        step.classList.contains('active') ||
                        step.getAttribute('aria-current') === 'step'
                    );
                    return {
                        current: activeStep + 1,
                        total: steps.length,
                        isMultiStep: true
                    };
                }

                // Fallback: look for page title patterns
                const pageTitle = document.querySelector('[data-automation-id="pageTitle"], h1')?.textContent || '';
                const pageMatch = pageTitle.match(/page\s*(\d+)/i);
                if (pageMatch) {
                    return {
                        current: parseInt(pageMatch[1]),
                        total: 0, // Unknown total
                        isMultiStep: true
                    };
                }

                return { current: 1, total: 1, isMultiStep: false };
            },

            /**
             * Get form container(s) including iframes
             */
            getFormContainers() {
                const containers = [];

                // Main form
                const mainForm = document.querySelector('[data-automation-id="jobPostingPage"], form');
                if (mainForm) containers.push(mainForm);

                // Check for iframes (Workday often uses these)
                const iframes = document.querySelectorAll('iframe[src*="workday"], iframe[id*="wd"]');
                iframes.forEach(iframe => {
                    try {
                        if (iframe.contentDocument) {
                            containers.push(iframe.contentDocument);
                        }
                    } catch (e) {
                        // Cross-origin iframe, can't access
                        console.log('[JobFiller] Unable to access Workday iframe (cross-origin)');
                    }
                });

                return containers;
            },

            /**
             * Get all form fields across containers
             */
            getFormFields() {
                const allFields = [];
                const containers = this.getFormContainers();

                containers.forEach(container => {
                    const fields = container.querySelectorAll(
                        'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), ' +
                        'textarea, select, ' +
                        '[data-automation-id][contenteditable="true"]'
                    );
                    allFields.push(...fields);
                });

                return allFields;
            },

            /**
             * Get Workday-specific field by automation ID
             */
            getFieldByAutomationId(id) {
                return document.querySelector(`[data-automation-id="${id}"]`);
            },

            /**
             * Get navigation buttons
             */
            getNavigationButtons() {
                return {
                    next: document.querySelector('[data-automation-id="nextButton"], button[data-automation-id="bottom-navigation-next-button"]'),
                    previous: document.querySelector('[data-automation-id="previousButton"], button[data-automation-id="bottom-navigation-previous-button"]'),
                    submit: document.querySelector('[data-automation-id="submitButton"], button[data-automation-id="bottom-navigation-submit-button"]'),
                    save: document.querySelector('[data-automation-id="saveButton"]')
                };
            },

            /**
             * Advance to next page
             */
            async advanceStep() {
                const { next } = this.getNavigationButtons();
                if (next && !next.disabled) {
                    next.click();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return true;
                }
                return false;
            },

            /**
             * Get Workday-specific field mappings
             */
            getFieldMappings() {
                return {
                    firstName: '[data-automation-id="legalNameSection_firstName"]',
                    lastName: '[data-automation-id="legalNameSection_lastName"]',
                    email: '[data-automation-id="email"]',
                    phone: '[data-automation-id="phone-number"]',
                    address: '[data-automation-id="addressSection_addressLine1"]',
                    city: '[data-automation-id="addressSection_city"]',
                    state: '[data-automation-id="addressSection_countryRegion"]',
                    zip: '[data-automation-id="addressSection_postalCode"]',
                    resume: '[data-automation-id="file-upload-input-ref"]'
                };
            },

            /**
             * Check for country-specific sensitive fields
             */
            hasSensitiveFields() {
                const sensitiveSelectors = [
                    '[data-automation-id*="ssn" i]',
                    '[data-automation-id*="socialSecurity" i]',
                    '[data-automation-id*="nationalId" i]',
                    '[data-automation-id*="taxId" i]'
                ];

                return sensitiveSelectors.some(sel => document.querySelector(sel));
            }
        },

        /**
         * Greenhouse Handler
         */
        greenhouse: {
            name: 'Greenhouse',

            /**
             * Greenhouse typically has single-page forms
             */
            getStepInfo() {
                // Check for multi-step (rare in Greenhouse)
                const sections = document.querySelectorAll('#application_form > fieldset, #application_form > .field');

                return {
                    current: 1,
                    total: 1,
                    isMultiStep: false,
                    sectionCount: sections.length
                };
            },

            /**
             * Get form fields
             */
            getFormFields() {
                const form = document.querySelector('#application_form, form.application-form');
                if (!form) return [];

                return form.querySelectorAll(
                    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), ' +
                    'textarea, select'
                );
            },

            /**
             * Get custom questions (Greenhouse specialty)
             */
            getCustomQuestions() {
                const customQuestions = [];
                const questionFields = document.querySelectorAll(
                    '#custom_fields input, ' +
                    '#custom_fields textarea, ' +
                    '#custom_fields select, ' +
                    '.field[id*="question"], ' +
                    '[data-question-id]'
                );

                questionFields.forEach(field => {
                    const container = field.closest('.field') || field.parentElement;
                    const label = container?.querySelector('label')?.textContent?.trim() || '';

                    customQuestions.push({
                        element: field,
                        question: label,
                        type: field.tagName.toLowerCase(),
                        required: field.required || container?.classList.contains('required'),
                        options: field.tagName === 'SELECT' ?
                            Array.from(field.options).map(o => ({ value: o.value, text: o.text })) :
                            null
                    });
                });

                return customQuestions;
            },

            /**
             * Get submit button
             */
            getSubmitButton() {
                return document.querySelector(
                    '#application_form input[type="submit"], ' +
                    '#application_form button[type="submit"], ' +
                    '.submit-button, ' +
                    'button.application-submit'
                );
            },

            /**
             * Greenhouse-specific field mappings
             */
            getFieldMappings() {
                return {
                    firstName: '#first_name, input[name="job_application[first_name]"]',
                    lastName: '#last_name, input[name="job_application[last_name]"]',
                    email: '#email, input[name="job_application[email]"]',
                    phone: '#phone, input[name="job_application[phone]"]',
                    resume: '#resume, input[name="job_application[resume]"]',
                    coverLetter: '#cover_letter, textarea[name="job_application[cover_letter]"]',
                    linkedin: 'input[name*="linkedin"]',
                    github: 'input[name*="github"]',
                    portfolio: 'input[name*="portfolio"], input[name*="website"]'
                };
            },

            /**
             * Match dropdown option using fuzzy matching
             * @param {HTMLSelectElement} select - Select element
             * @param {string} targetValue - Value to match
             * @returns {HTMLOptionElement|null}
             */
            fuzzyMatchOption(select, targetValue) {
                if (!select || !targetValue) return null;

                const normalizedTarget = targetValue.toLowerCase().trim();
                const options = Array.from(select.options);

                // Exact match
                let match = options.find(o =>
                    o.value.toLowerCase() === normalizedTarget ||
                    o.text.toLowerCase() === normalizedTarget
                );
                if (match) return match;

                // Contains match
                match = options.find(o =>
                    o.text.toLowerCase().includes(normalizedTarget) ||
                    normalizedTarget.includes(o.text.toLowerCase())
                );
                if (match) return match;

                // Word-based match
                const targetWords = normalizedTarget.split(/\s+/);
                match = options.find(o => {
                    const optionWords = o.text.toLowerCase().split(/\s+/);
                    return targetWords.some(tw => optionWords.some(ow => ow.includes(tw) || tw.includes(ow)));
                });

                return match || null;
            },

            /**
             * Get EEO/Demographic fields (common in Greenhouse)
             */
            getEEOFields() {
                return document.querySelectorAll(
                    '#demographic_questions select, ' +
                    '#demographic_questions input, ' +
                    '[id*="gender"] select, ' +
                    '[id*="race"] select, ' +
                    '[id*="ethnicity"] select, ' +
                    '[id*="veteran"] select, ' +
                    '[id*="disability"] select'
                );
            }
        },

        /**
         * Generic handler for unknown platforms
         */
        generic: {
            name: 'Generic',

            getStepInfo() {
                return { current: 1, total: 1, isMultiStep: false };
            },

            getFormFields() {
                return document.querySelectorAll(
                    'form input:not([type="hidden"]):not([type="submit"]):not([type="button"]), ' +
                    'form textarea, form select'
                );
            },

            getSubmitButton() {
                return document.querySelector(
                    'button[type="submit"], ' +
                    'input[type="submit"], ' +
                    'button.submit, ' +
                    'button.apply'
                );
            },

            getFieldMappings() {
                return {}; // Use default field detection
            }
        }
    },

    /**
     * Execute platform-specific fill operation
     * @param {Object} profile - User profile data
     * @param {Object} filler - FormFiller instance
     * @returns {Object} Fill result
     */
    async fillWithHandler(profile, filler) {
        const handler = this.getHandler();
        const stepInfo = handler.getStepInfo();

        console.log(`[JobFiller] Filling with ${handler.name} handler, Step: ${stepInfo.current}/${stepInfo.total}`);

        const result = {
            platform: handler.name,
            step: stepInfo,
            filled: 0,
            errors: []
        };

        try {
            // Get platform-specific fields
            const fields = handler.getFormFields();
            result.fieldsFound = fields.length;

            // Use filler with platform context
            // The actual filling is delegated to the form filler
            // This handler provides platform-specific context

        } catch (error) {
            result.errors.push(error.message);
            console.error('[JobFiller] ATS Handler error:', error);
        }

        return result;
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ATSHandlers;
}

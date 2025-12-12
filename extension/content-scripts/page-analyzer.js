// Page Analyzer - Intelligent Page Type Detection
// Analyzes the current page to determine type and appropriate action

const PageAnalyzer = {
    // Page type constants
    PAGE_TYPES: {
        SIGNIN: 'signin',
        JOB_FORM: 'job_form',
        JOB_LISTING: 'job_listing',
        PROFILE: 'profile',
        OTHER: 'other'
    },

    // Form status constants
    FORM_STATUS: {
        FILLABLE: 'fillable',
        PARTIAL: 'partial',
        UNFILLABLE: 'unfillable',
        NONE: 'none'
    },

    // Action constants
    ACTIONS: {
        AUTO_PROMPT: 'auto_prompt',
        NOTIFY_PARTIAL: 'notify_partial',
        NOTIFY_ISSUE: 'notify_issue',
        NONE: 'none'
    },

    /**
     * Analyze the current page
     * @returns {Object} Analysis result
     */
    analyze() {
        const pageType = this.detectPageType();
        const hasForm = this.hasJobApplicationForm();
        const formAnalysis = hasForm ? this.analyzeFormFields() : null;

        const result = {
            pageType,
            hasForm,
            formStatus: formAnalysis?.status || this.FORM_STATUS.NONE,
            fieldCount: formAnalysis?.fieldCount || 0,
            fillableCount: formAnalysis?.fillableCount || 0,
            unfillableFields: formAnalysis?.unfillableFields || [],
            suggestedAction: this.determineBestAction(pageType, formAnalysis),
            timestamp: Date.now()
        };

        Utils.log(`Page analysis: ${JSON.stringify(result)}`, 'debug');
        return result;
    },

    /**
     * Detect the type of the current page
     * @returns {string} Page type
     */
    detectPageType() {
        const url = window.location.href.toLowerCase();
        const pageText = document.body?.innerText?.toLowerCase() || '';
        const title = document.title.toLowerCase();

        // Check for sign-in/login pages
        if (this.isSignInPage(url, pageText, title)) {
            return this.PAGE_TYPES.SIGNIN;
        }

        // Check for job application form
        if (this.hasJobApplicationForm()) {
            return this.PAGE_TYPES.JOB_FORM;
        }

        // Check for job listing page
        if (this.isJobListingPage(url, pageText, title)) {
            return this.PAGE_TYPES.JOB_LISTING;
        }

        // Check for profile page
        if (this.isProfilePage(url, pageText)) {
            return this.PAGE_TYPES.PROFILE;
        }

        return this.PAGE_TYPES.OTHER;
    },

    /**
     * Check if current page is a sign-in/login page
     */
    isSignInPage(url, pageText, title) {
        const signinPatterns = [
            /\/(login|signin|sign-in|auth|authenticate)/i,
            /\/(session|sessions)\/?$/i,
            /\/uas\/login/i,
            /\/checkpoint/i
        ];

        // URL check
        if (signinPatterns.some(p => p.test(url))) {
            return true;
        }

        // Check for login forms
        const loginForm = document.querySelector('form[action*="login"], form[action*="signin"], form[action*="auth"]');
        if (loginForm) {
            const passwordFields = loginForm.querySelectorAll('input[type="password"]');
            const inputFields = loginForm.querySelectorAll('input:not([type="hidden"])');
            // Login forms typically have 2-3 fields (email/username, password, maybe remember me)
            if (passwordFields.length > 0 && inputFields.length <= 4) {
                return true;
            }
        }

        // Check page title
        if (/sign\s*in|log\s*in|login/i.test(title)) {
            return true;
        }

        // Check for prominent login text without application form indicators
        const hasLoginText = /sign\s*in|log\s*in/i.test(pageText.slice(0, 1000));
        const hasApplicationText = /apply|application|resume|cv|cover letter/i.test(pageText.slice(0, 2000));

        if (hasLoginText && !hasApplicationText) {
            return true;
        }

        return false;
    },

    /**
     * Check if page has a job application form (not just a search form)
     */
    hasJobApplicationForm() {
        // First, check if this looks like a job listing/search page - NOT an application page
        if (this.isJobSearchOrListingPage()) {
            return false; // Don't trigger on job search/listing pages
        }

        // Check for common application form indicators
        const formIndicators = [
            // Form containers
            'form[class*="application"]',
            'form[class*="apply"]',
            'form[id*="application"]',
            'form[id*="apply"]',
            '[class*="application-form"]',
            '[class*="job-application"]',
            '[class*="apply-form"]',
            // Field groups
            '[class*="personal-info"]',
            '[class*="work-experience"]',
            // Resume upload
            'input[type="file"][name*="resume"]',
            'input[type="file"][accept*=".pdf"]',
            '[class*="resume-upload"]',
            '[class*="cv-upload"]'
        ];

        for (const selector of formIndicators) {
            if (document.querySelector(selector)) {
                return true;
            }
        }

        // Check for APPLICATION-SPECIFIC fields (not just any job-related fields)
        const appFields = this.countApplicationFields();
        return appFields >= 4; // At least 4 application-specific fields
    },

    /**
     * Check if this is a job search or listing page (not an application)
     */
    isJobSearchOrListingPage() {
        const url = window.location.href.toLowerCase();

        // Check for common job listing/search URL patterns
        const listingPatterns = [
            /simplyhired\.com\/search/i,
            /simplyhired\.com\/job\//i,
            /indeed\.com\/jobs/i,
            /indeed\.com\/viewjob/i,
            /linkedin\.com\/jobs\/search/i,
            /linkedin\.com\/jobs\/view/i,
            /glassdoor\.com\/job-listing/i,
            /glassdoor\.com\/Job/i,
            /ziprecruiter\.com\/jobs/i,
            /monster\.com\/jobs/i,
            /\/(jobs|careers|positions)\/?\?/i, // URL with query params (search)
        ];

        if (listingPatterns.some(p => p.test(url))) {
            // Check if there's an "Apply Now" or similar button (indicating listing, not form)
            const applyButton = document.querySelector(
                'a[href*="apply"], button[aria-label*="Apply"], [class*="apply-button"], [class*="apply-now"]'
            ) || Array.from(document.querySelectorAll('button, a')).find(el =>
                (el.textContent || '').toLowerCase().includes('apply')
            );
            if (applyButton || /apply now|quick apply|easy apply/i.test(document.body.innerText)) {
                return true;
            }
        }

        // Check for job listing indicators (multiple job cards)
        const jobCards = document.querySelectorAll(
            '[class*="job-card"], [class*="job-listing"], [class*="job-result"], ' +
            '[class*="JobCard"], [class*="jobCard"], [data-testid*="job"]'
        );
        if (jobCards.length > 1) {
            return true;
        }

        return false;
    },

    /**
     * Count APPLICATION-SPECIFIC form fields (excludes search fields)
     */
    countApplicationFields() {
        // These patterns are specific to job APPLICATIONS, not search forms
        const applicationFieldPatterns = [
            // Personal info (required for applications, not searches)
            /first.?name/i, /last.?name/i, /full.?name/i,
            /phone/i, /mobile/i, /telephone/i,
            /street|address line/i, /zip|postal/i,
            // Professional profiles
            /linkedin/i, /github/i, /portfolio/i, /website/i,
            // Work history
            /current.?company/i, /employer/i, /work.?history/i,
            // Education
            /university/i, /college/i, /school/i, /degree/i, /major/i, /gpa/i,
            // Documents
            /resume/i, /cv/i, /cover.?letter/i,
            // Application questions
            /salary/i, /visa/i, /sponsor/i, /relocate/i,
            /work.?auth/i, /eligible/i, /available/i, /start.?date/i,
            // Demographics
            /gender/i, /race/i, /ethnicity/i, /veteran/i, /disability/i
        ];

        // Exclude these patterns (search-related)
        const searchFieldPatterns = [
            /job.?title/i, /keyword/i, /search/i, /find/i,
            /location|city.*state|where/i, /remote/i,
            /sort/i, /filter/i, /radius/i, /distance/i
        ];

        const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea');
        let count = 0;

        inputs.forEach(input => {
            // Skip inputs in search forms
            const form = input.closest('form');
            if (form && (
                form.classList.toString().toLowerCase().includes('search') ||
                form.id?.toLowerCase().includes('search') ||
                form.getAttribute('role') === 'search'
            )) {
                return;
            }

            const text = [
                input.name || '',
                input.id || '',
                input.placeholder || '',
                input.getAttribute('aria-label') || '',
                Utils.findLabel(input) || ''
            ].join(' ').toLowerCase();

            // Skip if it matches search patterns
            if (searchFieldPatterns.some(p => p.test(text))) {
                return;
            }

            // Count if it matches application patterns
            if (applicationFieldPatterns.some(p => p.test(text))) {
                count++;
            }
        });

        return count;
    },

    /**
     * Check if page is a job listing
     */
    isJobListingPage(url, pageText, title) {
        const listingPatterns = [
            /\/jobs\//i,
            /\/job\//i,
            /\/careers?\//i,
            /\/positions?\//i,
            /\/openings?\//i
        ];

        if (listingPatterns.some(p => p.test(url))) {
            // Make sure it's a listing, not an application
            if (!this.hasJobApplicationForm()) {
                return true;
            }
        }

        // Check for job listing indicators
        const hasJobList = document.querySelectorAll('[class*="job-card"], [class*="job-listing"], [class*="job-result"]').length > 2;
        return hasJobList;
    },

    /**
     * Check if page is a profile page
     */
    isProfilePage(url, pageText) {
        return /\/(profile|settings|account)/i.test(url);
    },

    /**
     * Analyze form fields for fillability
     */
    analyzeFormFields() {
        const detector = new FormDetector();
        detector.init(PlatformDetector.detect());
        const fields = detector.detectFormFields();

        const allCategories = ['personal', 'experience', 'education', 'skills', 'preferences', 'documents', 'demographics', 'misc', 'other'];

        let fieldCount = 0;
        let fillableCount = 0;
        const unfillableFields = [];

        allCategories.forEach(category => {
            if (fields[category]) {
                fields[category].forEach(field => {
                    fieldCount++;
                    if (field.confidence > 0.3) {
                        fillableCount++;
                    } else {
                        unfillableFields.push({
                            label: field.label || field.name || field.id,
                            type: field.type
                        });
                    }
                });
            }
        });

        // Handle resume separately
        if (fields.resume && fields.resume.length > 0) {
            fieldCount += fields.resume.length;
            // Resume files can't be auto-filled
            fields.resume.forEach(f => {
                unfillableFields.push({ label: 'Resume/CV Upload', type: 'file' });
            });
        }

        let status;
        if (fieldCount === 0) {
            status = this.FORM_STATUS.NONE;
        } else if (fillableCount === fieldCount) {
            status = this.FORM_STATUS.FILLABLE;
        } else if (fillableCount > 0) {
            status = this.FORM_STATUS.PARTIAL;
        } else {
            status = this.FORM_STATUS.UNFILLABLE;
        }

        return {
            status,
            fieldCount,
            fillableCount,
            unfillableFields,
            fields
        };
    },

    /**
     * Determine the best action based on analysis
     */
    determineBestAction(pageType, formAnalysis) {
        // Don't show anything on sign-in pages
        if (pageType === this.PAGE_TYPES.SIGNIN) {
            return this.ACTIONS.NONE;
        }

        // No form detected
        if (!formAnalysis || formAnalysis.status === this.FORM_STATUS.NONE) {
            return this.ACTIONS.NONE;
        }

        // Job form with fillable fields
        if (pageType === this.PAGE_TYPES.JOB_FORM) {
            if (formAnalysis.status === this.FORM_STATUS.FILLABLE) {
                return this.ACTIONS.AUTO_PROMPT;
            }
            if (formAnalysis.status === this.FORM_STATUS.PARTIAL) {
                return this.ACTIONS.NOTIFY_PARTIAL;
            }
            if (formAnalysis.status === this.FORM_STATUS.UNFILLABLE) {
                return this.ACTIONS.NOTIFY_ISSUE;
            }
        }

        return this.ACTIONS.NONE;
    },

    /**
     * Check if this page/form has been dismissed before
     */
    async isDismissed() {
        const pageKey = this.getPageKey();
        try {
            const result = await chrome.storage.local.get('dismissedForms');
            const dismissed = result.dismissedForms || {};
            return !!dismissed[pageKey];
        } catch (e) {
            return false;
        }
    },

    /**
     * Mark this page/form as dismissed
     */
    async dismiss() {
        const pageKey = this.getPageKey();
        try {
            const result = await chrome.storage.local.get('dismissedForms');
            const dismissed = result.dismissedForms || {};
            dismissed[pageKey] = Date.now();

            // Keep only last 100 dismissed forms
            const keys = Object.keys(dismissed);
            if (keys.length > 100) {
                const sortedKeys = keys.sort((a, b) => dismissed[a] - dismissed[b]);
                sortedKeys.slice(0, keys.length - 100).forEach(k => delete dismissed[k]);
            }

            await chrome.storage.local.set({ dismissedForms: dismissed });
        } catch (e) {
            Utils.log('Error saving dismissed form: ' + e.message, 'error');
        }
    },

    /**
     * Get unique key for current page
     */
    getPageKey() {
        const url = new URL(window.location.href);
        // Use pathname as key (ignore query params which may change)
        return `${url.hostname}${url.pathname}`;
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PageAnalyzer;
}

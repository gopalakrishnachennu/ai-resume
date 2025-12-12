// Smart Monitor - Proactive form detection with viewport awareness
// Auto-triggers banner when forms/modals appear in viewport

const SmartMonitor = {
    // Configuration
    config: {
        debounceMs: 300,
        intersectionThreshold: 0.3,
        dismissalDuration: 30 * 60 * 1000, // 30 minutes
        redetectCooldown: 5000 // 5 seconds between triggers
    },

    // State
    state: {
        isWatching: false,
        lastTriggerTime: 0,
        dismissedUntil: 0,
        observedElements: new WeakSet(),
        currentPlatform: null,
        detectedForms: [],
        intersectionObserver: null,
        mutationObserver: null
    },

    // Platform-specific modal selectors
    modalSelectors: {
        linkedin: [
            '.jobs-easy-apply-modal',
            '.artdeco-modal[role="dialog"]',
            '.jobs-apply-form'
        ],
        workday: [
            '[data-automation-id="jobPostingPage"]',
            '.WDFC',
            '[data-automation-id="applyButton"]'
        ],
        greenhouse: [
            '#application_form',
            '.application-form',
            '#main_fields'
        ],
        lever: [
            '.application-form',
            '.posting-apply'
        ],
        indeed: [
            '#ia-container',
            '.ia-Application',
            '.indeed-apply-widget'
        ],
        generic: [
            'form[action*="apply"]',
            'form[action*="submit"]',
            'form[action*="application"]',
            '.apply-form',
            '.job-application'
        ]
    },

    /**
     * Initialize the smart monitor
     * @param {Object} platform - Current platform config
     * @param {Function} onFormDetected - Callback when form detected
     */
    init(platform, onFormDetected) {
        this.state.currentPlatform = platform;
        this.onFormDetected = onFormDetected || (() => { });

        // Check if dismissed recently
        this.loadDismissalState();

        // Setup observers
        this.setupIntersectionObserver();
        this.setupMutationObserver();

        // Initial scan
        this.scanForForms();

        this.state.isWatching = true;
        console.log('[JobFiller] Smart Monitor initialized');
    },

    /**
     * Setup IntersectionObserver for viewport detection
     */
    setupIntersectionObserver() {
        this.state.intersectionObserver = new IntersectionObserver(
            (entries) => this.handleIntersection(entries),
            {
                root: null,
                rootMargin: '0px',
                threshold: this.config.intersectionThreshold
            }
        );
    },

    /**
     * Setup MutationObserver for dynamic content
     */
    setupMutationObserver() {
        let debounceTimer = null;

        this.state.mutationObserver = new MutationObserver((mutations) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.handleMutations(mutations);
            }, this.config.debounceMs);
        });

        this.state.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'aria-hidden']
        });
    },

    /**
     * Handle intersection changes
     */
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio >= this.config.intersectionThreshold) {
                const form = entry.target;
                if (this.isFormElement(form) && !this.state.observedElements.has(form)) {
                    this.state.observedElements.add(form);
                    this.triggerFormDetected(form, 'viewport');
                }
            }
        });
    },

    /**
     * Handle DOM mutations
     */
    handleMutations(mutations) {
        const relevantMutations = mutations.filter(m =>
            m.addedNodes.length > 0 ||
            (m.type === 'attributes' && m.attributeName === 'class')
        );

        if (relevantMutations.length === 0) return;

        // Check for modal appearances
        this.checkForModals();

        // Scan for new forms
        relevantMutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    this.scanElement(node);
                }
            });
        });
    },

    /**
     * Check for platform-specific modals
     */
    checkForModals() {
        const platformId = this.state.currentPlatform?.id || 'generic';
        const selectors = this.modalSelectors[platformId] || this.modalSelectors.generic;

        for (const selector of selectors) {
            const modal = document.querySelector(selector);
            if (modal && this.isVisible(modal) && !this.state.observedElements.has(modal)) {
                this.state.observedElements.add(modal);
                this.triggerFormDetected(modal, 'modal');
                return;
            }
        }
    },

    /**
     * Scan entire page for forms
     */
    scanForForms() {
        const selectors = this.getAllSelectors();

        selectors.forEach(selector => {
            try {
                document.querySelectorAll(selector).forEach(el => {
                    if (this.isVisible(el) && !this.state.observedElements.has(el)) {
                        this.state.intersectionObserver.observe(el);
                    }
                });
            } catch (e) {
                // Invalid selector, skip
            }
        });

        // Also observe all forms
        document.querySelectorAll('form').forEach(form => {
            if (!this.state.observedElements.has(form)) {
                this.state.intersectionObserver.observe(form);
            }
        });
    },

    /**
     * Scan a specific element for forms
     */
    scanElement(element) {
        if (!element.querySelectorAll) return;

        // Check if element itself is a form
        if (this.isFormElement(element)) {
            this.state.intersectionObserver.observe(element);
        }

        // Check children
        element.querySelectorAll('form, input, textarea, select').forEach(el => {
            const form = el.closest('form') || el.parentElement;
            if (form && !this.state.observedElements.has(form)) {
                this.state.intersectionObserver.observe(form);
            }
        });
    },

    /**
     * Trigger form detected event
     */
    triggerFormDetected(element, source) {
        // Check cooldown
        const now = Date.now();
        if (now - this.state.lastTriggerTime < this.config.redetectCooldown) {
            return;
        }

        // Check dismissal
        if (now < this.state.dismissedUntil) {
            console.log('[JobFiller] Form detected but dismissed by user');
            return;
        }

        // Analyze the form
        const formInfo = this.analyzeForm(element);

        if (formInfo.fieldCount === 0) {
            return; // No fields, not interesting
        }

        this.state.lastTriggerTime = now;
        this.state.detectedForms.push({
            element,
            info: formInfo,
            source,
            timestamp: now
        });

        console.log(`[JobFiller] Form detected via ${source}:`, formInfo);

        // Trigger callback
        this.onFormDetected({
            element,
            source,
            ...formInfo
        });
    },

    /**
     * Analyze a form's contents
     */
    analyzeForm(element) {
        const container = element.closest('form') || element;
        const fields = container.querySelectorAll(
            'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), ' +
            'textarea, select'
        );

        const visibleFields = Array.from(fields).filter(f => this.isVisible(f));
        const emptyFields = visibleFields.filter(f => !f.value?.trim());
        const requiredFields = visibleFields.filter(f => f.required);
        const emptyRequired = requiredFields.filter(f => !f.value?.trim());

        // Categorize fields
        const categories = {
            personal: 0,
            experience: 0,
            education: 0,
            questions: 0,
            other: 0
        };

        visibleFields.forEach(field => {
            const category = this.categorizeField(field);
            categories[category]++;
        });

        return {
            fieldCount: visibleFields.length,
            emptyCount: emptyFields.length,
            requiredCount: requiredFields.length,
            emptyRequiredCount: emptyRequired.length,
            categories,
            fillableCount: emptyFields.length,
            isReady: emptyRequired.length === 0
        };
    },

    /**
     * Categorize a field
     */
    categorizeField(field) {
        const name = (field.name || field.id || '').toLowerCase();
        const label = this.getFieldLabel(field).toLowerCase();
        const combined = name + ' ' + label;

        if (/name|email|phone|address|city|state|zip|country/.test(combined)) {
            return 'personal';
        }
        if (/experience|company|job|title|position|employer|work/.test(combined)) {
            return 'experience';
        }
        if (/education|school|university|degree|major|gpa/.test(combined)) {
            return 'education';
        }
        if (/question|why|how|what|describe|tell|explain|cover/.test(combined)) {
            return 'questions';
        }
        return 'other';
    },

    /**
     * Get field label
     */
    getFieldLabel(element) {
        if (element.id) {
            const label = document.querySelector(`label[for="${element.id}"]`);
            if (label) return label.textContent.trim();
        }
        const parent = element.closest('label');
        if (parent) return parent.textContent.trim();
        return element.placeholder || element.getAttribute('aria-label') || '';
    },

    /**
     * Check if element is a form or contains form fields
     */
    isFormElement(element) {
        if (element.tagName === 'FORM') return true;
        if (element.querySelector) {
            const hasFields = element.querySelector('input:not([type="hidden"]), textarea, select');
            return !!hasFields;
        }
        return false;
    },

    /**
     * Check if element is visible
     */
    isVisible(element) {
        if (!element) return false;
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        return style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0' &&
            rect.width > 0 &&
            rect.height > 0;
    },

    /**
     * Get all modal selectors
     */
    getAllSelectors() {
        return [
            ...this.modalSelectors.linkedin,
            ...this.modalSelectors.workday,
            ...this.modalSelectors.greenhouse,
            ...this.modalSelectors.lever,
            ...this.modalSelectors.indeed,
            ...this.modalSelectors.generic
        ];
    },

    /**
     * Dismiss notifications for a period
     */
    dismiss(duration = null) {
        const dismissDuration = duration || this.config.dismissalDuration;
        this.state.dismissedUntil = Date.now() + dismissDuration;
        this.saveDismissalState();
        console.log(`[JobFiller] Dismissed for ${dismissDuration / 1000}s`);
    },

    /**
     * Load dismissal state from storage
     */
    async loadDismissalState() {
        try {
            const key = `jf_dismissed_${window.location.hostname}`;
            const result = await chrome.storage.session.get(key);
            if (result[key] && result[key] > Date.now()) {
                this.state.dismissedUntil = result[key];
            }
        } catch (e) {
            // Session storage not available
        }
    },

    /**
     * Save dismissal state to storage
     */
    async saveDismissalState() {
        try {
            const key = `jf_dismissed_${window.location.hostname}`;
            await chrome.storage.session.set({ [key]: this.state.dismissedUntil });
        } catch (e) {
            // Session storage not available
        }
    },

    /**
     * Force a scan (can be called externally)
     */
    forceScan() {
        this.state.lastTriggerTime = 0;
        this.state.dismissedUntil = 0;
        this.scanForForms();
        this.checkForModals();
    },

    /**
     * Cleanup observers
     */
    destroy() {
        if (this.state.intersectionObserver) {
            this.state.intersectionObserver.disconnect();
        }
        if (this.state.mutationObserver) {
            this.state.mutationObserver.disconnect();
        }
        this.state.isWatching = false;
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartMonitor;
}

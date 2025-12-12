// Work Authorization Guard - Detects visa/clearance exclusions before applying
// Prevents wasting time on ineligible job applications

const WorkAuthGuard = {
    // Status levels
    STATUS: {
        GREEN: 'green',    // No exclusions found
        YELLOW: 'yellow',  // Ambiguous/preferred requirements
        RED: 'red'         // Blocker - likely ineligible
    },

    // Configuration
    config: {
        debounceMs: 600,
        cacheExpiry: 5 * 60 * 1000, // 5 minutes
        minTextLength: 50
    },

    // State
    state: {
        isEnabled: true,
        currentStatus: null,
        currentMatch: null,
        lastUrl: null,
        lastScanTime: 0,
        cache: new Map(),
        observer: null,
        userOverride: false
    },

    // Blocker patterns (Red) - Definite exclusions
    BLOCKERS: [
        // Green Card / Citizenship requirements
        { pattern: /\b(green\s*card|gc)\s*(holder|only|required)\b/i, reason: 'Green Card required' },
        { pattern: /\bus\s*(citizen|citizenship)\s*(only|required)\b/i, reason: 'US Citizenship required' },
        { pattern: /\b(must\s+be|requires?)\s+.{0,30}\b(us\s+citizen|permanent\s+resident|green\s+card)\b/i, reason: 'US Citizen/PR required' },
        { pattern: /\bno\s+(sponsorship|visa\s+support|h1b)\b/i, reason: 'No visa sponsorship' },
        { pattern: /\bunable\s+to\s+(sponsor|provide)\s+.{0,20}visa\b/i, reason: 'No visa sponsorship' },
        { pattern: /\bwill\s+not\s+sponsor\b/i, reason: 'No sponsorship available' },
        { pattern: /\bauthorized\s+to\s+work\s+.{0,30}without\s+.{0,20}sponsor/i, reason: 'No sponsorship' },

        // Security Clearance requirements
        { pattern: /\b(ts|top\s*secret)\s*[\/\-]?\s*(sci|clearance)\b/i, reason: 'TS/SCI clearance required' },
        { pattern: /\b(active|current|valid)\s+.{0,15}(secret|ts)\s+clearance\b/i, reason: 'Active clearance required' },
        { pattern: /\bdoe\s*[\/\-]?\s*dod\s+clearance\b/i, reason: 'DOE/DOD clearance required' },
        { pattern: /\bpublic\s+trust\s+(clearance|position)\b/i, reason: 'Public Trust clearance required' },
        { pattern: /\bclearance\s+(required|is\s+required|must\s+have)\b/i, reason: 'Security clearance required' },
        { pattern: /\bmust\s+(hold|have|possess)\s+.{0,20}clearance\b/i, reason: 'Clearance required' },
        { pattern: /\bsci\s+(eligible|access|clearance)\b/i, reason: 'SCI access required' }
    ],

    // Warning patterns (Yellow) - Possible concerns
    WARNINGS: [
        { pattern: /\b(citizen|citizenship)\s*(preferred|desired|plus)\b/i, reason: 'Citizenship preferred' },
        { pattern: /\b(preferred|ideal).{0,30}(citizen|permanent\s+resident)\b/i, reason: 'Citizen preferred' },
        { pattern: /\beligible\s+(for|to\s+obtain)\s+(security\s+)?clearance\b/i, reason: 'Clearance eligibility needed' },
        { pattern: /\bmay\s+require\s+.{0,20}clearance\b/i, reason: 'May require clearance' },
        { pattern: /\bability\s+to\s+obtain\s+.{0,20}clearance\b/i, reason: 'May need clearance' },
        { pattern: /\bbackground\s+(check|investigation)\s+required\b/i, reason: 'Background check required' },
        { pattern: /\be-?verify\s+.{0,15}required\b/i, reason: 'E-Verify required' },
        { pattern: /\bgovern(ment|mental)\s+contract/i, reason: 'Government contract work' }
    ],

    // User settings (loaded from storage)
    settings: {
        enabled: true,
        customBlockers: [],
        customAllowlist: [],
        perSiteSettings: {},
        userWorkAuth: null // User's own work authorization status
    },

    /**
     * Initialize the guard
     */
    async init() {
        await this.loadSettings();

        if (!this.settings.enabled) {
            console.log('[JobFiller] Work Auth Guard disabled in settings');
            return;
        }

        this.setupObserver();
        this.performInitialScan();

        console.log('[JobFiller] Work Auth Guard initialized');
    },

    /**
     * Load settings from storage
     */
    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(['workAuthSettings', 'userProfile']);
            if (result.workAuthSettings) {
                this.settings = { ...this.settings, ...result.workAuthSettings };
            }
            // Get user's work auth from profile
            if (result.userProfile?.preferences?.workAuthorization !== undefined) {
                this.settings.userWorkAuth = result.userProfile.preferences.workAuthorization;
            }
        } catch (error) {
            console.error('[JobFiller] Error loading work auth settings:', error);
        }

        this.state.isEnabled = this.settings.enabled !== false;
    },

    /**
     * Save settings to storage
     */
    async saveSettings() {
        try {
            await chrome.storage.local.set({ workAuthSettings: this.settings });
        } catch (error) {
            console.error('[JobFiller] Error saving work auth settings:', error);
        }
    },

    /**
     * Setup MutationObserver for dynamic content
     */
    setupObserver() {
        let debounceTimer = null;

        this.state.observer = new MutationObserver((mutations) => {
            // Check if significant content was added
            const significantChange = mutations.some(m =>
                m.addedNodes.length > 0 &&
                Array.from(m.addedNodes).some(n =>
                    n.nodeType === 1 &&
                    (n.textContent?.length > this.config.minTextLength)
                )
            );

            if (significantChange) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.scan();
                }, this.config.debounceMs);
            }
        });

        this.state.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    },

    /**
     * Perform initial scan
     */
    performInitialScan() {
        // Wait for page to settle, then scan
        setTimeout(() => this.scan(), 500);
    },

    /**
     * Scan the page for work authorization requirements
     */
    scan() {
        if (!this.state.isEnabled) return null;

        const url = window.location.href;
        const now = Date.now();

        // Check cache
        if (this.state.cache.has(url)) {
            const cached = this.state.cache.get(url);
            if (now - cached.timestamp < this.config.cacheExpiry) {
                return cached.result;
            }
        }

        // Perform scan
        const text = this.extractText();
        const result = this.analyzeText(text);

        // Cache result
        this.state.cache.set(url, {
            result,
            timestamp: now
        });

        // Update state
        this.state.currentStatus = result.status;
        this.state.currentMatch = result.match;
        this.state.lastUrl = url;
        this.state.lastScanTime = now;

        // Notify listeners
        this.notifyStatusChange(result);

        return result;
    },

    /**
     * Extract relevant text from the page
     */
    extractText() {
        const sources = [];

        // Job description content
        const jdSelectors = [
            '.job-description', '.description', '#job-description',
            '[data-automation-id="jobDescriptionContent"]',
            '.jobs-description', '.job-details', '.posting-content',
            '.job-posting', '.vacancy-description', 'article',
            '[role="main"]'
        ];

        jdSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                if (el.textContent?.length > 100) {
                    sources.push(el.textContent);
                }
            });
        });

        // Form questions (if on application page)
        document.querySelectorAll('label, legend, .question-text, .field-label').forEach(el => {
            sources.push(el.textContent);
        });

        // Headers
        document.querySelectorAll('h1, h2, h3, h4').forEach(el => {
            sources.push(el.textContent);
        });

        // Requirements sections
        document.querySelectorAll('[class*="requirement"], [class*="qualification"]').forEach(el => {
            sources.push(el.textContent);
        });

        return sources.join(' ').toLowerCase();
    },

    /**
     * Analyze text for work authorization patterns
     */
    analyzeText(text) {
        // Check user's custom allowlist first
        for (const pattern of this.settings.customAllowlist) {
            try {
                if (new RegExp(pattern, 'i').test(text)) {
                    return {
                        status: this.STATUS.GREEN,
                        match: null,
                        reason: 'Matched custom allowlist'
                    };
                }
            } catch (e) { /* invalid regex */ }
        }

        // Check user's custom blockers
        for (const pattern of this.settings.customBlockers) {
            try {
                if (new RegExp(pattern, 'i').test(text)) {
                    return {
                        status: this.STATUS.RED,
                        match: pattern,
                        reason: 'Matched custom blocker'
                    };
                }
            } catch (e) { /* invalid regex */ }
        }

        // Check blocker patterns
        for (const blocker of this.BLOCKERS) {
            if (blocker.pattern.test(text)) {
                // If user has work auth, they might still be eligible
                if (this.settings.userWorkAuth === true) {
                    // User is authorized, but still warn
                    return {
                        status: this.STATUS.YELLOW,
                        match: text.match(blocker.pattern)?.[0],
                        reason: blocker.reason + ' (you may be eligible)'
                    };
                }
                return {
                    status: this.STATUS.RED,
                    match: text.match(blocker.pattern)?.[0],
                    reason: blocker.reason
                };
            }
        }

        // Check warning patterns
        for (const warning of this.WARNINGS) {
            if (warning.pattern.test(text)) {
                return {
                    status: this.STATUS.YELLOW,
                    match: text.match(warning.pattern)?.[0],
                    reason: warning.reason
                };
            }
        }

        // No issues found
        return {
            status: this.STATUS.GREEN,
            match: null,
            reason: 'No work authorization requirements detected'
        };
    },

    /**
     * Notify listeners of status change
     */
    notifyStatusChange(result) {
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('workAuthStatusChange', {
            detail: result
        }));

        // Log for debugging
        console.log(`[JobFiller] Work Auth Status: ${result.status}`, result.reason);
    },

    /**
     * Get current status
     */
    getStatus() {
        if (!this.state.isEnabled) {
            return {
                status: this.STATUS.GREEN,
                match: null,
                reason: 'Guard disabled'
            };
        }

        if (this.state.currentStatus) {
            return {
                status: this.state.currentStatus,
                match: this.state.currentMatch,
                reason: this.state.currentMatch?.reason || 'Previous scan result'
            };
        }

        // No cached result, perform scan
        return this.scan();
    },

    /**
     * Check if Quick Fill should be blocked
     */
    shouldBlockFill() {
        if (!this.state.isEnabled) return false;
        if (this.state.userOverride) return false;

        return this.state.currentStatus === this.STATUS.RED;
    },

    /**
     * User overrides the block for this page
     */
    override() {
        this.state.userOverride = true;
        console.log('[JobFiller] User overrode work auth block');
    },

    /**
     * Add job to skipped history
     */
    async logSkippedJob(reason) {
        try {
            const result = await chrome.storage.local.get('skippedJobs');
            const skipped = result.skippedJobs || [];

            skipped.unshift({
                url: window.location.href,
                title: document.title,
                reason,
                timestamp: Date.now()
            });

            // Keep last 100
            if (skipped.length > 100) skipped.splice(100);

            await chrome.storage.local.set({ skippedJobs: skipped });
        } catch (error) {
            console.error('[JobFiller] Error logging skipped job:', error);
        }
    },

    /**
     * Report false positive
     */
    async reportFalsePositive(matchedText) {
        try {
            const result = await chrome.storage.local.get('falsePositives');
            const reports = result.falsePositives || [];

            reports.push({
                url: window.location.href,
                matchedText,
                timestamp: Date.now()
            });

            await chrome.storage.local.set({ falsePositives: reports });

            // Could also send to analytics/feedback system
            console.log('[JobFiller] False positive reported:', matchedText);
        } catch (error) {
            console.error('[JobFiller] Error reporting false positive:', error);
        }
    },

    /**
     * Add custom blocker pattern
     */
    async addBlocker(pattern) {
        this.settings.customBlockers.push(pattern);
        await this.saveSettings();
        this.clearCache();
        this.scan();
    },

    /**
     * Add custom allowlist pattern
     */
    async addAllowlist(pattern) {
        this.settings.customAllowlist.push(pattern);
        await this.saveSettings();
        this.clearCache();
        this.scan();
    },

    /**
     * Toggle guard on/off
     */
    async toggle(enabled) {
        this.settings.enabled = enabled;
        this.state.isEnabled = enabled;
        await this.saveSettings();

        if (enabled) {
            this.scan();
        } else {
            this.state.currentStatus = null;
            this.state.currentMatch = null;
        }
    },

    /**
     * Clear cache
     */
    clearCache() {
        this.state.cache.clear();
    },

    /**
     * Cleanup
     */
    destroy() {
        if (this.state.observer) {
            this.state.observer.disconnect();
        }
        this.clearCache();
    },

    /**
     * Get status badge HTML
     */
    getBadgeHTML() {
        const status = this.getStatus();

        const badges = {
            [this.STATUS.GREEN]: { emoji: '✓', text: 'Eligible', class: 'guard-green' },
            [this.STATUS.YELLOW]: { emoji: '⚠', text: 'Check', class: 'guard-yellow' },
            [this.STATUS.RED]: { emoji: '⛔', text: 'Blocked', class: 'guard-red' }
        };

        const badge = badges[status.status] || badges[this.STATUS.GREEN];

        return `
            <span class="work-auth-badge ${badge.class}" title="${status.reason || ''}">
                <span class="badge-emoji">${badge.emoji}</span>
                <span class="badge-text">${badge.text}</span>
            </span>
        `;
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WorkAuthGuard;
}

/**
 * AdapterRegistry - Factory for platform adapters
 * 
 * Automatically detects current platform and returns appropriate adapter.
 */
const AdapterRegistry = {
    adapters: {},
    currentAdapter: null,

    /**
     * Register an adapter class for a platform
     * @param {string} platformId 
     * @param {Function} AdapterClass 
     */
    register(platformId, AdapterClass) {
        this.adapters[platformId] = AdapterClass;
        console.log(`[AdapterRegistry] Registered adapter: ${platformId}`);
    },

    /**
     * Detect platform from current URL
     * @returns {string} Platform ID
     */
    detectPlatform() {
        const url = window.location.href;
        const hostname = window.location.hostname;

        // Order by specificity (most specific first)

        // Workday variants
        if (hostname.includes('myworkdayjobs.com') ||
            hostname.includes('workday.com') ||
            hostname.includes('wd1.') ||
            hostname.includes('wd5.')) {
            return 'workday';
        }

        // Greenhouse
        if (hostname.includes('greenhouse.io') ||
            url.includes('boards.greenhouse') ||
            hostname.includes('job-boards.greenhouse.io')) {
            return 'greenhouse';
        }

        // Lever
        if (hostname.includes('lever.co') ||
            url.includes('jobs.lever.co')) {
            return 'lever';
        }

        // LinkedIn
        if (hostname.includes('linkedin.com')) {
            return 'linkedin';
        }

        // Indeed
        if (hostname.includes('indeed.com')) {
            return 'indeed';
        }

        // SmartRecruiters
        if (hostname.includes('smartrecruiters.com')) {
            return 'smartrecruiters';
        }

        // iCIMS
        if (hostname.includes('icims.com')) {
            return 'icims';
        }

        // AshbyHQ
        if (hostname.includes('ashbyhq.com')) {
            return 'ashby';
        }

        // BambooHR
        if (hostname.includes('bamboohr.com')) {
            return 'bamboohr';
        }

        // Jobvite
        if (hostname.includes('jobvite.com')) {
            return 'jobvite';
        }

        // Taleo
        if (hostname.includes('taleo.net')) {
            return 'taleo';
        }

        return 'generic';
    },

    /**
     * Get adapter for current page
     * @returns {PlatformAdapter}
     */
    getAdapter() {
        const platformId = this.detectPlatform();

        // Return cached adapter if same platform
        if (this.currentAdapter && this.currentAdapter.platformId === platformId) {
            return this.currentAdapter;
        }

        // Get adapter class
        const AdapterClass = this.adapters[platformId] || this.adapters.generic;

        if (!AdapterClass) {
            console.error(`[AdapterRegistry] No adapter for platform: ${platformId}`);
            return null;
        }

        // Create new adapter instance
        this.currentAdapter = new AdapterClass();
        console.log(`[AdapterRegistry] Using ${this.currentAdapter.platformName} adapter`);

        return this.currentAdapter;
    },

    /**
     * Get adapter by specific platform ID
     * @param {string} platformId 
     * @returns {PlatformAdapter}
     */
    getAdapterById(platformId) {
        const AdapterClass = this.adapters[platformId];
        if (!AdapterClass) {
            console.error(`[AdapterRegistry] Unknown platform: ${platformId}`);
            return null;
        }
        return new AdapterClass();
    },

    /**
     * List registered adapters
     */
    listAdapters() {
        return Object.keys(this.adapters);
    },

    /**
     * Check if platform has a dedicated adapter
     */
    hasDedicatedAdapter() {
        const platformId = this.detectPlatform();
        return platformId !== 'generic' && this.adapters[platformId] !== undefined;
    }
};

// Export for content scripts
if (typeof window !== 'undefined') {
    window.AdapterRegistry = AdapterRegistry;
}

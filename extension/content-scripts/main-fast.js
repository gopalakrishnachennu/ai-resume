// Fast Main Script - Shows FAB immediately without waiting for full initialization
// This script loads at document_end for INSTANT FAB visibility

(function () {
    // Prevent double initialization
    if (window.__jobfiller_fast_init__) return;
    window.__jobfiller_fast_init__ = true;

    // Quick check if we should show FAB
    function shouldShowFAB() {
        const url = window.location.href.toLowerCase();

        // Skip completely irrelevant pages
        if (url.includes('google.com/search') ||
            url.includes('facebook.com') ||
            url.includes('twitter.com') ||
            url.includes('youtube.com') ||
            url.includes('instagram.com') ||
            url.startsWith('chrome://') ||
            url.startsWith('chrome-extension://') ||
            url.startsWith('about:')) {
            return false;
        }

        // Show on known job sites immediately
        const jobSites = [
            'linkedin.com', 'indeed.com', 'glassdoor.com',
            'workday', 'greenhouse.io', 'lever.co',
            'smartrecruiters', 'icims.com', 'taleo',
            'jobvite', 'ashby', 'bamboohr', 'workable',
            'career', 'job', 'apply', 'hiring'
        ];

        for (const site of jobSites) {
            if (url.includes(site)) return true;
        }

        // Check page content for job-related keywords
        const title = document.title?.toLowerCase() || '';
        const jobKeywords = ['job', 'career', 'apply', 'application', 'hiring', 'position', 'opportunity'];
        for (const kw of jobKeywords) {
            if (title.includes(kw)) return true;
        }

        // Default: show on any page with forms
        return document.querySelector('form, input, textarea') !== null;
    }

    // Show FAB as fast as possible
    async function showFABFast() {
        // Check if hidden by user
        try {
            const result = await chrome.storage?.local?.get?.('fabHidden');
            if (result?.fabHidden) return;
        } catch (e) { }

        if (!shouldShowFAB()) return;

        // Wait for DOM to be ready
        if (document.body) {
            initFAB();
        } else {
            document.addEventListener('DOMContentLoaded', initFAB);
        }
    }

    function initFAB() {
        // Check if FloatingButton class exists
        if (typeof FloatingButton === 'undefined') {
            console.log('JobFiller: FloatingButton not ready, waiting...');
            return;
        }

        // Check if already initialized
        if (document.getElementById('jf-fab-root')) return;

        try {
            // Detect platform quickly
            const platform = typeof PlatformDetector !== 'undefined'
                ? PlatformDetector.detect()
                : null;

            // Create and show FAB immediately
            const fab = new FloatingButton();
            fab.init(platform);

            // Store reference globally
            window.__jobfiller_fab__ = fab;

            console.log('JobFiller: FAB ready! ⚡');
        } catch (e) {
            console.error('JobFiller FAB init error:', e);
        }
    }

    // Run immediately
    showFABFast();
})();

// UNIFIED Main - Shows FAB instantly, lazy-loads smart features
// Fast first, smart later

(function () {
    'use strict';

    console.log('[JobFiller] Script starting...');

    // Prevent double init
    if (window.__jf_init__) {
        console.log('[JobFiller] Already initialized, skipping');
        return;
    }
    window.__jf_init__ = true;

    // Skip only browser internal pages
    const url = window.location.href;
    if (url.startsWith('chrome://') ||
        url.startsWith('chrome-extension://') ||
        url.startsWith('about:') ||
        url.startsWith('edge://') ||
        url.startsWith('moz-extension://')) {
        console.log('[JobFiller] Skipping browser internal page');
        return;
    }

    console.log('[JobFiller] Running on:', url);

    // Show FAB immediately - no complex filtering
    async function showFAB() {
        console.log('[JobFiller] showFAB called');

        // Check user preference
        try {
            const result = await chrome.storage.local.get('fabHidden');
            if (result.fabHidden) {
                console.log('[JobFiller] FAB hidden by user preference');
                return;
            }
        } catch (e) {
            console.log('[JobFiller] Storage check error:', e);
        }

        // Check if already exists
        if (document.getElementById('jf-fab-shell')) {
            console.log('[JobFiller] FAB already exists');
            return;
        }

        // Check if FloatingButton class loaded
        if (typeof FloatingButton === 'undefined') {
            console.error('[JobFiller] FloatingButton class not found!');
            return;
        }

        try {
            console.log('[JobFiller] Creating FloatingButton...');

            const platform = typeof PlatformDetector !== 'undefined'
                ? PlatformDetector.detect()
                : null;

            const fab = new FloatingButton();
            await fab.init(platform);
            window.__jf_fab__ = fab;

            console.log('[JobFiller] FAB ready!');

            // After FAB is shown, lazy-load smart features
            setTimeout(lazyLoadSmartFeatures, 1000);
        } catch (e) {
            console.error('[JobFiller] Init error:', e);
        }
    }

    // Lazy-load smart features in background (only safe ones)
    function lazyLoadSmartFeatures() {
        const smartScripts = [
            'content-scripts/page-analyzer.js',
            'content-scripts/jd-matcher.js',
            'content-scripts/answer-assistant.js',
            'content-scripts/validation-engine.js',
            'content-scripts/ats-handlers.js',
            'content-scripts/step-tracker.js',
            'content-scripts/fill-tracker.js'
            // Note: smart-monitor, prediction-engine, work-auth-guard, ai-answer-engine
            // require the old main.js structure - skipped to avoid errors
        ];

        smartScripts.forEach((script, i) => {
            setTimeout(() => {
                chrome.runtime.sendMessage({
                    type: 'INJECT_SCRIPT',
                    script: script
                }).catch(() => { });
            }, i * 200);
        });

        console.log('[JobFiller] Smart features loading...');
    }

    // Message handler for popup
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        handleMessage(msg).then(sendResponse);
        return true;
    });

    async function handleMessage(msg) {
        const fab = window.__jf_fab__;

        switch (msg.type) {
            case 'GET_STATUS':
                return { success: true, initialized: true };

            case 'quick_fill':
            case 'QUICK_FILL':
                if (!fab) return { success: false, error: 'FAB not ready' };
                await fab.quickFill();
                return { success: true, filled: { totalFilled: fab.filler?.filledFields?.length || 0 } };

            case 'detect_form':
            case 'DETECT_FORM':
                if (!fab) return { success: false, error: 'FAB not ready' };
                await fab.detectFields();
                return { success: true, fields: fab.detectedFields, summary: fab.detector?.getSummary?.() };

            case 'fill_form':
            case 'FILL_FORM':
                if (!fab) return { success: false, error: 'FAB not ready' };
                await fab.quickFill();
                return { success: true, filledCount: fab.filler?.filledFields?.length || 0 };

            case 'SHOW_FAB':
                if (fab) {
                    fab.container.style.display = 'block';
                    chrome.storage.local.set({ fabHidden: false });
                }
                return { success: true };

            default:
                return { success: false, error: 'Unknown message' };
        }
    }

    // Run ASAP
    if (document.body) {
        showFAB();
    } else {
        document.addEventListener('DOMContentLoaded', showFAB);
    }
})();

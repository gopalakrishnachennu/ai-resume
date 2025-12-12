// Background Service Worker
// Handles background tasks, notifications, and extension lifecycle

console.log('[JobFiller Pro] Background service worker loaded');

// Job sites for detection
const JOB_SITE_PATTERNS = [
    'linkedin.com/jobs',
    'linkedin.com/in/',
    'indeed.com',
    'glassdoor.com',
    'myworkdayjobs.com',
    'greenhouse.io',
    'lever.co',
    'smartrecruiters.com',
    'icims.com',
    'taleo.net',
    'brassring.com',
    'jobvite.com',
    'ashbyhq.com',
    'bamboohr.com',
    'workable.com',
    'recruitee.com',
    'wellfound.com',
    'angel.co',
    'ziprecruiter.com',
    'monster.com',
    'careerbuilder.com',
    'dice.com',
    'simplyhired.com'
];

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
    console.log('[JobFiller Pro] Extension installed:', details.reason);

    if (details.reason === 'install') {
        // Set default settings
        chrome.storage.local.set({
            settings: {
                autoFill: false,
                showFloatingButton: true,
                apiEndpoint: '',
                apiKey: ''
            },
            stats: {
                fieldsFilled: 0,
                applicationsCompleted: 0,
                timeSaved: 0
            }
        });

        // Open welcome/options page
        chrome.tabs.create({
            url: 'options/options.html'
        });

        console.log('[JobFiller Pro] First-time setup complete');
    } else if (details.reason === 'update') {
        console.log('[JobFiller Pro] Extension updated to version:', chrome.runtime.getManifest().version);
    }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[JobFiller Pro] Background received message:', message.type);

    switch (message.type) {
        case 'API_CALL':
            handleApiCall(message, sendResponse);
            return true;

        case 'GET_PROFILE':
            getProfile(sendResponse);
            return true;

        case 'SAVE_PROFILE':
            saveProfile(message.data, sendResponse);
            return true;

        case 'GET_STATS':
            getStats(sendResponse);
            return true;

        case 'UPDATE_STATS':
            updateStats(message.data, sendResponse);
            return true;

        case 'INJECT_SCRIPT':
            // Lazy-load smart features
            injectScript(sender.tab?.id, message.script, sendResponse);
            return true;

        default:
            sendResponse({ success: false, error: 'Unknown message type' });
    }
});

/**
 * Inject a script into a tab (for lazy-loading)
 */
async function injectScript(tabId, script, sendResponse) {
    if (!tabId || !script) {
        sendResponse?.({ success: false, error: 'Missing tabId or script' });
        return;
    }

    try {
        await chrome.scripting.executeScript({
            target: { tabId },
            files: [script]
        });
        sendResponse?.({ success: true });
    } catch (error) {
        console.log('[JobFiller Pro] Script already loaded or error:', script);
        sendResponse?.({ success: false, error: error.message });
    }
}

/**
 * Handle API calls (to avoid CORS issues)
 */
async function handleApiCall(message, sendResponse) {
    try {
        const { endpoint, method = 'GET', data, headers = {} } = message;

        const response = await fetch(endpoint, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: data ? JSON.stringify(data) : undefined
        });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.statusText}`);
        }

        const result = await response.json();
        sendResponse({ success: true, data: result });
    } catch (error) {
        console.error('[JobFiller Pro] API call error:', error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Get user profile
 */
async function getProfile(sendResponse) {
    try {
        const result = await chrome.storage.local.get('userProfile');
        sendResponse({ success: true, profile: result.userProfile });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Save user profile
 */
async function saveProfile(profile, sendResponse) {
    try {
        await chrome.storage.local.set({ userProfile: profile });
        sendResponse({ success: true });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Get statistics
 */
async function getStats(sendResponse) {
    try {
        const result = await chrome.storage.local.get('stats');
        sendResponse({ success: true, stats: result.stats || {} });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Update statistics
 */
async function updateStats(data, sendResponse) {
    try {
        const result = await chrome.storage.local.get('stats');
        const stats = result.stats || { fieldsFilled: 0, applicationsCompleted: 0, timeSaved: 0 };

        if (data.fieldsFilled) {
            stats.fieldsFilled += data.fieldsFilled;
        }
        if (data.applicationCompleted) {
            stats.applicationsCompleted += 1;
        }

        await chrome.storage.local.set({ stats });
        sendResponse({ success: true, stats });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

// Listen for tab updates (for badge updates)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        const isJobSite = JOB_SITE_PATTERNS.some(pattern => tab.url.includes(pattern));

        if (isJobSite) {
            // Set badge to indicate we're on a job site
            chrome.action.setBadgeText({ tabId, text: '✓' });
            chrome.action.setBadgeBackgroundColor({ tabId, color: '#10b981' });
            console.log('[JobFiller Pro] Job site detected:', tab.url);
        } else {
            chrome.action.setBadgeText({ tabId, text: '' });
        }
    }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    console.log('[JobFiller Pro] Extension icon clicked on tab:', tab.id);
});

// Keep service worker alive
setInterval(() => {
    console.log('[JobFiller Pro] Service worker heartbeat');
}, 20000);

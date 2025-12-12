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

/**
 * EXTERNAL MESSAGE HANDLER
 * Receives messages from the web app (AI Resume Builder)
 * This is the forceful corporate-style connection
 */
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    console.log('[JobFiller Pro] External message from:', sender.origin, message.type);

    switch (message.type) {
        // Web app pushes session with all user data
        case 'FLASH_SESSION':
            handleFlashSession(message.data, sender, sendResponse);
            return true;

        // Web app registers user connection
        case 'CONNECT_USER':
            handleConnectUser(message.data, sendResponse);
            return true;

        // Web app syncs user profile (replaces sample data!)
        case 'SYNC_PROFILE':
            handleSyncProfile(message.data, sendResponse);
            return true;

        // Web app checks if extension is installed
        case 'PING':
            sendResponse({
                success: true,
                version: chrome.runtime.getManifest().version,
                name: 'JobFiller Pro'
            });
            return true;

        default:
            sendResponse({ success: false, error: 'Unknown external message type' });
    }
});

/**
 * Sync user profile from web app
 * This replaces any sample data with the real user's profile
 */
async function handleSyncProfile(profileData, sendResponse) {
    try {
        console.log('[JobFiller Pro] Syncing user profile from web app:', profileData?.email);

        if (profileData) {
            // Store as userProfile (overwrites sample data)
            await chrome.storage.local.set({
                userProfile: profileData,
                profileSyncedAt: Date.now(),
                profileSource: 'web_app'
            });
            console.log('[JobFiller Pro] Profile synced successfully!');

            // Notify all tabs to refresh
            const tabs = await chrome.tabs.query({});
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    type: 'PROFILE_SYNCED',
                    data: profileData
                }).catch(() => { });
            });

            sendResponse({ success: true, message: 'Profile synced' });
        } else {
            sendResponse({ success: false, error: 'No profile data provided' });
        }
    } catch (error) {
        console.error('[JobFiller Pro] Profile sync error:', error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Handle Flash Session from web app
 * Web app pushes complete session data for immediate use
 */
async function handleFlashSession(sessionData, sender, sendResponse) {
    try {
        console.log('[JobFiller Pro] Flash session received:', sessionData);

        // Store userId for future Firebase reads
        if (sessionData.userId) {
            await chrome.storage.local.set({ firebaseUserId: sessionData.userId });
        }

        // Store projectId
        if (sessionData.projectId) {
            await chrome.storage.local.set({ firebaseProjectId: sessionData.projectId });
        }

        // Store the complete session data locally for immediate use
        // This bypasses Firebase read and uses pushed data directly
        if (sessionData.session) {
            await chrome.storage.local.set({
                flashSession: sessionData.session,
                flashSessionTimestamp: Date.now()
            });
            console.log('[JobFiller Pro] Flash session stored locally');
        }

        // Notify all tabs about the new session
        const tabs = await chrome.tabs.query({});
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                type: 'FLASH_SESSION_READY',
                data: sessionData.session
            }).catch(() => { }); // Ignore tabs without content script
        });

        sendResponse({ success: true, message: 'Session synced' });
    } catch (error) {
        console.error('[JobFiller Pro] Flash session error:', error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Handle user connection from web app
 * Stores credentials for cross-domain Firebase access
 */
async function handleConnectUser(userData, sendResponse) {
    try {
        console.log('[JobFiller Pro] User connection:', userData);

        await chrome.storage.local.set({
            firebaseUserId: userData.userId,
            firebaseProjectId: userData.projectId || 'ai-resume-builder-app',
            userConnectedAt: Date.now()
        });

        sendResponse({ success: true, message: 'User connected' });
    } catch (error) {
        console.error('[JobFiller Pro] Connection error:', error);
        sendResponse({ success: false, error: error.message });
    }
}

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

        // Get flash session that was pushed from web app
        case 'GET_FLASH_SESSION':
            getFlashSession(sendResponse);
            return true;

        default:
            sendResponse({ success: false, error: 'Unknown message type' });
    }
});

/**
 * Get flash session from local storage
 */
async function getFlashSession(sendResponse) {
    try {
        const result = await chrome.storage.local.get(['flashSession', 'flashSessionTimestamp']);

        // Session expires after 1 hour
        const isValid = result.flashSessionTimestamp &&
            (Date.now() - result.flashSessionTimestamp) < 3600000;

        if (isValid && result.flashSession) {
            sendResponse({ success: true, session: result.flashSession });
        } else {
            sendResponse({ success: false, error: 'No active flash session' });
        }
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

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

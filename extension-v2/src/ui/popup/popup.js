/**
 * JobFiller Pro - Popup Script
 * Premium Design with Active Session Data Display
 */

// Dashboard URL - Update this with your production URL
const DASHBOARD_URL = "https://ai-resume-git-feature-9d1c2b-gopalakrishnachennu-5461s-projects.vercel.app";

// DOM Elements
const notConnectedState = document.getElementById('not-connected');
const connectedState = document.getElementById('connected');
const connectBtn = document.getElementById('connect-btn');
const fillBtn = document.getElementById('fill-btn');
const refreshBtn = document.getElementById('refresh-btn');
const settingsBtn = document.getElementById('settings-btn');
const dashboardBtn = document.getElementById('dashboard-btn');
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const userAvatar = document.getElementById('user-avatar');
const avatarLetter = document.getElementById('avatar-letter');
const statFilled = document.getElementById('stat-filled');
const statAccuracy = document.getElementById('stat-accuracy');
const statApps = document.getElementById('stat-apps');

/**
 * Initialize popup
 */
async function init() {
    console.log('[Popup] Initializing...');
    await checkConnection();
    setupEventListeners();
}

/**
 * Check if user is connected and load session data
 */
async function checkConnection() {
    try {
        const result = await chrome.storage.local.get(['auth', 'profile', 'session', 'stats']);
        console.log('[Popup] Storage data:', result);

        if (result.auth && result.auth.uid) {
            showConnectedState(result.auth, result.profile, result.session, result.stats);
        } else if (result.session) {
            // Have session but no auth - show connected with session data
            const auth = {
                displayName: result.session.personalInfo?.name || result.session.displayName || 'User',
                email: result.session.personalInfo?.email || result.session.email || '',
            };
            showConnectedState(auth, result.profile || result.session, result.session, result.stats);
        } else {
            showNotConnectedState();
        }
    } catch (error) {
        console.error('[Popup] Check connection failed:', error);
        showNotConnectedState();
    }
}

/**
 * Show connected state with session data
 */
function showConnectedState(auth, profile, session, stats) {
    notConnectedState.style.display = 'none';
    connectedState.style.display = 'flex';

    // User info from auth or session
    const displayName = auth.displayName || session?.personalInfo?.name || 'User';
    const email = auth.email || session?.personalInfo?.email || '';

    userName.textContent = displayName;
    userEmail.textContent = email;

    // Avatar
    if (auth.photoURL) {
        userAvatar.innerHTML = `<img src="${auth.photoURL}" alt="${displayName}">`;
    } else {
        avatarLetter.textContent = (displayName || email || 'U')[0].toUpperCase();
    }

    // Stats
    if (stats) {
        statFilled.textContent = stats.filledToday || 0;
        statApps.textContent = stats.totalApplications || stats.totalFilled || 0;
    }

    // Log profile data for debugging
    if (profile) {
        console.log('[Popup] Profile loaded:', {
            identity: profile.identity,
            hasAuth: !!profile.authorization,
            hasSalary: !!profile.salary,
            hasExp: !!profile.experience,
        });
    }

    if (session) {
        console.log('[Popup] Session loaded:', {
            hasPersonalInfo: !!session.personalInfo,
            hasSkills: !!session.skills,
            hasExperience: !!session.experience,
        });
    }
}

/**
 * Show not connected state
 */
function showNotConnectedState() {
    notConnectedState.style.display = 'flex';
    connectedState.style.display = 'none';
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Connect button
    connectBtn?.addEventListener('click', () => {
        chrome.tabs.create({ url: DASHBOARD_URL + '/settings/extension' });
    });

    // Fill button
    fillBtn?.addEventListener('click', handleFillForm);

    // Refresh/Sync button
    refreshBtn?.addEventListener('click', () => {
        chrome.tabs.create({ url: DASHBOARD_URL + '/settings/extension' });
    });

    // Settings button
    settingsBtn?.addEventListener('click', () => {
        chrome.tabs.create({ url: DASHBOARD_URL + '/settings/extension' });
    });

    // Dashboard button
    dashboardBtn?.addEventListener('click', () => {
        chrome.tabs.create({ url: DASHBOARD_URL + '/dashboard' });
    });
}

/**
 * Handle form fill with session data
 */
async function handleFillForm() {
    const btnTitle = fillBtn.querySelector('.btn-title');
    const btnIcon = fillBtn.querySelector('.btn-icon');
    const originalTitle = btnTitle.textContent;
    const originalIcon = btnIcon.textContent;

    // Loading state
    fillBtn.classList.add('loading');
    btnTitle.textContent = 'Filling...';
    btnIcon.textContent = '↻';

    try {
        // First check if we have session data
        const storage = await chrome.storage.local.get(['profile', 'session']);
        console.log('[Popup] Fill with data:', storage);

        if (!storage.profile && !storage.session) {
            showMessage('No profile data. Please sync from dashboard first.');
            resetButton();
            return;
        }

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab?.id) {
            showMessage('No active tab found');
            resetButton();
            return;
        }

        chrome.tabs.sendMessage(tab.id, { type: 'FILL_FORM' }, (response) => {
            fillBtn.classList.remove('loading');

            if (chrome.runtime.lastError) {
                btnTitle.textContent = 'Navigate to a job page first';
                btnIcon.textContent = '📋';
                setTimeout(() => {
                    btnTitle.textContent = originalTitle;
                    btnIcon.textContent = originalIcon;
                }, 2000);
                return;
            }

            if (response?.success) {
                // Success state
                fillBtn.classList.add('success');
                btnTitle.textContent = 'Filled ' + (response.filled || 0) + ' Fields';
                btnIcon.textContent = '✓';

                // Update stats
                updateStats(response.filled || 0);

                setTimeout(() => {
                    fillBtn.classList.remove('success');
                    btnTitle.textContent = originalTitle;
                    btnIcon.textContent = originalIcon;
                }, 3000);
            } else {
                // Error
                btnTitle.textContent = response?.error || 'No forms found';
                btnIcon.textContent = '⚠';

                setTimeout(() => {
                    btnTitle.textContent = originalTitle;
                    btnIcon.textContent = originalIcon;
                }, 2500);
            }
        });
    } catch (error) {
        console.error('[Popup] Fill error:', error);
        resetButton();
        showMessage('Unable to fill form');
    }

    function resetButton() {
        fillBtn.classList.remove('loading');
        btnTitle.textContent = originalTitle;
        btnIcon.textContent = originalIcon;
    }
}

/**
 * Update stats in storage and UI
 */
async function updateStats(filled) {
    try {
        const result = await chrome.storage.local.get(['stats']);
        const stats = result.stats || { filledToday: 0, totalApplications: 0, totalFilled: 0 };
        stats.filledToday = (stats.filledToday || 0) + filled;
        stats.totalFilled = (stats.totalFilled || 0) + filled;
        await chrome.storage.local.set({ stats });
        statFilled.textContent = stats.filledToday;
        statApps.textContent = stats.totalFilled;
    } catch (e) {
        console.error('[Popup] Update stats failed:', e);
    }
}

/**
 * Show temporary message (could add toast later)
 */
function showMessage(msg) {
    console.log('[JobFiller] ' + msg);
    // Could add a toast notification here
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);

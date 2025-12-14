/**
 * JobFiller Pro - Popup Script
 * Premium Design with Simplify.jobs inspiration
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
    await checkConnection();
    setupEventListeners();
}

/**
 * Check if user is connected
 */
async function checkConnection() {
    try {
        const result = await chrome.storage.local.get(['auth', 'profile', 'stats']);

        if (result.auth && result.auth.uid) {
            showConnectedState(result.auth, result.stats);
        } else {
            showNotConnectedState();
        }
    } catch (error) {
        console.error('Check connection failed:', error);
        showNotConnectedState();
    }
}

/**
 * Show connected state
 */
function showConnectedState(auth, stats) {
    notConnectedState.style.display = 'none';
    connectedState.style.display = 'flex';

    // User info
    const displayName = auth.displayName || 'User';
    const email = auth.email || '';

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
        statApps.textContent = stats.totalApplications || 12;
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
 * Handle form fill
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
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab?.id) {
            showMessage('No active tab found');
            resetButton();
            return;
        }

        chrome.tabs.sendMessage(tab.id, { type: 'FILL_FORM' }, (response) => {
            fillBtn.classList.remove('loading');

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
                btnTitle.textContent = 'Try Again';
                btnIcon.textContent = '⚠';
                showMessage(response?.error || 'Navigate to a job application page first');

                setTimeout(() => {
                    btnTitle.textContent = originalTitle;
                    btnIcon.textContent = originalIcon;
                }, 2000);
            }
        });
    } catch (error) {
        console.error('Fill error:', error);
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
 * Update stats
 */
async function updateStats(filled) {
    try {
        const result = await chrome.storage.local.get(['stats']);
        const stats = result.stats || { filledToday: 0, totalApplications: 0 };
        stats.filledToday = (stats.filledToday || 0) + filled;
        await chrome.storage.local.set({ stats });
        statFilled.textContent = stats.filledToday;
    } catch (e) {
        console.error('Update stats failed:', e);
    }
}

/**
 * Show temporary message
 */
function showMessage(msg) {
    // For now, just log - could add toast later
    console.log('[JobFiller]', msg);
}

// Initialize
document.addEventListener('DOMContentLoaded', init);

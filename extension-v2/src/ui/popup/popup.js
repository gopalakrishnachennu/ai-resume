/**
 * JobFiller Pro - Popup Script
 * Premium Minimalist Design
 */

// ============================================
// 🔧 DASHBOARD URL - Keep in sync with config.ts
// ============================================
const DASHBOARD_URL = "https://ai-resume-git-feature-9d1c2b-gopalakrishnachennu-5461s-projects.vercel.app";

// DOM Elements
const notConnectedState = document.getElementById('not-connected');
const connectedState = document.getElementById('connected');
const connectBtn = document.getElementById('connect-btn');
const fillBtn = document.getElementById('fill-btn');
const refreshBtn = document.getElementById('refresh-btn');
const settingsBtn = document.getElementById('settings-btn');
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const userAvatar = document.getElementById('user-avatar');
const statFilled = document.getElementById('stat-filled');

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
    userName.textContent = auth.displayName || 'User';
    userEmail.textContent = auth.email || '';

    // Avatar
    if (auth.photoURL) {
        userAvatar.innerHTML = `<img src="${auth.photoURL}" alt="">`;
    } else {
        userAvatar.textContent = (auth.displayName || auth.email || 'U')[0].toUpperCase();
    }

    // Stats
    statFilled.textContent = stats?.filledToday || 0;
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
        chrome.tabs.create({ url: DASHBOARD_URL });
    });

    // Fill button
    fillBtn?.addEventListener('click', async () => {
        fillBtn.classList.add('loading');
        fillBtn.querySelector('.fill-icon').textContent = '↻';

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab?.id) {
                showMessage('No active tab');
                return;
            }

            chrome.tabs.sendMessage(tab.id, { type: 'FILL_FORM' }, (response) => {
                fillBtn.classList.remove('loading');
                fillBtn.querySelector('.fill-icon').textContent = '⚡';

                if (response?.success) {
                    fillBtn.querySelector('.fill-icon').textContent = '✓';
                    updateStats(response.filled || 0);
                    setTimeout(() => {
                        fillBtn.querySelector('.fill-icon').textContent = '⚡';
                    }, 2000);
                } else {
                    showMessage(response?.error || 'Make sure you are on a job application');
                }
            });
        } catch (error) {
            console.error('Fill error:', error);
            fillBtn.classList.remove('loading');
            fillBtn.querySelector('.fill-icon').textContent = '⚡';
        }
    });

    // Refresh button
    refreshBtn?.addEventListener('click', () => {
        chrome.tabs.create({ url: DASHBOARD_URL });
    });

    // Settings button
    settingsBtn?.addEventListener('click', () => {
        // TODO: Settings page
    });
}

/**
 * Update stats
 */
async function updateStats(filled) {
    try {
        const result = await chrome.storage.local.get(['stats']);
        const stats = result.stats || { filledToday: 0 };
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
    alert(msg);
}

// Initialize
document.addEventListener('DOMContentLoaded', init);

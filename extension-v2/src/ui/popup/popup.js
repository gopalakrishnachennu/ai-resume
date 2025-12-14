/**
 * JobFiller Pro - Popup Script with Firebase Direct Sync
 * Reads active session from Firestore directly
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Firebase config - MUST match your webapp
const firebaseConfig = {
    apiKey: "AIzaSyANSk1PwPkMabX6kRGOYnldoeEC8VvtB5Q",
    authDomain: "ai-resume-f9b01.firebaseapp.com",
    projectId: "ai-resume-f9b01",
    storageBucket: "ai-resume-f9b01.firebasestorage.app",
    messagingSenderId: "836466410766",
    appId: "1:836466410766:web:146188f9d00106ea1d835f"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// Dashboard URL
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

// Current session data
let currentSession = null;
let currentUserId = null;

/**
 * Initialize popup
 */
async function init() {
    console.log('[Popup] Initializing with Firebase sync...');

    // First check local storage for userId
    const stored = await chrome.storage.local.get(['auth', 'stats']);

    if (stored.auth?.uid) {
        currentUserId = stored.auth.uid;
        console.log('[Popup] Found userId:', currentUserId);

        // Load session from Firebase
        await loadSessionFromFirebase(currentUserId);
        showConnectedState(stored.auth, currentSession, stored.stats);
    } else {
        console.log('[Popup] No userId in storage - showing not connected');
        showNotConnectedState();
    }

    setupEventListeners();
}

/**
 * Load active session from Firebase
 */
async function loadSessionFromFirebase(userId) {
    try {
        console.log('[Popup] Loading session from Firebase for:', userId);

        // Try to get active session
        const sessionDoc = await getDoc(doc(db, 'users', userId, 'sessions', 'active'));

        if (sessionDoc.exists()) {
            currentSession = sessionDoc.data();
            console.log('[Popup] ✅ Session loaded from Firebase:', {
                jobTitle: currentSession.jobTitle,
                jobCompany: currentSession.jobCompany,
                hasPersonalInfo: !!currentSession.personalInfo,
                hasSkills: !!currentSession.skills,
            });

            // Store session locally for form filling
            await chrome.storage.local.set({
                session: currentSession,
                profile: currentSession // Also store as profile for backward compatibility
            });
        } else {
            console.log('[Popup] No active session in Firebase');

            // Try to load extension settings as fallback
            const settingsDoc = await getDoc(doc(db, 'users', userId, 'settings', 'extension'));
            if (settingsDoc.exists()) {
                const settings = settingsDoc.data();
                console.log('[Popup] Loaded extension settings as fallback');
                await chrome.storage.local.set({ extensionSettings: settings });
            }
        }
    } catch (error) {
        console.error('[Popup] Firebase load failed:', error);
    }
}

/**
 * Show connected state with session data
 */
function showConnectedState(auth, session, stats) {
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
        statApps.textContent = stats.totalFilled || 0;
    }

    // Update button text if we have an active session
    if (session?.jobTitle) {
        const btnSubtitle = fillBtn.querySelector('.btn-subtitle');
        if (btnSubtitle) {
            btnSubtitle.textContent = `${session.jobTitle} @ ${session.jobCompany}`;
        }
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

    // Refresh/Sync button - reload from Firebase
    refreshBtn?.addEventListener('click', async () => {
        if (currentUserId) {
            const btnText = refreshBtn.textContent;
            refreshBtn.textContent = '...';
            await loadSessionFromFirebase(currentUserId);
            refreshBtn.textContent = btnText;

            const stored = await chrome.storage.local.get(['auth', 'stats']);
            showConnectedState(stored.auth, currentSession, stored.stats);
        } else {
            chrome.tabs.create({ url: DASHBOARD_URL + '/settings/extension' });
        }
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
        // Reload session from Firebase to ensure fresh data
        if (currentUserId) {
            await loadSessionFromFirebase(currentUserId);
        }

        // Check if we have session data
        const storage = await chrome.storage.local.get(['profile', 'session']);
        console.log('[Popup] Fill with data:', storage);

        if (!storage.profile && !storage.session) {
            resetButton();
            btnTitle.textContent = 'No session - Flash first!';
            setTimeout(() => { btnTitle.textContent = originalTitle; }, 2000);
            return;
        }

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab?.id) {
            resetButton();
            btnTitle.textContent = 'No active tab';
            setTimeout(() => { btnTitle.textContent = originalTitle; }, 2000);
            return;
        }

        chrome.tabs.sendMessage(tab.id, { type: 'FILL_FORM' }, (response) => {
            fillBtn.classList.remove('loading');

            if (chrome.runtime.lastError) {
                btnTitle.textContent = 'Navigate to job page first';
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
                btnTitle.textContent = 'Filled ' + (response.filled || 0) + ' Fields!';
                btnIcon.textContent = '✓';

                // Update stats
                updateStats(response.filled || 0);

                setTimeout(() => {
                    fillBtn.classList.remove('success');
                    btnTitle.textContent = originalTitle;
                    btnIcon.textContent = originalIcon;
                }, 3000);
            } else {
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
        const stats = result.stats || { filledToday: 0, totalFilled: 0 };
        stats.filledToday = (stats.filledToday || 0) + filled;
        stats.totalFilled = (stats.totalFilled || 0) + filled;
        await chrome.storage.local.set({ stats });
        statFilled.textContent = stats.filledToday;
        statApps.textContent = stats.totalFilled;
    } catch (e) {
        console.error('[Popup] Update stats failed:', e);
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);

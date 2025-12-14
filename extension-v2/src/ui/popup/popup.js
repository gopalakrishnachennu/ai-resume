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
        console.log('[Popup] Loading data from Firebase for:', userId);

        // 1. Load Active Session
        const sessionDoc = await getDoc(doc(db, 'activeSession', userId));

        if (sessionDoc.exists()) {
            currentSession = sessionDoc.data();
            console.log('[Popup] ✅ Sess loaded:', currentSession.jobCompany);

            // Transform Session to Matcher Profile Structure
            // Matcher expects nested 'identity', 'role', etc. matching canonical.ts
            const profile = {
                identity: {
                    firstName: currentSession.personalInfo?.firstName || '',
                    lastName: currentSession.personalInfo?.lastName || '',
                    fullName: currentSession.personalInfo?.fullName || '',
                    email: currentSession.personalInfo?.email || '',
                    phone: currentSession.personalInfo?.phone || '',
                    location: {
                        address: currentSession.personalInfo?.location || '',
                        city: currentSession.personalInfo?.city || '',
                        state: currentSession.personalInfo?.state || '',
                        country: currentSession.personalInfo?.country || '',
                        zip: ''
                    },
                    linkedin: currentSession.personalInfo?.linkedin || '',
                    github: currentSession.personalInfo?.github || '',
                    portfolio: currentSession.personalInfo?.portfolio || '',
                    website: currentSession.personalInfo?.otherUrl || ''
                },
                authorization: {
                    workAuth: currentSession.extensionSettings?.workAuthorization || 'citizen',
                    needSponsor: currentSession.extensionSettings?.requireSponsorship === 'true',
                    willingToRelocate: currentSession.extensionSettings?.willingToRelocate === 'true',
                    securityClearance: currentSession.extensionSettings?.securityClearance || ''
                },
                role: {
                    salaryMin: currentSession.extensionSettings?.salaryMin || 0,
                    startDate: currentSession.extensionSettings?.expectedJoiningDate || '',
                    noticePeriod: currentSession.extensionSettings?.noticePeriod || ''
                },
                compliance: {
                    gender: currentSession.extensionSettings?.gender || '',
                    ethnicity: currentSession.extensionSettings?.ethnicity || '',
                    veteran: currentSession.extensionSettings?.veteranStatus || '',
                    disability: currentSession.extensionSettings?.disabilityStatus || ''
                },
                education: {
                    history: currentSession.education || []
                },
                experience: {
                    history: currentSession.experience || [],
                    currentCompany: currentSession.experience?.[0]?.current ? currentSession.experience[0].company : '',
                    currentTitle: currentSession.experience?.[0]?.current ? currentSession.experience[0].title : ''
                },
                skills: currentSession.skills || {}
            };

            await chrome.storage.local.set({
                session: currentSession,
                profile: profile // Now matches Profile interface!
            });
        } else {
            console.log('[Popup] No active session');
        }

        // 2. Load Settings (Groq Keys) - Critical for AI
        // Priority 1: From Active Session (Most reliable - set by webapp)
        let sessionSettings = currentSession?.extensionSettings || {};
        let apiKey = sessionSettings.groqApiKeys || sessionSettings.groqApiKey;

        // Priority 2: User Settings (Fallback)
        let settings = {};
        if (!apiKey) {
            const userSettingsDoc = await getDoc(doc(db, 'users', userId, 'settings', 'extension'));
            if (userSettingsDoc.exists()) {
                settings = userSettingsDoc.data();
                apiKey = settings.groqApiKeys || settings.groqApiKey;
                console.log('[Popup] Loaded user settings');
            }
        }

        // Priority 3: Admin Settings (Global Fallback)
        if (!apiKey) {
            const adminSettingsDoc = await getDoc(doc(db, 'adminSettings', 'extension'));
            if (adminSettingsDoc.exists()) {
                const adminSettings = adminSettingsDoc.data();
                settings = { ...settings, ...adminSettings };
                apiKey = settings.groqApiKeys || settings.groqApiKey;
                console.log('[Popup] Loaded admin settings (Global Keys)');
            }
        }

        // Parse key if multiline
        if (apiKey && apiKey.includes('\n')) {
            apiKey = apiKey.split('\n')[0].trim();
        }

        // Save to storage for groq.ts
        if (apiKey) {
            await chrome.storage.local.set({
                settings: {
                    ...settings,
                    groqApiKey: apiKey, // groq.ts looks for this specific field
                    groqModel: sessionSettings.groqModel || settings.groqModel || 'llama3-8b-8192'
                }
            });
            console.log('[Popup] ✅ Groq API Key cached');
        } else {
            console.warn('[Popup] ⚠️ No Groq API Key found in settings');
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

    // Dashboard Button
    document.getElementById('dashboard-btn')?.addEventListener('click', () => {
        const dashboardUrl = config.webappUrl + '/dashboard';
        chrome.tabs.create({ url: dashboardUrl });
    });

    // Data Button (Debug View)
    const dataBtn = document.getElementById('data-btn');
    const dataModal = document.getElementById('data-modal');
    const closeDataBtn = document.getElementById('close-data');
    const dataContent = document.getElementById('data-content');

    if (dataBtn) {
        dataBtn.addEventListener('click', () => {
            if (dataModal) dataModal.style.display = 'block';

            if (currentSession && dataContent) {
                // Formatting helper
                const formatList = (items) => {
                    if (!items || items.length === 0) return '<span class="empty">None</span>';
                    return items.map(i => {
                        const title = i.title || i.degree || i.name || 'Unknown';
                        const subtitle = i.company || i.school || i.issuer || '';
                        return `<div class="data-item"><strong>${title}</strong> <span>${subtitle}</span></div>`;
                    }).join('');
                };

                // Build HTML View
                const html = `
                    <div class="data-section">
                        <h4>🎯 Job Context</h4>
                        <div class="data-row"><span>Role:</span> <strong>${currentSession.jobTitle || 'N/A'}</strong></div>
                        <div class="data-row"><span>Company:</span> <strong>${currentSession.jobCompany || 'N/A'}</strong></div>
                    </div>

                    <div class="data-section">
                        <h4>👤 Identity</h4>
                        <div class="data-row"><span>Full Name:</span> <strong>${currentSession.personalInfo?.fullName || 'N/A'}</strong></div>
                        <div class="data-row"><span>First Name:</span> <strong>${currentSession.personalInfo?.firstName || 'N/A'}</strong></div>
                        <div class="data-row"><span>Last Name:</span> <strong>${currentSession.personalInfo?.lastName || 'N/A'}</strong></div>
                        <div class="data-row"><span>Email:</span> <strong>${currentSession.personalInfo?.email || 'N/A'}</strong></div>
                        <div class="data-row"><span>Phone:</span> <strong>${currentSession.personalInfo?.phone || 'N/A'}</strong></div>
                        <div class="data-row"><span>Location:</span> <strong>${currentSession.personalInfo?.location || 'N/A'}</strong></div>
                    </div>

                    <div class="data-section">
                        <h4>🔗 Social & Web</h4>
                        <div class="data-row"><span>LinkedIn:</span> <strong>${currentSession.personalInfo?.linkedin || '-'}</strong></div>
                        <div class="data-row"><span>GitHub:</span> <strong>${currentSession.personalInfo?.github || '-'}</strong></div>
                        <div class="data-row"><span>Portfolio:</span> <strong>${currentSession.personalInfo?.portfolio || '-'}</strong></div>
                        <div class="data-row"><span>Other:</span> <strong>${currentSession.personalInfo?.otherUrl || '-'}</strong></div>
                    </div>

                    <div class="data-section">
                        <h4>📝 Professional Summary</h4>
                        <div style="font-size:11px; line-height:1.4; color:var(--text-secondary); background:rgba(255,255,255,0.03); padding:8px; border-radius:4px;">
                            ${currentSession.professionalSummary || 'No summary available.'}
                        </div>
                    </div>

                    <div class="data-section">
                        <h4>💼 Experience (${currentSession.experience?.length || 0})</h4>
                        ${formatList(currentSession.experience)}
                    </div>

                    <div class="data-section">
                        <h4>🎓 Education (${currentSession.education?.length || 0})</h4>
                        ${formatList(currentSession.education)}
                    </div>

                    <div class="data-section">
                        <h4>🔐 Authorization & Compliance</h4>
                        <div class="data-row"><span>Work Auth:</span> <strong>${currentSession.extensionSettings?.workAuthorization || 'citizen'}</strong></div>
                        <div class="data-row"><span>Sponsorship:</span> <strong>${currentSession.extensionSettings?.requireSponsorship === 'true' ? 'Yes' : 'No'}</strong></div>
                        <div class="data-row"><span>Relocate:</span> <strong>${currentSession.extensionSettings?.willingToRelocate === 'true' ? 'Yes' : 'No'}</strong></div>
                        <div class="data-row"><span>Security Clearance:</span> <strong>${currentSession.extensionSettings?.securityClearance || 'None'}</strong></div>
                    </div>

                    <div class="data-section">
                        <h4>ℹ️ Demographics (Voluntary)</h4>
                        <div class="data-row"><span>Gender:</span> <strong>${currentSession.extensionSettings?.gender || '-'}</strong></div>
                        <div class="data-row"><span>Ethnicity:</span> <strong>${currentSession.extensionSettings?.ethnicity || '-'}</strong></div>
                        <div class="data-row"><span>Veteran:</span> <strong>${currentSession.extensionSettings?.veteranStatus || '-'}</strong></div>
                        <div class="data-row"><span>Disability:</span> <strong>${currentSession.extensionSettings?.disabilityStatus || '-'}</strong></div>
                    </div>

                    <div class="data-section">
                        <h4>🛠 Skills</h4>
                        <div class="data-row">
                            <span style="font-size:10px; color:#aaa;">${Object.values(currentSession.skills || {}).flat().join(', ') || 'None'}</span>
                        </div>
                    </div>
                `;

                // Clear previous JSON text
                dataContent.innerHTML = html;
                dataContent.style.whiteSpace = 'normal'; // Reset pre-wrap
            } else if (dataContent) {
                dataContent.innerHTML = `<div class="empty-state-small">⚠️ No Active Session Data.<br>Please go to Dashboard and click ⚡ Flash on a resume.</div>`;
            }
        });
    }
    if (closeDataBtn) {
        closeDataBtn.addEventListener('click', () => {
            if (dataModal) dataModal.style.display = 'none';
        });
    }
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
                btnTitle.textContent = 'Please Refresh Page';
                btnIcon.textContent = '↻';
                setTimeout(() => {
                    btnTitle.textContent = originalTitle;
                    btnIcon.textContent = originalIcon;
                }, 3000);
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

// Options Page Controller
// Handles profile management, settings, and history

class OptionsController {
    constructor() {
        this.profile = null;
        this.settings = {
            showFloatingButton: true,
            autoDetect: true,
            apiEndpoint: '',
            apiKey: ''
        };

        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.setupTabNavigation();
    }

    async loadData() {
        try {
            const result = await chrome.storage.local.get(['userProfile', 'settings', 'applicationHistory', 'stats']);

            this.profile = result.userProfile;
            if (result.settings) {
                this.settings = { ...this.settings, ...result.settings };
            }

            this.displaySettings();
            this.displayProfile();
            this.displayHistory(result.applicationHistory || []);
            this.displayStats(result.stats || {}, result.applicationHistory || []);

            // Smart Features Init
            this.checkChromeAi();
            if (result.settings?.smartContext !== undefined) {
                const smartContextToggle = document.getElementById('smartContext');
                if (smartContextToggle) smartContextToggle.checked = result.settings.smartContext;
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    setupTabNavigation() {
        const navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                // Remove active from all
                navItems.forEach(nav => nav.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

                // Add active to clicked
                item.classList.add('active');
                const tabId = item.dataset.tab;
                document.getElementById(`tab-${tabId}`).classList.add('active');
            });
        });
    }

    setupEventListeners() {
        // Import profile
        document.getElementById('importProfile').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.importProfile(e);
        });

        // Export profile
        document.getElementById('exportProfile').addEventListener('click', () => {
            this.exportProfile();
        });

        // Sync from Webapp (replaces Load Sample)
        document.getElementById('syncFromWebapp')?.addEventListener('click', () => {
            this.syncFromWebapp();
        });

        // Connect to Webapp button
        document.getElementById('connectWebapp')?.addEventListener('click', () => {
            this.openWebapp();
        });

        // Save profile
        document.getElementById('saveProfile').addEventListener('click', () => {
            this.saveProfile();
        });

        // Save settings
        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });

        // Clear data
        document.getElementById('clearData').addEventListener('click', () => {
            this.clearAllData();
        });

        // Clear history
        document.getElementById('clearHistory').addEventListener('click', () => {
            this.clearHistory();
        });

        // Open GitHub
        document.getElementById('openGithub').addEventListener('click', () => {
            window.open('https://github.com/yourusername/jobfiller-pro', '_blank');
        });

        // Form field changes - simplified to just name and email
        const formFields = ['firstName', 'lastName', 'email'];
        formFields.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                element.addEventListener('input', () => {
                    this.updateProfileFromForm();
                });
            }
        });

        // Smart Features - Check Chrome AI
        document.getElementById('checkChromeAi').addEventListener('click', () => {
            this.checkChromeAi();
        });

        // Smart Context Toggle
        document.getElementById('smartContext').addEventListener('change', (e) => {
            this.saveSmartFeaturesSettings(e.target.checked);
        });

        // Flag Links
        document.querySelectorAll('.copy-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navigator.clipboard.writeText(e.target.dataset.link);
                this.showToast('Copied to clipboard! Paste in address bar.', 'success');
            });
        });
    }

    displaySettings() {
        document.getElementById('showFloatingButton').checked = this.settings.showFloatingButton;
        document.getElementById('autoDetect').checked = this.settings.autoDetect;
        document.getElementById('apiEndpoint').value = this.settings.apiEndpoint || '';
        document.getElementById('apiKey').value = this.settings.apiKey || '';
    }

    displayProfile() {
        const profileStatus = document.getElementById('profileStatus');
        const profileEditor = document.getElementById('profileEditor');

        if (this.profile) {
            profileStatus.classList.add('loaded');
            profileStatus.querySelector('.status-icon').innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            `;
            profileStatus.querySelector('h3').textContent = 'Profile Loaded';
            profileStatus.querySelector('p').textContent =
                `${this.profile.personalInfo?.firstName || ''} ${this.profile.personalInfo?.lastName || ''} - ${this.profile.personalInfo?.email || ''}`;

            profileEditor.style.display = 'block';

            // Fill form fields
            this.fillFormFromProfile();

            // Load session info
            this.loadSessionInfo();
        }
    }

    fillFormFromProfile() {
        const p = this.profile;
        if (!p) return;

        const fields = {
            firstName: p.personalInfo?.firstName,
            lastName: p.personalInfo?.lastName,
            email: p.personalInfo?.email
        };

        for (const [id, value] of Object.entries(fields)) {
            const element = document.getElementById(id);
            if (element && value) {
                element.value = value;
            }
        }
    }

    // Update profile from simplified form
    updateProfileFromForm() {
        if (!this.profile) {
            this.profile = this.createEmptyProfile();
        }

        this.profile.personalInfo = this.profile.personalInfo || {};
        this.profile.personalInfo.firstName = document.getElementById('firstName')?.value || '';
        this.profile.personalInfo.lastName = document.getElementById('lastName')?.value || '';
        this.profile.personalInfo.email = document.getElementById('email')?.value || '';
    }

    // Load active session info - Show ALL details
    async loadSessionInfo() {
        try {
            const result = await chrome.storage.local.get(['flashSession', 'flashSessionTimestamp']);
            const sessionSection = document.getElementById('sessionInfoSection');

            console.log('[Options] Flash session:', result.flashSession);

            if (result.flashSession && result.flashSessionTimestamp) {
                const age = Date.now() - result.flashSessionTimestamp;
                if (age < 3600000) { // 1 hour
                    const session = result.flashSession;
                    const pi = session.personalInfo || {};

                    sessionSection.style.display = 'block';

                    // Personal Info - fullName might exist or compose from firstName/lastName
                    const fullName = pi.fullName || `${pi.firstName || ''} ${pi.lastName || ''}`.trim() || '-';
                    document.getElementById('sessionFullName').textContent = fullName;
                    document.getElementById('sessionEmail').textContent = pi.email || '-';
                    document.getElementById('sessionPhone').textContent = pi.phone || '-';

                    // Location - Firebase stores city/state/country directly on personalInfo, NOT nested!
                    const city = pi.city || pi.location || '';
                    const state = pi.state || '';
                    const country = pi.country || '';
                    const location = [city, state, country].filter(Boolean).join(', ') || '-';
                    document.getElementById('sessionLocation').textContent = location;

                    // Links
                    document.getElementById('sessionLinkedin').textContent = pi.linkedin || '-';
                    document.getElementById('sessionGithub').textContent = pi.github || '-';
                    document.getElementById('sessionPortfolio').textContent = pi.portfolio || pi.website || pi.otherUrl || '-';

                    // Target Job
                    document.getElementById('sessionJobTitle').textContent = session.jobTitle || session.targetJobTitle || '-';
                    document.getElementById('sessionJobCompany').textContent = session.jobCompany || session.targetCompany || '-';

                    // ALL Experiences - render each one with responsibilities
                    const allExperiences = session.experience || [];
                    const expListContainer = document.getElementById('sessionExperienceList');

                    if (allExperiences.length > 0) {
                        expListContainer.innerHTML = allExperiences.map((exp, index) => {
                            const respList = (exp.responsibilities || [])
                                .map(r => `<li>${r}</li>`)
                                .join('');
                            const dateRange = exp.current
                                ? `${exp.startDate || ''} - Present`
                                : `${exp.startDate || ''} - ${exp.endDate || ''}`;

                            return `
                                <div class="experience-card">
                                    <div class="experience-header">
                                        <strong>${exp.title || exp.position || 'Role'}</strong>
                                        <span class="experience-company">@ ${exp.company || 'Company'}</span>
                                        ${exp.current ? '<span class="badge-current">Current</span>' : ''}
                                    </div>
                                    <div class="experience-meta">${dateRange} | ${exp.location || ''}</div>
                                    ${respList ? `<ul class="responsibilities-list">${respList}</ul>` : ''}
                                </div>
                            `;
                        }).join('');
                        document.getElementById('sessionExpCount').textContent = allExperiences.length;
                    } else {
                        expListContainer.innerHTML = '<p class="no-data">No experience data</p>';
                        document.getElementById('sessionExpCount').textContent = '0';
                    }

                    // ALL Education - render each one dynamically
                    const allEducation = session.education || [];
                    const eduListContainer = document.getElementById('sessionEducationList');

                    if (allEducation.length > 0) {
                        eduListContainer.innerHTML = allEducation.map(edu => {
                            return `
                                <div class="education-card">
                                    <div class="education-header">
                                        <strong>${edu.degree || 'Degree'}</strong>
                                        ${edu.field ? `<span class="education-field">in ${edu.field}</span>` : ''}
                                    </div>
                                    <div class="education-meta">
                                        <span class="institution">${edu.institution || 'Institution'}</span>
                                        ${edu.graduationDate ? ` · Graduated ${edu.graduationDate}` : ''}
                                        ${edu.gpa ? ` · GPA: ${edu.gpa}` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('');
                        document.getElementById('sessionEduCount').textContent = allEducation.length;
                    } else {
                        eduListContainer.innerHTML = '<p class="no-data">No education data</p>';
                        document.getElementById('sessionEduCount').textContent = '0';
                    }

                    // Skills summary - show all, not truncated
                    const skills = session.skills?.all ||
                        (typeof session.skills === 'string' ? session.skills : '') || '-';
                    document.getElementById('sessionSkills').textContent = skills;

                    // Job Description
                    const jd = session.jobDescription || '';
                    const jdPreview = document.getElementById('sessionJobDescription');
                    if (jd) {
                        jdPreview.textContent = jd.length > 500
                            ? jd.substring(0, 500) + '...'
                            : jd;
                    } else {
                        jdPreview.textContent = '-';
                    }

                    // Extension Settings
                    const es = session.extensionSettings || {};
                    document.getElementById('sessionWorkAuth').textContent = es.workAuthorization || '-';
                    document.getElementById('sessionSponsorship').textContent =
                        es.requireSponsorship === 'yes' ? 'Required' :
                            es.requireSponsorship === 'no' ? 'Not Required' : '-';

                    // Salary
                    const salaryMin = es.salaryMin || '';
                    const salaryMax = es.salaryMax || '';
                    const currency = es.salaryCurrency || 'USD';
                    if (salaryMin || salaryMax) {
                        document.getElementById('sessionSalary').textContent =
                            `${currency} ${salaryMin} - ${salaryMax}`;
                    } else {
                        document.getElementById('sessionSalary').textContent = es.salaryExpectation || '-';
                    }

                    document.getElementById('sessionExperience').textContent = es.totalExperience || '-';
                    document.getElementById('sessionWorkType').textContent = es.workType || '-';
                    document.getElementById('sessionRelocate').textContent =
                        es.willingToRelocate === 'yes' ? 'Yes' :
                            es.willingToRelocate === 'no' ? 'No' : '-';
                    document.getElementById('sessionNoticePeriod').textContent = es.noticePeriod || '-';

                    return;
                }
            }
            // No active session - show placeholder
            sessionSection.style.display = 'block';
        } catch (error) {
            console.log('[Options] No session info:', error);
        }
    }



    createEmptyProfile() {
        return {
            version: "2.0",
            lastUpdated: new Date().toISOString(),
            personalInfo: {
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                location: {
                    address: "",
                    city: "",
                    state: "",
                    country: "USA",
                    zipCode: ""
                },
                linkedin: "",
                github: "",
                portfolio: ""
            },
            professionalSummary: {
                default: "",
                short: ""
            },
            experience: [],
            education: [],
            skills: {
                technical: {
                    programming: [],
                    frameworks: [],
                    tools: []
                },
                soft: []
            },
            preferences: {
                jobTypes: ["Full-time"],
                workArrangement: ["Remote"],
                sponsorshipRequired: false,
                willingToRelocate: true
            }
        };
    }

    async importProfile(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const profile = JSON.parse(text);

            if (!profile.personalInfo) {
                throw new Error('Invalid profile: missing personalInfo');
            }

            await chrome.storage.local.set({ userProfile: profile });
            this.profile = profile;

            this.displayProfile();
            this.showToast('Profile imported successfully!', 'success');
        } catch (error) {
            console.error('Error importing profile:', error);
            this.showToast('Failed to import profile: ' + error.message, 'error');
        }

        // Reset file input
        event.target.value = '';
    }

    async exportProfile() {
        if (!this.profile) {
            this.showToast('No profile to export', 'error');
            return;
        }

        const dataStr = JSON.stringify(this.profile, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `jobfiller-profile-${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);
        this.showToast('Profile exported!', 'success');
    }

    async loadSampleProfile() {
        // Sample profile data
        const sampleProfile = {
            version: "2.0",
            lastUpdated: new Date().toISOString(),
            personalInfo: {
                firstName: "John",
                lastName: "Doe",
                email: "john.doe@email.com",
                phone: "+1-555-555-5555",
                location: {
                    address: "123 Main Street",
                    city: "San Francisco",
                    state: "CA",
                    country: "USA",
                    zipCode: "94102"
                },
                linkedin: "https://linkedin.com/in/johndoe",
                github: "https://github.com/johndoe",
                portfolio: "https://johndoe.dev"
            },
            professionalSummary: {
                default: "Experienced software engineer with 5+ years of expertise in full-stack development, specializing in React, Node.js, and cloud technologies.",
                short: "Full-stack developer with 5+ years experience"
            },
            experience: [
                {
                    company: "Tech Corp",
                    position: "Senior Software Engineer",
                    startDate: "2020-01",
                    endDate: "2024-12",
                    current: false,
                    responsibilities: [
                        "Led team of 5 engineers",
                        "Improved performance by 40%"
                    ]
                }
            ],
            education: [
                {
                    institution: "Stanford University",
                    degree: "Bachelor of Science",
                    field: "Computer Science",
                    gpa: "3.8"
                }
            ],
            skills: {
                technical: {
                    programming: ["JavaScript", "Python", "Java"],
                    frameworks: ["React", "Node.js", "Django"],
                    tools: ["Git", "Docker", "AWS"]
                },
                soft: ["Leadership", "Communication"]
            },
            preferences: {
                jobTypes: ["Full-time"],
                workArrangement: ["Remote", "Hybrid"],
                salaryExpectation: { min: 120000, max: 180000, currency: "USD" },
                noticePeriod: "2 weeks",
                sponsorshipRequired: false,
                willingToRelocate: true
            }
        };

        await chrome.storage.local.set({ userProfile: sampleProfile });
        this.profile = sampleProfile;
        this.displayProfile();
        this.showToast('Sample profile loaded!', 'success');
    }

    // Open webapp in new tab
    openWebapp() {
        const webappUrl = document.getElementById('webappUrl')?.value || 'https://ai-resume-gopalakrishnachennu-5461s-projects.vercel.app';
        chrome.tabs.create({ url: webappUrl + '/dashboard' });
        this.showToast('Opening webapp - please login and return here to sync', 'info');
    }

    // Sync profile from webapp - receives profile via messaging
    async syncFromWebapp() {
        const webappUrl = document.getElementById('webappUrl')?.value || 'https://ai-resume-gopalakrishnachennu-5461s-projects.vercel.app';

        this.showToast('Checking for synced profile...', 'info');

        // Check if we have a synced profile from the webapp
        const result = await chrome.storage.local.get(['userProfile', 'webappLastSync']);

        if (result.userProfile && result.userProfile.personalInfo?.email &&
            result.userProfile.personalInfo.email !== 'john.doe@email.com') {
            // We have a real profile synced from webapp
            this.profile = result.userProfile;
            this.displayProfile();

            const syncTime = result.webappLastSync ? new Date(result.webappLastSync).toLocaleString() : 'Unknown';
            this.showToast(`Profile synced! Last sync: ${syncTime}`, 'success');

            // Update connection status
            const statusEl = document.getElementById('webappStatus');
            if (statusEl) {
                statusEl.innerHTML = `<span class="status-dot green"></span><span>Connected - ${this.profile.personalInfo.firstName} ${this.profile.personalInfo.lastName}</span>`;
            }
        } else {
            // No real profile yet - prompt user to go to webapp
            this.showToast('No profile synced yet. Please login to the webapp first, then visit the dashboard to sync.', 'error');

            // Ask if they want to open webapp
            if (confirm('Would you like to open the webapp now to login and sync your profile?')) {
                chrome.tabs.create({ url: webappUrl + '/dashboard' });
            }
        }
    }

    async saveProfile() {
        try {
            // Update from form fields
            this.updateProfileFromForm();
            this.profile.lastUpdated = new Date().toISOString();

            await chrome.storage.local.set({ userProfile: this.profile });
            this.showToast('Profile saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving profile:', error);
            this.showToast('Failed to save profile', 'error');
        }
    }

    async saveSettings() {
        try {
            this.settings = {
                showFloatingButton: document.getElementById('showFloatingButton').checked,
                autoDetect: document.getElementById('autoDetect').checked,
                apiEndpoint: document.getElementById('apiEndpoint').value,
                apiKey: document.getElementById('apiKey').value
            };

            await chrome.storage.local.set({ settings: this.settings });
            this.showToast('Settings saved!', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showToast('Failed to save settings', 'error');
        }
    }

    displayHistory(history) {
        const historyList = document.getElementById('historyList');

        if (!history || history.length === 0) {
            historyList.innerHTML = '<p class="empty-state">No applications tracked yet</p>';
            return;
        }

        const platformIcons = {
            'LinkedIn': '💼',
            'Indeed': '🔍',
            'Glassdoor': '🏢',
            'Workday': '📋',
            'Greenhouse': '🌱',
            'Lever': '⚡',
            'Unknown': '🌐'
        };

        historyList.innerHTML = history.map(app => `
            <div class="history-item">
                <div class="history-icon">${platformIcons[app.platform] || '🌐'}</div>
                <div class="history-info">
                    <p class="history-title">${app.title || 'Job Application'}</p>
                    <p class="history-meta">${app.platform || 'Unknown'} • ${this.formatDate(app.appliedAt)} • ${app.fieldsFilled || 0} fields</p>
                </div>
            </div>
        `).join('');
    }

    displayStats(stats, history) {
        document.getElementById('totalApplications').textContent = history.length;
        document.getElementById('totalFields').textContent = stats.fieldsFilled || (history.length * 8);
        document.getElementById('timeSaved').textContent = Math.round(history.length * 3);
    }

    async clearHistory() {
        if (!confirm('Are you sure you want to clear application history?')) {
            return;
        }

        await chrome.storage.local.set({ applicationHistory: [], stats: { fieldsFilled: 0 } });
        this.displayHistory([]);
        this.displayStats({}, []);
        this.showToast('History cleared', 'success');
    }

    async clearAllData() {
        if (!confirm('Are you sure you want to clear ALL data including your profile? This cannot be undone.')) {
            return;
        }

        await chrome.storage.local.clear();
        this.profile = null;
        this.settings = {
            showFloatingButton: true,
            autoDetect: true,
            apiEndpoint: '',
            apiKey: ''
        };

        location.reload();
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;

        setTimeout(() => {
            toast.className = 'toast';
        }, 3000);
    }

    // Check Chrome AI availability (experimental feature)
    async checkChromeAi() {
        const statusEl = document.getElementById('chromeAiStatus');
        if (!statusEl) return;

        try {
            // Check if Chrome AI (window.ai) is available
            if (typeof window !== 'undefined' && window.ai) {
                statusEl.innerHTML = '<span class="status-dot green"></span> Available';
                statusEl.classList.add('available');
            } else {
                statusEl.innerHTML = '<span class="status-dot gray"></span> Not Available';
                statusEl.classList.remove('available');
            }
        } catch (error) {
            statusEl.innerHTML = '<span class="status-dot gray"></span> Not Available';
            statusEl.classList.remove('available');
        }
    }

    // Save smart features settings
    async saveSmartFeaturesSettings(smartContext) {
        try {
            const currentSettings = { ...this.settings, smartContext };
            await chrome.storage.local.set({ settings: currentSettings });
            this.settings = currentSettings;
            this.showToast('Smart features updated!', 'success');
        } catch (error) {
            console.error('Error saving smart features:', error);
            this.showToast('Failed to save settings', 'error');
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new OptionsController();
});

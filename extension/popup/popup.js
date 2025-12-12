// AI Resume Builder Extension - Popup Controller
// Clean corporate version - synced with webapp

class PopupController {
  constructor() {
    this.profile = null;
    this.currentTab = null;
    this.platform = 'Unknown';

    this.init();
  }

  async init() {
    await this.loadProfile();
    await this.getCurrentTab();
    this.setupEventListeners();
    this.loadStats();
    this.updateUI();
  }

  async loadProfile() {
    const result = await chrome.storage.local.get(['userProfile', 'webappLastSync']);
    this.profile = result.userProfile;

    // Update connection status
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    const profileName = document.getElementById('profileName');

    if (this.profile && this.profile.personalInfo?.email !== 'john.doe@email.com') {
      statusDot.classList.add('connected');
      statusText.textContent = 'Connected';
      const name = `${this.profile.personalInfo?.firstName || ''} ${this.profile.personalInfo?.lastName || ''}`.trim();
      profileName.textContent = name || this.profile.personalInfo?.email || 'Synced';
    } else {
      statusDot.classList.remove('connected');
      statusText.textContent = 'Not synced';
      profileName.textContent = 'Click Sync';
    }
  }

  async getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    this.currentTab = tab;

    if (tab) {
      // Detect platform
      const url = tab.url || '';
      this.platform = this.detectPlatform(url);

      // Update UI
      document.getElementById('platformIcon').textContent = this.getPlatformIcon(this.platform);
      document.getElementById('platformName').textContent = this.platform;
      document.getElementById('jobTitle').textContent = tab.title || 'No job detected';

      // Try to get match score from content script
      this.requestMatchScore();
    }
  }

  detectPlatform(url) {
    const platforms = {
      'linkedin.com': 'LinkedIn',
      'indeed.com': 'Indeed',
      'glassdoor.com': 'Glassdoor',
      'myworkdayjobs.com': 'Workday',
      'greenhouse.io': 'Greenhouse',
      'lever.co': 'Lever',
      'smartrecruiters.com': 'SmartRecruiters',
      'icims.com': 'iCIMS',
      'taleo.net': 'Taleo'
    };

    for (const [domain, name] of Object.entries(platforms)) {
      if (url.includes(domain)) return name;
    }
    return 'Unknown';
  }

  getPlatformIcon(platform) {
    const icons = {
      'LinkedIn': '💼',
      'Indeed': '🔍',
      'Glassdoor': '🏢',
      'Workday': '📋',
      'Greenhouse': '🌱',
      'Lever': '⚡',
      'SmartRecruiters': '🎯',
      'iCIMS': '📝',
      'Taleo': '🔷',
      'Unknown': '🌐'
    };
    return icons[platform] || '🌐';
  }

  async requestMatchScore() {
    if (!this.currentTab?.id) return;

    try {
      const response = await chrome.tabs.sendMessage(this.currentTab.id, { type: 'GET_MATCH_SCORE' });
      if (response?.score !== undefined) {
        this.updateMatchScore(response.score, response.matchedSkills, response.missingSkills);
      }
    } catch (error) {
      // Content script not loaded - that's okay
    }
  }

  updateMatchScore(score, matched = [], missing = []) {
    const container = document.getElementById('matchScoreContainer');
    const fill = document.getElementById('matchFill');
    const percent = document.getElementById('matchPercent');

    container.style.display = 'flex';
    fill.style.width = `${score}%`;
    percent.textContent = `${score}%`;

    // Update color based on score
    let color = '#ef4444'; // red
    if (score >= 70) color = '#22c55e'; // green
    else if (score >= 50) color = '#f59e0b'; // yellow
    fill.style.background = color;

    // Update skills
    const matchedEl = document.getElementById('matchedSkills');
    const missingEl = document.getElementById('missingSkills');

    matchedEl.innerHTML = matched.slice(0, 5).map(s => `<span class="skill-tag">${s}</span>`).join('');
    missingEl.innerHTML = missing.slice(0, 5).map(s => `<span class="skill-tag">${s}</span>`).join('');
  }

  async loadStats() {
    const result = await chrome.storage.local.get(['stats', 'applicationHistory']);
    const stats = result.stats || { fieldsFilled: 0 };
    const history = result.applicationHistory || [];

    document.getElementById('statApplications').textContent = history.length;
    document.getElementById('statFilled').textContent = stats.fieldsFilled || 0;
    document.getElementById('statSaved').textContent = Math.round(history.length * 3);
  }

  setupEventListeners() {
    // Sync Profile
    document.getElementById('syncProfile').addEventListener('click', () => {
      this.syncProfile();
    });

    // Settings
    document.getElementById('openSettings').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    // Quick Fill
    document.getElementById('quickFill').addEventListener('click', () => {
      this.quickFill();
    });

    // Fill Form
    document.getElementById('fillForm').addEventListener('click', () => {
      this.fillForm();
    });
  }

  async syncProfile() {
    const syncBtn = document.getElementById('syncProfile');
    const statusDot = document.querySelector('.status-dot');

    syncBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
                <path d="M21 3v5h-5"></path>
            </svg>
            Syncing...
        `;
    statusDot.classList.add('syncing');

    // Check storage for synced profile
    await this.loadProfile();

    if (this.profile && this.profile.personalInfo?.email !== 'john.doe@email.com') {
      this.showToast('Profile synced!', 'success');
    } else {
      // Open webapp to sync
      this.showToast('Opening webapp to sync...', 'info');
      chrome.tabs.create({ url: 'https://ai-resume-gopalakrishnachennu-5461s-projects.vercel.app/dashboard' });
    }

    syncBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
                <path d="M21 3v5h-5"></path>
            </svg>
            Sync
        `;
    statusDot.classList.remove('syncing');
  }

  async quickFill() {
    if (!this.profile) {
      this.showToast('Please sync your profile first', 'error');
      return;
    }

    if (!this.currentTab?.id) {
      this.showToast('No active tab', 'error');
      return;
    }

    const btn = document.getElementById('quickFill');
    btn.disabled = true;
    btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
            </svg>
            Filling...
        `;

    try {
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        type: 'QUICK_FILL',
        profile: this.profile
      });

      if (response?.success) {
        this.showToast(`Filled ${response.fieldsFilled || 0} fields!`, 'success');
        this.loadStats();
      } else {
        this.showToast(response?.error || 'Fill failed', 'error');
      }
    } catch (error) {
      this.showToast('Could not fill form', 'error');
    }

    btn.disabled = false;
    btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            Quick Fill
        `;
  }

  async fillForm() {
    await this.quickFill();
  }

  updateUI() {
    // Add spin animation style
    const style = document.createElement('style');
    style.textContent = `
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            .spin { animation: spin 1s linear infinite; }
        `;
    document.head.appendChild(style);
  }

  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
      toast.className = 'toast';
    }, 3000);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});

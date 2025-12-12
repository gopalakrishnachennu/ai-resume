// Popup UI Controller
// Handles all user interactions in the extension popup

const MESSAGE_TYPES = {
  FILL_FORM: 'fill_form',
  DETECT_FORM: 'detect_form',
  FORM_DETECTED: 'form_detected',
  FORM_FILLED: 'form_filled',
  QUICK_FILL: 'quick_fill',
  GET_STATUS: 'get_status',
  ERROR: 'error'
};

class PopupController {
  constructor() {
    this.currentTab = null;
    this.detectedFields = null;
    this.userProfile = null;
    this.scriptsInjected = false;
    this.lastAnswer = null;
    this.answerLibrary = [];

    this.init();
  }

  async init() {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;

      // Load user profile
      await this.loadProfile();

      // Load stats
      await this.loadStats();

      // Load history
      await this.loadHistory();
      await this.loadAnswerLibrary();

      // Setup event listeners
      this.setupEventListeners();

      // Check platform and update UI
      this.updatePageInfo();

      // Try to inject scripts if needed
      await this.ensureScriptsInjected();

      // Fetch and display match score
      await this.fetchMatchScore();
    } catch (error) {
      console.error('Error initializing popup:', error);
    }
  }

  /**
   * Ensure content scripts are injected into the current page
   */
  async ensureScriptsInjected() {
    if (!this.currentTab || this.scriptsInjected) return;

    try {
      // Check if content script is already running
      const response = await chrome.tabs.sendMessage(this.currentTab.id, { type: 'GET_STATUS' });
      if (response?.success) {
        this.scriptsInjected = true;
        console.log('Content scripts already running');
        return;
      }
    } catch (error) {
      // Content scripts not running, need to inject
      console.log('Content scripts not found, need to inject');
    }

    // Inject scripts programmatically
    try {
      // Inject JS files in order
      const scripts = [
        'lib/storage-manager.js',
        'content-scripts/utils.js',
        'content-scripts/platform-detector.js',
        'content-scripts/field-patterns.js',
        'content-scripts/form-detector.js',
        'content-scripts/form-filler.js',
        'content-scripts/page-analyzer.js',
        'content-scripts/jd-matcher.js',
        'content-scripts/answer-assistant.js',
        'content-scripts/validation-engine.js',
        'content-scripts/ats-handlers.js',
        'content-scripts/step-tracker.js',
        'content-scripts/smart-monitor.js',
        'content-scripts/prediction-engine.js',
        'content-scripts/work-auth-guard.js',
        'content-scripts/ai-answer-engine.js',
        'content-scripts/notification-banner.js',
        'content-scripts/fill-tracker.js',
        'content-scripts/fab-helpers.js',
        'content-scripts/floating-button.js',
        'content-scripts/main.js'
      ];

      await chrome.scripting.executeScript({
        target: { tabId: this.currentTab.id },
        files: scripts
      });

      this.scriptsInjected = true;
      console.log('Content scripts injected successfully');
      this.showToast('Extension connected! Try again.', 'success');
    } catch (error) {
      console.error('Failed to inject scripts:', error);

      // Check if it's a file:// URL issue
      if (this.currentTab.url?.startsWith('file://')) {
        this.showToast('Enable "Allow access to file URLs" in extension settings', 'error');
      } else if (error.message?.includes('Cannot access')) {
        this.showToast('Cannot access this page. Try a job site!', 'error');
      }
    }
  }

  /**
   * Send message with retry after script injection
   */
  async sendMessageWithRetry(message, maxRetries = 2) {
    for (let i = 0; i <= maxRetries; i++) {
      try {
        const response = await chrome.tabs.sendMessage(this.currentTab.id, message);
        return response;
      } catch (error) {
        if (i < maxRetries) {
          console.log(`Message failed, attempting to inject scripts (attempt ${i + 1})`);
          this.scriptsInjected = false;
          await this.ensureScriptsInjected();
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait a bit after injection
        } else {
          throw error;
        }
      }
    }
  }

  async loadProfile() {
    try {
      const result = await chrome.storage.local.get('userProfile');
      this.userProfile = result.userProfile;

      if (this.userProfile) {
        this.displayProfile();
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  displayProfile() {
    const profileInfo = document.getElementById('profileInfo');
    const profileCard = document.getElementById('profileCard');

    if (this.userProfile?.personalInfo) {
      const { firstName, lastName, email } = this.userProfile.personalInfo;
      profileInfo.innerHTML = `
                <div class="profile-avatar has-profile">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <div class="profile-details">
                    <p class="profile-name">${firstName} ${lastName}</p>
                    <p class="profile-email">${email}</p>
                </div>
            `;
      profileCard.style.borderLeft = '4px solid var(--success)';
    }
  }

  async loadStats() {
    try {
      const result = await chrome.storage.local.get(['applicationHistory', 'stats']);
      const history = result.applicationHistory || [];
      const stats = result.stats || { fieldsFilled: 0 };

      document.getElementById('statApplications').textContent = history.length;
      document.getElementById('statFilled').textContent = stats.fieldsFilled || (history.length * 8);
      document.getElementById('statSaved').textContent = Math.round((history.length * 3));
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async loadHistory() {
    try {
      const result = await chrome.storage.local.get('applicationHistory');
      const history = result.applicationHistory || [];
      this.displayHistory(history);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  }

  displayHistory(history) {
    const historyList = document.getElementById('historyList');

    if (!history || history.length === 0) {
      historyList.innerHTML = '<p class="empty-state">No applications yet. Start applying!</p>';
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

    historyList.innerHTML = history.slice(0, 4).map(app => `
            <div class="history-item">
                <div class="history-icon">${platformIcons[app.platform] || '🌐'}</div>
                <div class="history-info">
                    <p class="history-title">${this.truncateText(app.title || 'Job Application', 35)}</p>
                    <p class="history-date">${this.formatDate(app.appliedAt)}</p>
                </div>
                <span class="history-badge">${app.fieldsFilled || '8'} fields</span>
            </div>
        `).join('');
  }

  updatePageInfo() {
    const pageTitle = document.getElementById('pageTitle');
    const pageUrl = document.getElementById('pageUrl');
    const platformBadge = document.getElementById('platformBadge');

    if (this.currentTab) {
      pageTitle.textContent = this.truncateText(this.currentTab.title, 40);
      pageUrl.textContent = this.truncateText(this.currentTab.url, 50);

      // Detect platform
      const platform = this.detectPlatform(this.currentTab.url);
      const platformName = document.querySelector('.platform-name');
      platformName.textContent = platform;

      if (platform !== 'Unknown') {
        platformBadge.classList.add('supported');
      }
    }
  }

  detectPlatform(url) {
    if (!url) return 'Unknown';

    const platforms = {
      'linkedin.com': 'LinkedIn',
      'indeed.com': 'Indeed',
      'glassdoor.com': 'Glassdoor',
      'myworkdayjobs.com': 'Workday',
      'greenhouse.io': 'Greenhouse',
      'lever.co': 'Lever',
      'smartrecruiters.com': 'SmartRecruiters',
      'icims.com': 'iCIMS',
      'taleo.net': 'Taleo',
      'ashbyhq.com': 'Ashby',
      'bamboohr.com': 'BambooHR',
      'workable.com': 'Workable',
      'jobvite.com': 'Jobvite',
      'wellfound.com': 'Wellfound',
      'angel.co': 'AngelList',
      'ziprecruiter.com': 'ZipRecruiter',
      'monster.com': 'Monster',
      'dice.com': 'Dice'
    };

    const lowerUrl = url.toLowerCase();
    for (const [domain, name] of Object.entries(platforms)) {
      if (lowerUrl.includes(domain)) {
        return name;
      }
    }

    // Check for career/job pages
    if (lowerUrl.includes('career') || lowerUrl.includes('job') || lowerUrl.includes('apply')) {
      return 'Job Site';
    }

    return 'Unknown';
  }

  setupEventListeners() {
    // Import profile
    document.getElementById('importProfile').addEventListener('click', () => {
      document.getElementById('fileInput').click();
    });

    document.getElementById('fileInput').addEventListener('change', (e) => {
      this.handleFileImport(e);
    });

    // Refresh profile
    document.getElementById('refreshProfile').addEventListener('click', () => {
      this.loadProfile();
      this.showToast('Profile refreshed!');
    });

    // Edit profile
    document.getElementById('editProfile').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    // Quick fill
    document.getElementById('quickFill').addEventListener('click', () => {
      this.quickFill();
    });

    // Detect form
    document.getElementById('detectForm').addEventListener('click', () => {
      this.detectForm();
    });

    // Fill form
    document.getElementById('fillForm').addEventListener('click', () => {
      this.fillForm();
    });

    // View all history
    document.getElementById('viewAllHistory').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    // Settings
    document.getElementById('openSettings').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    // Help
    document.getElementById('openHelp').addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://github.com/yourusername/jobfiller-pro' });
    });

    // Support/Donate
    document.getElementById('openDonate').addEventListener('click', () => {
      this.showToast('Thank you for your support! ❤️');
    });

    // Refresh match
    document.getElementById('refreshMatch').addEventListener('click', () => {
      this.fetchMatchScore();
    });

    // Validate form
    document.getElementById('validateForm').addEventListener('click', () => {
      this.validateForm();
    });

    // Answer assistant
    document.getElementById('generateAnswer').addEventListener('click', () => {
      this.generateAnswer();
    });
    document.getElementById('insertAnswer').addEventListener('click', () => {
      this.insertAnswer();
    });
    document.getElementById('saveAnswer').addEventListener('click', () => {
      this.saveAnswer();
    });
    document.getElementById('refreshLibrary').addEventListener('click', () => {
      this.loadAnswerLibrary(true);
    });

    // Advance step (for multi-step forms)
    const advanceBtn = document.getElementById('advanceStep');
    if (advanceBtn) {
      advanceBtn.addEventListener('click', () => {
        this.advanceStep();
      });
    }

    // Resume upload handlers
    this.setupResumeUpload();
  }

  /**
   * Setup resume upload functionality
   */
  setupResumeUpload() {
    const uploadArea = document.getElementById('resumeUploadArea');
    const resumeInput = document.getElementById('resumeInput');
    const removeBtn = document.getElementById('removeResume');

    if (!uploadArea || !resumeInput) return;

    // Load existing resume from storage
    this.loadResumeFromStorage();

    // Click to upload
    uploadArea.addEventListener('click', () => {
      resumeInput.click();
    });

    // File input change
    resumeInput.addEventListener('change', (e) => {
      if (e.target.files[0]) {
        this.handleResumeUpload(e.target.files[0]);
      }
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) {
        this.handleResumeUpload(file);
      }
    });

    // Remove resume
    removeBtn?.addEventListener('click', () => {
      this.removeResume();
    });
  }

  /**
   * Load resume from storage
   */
  async loadResumeFromStorage() {
    try {
      const result = await chrome.storage.local.get('resumeFile');
      if (result.resumeFile && result.resumeFile.name) {
        this.displayResumeUploaded(result.resumeFile.name);
      }
    } catch (error) {
      console.log('No resume in storage');
    }
  }

  /**
   * Handle resume file upload
   */
  async handleResumeUpload(file) {
    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      this.showToast('Please upload a PDF or DOCX file', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.showToast('File too large (max 5MB)', 'error');
      return;
    }

    try {
      // Convert to base64 for storage
      const reader = new FileReader();
      reader.onload = async (e) => {
        const resumeData = {
          name: file.name,
          type: file.type,
          size: file.size,
          data: e.target.result,
          uploadedAt: new Date().toISOString()
        };

        await chrome.storage.local.set({ resumeFile: resumeData });
        this.displayResumeUploaded(file.name);
        this.showToast('Resume uploaded! 📄', 'success');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading resume:', error);
      this.showToast('Failed to upload resume', 'error');
    }
  }

  /**
   * Display resume as uploaded
   */
  displayResumeUploaded(filename) {
    const uploadArea = document.getElementById('resumeUploadArea');
    const resumeInfo = document.getElementById('resumeInfo');
    const resumeFilename = document.getElementById('resumeFilename');
    const resumeStatus = document.getElementById('resumeStatus');

    if (uploadArea) uploadArea.style.display = 'none';
    if (resumeInfo) resumeInfo.style.display = 'flex';
    if (resumeFilename) resumeFilename.textContent = filename;
    if (resumeStatus) {
      resumeStatus.textContent = 'Uploaded';
      resumeStatus.classList.add('uploaded');
    }
  }

  /**
   * Remove resume from storage
   */
  async removeResume() {
    try {
      await chrome.storage.local.remove('resumeFile');

      const uploadArea = document.getElementById('resumeUploadArea');
      const resumeInfo = document.getElementById('resumeInfo');
      const resumeStatus = document.getElementById('resumeStatus');
      const resumeInput = document.getElementById('resumeInput');

      if (uploadArea) uploadArea.style.display = 'flex';
      if (resumeInfo) resumeInfo.style.display = 'none';
      if (resumeStatus) {
        resumeStatus.textContent = 'Not uploaded';
        resumeStatus.classList.remove('uploaded');
      }
      if (resumeInput) resumeInput.value = '';

      this.showToast('Resume removed', 'success');
    } catch (error) {
      console.error('Error removing resume:', error);
    }
  }

  async handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const profile = JSON.parse(text);

      // Validate profile structure
      if (!profile.personalInfo || !profile.personalInfo.email) {
        throw new Error('Invalid profile format: missing personalInfo');
      }

      // Save to storage
      await chrome.storage.local.set({ userProfile: profile });
      this.userProfile = profile;

      this.displayProfile();
      this.showToast('Profile imported successfully! 🎉', 'success');
    } catch (error) {
      console.error('Error importing profile:', error);
      this.showToast('Failed to import profile. Check file format.', 'error');
    }
  }

  async quickFill() {
    if (!this.userProfile) {
      this.showToast('Please import your profile first!', 'error');
      return;
    }

    const btn = document.getElementById('quickFill');
    btn.disabled = true;
    btn.innerHTML = `
            <svg class="spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
            Filling...
        `;

    try {
      const response = await this.sendMessageWithRetry({
        type: MESSAGE_TYPES.QUICK_FILL
      });

      if (response?.success) {
        this.showToast(`Filled ${response.filled?.totalFilled || 0} fields! 🎉`, 'success');
        await this.updateStats(response.filled?.totalFilled || 0);
        await this.loadStats();
      } else {
        throw new Error(response?.error || 'Failed to fill form');
      }
    } catch (error) {
      console.error('Quick fill error:', error);
      this.showToast('Error: ' + (error.message || 'Could not connect to page'), 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                Quick Fill
            `;
    }
  }

  async detectForm() {
    const btn = document.getElementById('detectForm');
    btn.disabled = true;
    btn.textContent = 'Detecting...';

    try {
      const response = await this.sendMessageWithRetry({
        type: MESSAGE_TYPES.DETECT_FORM
      });

      if (response?.success) {
        this.detectedFields = response.fields;
        this.displayDetectedFields(response.summary);

        const total = response.summary?.metadata?.classifiedFields || 0;
        this.showToast(`Found ${total} fields to fill!`, 'success');

        // Enable fill button
        document.getElementById('fillForm').disabled = false;
      } else {
        throw new Error(response?.error || 'No form detected');
      }
    } catch (error) {
      console.error('Detection error:', error);
      this.showToast('Could not detect form on this page', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                Detect
            `;
    }
  }

  displayDetectedFields(summary) {
    const fieldsCard = document.getElementById('fieldsCard');
    fieldsCard.style.display = 'block';

    document.getElementById('countPersonal').textContent = summary?.personal || 0;
    document.getElementById('countExperience').textContent = summary?.experience || 0;
    document.getElementById('countEducation').textContent = summary?.education || 0;
    document.getElementById('countOther').textContent =
      (summary?.skills || 0) + (summary?.preferences || 0) + (summary?.other || 0);
  }

  async fillForm() {
    if (!this.userProfile) {
      this.showToast('Please import your profile first!', 'error');
      return;
    }

    if (!this.detectedFields) {
      this.showToast('Please detect fields first!', 'error');
      return;
    }

    const btn = document.getElementById('fillForm');
    btn.disabled = true;
    btn.innerHTML = `
            <svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
            Filling...
        `;

    try {
      const response = await this.sendMessageWithRetry({
        type: MESSAGE_TYPES.FILL_FORM,
        data: {
          profile: this.userProfile,
          fields: this.detectedFields
        }
      });

      if (response?.success) {
        this.showToast(`Filled ${response.filledCount} fields! Please review.`, 'success');
        await this.updateStats(response.filledCount);
        await this.loadStats();
      } else {
        throw new Error(response?.error || 'Failed to fill form');
      }
    } catch (error) {
      console.error('Fill error:', error);
      this.showToast('Error filling form', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                Fill Form
            `;
    }
  }

  async updateStats(fieldsFilled) {
    try {
      const result = await chrome.storage.local.get('stats');
      const stats = result.stats || { fieldsFilled: 0 };
      stats.fieldsFilled = (stats.fieldsFilled || 0) + fieldsFilled;
      await chrome.storage.local.set({ stats });
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }

  /**
   * Fetch match score from content script
   */
  async fetchMatchScore() {
    if (!this.currentTab || !this.userProfile) {
      console.log('No tab or profile for match score');
      return;
    }

    try {
      // Request JD extraction and matching from content script
      const response = await this.sendMessageWithRetry({
        type: 'GET_MATCH_SCORE',
        profile: this.userProfile
      });

      if (response?.success && response.matchResult) {
        this.displayMatchScore(response.matchResult);
      }
    } catch (error) {
      console.log('Could not fetch match score:', error.message);
      // Hide match card if error
      document.getElementById('matchCard').style.display = 'none';
    }
  }

  /**
   * Generate AI answer for a question
   */
  async generateAnswer() {
    const question = document.getElementById('answerQuestion').value.trim();
    const tone = document.getElementById('answerTone').value;
    const length = document.getElementById('answerLength').value;
    const btn = document.getElementById('generateAnswer');

    btn.disabled = true;
    btn.textContent = 'Generating...';
    document.getElementById('insertAnswer').disabled = true;
    document.getElementById('saveAnswer').disabled = true;

    try {
      const response = await this.sendMessageWithRetry({
        type: 'GENERATE_ANSWER',
        question,
        options: { tone, length }
      });

      if (!response?.success) {
        throw new Error(response?.error || 'Could not generate');
      }

      this.lastAnswer = {
        question,
        answer: response.answer,
        tone,
        length,
        context: response.context
      };

      const output = document.getElementById('answerOutput');
      output.textContent = response.answer;
      document.getElementById('insertAnswer').disabled = false;
      document.getElementById('saveAnswer').disabled = false;
    } catch (error) {
      console.error('Generate answer error:', error);
      this.showToast('Failed to generate answer', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Generate';
    }
  }

  /**
   * Insert generated answer into focused field
   */
  async insertAnswer() {
    if (!this.lastAnswer?.answer) {
      this.showToast('Generate an answer first', 'error');
      return;
    }

    try {
      const response = await this.sendMessageWithRetry({
        type: 'INSERT_ANSWER',
        text: this.lastAnswer.answer
      });

      if (response?.success) {
        this.showToast('Inserted into the active field', 'success');
      } else {
        this.showToast(response?.error || 'No field focused', 'error');
      }
    } catch (error) {
      this.showToast('Could not insert answer', 'error');
    }
  }

  /**
   * Save generated answer to the library
   */
  async saveAnswer() {
    if (!this.lastAnswer?.answer) {
      this.showToast('Generate an answer first', 'error');
      return;
    }

    try {
      const response = await this.sendMessageWithRetry({
        type: 'SAVE_ANSWER',
        entry: this.lastAnswer
      });

      if (response?.success) {
        this.showToast('Saved to library', 'success');
        await this.loadAnswerLibrary(true);
      } else {
        throw new Error(response?.error || 'Save failed');
      }
    } catch (error) {
      this.showToast('Could not save answer', 'error');
    }
  }

  /**
   * Load saved answers
   */
  async loadAnswerLibrary(force = false) {
    if (!this.currentTab) return;
    try {
      const response = await this.sendMessageWithRetry({
        type: 'GET_ANSWER_LIBRARY'
      }, force ? 0 : 2);

      if (response?.success) {
        this.answerLibrary = response.library || [];
        this.renderAnswerLibrary();
      }
    } catch (error) {
      console.log('Could not load answer library:', error.message);
    }
  }

  renderAnswerLibrary() {
    const container = document.getElementById('answerLibrary');
    if (!this.answerLibrary || this.answerLibrary.length === 0) {
      container.innerHTML = '<p class="empty-state">No saved answers yet.</p>';
      return;
    }

    container.innerHTML = this.answerLibrary.slice(0, 5).map(item => `
      <div class="library-item">
        <div class="library-meta">
          <span>${item.tone || 'tone'}</span>
          <span>${new Date(item.createdAt).toLocaleString()}</span>
        </div>
        <div class="library-question">${this.truncateText(item.question || 'Saved answer', 80)}</div>
        <div class="library-answer">${this.truncateText(item.answer, 160)}</div>
        <div class="library-actions">
          <button class="btn btn-secondary" data-ans-id="${item.id}" data-ans-text="${encodeURIComponent(item.answer)}">Insert</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('button[data-ans-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const text = decodeURIComponent(btn.dataset.ansText || '');
        this.lastAnswer = { answer: text };
        await this.insertAnswer();
      });
    });
  }

  /**
   * Validate form and show issues with enhanced checklist
   */
  async validateForm() {
    const summary = document.getElementById('validationSummary');
    const checklistItems = document.getElementById('checklistItems');
    const legacyList = document.getElementById('validationIssues');
    const scoreEl = document.getElementById('checklistScore');
    const stepProgress = document.getElementById('stepProgress');
    const stepValue = document.getElementById('stepValue');
    const stepBar = document.getElementById('stepBar');
    const checklistActions = document.getElementById('checklistActions');

    summary.style.display = 'none';
    checklistItems.innerHTML = '';
    legacyList.innerHTML = '';

    try {
      // Try to get the enhanced checklist first
      const checklistResponse = await this.sendMessageWithRetry({ type: 'get_checklist' });

      if (checklistResponse?.success && checklistResponse.checklist) {
        const checklist = checklistResponse.checklist;
        summary.style.display = 'block';

        // Update score
        scoreEl.textContent = `${checklist.score}%`;

        // Show step progress if multi-step
        if (checklist.stepInfo && checklist.stepInfo.isMultiStep) {
          stepProgress.style.display = 'block';
          stepValue.textContent = `${checklist.stepInfo.current} / ${checklist.stepInfo.total}`;
          const percent = (checklist.stepInfo.current / checklist.stepInfo.total) * 100;
          stepBar.style.width = `${percent}%`;
          checklistActions.style.display = 'flex';
        } else {
          stepProgress.style.display = 'none';
          checklistActions.style.display = 'none';
        }

        // Render checklist items
        checklistItems.innerHTML = checklist.items.map(item => {
          const icon = item.status === 'passed' ? '✓' :
            item.status === 'failed' ? '✗' :
              item.status === 'warning' ? '!' : '−';
          return `
            <li class="${item.status}">
              <span class="icon">${icon}</span>
              <span class="label">${item.label}</span>
              <span class="details" title="${item.details}">${item.details}</span>
            </li>
          `;
        }).join('');

        // Show ready/not ready status
        if (checklist.ready) {
          this.showToast('Ready to submit! ✓', 'success');
        } else if (!checklist.allPassed) {
          this.showToast('Some checks need attention', 'warning');
        }

      } else {
        // Fall back to legacy validation
        const response = await this.sendMessageWithRetry({ type: 'VALIDATE_FORM' });
        if (!response?.success) throw new Error(response?.error || 'Validation failed');

        const issues = response.report?.issues || [];
        summary.style.display = 'block';
        stepProgress.style.display = 'none';
        checklistActions.style.display = 'none';

        // Update score if available
        if (response.report?.score !== undefined) {
          scoreEl.textContent = `${response.report.score}%`;
        }

        if (issues.length === 0) {
          checklistItems.innerHTML = `
            <li class="passed">
              <span class="icon">✓</span>
              <span class="label">All required checks passed</span>
              <span class="details">Ready to submit</span>
            </li>
          `;
        } else {
          checklistItems.innerHTML = issues.map(issue => `
            <li class="failed">
              <span class="icon">✗</span>
              <span class="label">${issue}</span>
            </li>
          `).join('');
        }

        // Show warnings if any
        const warnings = response.report?.warnings || [];
        if (warnings.length > 0) {
          checklistItems.innerHTML += warnings.map(warning => `
            <li class="warning">
              <span class="icon">!</span>
              <span class="label">${warning}</span>
            </li>
          `).join('');
        }
      }
    } catch (error) {
      console.error('Validation error:', error);
      this.showToast('Could not validate form', 'error');
    }
  }

  /**
   * Advance to next step in multi-step form
   */
  async advanceStep() {
    try {
      const response = await this.sendMessageWithRetry({ type: 'advance_step' });

      if (response?.success) {
        this.showToast('Advanced to next step', 'success');
        // Re-validate to update UI
        await this.validateForm();
      } else {
        this.showToast(response?.error || 'Could not advance', 'error');
      }
    } catch (error) {
      this.showToast('Error advancing step', 'error');
    }
  }

  /**
   * Get step info for multi-step tracking
   */
  async getStepInfo() {
    try {
      const response = await this.sendMessageWithRetry({ type: 'get_step_info' });
      return response?.stepInfo || null;
    } catch (error) {
      console.log('Could not get step info:', error.message);
      return null;
    }
  }

  /**
   * Display match score in the popup
   */
  displayMatchScore(matchResult) {
    const matchCard = document.getElementById('matchCard');
    if (!matchResult || matchResult.score === 0) {
      matchCard.style.display = 'none';
      return;
    }

    matchCard.style.display = 'block';

    // Update circular progress
    const progressBar = document.getElementById('matchProgressBar');
    const percentEl = document.getElementById('matchPercent');
    const labelEl = document.getElementById('matchLabel');

    const circumference = 283; // 2 * PI * 45
    const offset = circumference - (matchResult.score / 100) * circumference;

    progressBar.style.strokeDashoffset = offset;
    progressBar.style.stroke = this.getScoreColor(matchResult.score);

    percentEl.textContent = matchResult.score;
    labelEl.textContent = this.getScoreLabel(matchResult.score);

    // Update breakdown bars
    const breakdown = matchResult.breakdown || {};

    document.getElementById('skillsBar').style.width = `${breakdown.skills || 0}%`;
    document.getElementById('skillsValue').textContent = `${breakdown.skills || 0}%`;

    document.getElementById('experienceBar').style.width = `${breakdown.experience || 0}%`;
    document.getElementById('experienceValue').textContent = `${breakdown.experience || 0}%`;

    document.getElementById('educationBar').style.width = `${breakdown.education || 0}%`;
    document.getElementById('educationValue').textContent = `${breakdown.education || 0}%`;

    // Update skill tags
    const matchedSkillsTags = document.getElementById('matchedSkillsTags');
    const missingSkillsTags = document.getElementById('missingSkillsTags');

    if (matchResult.matchedSkills?.length > 0) {
      matchedSkillsTags.innerHTML = matchResult.matchedSkills
        .slice(0, 8)
        .map(skill => `<span class="skill-tag">${skill}</span>`)
        .join('');
    } else {
      matchedSkillsTags.innerHTML = '<span class="skill-tag">No matches found</span>';
    }

    if (matchResult.missingSkills?.length > 0) {
      missingSkillsTags.innerHTML = matchResult.missingSkills
        .slice(0, 5)
        .map(skill => `<span class="skill-tag">${skill}</span>`)
        .join('');
    } else {
      missingSkillsTags.innerHTML = '<span class="skill-tag">All matched!</span>';
    }
  }

  /**
   * Get score color based on percentage
   */
  getScoreColor(score) {
    if (score >= 85) return '#10b981'; // Green
    if (score >= 70) return '#22c55e'; // Light green
    if (score >= 50) return '#f59e0b'; // Yellow
    if (score >= 30) return '#f97316'; // Orange
    return '#ef4444'; // Red
  }

  /**
   * Get score label based on percentage
   */
  getScoreLabel(score) {
    if (score >= 85) return 'Excellent Match';
    if (score >= 70) return 'Good Match';
    if (score >= 50) return 'Moderate';
    if (score >= 30) return 'Stretch Role';
    return 'Low Match';
  }

  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
      toast.className = 'toast';
    }, 3000);
  }

  truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    // Less than 1 hour
    if (diff < 3600000) {
      return 'Just now';
    }
    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }
    // Less than 7 days
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days}d ago`;
    }

    return date.toLocaleDateString();
  }
}

// Add spinning animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    .spin {
        animation: spin 1s linear infinite;
    }
`;
document.head.appendChild(style);

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});

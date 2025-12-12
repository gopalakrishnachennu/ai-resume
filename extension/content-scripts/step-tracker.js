// Step Tracker - Multi-step form progress tracking with session persistence
// Remembers answers across steps and sessions for repeating questions

const StepTracker = {
    // Current tracking state
    state: {
        platform: null,
        sessionId: null,
        currentStep: 0,
        totalSteps: 0,
        startTime: null,
        answers: new Map(),
        stepHistory: []
    },

    // Storage key prefix
    STORAGE_KEY: 'jobfiller_step_tracker',

    /**
     * Initialize tracker for a new application session
     * @param {Object} platform - Platform configuration
     */
    async init(platform) {
        this.state.platform = platform?.name || 'Unknown';
        this.state.sessionId = this.generateSessionId();
        this.state.startTime = Date.now();
        this.state.currentStep = 0;
        this.state.totalSteps = 0;
        this.state.stepHistory = [];

        // Load saved answers from storage
        await this.loadSavedAnswers();

        console.log(`[JobFiller] StepTracker initialized for ${this.state.platform}`);
    },

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        const url = window.location.hostname + window.location.pathname;
        const timestamp = Date.now();
        return `${url}_${timestamp}`.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 100);
    },

    /**
     * Update step information
     * @param {Object} stepInfo - Step data from ATS handler
     */
    updateStep(stepInfo) {
        const previousStep = this.state.currentStep;
        this.state.currentStep = stepInfo.current || 1;
        this.state.totalSteps = stepInfo.total || this.state.totalSteps;

        // Record step transition
        if (previousStep !== this.state.currentStep) {
            this.state.stepHistory.push({
                from: previousStep,
                to: this.state.currentStep,
                timestamp: Date.now()
            });
        }

        // Broadcast step update
        this.broadcastProgress();
    },

    /**
     * Record an answer for potential reuse
     * @param {string} questionKey - Normalized question identifier
     * @param {string} answer - The answer provided
     * @param {Object} metadata - Additional context
     */
    recordAnswer(questionKey, answer, metadata = {}) {
        const normalizedKey = this.normalizeQuestionKey(questionKey);

        this.state.answers.set(normalizedKey, {
            answer,
            metadata,
            timestamp: Date.now(),
            platform: this.state.platform,
            step: this.state.currentStep
        });

        // Save to persistent storage
        this.saveAnswers();
    },

    /**
     * Get a previously recorded answer
     * @param {string} questionKey - Question to look up
     * @returns {Object|null} Saved answer if found
     */
    getAnswer(questionKey) {
        const normalizedKey = this.normalizeQuestionKey(questionKey);
        return this.state.answers.get(normalizedKey) || null;
    },

    /**
     * Find best matching answer for a question
     * @param {string} question - The question text
     * @returns {Object|null} Best matching answer
     */
    findMatchingAnswer(question) {
        const normalizedQuestion = this.normalizeQuestionKey(question);

        // Exact match
        if (this.state.answers.has(normalizedQuestion)) {
            return this.state.answers.get(normalizedQuestion);
        }

        // Fuzzy match - find similar questions
        const questionWords = normalizedQuestion.split(/\s+/).filter(w => w.length > 3);
        let bestMatch = null;
        let bestScore = 0;

        this.state.answers.forEach((value, key) => {
            const keyWords = key.split(/\s+/).filter(w => w.length > 3);
            const matchCount = questionWords.filter(qw =>
                keyWords.some(kw => kw.includes(qw) || qw.includes(kw))
            ).length;

            const score = matchCount / Math.max(questionWords.length, keyWords.length);

            if (score > 0.6 && score > bestScore) {
                bestScore = score;
                bestMatch = value;
            }
        });

        return bestMatch;
    },

    /**
     * Normalize question text for consistent matching
     */
    normalizeQuestionKey(question) {
        return question
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 200);
    },

    /**
     * Save answers to Chrome storage
     */
    async saveAnswers() {
        try {
            const data = {};
            this.state.answers.forEach((value, key) => {
                data[key] = value;
            });

            await chrome.storage.local.set({
                [this.STORAGE_KEY]: {
                    answers: data,
                    lastUpdated: Date.now()
                }
            });
        } catch (error) {
            console.error('[JobFiller] Error saving answers:', error);
        }
    },

    /**
     * Load saved answers from Chrome storage
     */
    async loadSavedAnswers() {
        try {
            const result = await chrome.storage.local.get(this.STORAGE_KEY);
            const stored = result[this.STORAGE_KEY];

            if (stored?.answers) {
                Object.entries(stored.answers).forEach(([key, value]) => {
                    // Only load answers from last 30 days
                    if (Date.now() - value.timestamp < 30 * 24 * 60 * 60 * 1000) {
                        this.state.answers.set(key, value);
                    }
                });
                console.log(`[JobFiller] Loaded ${this.state.answers.size} saved answers`);
            }
        } catch (error) {
            console.error('[JobFiller] Error loading saved answers:', error);
        }
    },

    /**
     * Get progress information
     * @returns {Object} Progress data
     */
    getProgress() {
        const elapsed = this.state.startTime ? Date.now() - this.state.startTime : 0;

        return {
            platform: this.state.platform,
            currentStep: this.state.currentStep,
            totalSteps: this.state.totalSteps,
            percentComplete: this.state.totalSteps > 0
                ? Math.round((this.state.currentStep / this.state.totalSteps) * 100)
                : 0,
            elapsedTime: elapsed,
            elapsedFormatted: this.formatDuration(elapsed),
            stepsCompleted: this.state.stepHistory.length,
            savedAnswers: this.state.answers.size
        };
    },

    /**
     * Format duration in human-readable format
     */
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    },

    /**
     * Broadcast progress update to popup/UI
     */
    broadcastProgress() {
        const progress = this.getProgress();

        // Send to popup via runtime message
        try {
            chrome.runtime.sendMessage({
                type: 'STEP_PROGRESS_UPDATE',
                progress
            }).catch(() => {
                // Popup might not be open
            });
        } catch (e) {
            // Extension context may not be available
        }

        // Also dispatch as custom event for in-page listeners
        document.dispatchEvent(new CustomEvent('jobfiller-progress', {
            detail: progress
        }));
    },

    /**
     * Create progress overlay element
     * @returns {HTMLElement} Progress overlay
     */
    createProgressOverlay() {
        // Remove existing overlay
        const existing = document.getElementById('jf-step-progress');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'jf-step-progress';
        overlay.innerHTML = `
            <div class="jf-progress-content">
                <div class="jf-progress-header">
                    <span class="jf-progress-title">JobFiller Progress</span>
                    <button class="jf-progress-close" aria-label="Close">×</button>
                </div>
                <div class="jf-progress-body">
                    <div class="jf-progress-step">
                        <span class="jf-step-label">Step</span>
                        <span class="jf-step-value" id="jf-step-display">0 / 0</span>
                    </div>
                    <div class="jf-progress-bar-container">
                        <div class="jf-progress-bar" id="jf-progress-bar" style="width: 0%"></div>
                    </div>
                    <div class="jf-progress-time">
                        <span class="jf-time-label">Time</span>
                        <span class="jf-time-value" id="jf-time-display">0s</span>
                    </div>
                </div>
            </div>
        `;

        // Inject styles
        this.injectStyles();

        // Add close button handler
        overlay.querySelector('.jf-progress-close').addEventListener('click', () => {
            overlay.style.display = 'none';
        });

        document.body.appendChild(overlay);
        return overlay;
    },

    /**
     * Update progress overlay
     */
    updateProgressOverlay() {
        const overlay = document.getElementById('jf-step-progress');
        if (!overlay) return;

        const progress = this.getProgress();

        const stepDisplay = overlay.querySelector('#jf-step-display');
        const progressBar = overlay.querySelector('#jf-progress-bar');
        const timeDisplay = overlay.querySelector('#jf-time-display');

        if (stepDisplay) stepDisplay.textContent = `${progress.currentStep} / ${progress.totalSteps || '?'}`;
        if (progressBar) progressBar.style.width = `${progress.percentComplete}%`;
        if (timeDisplay) timeDisplay.textContent = progress.elapsedFormatted;
    },

    /**
     * Show progress overlay
     */
    showProgress() {
        let overlay = document.getElementById('jf-step-progress');
        if (!overlay) {
            overlay = this.createProgressOverlay();
        }
        overlay.style.display = 'block';
        this.updateProgressOverlay();

        // Start update interval
        if (!this._progressInterval) {
            this._progressInterval = setInterval(() => {
                this.updateProgressOverlay();
            }, 1000);
        }
    },

    /**
     * Hide progress overlay
     */
    hideProgress() {
        const overlay = document.getElementById('jf-step-progress');
        if (overlay) overlay.style.display = 'none';

        if (this._progressInterval) {
            clearInterval(this._progressInterval);
            this._progressInterval = null;
        }
    },

    /**
     * Inject progress overlay styles
     */
    injectStyles() {
        if (document.getElementById('jf-step-progress-styles')) return;

        const style = document.createElement('style');
        style.id = 'jf-step-progress-styles';
        style.textContent = `
            #jf-step-progress {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 2147483647;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            }

            .jf-progress-content {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 12px;
                padding: 16px;
                min-width: 200px;
                box-shadow: 0 10px 40px rgba(102, 126, 234, 0.4);
                color: white;
            }

            .jf-progress-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }

            .jf-progress-title {
                font-weight: 600;
                font-size: 14px;
            }

            .jf-progress-close {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                opacity: 0.8;
                line-height: 1;
                padding: 0;
            }

            .jf-progress-close:hover {
                opacity: 1;
            }

            .jf-progress-body {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .jf-progress-step {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .jf-step-label, .jf-time-label {
                font-size: 12px;
                opacity: 0.9;
            }

            .jf-step-value, .jf-time-value {
                font-size: 16px;
                font-weight: 600;
            }

            .jf-progress-bar-container {
                height: 6px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 3px;
                overflow: hidden;
            }

            .jf-progress-bar {
                height: 100%;
                background: white;
                border-radius: 3px;
                transition: width 0.3s ease;
            }

            .jf-progress-time {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
        `;
        document.head.appendChild(style);
    },

    /**
     * Clear all saved answers (for privacy)
     */
    async clearSavedAnswers() {
        this.state.answers.clear();
        try {
            await chrome.storage.local.remove(this.STORAGE_KEY);
            console.log('[JobFiller] Cleared all saved answers');
        } catch (error) {
            console.error('[JobFiller] Error clearing answers:', error);
        }
    },

    /**
     * Export saved answers
     * @returns {Object} Exportable answer data
     */
    exportAnswers() {
        const data = {};
        this.state.answers.forEach((value, key) => {
            data[key] = {
                answer: value.answer,
                platform: value.platform,
                lastUsed: new Date(value.timestamp).toISOString()
            };
        });
        return data;
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StepTracker;
}

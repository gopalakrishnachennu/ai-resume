// Notification Banner - Smart Prompt System
// Shows contextual prompts when job forms are detected

class NotificationBanner {
    constructor() {
        this.banner = null;
        this.isVisible = false;
        this.currentAnalysis = null;
        this.predictionSummary = null;
        this.onFillCallback = null;
        this.onReviewCallback = null;
        this.onDismissCallback = null;
        this.onChecklistCallback = null;
    }

    /**
     * Initialize the banner
     */
    init(onFillCallback, onReviewCallback = null, onDismissCallback = null, onChecklistCallback = null) {
        this.onFillCallback = onFillCallback;
        this.onReviewCallback = onReviewCallback;
        this.onDismissCallback = onDismissCallback;
        this.onChecklistCallback = onChecklistCallback;
        this.createBanner();
    }

    /**
     * Create the banner DOM element
     */
    createBanner() {
        // Remove existing banner
        const existing = document.getElementById('jf-notification-banner');
        if (existing) existing.remove();

        // Create banner container
        this.banner = document.createElement('div');
        this.banner.id = 'jf-notification-banner';
        this.banner.className = 'jf-banner jf-banner-hidden';

        this.banner.innerHTML = `
            <div class="jf-banner-content">
                <!-- Left: Work Auth Guard Badge (prominent) -->
                <div class="jf-guard-section" id="jf-guard-section">
                    <div class="jf-guard-indicator" id="jf-guard-indicator">
                        <span class="jf-guard-icon" id="jf-guard-icon">✓</span>
                        <div class="jf-guard-info">
                            <span class="jf-guard-status" id="jf-guard-status">Eligible</span>
                            <span class="jf-guard-detail" id="jf-guard-detail">No restrictions</span>
                        </div>
                    </div>
                </div>

                <!-- Divider -->
                <div class="jf-banner-divider"></div>

                <!-- Center: Main content -->
                <div class="jf-banner-main">
                    <div class="jf-banner-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                        </svg>
                    </div>
                    <div class="jf-banner-message">
                        <span class="jf-banner-title">JobFiller Pro</span>
                        <span class="jf-banner-subtitle" id="jf-banner-subtitle">Ready to auto-fill</span>
                    </div>
                    <div class="jf-banner-prediction" id="jf-banner-prediction" style="display:none;">
                        <span class="jf-prediction-badge" id="jf-pred-badge">5 fields</span>
                    </div>
                    <div class="jf-checklist-pill" id="jf-checklist-pill" style="display:none;">
                        <span class="jf-checklist-score" id="jf-checklist-score">0%</span>
                        <span class="jf-checklist-label">Checklist</span>
                    </div>
                </div>

                <!-- Right: Actions -->
                <div class="jf-banner-actions">
                    <button class="jf-banner-btn jf-banner-btn-primary" id="jf-banner-fill">
                        Quick Fill
                    </button>
                    <button class="jf-banner-btn jf-banner-btn-secondary" id="jf-banner-checklist">
                        Checklist
                    </button>
                    <button class="jf-banner-btn jf-banner-btn-secondary" id="jf-banner-review" style="display:none;">
                        Review
                    </button>
                    <button class="jf-banner-btn jf-banner-btn-icon" id="jf-banner-close" title="Dismiss">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="jf-banner-progress" id="jf-banner-progress">
                <div class="jf-banner-progress-bar"></div>
            </div>
        `;

        document.body.appendChild(this.banner);
        this.attachEventListeners();
    }

    /**
     * Attach event listeners to banner buttons
     */
    attachEventListeners() {
        // Quick Fill button
        const fillBtn = document.getElementById('jf-banner-fill');
        if (fillBtn) {
            fillBtn.addEventListener('click', () => {
                this.handleFill();
            });
        }

        // Review First button
        const reviewBtn = document.getElementById('jf-banner-review');
        if (reviewBtn) {
            reviewBtn.addEventListener('click', () => {
                this.handleReview();
            });
        }

        // Checklist button
        const checklistBtn = document.getElementById('jf-banner-checklist');
        if (checklistBtn) {
            checklistBtn.addEventListener('click', () => {
                this.handleChecklist();
            });
        }

        // Later button
        const laterBtn = document.getElementById('jf-banner-later');
        if (laterBtn) {
            laterBtn.addEventListener('click', () => {
                this.hide();
            });
        }

        // Close button - dismisses and remembers
        const closeBtn = document.getElementById('jf-banner-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.dismiss();
            });
        }
    }

    /**
     * Handle Review First button click
     */
    handleReview() {
        if (this.onReviewCallback) {
            this.onReviewCallback(this.predictionSummary);
        }
        this.hide();
    }

    /**
     * Handle Checklist button click
     */
    handleChecklist() {
        if (this.onChecklistCallback) {
            this.onChecklistCallback();
        }
    }

    /**
     * Update prediction summary display
     * @param {Object} summary - Prediction summary from engine
     */
    updatePredictions(summary) {
        this.predictionSummary = summary;

        const predEl = document.getElementById('jf-banner-prediction');
        const highEl = document.getElementById('jf-pred-high');
        const medEl = document.getElementById('jf-pred-medium');
        const confEl = document.getElementById('jf-pred-confidence');
        const reviewBtn = document.getElementById('jf-banner-review');

        if (!predEl || !summary) return;

        predEl.style.display = 'flex';

        if (highEl) highEl.textContent = `${summary.high || 0} auto`;
        if (medEl) medEl.textContent = `${summary.needsReview || 0} review`;
        if (confEl) confEl.textContent = summary.averageConfidence ?
            `(${summary.averageConfidence}% confidence)` : '';

        // Show review button if there are medium/low confidence predictions
        if (reviewBtn && summary.needsReview > 0) {
            reviewBtn.style.display = 'flex';
        }
    }

    /**
     * Update work authorization guard badge (left section)
     * @param {Object} guardStatus - Status from WorkAuthGuard
     */
    updateGuardBadge(guardStatus) {
        const guardSection = document.getElementById('jf-guard-section');
        const guardIcon = document.getElementById('jf-guard-icon');
        const guardStatusEl = document.getElementById('jf-guard-status');
        const guardDetail = document.getElementById('jf-guard-detail');
        const fillBtn = document.getElementById('jf-banner-fill');

        if (!guardSection || !guardStatus) return;

        const states = {
            green: { icon: '✓', text: 'Eligible', class: '' },
            yellow: { icon: '⚠', text: 'Check', class: 'guard-yellow' },
            red: { icon: '⛔', text: 'Blocked', class: 'guard-red' }
        };

        const state = states[guardStatus.status] || states.green;

        // Update guard section
        guardSection.className = `jf-guard-section ${state.class}`;
        if (guardIcon) guardIcon.textContent = state.icon;
        if (guardStatusEl) guardStatusEl.textContent = state.text;
        if (guardDetail) {
            guardDetail.textContent = guardStatus.reason || 'No restrictions';
            guardDetail.title = guardStatus.reason || '';
        }

        // Update fill button state based on guard
        if (fillBtn) {
            if (guardStatus.status === 'red') {
                fillBtn.disabled = true;
                fillBtn.textContent = 'Ineligible';
                fillBtn.title = guardStatus.reason || 'Work authorization requirement detected';
                fillBtn.classList.add('jf-btn-blocked');
            } else if (guardStatus.status === 'yellow') {
                fillBtn.disabled = false;
                fillBtn.textContent = 'Quick Fill ⚠';
                fillBtn.title = guardStatus.reason || 'Check requirements';
                fillBtn.classList.remove('jf-btn-blocked');
            } else {
                fillBtn.disabled = false;
                fillBtn.textContent = 'Quick Fill';
                fillBtn.title = '';
                fillBtn.classList.remove('jf-btn-blocked');
            }
        }

        // Update banner class for visual feedback
        if (guardStatus.status === 'red') {
            this.banner.classList.add('jf-banner-blocked');
        } else {
            this.banner.classList.remove('jf-banner-blocked');
        }
    }

    /**
     * Show checklist readiness status
     * @param {Object} checklist
     */
    showChecklistStatus(checklist) {
        const pill = document.getElementById('jf-checklist-pill');
        const score = document.getElementById('jf-checklist-score');
        const subtitle = document.getElementById('jf-banner-subtitle');
        const progress = document.getElementById('jf-banner-progress');
        const progressBar = this.banner?.querySelector('.jf-banner-progress-bar');

        if (!pill || !score) return;

        const percent = Math.min(Math.max(checklist?.score || 0, 0), 100);
        score.textContent = `${percent}%`;
        pill.style.display = 'flex';

        if (subtitle && checklist) {
            subtitle.textContent = checklist.ready ? 'Checklist: Ready to submit' : 'Checklist: Needs attention';
        }

        if (progress && progressBar) {
            progress.style.display = 'block';
            progressBar.style.width = `${percent}%`;
        }
    }

    /**
     * Show blocked state with override option
     */
    showBlocked(reason, onOverride) {
        this.banner.className = 'jf-banner jf-banner-error jf-banner-blocked';
        this.updateContent({
            title: '⛔ Likely ineligible',
            subtitle: reason || 'Work authorization requirement detected',
            showFillButton: false
        });

        // Add override button
        const actionsDiv = this.banner.querySelector('.jf-banner-actions');
        if (actionsDiv) {
            const overrideBtn = document.createElement('button');
            overrideBtn.className = 'jf-banner-btn jf-banner-btn-secondary';
            overrideBtn.textContent = 'Apply Anyway';
            overrideBtn.onclick = () => {
                if (onOverride) onOverride();
                this.hide();
            };
            actionsDiv.insertBefore(overrideBtn, actionsDiv.firstChild);
        }

        this.banner.classList.remove('jf-banner-hidden');
        this.banner.classList.add('jf-banner-visible');
        this.isVisible = true;
    }

    /**
     * Show with form detection info from smart monitor
     * @param {Object} formInfo - Form info from SmartMonitor
     */
    showFromSmartMonitor(formInfo) {
        if (!this.banner) this.createBanner();

        this.currentAnalysis = formInfo;

        this.banner.className = 'jf-banner jf-banner-success';
        this.updateContent({
            title: `🚀 Form ready to fill!`,
            subtitle: `Found ${formInfo.fieldCount} fields • ${formInfo.emptyCount} empty`,
            showFillButton: true,
            fillButtonText: 'Quick Fill'
        });

        // Show the banner with animation
        this.banner.classList.remove('jf-banner-hidden');
        this.banner.classList.add('jf-banner-visible');
        this.isVisible = true;
    }

    /**
     * Show the banner based on analysis
     * @param {Object} analysis - Page analysis result
     */
    async show(analysis) {
        if (!this.banner) this.createBanner();

        this.currentAnalysis = analysis;

        // Check if dismissed
        const isDismissed = await PageAnalyzer.isDismissed();
        if (isDismissed) {
            Utils.log('Form was previously dismissed, not showing banner');
            return;
        }

        // Check if profile exists
        const result = await chrome.storage.local.get('userProfile');
        if (!result.userProfile) {
            this.showNoProfile();
            return;
        }

        // Update banner based on form status
        switch (analysis.formStatus) {
            case PageAnalyzer.FORM_STATUS.FILLABLE:
                this.showFillable(analysis);
                break;
            case PageAnalyzer.FORM_STATUS.PARTIAL:
                this.showPartial(analysis);
                break;
            case PageAnalyzer.FORM_STATUS.UNFILLABLE:
                this.showUnfillable(analysis);
                break;
            default:
                return; // Don't show for no form
        }

        // Show the banner
        this.banner.classList.remove('jf-banner-hidden');
        this.banner.classList.add('jf-banner-visible');
        this.isVisible = true;
    }

    /**
     * Show fillable form state
     */
    showFillable(analysis) {
        this.banner.className = 'jf-banner jf-banner-success';
        this.updateContent({
            icon: 'check',
            title: '📝 Job form detected!',
            subtitle: `Ready to fill ${analysis.fillableCount} fields with your profile`,
            showFillButton: true,
            fillButtonText: 'Quick Fill'
        });
    }

    /**
     * Show partial match state
     */
    showPartial(analysis) {
        this.banner.className = 'jf-banner jf-banner-warning';
        const unfillable = analysis.fieldCount - analysis.fillableCount;
        this.updateContent({
            icon: 'alert',
            title: `⚠️ Found ${analysis.fieldCount} fields`,
            subtitle: `Can fill ${analysis.fillableCount}, ${unfillable} need manual entry`,
            showFillButton: true,
            fillButtonText: 'Fill Available'
        });
    }

    /**
     * Show unfillable state
     */
    showUnfillable(analysis) {
        this.banner.className = 'jf-banner jf-banner-error';
        this.updateContent({
            icon: 'x',
            title: '❌ Unable to auto-fill this form',
            subtitle: 'Fields don\'t match your profile data',
            showFillButton: false
        });
    }

    /**
     * Show no profile state
     */
    showNoProfile() {
        this.banner.className = 'jf-banner jf-banner-info';
        this.updateContent({
            icon: 'user',
            title: '👤 No profile loaded',
            subtitle: 'Import your profile to enable auto-fill',
            showFillButton: false,
            showImportButton: true
        });

        // Show the banner
        this.banner.classList.remove('jf-banner-hidden');
        this.banner.classList.add('jf-banner-visible');
        this.isVisible = true;
    }

    /**
     * Update banner content
     */
    updateContent({ title, subtitle, showFillButton, fillButtonText, showImportButton }) {
        const titleEl = this.banner.querySelector('.jf-banner-title');
        const subtitleEl = this.banner.querySelector('.jf-banner-subtitle');
        const fillBtn = document.getElementById('jf-banner-fill');
        const laterBtn = document.getElementById('jf-banner-later');

        if (titleEl) titleEl.textContent = title;
        if (subtitleEl) subtitleEl.textContent = subtitle;

        if (fillBtn) {
            if (showFillButton) {
                fillBtn.style.display = 'flex';
                fillBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                    ${fillButtonText || 'Quick Fill'}
                `;
            } else if (showImportButton) {
                fillBtn.style.display = 'flex';
                fillBtn.textContent = 'Import Profile';
                fillBtn.onclick = () => {
                    chrome.runtime.openOptionsPage();
                    this.hide();
                };
            } else {
                fillBtn.style.display = 'none';
            }
        }

        if (laterBtn) {
            laterBtn.style.display = showFillButton ? 'flex' : 'none';
        }
    }

    /**
     * Handle fill button click
     */
    async handleFill() {
        if (!this.onFillCallback) return;

        const fillBtn = document.getElementById('jf-banner-fill');
        if (fillBtn) {
            fillBtn.disabled = true;
            fillBtn.innerHTML = `
                <svg class="jf-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                </svg>
                Filling...
            `;
        }

        // Show progress bar
        this.showProgress(0);

        try {
            const result = await this.onFillCallback();

            if (result.success) {
                this.showSuccess(result);
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError(error.message);
        }
    }

    /**
     * Show progress
     */
    showProgress(percent) {
        const progressEl = document.getElementById('jf-banner-progress');
        const barEl = progressEl?.querySelector('.jf-banner-progress-bar');

        if (progressEl && barEl) {
            progressEl.style.display = 'block';
            barEl.style.width = `${percent}%`;
        }
    }

    /**
     * Show success state
     */
    showSuccess(result) {
        this.banner.className = 'jf-banner jf-banner-success';
        this.updateContent({
            title: '✅ Form filled successfully!',
            subtitle: `Filled ${result.filledCount || 0} fields. Please review before submitting.`,
            showFillButton: false
        });

        // Hide progress
        const progressEl = document.getElementById('jf-banner-progress');
        if (progressEl) progressEl.style.display = 'none';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hide();
        }, 5000);
    }

    /**
     * Show error state
     */
    showError(message) {
        this.banner.className = 'jf-banner jf-banner-error';
        this.updateContent({
            title: '❌ Error filling form',
            subtitle: message || 'Something went wrong. Try using manual mode.',
            showFillButton: false
        });

        const fillBtn = document.getElementById('jf-banner-fill');
        if (fillBtn) {
            fillBtn.disabled = false;
        }

        // Hide progress
        const progressEl = document.getElementById('jf-banner-progress');
        if (progressEl) progressEl.style.display = 'none';
    }

    /**
     * Hide the banner (temporary)
     */
    hide() {
        if (!this.banner) return;

        this.banner.classList.remove('jf-banner-visible');
        this.banner.classList.add('jf-banner-hidden');
        this.isVisible = false;
    }

    /**
     * Dismiss the banner (permanent for this page)
     */
    async dismiss() {
        this.hide();
        await PageAnalyzer.dismiss();
        Utils.log('Form dismissed, won\'t show again for this page');
    }

    /**
     * Remove the banner from DOM
     */
    destroy() {
        if (this.banner) {
            this.banner.remove();
            this.banner = null;
        }
        this.isVisible = false;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationBanner;
}

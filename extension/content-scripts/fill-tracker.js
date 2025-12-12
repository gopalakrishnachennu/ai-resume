// Fill Tracker - Real-time Progress Indicator
// Shows fill progress and field status

class FillTracker {
    constructor() {
        this.tracker = null;
        this.isVisible = false;
        this.fields = null;
        this.filledCount = 0;
        this.totalCount = 0;
    }

    /**
     * Create the tracker widget
     */
    create() {
        // Remove existing
        const existing = document.getElementById('jf-fill-tracker');
        if (existing) existing.remove();

        this.tracker = document.createElement('div');
        this.tracker.id = 'jf-fill-tracker';
        this.tracker.className = 'jf-tracker jf-tracker-hidden';

        this.tracker.innerHTML = `
            <div class="jf-tracker-header">
                <div class="jf-tracker-logo">
                    <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                        <rect width="32" height="32" rx="6" fill="url(#jfGrad)"/>
                        <defs>
                            <linearGradient id="jfGrad" x1="0" y1="0" x2="32" y2="32">
                                <stop offset="0%" stop-color="#667eea"/>
                                <stop offset="100%" stop-color="#764ba2"/>
                            </linearGradient>
                        </defs>
                        <path d="M16 8L22 12V20L16 24L10 20V12L16 8Z" fill="white"/>
                    </svg>
                    <span>JobFiller Pro</span>
                </div>
                <div class="jf-tracker-percent" id="jf-tracker-percent">0%</div>
            </div>
            <div class="jf-tracker-progress">
                <div class="jf-tracker-progress-bar" id="jf-tracker-bar"></div>
            </div>
            <div class="jf-tracker-stats" id="jf-tracker-stats">
                <span class="jf-tracker-count"><span id="jf-filled-count">0</span>/<span id="jf-total-count">0</span> fields</span>
            </div>
            <div class="jf-tracker-categories" id="jf-tracker-categories"></div>
            <button class="jf-tracker-close" id="jf-tracker-close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;

        document.body.appendChild(this.tracker);

        // Close button
        document.getElementById('jf-tracker-close').addEventListener('click', () => {
            this.hide();
        });

        // Inject styles if not already present
        this.injectStyles();
    }

    /**
     * Inject tracker styles
     */
    injectStyles() {
        if (document.getElementById('jf-tracker-styles')) return;

        const style = document.createElement('style');
        style.id = 'jf-tracker-styles';
        style.textContent = `
            .jf-tracker {
                position: fixed;
                bottom: 100px;
                right: 24px;
                width: 280px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                font-size: 14px;
                z-index: 2147483646;
                overflow: hidden;
                transition: all 0.3s ease;
            }
            
            .jf-tracker-hidden {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
                pointer-events: none;
            }
            
            .jf-tracker-visible {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
            
            .jf-tracker-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            
            .jf-tracker-logo {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
                font-size: 13px;
            }
            
            .jf-tracker-percent {
                font-size: 20px;
                font-weight: 700;
            }
            
            .jf-tracker-progress {
                height: 4px;
                background: #e5e7eb;
            }
            
            .jf-tracker-progress-bar {
                height: 100%;
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                width: 0%;
                transition: width 0.3s ease;
            }
            
            .jf-tracker-stats {
                padding: 12px 16px;
                font-size: 13px;
                color: #6b7280;
            }
            
            .jf-tracker-count {
                font-weight: 500;
            }
            
            #jf-filled-count {
                color: #10b981;
                font-weight: 600;
            }
            
            .jf-tracker-categories {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                padding: 0 16px 12px;
            }
            
            .jf-tracker-cat {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 500;
            }
            
            .jf-tracker-cat-done {
                background: #d1fae5;
                color: #065f46;
            }
            
            .jf-tracker-cat-partial {
                background: #fef3c7;
                color: #92400e;
            }
            
            .jf-tracker-cat-pending {
                background: #f3f4f6;
                color: #6b7280;
            }
            
            .jf-tracker-close {
                position: absolute;
                top: 8px;
                right: 8px;
                width: 24px;
                height: 24px;
                padding: 0;
                border: none;
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
            }
            
            .jf-tracker-close:hover {
                background: rgba(255, 255, 255, 0.3);
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Show the tracker
     * @param {Object} fields - Detected fields by category
     */
    show(fields) {
        if (!this.tracker) this.create();

        this.fields = fields;
        this.calculateCounts();
        this.updateDisplay();

        this.tracker.classList.remove('jf-tracker-hidden');
        this.tracker.classList.add('jf-tracker-visible');
        this.isVisible = true;
    }

    /**
     * Calculate field counts
     */
    calculateCounts() {
        this.totalCount = 0;
        this.filledCount = 0;
        this.categoryCounts = {};

        const categories = ['personal', 'experience', 'education', 'skills', 'preferences', 'documents'];

        categories.forEach(cat => {
            if (this.fields && this.fields[cat]) {
                const catFields = this.fields[cat];
                const total = catFields.length;
                const filled = catFields.filter(f => f.element && f.element.value).length;

                this.categoryCounts[cat] = { total, filled };
                this.totalCount += total;
                this.filledCount += filled;
            }
        });
    }

    /**
     * Update the display
     */
    updateDisplay() {
        const percent = this.totalCount > 0 ? Math.round((this.filledCount / this.totalCount) * 100) : 0;

        // Update percent
        const percentEl = document.getElementById('jf-tracker-percent');
        if (percentEl) percentEl.textContent = `${percent}%`;

        // Update progress bar
        const barEl = document.getElementById('jf-tracker-bar');
        if (barEl) barEl.style.width = `${percent}%`;

        // Update counts
        const filledEl = document.getElementById('jf-filled-count');
        const totalEl = document.getElementById('jf-total-count');
        if (filledEl) filledEl.textContent = this.filledCount;
        if (totalEl) totalEl.textContent = this.totalCount;

        // Update categories
        const catContainer = document.getElementById('jf-tracker-categories');
        if (catContainer) {
            const categoryNames = {
                personal: 'Personal',
                experience: 'Experience',
                education: 'Education',
                skills: 'Skills',
                preferences: 'Preferences',
                documents: 'Resume'
            };

            catContainer.innerHTML = Object.entries(this.categoryCounts)
                .filter(([_, counts]) => counts.total > 0)
                .map(([cat, counts]) => {
                    let status = 'pending';
                    let icon = '○';

                    if (counts.filled === counts.total) {
                        status = 'done';
                        icon = '✓';
                    } else if (counts.filled > 0) {
                        status = 'partial';
                        icon = '◐';
                    }

                    return `<span class="jf-tracker-cat jf-tracker-cat-${status}">${icon} ${categoryNames[cat] || cat}</span>`;
                }).join('');
        }
    }

    /**
     * Update filled count during fill operation
     * @param {number} filled - Number of fields filled
     * @param {number} total - Total fields
     */
    updateProgress(filled, total) {
        this.filledCount = filled;
        this.totalCount = total;
        this.updateDisplay();
    }

    /**
     * Hide the tracker
     */
    hide() {
        if (!this.tracker) return;

        this.tracker.classList.remove('jf-tracker-visible');
        this.tracker.classList.add('jf-tracker-hidden');
        this.isVisible = false;
    }

    /**
     * Destroy the tracker
     */
    destroy() {
        if (this.tracker) {
            this.tracker.remove();
            this.tracker = null;
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FillTracker;
}

import { FieldInfo } from "../matcher";
import { FillSummary } from "../filler/sequential";

/**
 * Minimalistic Progress Overlay
 * Non-intrusive, bottom-right, never covers form
 */
export class ProgressOverlay {
    private container: HTMLElement | null = null;
    private progressBar: HTMLElement | null = null;
    private statusText: HTMLElement | null = null;
    private countText: HTMLElement | null = null;

    /**
     * Inject overlay styles
     */
    private injectStyles() {
        if (document.getElementById('jf-overlay-styles')) return;

        const style = document.createElement('style');
        style.id = 'jf-overlay-styles';
        style.textContent = `
      /* Progress Widget */
      .jf-progress-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 220px;
        padding: 14px 18px;
        background: rgba(255, 255, 255, 0.97);
        backdrop-filter: blur(10px);
        border-radius: 14px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        z-index: 2147483647;
        transition: all 0.3s ease;
      }

      .jf-progress-widget.jf-minimized {
        width: auto;
        padding: 10px 14px;
      }

      .jf-progress-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
      }

      .jf-progress-icon {
        font-size: 16px;
        animation: jf-spin 1s linear infinite;
      }

      .jf-progress-title {
        font-size: 13px;
        font-weight: 600;
        color: #1a1a1a;
      }

      .jf-progress-count {
        font-size: 12px;
        color: #666;
        margin-left: auto;
      }

      .jf-progress-bar-container {
        height: 4px;
        background: #e8e8e8;
        border-radius: 2px;
        overflow: hidden;
      }

      .jf-progress-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #4CAF50, #8BC34A);
        border-radius: 2px;
        transition: width 0.3s ease;
        width: 0%;
      }

      .jf-progress-status {
        font-size: 11px;
        color: #888;
        margin-top: 8px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* Summary */
      .jf-summary {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #eee;
      }

      .jf-summary-stats {
        display: flex;
        gap: 12px;
        font-size: 11px;
      }

      .jf-stat {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .jf-stat-icon {
        font-size: 12px;
      }

      /* Field Highlights */
      .jf-field-active {
        outline: 2px solid #2196F3 !important;
        outline-offset: 2px;
        animation: jf-pulse 1s ease-in-out infinite;
      }

      .jf-field-success {
        outline: 2px solid #4CAF50 !important;
        outline-offset: 2px;
      }

      .jf-field-failed {
        outline: 2px solid #f44336 !important;
        outline-offset: 2px;
      }

      .jf-field-skipped {
        outline: 2px solid #9E9E9E !important;
        outline-offset: 2px;
      }

      .jf-field-warning {
        outline: 2px solid #FF9800 !important;
        outline-offset: 2px;
      }

      @keyframes jf-pulse {
        0%, 100% { outline-color: #2196F3; }
        50% { outline-color: #64B5F6; }
      }

      @keyframes jf-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
        document.head.appendChild(style);
    }

    /**
     * Show the progress widget
     */
    show() {
        this.injectStyles();

        if (this.container) return;

        this.container = document.createElement('div');
        this.container.className = 'jf-progress-widget';
        this.container.innerHTML = `
      <div class="jf-progress-header">
        <span class="jf-progress-icon">⚡</span>
        <span class="jf-progress-title">Filling...</span>
        <span class="jf-progress-count" id="jf-count">0/0</span>
      </div>
      <div class="jf-progress-bar-container">
        <div class="jf-progress-bar-fill" id="jf-bar"></div>
      </div>
      <div class="jf-progress-status" id="jf-status">Starting...</div>
    `;

        document.body.appendChild(this.container);

        this.progressBar = document.getElementById('jf-bar');
        this.statusText = document.getElementById('jf-status');
        this.countText = document.getElementById('jf-count');
    }

    /**
     * Update progress
     */
    update(current: number, total: number, field: FieldInfo, status: string) {
        if (!this.container) this.show();

        const percent = Math.round((current / total) * 100);

        if (this.progressBar) {
            this.progressBar.style.width = `${percent}%`;
        }

        if (this.countText) {
            this.countText.textContent = `${current}/${total}`;
        }

        if (this.statusText) {
            const label = field.label?.slice(0, 30) || 'Field';
            this.statusText.textContent = `${status}: ${label}...`;
        }
    }

    /**
     * Show completion summary
     */
    showSummary(summary: FillSummary) {
        if (!this.container) return;

        // Update header
        const header = this.container.querySelector('.jf-progress-header');
        if (header) {
            header.innerHTML = `
        <span class="jf-progress-icon" style="animation: none">✅</span>
        <span class="jf-progress-title">Complete!</span>
        <span class="jf-progress-count">${summary.timeMs}ms</span>
      `;
        }

        // Update bar to 100%
        if (this.progressBar) {
            this.progressBar.style.width = '100%';
        }

        // Add summary stats
        if (this.statusText) {
            this.statusText.innerHTML = `
        <div class="jf-summary-stats">
          <span class="jf-stat"><span class="jf-stat-icon">✅</span> ${summary.filled}</span>
          <span class="jf-stat"><span class="jf-stat-icon">⏭️</span> ${summary.skipped}</span>
          <span class="jf-stat"><span class="jf-stat-icon">❌</span> ${summary.failed}</span>
          ${summary.needsUser > 0 ? `<span class="jf-stat"><span class="jf-stat-icon">⚠️</span> ${summary.needsUser}</span>` : ''}
        </div>
      `;
        }

        // Auto-hide after 5 seconds
        setTimeout(() => this.hide(), 5000);
    }

    /**
     * Hide and remove the widget
     */
    hide() {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }

        // Clean up field highlights
        document.querySelectorAll('.jf-field-active, .jf-field-success, .jf-field-failed, .jf-field-skipped, .jf-field-warning')
            .forEach(el => {
                el.classList.remove('jf-field-active', 'jf-field-success', 'jf-field-failed', 'jf-field-skipped', 'jf-field-warning');
            });
    }
}

// Singleton instance
export const overlay = new ProgressOverlay();

// Floating Action Button - anchored + draggable (Y-axis)
// Panel is always attached under the button; styles are inline for isolation.

class FloatingButton {
    constructor() {
        this.platform = null;
        this.profile = null;
        this.detector = null;
        this.filler = null;
        this.depsReady = false;
        this.isOpen = false;

        // drag
        this.isDragging = false;
        this.dragMoved = false;
        this.startY = 0;
        this.startTop = 110;
        this.currentTop = 110;
    }

    async init(platform) {
        this.platform = platform;
        this.injectUI();
        await this.loadProfile();
        this.setupDrag();
        this.setupEvents();
    }

    injectUI() {
        const existing = document.getElementById('jf-fab-shell');
        if (existing) existing.remove();

        const root = document.createElement('div');
        root.id = 'jf-fab-shell';
        root.innerHTML = `
            <style>
                #jf-fab-shell {
                    position: fixed !important;
                    top: ${this.currentTop}px !important;
                    right: 16px !important;
                    z-index: 2147483647 !important;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                    color: #0f172a !important;
                    touch-action: none !important;
                    user-select: none !important;
                }
                #jf-fab-btn {
                    all: unset !important;
                    position: relative !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    gap: 8px !important;
                    padding: 12px 18px !important;
                    border-radius: 22px !important;
                    background: linear-gradient(135deg, #111827 0%, #1f2937 100%) !important;
                    color: #e5e7eb !important;
                    font-weight: 600 !important;
                    box-shadow: 0 12px 30px rgba(0,0,0,0.22) !important;
                    cursor: pointer !important;
                }
                #jf-fab-btn:hover { transform: translateY(-1px) !important; }
                #jf-fab-btn:active { transform: scale(0.98) !important; }
                #jf-fab-badge {
                    position: absolute !important;
                    top: -6px !important;
                    right: -6px !important;
                    min-width: 18px !important;
                    height: 18px !important;
                    padding: 0 6px !important;
                    border-radius: 9px !important;
                    background: #22c55e !important;
                    color: white !important;
                    font-size: 10px !important;
                    font-weight: 700 !important;
                    display: none !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
                #jf-fab-panel {
                    position: absolute !important;
                    top: 64px !important;
                    right: 0 !important;
                    width: 300px !important;
                    background: white !important;
                    border-radius: 16px !important;
                    box-shadow: 0 16px 40px rgba(0,0,0,0.2) !important;
                    overflow: hidden !important;
                    display: none !important;
                }
                #jf-fab-panel.open { display: block !important; }
                .jf-header {
                    background: #0b162a !important;
                    color: white !important;
                    padding: 14px 16px !important;
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                }
                .jf-title { font-weight: 700 !important; font-size: 15px !important; }
                .jf-close {
                    all: unset !important;
                    width: 28px !important; height: 28px !important;
                    display: flex !important; align-items: center !important; justify-content: center !important;
                    border-radius: 8px !important;
                    background: rgba(255,255,255,0.12) !important;
                    cursor: pointer !important;
                    color: white !important;
                    font-size: 18px !important;
                }
                .jf-body { padding: 14px !important; background: #f8fafc !important; }
                .jf-profile {
                    display: flex !important; align-items: center !important; gap: 10px !important;
                    padding: 12px !important; background: white !important;
                    border-radius: 10px !important; box-shadow: inset 0 1px 0 rgba(0,0,0,0.04) !important;
                    margin-bottom: 12px !important;
                }
                .jf-avatar {
                    width: 36px !important; height: 36px !important; border-radius: 50% !important;
                    background: #22c55e !important; color: white !important;
                    display: flex !important; align-items: center !important; justify-content: center !important;
                    font-weight: 700 !important;
                }
                .jf-name { font-weight: 700 !important; color: #0f172a !important; }
                .jf-email { font-size: 12px !important; color: #475569 !important; }
                .jf-actions { display: flex !important; flex-direction: column !important; gap: 8px !important; }
                .jf-btn {
                    all: unset !important;
                    display: flex !important; align-items: center !important; justify-content: center !important;
                    gap: 8px !important; height: 46px !important; border-radius: 12px !important;
                    font-weight: 700 !important; cursor: pointer !important; transition: transform 0.15s, box-shadow 0.15s !important;
                    background: white !important; color: #0f172a !important; box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important;
                }
                .jf-btn.primary { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%) !important; color: white !important; }
                .jf-btn:hover { transform: translateY(-1px) !important; }
                .jf-msg { display: none !important; margin-top: 10px !important; padding: 10px !important; border-radius: 10px !important; text-align: center !important; font-size: 13px !important; }
                .jf-msg.show { display: block !important; }
                .jf-msg.info { background: #e0f2fe !important; color: #075985 !important; }
                .jf-msg.success { background: #dcfce7 !important; color: #166534 !important; }
                .jf-msg.error { background: #fee2e2 !important; color: #991b1b !important; }
            </style>
            <div id="jf-fab-wrap">
                <button id="jf-fab-btn" title="JobFiller Pro">
                    <span aria-hidden="true">⚡</span><span>Fill</span>
                    <span id="jf-fab-badge">0</span>
                </button>
                <div id="jf-fab-panel">
                    <div class="jf-header">
                        <span class="jf-title">JobFiller Pro</span>
                        <button class="jf-close" id="jf-close">×</button>
                    </div>
                    <div class="jf-body">
                        <div class="jf-profile" id="jf-profile">
                            <div class="jf-avatar">✓</div>
                            <div>
                                <div class="jf-name">No profile</div>
                                <div class="jf-email">Import in popup</div>
                            </div>
                        </div>
                        <div class="jf-actions">
                            <button class="jf-btn primary" id="jf-quickfill">⚡ Quick Fill</button>
                            <button class="jf-btn" id="jf-detect">🔍 Detect Fields</button>
                        </div>
                        <div class="jf-msg" id="jf-msg"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(root);
        this.container = root;
    }

    async loadProfile() {
        try {
            const result = await chrome.storage.local.get('userProfile');
            this.profile = result.userProfile;
            this.updateProfileUI();
        } catch (e) { /* noop */ }
    }

    ensureDeps() {
        if (this.depsReady) return true;
        try {
            this.detector = new FormDetector();
            this.detector.init(this.platform);
            this.filler = new FormFiller();
            this.depsReady = true;
            return true;
        } catch {
            return false;
        }
    }

    setupDrag() {
        const wrap = this.container.querySelector('#jf-fab-wrap');
        if (!wrap || !window.FABHelpers) return;

        FABHelpers.makeVerticalDraggable(this.container, {
            minTop: 20,
            maxTop: () => Math.max(80, window.innerHeight - 200),
            onMove: (newTop) => {
                this.dragMoved = true;
                this.currentTop = newTop;
                this.container.style.top = `${newTop}px`;
            }
        });
    }

    setupEvents() {
        const fabBtn = this.container.querySelector('#jf-fab-btn');
        const panel = this.container.querySelector('#jf-fab-panel');
        const closeBtn = this.container.querySelector('#jf-close');
        const quickFillBtn = this.container.querySelector('#jf-quickfill');
        const detectBtn = this.container.querySelector('#jf-detect');

        fabBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.dragMoved) { this.dragMoved = false; return; }
            this.togglePanel();
        });

        closeBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePanel(false);
        });

        quickFillBtn?.addEventListener('click', async (e) => {
            e.stopPropagation();
            await this.quickFill();
        });

        detectBtn?.addEventListener('click', async (e) => {
            e.stopPropagation();
            await this.detectFields();
        });

        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.container.contains(e.target)) {
                this.togglePanel(false);
            }
        });

        // Keep badge off by default
        this.updateBadge(0);
    }

    togglePanel(force) {
        const panel = this.container.querySelector('#jf-fab-panel');
        const anchor = this.container.querySelector('#jf-fab-btn');
        if (!panel) return;
        this.isOpen = force !== undefined ? force : !this.isOpen;
        panel.classList.toggle('open', this.isOpen);
        if (this.isOpen && window.FABHelpers && anchor) {
            FABHelpers.positionPanel(anchor, panel, { gap: 10, flip: true });
        }
    }

    updateProfileUI() {
        const el = this.container.querySelector('#jf-profile');
        if (!el || !this.profile?.personalInfo) return;
        const { firstName, lastName, email } = this.profile.personalInfo;
        el.innerHTML = `
            <div class="jf-avatar">✓</div>
            <div>
                <div class="jf-name">${firstName || ''} ${lastName || ''}</div>
                <div class="jf-email">${email || ''}</div>
            </div>
        `;
    }

    updateBadge(count) {
        const badge = this.container.querySelector('#jf-fab-badge');
        if (!badge) return;
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    showMessage(text, type = 'info') {
        const msg = this.container.querySelector('#jf-msg');
        if (!msg) return;
        msg.textContent = text;
        msg.className = `jf-msg show ${type}`;
        if (type === 'info' || type === 'success') {
            setTimeout(() => msg.classList.remove('show'), 2500);
        }
    }

    async detectFields() {
        this.showMessage('Detecting...', 'info');
        if (!this.ensureDeps()) { this.showMessage('Loading...try again', 'info'); return; }
        try {
            this.detectedFields = this.detector.detectFormFields();
            const summary = this.detector.getSummary();
            const count = summary.metadata?.classifiedFields || 0;
            this.updateBadge(count);
            this.showMessage(`Found ${count} fields`, 'success');
        } catch (e) {
            this.showMessage('Error detecting fields', 'error');
        }
    }

    async quickFill() {
        if (!this.profile) { this.showMessage('Import profile first', 'error'); return; }
        if (!this.ensureDeps()) { this.showMessage('Loading...try again', 'info'); return; }
        await this.detectFields();
        await new Promise(r => setTimeout(r, 150));
        this.showMessage('Filling...', 'info');
        try {
            const result = await this.filler.fillForm(this.profile, this.detectedFields);
            if (result.success) {
                this.showMessage(`Filled ${result.filledCount} fields`, 'success');
            } else {
                this.showMessage('Some fields need review', 'warning');
            }
        } catch (e) {
            this.showMessage('Error filling form', 'error');
        }
    }

    // no-op hooks (compat)
    pulse() {}
    setBlocked() {}
    setStatus() {}
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FloatingButton;
}

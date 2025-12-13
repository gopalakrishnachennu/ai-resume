// Submit Detector - Detects when a job application form is actually submitted
// Implements Option A (button click) + Option C (success page) detection

const SubmitDetector = {
    isSubmitted: false,
    pendingQA: null,
    submitButtonClicked: false,

    // Initialize submit detection
    init: () => {
        SubmitDetector.attachButtonListeners();
        SubmitDetector.watchForSuccessPage();
        SubmitDetector.watchForNavigation();
        console.log('[SubmitDetector] Initialized');
    },

    // Store Q&A data to save after submission
    setPendingQA: (qaData) => {
        SubmitDetector.pendingQA = qaData;
        SubmitDetector.isSubmitted = false;
        SubmitDetector.submitButtonClicked = false;
        console.log('[SubmitDetector] Pending Q&A stored, waiting for submission');
    },

    // Attach click listeners to submit buttons (Option A)
    attachButtonListeners: () => {
        // Common submit button selectors
        const submitSelectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button.submit-button',
            'button.btn-submit',
            'button[data-testid="submit"]',
            'button[data-action="submit"]',
            // LinkedIn
            '.jobs-apply-button',
            '.jobs-easy-apply-modal button[aria-label*="Submit"]',
            'button[aria-label*="Submit application"]',
            // Indeed
            '.indeed-apply-button',
            '#indeedApplyButtonContainer button',
            // Workday
            'button[data-automation-id="bottom-navigation-next-button"]',
            'button[data-automation-id="submit"]',
            // Greenhouse
            '#submit_app',
            'button.btn-submit-job',
            // Lever
            'button.submit-job-application',
            // Generic patterns
            'button:contains("Submit")',
            'button:contains("Apply")',
            'button:contains("Send Application")',
            'input[value*="Submit"]',
            'input[value*="Apply"]'
        ];

        // Text patterns in buttons
        const submitTextPatterns = [
            /submit\s*(application|now)?/i,
            /apply\s*(now)?/i,
            /send\s*application/i,
            /complete\s*application/i,
            /finish\s*(and\s*)?apply/i,
            /confirm\s*(and\s*)?(submit|apply)/i
        ];

        // Use event delegation for dynamic buttons
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button, input[type="submit"], a[role="button"]');
            if (!target) return;

            const isSubmitButton = SubmitDetector.isSubmitButton(target, submitTextPatterns);
            if (isSubmitButton && SubmitDetector.pendingQA) {
                console.log('[SubmitDetector] Submit button clicked!', target.textContent?.trim());
                SubmitDetector.submitButtonClicked = true;

                // Wait a bit for the submission to complete, then check for success
                setTimeout(() => {
                    SubmitDetector.checkAndSave('button_click');
                }, 2000);
            }
        }, true);

        console.log('[SubmitDetector] Button listeners attached');
    },

    // Check if element is a submit button
    isSubmitButton: (element, patterns) => {
        const text = (element.textContent || element.value || '').toLowerCase().trim();
        const ariaLabel = (element.getAttribute('aria-label') || '').toLowerCase();
        const type = element.type?.toLowerCase();
        const className = element.className?.toLowerCase() || '';

        // Check type
        if (type === 'submit') return true;

        // Check class names
        if (className.includes('submit') || className.includes('apply-btn')) return true;

        // Check text patterns
        for (const pattern of patterns) {
            if (pattern.test(text) || pattern.test(ariaLabel)) {
                return true;
            }
        }

        return false;
    },

    // Watch for success page indicators (Option C)
    watchForSuccessPage: () => {
        const successPatterns = [
            /thank\s*you\s*(for\s*)?(applying|your\s*application)/i,
            /application\s*(has\s*been\s*)?(submitted|received|sent)/i,
            /we('ve|\s*have)\s*received\s*your\s*application/i,
            /successfully\s*(submitted|applied)/i,
            /application\s*complete/i,
            /you('ve|\s*have)\s*applied/i,
            /your\s*application\s*is\s*on\s*its\s*way/i,
            /congrat|great\s*job|well\s*done/i
        ];

        // Check for success page content periodically
        const checkInterval = setInterval(() => {
            if (!SubmitDetector.pendingQA || SubmitDetector.isSubmitted) {
                return;
            }

            const bodyText = document.body?.innerText || '';
            const title = document.title || '';

            for (const pattern of successPatterns) {
                if (pattern.test(bodyText) || pattern.test(title)) {
                    console.log('[SubmitDetector] Success page detected!');
                    SubmitDetector.checkAndSave('success_page');
                    clearInterval(checkInterval);
                    break;
                }
            }
        }, 2000);

        // Stop checking after 5 minutes
        setTimeout(() => clearInterval(checkInterval), 300000);
    },

    // Watch for page navigation (form might submit and redirect)
    watchForNavigation: () => {
        // Before unload - if submit was clicked, save immediately
        window.addEventListener('beforeunload', () => {
            if (SubmitDetector.submitButtonClicked && SubmitDetector.pendingQA && !SubmitDetector.isSubmitted) {
                SubmitDetector.saveQA('navigation');
            }
        });

        // Also watch for popstate (SPA navigation)
        window.addEventListener('popstate', () => {
            if (SubmitDetector.submitButtonClicked && SubmitDetector.pendingQA && !SubmitDetector.isSubmitted) {
                setTimeout(() => {
                    SubmitDetector.checkAndSave('popstate');
                }, 1000);
            }
        });
    },

    // Check conditions and save if appropriate
    checkAndSave: (trigger) => {
        if (SubmitDetector.isSubmitted || !SubmitDetector.pendingQA) {
            return;
        }

        // If submit button was clicked or success page detected, save
        if (SubmitDetector.submitButtonClicked || trigger === 'success_page') {
            SubmitDetector.saveQA(trigger);
        }
    },

    // Save Q&A to Firebase
    saveQA: async (trigger) => {
        if (SubmitDetector.isSubmitted) return;

        const qaData = SubmitDetector.pendingQA;
        if (!qaData) return;

        SubmitDetector.isSubmitted = true;
        console.log('[SubmitDetector] Saving Q&A, trigger:', trigger);

        try {
            // Add submission trigger info
            qaData.submissionTrigger = trigger;
            qaData.submittedAt = new Date().toISOString();

            // Save via background script
            const result = await chrome.runtime.sendMessage({
                type: 'SAVE_APPLICATION_QA',
                data: qaData
            });

            if (result?.success) {
                console.log('[SubmitDetector] Q&A saved successfully!');
                SubmitDetector.showSavedNotification();
            }

            // Also save locally as backup
            if (typeof QACapture !== 'undefined') {
                await QACapture.saveToLocal(qaData);
            }

            // Clear pending data
            SubmitDetector.pendingQA = null;
        } catch (error) {
            console.error('[SubmitDetector] Save error:', error);
        }
    },

    // Show "Saved" notification to user
    showSavedNotification: () => {
        const notification = document.createElement('div');
        notification.id = 'jf-saved-notification';
        notification.innerHTML = `
      <div style="
        position: fixed;
        bottom: 80px;
        right: 20px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideIn 0.3s ease;
      ">
        <span style="font-size: 24px;">✅</span>
        <div>
          <div style="font-weight: 600;">Application Saved!</div>
          <div style="font-size: 12px; opacity: 0.9;">Review in dashboard when you get an interview call</div>
        </div>
      </div>
      <style>
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
    `;
        document.body.appendChild(notification);

        // Remove after 5 seconds
        setTimeout(() => notification.remove(), 5000);
    },

    // Manual save trigger (Option B fallback)
    manualSave: async () => {
        if (!SubmitDetector.pendingQA) {
            console.log('[SubmitDetector] No pending Q&A to save');
            return { success: false, error: 'No pending data' };
        }

        await SubmitDetector.saveQA('manual');
        return { success: true };
    },

    // Check if we have pending unsaved Q&A
    hasPendingQA: () => {
        return !!SubmitDetector.pendingQA && !SubmitDetector.isSubmitted;
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SubmitDetector;
}

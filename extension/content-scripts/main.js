// Main Content Script - Entry point for job application pages
// Initializes all components and coordinates form detection/filling with auto-detection

const MESSAGE_TYPES = {
    FILL_FORM: 'fill_form',
    DETECT_FORM: 'detect_form',
    FORM_DETECTED: 'form_detected',
    FORM_FILLED: 'form_filled',
    QUICK_FILL: 'quick_fill',
    GET_STATUS: 'get_status',
    PRE_SUBMIT_CHECK: 'pre_submit_check',
    GET_STEP_INFO: 'get_step_info',
    ADVANCE_STEP: 'advance_step',
    GET_CHECKLIST: 'get_checklist',
    AI_GENERATE_ANSWER: 'ai_generate_answer',
    ERROR: 'error'
};

// Global instances
let detector = null;
let filler = null;
let floatingButton = null;
let notificationBanner = null;
let fillTracker = null;
let atsHandler = null;
let stepTracker = null;
let smartMonitor = null;
let predictionEngine = null;
let aiAnswerEngine = null;
let currentPlatform = null;
let currentAnalysis = null;
let isInitialized = false;
let settings = {
    autoDetect: true,
    showFloatingButton: true,
    proactiveDetection: true,
    aiAnswerEnabled: true
};

/**
 * Load settings from storage
 */
async function loadSettings() {
    try {
        const result = await chrome.storage.local.get('settings');
        const stored = result.settings || {};
        settings = {
            autoDetect: stored.autoDetect !== false,
            showFloatingButton: stored.showFloatingButton !== false
        };
    } catch (error) {
        Utils.log('Failed to load settings, using defaults', 'warn');
    }
    return settings;
}

/**
 * Initialize the extension on the current page
 */
async function initialize(force = false) {
    if (isInitialized) return;

    try {
        if (!force && settings && settings.autoDetect === false) {
            Utils.log('Auto-detect disabled in settings; awaiting manual trigger');
            return;
        }

        Utils.log('Initializing JobFiller Pro with auto-detection...');

        // Detect platform first
        currentPlatform = PlatformDetector.detect();

        // Analyze the page
        currentAnalysis = PageAnalyzer.analyze();
        Utils.log(`Page analysis: type=${currentAnalysis.pageType}, hasForm=${currentAnalysis.hasForm}`);

        // Don't initialize on sign-in pages
        if (currentAnalysis.pageType === PageAnalyzer.PAGE_TYPES.SIGNIN) {
            Utils.log('Sign-in page detected, skipping initialization');
            return;
        }

        // Initialize core components if on a potential job page
        if (currentPlatform || currentAnalysis.hasForm || currentAnalysis.pageType !== PageAnalyzer.PAGE_TYPES.OTHER) {
            Utils.log(`Platform: ${currentPlatform?.name || 'Generic'}`);

            // Initialize detector and filler
            detector = new FormDetector();
            detector.init(currentPlatform);
            filler = new FormFiller();

            // Initialize ATS handler
            if (typeof ATSHandlers !== 'undefined') {
                ATSHandlers.init(currentPlatform);
                atsHandler = ATSHandlers.getHandler();
            }

            // Initialize step tracker
            if (typeof StepTracker !== 'undefined') {
                await StepTracker.init(currentPlatform);
                stepTracker = StepTracker;
            }

            // Initialize floating button if allowed
            // IMPORTANT: Check if FAB already exists (created by main-fast.js)
            if (settings.showFloatingButton !== false) {
                if (window.__jobfiller_fab__) {
                    // Reuse existing FAB
                    floatingButton = window.__jobfiller_fab__;
                    Utils.log('Using existing FAB from fast init');
                } else if (!document.getElementById('jf-fab-root')) {
                    // Create new FAB only if none exists
                    floatingButton = new FloatingButton();
                    await floatingButton.init(currentPlatform);
                    window.__jobfiller_fab__ = floatingButton;
                }
            }

            // Initialize notification banner with review callback
            notificationBanner = new NotificationBanner();
            notificationBanner.init(
                handleQuickFillFromBanner,
                handleReviewMode,
                handleProactiveDismiss,
                handleChecklistFromBanner
            );

            // Initialize fill tracker
            fillTracker = new FillTracker();

            // Initialize prediction engine
            if (typeof PredictionEngine !== 'undefined') {
                await PredictionEngine.init();
                predictionEngine = PredictionEngine;
            }

            // Initialize smart monitor for proactive detection
            if (typeof SmartMonitor !== 'undefined' && settings.proactiveDetection !== false) {
                SmartMonitor.init(currentPlatform, handleProactiveFormDetection);
                smartMonitor = SmartMonitor;
            }

            // Initialize work authorization guard
            if (typeof WorkAuthGuard !== 'undefined' && settings.workAuthGuard !== false) {
                await WorkAuthGuard.init();

                // Listen for status changes
                window.addEventListener('workAuthStatusChange', (event) => {
                    handleWorkAuthStatusChange(event.detail);
                });
            }

            // Initialize AI Answer Engine
            if (typeof AIAnswerEngine !== 'undefined' && settings.aiAnswerEnabled !== false) {
                await AIAnswerEngine.init();
                aiAnswerEngine = AIAnswerEngine;
                Utils.log('AI Answer Engine initialized:', AIAnswerEngine.getStatus());
            }

            isInitialized = true;

            // Show notification if job form detected
            if (currentAnalysis.suggestedAction !== PageAnalyzer.ACTIONS.NONE) {
                // Show immediately (user preference)
                notificationBanner.show(currentAnalysis);

                // Update guard badge
                if (typeof WorkAuthGuard !== 'undefined') {
                    const guardStatus = WorkAuthGuard.getStatus();
                    notificationBanner.updateGuardBadge(guardStatus);
                }

                // Update floating button badge
                if (floatingButton && currentAnalysis.fillableCount > 0) {
                    floatingButton.updateBadge(currentAnalysis.fillableCount);
                }
            }

            // Start watching for dynamic changes
            startFormMonitor();

            Utils.log('JobFiller Pro initialized with auto-detection!');
        }
    } catch (error) {
        Utils.log('Error initializing: ' + error.message, 'error');
        console.error(error);
    }
}

/**
 * Ensure core objects are initialized (even when auto-detect is off)
 */
async function ensureInitialized(force = false) {
    if (!settings) {
        await loadSettings();
    }
    if (!isInitialized) {
        await initialize(force);
    }
}

/**
 * Handle Quick Fill from the notification banner
 */
async function handleQuickFillFromBanner() {
    try {
        // Get profile from storage
        const result = await chrome.storage.local.get('userProfile');
        const profile = result.userProfile;

        if (!profile) {
            return { success: false, error: 'No profile found' };
        }

        // Detect fields
        const fields = detector.detectFormFields();

        // Show fill tracker
        fillTracker.show(fields);

        // Fill form with progress updates
        const fillResult = await filler.fillForm(profile, fields);

        // Update tracker with final result
        fillTracker.updateProgress(fillResult.filledCount, fillResult.totalFields);

        // Learn from filled values for future predictions
        if (predictionEngine) {
            fields.forEach(field => {
                const el = field.element;
                if (el && el.value) {
                    predictionEngine.learn(
                        el.name || el.id || '',
                        el.value,
                        { platform: currentPlatform?.id }
                    );
                }
            });
        }

        // Save to history
        await saveApplicationToHistory(fillResult);

        return {
            success: fillResult.success,
            filledCount: fillResult.filledCount
        };
    } catch (error) {
        Utils.log('Quick fill error: ' + error.message, 'error');
        return { success: false, error: error.message };
    }
}

/**
 * Handle checklist request from banner
 */
async function handleChecklistFromBanner() {
    try {
        await ensureInitialized(true);

        if (typeof ValidationEngine === 'undefined') {
            notificationBanner?.showChecklistStatus({
                score: 0,
                ready: false,
                items: [],
                message: 'Validation engine not available'
            });
            return { success: false, error: 'Validation engine not available' };
        }

        const container = detector?.getFormContainer?.() || document;
        const checklist = ValidationEngine.buildChecklist(container);

        notificationBanner?.showChecklistStatus(checklist);
        return { success: true, checklist };
    } catch (error) {
        Utils.log('Checklist error: ' + error.message, 'error');
        notificationBanner?.showChecklistStatus({
            score: 0,
            ready: false,
            items: [],
            message: 'Checklist failed'
        });
        return { success: false, error: error.message };
    }
}

/**
 * Handle proactive form detection from SmartMonitor
 * @param {Object} formInfo - Form info from smart monitor
 */
async function handleProactiveFormDetection(formInfo) {
    Utils.log(`Proactive detection: ${formInfo.fieldCount} fields, source: ${formInfo.source}`);

    // Get profile to check if we can fill
    const result = await chrome.storage.local.get('userProfile');
    const profile = result.userProfile;

    if (!profile) {
        Utils.log('No profile for proactive fill');
        return;
    }

    // Generate predictions if engine available
    let predictions = [];
    if (predictionEngine && formInfo.fieldCount > 0) {
        // Detect fields for prediction
        if (!detector) {
            detector = new FormDetector();
            detector.init(currentPlatform);
        }

        const fields = detector.detectFormFields();

        // Get JD context if available
        let jdContext = {};
        if (typeof JDMatcher !== 'undefined') {
            const jd = JDMatcher.extractJobDescription();
            if (jd) {
                jdContext = {
                    jobTitle: jd.title,
                    company: jd.company,
                    jdKeywords: jd.skills || []
                };
            }
        }

        predictions = predictionEngine.predict(fields, profile, jdContext);
        const summary = predictionEngine.getSummary();

        // Update banner with predictions
        if (notificationBanner) {
            notificationBanner.showFromSmartMonitor(formInfo);
            notificationBanner.updatePredictions(summary);
        }
    } else {
        // Show banner without predictions
        if (notificationBanner) {
            notificationBanner.showFromSmartMonitor(formInfo);
        }
    }

    // Pulse floating button
    if (floatingButton) {
        floatingButton.pulse();
        floatingButton.updateBadge(formInfo.fillableCount || formInfo.fieldCount);
    }
}

/**
 * Handle review mode - shows predictions before filling
 * @param {Object} predictionSummary - Summary from prediction engine
 */
function handleReviewMode(predictionSummary) {
    Utils.log('Review mode triggered', predictionSummary);

    // Could open extension popup or show a detailed overlay
    // For now, pulse the floating button to encourage opening popup
    if (floatingButton) {
        floatingButton.pulse();
    }
}

/**
 * Handle dismissal from proactive detection
 */
function handleProactiveDismiss() {
    if (smartMonitor) {
        smartMonitor.dismiss();
    }
}

/**
 * Handle work authorization status change
 * @param {Object} status - Status from WorkAuthGuard
 */
function handleWorkAuthStatusChange(status) {
    Utils.log(`Work Auth Status changed: ${status.status}`, status.reason);

    // Update notification banner badge
    if (notificationBanner && notificationBanner.isVisible) {
        notificationBanner.updateGuardBadge(status);
    }

    // If blocked, show blocked banner
    if (status.status === 'red' && currentAnalysis?.hasForm) {
        if (notificationBanner) {
            notificationBanner.showBlocked(status.reason, () => {
                WorkAuthGuard.override();
                // Log to skipped jobs
                WorkAuthGuard.logSkippedJob(status.reason);
            });
        }

        // Also log for history
        WorkAuthGuard.logSkippedJob(status.reason);
    }

    // Update floating button visual
    if (floatingButton) {
        if (status.status === 'red') {
            floatingButton.setBlocked(true);
        } else {
            floatingButton.setBlocked(false);
        }
    }
}

/**
 * Start monitoring for dynamic form changes
 */
function startFormMonitor() {
    let lastFieldCount = currentAnalysis?.fieldCount || 0;
    let debounceTimer = null;

    const observer = new MutationObserver((mutations) => {
        // Debounce to avoid too many checks
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            // Check if significant DOM changes occurred
            const significantChange = mutations.some(m =>
                m.addedNodes.length > 0 &&
                Array.from(m.addedNodes).some(n =>
                    n.nodeType === 1 &&
                    (n.tagName === 'FORM' || n.tagName === 'INPUT' || n.tagName === 'SELECT' ||
                        n.querySelector?.('input, select, textarea'))
                )
            );

            if (significantChange) {
                handleDOMChange();
            }
        }, 500);
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    Utils.log('Form monitor started');
}

/**
 * Handle DOM changes (for SPAs)
 */
function handleDOMChange() {
    // Re-analyze page
    const newAnalysis = PageAnalyzer.analyze();

    // Check if form appeared or changed
    if (newAnalysis.hasForm && !currentAnalysis?.hasForm) {
        Utils.log('New form detected!');
        currentAnalysis = newAnalysis;

        // Show notification
        if (notificationBanner && newAnalysis.suggestedAction !== PageAnalyzer.ACTIONS.NONE) {
            notificationBanner.show(newAnalysis);
        }

        // Update floating button
        if (floatingButton && newAnalysis.fillableCount > 0) {
            floatingButton.updateBadge(newAnalysis.fillableCount);
            floatingButton.pulse();
        }
    } else if (newAnalysis.fieldCount !== currentAnalysis?.fieldCount) {
        Utils.log(`Field count changed: ${currentAnalysis?.fieldCount} -> ${newAnalysis.fieldCount}`);
        currentAnalysis = newAnalysis;

        // Update floating button badge
        if (floatingButton && newAnalysis.fillableCount > 0) {
            floatingButton.updateBadge(newAnalysis.fillableCount);
        }
    }
}

/**
 * Save application to history
 */
async function saveApplicationToHistory(fillResult) {
    try {
        const application = {
            url: window.location.href,
            title: document.title,
            platform: currentPlatform?.name || 'Unknown',
            fieldsFilled: fillResult.filledCount,
            totalFields: fillResult.totalFields,
            appliedAt: new Date().toISOString()
        };

        const result = await chrome.storage.local.get('applicationHistory');
        const history = result.applicationHistory || [];
        history.unshift(application);

        // Keep last 100
        if (history.length > 100) history.splice(100);

        await chrome.storage.local.set({ applicationHistory: history });

        // Update stats
        const statsResult = await chrome.storage.local.get('stats');
        const stats = statsResult.stats || { fieldsFilled: 0 };
        stats.fieldsFilled = (stats.fieldsFilled || 0) + fillResult.filledCount;
        await chrome.storage.local.set({ stats });
    } catch (error) {
        Utils.log('Error saving to history: ' + error.message, 'error');
    }
}

/**
 * Handle messages from popup or background script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    Utils.log(`Received message: ${message.type}`);

    switch (message.type) {
        case MESSAGE_TYPES.DETECT_FORM:
            handleDetectForm(sendResponse);
            return true;

        case MESSAGE_TYPES.FILL_FORM:
            handleFillForm(message.data, sendResponse);
            return true;

        case MESSAGE_TYPES.QUICK_FILL:
            handleQuickFill(sendResponse);
            return true;

        case MESSAGE_TYPES.GET_STATUS:
            handleGetStatus(sendResponse);
            return true;

        case 'GET_MATCH_SCORE':
            handleGetMatchScore(message.profile, sendResponse);
            return true;

        case 'GENERATE_ANSWER':
            handleGenerateAnswer(message.question, message.options, sendResponse);
            return true;

        case 'SAVE_ANSWER':
            handleSaveAnswer(message.entry, sendResponse);
            return true;

        case 'GET_ANSWER_LIBRARY':
            handleGetAnswerLibrary(sendResponse);
            return true;

        case 'VALIDATE_FORM':
            handleValidateForm(sendResponse);
            return true;

        case 'INSERT_ANSWER':
            handleInsertAnswer(message.text, sendResponse);
            return true;

        case MESSAGE_TYPES.PRE_SUBMIT_CHECK:
            handlePreSubmitCheck(sendResponse);
            return true;

        case MESSAGE_TYPES.GET_STEP_INFO:
            handleGetStepInfo(sendResponse);
            return true;

        case MESSAGE_TYPES.ADVANCE_STEP:
            handleAdvanceStep(sendResponse);
            return true;

        case MESSAGE_TYPES.GET_CHECKLIST:
            handleGetChecklist(sendResponse);
            return true;

        case MESSAGE_TYPES.AI_GENERATE_ANSWER:
            handleAIGenerateAnswer(message.question, message.context, sendResponse);
            return true;

        default:
            sendResponse({ success: false, error: 'Unknown message type' });
    }
});

/**
 * Handle form detection request
 */
async function handleDetectForm(sendResponse) {
    try {
        await ensureInitialized(true);
        if (!detector) {
            detector = new FormDetector();
            detector.init(currentPlatform);
        }

        const fields = detector.detectFormFields();
        const summary = detector.getSummary();

        sendResponse({
            success: true,
            fields: fields,
            summary: summary
        });
    } catch (error) {
        Utils.log(`Error detecting form: ${error.message}`, 'error');
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Handle form filling request
 */
async function handleFillForm(data, sendResponse) {
    try {
        await ensureInitialized(true);
        if (!filler) {
            filler = new FormFiller();
        }

        const { profile, fields } = data;

        // Show tracker
        if (fillTracker) {
            fillTracker.show(fields);
        }

        const result = await filler.fillForm(profile, fields);

        // Update tracker
        if (fillTracker) {
            fillTracker.updateProgress(result.filledCount, result.totalFields);
        }

        // Save to history
        await saveApplicationToHistory(result);

        const validation = runValidationReport();

        sendResponse({
            success: result.success,
            filledCount: result.filledCount,
            summary: filler.getSummary(),
            validation
        });
    } catch (error) {
        Utils.log(`Error filling form: ${error.message}`, 'error');
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Handle quick fill (detect + fill)
 */
async function handleQuickFill(sendResponse) {
    try {
        await ensureInitialized(true);
        const result = await handleQuickFillFromBanner();

        sendResponse({
            success: result.success,
            detected: detector?.getSummary(),
            filled: {
                ...result,
                validation: runValidationReport()
            }
        });
    } catch (error) {
        Utils.log(`Error with quick fill: ${error.message}`, 'error');
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Handle status request
 */
function handleGetStatus(sendResponse) {
    sendResponse({
        success: true,
        isInitialized,
        platform: currentPlatform?.name || 'Unknown',
        pageType: currentAnalysis?.pageType,
        hasForm: currentAnalysis?.hasForm,
        fieldCount: currentAnalysis?.fieldCount,
        fillableCount: currentAnalysis?.fillableCount
    });
}

/**
 * Generate AI answer based on JD + profile
 */
async function handleGenerateAnswer(question, options, sendResponse) {
    try {
        await ensureInitialized(true);
        const profileResult = await chrome.storage.local.get('userProfile');
        const profile = profileResult.userProfile;

        const result = AnswerAssistant.generate(question || '', profile, options || {});
        sendResponse({ success: true, ...result });
    } catch (error) {
        Utils.log(`Error generating answer: ${error.message}`, 'error');
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Save answer to local library
 */
async function handleSaveAnswer(entry, sendResponse) {
    try {
        const saved = await AnswerAssistant.saveToLibrary(entry);
        sendResponse({ success: true, saved });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Get answer library
 */
async function handleGetAnswerLibrary(sendResponse) {
    try {
        const library = await AnswerAssistant.getLibrary();
        sendResponse({ success: true, library });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Handle AI-powered answer generation
 */
async function handleAIGenerateAnswer(question, context, sendResponse) {
    try {
        if (!aiAnswerEngine) {
            // Fallback to pattern-based generation
            if (typeof AIAnswerEngine !== 'undefined') {
                await AIAnswerEngine.init();
                aiAnswerEngine = AIAnswerEngine;
            } else {
                sendResponse({ success: false, error: 'AI engine not available' });
                return;
            }
        }

        // Get user profile for context
        const result = await chrome.storage.local.get('userProfile');
        const profile = result.userProfile || {};

        // Get JD context if available
        let jdContext = context || {};
        if (typeof JDMatcher !== 'undefined' && !jdContext.jobTitle) {
            const jd = JDMatcher.extractJobDescription();
            if (jd) {
                jdContext = {
                    ...jdContext,
                    jobTitle: jd.title,
                    company: jd.company,
                    jdKeywords: jd.skills || []
                };
            }
        }

        // Generate answer
        const answer = await aiAnswerEngine.generateAnswer(question, {
            profile,
            ...jdContext
        });

        sendResponse({
            success: true,
            answer: answer.answer,
            provider: answer.provider,
            confidence: answer.confidence,
            fromCache: answer.fromCache || false
        });
    } catch (error) {
        Utils.log(`Error generating AI answer: ${error.message}`, 'error');
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Validate current form for required fields and basic formatting
 */
function handleValidateForm(sendResponse) {
    try {
        // Use enhanced validation engine if available
        if (typeof ValidationEngine !== 'undefined') {
            const container = detector?.getFormContainer?.() || document;
            const report = ValidationEngine.validate(container);
            ValidationEngine.highlightIssues(report);

            // Convert to legacy format for compatibility
            const legacyReport = {
                issues: report.issues.map(i => i.message),
                ok: report.ok,
                timestamp: report.timestamp,
                score: report.score,
                warnings: report.warnings.map(w => w.message),
                resumeStatus: report.resumeStatus,
                consentBoxes: report.consentBoxes.length
            };
            sendResponse({ success: true, report: legacyReport });
        } else {
            const report = runValidationReport();
            sendResponse({ success: true, report });
        }
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Handle pre-submit checklist request
 */
function handlePreSubmitCheck(sendResponse) {
    try {
        if (typeof ValidationEngine === 'undefined') {
            sendResponse({ success: false, error: 'Validation engine not available' });
            return;
        }

        const container = detector?.getFormContainer?.() || document;
        const checklist = ValidationEngine.buildChecklist(container);

        sendResponse({ success: true, checklist });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Handle step info request for multi-step forms
 */
function handleGetStepInfo(sendResponse) {
    try {
        let stepInfo = { current: 1, total: 1, isMultiStep: false };

        if (atsHandler && typeof atsHandler.getStepInfo === 'function') {
            stepInfo = atsHandler.getStepInfo();
        }

        // Update step tracker
        if (stepTracker) {
            stepTracker.updateStep(stepInfo);
        }

        sendResponse({
            success: true,
            stepInfo,
            platform: currentPlatform?.name || 'Generic',
            progress: stepTracker?.getProgress() || null
        });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Handle advance to next step
 */
async function handleAdvanceStep(sendResponse) {
    try {
        if (!atsHandler || typeof atsHandler.advanceStep !== 'function') {
            sendResponse({ success: false, error: 'Step advancement not supported for this platform' });
            return;
        }

        const advanced = await atsHandler.advanceStep();

        // Get updated step info
        const stepInfo = atsHandler.getStepInfo();
        if (stepTracker) {
            stepTracker.updateStep(stepInfo);
        }

        sendResponse({
            success: advanced,
            stepInfo,
            progress: stepTracker?.getProgress() || null
        });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Handle get checklist request
 */
function handleGetChecklist(sendResponse) {
    try {
        if (typeof ValidationEngine === 'undefined') {
            sendResponse({ success: false, error: 'Validation engine not available' });
            return;
        }

        const container = detector?.getFormContainer?.() || document;
        const checklist = ValidationEngine.buildChecklist(container);

        // Add step info if available
        if (atsHandler && typeof atsHandler.getStepInfo === 'function') {
            checklist.stepInfo = atsHandler.getStepInfo();
        }

        sendResponse({ success: true, checklist });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Insert generated answer into the active field
 */
function handleInsertAnswer(text, sendResponse) {
    try {
        const el = document.activeElement;
        if (!el || !(el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.isContentEditable)) {
            sendResponse({ success: false, error: 'No editable field focused' });
            return;
        }

        if (el.isContentEditable) {
            el.innerText = text;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
            Utils.setInputValue(el, text);
        }

        sendResponse({ success: true });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Build validation report
 */
function runValidationReport() {
    const container = detector?.getFormContainer?.() || document;

    // Prefer advanced engine when available for richer signals
    if (typeof ValidationEngine !== 'undefined') {
        const report = ValidationEngine.validate(container);
        return {
            issues: report.issues.map(i => i.message),
            warnings: report.warnings.map(w => w.message),
            ok: report.ok,
            score: report.score,
            timestamp: report.timestamp,
            required: report.requiredFields,
            requiredFilled: report.requiredFilled
        };
    }

    // Fallback legacy validation
    const issues = [];
    const elements = container.querySelectorAll('input, textarea, select');

    elements.forEach(el => {
        const label = Utils.findLabel ? Utils.findLabel(el) : (el.name || el.id || el.placeholder || el.tagName);
        const value = (el.value || '').trim();

        if (el.required && !value && el.type !== 'file') {
            issues.push(`${label || 'Required field'} is empty`);
        }
        if (el.type === 'file' && el.required && el.files && el.files.length === 0) {
            issues.push(`${label || 'File upload'} missing`);
        }
        if (el.type === 'email' && value && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value)) {
            issues.push(`${label || 'Email'} looks invalid`);
        }
        if (el.type === 'tel' && value) {
            const digits = value.replace(/\D/g, '');
            if (digits.length < 8 || digits.length > 16) {
                issues.push(`${label || 'Phone'} format looks off`);
            }
        }
    });

    const startEl = Array.from(elements).find(e => /start/i.test(e.name || e.id || ''));
    const endEl = Array.from(elements).find(e => /end/i.test(e.name || e.id || ''));
    if (startEl && endEl && startEl.value && endEl.value) {
        const start = new Date(startEl.value);
        const end = new Date(endEl.value);
        if (start.toString() !== 'Invalid Date' && end.toString() !== 'Invalid Date' && start > end) {
            issues.push('Start date is after end date');
        }
    }

    return {
        issues,
        ok: issues.length === 0,
        timestamp: Date.now()
    };
}

/**
 * Handle match score request
 */
function handleGetMatchScore(profile, sendResponse) {
    try {
        // Extract job description from page
        const jd = JDMatcher.extractJobDescription();

        if (!jd || !jd.description || jd.description.length < 100) {
            sendResponse({ success: false, error: 'Could not extract job description' });
            return;
        }

        // Calculate match score
        const matchResult = JDMatcher.calculateMatchScore(jd, profile);

        Utils.log(`Match score calculated: ${matchResult.score}%`);

        sendResponse({
            success: true,
            matchResult: matchResult,
            jobDetails: {
                title: jd.title,
                company: jd.company,
                experienceLevel: jd.experienceLevel
            }
        });
    } catch (error) {
        Utils.log(`Error calculating match score: ${error.message}`, 'error');
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Watch for URL changes (for SPAs)
 */
function watchForUrlChanges() {
    let lastUrl = window.location.href;

    const checkUrl = () => {
        if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            Utils.log('URL changed, re-initializing...');

            // Reset state
            isInitialized = false;
            currentAnalysis = null;

            // Hide existing notifications
            if (notificationBanner) notificationBanner.hide();
            if (fillTracker) fillTracker.hide();

            // Re-initialize after a short delay
            setTimeout(() => {
                initialize();
            }, 500);
        }
    };

    // Check periodically
    setInterval(checkUrl, 1000);
}

/**
 * Wait for page to be ready
 */
function waitForPageReady() {
    return new Promise((resolve) => {
        if (document.readyState === 'complete') {
            resolve();
        } else {
            window.addEventListener('load', resolve);
        }
    });
}

// Initialize on page load
(async () => {
    await waitForPageReady();
    await loadSettings();

    // Small delay to ensure all elements are rendered
    setTimeout(async () => {
        await initialize();
        watchForUrlChanges();
    }, 300);
})();

// Log that content script is loaded
Utils.log('JobFiller Pro content script loaded (v2.0 with auto-detection)');

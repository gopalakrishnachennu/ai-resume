/**
 * PlatformAdapter - Abstract base class for ATS-specific handling
 * 
 * EVERY adapter must implement these methods.
 * DOM handling is ISOLATED here - no business logic.
 */
class PlatformAdapter {
    constructor() {
        if (new.target === PlatformAdapter) {
            throw new Error('PlatformAdapter is abstract - cannot instantiate directly');
        }
        this.platformName = 'unknown';
        this.platformId = 'unknown';
        this.selectors = {};
    }

    /**
     * Wait until the form is fully loaded and ready
     * @returns {Promise<boolean>} True if ready, false if timeout
     */
    async waitUntilReady(timeout = 10000) {
        return new Promise((resolve) => {
            const startTime = Date.now();

            const check = () => {
                if (this.isFormReady()) {
                    // Extra wait for React/Angular to settle
                    setTimeout(() => resolve(true), 300);
                } else if (Date.now() - startTime > timeout) {
                    console.log(`[${this.platformName}] Timeout waiting for form`);
                    resolve(false);
                } else {
                    setTimeout(check, 200);
                }
            };
            check();
        });
    }

    /**
     * Check if form is ready (override in subclass)
     */
    isFormReady() {
        return document.querySelector('form') !== null;
    }

    /**
     * Find all question blocks in the current view
     * A "block" is a container with question + input
     * @returns {HTMLElement[]}
     */
    findQuestionBlocks() {
        throw new Error('Not implemented - subclass must override');
    }

    /**
     * Extract a canonical question from a DOM block
     * @param {HTMLElement} block 
     * @returns {CanonicalQuestion}
     */
    extractQuestion(block) {
        throw new Error('Not implemented - subclass must override');
    }

    /**
     * Fill an answer into a question block
     * Handles React, Angular, and vanilla inputs correctly
     * @param {HTMLElement} block 
     * @param {string|boolean|string[]} answer 
     * @returns {Promise<boolean>} Success status
     */
    async fillAnswer(block, answer) {
        throw new Error('Not implemented - subclass must override');
    }

    /**
     * Verify the answer was correctly filled
     * @param {HTMLElement} block 
     * @param {string|boolean|string[]} expectedAnswer 
     * @returns {boolean}
     */
    verify(block, expectedAnswer) {
        throw new Error('Not implemented - subclass must override');
    }

    /**
     * Get step info for multi-step forms
     * @returns {{current: number, total: number, isMultiStep: boolean}}
     */
    getStepInfo() {
        return { current: 1, total: 1, isMultiStep: false };
    }

    /**
     * Advance to next step (for multi-step forms)
     * @returns {Promise<boolean>}
     */
    async advanceStep() {
        return false;
    }

    /**
     * Check if form is on final submission step
     */
    isSubmitStep() {
        const stepInfo = this.getStepInfo();
        return stepInfo.current === stepInfo.total;
    }

    // ========== UTILITY METHODS ==========

    /**
     * Simulate realistic user input for React/Angular controlled inputs
     * @param {HTMLElement} element 
     * @param {string} value 
     * @returns {Promise<boolean>}
     */
    async simulateInput(element, value) {
        if (!element) return false;

        try {
            // Focus the element
            element.focus();
            element.dispatchEvent(new FocusEvent('focus', { bubbles: true }));

            // Small delay for focus handlers
            await this.wait(50);

            // Clear existing value
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype, 'value'
            )?.set || Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype, 'value'
            )?.set;

            if (nativeInputValueSetter) {
                nativeInputValueSetter.call(element, value);
            } else {
                element.value = value;
            }

            // Fire all events React/Angular need
            element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
            element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));

            // Keyboard events
            element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'a' }));
            element.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true, key: 'a' }));
            element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'a' }));

            // Small delay before blur
            await this.wait(50);

            // Blur
            element.blur();
            element.dispatchEvent(new FocusEvent('blur', { bubbles: true }));

            return true;
        } catch (error) {
            console.error(`[${this.platformName}] simulateInput error:`, error);
            return false;
        }
    }

    /**
     * Click an element with proper event simulation
     */
    async simulateClick(element) {
        if (!element) return false;

        try {
            element.focus();
            element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            element.click();
            return true;
        } catch (error) {
            console.error(`[${this.platformName}] simulateClick error:`, error);
            return false;
        }
    }

    /**
     * Wait helper
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Check if element is visible
     */
    isVisible(element) {
        if (!element) return false;

        const style = window.getComputedStyle(element);
        return style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0' &&
            element.offsetParent !== null;
    }

    /**
     * Find closest label for an input
     */
    findLabel(input) {
        if (!input) return null;

        // Check for explicit label
        if (input.id) {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (label) return label;
        }

        // Check parent label
        const parentLabel = input.closest('label');
        if (parentLabel) return parentLabel;

        // Check sibling label
        const container = input.closest('.field, .form-group, .form-field, [class*="field"]');
        if (container) {
            return container.querySelector('label');
        }

        return null;
    }

    /**
     * Fuzzy match option in select/radio
     */
    fuzzyMatchOption(options, targetValue) {
        if (!options || !targetValue) return null;

        const normalized = String(targetValue).toLowerCase().trim();

        // Exact match first
        for (const opt of options) {
            const optText = (typeof opt === 'string' ? opt : opt.text || opt.label || '').toLowerCase();
            const optValue = (typeof opt === 'string' ? opt : opt.value || '').toLowerCase();

            if (optText === normalized || optValue === normalized) {
                return opt;
            }
        }

        // Contains match
        for (const opt of options) {
            const optText = (typeof opt === 'string' ? opt : opt.text || opt.label || '').toLowerCase();

            if (optText.includes(normalized) || normalized.includes(optText)) {
                return opt;
            }
        }

        // Partial word match
        const targetWords = normalized.split(/\s+/);
        for (const opt of options) {
            const optText = (typeof opt === 'string' ? opt : opt.text || opt.label || '').toLowerCase();
            const optWords = optText.split(/\s+/);

            const hasMatch = targetWords.some(tw =>
                optWords.some(ow => ow.includes(tw) || tw.includes(ow))
            );

            if (hasMatch) return opt;
        }

        return null;
    }
}

// Export for content scripts
if (typeof window !== 'undefined') {
    window.PlatformAdapter = PlatformAdapter;
}

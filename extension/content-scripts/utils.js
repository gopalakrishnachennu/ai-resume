// Enhanced Utility functions for content scripts
// Shared helpers for DOM manipulation and field analysis

const Utils = {
    /**
     * Log message with prefix
     * @param {string} message - Message to log
     * @param {string} level - Log level
     */
    log(message, level = 'info') {
        const prefix = '[JobFiller Pro]';
        const timestamp = new Date().toLocaleTimeString();

        switch (level) {
            case 'error':
                console.error(`${prefix} ${timestamp}:`, message);
                break;
            case 'warn':
                console.warn(`${prefix} ${timestamp}:`, message);
                break;
            case 'debug':
                if (localStorage.getItem('jobfiller_debug') === 'true') {
                    console.log(`${prefix} [DEBUG] ${timestamp}:`, message);
                }
                break;
            default:
                console.log(`${prefix} ${timestamp}:`, message);
        }
    },

    /**
     * Find the label associated with an input element
     * @param {HTMLElement} element - Input element
     * @returns {string} Label text
     */
    findLabel(element) {
        // Check for explicit label using 'for' attribute
        if (element.id) {
            const label = document.querySelector(`label[for="${element.id}"]`);
            if (label) return this.cleanText(label.textContent);
        }

        // Check for parent label
        const parentLabel = element.closest('label');
        if (parentLabel) {
            let text = parentLabel.textContent;
            if (element.value) {
                text = text.replace(element.value, '');
            }
            return this.cleanText(text);
        }

        // Check for aria-label
        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel) return ariaLabel;

        // Check for aria-labelledby
        const labelledBy = element.getAttribute('aria-labelledby');
        if (labelledBy) {
            const labelElement = document.getElementById(labelledBy);
            if (labelElement) return this.cleanText(labelElement.textContent);
        }

        // Check for placeholder
        if (element.placeholder) {
            return element.placeholder;
        }

        // Check previous sibling
        const prevSibling = element.previousElementSibling;
        if (prevSibling && ['LABEL', 'SPAN', 'DIV', 'P'].includes(prevSibling.tagName)) {
            return this.cleanText(prevSibling.textContent);
        }

        // Try to find label in wrapper
        const wrapper = element.closest('.field, .form-group, .form-field, [class*="field"]');
        if (wrapper) {
            const wrapperLabel = wrapper.querySelector('label, .label');
            if (wrapperLabel) return this.cleanText(wrapperLabel.textContent);
        }

        return '';
    },

    /**
     * Clean text content
     * @param {string} text - Text to clean
     * @returns {string}
     */
    cleanText(text) {
        if (!text) return '';
        return text.trim().replace(/\s+/g, ' ').replace(/[*:]/g, '').substring(0, 200);
    },

    /**
     * Get all metadata about a form field
     * @param {HTMLElement} element - Input element
     * @returns {Object} Field metadata
     */
    getFieldMetadata(element) {
        return {
            element,
            type: element.type || 'text',
            name: element.name || '',
            id: element.id || '',
            className: element.className || '',
            label: this.findLabel(element),
            placeholder: element.placeholder || '',
            ariaLabel: element.getAttribute('aria-label') || '',
            required: element.required || element.getAttribute('aria-required') === 'true',
            value: element.value || '',
            tagName: element.tagName.toLowerCase()
        };
    },

    /**
     * Check if an element is visible
     * @param {HTMLElement} element - Element to check
     * @returns {boolean}
     */
    isVisible(element) {
        if (!element) return false;

        const style = window.getComputedStyle(element);
        return style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0' &&
            element.offsetParent !== null;
    },

    /**
     * Set value on an input field (works with React/Vue)
     * @param {HTMLElement} element - Input element
     * @param {string} value - Value to set
     */
    setInputValue(element, value) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
        )?.set;

        const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value'
        )?.set;

        if (element.tagName === 'TEXTAREA' && nativeTextAreaValueSetter) {
            nativeTextAreaValueSetter.call(element, value);
        } else if (nativeInputValueSetter) {
            nativeInputValueSetter.call(element, value);
        } else {
            element.value = value;
        }

        // Trigger events for React/Vue/Angular
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true }));
    },

    /**
     * Set value on a select element
     * @param {HTMLSelectElement} element - Select element
     * @param {string} value - Value to set
     * @returns {boolean}
     */
    setSelectValue(element, value) {
        // Try exact match first
        for (let option of element.options) {
            if (option.value === value || option.text === value) {
                element.value = option.value;
                element.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
        }

        // Try case-insensitive match
        const lowerValue = value.toLowerCase();
        for (let option of element.options) {
            if (option.value.toLowerCase() === lowerValue ||
                option.text.toLowerCase() === lowerValue) {
                element.value = option.value;
                element.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
        }

        // Try partial match
        for (let option of element.options) {
            if (option.value.toLowerCase().includes(lowerValue) ||
                option.text.toLowerCase().includes(lowerValue)) {
                element.value = option.value;
                element.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
        }

        return false;
    },

    /**
     * Check or uncheck a checkbox/radio button
     * @param {HTMLInputElement} element - Checkbox/radio element
     * @param {boolean} checked - Whether to check
     */
    setCheckboxValue(element, checked) {
        if (element.checked !== checked) {
            element.checked = checked;
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.dispatchEvent(new Event('click', { bubbles: true }));
        }
    },

    /**
     * Delay execution
     * @param {number} ms - Milliseconds to wait
     * @returns {Promise}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Highlight an element
     * @param {HTMLElement} element - Element to highlight
     * @param {string} color - Highlight color
     */
    highlightElement(element, color = '#10b981') {
        const originalOutline = element.style.outline;
        const originalTransition = element.style.transition;

        element.style.transition = 'outline 0.3s ease';
        element.style.outline = `2px solid ${color}`;
        element.style.outlineOffset = '2px';

        setTimeout(() => {
            element.style.outline = originalOutline;
            element.style.transition = originalTransition;
        }, 2000);
    },

    /**
     * Scroll element into view smoothly
     * @param {HTMLElement} element - Element to scroll to
     */
    scrollToElement(element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    },

    /**
     * Check if text matches any pattern
     * @param {RegExp|Array} patterns - Regex pattern(s)
     * @param {string} text - Text to search
     * @returns {boolean}
     */
    matchesPattern(patterns, text) {
        if (!text) return false;
        const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
        return patternsArray.some(pattern => pattern.test(text));
    },

    /**
     * Format phone number
     * @param {string} phone - Phone number
     * @returns {string}
     */
    formatPhone(phone) {
        if (!phone) return '';

        const digits = phone.replace(/\D/g, '');

        if (digits.length === 10) {
            return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        }

        if (digits.length === 11 && digits[0] === '1') {
            return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
        }

        return phone;
    },

    /**
     * Extract domain from URL
     * @param {string} url - URL
     * @returns {string}
     */
    getDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch {
            return '';
        }
    },

    /**
     * Generate unique ID
     * @returns {string}
     */
    generateId() {
        return `jf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function}
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Deep clone object
     * @param {Object} obj - Object to clone
     * @returns {Object}
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}

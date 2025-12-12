// Enhanced Form Detector - Intelligently detects and classifies form fields
// Works across all major job portals with advanced field recognition

class FormDetector {
    constructor() {
        this.patterns = typeof FieldPatterns !== 'undefined' ? FieldPatterns : {};
        this.platform = null;
        this.detectedFields = null;
    }

    /**
     * Initialize detector with platform info
     * @param {Object} platform - Platform configuration
     */
    init(platform) {
        this.platform = platform;
    }

    /**
     * Detect all form fields on the page
     * @returns {Object} Categorized form fields with metadata
     */
    detectFormFields() {
        Utils.log('Starting form detection...', 'info');

        const fields = {
            personal: [],
            experience: [],
            education: [],
            skills: [],
            preferences: [],
            documents: [],
            demographics: [],
            misc: [],
            other: [],
            resume: [],
            metadata: {
                totalFields: 0,
                classifiedFields: 0,
                platform: this.platform?.name || 'Unknown',
                url: window.location.href,
                timestamp: new Date().toISOString()
            }
        };

        // Get all form elements
        const container = this.getFormContainer();
        const elements = container.querySelectorAll(
            'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), ' +
            'textarea, select'
        );

        Utils.log(`Found ${elements.length} form elements`);

        elements.forEach((element, index) => {
            try {
                // Skip invisible or disabled fields
                if (!this.isValidField(element)) {
                    return;
                }

                // Get field metadata
                const metadata = this.getFieldMetadata(element);

                // Skip if already filled and readonly
                if (element.readOnly && element.value) {
                    return;
                }

                // Classify the field
                const classification = this.classifyField(metadata);
                fields.metadata.totalFields++;

                if (classification) {
                    const fieldInfo = {
                        ...metadata,
                        index,
                        classification: classification.type,
                        category: classification.category,
                        confidence: classification.confidence
                    };

                    // Add to appropriate category
                    const category = fields[classification.category] || fields.other;
                    category.push(fieldInfo);
                    fields.metadata.classifiedFields++;
                } else {
                    fields.other.push({
                        ...metadata,
                        index,
                        classification: 'unknown',
                        category: 'other',
                        confidence: 0
                    });
                }
            } catch (error) {
                Utils.log(`Error processing field: ${error.message}`, 'error');
            }
        });

        // Also detect file upload fields (resume)
        const fileInputs = container.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            const accept = input.accept?.toLowerCase() || '';
            if (accept.includes('pdf') || accept.includes('doc') || accept.includes('resume')) {
                fields.resume.push({
                    element: input,
                    type: 'file',
                    classification: 'resume',
                    category: 'documents'
                });
            }
        });

        this.detectedFields = fields;

        Utils.log(`Detection complete: ${fields.metadata.classifiedFields}/${fields.metadata.totalFields} fields classified`);

        return fields;
    }

    /**
     * Check if a field is valid for processing
     * @param {HTMLElement} element - Form element
     * @returns {boolean}
     */
    isValidField(element) {
        if (!element) return false;

        // Check visibility
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return false;
        }

        // Check if element is in viewport or has been rendered
        if (element.offsetParent === null && element.type !== 'hidden') {
            return false;
        }

        // Check if disabled
        if (element.disabled) {
            return false;
        }

        return true;
    }

    /**
     * Get all metadata about a form field
     * @param {HTMLElement} element - Form element
     * @returns {Object} Field metadata
     */
    getFieldMetadata(element) {
        const label = this.findLabel(element);
        const placeholder = element.placeholder || '';
        const ariaLabel = element.getAttribute('aria-label') || '';
        const ariaDescribedBy = this.getAriaDescription(element);
        const dataAttributes = this.getDataAttributes(element);

        // Combine all text sources for matching
        const allText = [
            element.name,
            element.id,
            label,
            placeholder,
            ariaLabel,
            ariaDescribedBy,
            ...Object.values(dataAttributes)
        ].filter(Boolean).join(' ');

        return {
            element,
            type: element.type || 'text',
            tagName: element.tagName.toLowerCase(),
            name: element.name || '',
            id: element.id || '',
            className: element.className || '',
            label,
            placeholder,
            ariaLabel,
            ariaDescribedBy,
            dataAttributes,
            allText,
            required: element.required || element.getAttribute('aria-required') === 'true',
            value: element.value || '',
            maxLength: element.maxLength || null,
            pattern: element.pattern || null,
            autocomplete: element.autocomplete || ''
        };
    }

    /**
     * Find the label associated with an input element
     * @param {HTMLElement} element - Input element
     * @returns {string} Label text
     */
    findLabel(element) {
        // Try explicit label with 'for' attribute
        if (element.id) {
            const label = document.querySelector(`label[for="${element.id}"]`);
            if (label) return this.cleanText(label.textContent);
        }

        // Try parent label
        const parentLabel = element.closest('label');
        if (parentLabel) {
            // Get text but exclude the input's value if any
            let text = parentLabel.textContent;
            if (element.value) {
                text = text.replace(element.value, '');
            }
            return this.cleanText(text);
        }

        // Try aria-labelledby
        const labelledBy = element.getAttribute('aria-labelledby');
        if (labelledBy) {
            const labelIds = labelledBy.split(' ');
            const texts = labelIds.map(id => {
                const el = document.getElementById(id);
                return el ? el.textContent : '';
            });
            return this.cleanText(texts.join(' '));
        }

        // Try previous sibling
        const prevSibling = element.previousElementSibling;
        if (prevSibling && ['LABEL', 'SPAN', 'DIV', 'P'].includes(prevSibling.tagName)) {
            return this.cleanText(prevSibling.textContent);
        }

        // Try parent's previous sibling
        const parent = element.parentElement;
        if (parent) {
            const parentPrevSibling = parent.previousElementSibling;
            if (parentPrevSibling && ['LABEL', 'SPAN', 'DIV', 'P'].includes(parentPrevSibling.tagName)) {
                return this.cleanText(parentPrevSibling.textContent);
            }
        }

        // Try to find label in field wrapper
        const wrapper = element.closest('.field, .form-group, .form-field, .input-wrapper, [class*="field"]');
        if (wrapper) {
            const wrapperLabel = wrapper.querySelector('label, .label, [class*="label"]');
            if (wrapperLabel) {
                return this.cleanText(wrapperLabel.textContent);
            }
        }

        return '';
    }

    /**
     * Get aria-describedby content
     * @param {HTMLElement} element - Form element
     * @returns {string}
     */
    getAriaDescription(element) {
        const describedBy = element.getAttribute('aria-describedby');
        if (!describedBy) return '';

        const ids = describedBy.split(' ');
        const texts = ids.map(id => {
            const el = document.getElementById(id);
            return el ? el.textContent : '';
        });
        return this.cleanText(texts.join(' '));
    }

    /**
     * Get all data-* attributes
     * @param {HTMLElement} element - Form element
     * @returns {Object}
     */
    getDataAttributes(element) {
        const data = {};
        for (const attr of element.attributes) {
            if (attr.name.startsWith('data-')) {
                data[attr.name] = attr.value;
            }
        }
        return data;
    }

    /**
     * Clean text content
     * @param {string} text - Text to clean
     * @returns {string}
     */
    cleanText(text) {
        return text?.trim().replace(/\s+/g, ' ').replace(/[*:]/g, '').substring(0, 200) || '';
    }

    /**
     * Classify a form field based on patterns
     * @param {Object} metadata - Field metadata
     * @returns {Object|null} Classification result
     */
    classifyField(metadata) {
        let bestMatch = null;
        let highestScore = 0;

        // First check input type for obvious matches
        const typeBasedMatch = this.classifyByInputType(metadata);
        if (typeBasedMatch && typeBasedMatch.confidence > 15) {
            return typeBasedMatch;
        }

        // Check autocomplete attribute
        const autocompleteMatch = this.classifyByAutocomplete(metadata);
        if (autocompleteMatch && autocompleteMatch.confidence > 10) {
            return autocompleteMatch;
        }

        // Check each pattern category
        for (const [fieldType, config] of Object.entries(this.patterns)) {
            if (!config.patterns) continue;

            const score = this.scoreField(metadata, config);
            if (score > highestScore) {
                highestScore = score;
                bestMatch = {
                    type: fieldType,
                    category: config.category || 'other',
                    confidence: score
                };
            }
        }

        // Return if confidence is high enough
        if (highestScore >= 5) {
            return bestMatch;
        }

        return typeBasedMatch || autocompleteMatch || null;
    }

    /**
     * Classify field by input type
     * @param {Object} metadata - Field metadata
     * @returns {Object|null}
     */
    classifyByInputType(metadata) {
        const typeMap = {
            'email': { type: 'email', category: 'personal', confidence: 20 },
            'tel': { type: 'phone', category: 'personal', confidence: 20 },
            'url': { type: 'website', category: 'personal', confidence: 15 }
        };

        if (typeMap[metadata.type]) {
            // Refine URL type based on label
            if (metadata.type === 'url') {
                const text = metadata.allText.toLowerCase();
                if (text.includes('linkedin')) {
                    return { type: 'linkedin', category: 'personal', confidence: 25 };
                }
                if (text.includes('github')) {
                    return { type: 'github', category: 'personal', confidence: 25 };
                }
            }
            return typeMap[metadata.type];
        }

        return null;
    }

    /**
     * Classify field by autocomplete attribute
     * @param {Object} metadata - Field metadata
     * @returns {Object|null}
     */
    classifyByAutocomplete(metadata) {
        const autocompleteMap = {
            'given-name': { type: 'firstName', category: 'personal', confidence: 20 },
            'family-name': { type: 'lastName', category: 'personal', confidence: 20 },
            'name': { type: 'fullName', category: 'personal', confidence: 15 },
            'email': { type: 'email', category: 'personal', confidence: 20 },
            'tel': { type: 'phone', category: 'personal', confidence: 20 },
            'street-address': { type: 'address', category: 'personal', confidence: 15 },
            'address-line1': { type: 'address', category: 'personal', confidence: 15 },
            'address-level2': { type: 'city', category: 'personal', confidence: 15 },
            'address-level1': { type: 'state', category: 'personal', confidence: 15 },
            'postal-code': { type: 'zipCode', category: 'personal', confidence: 15 },
            'country': { type: 'country', category: 'personal', confidence: 15 },
            'url': { type: 'website', category: 'personal', confidence: 10 },
            'organization': { type: 'company', category: 'experience', confidence: 15 },
            'organization-title': { type: 'position', category: 'experience', confidence: 15 }
        };

        if (metadata.autocomplete && autocompleteMap[metadata.autocomplete]) {
            return autocompleteMap[metadata.autocomplete];
        }

        return null;
    }

    /**
     * Score a field against a pattern configuration
     * @param {Object} metadata - Field metadata
     * @param {Object} config - Pattern configuration
     * @returns {number} Confidence score
     */
    scoreField(metadata, config) {
        let score = 0;

        // Check each pattern
        config.patterns.forEach(pattern => {
            // Check all text sources with different weights
            if (pattern.test(metadata.name)) score += 12;
            if (pattern.test(metadata.id)) score += 10;
            if (pattern.test(metadata.label)) score += 10;
            if (pattern.test(metadata.placeholder)) score += 7;
            if (pattern.test(metadata.ariaLabel)) score += 8;
            if (pattern.test(metadata.ariaDescribedBy)) score += 5;
            if (pattern.test(metadata.className)) score += 3;
            if (pattern.test(metadata.allText)) score += 2;

            // Check data attributes
            Object.values(metadata.dataAttributes).forEach(val => {
                if (pattern.test(val)) score += 6;
            });
        });

        // Bonus for matching input type
        if (config.inputTypes && config.inputTypes.includes(metadata.type)) {
            score += 8;
        }

        // Apply priority multiplier
        if (config.priority) {
            score = Math.floor(score * (config.priority / 10));
        }

        return score;
    }

    /**
     * Get form container
     * @returns {HTMLElement}
     */
    getFormContainer() {
        // Try platform-specific selectors first
        if (this.platform?.selectors?.formContainer) {
            // LinkedIn Easy Apply modal
            if (this.platform.id === 'linkedin' && PlatformDetector.isLinkedInEasyApplyOpen()) {
                const modal = document.querySelector('.jobs-easy-apply-modal, .artdeco-modal');
                if (modal) return modal;
            }

            const container = document.querySelector(this.platform.selectors.formContainer);
            if (container) return container;
        }

        // Try common selectors
        const selectors = [
            'form.application-form',
            'form.job-application',
            '.application-form',
            '.job-application-form',
            'form[action*="apply"]',
            'form[action*="application"]',
            '.jobs-easy-apply-modal', // LinkedIn
            '#ia-container', // Indeed
            'form'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) return element;
        }

        return document.body;
    }

    /**
     * Get detected fields summary
     * @returns {Object}
     */
    getSummary() {
        if (!this.detectedFields) return null;

        const summary = {};
        for (const [category, fields] of Object.entries(this.detectedFields)) {
            if (Array.isArray(fields)) {
                summary[category] = fields.length;
            }
        }
        summary.metadata = this.detectedFields.metadata;
        return summary;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormDetector;
}

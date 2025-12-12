// Validation Engine - Advanced form validation with pre-submit checklist
// Provides comprehensive field validation, completion scoring, and consent warnings

const ValidationEngine = {
    // Validation patterns
    patterns: {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phone: /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,6}$/,
        url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
        linkedinUrl: /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub|profile)\/[a-zA-Z0-9_-]+\/?$/,
        githubUrl: /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/,
        portfolioUrl: /^(https?:\/\/)?[\da-z\.-]+\.[a-z\.]{2,6}([\/\w \.-]*)*\/?$/,
        zipCode: /^\d{5}(-\d{4})?$/,
        ssn: /^\d{3}-?\d{2}-?\d{4}$/,
        date: /^\d{4}-\d{2}-\d{2}$/
    },

    // Sensitive field patterns (should not auto-fill)
    sensitivePatterns: [
        /ssn/i, /social.?security/i, /tax.?id/i, /ein/i,
        /bank.?account/i, /routing/i, /credit.?card/i,
        /password/i, /secret/i, /pin/i
    ],

    // Consent-related patterns (warn before auto-checking)
    consentPatterns: [
        /consent/i, /agree/i, /accept/i, /terms/i, /policy/i,
        /acknowledge/i, /authorize/i, /permission/i, /opt.?in/i
    ],

    /**
     * Run comprehensive validation on current form
     * @param {HTMLElement} container - Form container element
     * @returns {Object} Validation report
     */
    validate(container = document) {
        const report = {
            issues: [],
            warnings: [],
            passed: [],
            score: 0,
            totalFields: 0,
            filledFields: 0,
            requiredFields: 0,
            requiredFilled: 0,
            resumeStatus: 'unknown',
            consentBoxes: [],
            timestamp: Date.now()
        };

        const elements = container.querySelectorAll('input, textarea, select');

        elements.forEach(el => {
            if (this.isHidden(el)) return;

            report.totalFields++;
            const label = this.getFieldLabel(el);
            const value = (el.value || '').trim();
            const fieldType = el.type?.toLowerCase() || 'text';

            // Track filled fields
            if (value || (fieldType === 'checkbox' && el.checked)) {
                report.filledFields++;
            }

            // Track required fields
            if (el.required) {
                report.requiredFields++;
                if (value || (fieldType === 'checkbox' && el.checked) || (fieldType === 'file' && el.files?.length > 0)) {
                    report.requiredFilled++;
                }
            }

            // Run specific validations
            this.validateField(el, label, value, fieldType, report);
        });

        // Calculate completion score
        if (report.totalFields > 0) {
            report.score = Math.round((report.filledFields / report.totalFields) * 100);
        }

        // Determine overall status
        report.ok = report.issues.length === 0;
        report.ready = report.ok && report.warnings.length === 0 && report.requiredFilled === report.requiredFields;

        return report;
    },

    /**
     * Validate individual field
     */
    validateField(el, label, value, fieldType, report) {
        const name = (el.name || el.id || '').toLowerCase();
        const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
        const placeholder = (el.placeholder || '').toLowerCase();
        const combined = name + ' ' + ariaLabel + ' ' + placeholder;

        // Required field empty check
        if (el.required && !value && fieldType !== 'file' && fieldType !== 'checkbox') {
            report.issues.push({
                type: 'required',
                field: label,
                message: `${label || 'Required field'} is empty`,
                element: el
            });
        }

        // File upload checks
        if (fieldType === 'file') {
            const hasResume = /resume|cv/i.test(combined);
            if (hasResume) {
                if (el.files?.length > 0) {
                    report.resumeStatus = 'uploaded';
                    report.passed.push({ field: label, message: 'Resume uploaded' });
                } else {
                    report.resumeStatus = 'missing';
                    if (el.required) {
                        report.issues.push({
                            type: 'resume',
                            field: label,
                            message: 'Resume upload required',
                            element: el
                        });
                    } else {
                        report.warnings.push({
                            type: 'resume',
                            field: label,
                            message: 'Resume not uploaded (optional)',
                            element: el
                        });
                    }
                }
            } else if (el.required && el.files?.length === 0) {
                report.issues.push({
                    type: 'file',
                    field: label,
                    message: `${label || 'File'} upload required`,
                    element: el
                });
            }
        }

        // Email validation
        if (fieldType === 'email' || /email/i.test(combined)) {
            if (value && !this.patterns.email.test(value)) {
                report.issues.push({
                    type: 'email',
                    field: label,
                    message: `${label || 'Email'} format is invalid`,
                    element: el
                });
            } else if (value) {
                report.passed.push({ field: label, message: 'Email format valid' });
            }
        }

        // Phone validation
        if (fieldType === 'tel' || /phone|mobile|cell/i.test(combined)) {
            if (value) {
                const digits = value.replace(/\D/g, '');
                if (digits.length < 7 || digits.length > 15) {
                    report.issues.push({
                        type: 'phone',
                        field: label,
                        message: `${label || 'Phone'} number looks invalid`,
                        element: el
                    });
                } else {
                    report.passed.push({ field: label, message: 'Phone format valid' });
                }
            }
        }

        // URL validations
        if (fieldType === 'url' || /url|website|link/i.test(combined)) {
            if (value && !this.patterns.url.test(value)) {
                report.issues.push({
                    type: 'url',
                    field: label,
                    message: `${label || 'URL'} format is invalid`,
                    element: el
                });
            }
        }

        // LinkedIn URL validation
        if (/linkedin/i.test(combined)) {
            if (value && !this.patterns.linkedinUrl.test(value)) {
                report.warnings.push({
                    type: 'linkedin',
                    field: label,
                    message: `${label || 'LinkedIn URL'} may not be valid format`,
                    element: el
                });
            }
        }

        // GitHub URL validation
        if (/github/i.test(combined)) {
            if (value && !this.patterns.githubUrl.test(value)) {
                report.warnings.push({
                    type: 'github',
                    field: label,
                    message: `${label || 'GitHub URL'} may not be valid format`,
                    element: el
                });
            }
        }

        // Consent checkbox detection
        if (fieldType === 'checkbox' && this.consentPatterns.some(p => p.test(combined))) {
            report.consentBoxes.push({
                field: label,
                checked: el.checked,
                element: el
            });
            if (!el.checked && el.required) {
                report.issues.push({
                    type: 'consent',
                    field: label,
                    message: `${label || 'Consent checkbox'} must be checked`,
                    element: el
                });
            }
        }

        // Sensitive field warning
        if (this.sensitivePatterns.some(p => p.test(combined))) {
            report.warnings.push({
                type: 'sensitive',
                field: label,
                message: `${label || 'Field'} contains sensitive data - review manually`,
                element: el
            });
        }
    },

    /**
     * Check date consistency (start before end)
     * @param {HTMLElement} container - Form container
     * @returns {Array} Date-related issues
     */
    validateDates(container = document) {
        const issues = [];
        const dateFields = container.querySelectorAll('input[type="date"], input[type="month"]');
        const fieldMap = new Map();

        dateFields.forEach(field => {
            const name = (field.name || field.id || '').toLowerCase();
            fieldMap.set(name, field);
        });

        // Find start/end pairs
        fieldMap.forEach((startField, startName) => {
            if (/start/i.test(startName)) {
                const endName = startName.replace(/start/i, 'end');
                const endField = fieldMap.get(endName);

                if (endField && startField.value && endField.value) {
                    const startDate = new Date(startField.value);
                    const endDate = new Date(endField.value);

                    if (startDate > endDate) {
                        issues.push({
                            type: 'date',
                            message: 'Start date is after end date',
                            startField: this.getFieldLabel(startField),
                            endField: this.getFieldLabel(endField)
                        });
                    }
                }
            }
        });

        return issues;
    },

    /**
     * Build pre-submit checklist
     * @param {HTMLElement} container - Form container
     * @returns {Object} Checklist with items
     */
    buildChecklist(container = document) {
        const report = this.validate(container);
        const dateIssues = this.validateDates(container);

        const checklist = {
            items: [],
            allPassed: true,
            score: report.score,
            ready: false
        };

        // Required fields check
        checklist.items.push({
            id: 'required',
            label: 'Required fields completed',
            status: report.requiredFilled === report.requiredFields ? 'passed' : 'failed',
            details: `${report.requiredFilled} of ${report.requiredFields} filled`
        });

        // Resume upload check
        if (report.resumeStatus !== 'unknown') {
            checklist.items.push({
                id: 'resume',
                label: 'Resume uploaded',
                status: report.resumeStatus === 'uploaded' ? 'passed' : (report.resumeStatus === 'missing' ? 'warning' : 'skipped'),
                details: report.resumeStatus === 'uploaded' ? 'Resume file attached' : 'No resume file selected'
            });
        }

        // Email/phone format check
        const formatIssues = report.issues.filter(i => ['email', 'phone', 'url'].includes(i.type));
        checklist.items.push({
            id: 'format',
            label: 'Contact info valid',
            status: formatIssues.length === 0 ? 'passed' : 'failed',
            details: formatIssues.length === 0 ? 'Email and phone formats OK' : formatIssues.map(i => i.message).join(', ')
        });

        // Date consistency check
        checklist.items.push({
            id: 'dates',
            label: 'Date ranges valid',
            status: dateIssues.length === 0 ? 'passed' : 'failed',
            details: dateIssues.length === 0 ? 'All date ranges are consistent' : dateIssues.map(i => i.message).join(', ')
        });

        // Consent boxes check
        if (report.consentBoxes.length > 0) {
            const uncheckedRequired = report.consentBoxes.filter(c => !c.checked && c.element?.required);
            checklist.items.push({
                id: 'consent',
                label: 'Required agreements accepted',
                status: uncheckedRequired.length === 0 ? 'passed' : 'failed',
                details: uncheckedRequired.length === 0 ? 'All required consents checked' : `${uncheckedRequired.length} consent(s) need attention`
            });
        }

        // Sensitive fields warning
        const sensitiveWarnings = report.warnings.filter(w => w.type === 'sensitive');
        if (sensitiveWarnings.length > 0) {
            checklist.items.push({
                id: 'sensitive',
                label: 'Sensitive fields review',
                status: 'warning',
                details: `${sensitiveWarnings.length} field(s) contain sensitive data`
            });
        }

        // Calculate overall status
        const failedItems = checklist.items.filter(i => i.status === 'failed');
        checklist.allPassed = failedItems.length === 0;
        checklist.ready = checklist.allPassed && report.score >= 80;

        return checklist;
    },

    /**
     * Get human-readable label for a field
     */
    getFieldLabel(element) {
        // Try explicit label
        if (element.id) {
            const label = document.querySelector(`label[for="${element.id}"]`);
            if (label) return label.textContent.trim();
        }

        // Try parent label
        const parentLabel = element.closest('label');
        if (parentLabel) {
            const text = parentLabel.textContent.replace(element.value || '', '').trim();
            if (text) return text;
        }

        // Try aria-label
        if (element.getAttribute('aria-label')) {
            return element.getAttribute('aria-label');
        }

        // Try placeholder
        if (element.placeholder) {
            return element.placeholder;
        }

        // Try name/id
        const identifier = element.name || element.id;
        if (identifier) {
            // Convert camelCase/snake_case to readable
            return identifier
                .replace(/([A-Z])/g, ' $1')
                .replace(/[_-]/g, ' ')
                .replace(/^\s+/, '')
                .replace(/\s+/g, ' ')
                .trim();
        }

        return 'Field';
    },

    /**
     * Check if element is visible
     */
    isHidden(element) {
        if (!element) return true;
        const style = window.getComputedStyle(element);
        return style.display === 'none' ||
            style.visibility === 'hidden' ||
            style.opacity === '0' ||
            element.offsetParent === null;
    },

    /**
     * Highlight problematic fields
     */
    highlightIssues(report) {
        // Remove previous highlights
        document.querySelectorAll('.jf-validation-error, .jf-validation-warning').forEach(el => {
            el.classList.remove('jf-validation-error', 'jf-validation-warning');
        });

        // Add error highlights
        report.issues.forEach(issue => {
            if (issue.element) {
                issue.element.classList.add('jf-validation-error');
                issue.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });

        // Add warning highlights
        report.warnings.forEach(warning => {
            if (warning.element) {
                warning.element.classList.add('jf-validation-warning');
            }
        });
    },

    /**
     * Inject validation styles if not present
     */
    injectStyles() {
        if (document.getElementById('jf-validation-styles')) return;

        const style = document.createElement('style');
        style.id = 'jf-validation-styles';
        style.textContent = `
            .jf-validation-error {
                border: 2px solid #ef4444 !important;
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2) !important;
            }
            .jf-validation-warning {
                border: 2px solid #f59e0b !important;
                box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2) !important;
            }
            .jf-validation-error:focus,
            .jf-validation-warning:focus {
                outline: none !important;
            }
        `;
        document.head.appendChild(style);
    }
};

// Initialize styles
ValidationEngine.injectStyles();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationEngine;
}

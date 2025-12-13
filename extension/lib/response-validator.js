// Response Validator - Validates AI responses before filling fields
// Catches hallucinations and invalid responses

const ResponseValidator = {
    // Validate a response for a specific field
    validate: (field, value) => {
        if (value === null || value === undefined) {
            return { valid: false, reason: 'null_value' };
        }

        const strValue = String(value).trim();

        // Empty check (unless field allows empty)
        if (strValue === '' && field.required) {
            return { valid: false, reason: 'empty_required' };
        }

        // Select/Radio: Must match an option
        if (field.tagName === 'select') {
            const options = ResponseValidator.getSelectOptions(field.element);
            const matched = ResponseValidator.matchOption(options, strValue);
            if (!matched) {
                return { valid: false, reason: 'invalid_option', options, received: strValue };
            }
            return { valid: true, value: matched };
        }

        if (field.type === 'radio') {
            const options = ResponseValidator.getRadioOptions(field.element);
            const matched = ResponseValidator.matchOption(options, strValue);
            if (!matched) {
                return { valid: false, reason: 'invalid_option', options, received: strValue };
            }
            return { valid: true, value: matched };
        }

        // Length check
        if (field.maxLength && strValue.length > field.maxLength) {
            // Try to truncate intelligently
            const truncated = ResponseValidator.smartTruncate(strValue, field.maxLength);
            return { valid: true, value: truncated, truncated: true };
        }

        // Email format
        if (field.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(strValue)) {
                return { valid: false, reason: 'invalid_email', received: strValue };
            }
        }

        // Phone format
        if (field.type === 'tel') {
            const phoneRegex = /^[\d\s\-\+\(\)\.]+$/;
            if (!phoneRegex.test(strValue)) {
                return { valid: false, reason: 'invalid_phone', received: strValue };
            }
        }

        // Salary (should be numeric)
        if (field.classification === 'salary') {
            const numericValue = strValue.replace(/[,\$\s]/g, '');
            if (!/^\d+$/.test(numericValue)) {
                return { valid: false, reason: 'invalid_salary', received: strValue };
            }
            return { valid: true, value: numericValue };
        }

        // URL format
        if (field.type === 'url') {
            try {
                new URL(strValue);
            } catch {
                // Try adding https://
                try {
                    new URL('https://' + strValue);
                    return { valid: true, value: 'https://' + strValue };
                } catch {
                    return { valid: false, reason: 'invalid_url', received: strValue };
                }
            }
        }

        // Number fields
        if (field.type === 'number') {
            const num = parseFloat(strValue.replace(/[,]/g, ''));
            if (isNaN(num)) {
                return { valid: false, reason: 'invalid_number', received: strValue };
            }

            // Check min/max if defined
            if (field.element?.min && num < parseFloat(field.element.min)) {
                return { valid: false, reason: 'below_min', min: field.element.min };
            }
            if (field.element?.max && num > parseFloat(field.element.max)) {
                return { valid: false, reason: 'above_max', max: field.element.max };
            }

            return { valid: true, value: num.toString() };
        }

        return { valid: true, value: strValue };
    },

    // Get options from select element
    getSelectOptions: (element) => {
        if (!element) return [];
        return Array.from(element.options)
            .filter(o => o.value !== '')
            .map(o => ({
                value: o.value,
                text: o.text.trim().toLowerCase()
            }));
    },

    // Get options from radio group
    getRadioOptions: (element) => {
        if (!element || !element.name) return [];
        const radios = document.querySelectorAll(`input[name="${element.name}"]`);
        return Array.from(radios).map(r => ({
            value: r.value,
            text: ResponseValidator.getRadioLabel(r).toLowerCase()
        }));
    },

    // Get label for radio button
    getRadioLabel: (radio) => {
        const label = radio.closest('label');
        if (label) return label.textContent.trim();

        if (radio.id) {
            const forLabel = document.querySelector(`label[for="${radio.id}"]`);
            if (forLabel) return forLabel.textContent.trim();
        }

        return radio.value;
    },

    // Match option with fuzzy matching
    matchOption: (options, value) => {
        const lowerValue = value.toLowerCase();

        // Exact value match
        for (const opt of options) {
            if (opt.value.toLowerCase() === lowerValue) {
                return opt.value;
            }
        }

        // Exact text match
        for (const opt of options) {
            if (opt.text === lowerValue) {
                return opt.value;
            }
        }

        // Contains match
        for (const opt of options) {
            if (opt.text.includes(lowerValue) || lowerValue.includes(opt.text)) {
                return opt.value;
            }
        }

        // Yes/No special handling
        if (lowerValue === 'yes' || lowerValue === 'true') {
            for (const opt of options) {
                if (opt.text.includes('yes') || opt.value === 'true' || opt.value === '1') {
                    return opt.value;
                }
            }
        }

        if (lowerValue === 'no' || lowerValue === 'false') {
            for (const opt of options) {
                if (opt.text.includes('no') || opt.value === 'false' || opt.value === '0') {
                    return opt.value;
                }
            }
        }

        return null;
    },

    // Smart truncate at sentence/word boundary
    smartTruncate: (text, maxLength) => {
        if (text.length <= maxLength) return text;

        // Try to truncate at sentence boundary
        const truncated = text.substring(0, maxLength);
        const lastPeriod = truncated.lastIndexOf('.');
        if (lastPeriod > maxLength * 0.7) {
            return truncated.substring(0, lastPeriod + 1);
        }

        // Truncate at word boundary
        const lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > maxLength * 0.8) {
            return truncated.substring(0, lastSpace) + '...';
        }

        return truncated.substring(0, maxLength - 3) + '...';
    },

    // Batch validate multiple responses
    validateBatch: (fields, responses) => {
        const results = {
            valid: [],
            invalid: [],
            all: {}
        };

        for (const field of fields) {
            const fieldId = field.index?.toString() || field.id;
            const response = responses[fieldId];

            const validation = ResponseValidator.validate(field, response);

            results.all[fieldId] = {
                field,
                response,
                validation
            };

            if (validation.valid) {
                results.valid.push({
                    field,
                    value: validation.value || response
                });
            } else {
                results.invalid.push({
                    field,
                    response,
                    reason: validation.reason,
                    details: validation
                });
            }
        }

        return results;
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResponseValidator;
}

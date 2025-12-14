/**
 * Greenhouse DOM Selectors
 */
const GreenhouseSelectors = {
    // Form containers
    form: '#application_form, form.application-form, #application-form',
    section: 'fieldset, .field-group, .section',

    // Question blocks
    questionBlock: '.field, .form-field, [class*="field"]:not(.fieldset)',
    questionLabel: 'label, .label',
    requiredIndicator: '.required, [required], .field-required',

    // Input types
    textInput: 'input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input[type="number"]',
    textarea: 'textarea',
    select: 'select',
    checkbox: 'input[type="checkbox"]',
    radio: 'input[type="radio"]',
    file: 'input[type="file"]',

    // Specific fields
    fields: {
        firstName: '#first_name, input[name="job_application[first_name]"]',
        lastName: '#last_name, input[name="job_application[last_name]"]',
        email: '#email, input[name="job_application[email]"]',
        phone: '#phone, input[name="job_application[phone]"]',
        resume: '#resume, input[name="job_application[resume]"]',
        coverLetter: '#cover_letter, textarea[name="job_application[cover_letter]"]',
        linkedin: 'input[name*="linkedin"], input[id*="linkedin"]',
        github: 'input[name*="github"], input[id*="github"]',
        portfolio: 'input[name*="portfolio"], input[name*="website"]',
        location: '#location, input[name*="location"]'
    },

    // Custom questions
    customQuestions: '#custom_fields, [data-question-id], .custom-question',

    // EEO/Demographic
    eeoSection: '#demographic_questions, .demographic-questions, #equal-opportunity',

    // Submit
    submitButton: '#submit_app, input[type="submit"], button[type="submit"], .submit-button, .application-submit',

    // Error messages
    errorMessage: '.error-message, .field-error, .error'
};

// Export
if (typeof window !== 'undefined') {
    window.GreenhouseSelectors = GreenhouseSelectors;
}

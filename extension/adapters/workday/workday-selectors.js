/**
 * Workday DOM Selectors - Isolated for easy updates
 * 
 * When Workday changes their DOM, update ONLY this file.
 */
const WorkdaySelectors = {
    // Form containers
    form: '[data-automation-id="jobPostingPage"], [data-automation-id="formContent"], form.wd-Form',
    section: '[data-automation-id="formSection"], [data-automation-id="questionSection"]',

    // Question blocks - containers with label + input
    questionBlock: [
        '[data-automation-id="formField"]',
        '[data-automation-id="textInputWrapper"]',
        '[data-automation-id="selectInputWrapper"]',
        '[data-automation-id="checkboxInputWrapper"]',
        '[data-automation-id="radioInputWrapper"]',
        '.WDRV div[data-automation-widget]',
        '.wd-Field'
    ].join(', '),

    // Labels
    questionLabel: '[data-automation-id="formLabel"], label, .wd-label',
    requiredIndicator: '[data-automation-id="required"], .required',

    // Input types
    textInput: 'input[type="text"]:not([type="hidden"]), input:not([type])',
    textarea: 'textarea, [data-automation-id="textArea"]',
    select: 'select, [data-automation-id="selectWidget"]',

    // React dropdowns (Workday uses these heavily)
    reactDropdown: '[data-automation-id="selectInputContainer"] input',
    reactDropdownTrigger: '[data-automation-id="selectInputContainer"], [data-automation-id="multiselectInputContainer"]',
    dropdownOption: '[data-automation-id="promptOption"], [data-uxi-element-id="promptOption"]',
    dropdownList: '[data-automation-id="selectDropdown"], [data-uxi-popup]',

    // Checkbox / Radio
    checkbox: 'input[type="checkbox"]',
    checkboxContainer: '[data-automation-id="checkboxPanel"]',
    radio: 'input[type="radio"]',
    radioContainer: '[data-automation-id="radioPanel"]',

    // File upload
    file: 'input[type="file"], [data-automation-id="file-upload-input-ref"]',
    fileDropzone: '[data-automation-id="file-upload-drop-zone"]',

    // Navigation buttons
    nextButton: [
        '[data-automation-id="bottom-navigation-next-button"]',
        '[data-automation-id="nextButton"]',
        'button[data-automation-id="next"]'
    ].join(', '),
    previousButton: '[data-automation-id="bottom-navigation-previous-button"], [data-automation-id="previousButton"]',
    submitButton: '[data-automation-id="bottom-navigation-submit-button"], [data-automation-id="submitButton"]',
    saveButton: '[data-automation-id="saveButton"]',

    // Progress indicators
    progressBar: '[data-automation-id="progressBar"]',
    stepIndicator: '[data-automation-id="step"], .wd-StepIndicator',
    currentStep: '[data-automation-id="step"][aria-current="step"]',

    // Specific field mappings (automationId based)
    fields: {
        firstName: '[data-automation-id="legalNameSection_firstName"]',
        lastName: '[data-automation-id="legalNameSection_lastName"]',
        preferredName: '[data-automation-id="preferredNameSection"]',
        email: '[data-automation-id="email"]',
        phone: '[data-automation-id="phone-number"]',
        phoneType: '[data-automation-id="phoneType"]',
        countryCode: '[data-automation-id="countryPhoneCode"]',
        address: '[data-automation-id="addressSection_addressLine1"]',
        addressLine2: '[data-automation-id="addressSection_addressLine2"]',
        city: '[data-automation-id="addressSection_city"]',
        state: '[data-automation-id="addressSection_countryRegion"]',
        country: '[data-automation-id="addressSection_country"]',
        zip: '[data-automation-id="addressSection_postalCode"]',
        resume: '[data-automation-id="file-upload-input-ref"]',
        linkedin: '[data-automation-id*="linkedin" i]',
        website: '[data-automation-id*="website" i]',
        startDate: '[data-automation-id="startDate"]',
        currentlyEmployed: '[data-automation-id="currentlyEmployed"]'
    },

    // EEO specific sections
    eeoSection: '[data-automation-id="eeoSection"]',
    veteranSection: '[data-automation-id="veteranSection"]',
    disabilitySection: '[data-automation-id="disabilitySection"]',

    // Error indicators
    errorMessage: '[data-automation-id="errorMessage"], .wd-ErrorMessage',
    fieldError: '[data-automation-id="formField-error"]'
};

// Export for content scripts
if (typeof window !== 'undefined') {
    window.WorkdaySelectors = WorkdaySelectors;
}

// Enhanced Form Filler - Fills detected form fields with user data
// Works across all major job portals with intelligent value mapping
// SEQUENTIAL FILLING with visual feedback

class FormFiller {
    constructor() {
        this.filledFields = [];
        this.errors = [];
        this.skippedFields = [];
        this.profile = null;
        this.fillDelay = 300; // Delay between each field fill (ms)
        this.resumeFile = null; // Stored resume file
    }

    /**
     * Fill form with user profile data - SEQUENTIAL with delays
     * @param {Object} profile - User profile data
     * @param {Object} detectedFields - Detected form fields
     * @returns {Object} Fill result
     */
    async fillForm(profile, detectedFields) {
        Utils.log('Starting SEQUENTIAL form filling...', 'info');

        this.filledFields = [];
        this.errors = [];
        this.skippedFields = [];
        this.profile = profile;

        if (!profile) {
            return {
                success: false,
                error: 'No profile data provided'
            };
        }

        try {
            // Load stored resume file if available
            await this.loadResumeFile();

            // Fill each category of fields SEQUENTIALLY
            await this.fillPersonalFields(detectedFields.personal);
            await this.fillExperienceFields(detectedFields.experience);
            await this.fillEducationFields(detectedFields.education);
            await this.fillSkillsFields(detectedFields.skills);
            await this.fillPreferencesFields(detectedFields.preferences);
            await this.fillDocumentsFields(detectedFields.documents);
            await this.fillMiscFields(detectedFields.misc);

            // Handle file uploads (resume)
            await this.fillResumeFields(detectedFields.resume);

            // Handle any radio button groups
            await this.fillRadioGroups(detectedFields);

            Utils.log(`Form filling complete. Filled ${this.filledFields.length} fields.`);

            return {
                success: true,
                filledCount: this.filledFields.length,
                skippedCount: this.skippedFields.length,
                errorCount: this.errors.length,
                totalFields: this.filledFields.length + this.skippedFields.length + this.errors.length,
                errors: this.errors
            };
        } catch (error) {
            Utils.log(`Error filling form: ${error.message}`, 'error');
            return {
                success: false,
                error: error.message,
                filledCount: this.filledFields.length,
                totalFields: this.filledFields.length + this.skippedFields.length + this.errors.length,
                errors: this.errors
            };
        }
    }

    /**
     * Load resume file from storage
     */
    async loadResumeFile() {
        try {
            const result = await chrome.storage.local.get('resumeFile');
            if (result.resumeFile) {
                this.resumeFile = result.resumeFile;
                Utils.log('Resume file loaded from storage');
            }
        } catch (error) {
            Utils.log('No resume file in storage: ' + error.message, 'warn');
        }
    }

    /**
     * Fill personal information fields
     * @param {Array} fields - Personal fields
     */
    async fillPersonalFields(fields) {
        if (!fields || fields.length === 0) return;

        const { personalInfo } = this.profile;
        if (!personalInfo) return;

        for (const field of fields) {
            try {
                let value = null;

                switch (field.classification) {
                    case 'firstName':
                        value = personalInfo.firstName;
                        break;
                    case 'lastName':
                        value = personalInfo.lastName;
                        break;
                    case 'fullName':
                        value = `${personalInfo.firstName} ${personalInfo.lastName}`;
                        break;
                    case 'middleName':
                        value = personalInfo.middleName || '';
                        break;
                    case 'email':
                        value = personalInfo.email;
                        break;
                    case 'phone':
                        value = this.formatPhone(personalInfo.phone);
                        break;
                    case 'address':
                        value = personalInfo.location?.address;
                        break;
                    case 'addressLine2':
                        value = personalInfo.location?.address2 || personalInfo.location?.apt || '';
                        break;
                    case 'city':
                        value = personalInfo.location?.city;
                        break;
                    case 'state':
                        value = personalInfo.location?.state;
                        break;
                    case 'zipCode':
                        value = personalInfo.location?.zipCode;
                        break;
                    case 'country':
                        value = personalInfo.location?.country;
                        break;
                    case 'linkedin':
                        value = personalInfo.linkedin;
                        break;
                    case 'website':
                        value = personalInfo.portfolio || personalInfo.website;
                        break;
                    case 'github':
                        value = personalInfo.github;
                        break;
                    case 'twitter':
                        value = personalInfo.twitter;
                        break;
                }

                if (value) {
                    await this.fillField(field, value);
                }
            } catch (error) {
                this.errors.push({
                    field: field.classification,
                    error: error.message
                });
            }
        }
    }

    /**
     * Fill experience fields
     * @param {Array} fields - Experience fields
     */
    async fillExperienceFields(fields) {
        if (!fields || fields.length === 0) return;

        const { experience } = this.profile;
        if (!experience || experience.length === 0) return;

        // Use most recent experience
        const recentExp = experience[0];

        for (const field of fields) {
            try {
                let value = null;

                switch (field.classification) {
                    case 'company':
                        value = recentExp.company;
                        break;
                    case 'position':
                        value = recentExp.position || recentExp.title;
                        break;
                    case 'startDate':
                        value = this.formatDate(recentExp.startDate, field);
                        break;
                    case 'endDate':
                        if (!recentExp.current) {
                            value = this.formatDate(recentExp.endDate, field);
                        }
                        break;
                    case 'currentlyWorking':
                        if (field.type === 'checkbox') {
                            await this.fillCheckbox(field, recentExp.current === true);
                            continue;
                        }
                        value = recentExp.current ? 'Yes' : 'No';
                        break;
                    case 'responsibilities':
                        value = this.formatResponsibilities(recentExp.responsibilities);
                        break;
                    case 'yearsOfExperience':
                        value = this.calculateYearsOfExperience();
                        break;
                }

                if (value) {
                    await this.fillField(field, value);
                }
            } catch (error) {
                this.errors.push({
                    field: field.classification,
                    error: error.message
                });
            }
        }
    }

    /**
     * Fill education fields
     * @param {Array} fields - Education fields
     */
    async fillEducationFields(fields) {
        if (!fields || fields.length === 0) return;

        const { education } = this.profile;
        if (!education || education.length === 0) return;

        // Use most recent education
        const recentEdu = education[0];

        for (const field of fields) {
            try {
                let value = null;

                switch (field.classification) {
                    case 'school':
                        value = recentEdu.institution || recentEdu.school;
                        break;
                    case 'degree':
                        value = recentEdu.degree;
                        break;
                    case 'fieldOfStudy':
                        value = recentEdu.field || recentEdu.major;
                        break;
                    case 'gpa':
                        value = recentEdu.gpa;
                        break;
                    case 'graduationDate':
                        value = this.formatDate(recentEdu.endDate || recentEdu.graduationDate, field);
                        break;
                }

                if (value) {
                    await this.fillField(field, value);
                }
            } catch (error) {
                this.errors.push({
                    field: field.classification,
                    error: error.message
                });
            }
        }
    }

    /**
     * Fill skills fields
     * @param {Array} fields - Skills fields
     */
    async fillSkillsFields(fields) {
        if (!fields || fields.length === 0) return;

        const { skills, professionalSummary } = this.profile;
        if (!skills) return;

        const skillsText = this.formatSkills(skills);

        for (const field of fields) {
            try {
                await this.fillField(field, skillsText);
            } catch (error) {
                this.errors.push({
                    field: field.classification,
                    error: error.message
                });
            }
        }
    }

    /**
     * Fill preferences fields
     * @param {Array} fields - Preferences fields
     */
    async fillPreferencesFields(fields) {
        if (!fields || fields.length === 0) return;

        const { preferences } = this.profile;
        if (!preferences) return;

        for (const field of fields) {
            try {
                let value = null;

                switch (field.classification) {
                    case 'salary':
                        if (preferences.salaryExpectation) {
                            value = preferences.salaryExpectation.min?.toString();
                        }
                        break;
                    case 'availability':
                    case 'noticePeriod':
                        value = preferences.noticePeriod || 'Immediately';
                        break;
                    case 'workType':
                        value = preferences.jobTypes?.[0] || 'Full-time';
                        break;
                    case 'remoteWork':
                        value = preferences.workArrangement?.[0] || 'Remote';
                        break;
                    case 'sponsorship':
                        if (field.type === 'checkbox' || field.type === 'radio') {
                            await this.fillCheckbox(field, preferences.sponsorshipRequired);
                            continue;
                        }
                        if (field.tagName === 'select') {
                            await this.fillSelect(field, preferences.sponsorshipRequired ? 'Yes' : 'No');
                            continue;
                        }
                        value = preferences.sponsorshipRequired ? 'Yes' : 'No';
                        break;
                    case 'relocate':
                        if (field.type === 'checkbox' || field.type === 'radio') {
                            await this.fillCheckbox(field, preferences.willingToRelocate);
                            continue;
                        }
                        if (field.tagName === 'select') {
                            await this.fillSelect(field, preferences.willingToRelocate ? 'Yes' : 'No');
                            continue;
                        }
                        value = preferences.willingToRelocate ? 'Yes' : 'No';
                        break;
                }

                if (value) {
                    await this.fillField(field, value);
                }
            } catch (error) {
                this.errors.push({
                    field: field.classification,
                    error: error.message
                });
            }
        }
    }

    /**
     * Fill documents/cover letter fields
     * @param {Array} fields - Documents fields
     */
    async fillDocumentsFields(fields) {
        if (!fields || fields.length === 0) return;

        const { professionalSummary, coverLetter } = this.profile;

        for (const field of fields) {
            try {
                let value = null;

                switch (field.classification) {
                    case 'coverLetter':
                        value = coverLetter || professionalSummary?.default || '';
                        break;
                    case 'additionalInfo':
                        value = professionalSummary?.short || '';
                        break;
                }

                if (value) {
                    await this.fillField(field, value);
                }
            } catch (error) {
                this.errors.push({
                    field: field.classification,
                    error: error.message
                });
            }
        }
    }

    /**
     * Fill resume/file upload fields
     * @param {Array} fields - Resume file input fields
     */
    async fillResumeFields(fields) {
        if (!fields || fields.length === 0) return;

        for (const field of fields) {
            try {
                const element = field.element;
                if (!element || element.type !== 'file') continue;

                // If we have a stored resume, try to use it
                if (this.resumeFile) {
                    Utils.log('Attempting to upload resume file...');

                    // Create a File object from stored data
                    const file = await this.createFileFromStorage();
                    if (file) {
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(file);
                        element.files = dataTransfer.files;

                        element.dispatchEvent(new Event('change', { bubbles: true }));
                        element.dispatchEvent(new Event('input', { bubbles: true }));

                        this.highlightElement(element);
                        this.filledFields.push({
                            classification: 'resume',
                            value: file.name,
                            element: element.name || element.id
                        });

                        Utils.log(`Resume uploaded: ${file.name}`);
                    }
                } else {
                    // Highlight the file input so user knows to upload
                    this.highlightElement(element, '#f59e0b'); // Warning color
                    this.skippedFields.push({
                        field: 'resume',
                        reason: 'No resume file stored - please upload manually'
                    });
                }

                await this.delay(this.fillDelay);
            } catch (error) {
                Utils.log('Error uploading resume: ' + error.message, 'error');
                this.errors.push({
                    field: 'resume',
                    error: error.message
                });
            }
        }
    }

    /**
     * Create File object from stored resume data
     */
    async createFileFromStorage() {
        if (!this.resumeFile) return null;

        try {
            // If it's a base64 data URL
            if (this.resumeFile.data && this.resumeFile.name) {
                const response = await fetch(this.resumeFile.data);
                const blob = await response.blob();
                return new File([blob], this.resumeFile.name, { type: this.resumeFile.type || 'application/pdf' });
            }
        } catch (error) {
            Utils.log('Error creating file from storage: ' + error.message, 'error');
        }

        return null;
    }

    /**
     * Fill radio button groups
     * @param {Object} detectedFields - All detected fields
     */
    async fillRadioGroups(detectedFields) {
        // Find all radio buttons in the document
        const container = document.querySelector('form') || document.body;
        const radioInputs = container.querySelectorAll('input[type="radio"]');

        // Group radios by name
        const radioGroups = {};
        radioInputs.forEach(radio => {
            if (radio.name) {
                if (!radioGroups[radio.name]) {
                    radioGroups[radio.name] = [];
                }
                radioGroups[radio.name].push(radio);
            }
        });

        // Process each group
        for (const [groupName, radios] of Object.entries(radioGroups)) {
            try {
                // Check if any radio is already selected
                const alreadySelected = radios.some(r => r.checked);
                if (alreadySelected) continue;

                // Try to determine correct value based on label/question
                const groupLabel = this.getRadioGroupLabel(radios[0]);
                const value = this.determineRadioValue(groupLabel, groupName);

                if (value !== null) {
                    await this.selectRadioOption(radios, value);
                }
            } catch (error) {
                Utils.log(`Error filling radio group ${groupName}: ${error.message}`, 'error');
            }
        }
    }

    /**
     * Get the label/question for a radio button group
     */
    getRadioGroupLabel(radio) {
        // Try fieldset legend
        const fieldset = radio.closest('fieldset');
        if (fieldset) {
            const legend = fieldset.querySelector('legend');
            if (legend) return legend.textContent.trim().toLowerCase();
        }

        // Try parent container label
        const container = radio.closest('.form-group, .field, [class*="question"], [class*="field"]');
        if (container) {
            const label = container.querySelector('label, .label, legend, [class*="label"]');
            if (label) return label.textContent.trim().toLowerCase();
        }

        // Try aria-label
        return radio.getAttribute('aria-label')?.toLowerCase() || '';
    }

    /**
     * Determine what value to select for a radio group
     */
    determineRadioValue(label, name) {
        const { preferences, personalInfo } = this.profile;
        const lowerName = name.toLowerCase();

        // Work authorization questions
        if (label.includes('authorized') || label.includes('work in') || label.includes('eligible to work') || lowerName.includes('auth')) {
            return preferences?.workAuthorized !== false ? 'yes' : 'no';
        }

        // Sponsorship questions
        if (label.includes('sponsor') || label.includes('visa') || lowerName.includes('sponsor')) {
            return preferences?.sponsorshipRequired ? 'yes' : 'no';
        }

        // Relocation questions
        if (label.includes('relocat') || lowerName.includes('relocat')) {
            return preferences?.willingToRelocate ? 'yes' : 'no';
        }

        // Remote work questions
        if (label.includes('remote') || label.includes('work from home') || lowerName.includes('remote')) {
            return preferences?.remotePreferred !== false ? 'yes' : 'no';
        }

        // Gender (optional - skip if not comfortable)
        if (label.includes('gender') || lowerName.includes('gender')) {
            return personalInfo?.gender || null;
        }

        // Veteran status
        if (label.includes('veteran') || lowerName.includes('veteran')) {
            return preferences?.veteran ? 'yes' : 'no';
        }

        // Disability
        if (label.includes('disability') || label.includes('disabled') || lowerName.includes('disab')) {
            return preferences?.disability || 'decline';
        }

        return null;
    }

    /**
     * Select the correct radio option in a group
     */
    async selectRadioOption(radios, desiredValue) {
        const lowerValue = String(desiredValue).toLowerCase();

        for (const radio of radios) {
            const radioValue = radio.value.toLowerCase();
            const radioLabel = this.getRadioOptionLabel(radio).toLowerCase();

            // Check for match
            if (radioValue === lowerValue ||
                radioLabel.includes(lowerValue) ||
                (lowerValue === 'yes' && (radioValue === 'true' || radioValue === '1' || radioLabel.includes('yes'))) ||
                (lowerValue === 'no' && (radioValue === 'false' || radioValue === '0' || radioLabel.includes('no'))) ||
                (lowerValue === 'decline' && (radioLabel.includes('decline') || radioLabel.includes('prefer not')))) {

                // Scroll to and click the radio
                radio.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await this.delay(100);

                radio.checked = true;
                radio.click();
                radio.dispatchEvent(new Event('change', { bubbles: true }));

                this.highlightElement(radio);
                this.filledFields.push({
                    classification: 'radio_' + radio.name,
                    value: radio.value,
                    element: radio.name
                });

                Utils.log(`Selected radio: ${radio.name} = ${radio.value}`);
                await this.delay(this.fillDelay);
                return;
            }
        }
    }

    /**
     * Get label text for a specific radio option
     */
    getRadioOptionLabel(radio) {
        // Label wrapping the radio
        const parentLabel = radio.closest('label');
        if (parentLabel) return parentLabel.textContent;

        // Label with for attribute
        if (radio.id) {
            const label = document.querySelector(`label[for="${radio.id}"]`);
            if (label) return label.textContent;
        }

        // Next sibling text
        const next = radio.nextSibling;
        if (next && next.nodeType === Node.TEXT_NODE) {
            return next.textContent;
        }

        return radio.value;
    }

    /**
     * Fill misc fields
     * @param {Array} fields - Misc fields
     */
    async fillMiscFields(fields) {
        if (!fields || fields.length === 0) return;

        for (const field of fields) {
            try {
                let value = null;

                switch (field.classification) {
                    case 'howDidYouHear':
                    case 'heardAbout':
                        value = 'LinkedIn';
                        break;
                }

                if (value) {
                    await this.fillField(field, value);
                }
            } catch (error) {
                this.errors.push({
                    field: field.classification,
                    error: error.message
                });
            }
        }
    }

    /**
     * Fill a single field - with VISUAL DELAY for sequential filling
     * @param {Object} field - Field metadata
     * @param {string} value - Value to fill
     */
    async fillField(field, value) {
        const element = field.element;

        if (!element || !this.isVisible(element)) {
            this.skippedFields.push({ field: field.classification, reason: 'not visible' });
            return;
        }

        // Skip if already has value and it's similar
        if (element.value && this.isSimilarValue(element.value, value)) {
            this.skippedFields.push({ field: field.classification, reason: 'already filled' });
            return;
        }

        try {
            // Scroll to element SMOOTHLY
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.delay(150); // Wait for scroll

            // Pre-highlight to show which field is being filled
            this.preHighlightElement(element);
            await this.delay(100);

            // Focus the element
            element.focus();
            await this.delay(50);

            // Handle different element types
            if (element.tagName === 'SELECT') {
                await this.fillSelect(field, value);
            } else if (element.type === 'checkbox') {
                const desired = typeof value === 'boolean'
                    ? value
                    : /^yes|true|1$/i.test(String(value || '').trim());
                await this.fillCheckbox(field, desired);
            } else if (element.type === 'radio') {
                // Radio buttons handled separately in fillRadioGroups
                return;
            } else {
                await this.setInputValue(element, value);
            }

            // Success highlight
            this.highlightElement(element);

            // Track filled field
            this.filledFields.push({
                classification: field.classification,
                value: String(value).substring(0, 100),
                element: element.name || element.id
            });

            Utils.log(`✓ Filled ${field.classification}: "${String(value).substring(0, 30)}..."`);

            // DELAY between fields for visual feedback
            await this.delay(this.fillDelay);
        } catch (error) {
            this.errors.push({
                field: field.classification,
                error: error.message
            });
        }
    }

    /**
     * Pre-highlight element to show it's about to be filled
     */
    preHighlightElement(element) {
        element.style.transition = 'all 0.2s ease';
        element.style.outline = '3px solid #3b82f6';
        element.style.outlineOffset = '2px';
        element.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.5)';
    }

    /**
     * Set input value (works with React/Vue/Angular)
     * @param {HTMLElement} element - Input element
     * @param {string} value - Value to set
     */
    async setInputValue(element, value) {
        // Get native value setter
        const nativeInputSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 'value'
        )?.set;
        const nativeTextareaSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype, 'value'
        )?.set;

        // Clear existing value first
        element.value = '';

        // Set value using native setter for React compatibility
        if (element.tagName === 'TEXTAREA' && nativeTextareaSetter) {
            nativeTextareaSetter.call(element, value);
        } else if (nativeInputSetter) {
            nativeInputSetter.call(element, value);
        } else {
            element.value = value;
        }

        // Dispatch events for framework compatibility
        element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
        element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

        // For React 16+
        const tracker = element._valueTracker;
        if (tracker) {
            tracker.setValue('');
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));

        await this.delay(30);

        // Blur to trigger validation
        element.dispatchEvent(new Event('blur', { bubbles: true }));
    }

    /**
     * Fill a select dropdown
     * @param {Object} field - Field metadata
     * @param {string} value - Value to select
     */
    async fillSelect(field, value) {
        const element = field.element;
        const lowerValue = value.toLowerCase();

        // Try exact match first
        for (const option of element.options) {
            if (option.value === value || option.text === value) {
                element.value = option.value;
                element.dispatchEvent(new Event('change', { bubbles: true }));
                return;
            }
        }

        // Try case-insensitive match
        for (const option of element.options) {
            if (option.value.toLowerCase() === lowerValue ||
                option.text.toLowerCase() === lowerValue) {
                element.value = option.value;
                element.dispatchEvent(new Event('change', { bubbles: true }));
                return;
            }
        }

        // Try partial match
        for (const option of element.options) {
            if (option.value.toLowerCase().includes(lowerValue) ||
                option.text.toLowerCase().includes(lowerValue) ||
                lowerValue.includes(option.value.toLowerCase()) ||
                lowerValue.includes(option.text.toLowerCase())) {
                element.value = option.value;
                element.dispatchEvent(new Event('change', { bubbles: true }));
                return;
            }
        }

        // Special handling for Yes/No questions
        if (lowerValue === 'yes' || lowerValue === 'true') {
            for (const option of element.options) {
                if (/^(yes|true|1)$/i.test(option.value) || /^(yes|true|1)$/i.test(option.text)) {
                    element.value = option.value;
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    return;
                }
            }
        }

        if (lowerValue === 'no' || lowerValue === 'false') {
            for (const option of element.options) {
                if (/^(no|false|0)$/i.test(option.value) || /^(no|false|0)$/i.test(option.text)) {
                    element.value = option.value;
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    return;
                }
            }
        }

        Utils.log(`Could not find matching option for: ${value}`, 'warn');
    }

    /**
     * Fill a checkbox or radio button
     * @param {Object} field - Field metadata
     * @param {boolean} checked - Whether to check
     */
    async fillCheckbox(field, checked) {
        const element = field.element;

        if (element.checked !== checked) {
            element.checked = checked;
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.dispatchEvent(new Event('click', { bubbles: true }));
        }

        this.highlightElement(element);

        this.filledFields.push({
            classification: field.classification,
            value: checked,
            element: element.name || element.id
        });
    }

    /**
     * Format phone number
     * @param {string} phone - Raw phone number
     * @returns {string}
     */
    formatPhone(phone) {
        if (!phone) return '';

        // Remove all non-digits except leading +
        let cleaned = phone.replace(/[^\d+]/g, '');

        // If starts with +1, format as US number
        if (cleaned.startsWith('+1') && cleaned.length === 12) {
            const digits = cleaned.substring(2);
            return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        }

        // If 10 digits, format as US number
        if (/^\d{10}$/.test(cleaned)) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }

        return phone;
    }

    /**
     * Format date for form input
     * @param {string} dateString - Date string
     * @param {Object} field - Field metadata
     * @returns {string}
     */
    formatDate(dateString, field) {
        if (!dateString) return '';

        // If input type is date, format as YYYY-MM-DD
        if (field.type === 'date') {
            if (/^\d{4}-\d{2}$/.test(dateString)) {
                return `${dateString}-01`;
            }
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                return dateString;
            }
        }

        // If input type is month, format as YYYY-MM
        if (field.type === 'month') {
            if (/^\d{4}-\d{2}/.test(dateString)) {
                return dateString.substring(0, 7);
            }
        }

        return dateString;
    }

    /**
     * Format responsibilities as text
     * @param {Array} responsibilities - Array of responsibilities
     * @returns {string}
     */
    formatResponsibilities(responsibilities) {
        if (!responsibilities || !Array.isArray(responsibilities)) return '';
        return responsibilities.map(r => `• ${r}`).join('\n');
    }

    /**
     * Format skills as text
     * @param {Object} skills - Skills object
     * @returns {string}
     */
    formatSkills(skills) {
        const allSkills = [];

        if (skills.technical) {
            Object.values(skills.technical).forEach(skillArray => {
                if (Array.isArray(skillArray)) {
                    allSkills.push(...skillArray);
                }
            });
        }

        if (skills.soft && Array.isArray(skills.soft)) {
            allSkills.push(...skills.soft);
        }

        return allSkills.join(', ');
    }

    /**
     * Calculate total years of experience
     * @returns {string}
     */
    calculateYearsOfExperience() {
        const { experience } = this.profile;
        if (!experience || experience.length === 0) return '0';

        let totalMonths = 0;
        experience.forEach(exp => {
            if (exp.startDate) {
                const start = new Date(exp.startDate);
                const end = exp.current ? new Date() : new Date(exp.endDate || new Date());
                const months = (end.getFullYear() - start.getFullYear()) * 12 +
                    (end.getMonth() - start.getMonth());
                totalMonths += months;
            }
        });

        return Math.round(totalMonths / 12).toString();
    }

    /**
     * Check if two values are similar
     * @param {string} existing - Existing value
     * @param {string} newValue - New value
     * @returns {boolean}
     */
    isSimilarValue(existing, newValue) {
        if (!existing || !newValue) return false;
        const clean1 = existing.toLowerCase().replace(/\s+/g, ' ').trim();
        const clean2 = newValue.toLowerCase().replace(/\s+/g, ' ').trim();
        return clean1 === clean2;
    }

    /**
     * Check if element is visible
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
    }

    /**
     * Highlight filled element with SUCCESS color
     * @param {HTMLElement} element - Element to highlight
     * @param {string} color - Optional custom color
     */
    highlightElement(element, color = '#10b981') {
        element.style.transition = 'all 0.3s ease';
        element.style.outline = `3px solid ${color}`;
        element.style.outlineOffset = '2px';
        element.style.boxShadow = `0 0 12px ${color}40`;
        element.style.backgroundColor = `${color}10`;

        setTimeout(() => {
            element.style.outline = '';
            element.style.outlineOffset = '';
            element.style.boxShadow = '';
            element.style.backgroundColor = '';
            element.style.transition = '';
        }, 2000);
    }

    /**
     * Delay execution
     * @param {number} ms - Milliseconds
     * @returns {Promise}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get fill summary
     * @returns {Object}
     */
    getSummary() {
        return {
            totalFilled: this.filledFields.length,
            totalSkipped: this.skippedFields.length,
            totalErrors: this.errors.length,
            fields: this.filledFields,
            skipped: this.skippedFields,
            errors: this.errors
        };
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormFiller;
}

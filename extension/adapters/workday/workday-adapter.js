/**
 * WorkdayAdapter - Handles Workday's React-based forms
 * 
 * Workday is one of the most complex ATS systems with:
 * - Multi-step forms
 * - React controlled inputs
 * - Custom dropdown widgets
 * - Dynamic field loading
 */
class WorkdayAdapter extends PlatformAdapter {
    constructor() {
        super();
        this.platformName = 'Workday';
        this.platformId = 'workday';
        this.selectors = WorkdaySelectors;
    }

    /**
     * Check if Workday form is ready
     */
    isFormReady() {
        const form = document.querySelector(this.selectors.form);
        const hasFields = document.querySelectorAll(this.selectors.questionBlock).length > 0;
        return form !== null && hasFields;
    }

    /**
     * Find all question blocks in current view
     */
    findQuestionBlocks() {
        const blocks = [];
        const seen = new Set();

        // Get all sections first
        const sections = document.querySelectorAll(this.selectors.section);

        if (sections.length > 0) {
            sections.forEach(section => {
                const fields = section.querySelectorAll(this.selectors.questionBlock);
                fields.forEach(field => {
                    if (!seen.has(field) && this.hasVisibleInput(field)) {
                        seen.add(field);
                        blocks.push(field);
                    }
                });
            });
        }

        // Fallback: direct query
        if (blocks.length === 0) {
            document.querySelectorAll(this.selectors.questionBlock).forEach(block => {
                if (!seen.has(block) && this.hasVisibleInput(block)) {
                    seen.add(block);
                    blocks.push(block);
                }
            });
        }

        console.log(`[Workday] Found ${blocks.length} question blocks`);
        return blocks;
    }

    /**
     * Check if block has a visible input
     */
    hasVisibleInput(block) {
        const input = block.querySelector('input, textarea, select, [contenteditable], [role="listbox"]');
        return input !== null && this.isVisible(input);
    }

    /**
     * Extract canonical question from block
     */
    extractQuestion(block) {
        // Find label
        const labelEl = block.querySelector(this.selectors.questionLabel);
        const text = labelEl?.textContent?.trim() || '';

        // Determine input type and get element
        let type = 'text';
        let options = null;
        let inputElement = null;

        // Check for dropdown first (most common in Workday)
        const dropdownTrigger = block.querySelector(this.selectors.reactDropdownTrigger);
        if (dropdownTrigger) {
            type = 'select';
            inputElement = dropdownTrigger.querySelector('input') || dropdownTrigger;
            options = []; // Will be populated on-demand
        }
        // Check for regular select
        else if (block.querySelector('select')) {
            type = 'select';
            inputElement = block.querySelector('select');
            options = Array.from(inputElement.options).map(o => ({
                value: o.value,
                text: o.textContent.trim()
            }));
        }
        // Radio
        else if (block.querySelector(this.selectors.radio)) {
            type = 'radio';
            inputElement = block.querySelector(this.selectors.radio);
            options = this.extractRadioOptions(block);
        }
        // CHECKBOX GROUP (multiple checkboxes like ethnicity)
        else if (block.querySelectorAll(this.selectors.checkbox).length > 1) {
            type = 'checkbox-group';
            options = Array.from(block.querySelectorAll(this.selectors.checkbox)).map(cb => {
                const lbl = cb.closest('label') || document.querySelector(`label[for="${cb.id}"]`);
                return { value: cb.value, text: lbl?.textContent?.trim() || cb.value, element: cb };
            });
        }
        // Single Checkbox
        else if (block.querySelector(this.selectors.checkbox)) {
            type = 'checkbox';
            inputElement = block.querySelector(this.selectors.checkbox);
        }
        // Textarea
        else if (block.querySelector(this.selectors.textarea)) {
            type = 'textarea';
            inputElement = block.querySelector(this.selectors.textarea);
        }
        // File upload
        else if (block.querySelector(this.selectors.file)) {
            type = 'file';
            inputElement = block.querySelector(this.selectors.file);
        }
        // Text input (default)
        else {
            inputElement = block.querySelector(this.selectors.textInput);
        }

        // Check if required
        const required = block.querySelector(this.selectors.requiredIndicator) !== null ||
            inputElement?.required === true;

        return new CanonicalQuestion({
            text,
            type,
            options,
            required,
            platform: this.platformId,
            block,
            metadata: {
                inputElement,
                automationId: block.getAttribute('data-automation-id'),
                isReactDropdown: dropdownTrigger !== null
            }
        });
    }

    /**
     * Extract radio options from block
     */
    extractRadioOptions(block) {
        const radios = block.querySelectorAll(this.selectors.radio);
        return Array.from(radios).map(radio => {
            const label = radio.closest('label') ||
                document.querySelector(`label[for="${radio.id}"]`);
            return {
                value: radio.value,
                text: label?.textContent?.trim() || radio.value,
                element: radio
            };
        });
    }

    /**
     * Fill answer into question block
     */
    async fillAnswer(block, answer) {
        const question = this.extractQuestion(block);
        const { type, metadata } = question;
        const input = metadata.inputElement;

        console.log(`[Workday] Filling "${question.text.substring(0, 30)}..." type:${type} answer:"${String(answer).substring(0, 20)}"`);

        try {
            switch (type) {
                case 'text':
                    return await this.simulateInput(input, String(answer));

                case 'textarea':
                    return await this.simulateInput(input, String(answer));

                case 'select':
                    if (metadata.isReactDropdown) {
                        return await this.fillReactDropdown(block, answer);
                    }
                    return await this.fillNativeSelect(input, answer);

                case 'radio':
                    return await this.fillRadio(block, answer, question.options);

                case 'checkbox-group':
                    return await this.fillCheckboxGroup(block, answer, question.options);

                case 'checkbox':
                    return await this.fillCheckbox(input, answer);

                case 'file':
                    console.log('[Workday] File upload not auto-filled');
                    return false;

                default:
                    if (input) {
                        return await this.simulateInput(input, String(answer));
                    }
                    return false;
            }
        } catch (error) {
            console.error(`[Workday] Fill error:`, error);
            return false;
        }
    }

    /**
     * Fill Workday's React dropdown
     */
    async fillReactDropdown(block, value) {
        const trigger = block.querySelector(this.selectors.reactDropdownTrigger);
        if (!trigger) return false;

        // Click to open dropdown
        await this.simulateClick(trigger);
        await this.wait(400);

        // Find dropdown options
        const optionsList = document.querySelector(this.selectors.dropdownList);
        if (!optionsList) {
            console.log('[Workday] Dropdown list not found, trying direct input');
            // Try typing into input
            const input = trigger.querySelector('input');
            if (input) {
                await this.simulateInput(input, String(value));
                await this.wait(300);
                // Press enter to select first match
                input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
                return true;
            }
            return false;
        }

        const options = optionsList.querySelectorAll(this.selectors.dropdownOption);
        const normalizedValue = String(value).toLowerCase().trim();

        // Try to find matching option
        for (const opt of options) {
            const optText = opt.textContent.toLowerCase().trim();
            if (optText.includes(normalizedValue) || normalizedValue.includes(optText)) {
                await this.simulateClick(opt);
                await this.wait(200);
                return true;
            }
        }

        // Close dropdown if no match found
        document.body.click();
        console.log(`[Workday] No dropdown match for: ${value}`);
        return false;
    }

    /**
     * Fill native select element
     */
    async fillNativeSelect(select, value) {
        if (!select) return false;

        const normalizedValue = String(value).toLowerCase().trim();

        for (const opt of select.options) {
            const optText = opt.textContent.toLowerCase().trim();
            if (optText.includes(normalizedValue) || normalizedValue.includes(optText)) {
                select.value = opt.value;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
        }
        return false;
    }

    /**
     * Fill radio button
     */
    async fillRadio(block, value, options) {
        const normalized = String(value).toLowerCase().trim();
        console.log(`[Workday] fillRadio looking for: "${normalized}" in ${options?.length || 0} options`);

        // EXACT MATCH FIRST (critical for gender: "Male" should not match "Female")
        for (const opt of (options || [])) {
            const optText = opt.text.toLowerCase().trim();
            if (optText === normalized) {
                console.log(`[Workday] EXACT match: "${opt.text}"`);
                if (opt.element) {
                    await this.simulateClick(opt.element);
                    opt.element.dispatchEvent(new Event('change', { bubbles: true }));
                    return true;
                }
            }
        }

        // Word-boundary match
        for (const opt of (options || [])) {
            const optText = opt.text.toLowerCase();
            const regex = new RegExp(`\\b${normalized}\\b`, 'i');
            if (regex.test(optText)) {
                console.log(`[Workday] Word-boundary match: "${opt.text}"`);
                if (opt.element) {
                    await this.simulateClick(opt.element);
                    return true;
                }
            }
        }

        // Contains match (only short options)
        for (const opt of (options || [])) {
            const optText = opt.text.toLowerCase().trim();
            if (optText.length < 30 && (optText.includes(normalized) || normalized.includes(optText))) {
                console.log(`[Workday] Contains match: "${opt.text}"`);
                if (opt.element) {
                    await this.simulateClick(opt.element);
                    return true;
                }
            }
        }

        console.log(`[Workday] No match found for: "${normalized}"`);
        return false;
    }

    /**
     * Fill checkbox group (like ethnicity - select multiple)
     */
    async fillCheckboxGroup(block, value, options) {
        const normalized = String(value).toLowerCase().trim();
        console.log(`[Workday] fillCheckboxGroup looking for: "${normalized}"`);

        for (const opt of (options || [])) {
            const optText = opt.text.toLowerCase().trim();

            if (optText.includes(normalized) || normalized.includes(optText)) {
                if (opt.element && !opt.element.checked) {
                    await this.simulateClick(opt.element);
                    console.log(`[Workday] Checked: "${opt.text}"`);
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Fill checkbox
     */
    async fillCheckbox(input, value) {
        if (!input) return false;

        const shouldCheck = value === true ||
            value === 'yes' ||
            value === 'true' ||
            value === 1;

        if (input.checked !== shouldCheck) {
            await this.simulateClick(input);
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return true;
    }

    /**
     * Verify answer was filled correctly
     */
    verify(block, expectedAnswer) {
        const question = this.extractQuestion(block);
        const input = question.metadata.inputElement;

        if (!input && question.type !== 'radio') {
            return false;
        }

        switch (question.type) {
            case 'text':
            case 'textarea':
                return input.value.length > 0;

            case 'checkbox':
                const expectedCheck = expectedAnswer === true || expectedAnswer === 'yes';
                return input.checked === expectedCheck;

            case 'radio':
                return block.querySelector(`${this.selectors.radio}:checked`) !== null;

            case 'select':
                // For React dropdowns, check displayed value
                const displayed = block.querySelector('[data-automation-id="selectedLabel"], [data-automation-id="selectSelectedOption"]');
                if (displayed) {
                    const displayedText = displayed.textContent.toLowerCase();
                    return displayedText.length > 0 &&
                        displayedText !== 'select' &&
                        displayedText !== 'choose';
                }
                // For native select
                if (input?.tagName === 'SELECT') {
                    return input.selectedIndex > 0;
                }
                return true; // Optimistic for complex dropdowns

            default:
                return input?.value?.length > 0 || true;
        }
    }

    /**
     * Get current step info for multi-step form
     */
    getStepInfo() {
        const steps = document.querySelectorAll(this.selectors.stepIndicator);

        if (steps.length === 0) {
            return { current: 1, total: 1, isMultiStep: false };
        }

        const activeIndex = Array.from(steps).findIndex(s =>
            s.classList.contains('active') ||
            s.getAttribute('aria-current') === 'step' ||
            s.classList.contains('wd-StepIndicator--current')
        );

        return {
            current: Math.max(1, activeIndex + 1),
            total: steps.length,
            isMultiStep: steps.length > 1
        };
    }

    /**
     * Advance to next step
     */
    async advanceStep() {
        const nextBtn = document.querySelector(this.selectors.nextButton);

        if (nextBtn && !nextBtn.disabled) {
            console.log('[Workday] Clicking next button');
            await this.simulateClick(nextBtn);
            await this.wait(1500); // Workday needs time to load next step
            return true;
        }
        return false;
    }

    /**
     * Check if on submit step
     */
    isSubmitStep() {
        const submitBtn = document.querySelector(this.selectors.submitButton);
        return submitBtn !== null && this.isVisible(submitBtn);
    }
}

// Register adapter
AdapterRegistry.register('workday', WorkdayAdapter);

// Export for content scripts
if (typeof window !== 'undefined') {
    window.WorkdayAdapter = WorkdayAdapter;
}

/**
 * GreenhouseAdapter - Handles Greenhouse job application forms
 * 
 * Greenhouse forms are typically single-page with:
 * - Standard HTML inputs
 * - Custom questions section
 * - EEO/Demographic questions
 */
class GreenhouseAdapter extends PlatformAdapter {
    constructor() {
        super();
        this.platformName = 'Greenhouse';
        this.platformId = 'greenhouse';
        this.selectors = GreenhouseSelectors;
    }

    isFormReady() {
        return document.querySelector(this.selectors.form) !== null;
    }

    findQuestionBlocks() {
        const form = document.querySelector(this.selectors.form);
        if (!form) return [];

        const blocks = [];
        const seen = new Set();

        // Get all field containers
        form.querySelectorAll(this.selectors.questionBlock).forEach(block => {
            // Avoid duplicates and hidden fields
            if (seen.has(block)) return;

            const input = block.querySelector('input, textarea, select');
            if (!input) return;
            if (input.type === 'hidden') return;
            if (!this.isVisible(block)) return;

            seen.add(block);
            blocks.push(block);
        });

        console.log(`[Greenhouse] Found ${blocks.length} question blocks`);
        return blocks;
    }

    extractQuestion(block) {
        const label = block.querySelector(this.selectors.questionLabel);
        const text = label?.textContent?.trim() || '';

        let type = 'text';
        let options = null;
        let inputElement = null;

        // Check input type
        if (block.querySelector(this.selectors.select)) {
            type = 'select';
            inputElement = block.querySelector(this.selectors.select);
            options = Array.from(inputElement.options)
                .filter(o => o.value) // Skip empty option
                .map(o => ({
                    value: o.value,
                    text: o.textContent.trim()
                }));
        } else if (block.querySelector(this.selectors.radio)) {
            type = 'radio';
            options = this.extractRadioOptions(block);
        } else if (block.querySelector(this.selectors.checkbox)) {
            type = 'checkbox';
            inputElement = block.querySelector(this.selectors.checkbox);
        } else if (block.querySelector(this.selectors.textarea)) {
            type = 'textarea';
            inputElement = block.querySelector(this.selectors.textarea);
        } else if (block.querySelector(this.selectors.file)) {
            type = 'file';
            inputElement = block.querySelector(this.selectors.file);
        } else {
            inputElement = block.querySelector(this.selectors.textInput);
        }

        const required = block.classList.contains('required') ||
            block.querySelector(this.selectors.requiredIndicator) !== null ||
            inputElement?.required === true;

        return new CanonicalQuestion({
            text,
            type,
            options,
            required,
            platform: this.platformId,
            block,
            metadata: { inputElement }
        });
    }

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

    async fillAnswer(block, answer) {
        const question = this.extractQuestion(block);
        const input = question.metadata.inputElement;

        console.log(`[Greenhouse] Filling "${question.text.substring(0, 30)}..." type:${question.type}`);

        try {
            switch (question.type) {
                case 'text':
                case 'textarea':
                    return await this.simulateInput(input, String(answer));

                case 'select':
                    return this.fillSelect(input, answer);

                case 'radio':
                    return this.fillRadio(block, answer, question.options);

                case 'checkbox':
                    return this.fillCheckbox(input, answer);

                case 'file':
                    console.log('[Greenhouse] File upload skipped');
                    return false;

                default:
                    if (input) {
                        return await this.simulateInput(input, String(answer));
                    }
                    return false;
            }
        } catch (error) {
            console.error(`[Greenhouse] Fill error:`, error);
            return false;
        }
    }

    fillSelect(select, value) {
        if (!select) return false;

        const normalizedValue = String(value).toLowerCase().trim();

        // Try exact match first
        for (const opt of select.options) {
            if (opt.value.toLowerCase() === normalizedValue ||
                opt.textContent.toLowerCase().trim() === normalizedValue) {
                select.value = opt.value;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
        }

        // Try contains match
        for (const opt of select.options) {
            const optText = opt.textContent.toLowerCase().trim();
            if (optText.includes(normalizedValue) || normalizedValue.includes(optText)) {
                select.value = opt.value;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
        }

        console.log(`[Greenhouse] No select match for: ${value}`);
        return false;
    }

    fillRadio(block, value, options) {
        const normalizedValue = String(value).toLowerCase().trim();

        for (const opt of (options || [])) {
            const optText = opt.text.toLowerCase().trim();

            if (optText.includes(normalizedValue) ||
                normalizedValue.includes(optText) ||
                opt.value.toLowerCase() === normalizedValue) {

                if (opt.element) {
                    opt.element.click();
                    opt.element.dispatchEvent(new Event('change', { bubbles: true }));
                    return true;
                }
            }
        }

        // Special handling for yes/no
        if (/yes|true|1/i.test(normalizedValue)) {
            const yesOpt = (options || []).find(o => /yes|true/i.test(o.text));
            if (yesOpt?.element) {
                yesOpt.element.click();
                return true;
            }
        } else if (/no|false|0/i.test(normalizedValue)) {
            const noOpt = (options || []).find(o => /no|false/i.test(o.text));
            if (noOpt?.element) {
                noOpt.element.click();
                return true;
            }
        }

        return false;
    }

    fillCheckbox(input, value) {
        if (!input) return false;

        const shouldCheck = value === true ||
            value === 'yes' ||
            value === 'true' ||
            value === 1;

        if (input.checked !== shouldCheck) {
            input.click();
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return true;
    }

    verify(block, expectedAnswer) {
        const question = this.extractQuestion(block);
        const input = question.metadata.inputElement;

        switch (question.type) {
            case 'text':
            case 'textarea':
                return input?.value?.length > 0;

            case 'select':
                return input?.value !== '' && input?.selectedIndex > 0;

            case 'checkbox':
                return true; // Click was made

            case 'radio':
                return block.querySelector(`${this.selectors.radio}:checked`) !== null;

            default:
                return true;
        }
    }

    getStepInfo() {
        // Greenhouse is typically single-page
        return { current: 1, total: 1, isMultiStep: false };
    }
}

// Register adapter
AdapterRegistry.register('greenhouse', GreenhouseAdapter);

if (typeof window !== 'undefined') {
    window.GreenhouseAdapter = GreenhouseAdapter;
}

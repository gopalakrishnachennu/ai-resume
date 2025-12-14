/**
 * LeverAdapter - Handles Lever job application forms
 * 
 * Lever forms are clean, single-page with:
 * - Simple HTML structure
 * - Custom questions
 * - EEO fields
 */
class LeverAdapter extends PlatformAdapter {
    constructor() {
        super();
        this.platformName = 'Lever';
        this.platformId = 'lever';
        this.selectors = {
            form: '.application-form, form[action*="submit"], .postings-form',
            section: '.application-section, .postings-section',
            questionBlock: '.application-question, .application-field, .postings-field, [class*="field"]',
            questionLabel: 'label, .question-label, .field-label',
            requiredIndicator: '.required, [required], .field-required',
            textInput: 'input[type="text"], input[type="email"], input[type="tel"], input[type="url"]',
            textarea: 'textarea',
            select: 'select',
            radio: 'input[type="radio"]',
            checkbox: 'input[type="checkbox"]',
            file: 'input[type="file"]',
            submitButton: 'button[type="submit"], .postings-btn-submit, .application-submit',
            fields: {
                name: 'input[name="name"], #resume-name',
                email: 'input[name="email"], #resume-email',
                phone: 'input[name="phone"], #resume-phone',
                resume: 'input[name="resume"], #resume-upload',
                linkedin: 'input[name*="linkedin"]',
                github: 'input[name*="github"]',
                portfolio: 'input[name*="portfolio"], input[name*="website"]'
            }
        };
    }

    isFormReady() {
        return document.querySelector(this.selectors.form) !== null;
    }

    findQuestionBlocks() {
        const form = document.querySelector(this.selectors.form);
        if (!form) return [];

        const blocks = [];

        form.querySelectorAll(this.selectors.questionBlock).forEach(block => {
            const input = block.querySelector('input, textarea, select');
            if (input && input.type !== 'hidden' && this.isVisible(block)) {
                blocks.push(block);
            }
        });

        console.log(`[Lever] Found ${blocks.length} question blocks`);
        return blocks;
    }

    extractQuestion(block) {
        const label = block.querySelector(this.selectors.questionLabel);
        const text = label?.textContent?.trim() || '';

        let type = 'text';
        let options = null;
        let inputElement = null;

        if (block.querySelector('select')) {
            type = 'select';
            inputElement = block.querySelector('select');
            options = Array.from(inputElement.options)
                .filter(o => o.value)
                .map(o => ({ value: o.value, text: o.textContent.trim() }));
        } else if (block.querySelector('input[type="radio"]')) {
            type = 'radio';
            options = Array.from(block.querySelectorAll('input[type="radio"]')).map(r => {
                const lbl = r.closest('label') || document.querySelector(`label[for="${r.id}"]`);
                return { value: r.value, text: lbl?.textContent?.trim() || r.value, element: r };
            });
        } else if (block.querySelectorAll('input[type="checkbox"]').length > 1) {
            // CHECKBOX GROUP (like ethnicity with multiple options)
            type = 'checkbox-group';
            options = Array.from(block.querySelectorAll('input[type="checkbox"]')).map(cb => {
                const lbl = cb.closest('label') || document.querySelector(`label[for="${cb.id}"]`);
                return { value: cb.value, text: lbl?.textContent?.trim() || cb.value, element: cb };
            });
        } else if (block.querySelector('input[type="checkbox"]')) {
            type = 'checkbox';
            inputElement = block.querySelector('input[type="checkbox"]');
        } else if (block.querySelector('textarea')) {
            type = 'textarea';
            inputElement = block.querySelector('textarea');
        } else if (block.querySelector('input[type="file"]')) {
            type = 'file';
            inputElement = block.querySelector('input[type="file"]');
        } else {
            inputElement = block.querySelector(this.selectors.textInput);
        }

        return new CanonicalQuestion({
            text,
            type,
            options,
            required: block.querySelector(this.selectors.requiredIndicator) !== null,
            platform: this.platformId,
            block,
            metadata: { inputElement }
        });
    }

    async fillAnswer(block, answer) {
        const q = this.extractQuestion(block);
        const input = q.metadata.inputElement;

        console.log(`[Lever] Filling "${q.text.substring(0, 30)}..." type:${q.type} answer:${String(answer).substring(0, 20)}`);

        try {
            switch (q.type) {
                case 'text':
                case 'textarea':
                    return await this.simulateInput(input, String(answer));

                case 'select':
                    return this.fillSelect(input, answer);

                case 'radio':
                    return this.fillRadio(block, answer, q.options);

                case 'checkbox-group':
                    return this.fillCheckboxGroup(block, answer, q.options);

                case 'checkbox':
                    const shouldCheck = answer === true || answer === 'yes' || answer === 'Yes';
                    if (input?.checked !== shouldCheck) input?.click();
                    return true;

                case 'file':
                    console.log('[Lever] File upload skipped');
                    return false;

                default:
                    if (input) return await this.simulateInput(input, String(answer));
                    return false;
            }
        } catch (error) {
            console.error(`[Lever] Fill error:`, error);
            return false;
        }
    }

    fillSelect(select, value) {
        if (!select) return false;
        const normalized = String(value).toLowerCase();

        for (const opt of select.options) {
            if (opt.textContent.toLowerCase().includes(normalized) ||
                normalized.includes(opt.textContent.toLowerCase())) {
                select.value = opt.value;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
        }
        return false;
    }

    fillRadio(block, value, options) {
        const normalized = String(value).toLowerCase().trim();
        console.log(`[Lever] fillRadio looking for: "${normalized}" in ${options?.length || 0} options`);

        // EXACT MATCH FIRST (critical for gender: "Male" should not match "Female")
        for (const opt of (options || [])) {
            const optText = opt.text.toLowerCase().trim();
            if (optText === normalized) {
                console.log(`[Lever] EXACT match: "${opt.text}"`);
                opt.element?.click();
                return true;
            }
        }

        // Word-boundary match ("Male" matches "Male" but not "Female")
        for (const opt of (options || [])) {
            const optText = opt.text.toLowerCase();
            // Check if the answer is a complete word in the option
            const regex = new RegExp(`\\b${normalized}\\b`, 'i');
            if (regex.test(optText)) {
                console.log(`[Lever] Word-boundary match: "${opt.text}"`);
                opt.element?.click();
                return true;
            }
        }

        // Last resort: contains match (only if very short options)
        for (const opt of (options || [])) {
            const optText = opt.text.toLowerCase();
            if (optText.length < 20 && optText.includes(normalized)) {
                console.log(`[Lever] Contains match: "${opt.text}"`);
                opt.element?.click();
                return true;
            }
        }

        console.log(`[Lever] No match found for: "${normalized}"`);
        return false;
    }

    /**
     * Fill checkbox group (like ethnicity - select multiple)
     */
    fillCheckboxGroup(block, value, options) {
        const normalized = String(value).toLowerCase().trim();
        console.log(`[Lever] fillCheckboxGroup looking for: "${normalized}"`);

        for (const opt of (options || [])) {
            const optText = opt.text.toLowerCase().trim();

            // Check if answer matches this option
            if (optText.includes(normalized) || normalized.includes(optText)) {
                if (opt.element && !opt.element.checked) {
                    opt.element.click();
                    console.log(`[Lever] Checked: "${opt.text}"`);
                    return true;
                }
            }
        }

        return false;
    }

    verify(block, expectedAnswer) {
        const q = this.extractQuestion(block);
        const input = q.metadata.inputElement;

        if (q.type === 'radio') {
            return block.querySelector('input[type="radio"]:checked') !== null;
        }
        return input?.value?.length > 0 || input?.checked === true;
    }

    getStepInfo() {
        return { current: 1, total: 1, isMultiStep: false };
    }
}

// Register
AdapterRegistry.register('lever', LeverAdapter);

if (typeof window !== 'undefined') {
    window.LeverAdapter = LeverAdapter;
}

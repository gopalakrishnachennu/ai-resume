/**
 * GenericAdapter - Fallback adapter for unknown platforms
 * 
 * Uses common patterns that work on most job application forms.
 */
class GenericAdapter extends PlatformAdapter {
    constructor() {
        super();
        this.platformName = 'Generic';
        this.platformId = 'generic';
        this.selectors = {
            form: 'form',
            questionBlock: '.form-group, .field, .form-field, [class*="field"], [class*="input-group"]',
            questionLabel: 'label',
            textInput: 'input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input[type="number"]',
            textarea: 'textarea',
            select: 'select',
            radio: 'input[type="radio"]',
            checkbox: 'input[type="checkbox"]',
            file: 'input[type="file"]',
            submitButton: 'button[type="submit"], input[type="submit"], .submit, .apply-button'
        };
    }

    isFormReady() {
        const form = document.querySelector(this.selectors.form);
        if (!form) return false;

        const inputs = form.querySelectorAll('input, textarea, select');
        return inputs.length > 0;
    }

    findQuestionBlocks() {
        const blocks = [];
        const seen = new Set();

        // Try to find form first
        const forms = document.querySelectorAll(this.selectors.form);
        const container = forms.length > 0 ? forms[0] : document.body;

        // Get field containers
        container.querySelectorAll(this.selectors.questionBlock).forEach(block => {
            if (seen.has(block)) return;

            const input = block.querySelector('input, textarea, select');
            if (!input || input.type === 'hidden' || input.type === 'submit') return;
            if (!this.isVisible(block)) return;

            seen.add(block);
            blocks.push(block);
        });

        // Fallback: wrap standalone inputs
        if (blocks.length === 0) {
            container.querySelectorAll('input, textarea, select').forEach(input => {
                if (input.type === 'hidden' || input.type === 'submit') return;
                if (!this.isVisible(input)) return;

                // Use parent as block
                const block = input.closest('.form-group, .field') || input.parentElement;
                if (block && !seen.has(block)) {
                    seen.add(block);
                    blocks.push(block);
                }
            });
        }

        console.log(`[Generic] Found ${blocks.length} question blocks`);
        return blocks;
    }

    extractQuestion(block) {
        const label = this.findLabel(block.querySelector('input, textarea, select')) ||
            block.querySelector(this.selectors.questionLabel);
        const text = label?.textContent?.trim() ||
            block.querySelector('input, textarea, select')?.placeholder || '';

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
            options = Array.from(block.querySelectorAll('input[type="radio"]')).map(r => ({
                value: r.value,
                text: (r.closest('label') || document.querySelector(`label[for="${r.id}"]`))?.textContent?.trim() || r.value,
                element: r
            }));
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
            required: inputElement?.required === true,
            platform: this.platformId,
            block,
            metadata: { inputElement }
        });
    }

    async fillAnswer(block, answer) {
        const q = this.extractQuestion(block);
        const input = q.metadata.inputElement;

        try {
            switch (q.type) {
                case 'text':
                case 'textarea':
                    return await this.simulateInput(input, String(answer));

                case 'select':
                    return this.fillSelect(input, answer);

                case 'radio':
                    return this.fillRadio(block, answer, q.options);

                case 'checkbox':
                    const shouldCheck = answer === true || answer === 'yes';
                    if (input?.checked !== shouldCheck) input?.click();
                    return true;

                default:
                    if (input) return await this.simulateInput(input, String(answer));
                    return false;
            }
        } catch (error) {
            console.error(`[Generic] Fill error:`, error);
            return false;
        }
    }

    fillSelect(select, value) {
        if (!select) return false;
        const normalized = String(value).toLowerCase();

        for (const opt of select.options) {
            const optText = opt.textContent.toLowerCase();
            if (optText.includes(normalized) || normalized.includes(optText)) {
                select.value = opt.value;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
        }
        return false;
    }

    fillRadio(block, value, options) {
        const normalized = String(value).toLowerCase();

        for (const opt of (options || [])) {
            if (opt.text.toLowerCase().includes(normalized)) {
                opt.element?.click();
                return true;
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
}

// Register
AdapterRegistry.register('generic', GenericAdapter);

if (typeof window !== 'undefined') {
    window.GenericAdapter = GenericAdapter;
}

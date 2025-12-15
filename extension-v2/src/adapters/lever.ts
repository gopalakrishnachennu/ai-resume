import { BaseAdapter } from "./base";
import { FieldInfo } from "../matcher";

/**
 * Lever adapter - Simple, clean HTML forms
 * Used by many startups and tech companies
 */
export class LeverAdapter extends BaseAdapter {
    readonly name = "lever";
    readonly hostPatterns = [/jobs\.lever\.co/i, /lever\.co\/.*\/apply/i];

    async getFields(): Promise<FieldInfo[]> {
        const fields: FieldInfo[] = [];

        // 1. Text Inputs (Inputs, Textareas)
        // Broad selector to catch custom fields
        const textInputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
            '.application-form input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"]):not([type="file"]), ' +
            '.application-form textarea'
        );

        for (const input of textInputs) {
            if (this.isHidden(input)) continue;

            // Try to find label more aggressively
            const label = this.getLeverLabel(input);
            fields.push({
                label: label,
                name: input.name,
                id: input.id,
                type: input.tagName === 'TEXTAREA' ? 'textarea' : (input.type || 'text'),
                element: input
            });
        }

        // 2. Selects
        const selects = document.querySelectorAll<HTMLSelectElement>('.application-form select');
        for (const select of selects) {
            fields.push({
                label: this.getLeverLabel(select),
                name: select.name,
                id: select.id,
                type: "select",
                options: this.getOptions(select),
                element: select
            });
        }

        // 3. Radio Groups (Sponsorship etc.)
        const radios = document.querySelectorAll<HTMLInputElement>('.application-form input[type="radio"]');
        const radioGroups = new Set<string>();

        for (const radio of radios) {
            if (radio.name && !radioGroups.has(radio.name)) {
                radioGroups.add(radio.name);

                // For radio groups, the label is usually the question text above the group
                const questionEl = radio.closest('.application-question');
                let label = '';

                if (questionEl) {
                    const labelEl = questionEl.querySelector('.application-label');
                    if (labelEl) label = labelEl.textContent?.trim() || '';
                }

                if (!label) label = this.getLeverLabel(radio);

                fields.push({
                    label: label,
                    name: radio.name,
                    type: "radio",
                    options: this.getOptions(radio),
                    element: radio // Store first radio as representative
                });
            }
        }

        // 4. Checkboxes
        const checkboxes = document.querySelectorAll<HTMLInputElement>('.application-form input[type="checkbox"]');
        for (const checkbox of checkboxes) {
            fields.push({
                label: this.getLeverLabel(checkbox),
                name: checkbox.name,
                id: checkbox.id,
                type: "checkbox",
                element: checkbox
            });
        }

        // 5. Lever Custom Dropdowns (div-based, not native select)
        // These show "Select..." and open a dropdown panel when clicked
        // Multiple possible selectors for different Lever implementations
        const customDropdownSelectors = [
            '.application-form .application-dropdown',
            '.application-form [data-qa="dropdown"]',
            '.application-form [role="listbox"]',
            '.application-form [role="combobox"]',
            '.application-form .lever-dropdown',
            '.application-form .select-dropdown',
            '.application-form .custom-select',
            '.application-form [class*="dropdown"]',
            '.application-form [class*="select"]'
        ];

        const customDropdowns = document.querySelectorAll<HTMLElement>(customDropdownSelectors.join(', '));

        // Also look for divs that contain "Select..." text (fallback)
        const allDivs = document.querySelectorAll<HTMLElement>('.application-form div');
        const selectTextDivs: HTMLElement[] = [];

        for (const div of allDivs) {
            // Check if this div shows "Select..." and is likely a dropdown trigger
            const text = div.textContent?.trim() || '';
            if (text === 'Select...' || text === 'Select' || text.startsWith('Select...')) {
                // Make sure it's not inside another already-matched dropdown
                if (!div.closest('[role="listbox"], [role="combobox"], .application-dropdown')) {
                    selectTextDivs.push(div);
                }
            }
        }

        // Combine both detection methods
        const allDropdowns = new Set([...customDropdowns, ...selectTextDivs]);

        console.log(`[Lever] Found ${allDropdowns.size} potential custom dropdowns`);

        for (const dropdown of allDropdowns) {
            const label = this.getLeverLabel(dropdown);
            if (!label) continue; // Skip if we can't determine what this dropdown is for

            // Get options from dropdown items if visible
            const optionEls = dropdown.querySelectorAll<HTMLElement>('[data-qa="dropdown-option"], .dropdown-option, li, [role="option"]');
            const options = Array.from(optionEls).map(o => o.textContent?.trim() || '').filter(o => o && o !== 'Select...');

            fields.push({
                label: label,
                name: dropdown.getAttribute('data-name') || dropdown.id || '',
                id: dropdown.id,
                type: "lever-dropdown",
                options: options.length ? options : undefined,
                element: dropdown
            });
            console.log(`[Lever] Detected custom dropdown: "${label}"`);
        }

        console.log(`[Lever] Found ${fields.length} fields total`);
        return fields;
    }

    async fill(field: FieldInfo, value: string): Promise<boolean> {
        const el = field.element;

        try {
            switch (field.type) {
                case "text":
                case "email":
                case "tel":
                case "url":
                case "textarea":
                    await this.typeValue(el as HTMLInputElement, value);
                    return true;

                case "select":
                    return await this.selectOption(el as HTMLSelectElement, value);

                case "radio":
                    return await this.clickLeverRadio(field.name!, value);

                case "checkbox":
                    // For checkboxes, match value to label text
                    const checkbox = el as HTMLInputElement;
                    const checkboxLabel = this.getLeverLabel(checkbox).toLowerCase();
                    const valueNorm = value.toLowerCase();

                    // Check if this checkbox matches the expected value
                    if (checkboxLabel.includes(valueNorm) || valueNorm.includes(checkboxLabel)) {
                        if (!checkbox.checked) checkbox.click();
                        return true;
                    } else if (valueNorm === "yes" || valueNorm === "true") {
                        if (!checkbox.checked) checkbox.click();
                        return true;
                    } else if (valueNorm === "no" || valueNorm === "false") {
                        if (checkbox.checked) checkbox.click();
                        return true;
                    }
                    return false;

                case "lever-dropdown":
                    return await this.clickLeverDropdown(el, value);

                default:
                    console.warn(`[Lever] Unknown field type: ${field.type}`);
                    return false;
            }
        } catch (e) {
            console.error(`[Lever] Fill failed for ${field.label}`, e);
            return false;
        }
    }

    // --- Helpers ---

    private isHidden(el: HTMLElement): boolean {
        return el.offsetParent === null;
    }

    private getLeverLabel(el: HTMLElement): string {
        // Lever specific: .application-label
        const container = el.closest('.application-field') || el.closest('.application-question');
        if (container) {
            const label = container.querySelector('.application-label');
            if (label) return label.textContent?.trim() || '';
        }

        // Fallback to standard
        return this.getLabel(el);
    }

    private async clickLeverRadio(name: string, value: string): Promise<boolean> {
        const radios = document.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`);

        for (const radio of radios) {
            // Check label next to radio
            const wrapper = radio.closest('label');
            let text = wrapper?.textContent?.trim() || '';

            // Or sibling label
            if (!text && radio.id) {
                const label = document.querySelector(`label[for="${radio.id}"]`);
                if (label) text = label.textContent?.trim() || '';
            }

            if (!text) text = radio.value;

            // Loose match "Yes" in "Yes, I need sponsorship"
            if (text.toLowerCase().includes(value.toLowerCase()) ||
                value.toLowerCase().includes(text.toLowerCase())) {
                radio.click();
                radio.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
        }
        return false;
    }

    /**
     * Handle Lever's custom div-based dropdowns
     */
    private async clickLeverDropdown(dropdown: HTMLElement, value: string): Promise<boolean> {
        try {
            console.log(`[Lever] Clicking custom dropdown to open...`);

            // Click the dropdown trigger to open it
            dropdown.click();

            // Wait for dropdown options to appear
            await new Promise(r => setTimeout(r, 300));

            // Find the dropdown options (they might be in a portal/sibling element)
            const container = dropdown.closest('.application-question') || document.body;
            const optionSelectors = [
                '[data-qa="dropdown-option"]',
                '.dropdown-option',
                '.application-dropdown-option',
                '.lever-dropdown-option',
                'li[role="option"]',
                '.select-option'
            ];

            let options: NodeListOf<HTMLElement> | HTMLElement[] = container.querySelectorAll<HTMLElement>(optionSelectors.join(', '));

            // If no options in container, try document-wide (for portal dropdowns)
            if (options.length === 0) {
                options = document.querySelectorAll<HTMLElement>(optionSelectors.join(', '));
            }

            console.log(`[Lever] Found ${options.length} dropdown options`);

            // Find and click matching option
            const valueLower = value.toLowerCase();
            for (const option of options) {
                const text = option.textContent?.trim().toLowerCase() || '';

                // Match "Yes" to "Yes", "No" to "No", or partial match
                if (text === valueLower ||
                    text.includes(valueLower) ||
                    valueLower.includes(text)) {
                    console.log(`[Lever] Clicking option: "${option.textContent?.trim()}"`);
                    option.click();
                    return true;
                }
            }

            console.warn(`[Lever] No matching option found for: "${value}"`);
            // Click elsewhere to close dropdown
            document.body.click();
            return false;

        } catch (e) {
            console.error(`[Lever] Custom dropdown fill failed:`, e);
            return false;
        }
    }
}

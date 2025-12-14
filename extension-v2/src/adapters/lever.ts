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

        console.log(`[Lever] Found ${fields.length} fields`);
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
}

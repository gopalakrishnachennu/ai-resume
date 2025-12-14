import { BaseAdapter } from "./base";
import { FieldInfo } from "../matcher";

/**
 * LinkedIn adapter - Handles Easy Apply modal and Shadow DOM
 */
export class LinkedInAdapter extends BaseAdapter {
    readonly name = "linkedin";
    readonly hostPatterns = [/linkedin\.com/i];

    async waitUntilReady(): Promise<void> {
        // Wait for Easy Apply modal to open
        await new Promise(r => setTimeout(r, 1000));

        // Check for modal
        const modal = document.querySelector('.jobs-easy-apply-modal, [data-test-modal]');
        if (!modal) {
            console.warn("[LinkedIn] Easy Apply modal not found");
        }
    }

    async getFields(): Promise<FieldInfo[]> {
        const fields: FieldInfo[] = [];

        // LinkedIn Easy Apply modal container
        const modal = document.querySelector('.jobs-easy-apply-modal, [data-test-modal]') || document;

        // Text inputs
        const inputs = modal.querySelectorAll<HTMLInputElement>(
            'input[type="text"], input[type="email"], input[type="tel"], input[type="url"], textarea'
        );

        for (const input of inputs) {
            if (input.type === "hidden" || input.disabled) continue;

            fields.push({
                label: this.getLinkedInLabel(input),
                name: input.name,
                id: input.id,
                type: input.type || "text",
                element: input
            });
        }

        // Dropdowns (LinkedIn uses custom select dropdowns)
        const selects = modal.querySelectorAll<HTMLSelectElement>('select');

        for (const select of selects) {
            fields.push({
                label: this.getLinkedInLabel(select),
                name: select.name,
                id: select.id,
                type: "select",
                options: this.getOptions(select),
                element: select
            });
        }

        // LinkedIn's custom dropdown components
        const customDropdowns = modal.querySelectorAll('[data-test-text-selectable-option]');
        // These need special handling

        // Radio buttons
        const radioGroups = new Set<string>();
        const radios = modal.querySelectorAll<HTMLInputElement>('input[type="radio"]');

        for (const radio of radios) {
            if (radio.name && !radioGroups.has(radio.name)) {
                radioGroups.add(radio.name);
                const container = radio.closest('.fb-dash-form-element') || radio.parentElement;
                fields.push({
                    label: this.getLinkedInLabel(container as HTMLElement || radio),
                    name: radio.name,
                    type: "radio",
                    options: this.getOptions(radio),
                    element: radio
                });
            }
        }

        // Checkboxes
        const checkboxes = modal.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');

        for (const checkbox of checkboxes) {
            fields.push({
                label: this.getLinkedInLabel(checkbox),
                name: checkbox.name,
                id: checkbox.id,
                type: "checkbox",
                element: checkbox
            });
        }

        console.log(`[LinkedIn] Found ${fields.length} fields`);
        return fields;
    }

    /**
     * LinkedIn-specific label extraction
     */
    private getLinkedInLabel(el: HTMLElement): string {
        // Try LinkedIn's label structure
        const container = el.closest('.fb-dash-form-element, .jobs-easy-apply-form-section__grouping');
        if (container) {
            const label = container.querySelector('label, .fb-dash-form-element__label, .t-14');
            if (label) return label.textContent?.trim() || "";
        }

        // Try aria-label
        const ariaLabel = el.getAttribute("aria-label");
        if (ariaLabel) return ariaLabel.trim();

        // Fallback to standard
        return this.getLabel(el);
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
                    // LinkedIn also uses React-like patterns
                    await this.fillLinkedInInput(el as HTMLInputElement, value);
                    return true;

                case "select":
                    return await this.selectOption(el as HTMLSelectElement, value);

                case "radio":
                    return await this.clickOption(field.name!, value);

                case "checkbox":
                    const checkbox = el as HTMLInputElement;
                    const shouldCheck = /yes|true|agree/i.test(value);
                    if (shouldCheck !== checkbox.checked) {
                        checkbox.click();
                    }
                    return true;

                default:
                    await this.fillLinkedInInput(el as HTMLInputElement, value);
                    return true;
            }
        } catch (e) {
            console.error(`[LinkedIn] Fill failed for ${field.label}`, e);
            return false;
        }
    }

    /**
     * Fill LinkedIn input (handles their React-like binding)
     */
    private async fillLinkedInInput(el: HTMLInputElement | HTMLTextAreaElement, value: string): Promise<void> {
        el.focus();

        // Clear first
        el.value = "";
        el.dispatchEvent(new Event('input', { bubbles: true }));

        // Set value
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
        if (setter) {
            setter.call(el, value);
        } else {
            el.value = value;
        }

        // Trigger events
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));

        // LinkedIn sometimes needs a blur to trigger validation
        await new Promise(r => setTimeout(r, 100));
        el.blur();
    }
}

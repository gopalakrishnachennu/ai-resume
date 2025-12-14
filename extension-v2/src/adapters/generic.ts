import { BaseAdapter } from "./base";
import { FieldInfo } from "../matcher";

/**
 * Generic adapter - Fallback for unknown platforms
 * Uses broad selectors to find common form elements
 */
export class GenericAdapter extends BaseAdapter {
    readonly name = "generic";
    readonly hostPatterns = [/.*/]; // Matches everything as fallback

    async getFields(): Promise<FieldInfo[]> {
        const fields: FieldInfo[] = [];

        // Find form containers (prioritize application forms)
        const forms = document.querySelectorAll(
            'form[id*="apply"], form[id*="application"], form[class*="apply"], ' +
            'form[class*="application"], form, .application-form, #application'
        );

        const form = forms.length > 0 ? forms[0] : document;

        // Text inputs
        const inputs = form.querySelectorAll<HTMLInputElement>(
            'input[type="text"], input[type="email"], input[type="tel"], ' +
            'input[type="url"], input[type="number"], textarea'
        );

        for (const input of inputs) {
            if (this.shouldSkip(input)) continue;

            fields.push({
                label: this.getLabel(input),
                name: input.name,
                id: input.id,
                type: input.type || "text",
                element: input
            });
        }

        // Dropdowns
        const selects = form.querySelectorAll<HTMLSelectElement>('select');

        for (const select of selects) {
            if (this.shouldSkip(select)) continue;

            fields.push({
                label: this.getLabel(select),
                name: select.name,
                id: select.id,
                type: "select",
                options: this.getOptions(select),
                element: select
            });
        }

        // Radio buttons (group by name)
        const radioGroups = new Set<string>();
        const radios = form.querySelectorAll<HTMLInputElement>('input[type="radio"]');

        for (const radio of radios) {
            if (radio.name && !radioGroups.has(radio.name)) {
                radioGroups.add(radio.name);
                fields.push({
                    label: this.getRadioGroupLabel(radio),
                    name: radio.name,
                    type: "radio",
                    options: this.getOptions(radio),
                    element: radio
                });
            }
        }

        // Checkboxes
        const checkboxes = form.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');

        for (const checkbox of checkboxes) {
            if (this.shouldSkip(checkbox)) continue;

            fields.push({
                label: this.getLabel(checkbox),
                name: checkbox.name,
                id: checkbox.id,
                type: "checkbox",
                element: checkbox
            });
        }

        // File inputs (for resume upload)
        const fileInputs = form.querySelectorAll<HTMLInputElement>('input[type="file"]');

        for (const fileInput of fileInputs) {
            fields.push({
                label: this.getLabel(fileInput) || "Resume/CV Upload",
                name: fileInput.name,
                id: fileInput.id,
                type: "file",
                element: fileInput
            });
        }

        console.log(`[Generic] Found ${fields.length} fields`);
        return fields;
    }

    /**
     * Determine if an input should be skipped
     */
    private shouldSkip(el: HTMLInputElement | HTMLSelectElement): boolean {
        // Skip hidden, disabled, or already filled
        if (el.type === "hidden" || el.disabled) return true;

        // Skip if not visible
        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") return true;

        // Skip common non-application fields
        const name = el.name?.toLowerCase() || "";
        const id = el.id?.toLowerCase() || "";
        if (name.includes("captcha") || id.includes("captcha")) return true;
        if (name.includes("search") || id.includes("search")) return true;

        return false;
    }

    /**
     * Get label for radio group
     */
    private getRadioGroupLabel(radio: HTMLInputElement): string {
        // Try fieldset legend
        const fieldset = radio.closest("fieldset");
        if (fieldset) {
            const legend = fieldset.querySelector("legend");
            if (legend) return legend.textContent?.trim() || "";
        }

        // Try parent container label
        const container = radio.closest(".form-group, .field, .question");
        if (container) {
            const label = container.querySelector("label, .label, h3, h4");
            if (label) return label.textContent?.trim() || "";
        }

        return this.getLabel(radio);
    }

    async fill(field: FieldInfo, value: string): Promise<boolean> {
        const el = field.element;

        try {
            switch (field.type) {
                case "text":
                case "email":
                case "tel":
                case "url":
                case "number":
                case "textarea":
                    await this.typeValue(el as HTMLInputElement, value);
                    return true;

                case "select":
                    return await this.selectOption(el as HTMLSelectElement, value);

                case "radio":
                    return await this.clickOption(field.name!, value);

                case "checkbox":
                    const checkbox = el as HTMLInputElement;
                    const shouldCheck = /yes|true|agree|accept/i.test(value);
                    if (shouldCheck !== checkbox.checked) {
                        checkbox.click();
                    }
                    return true;

                case "file":
                    // File handling is done separately
                    console.log(`[Generic] File input detected: ${field.label}`);
                    return false;

                default:
                    await this.typeValue(el as HTMLInputElement, value);
                    return true;
            }
        } catch (e) {
            console.error(`[Generic] Fill failed for ${field.label}`, e);
            return false;
        }
    }
}

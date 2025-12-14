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

        // Text inputs
        const inputs = document.querySelectorAll<HTMLInputElement>(
            '.application-form input[type="text"], ' +
            '.application-form input[type="email"], ' +
            '.application-form input[type="tel"], ' +
            '.application-form input[type="url"], ' +
            '.application-form textarea'
        );

        for (const input of inputs) {
            fields.push({
                label: this.getLabel(input),
                name: input.name,
                id: input.id,
                type: input.type || "text",
                element: input
            });
        }

        // Dropdowns
        const selects = document.querySelectorAll<HTMLSelectElement>(
            '.application-form select'
        );

        for (const select of selects) {
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
        const radios = document.querySelectorAll<HTMLInputElement>(
            '.application-form input[type="radio"]'
        );

        for (const radio of radios) {
            if (radio.name && !radioGroups.has(radio.name)) {
                radioGroups.add(radio.name);
                fields.push({
                    label: this.getLabel(radio.closest(".application-question") || radio),
                    name: radio.name,
                    type: "radio",
                    options: this.getOptions(radio),
                    element: radio
                });
            }
        }

        // Checkboxes
        const checkboxes = document.querySelectorAll<HTMLInputElement>(
            '.application-form input[type="checkbox"]'
        );

        for (const checkbox of checkboxes) {
            fields.push({
                label: this.getLabel(checkbox),
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
                    return await this.clickOption(field.name!, value);

                case "checkbox":
                    const checkbox = el as HTMLInputElement;
                    if (value.toLowerCase() === "yes" || value.toLowerCase() === "true") {
                        if (!checkbox.checked) checkbox.click();
                    } else {
                        if (checkbox.checked) checkbox.click();
                    }
                    return true;

                default:
                    console.warn(`[Lever] Unknown field type: ${field.type}`);
                    return false;
            }
        } catch (e) {
            console.error(`[Lever] Fill failed for ${field.label}`, e);
            return false;
        }
    }
}

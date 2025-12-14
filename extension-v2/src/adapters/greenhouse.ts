import { BaseAdapter } from "./base";
import { FieldInfo } from "../matcher";

/**
 * Greenhouse adapter - Standard HTML forms
 * Very common ATS used by many companies
 */
export class GreenhouseAdapter extends BaseAdapter {
    readonly name = "greenhouse";
    readonly hostPatterns = [/boards\.greenhouse\.io/i, /greenhouse\.io/i];

    async getFields(): Promise<FieldInfo[]> {
        const fields: FieldInfo[] = [];

        // Standard inputs
        const inputs = document.querySelectorAll<HTMLInputElement>(
            '#application input:not([type="hidden"]):not([type="submit"]):not([type="file"]), ' +
            '#application textarea'
        );

        for (const input of inputs) {
            // Skip hidden or disabled
            if (input.type === "hidden" || input.disabled) continue;

            fields.push({
                label: this.getLabel(input),
                name: input.name,
                id: input.id,
                type: input.type || "text",
                element: input
            });
        }

        // Dropdowns
        const selects = document.querySelectorAll<HTMLSelectElement>('#application select');

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

        // Custom questions (Greenhouse uses .field wrapper)
        const customQuestions = document.querySelectorAll('.field');
        for (const q of customQuestions) {
            const label = q.querySelector('label')?.textContent?.trim() || "";
            const input = q.querySelector('input, select, textarea');

            if (input && label && !fields.some(f => f.element === input)) {
                fields.push({
                    label,
                    name: input.getAttribute("name") || "",
                    id: input.id,
                    type: input.tagName.toLowerCase() === "select" ? "select" :
                        (input as HTMLInputElement).type || "text",
                    options: input.tagName.toLowerCase() === "select" ?
                        this.getOptions(input as HTMLElement) : undefined,
                    element: input as HTMLElement
                });
            }
        }

        console.log(`[Greenhouse] Found ${fields.length} fields`);
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
                    const shouldCheck = /yes|true|agree/i.test(value);
                    if (shouldCheck !== checkbox.checked) {
                        checkbox.click();
                    }
                    return true;

                default:
                    await this.typeValue(el as HTMLInputElement, value);
                    return true;
            }
        } catch (e) {
            console.error(`[Greenhouse] Fill failed for ${field.label}`, e);
            return false;
        }
    }
}

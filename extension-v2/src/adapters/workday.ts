import { BaseAdapter } from "./base";
import { FieldInfo } from "../matcher";

/**
 * Workday adapter - Complex React-based forms
 * Requires special handling for custom dropdowns and state management
 */
export class WorkdayAdapter extends BaseAdapter {
    readonly name = "workday";
    readonly hostPatterns = [/\.myworkdayjobs\.com/i, /workday\.com/i, /myworkday\.com/i];

    async waitUntilReady(): Promise<void> {
        // Workday uses React and needs more time to hydrate
        await new Promise(r => setTimeout(r, 1500));

        // Wait for form container
        await this.waitForElement('[data-automation-id="jobPostingPage"]', 5000);
    }

    private async waitForElement(selector: string, timeout: number): Promise<Element | null> {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const el = document.querySelector(selector);
            if (el) return el;
            await new Promise(r => setTimeout(r, 200));
        }
        return null;
    }

    async getFields(): Promise<FieldInfo[]> {
        const fields: FieldInfo[] = [];

        // Workday wraps inputs in data-automation-id containers
        const containers = document.querySelectorAll('[data-automation-id]');

        for (const container of containers) {
            const automationId = container.getAttribute('data-automation-id') || '';

            // Skip non-input containers - RELAXED CHECK
            // We trust the querySelector check below instead of string matching the ID
            // if (!automationId.includes('input') && ... ) continue;

            const input = container.querySelector('input, select, textarea');
            if (!input) continue;

            // Get label from Workday's structure
            const labelEl = container.querySelector('[data-automation-id*="label"], label');
            let label = labelEl?.textContent?.trim() || this.getLabel(input as HTMLElement);

            // Clean label (remove * and extra whitespace)
            label = label.replace(/\*/g, '').replace(/\s+/g, ' ').trim();

            // Detect type
            let type = "text";
            if (input.tagName === "SELECT") {
                type = "select";
            } else if ((input as HTMLInputElement).type) {
                type = (input as HTMLInputElement).type;
            }

            // Check for Workday's custom dropdown
            const isCustomDropdown = container.querySelector('[data-automation-id*="dropdown"]') !== null;
            if (isCustomDropdown) {
                type = "workday-dropdown";
            }

            fields.push({
                label,
                name: input.getAttribute("name") || automationId,
                id: input.id || automationId,
                type,
                options: type === "select" ? this.getOptions(input as HTMLElement) : undefined,
                element: input as HTMLElement
            });
        }

        // Also check for standard inputs not in containers
        const standaloneInputs = document.querySelectorAll(
            'input[data-automation-id]:not([type="hidden"]), ' +
            'textarea[data-automation-id]'
        );

        for (const input of standaloneInputs) {
            if (fields.some(f => f.element === input)) continue;

            fields.push({
                label: this.getLabel(input as HTMLElement),
                name: input.getAttribute("name") || input.getAttribute("data-automation-id") || "",
                id: input.id,
                type: (input as HTMLInputElement).type || "text",
                element: input as HTMLElement
            });
        }

        console.log(`[Workday] Found ${fields.length} fields`);
        return fields;
    }

    async fill(field: FieldInfo, value: string): Promise<boolean> {
        const el = field.element;

        try {
            // Handle Workday's custom dropdowns
            if (field.type === "workday-dropdown") {
                return await this.fillWorkdayDropdown(el, value);
            }

            switch (field.type) {
                case "text":
                case "email":
                case "tel":
                case "url":
                case "textarea":
                    // Workday needs React-style events
                    await this.fillReactInput(el as HTMLInputElement, value);
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
                    await this.fillReactInput(el as HTMLInputElement, value);
                    return true;
            }
        } catch (e) {
            console.error(`[Workday] Fill failed for ${field.label}`, e);
            return false;
        }
    }

    /**
     * Fill React-controlled input (triggers proper state updates)
     */
    private async fillReactInput(el: HTMLInputElement | HTMLTextAreaElement, value: string): Promise<void> {
        // Human-like typing simulation
        // Workday crashes if we force the value too fast without proper events

        el.focus();
        await new Promise(r => setTimeout(r, 50));

        // Method 1: React State Hack (Better for long text)
        // We do this S-L-O-W-L-Y

        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 'value'
        )?.set || Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype, 'value'
        )?.set;

        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(el, value);
        } else {
            el.value = value;
        }

        // Dispatch events with explicitly distinct timing
        // This gives React time to run effects/validation between events
        el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

        await new Promise(r => setTimeout(r, 100)); // Wait for validation

        el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

        await new Promise(r => setTimeout(r, 100)); // Wait before blur
        el.blur();
    }

    /**
     * Re-find Workday element if it was detached (e.g. after section refresh)
     */
    async refreshElement(field: FieldInfo): Promise<HTMLElement | null> {
        // Try standard ID first
        if (field.id) {
            const el = document.getElementById(field.id);
            if (el) return el;
        }

        // Try data-automation-id / name
        if (field.name) {
            // Check direct automation-id on input
            const direct = document.querySelector(`[data-automation-id="${field.name}"]`);
            if (direct) return direct as HTMLElement;

            // Check container automation-id
            const container = document.querySelector(`[data-automation-id="${field.name}"]`);
            if (container) {
                const input = container.querySelector('input, select, textarea');
                if (input) return input as HTMLElement;
            }

            // Fallback: Name attribute
            const byName = document.querySelector(`[name="${field.name}"]`);
            if (byName) return byName as HTMLElement;
        }

        return null;
    }

    /**
     * Handle Workday's custom dropdown components
     */
    private async fillWorkdayDropdown(el: HTMLElement, value: string): Promise<boolean> {
        // Find the dropdown trigger
        const trigger = el.closest('[data-automation-id*="dropdown"]')?.querySelector('button') ||
            el.closest('.css-dropdown')?.querySelector('button');

        if (!trigger) {
            console.warn("[Workday] Can't find dropdown trigger");
            return false;
        }

        // Open dropdown
        trigger.click();
        await new Promise(r => setTimeout(r, 300));

        // Find options (Workday uses listbox pattern)
        const options = document.querySelectorAll('[role="option"], [data-automation-id*="option"]');

        for (const option of options) {
            const text = option.textContent?.trim() || "";
            if (text.toLowerCase().includes(value.toLowerCase())) {
                (option as HTMLElement).click();
                return true;
            }
        }

        // Close if no match
        document.body.click();
        return false;
    }
}

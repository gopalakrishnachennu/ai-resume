import { FieldInfo } from "../matcher";

/**
 * Abstract base class for platform adapters.
 * Each adapter knows how to extract fields and fill values for a specific platform.
 */
export abstract class BaseAdapter {
    abstract readonly name: string;
    abstract readonly hostPatterns: RegExp[];

    /**
     * Check if this adapter supports the given URL
     */
    matches(url: string): boolean {
        return this.hostPatterns.some(p => p.test(url));
    }

    /**
     * Wait for the form to be ready (e.g., after React hydration)
     */
    async waitUntilReady(): Promise<void> {
        // Default: wait 500ms for DOM stability
        await new Promise(r => setTimeout(r, 500));
    }

    /**
     * Extract all fillable fields from the current page
     */
    abstract getFields(): Promise<FieldInfo[]>;

    /**
     * Fill a single field with a value
     */
    abstract fill(field: FieldInfo, value: string): Promise<boolean>;

    /**
     * Verify that a field was filled correctly
     */
    async verify(field: FieldInfo, expectedValue: string): Promise<boolean> {
        const el = field.element as HTMLInputElement;
        return el.value === expectedValue || el.value.includes(expectedValue);
    }

    /**
     * Refresh a field element if it has become stale (detached from DOM)
     * Default implementation simply looks up by ID or Name again.
     */
    async refreshElement(field: FieldInfo): Promise<HTMLElement | null> {
        if (field.id) {
            return document.getElementById(field.id);
        }
        if (field.name) {
            return document.querySelector(`[name="${field.name}"]`) as HTMLElement;
        }
        return null; // Specialized adapters can implement smarter lookup
    }


    // --- Utility Methods ---

    /**
     * Get label text for an element
     */
    protected getLabel(el: HTMLElement): string {
        // Try aria-label first
        const ariaLabel = el.getAttribute("aria-label");
        if (ariaLabel) return ariaLabel.trim();

        // Try associated label
        const id = el.id;
        if (id) {
            const label = document.querySelector(`label[for="${id}"]`);
            if (label) return label.textContent?.trim() || "";
        }

        // Try parent label
        const parentLabel = el.closest("label");
        if (parentLabel) {
            return parentLabel.textContent?.trim() || "";
        }

        // Try preceding text
        const prev = el.previousElementSibling;
        if (prev && prev.tagName === "LABEL") {
            return prev.textContent?.trim() || "";
        }

        // Fallback to placeholder or name
        return (
            el.getAttribute("placeholder") ||
            el.getAttribute("name") ||
            ""
        );
    }

    /**
     * Get options from a select or radio/checkbox group
     */
    protected getOptions(el: HTMLElement): string[] {
        if (el.tagName === "SELECT") {
            return Array.from((el as HTMLSelectElement).options).map(o => o.text);
        }

        // Radio/checkbox group
        const name = el.getAttribute("name");
        if (name) {
            const group = document.querySelectorAll(`input[name="${name}"]`);
            return Array.from(group).map(input => {
                const label = document.querySelector(`label[for="${input.id}"]`);
                return label?.textContent?.trim() || (input as HTMLInputElement).value;
            });
        }

        return [];
    }

    /**
     * Simulate human-like typing
     */
    protected async typeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string): Promise<void> {
        el.focus();
        el.value = value;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        el.blur();
    }

    /**
     * Select an option in a dropdown
     */
    protected async selectOption(el: HTMLSelectElement, value: string): Promise<boolean> {
        // Find matching option (case-insensitive partial match)
        const options = Array.from(el.options);
        const match = options.find(o =>
            o.text.toLowerCase().includes(value.toLowerCase()) ||
            o.value.toLowerCase().includes(value.toLowerCase())
        );

        if (match) {
            el.value = match.value;
            el.dispatchEvent(new Event("change", { bubbles: true }));
            return true;
        }
        return false;
    }

    /**
     * Click a radio/checkbox option
     */
    protected async clickOption(name: string, value: string): Promise<boolean> {
        const inputs = document.querySelectorAll(`input[name="${name}"]`);

        for (const input of inputs) {
            const label = document.querySelector(`label[for="${input.id}"]`);
            const text = label?.textContent?.trim() || (input as HTMLInputElement).value;

            if (text.toLowerCase().includes(value.toLowerCase())) {
                (input as HTMLInputElement).click();
                return true;
            }
        }
        return false;
    }
}

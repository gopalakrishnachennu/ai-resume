import { BaseAdapter } from "./base";
import { LeverAdapter } from "./lever";
import { GreenhouseAdapter } from "./greenhouse";
import { WorkdayAdapter } from "./workday";
import { LinkedInAdapter } from "./linkedin";
import { GenericAdapter } from "./generic";

/**
 * Registry of all platform adapters
 * Order matters - first match wins
 */
const ADAPTERS: BaseAdapter[] = [
    new WorkdayAdapter(),   // Complex - check first
    new LinkedInAdapter(),  // Common
    new LeverAdapter(),     // Simple
    new GreenhouseAdapter(),// Common
    new GenericAdapter()    // Fallback - always last
];

/**
 * Get the appropriate adapter for the current page
 */
export function getAdapter(url: string = window.location.href): BaseAdapter {
    for (const adapter of ADAPTERS) {
        if (adapter.matches(url)) {
            console.log(`[Registry] Using adapter: ${adapter.name}`);
            return adapter;
        }
    }

    // Should never reach here because GenericAdapter matches everything
    return new GenericAdapter();
}

/**
 * Detect which platform we're on
 */
export function detectPlatform(url: string = window.location.href): string {
    const adapter = getAdapter(url);
    return adapter.name;
}

/**
 * Export individual adapters for direct use if needed
 */
export {
    BaseAdapter,
    LeverAdapter,
    GreenhouseAdapter,
    WorkdayAdapter,
    LinkedInAdapter,
    GenericAdapter
};

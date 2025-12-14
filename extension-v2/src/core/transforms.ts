export type TransformFunction = (options: string[], value: any) => string;

export const TRANSFORMS: Record<string, TransformFunction> = {
    // Convert boolean to Yes/No option
    boolToYesNo: (options: string[], value: boolean): string => {
        if (!options || options.length === 0) return value ? "Yes" : "No";

        // Exact match YES
        const yes = options.find(o => /^(yes|yep|correct|true)$/i.test(o.trim()));
        // Custom match YES
        const yesCustom = options.find(o => /yes|agree/i.test(o));

        // Fuzzy match
        const finalYes = yes || yesCustom || options[0];

        // Exact match NO
        const no = options.find(o => /^(no|nope|incorrect|false)$/i.test(o.trim()));
        const noCustom = options.find(o => /no|disagree/i.test(o));

        const finalNo = no || noCustom || options[1] || options[0];

        return value ? finalYes : finalNo;
    },

    // Map arbitrary auth status to specific dropdown options
    authToOption: (options: string[], value: string): string => {
        if (!options || options.length === 0) return "Yes";

        const normalizedValue = value.toLowerCase();

        // Logic: If user says 'citizen', look for 'citizen' or 'authorized'
        // If 'visa', look for 'sponsorship' or 'visa' or 'not authorized'

        const map: Record<string, RegExp> = {
            citizen: /citizen|authorized|without.*sponsor|permanent.*resident/i,
            greencard: /green.*card|permanent.*resident|authorized/i,
            visa: /visa|require.*sponsor|sponsorship/i,
            other: /other|not.*authorized/i
        };

        const regex = map[normalizedValue] || /authorized/i; // Default to authorized check

        return options.find(o => regex.test(o)) ?? options[0]; // Fallback to first
    },

    // Format salary numbers to match dropdowns (e.g. ranges)
    formatSalary: (options: string[], value: number): string => {
        // If text input (no options), return formatted string
        if (!options || options.length === 0) {
            return value.toString();
        }

        // Identify ranges: "$100,000 - $120,000"
        // Find bucket that allows this value
        for (const opt of options) {
            const numbers = opt.match(/\d+/g)?.map(n => parseInt(n)); // [100, 120] (assuming k is handled or full numbers)
            // Check if value fits roughly?
            // Simple heuristic: does option contain similar number?
            // Or simply pick closest one.

            // For MVP: text match
            // If value is 150000, look for "150"
            if (opt.includes((value / 1000).toString())) return opt;
        }

        return options.find(o => o.includes(value.toString())) ?? options[0];
    },

    // Format phone numbers
    formatPhone: (_options: string[], value: string): string => {
        // Just simple cleanup for now
        return value;
    },

    // Just return as string
    toString: (_options: string[], value: any): string => {
        return String(value);
    }
};

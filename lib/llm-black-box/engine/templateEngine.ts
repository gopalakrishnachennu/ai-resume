/**
 * Jinja-Style Template Engine
 * 
 * Lightweight template renderer supporting:
 * - Variable interpolation: {{ variable }}
 * - Nested objects: {{ user.name }}
 * - Conditionals: {% if condition %}...{% endif %}
 * - Loops: {% for item in items %}...{% endfor %}
 */

export interface TemplateVars {
    [key: string]: any;
}

export class TemplateEngine {
    /**
     * Render a template with variables
     * 
     * @example
     * render("Hello {{ name }}!", { name: "John" })
     * // Returns: "Hello John!"
     */
    static render(template: string, vars: TemplateVars): string {
        if (!template) return '';
        if (!vars) vars = {};

        let rendered = template;

        // Step 1: Replace {{ variable }} with values
        rendered = this.replaceVariables(rendered, vars);

        // Step 2: Handle conditionals {% if %}...{% endif %}
        rendered = this.handleConditionals(rendered, vars);

        // Step 3: Handle loops {% for %}...{% endfor %}
        rendered = this.handleLoops(rendered, vars);

        // Step 4: Clean up extra whitespace
        rendered = this.cleanWhitespace(rendered);

        return rendered;
    }

    /**
     * Replace {{ variable }} and {{ object.property }} with values
     */
    private static replaceVariables(template: string, vars: TemplateVars): string {
        return template.replace(
            /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g,
            (match, path) => {
                const value = this.getNestedValue(vars, path);

                // Handle different types
                if (value === undefined || value === null) {
                    return ''; // Empty string for missing values
                }
                if (Array.isArray(value)) {
                    return value.join(', '); // Join arrays with commas
                }
                if (typeof value === 'object') {
                    return JSON.stringify(value); // Stringify objects
                }

                return String(value);
            }
        );
    }

    /**
     * Get nested object value by path
     * 
     * @example
     * getNestedValue({ user: { name: "John" }}, "user.name")
     * // Returns: "John"
     */
    private static getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => {
            return current?.[key];
        }, obj);
    }

    /**
     * Handle conditional blocks
     * {% if variable %}content{% endif %}
     * {% if variable %}content{% else %}other{% endif %}
     */
    private static handleConditionals(template: string, vars: TemplateVars): string {
        // Handle if-else blocks
        template = template.replace(
            /\{%\s*if\s+([a-zA-Z0-9_.]+)\s*%\}([\s\S]*?)\{%\s*else\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g,
            (match, condition, ifContent, elseContent) => {
                const value = this.getNestedValue(vars, condition);
                return this.isTruthy(value) ? ifContent : elseContent;
            }
        );

        // Handle if-only blocks
        template = template.replace(
            /\{%\s*if\s+([a-zA-Z0-9_.]+)\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g,
            (match, condition, content) => {
                const value = this.getNestedValue(vars, condition);
                return this.isTruthy(value) ? content : '';
            }
        );

        return template;
    }

    /**
     * Handle loop blocks
     * {% for item in items %}{{ item }}{% endfor %}
     */
    private static handleLoops(template: string, vars: TemplateVars): string {
        return template.replace(
            /\{%\s*for\s+(\w+)\s+in\s+(\w+)\s*%\}([\s\S]*?)\{%\s*endfor\s*%\}/g,
            (match, itemName, arrayName, content) => {
                const array = vars[arrayName];

                // Return empty if not an array
                if (!Array.isArray(array)) {
                    console.warn(`Template loop: ${arrayName} is not an array`);
                    return '';
                }

                // Render content for each item
                return array.map((item, index) => {
                    const loopVars = {
                        ...vars,
                        [itemName]: item,
                        [`${itemName}_index`]: index,
                        [`${itemName}_first`]: index === 0,
                        [`${itemName}_last`]: index === array.length - 1,
                    };
                    return this.render(content, loopVars);
                }).join('');
            }
        );
    }

    /**
     * Check if value is truthy for conditionals
     */
    private static isTruthy(value: any): boolean {
        if (value === undefined || value === null) return false;
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value !== 0;
        if (typeof value === 'string') return value.length > 0;
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'object') return Object.keys(value).length > 0;
        return true;
    }

    /**
     * Clean up extra whitespace while preserving intentional formatting
     */
    private static cleanWhitespace(text: string): string {
        return text
            .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
            .trim();
    }

    /**
     * Validate template syntax
     * Returns errors if template has syntax issues
     */
    static validate(template: string): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Check for unclosed {{ }} tags
        const openVars = (template.match(/\{\{/g) || []).length;
        const closeVars = (template.match(/\}\}/g) || []).length;
        if (openVars !== closeVars) {
            errors.push(`Unclosed variable tags: ${openVars} opening, ${closeVars} closing`);
        }

        // Check for unclosed {% if %} tags
        const ifTags = (template.match(/\{%\s*if/g) || []).length;
        const endifTags = (template.match(/\{%\s*endif/g) || []).length;
        if (ifTags !== endifTags) {
            errors.push(`Unclosed if tags: ${ifTags} opening, ${endifTags} closing`);
        }

        // Check for unclosed {% for %} tags
        const forTags = (template.match(/\{%\s*for/g) || []).length;
        const endforTags = (template.match(/\{%\s*endfor/g) || []).length;
        if (forTags !== endforTags) {
            errors.push(`Unclosed for tags: ${forTags} opening, ${endforTags} closing`);
        }

        // Disabled: This check was too strict and caused false positives with JSON in prompts
        // const invalidTags = template.match(/\{[^{%]|[^}%]\}/g);
        // if (invalidTags) {
        //     errors.push(`Invalid tag syntax found: ${invalidTags.join(', ')}`);
        // }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * Extract all variable names from template
     * Useful for debugging and validation
     */
    static extractVariables(template: string): string[] {
        const matches = template.matchAll(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g);
        return Array.from(matches, m => m[1]);
    }

    /**
     * Check if template has all required variables
     */
    static hasRequiredVars(template: string, vars: TemplateVars): {
        valid: boolean;
        missing: string[]
    } {
        const required = this.extractVariables(template);
        const missing = required.filter(varName => {
            const value = this.getNestedValue(vars, varName);
            return value === undefined || value === null;
        });

        return {
            valid: missing.length === 0,
            missing,
        };
    }
}

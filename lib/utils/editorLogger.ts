/**
 * Editor Debug Logger
 * Provides detailed logging for debugging resume loading/rendering issues
 * 
 * Usage: Import and use editorLog.info(), editorLog.warn(), editorLog.error()
 * Logs are prefixed with [EDITOR] for easy filtering in console
 */

const IS_DEV = process.env.NODE_ENV === 'development';
const FORCE_LOGS = true; // Set to true to enable logs in production for debugging

interface DataSnapshot {
    personalInfo?: any;
    experience?: any[];
    education?: any[];
    skills?: any;
    technicalSkills?: any;
    summary?: string;
    [key: string]: any;
}

class EditorLogger {
    private prefix = '[EDITOR]';
    private enabled: boolean = IS_DEV || FORCE_LOGS;

    // Enable/disable logging dynamically
    setEnabled(val: boolean): void {
        this.enabled = val;
    }

    private formatTimestamp(): string {
        return new Date().toISOString().split('T')[1].slice(0, 12);
    }

    private getCallerInfo(): string {
        try {
            const stack = new Error().stack;
            if (stack) {
                const lines = stack.split('\n');
                // Find the first line that's not from this logger
                for (let i = 3; i < lines.length; i++) {
                    const line = lines[i];
                    if (!line.includes('EditorLogger') && !line.includes('editorLog')) {
                        const match = line.match(/at\s+(\S+)/);
                        return match ? match[1] : '';
                    }
                }
            }
        } catch {
            // Ignore errors getting caller info
        }
        return '';
    }

    info(message: string, data?: any) {
        if (!this.enabled) return;
        const caller = this.getCallerInfo();
        console.log(
            `%c${this.prefix} ${this.formatTimestamp()} [INFO]${caller ? ` (${caller})` : ''}`,
            'color: #3b82f6; font-weight: bold;',
            message,
            data !== undefined ? data : ''
        );
    }

    warn(message: string, data?: any) {
        if (!this.enabled) return;
        const caller = this.getCallerInfo();
        console.warn(
            `%c${this.prefix} ${this.formatTimestamp()} [WARN]${caller ? ` (${caller})` : ''}`,
            'color: #f59e0b; font-weight: bold;',
            message,
            data !== undefined ? data : ''
        );
    }

    error(message: string, error?: any) {
        // Always log errors
        const caller = this.getCallerInfo();
        console.error(
            `%c${this.prefix} ${this.formatTimestamp()} [ERROR]${caller ? ` (${caller})` : ''}`,
            'color: #ef4444; font-weight: bold;',
            message,
            error !== undefined ? error : ''
        );
    }

    debug(message: string, data?: any) {
        if (!this.enabled) return;
        const caller = this.getCallerInfo();
        console.debug(
            `%c${this.prefix} ${this.formatTimestamp()} [DEBUG]${caller ? ` (${caller})` : ''}`,
            'color: #6b7280; font-weight: normal;',
            message,
            data !== undefined ? data : ''
        );
    }

    // Log data loading events
    loadStart(source: string, id?: string) {
        this.info(`📥 Loading data from: ${source}`, id ? { id } : undefined);
    }

    loadComplete(source: string, dataShape?: any) {
        this.info(`✅ Load complete from: ${source}`, dataShape);
    }

    loadFailed(source: string, error: any) {
        this.error(`❌ Load failed from: ${source}`, error);
    }

    // Log resume format detection
    formatDetected(format: 'AI' | 'Legacy' | 'Standard' | 'Import' | 'New', indicators?: any) {
        this.info(`📋 Resume format detected: ${format}`, indicators);
    }

    // Log data validation
    validateData(label: string, data: DataSnapshot) {
        if (!this.enabled) return;

        const issues: string[] = [];

        // Check for null/undefined in arrays
        if (data.experience) {
            const nullExps = data.experience.filter(x => !x).length;
            if (nullExps > 0) issues.push(`${nullExps} null experience items`);

            data.experience.forEach((exp, i) => {
                if (exp?.bullets) {
                    const nullBullets = exp.bullets.filter((b: any) => !b).length;
                    if (nullBullets > 0) issues.push(`exp[${i}]: ${nullBullets} null bullets`);
                }
            });
        }

        if (data.education) {
            const nullEdus = data.education.filter(x => !x).length;
            if (nullEdus > 0) issues.push(`${nullEdus} null education items`);
        }

        if (data.skills?.technical) {
            const nullSkills = data.skills.technical.filter((s: any) => !s).length;
            if (nullSkills > 0) issues.push(`${nullSkills} null skill items`);
        }

        if (data.technicalSkills) {
            Object.entries(data.technicalSkills).forEach(([key, value]) => {
                if (!value) issues.push(`technicalSkills.${key} is null`);
                if (Array.isArray(value)) {
                    const nulls = value.filter(v => !v).length;
                    if (nulls > 0) issues.push(`technicalSkills.${key}: ${nulls} null values`);
                }
            });
        }

        if (issues.length > 0) {
            this.warn(`⚠️ Data validation [${label}] - Issues found:`, issues);
        } else {
            this.debug(`✓ Data validation [${label}] - Clean`, {
                experienceCount: data.experience?.length || 0,
                educationCount: data.education?.length || 0,
                skillsCount: data.skills?.technical?.length || 0,
                technicalSkillsCategories: data.technicalSkills ? Object.keys(data.technicalSkills).length : 0,
            });
        }
    }

    // Log raw Firestore data for debugging
    rawData(label: string, data: any) {
        if (!this.enabled) return;
        this.debug(`📄 Raw data [${label}]:`, {
            keys: data ? Object.keys(data) : [],
            hasResumeData: !!data?.resumeData,
            hasProfessionalSummary: !!data?.professionalSummary,
            hasTechnicalSkills: !!data?.technicalSkills,
            experienceType: Array.isArray(data?.experience) ? `array[${data.experience.length}]` : typeof data?.experience,
            educationType: Array.isArray(data?.education) ? `array[${data.education.length}]` : typeof data?.education,
        });
    }

    // Log state changes
    stateChange(stateName: string, newValue: any) {
        this.debug(`🔄 State change: ${stateName}`,
            typeof newValue === 'object' ? { type: Array.isArray(newValue) ? 'array' : 'object', length: newValue?.length } : newValue
        );
    }

    // Group related logs
    group(label: string) {
        if (!this.enabled) return;
        console.group(`${this.prefix} ${label}`);
    }

    groupEnd() {
        if (!this.enabled) return;
        console.groupEnd();
    }

    // Log full data snapshot (use sparingly - large output)
    snapshot(label: string, data: any) {
        if (!this.enabled) return;
        this.group(`📸 Snapshot: ${label}`);
        console.log(JSON.parse(JSON.stringify(data))); // Deep clone to avoid reference issues
        this.groupEnd();
    }
}

// Export singleton instance
export const editorLog = new EditorLogger();

// Helper to safely stringify for logging
export function safeStringify(obj: any, maxLength = 500): string {
    try {
        const str = JSON.stringify(obj);
        return str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
    } catch {
        return '[Unable to stringify]';
    }
}

import { getFile } from "./storage";

/**
 * Resume handling - attach stored resume to file input
 */

const RESUME_ID = 'resume';

/**
 * Attach stored resume to a file input element
 */
export async function attachResume(fileInput: HTMLInputElement): Promise<boolean> {
    try {
        const stored = await getFile(RESUME_ID);

        if (!stored) {
            console.log('[Resume] No resume stored');
            return false;
        }

        // Create File object from Blob
        const file = new File([stored.blob], stored.name, {
            type: stored.type,
            lastModified: stored.updatedAt
        });

        // Use DataTransfer to set files property (read-only workaround)
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;

        // Trigger events
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        fileInput.dispatchEvent(new Event('input', { bubbles: true }));

        console.log(`[Resume] Attached: ${stored.name} (${stored.size} bytes)`);
        return true;

    } catch (error) {
        console.error('[Resume] Failed to attach:', error);
        return false;
    }
}

/**
 * Check if resume is stored
 */
export async function hasResume(): Promise<boolean> {
    const stored = await getFile(RESUME_ID);
    return stored !== null;
}

/**
 * Get resume info without blob
 */
export async function getResumeInfo(): Promise<{ name: string; size: number; type: string } | null> {
    const stored = await getFile(RESUME_ID);
    if (!stored) return null;

    return {
        name: stored.name,
        size: stored.size,
        type: stored.type
    };
}

/**
 * Detect resume file inputs on page
 */
export function findResumeInputs(): HTMLInputElement[] {
    const inputs = document.querySelectorAll<HTMLInputElement>('input[type="file"]');

    return Array.from(inputs).filter(input => {
        const accept = input.accept?.toLowerCase() || '';
        const label = (input.getAttribute('aria-label') ||
            input.closest('label')?.textContent ||
            '').toLowerCase();

        // Check if it's likely a resume/CV upload
        const isResume =
            label.includes('resume') ||
            label.includes('cv') ||
            accept.includes('pdf') ||
            accept.includes('doc');

        return isResume;
    });
}

/**
 * Auto-fill all resume inputs on page
 */
export async function fillAllResumeInputs(): Promise<number> {
    const inputs = findResumeInputs();
    let filled = 0;

    for (const input of inputs) {
        const success = await attachResume(input);
        if (success) filled++;
    }

    return filled;
}

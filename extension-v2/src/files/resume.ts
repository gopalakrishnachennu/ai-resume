import { getFile } from "./storage";

/**
 * Resume handling - attach stored resume to file input
 * Supports both PDF and DOCX formats
 */

const RESUME_PDF_ID = 'resume';
const RESUME_DOCX_ID = 'resume-docx';

/**
 * Determine which file format to use based on input's accept attribute
 */
function getPreferredFormat(fileInput: HTMLInputElement): 'pdf' | 'docx' | 'any' {
    const accept = (fileInput.accept || '').toLowerCase();

    // Check explicit preferences
    if (accept.includes('.docx') || accept.includes('word') || accept.includes('openxmlformats')) {
        // If ONLY docx is accepted (no PDF)
        if (!accept.includes('pdf') && !accept.includes('.pdf')) {
            return 'docx';
        }
    }

    // PDF is explicitly required
    if ((accept.includes('pdf') || accept.includes('.pdf')) &&
        !accept.includes('doc') && !accept.includes('word')) {
        return 'pdf';
    }

    // Accept both or no specific constraint - PDF is preferred
    return 'any';
}

/**
 * Attach stored resume to a file input element
 * Automatically uses PDF or DOCX based on input's accept attribute
 * Skips if input already has a file attached
 */
export async function attachResume(fileInput: HTMLInputElement): Promise<boolean> {
    try {
        // Skip if already has a file attached
        if (fileInput.files && fileInput.files.length > 0) {
            console.log(`[Resume] Skipping (already has file): ${fileInput.files[0].name}`);
            return true; // Return true so we don't count as failure
        }

        const format = getPreferredFormat(fileInput);
        console.log(`[Resume] Detected format preference: ${format}`);

        let stored = null;

        // Try to get the preferred format first
        if (format === 'docx') {
            stored = await getFile(RESUME_DOCX_ID);
            if (!stored) {
                console.log('[Resume] No DOCX stored, falling back to PDF');
                stored = await getFile(RESUME_PDF_ID);
            }
        } else {
            // PDF or any - try PDF first (most common)
            stored = await getFile(RESUME_PDF_ID);
            if (!stored && format === 'any') {
                console.log('[Resume] No PDF stored, trying DOCX');
                stored = await getFile(RESUME_DOCX_ID);
            }
        }

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

        console.log(`[Resume] Attached: ${stored.name} (${stored.size} bytes, ${stored.type})`);
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
    const stored = await getFile(RESUME_PDF_ID);
    return stored !== null;
}

/**
 * Get resume info without blob
 */
export async function getResumeInfo(): Promise<{ name: string; size: number; type: string } | null> {
    const stored = await getFile(RESUME_PDF_ID);
    if (!stored) return null;

    return {
        name: stored.name,
        size: stored.size,
        type: stored.type
    };
}

/**
 * Attach a specific resume format (PDF or DOCX) to all file inputs on page
 */
export async function attachResumeWithFormat(format: 'pdf' | 'docx'): Promise<{ success: boolean; count: number; error?: string }> {
    try {
        const fileId = format === 'pdf' ? RESUME_PDF_ID : RESUME_DOCX_ID;
        const stored = await getFile(fileId);

        if (!stored) {
            return { success: false, count: 0, error: `No ${format.toUpperCase()} resume stored` };
        }

        console.log(`[Resume] Attaching ${format.toUpperCase()}: ${stored.name}`);

        // Find all file inputs on the page
        const inputs = findResumeInputs();

        if (inputs.length === 0) {
            // Try ALL file inputs as fallback
            const allInputs = document.querySelectorAll<HTMLInputElement>('input[type="file"]');
            if (allInputs.length === 0) {
                return { success: false, count: 0, error: 'No file inputs found on page' };
            }
            // Use first file input
            const success = await attachToInput(allInputs[0], stored);
            return { success, count: success ? 1 : 0 };
        }

        let count = 0;
        for (const input of inputs) {
            const success = await attachToInput(input, stored);
            if (success) count++;
        }

        return { success: count > 0, count };

    } catch (error) {
        console.error('[Resume] attachResumeWithFormat failed:', error);
        return { success: false, count: 0, error: String(error) };
    }
}

/**
 * Helper to attach file to a specific input
 * Skips if input already has a file attached
 */
async function attachToInput(input: HTMLInputElement, stored: { blob: Blob; name: string; type: string; updatedAt: number }): Promise<boolean> {
    try {
        // Skip if already has a file attached
        if (input.files && input.files.length > 0) {
            console.log(`[Resume] Skipping input (already has file): ${input.files[0].name}`);
            return false; // Not an error, just skipped
        }

        const file = new File([stored.blob], stored.name, {
            type: stored.type,
            lastModified: stored.updatedAt
        });

        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;

        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('input', { bubbles: true }));

        console.log(`[Resume] ✓ Attached to input: ${input.id || input.name || 'unnamed'}`);
        return true;
    } catch (error) {
        console.error('[Resume] Failed to attach to input:', error);
        return false;
    }
}

/**
 * Detect resume file inputs on page
 * Improved detection for various job portals (Lever, Workday, Greenhouse, etc.)
 */
export function findResumeInputs(): HTMLInputElement[] {
    const inputs = document.querySelectorAll<HTMLInputElement>('input[type="file"]');

    console.log(`[Resume] Found ${inputs.length} file inputs on page`);

    const resumeInputs = Array.from(inputs).filter(input => {
        const accept = input.accept?.toLowerCase() || '';
        const id = input.id?.toLowerCase() || '';
        const name = input.name?.toLowerCase() || '';
        const className = input.className?.toLowerCase() || '';

        // Get label text from various sources
        const ariaLabel = input.getAttribute('aria-label')?.toLowerCase() || '';
        const closestLabel = input.closest('label')?.textContent?.toLowerCase() || '';
        const forLabel = input.id ? document.querySelector(`label[for="${input.id}"]`)?.textContent?.toLowerCase() || '' : '';

        // Check parent/sibling elements for context clues
        const parentText = input.parentElement?.textContent?.toLowerCase() || '';
        const nearbyText = input.closest('[class*="upload"], [class*="resume"], [class*="file"]')?.textContent?.toLowerCase() || '';

        // Combine all text sources
        const allText = `${ariaLabel} ${closestLabel} ${forLabel} ${parentText} ${nearbyText} ${id} ${name}`;

        // Check if it's likely a resume/CV upload
        const isResume =
            allText.includes('resume') ||
            allText.includes('cv') ||
            allText.includes('curriculum') ||
            id.includes('resume') ||
            name.includes('resume') ||
            name.includes('cv') ||
            // Common patterns in job portals
            accept.includes('pdf') ||
            accept.includes('doc');

        if (isResume) {
            console.log(`[Resume] ✓ Found resume input:`, {
                id: input.id,
                name: input.name,
                accept: input.accept,
                visible: input.offsetParent !== null
            });
        }

        return isResume;
    });

    console.log(`[Resume] Matched ${resumeInputs.length} resume inputs`);
    return resumeInputs;
}

/**
 * Auto-fill all resume inputs on page
 */
export async function fillAllResumeInputs(): Promise<number> {
    console.log('[Resume] === Starting fillAllResumeInputs ===');

    // Check if we have files stored
    const pdfStored = await getFile(RESUME_PDF_ID);
    const docxStored = await getFile(RESUME_DOCX_ID);

    console.log('[Resume] Storage status:', {
        hasPdf: !!pdfStored,
        pdfName: pdfStored?.name,
        hasDocx: !!docxStored,
        docxName: docxStored?.name
    });

    if (!pdfStored && !docxStored) {
        console.warn('[Resume] No resume files stored - cannot upload');
        return 0;
    }

    const inputs = findResumeInputs();

    if (inputs.length === 0) {
        console.log('[Resume] No resume inputs found on page');
        // Try a broader search for any file input
        const allFileInputs = document.querySelectorAll<HTMLInputElement>('input[type="file"]');
        console.log('[Resume] All file inputs on page:', allFileInputs.length);
        allFileInputs.forEach((input, i) => {
            console.log(`[Resume] Input ${i}:`, {
                id: input.id,
                name: input.name,
                accept: input.accept,
                visible: input.offsetParent !== null
            });
        });
    }

    let filled = 0;

    for (const input of inputs) {
        console.log(`[Resume] Attempting to attach to input: ${input.id || input.name || 'unnamed'}`);
        const success = await attachResume(input);
        if (success) {
            filled++;
            console.log(`[Resume] ✓ Successfully attached resume!`);
        } else {
            console.log(`[Resume] ✗ Failed to attach resume`);
        }
    }

    console.log(`[Resume] === fillAllResumeInputs complete: ${filled}/${inputs.length} filled ===`);
    return filled;
}


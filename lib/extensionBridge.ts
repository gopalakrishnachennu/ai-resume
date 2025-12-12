/**
 * Extension Bridge - Forceful connection between web app and JobFiller Pro extension
 * 
 * This enables the web app to push session data directly to the extension
 * using Chrome's externally_connectable messaging API.
 */

// Declare Chrome types for Next.js
declare const chrome: {
    runtime: {
        sendMessage: (extensionId: string, message: any, callback: (response: any) => void) => void;
        lastError?: { message: string };
    };
} | undefined;

// Extension ID - Update with your actual extension ID after loading it
const EXTENSION_ID = 'YOUR_EXTENSION_ID_HERE'; // TODO: Replace with real ID

/**
 * Check if extension is installed and responsive
 */
export async function pingExtension(): Promise<{ installed: boolean; version?: string }> {
    return new Promise((resolve) => {
        if (typeof chrome === 'undefined' || !chrome.runtime) {
            resolve({ installed: false });
            return;
        }

        try {
            chrome.runtime.sendMessage(
                EXTENSION_ID,
                { type: 'PING' },
                (response) => {
                    if (chrome.runtime.lastError || !response?.success) {
                        resolve({ installed: false });
                    } else {
                        resolve({ installed: true, version: response.version });
                    }
                }
            );

            // Timeout after 1 second
            setTimeout(() => resolve({ installed: false }), 1000);
        } catch {
            resolve({ installed: false });
        }
    });
}

/**
 * Push Flash session data directly to extension
 * This bypasses Firebase read on the extension side
 */
export async function pushFlashSession(
    userId: string,
    projectId: string,
    sessionData: any
): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
        if (typeof chrome === 'undefined' || !chrome.runtime) {
            // Try postMessage fallback for when chrome API not available
            window.postMessage({
                type: 'JOBFILLER_FLASH_SESSION',
                userId,
                projectId,
                session: sessionData
            }, '*');
            resolve({ success: true });
            return;
        }

        try {
            chrome.runtime.sendMessage(
                EXTENSION_ID,
                {
                    type: 'FLASH_SESSION',
                    data: {
                        userId,
                        projectId,
                        session: sessionData
                    }
                },
                (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn('[ExtensionBridge] Send failed:', chrome.runtime.lastError);
                        resolve({ success: false, error: chrome.runtime.lastError.message });
                    } else if (response?.success) {
                        console.log('[ExtensionBridge] Session pushed successfully');
                        resolve({ success: true });
                    } else {
                        resolve({ success: false, error: response?.error || 'Unknown error' });
                    }
                }
            );

            // Timeout after 2 seconds
            setTimeout(() => resolve({ success: false, error: 'Timeout' }), 2000);
        } catch (error: any) {
            resolve({ success: false, error: error.message });
        }
    });
}

/**
 * Connect user to extension (store userId for future use)
 */
export async function connectUserToExtension(
    userId: string,
    projectId?: string
): Promise<{ success: boolean }> {
    return new Promise((resolve) => {
        if (typeof chrome === 'undefined' || !chrome.runtime) {
            resolve({ success: false });
            return;
        }

        try {
            chrome.runtime.sendMessage(
                EXTENSION_ID,
                {
                    type: 'CONNECT_USER',
                    data: { userId, projectId }
                },
                (response) => {
                    resolve({ success: response?.success || false });
                }
            );
        } catch {
            resolve({ success: false });
        }
    });
}

// Export extension ID for configuration
export { EXTENSION_ID };

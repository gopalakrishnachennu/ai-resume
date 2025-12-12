/**
 * Extension Bridge - Forceful connection between web app and JobFiller Pro extension
 * 
 * This enables the web app to push session data directly to the extension
 * using Chrome's externally_connectable messaging API.
 * 
 * The extension ID is AUTOMATICALLY discovered from window.__JOBFILLER_EXTENSION_ID__
 * which is injected by the extension when user visits the web app.
 */

// Declare types for Next.js
declare global {
    interface Window {
        __JOBFILLER_EXTENSION_ID__?: string;
    }
}

declare const chrome: {
    runtime: {
        sendMessage: (extensionId: string, message: any, callback: (response: any) => void) => void;
        lastError?: { message: string };
    };
} | undefined;

/**
 * Get extension ID - auto-discovers from window if available
 * Extension injects its ID when user visits the web app
 */
function getExtensionId(): string | null {
    // Check for injected extension ID (auto-discovery)
    if (typeof window !== 'undefined' && window.__JOBFILLER_EXTENSION_ID__) {
        return window.__JOBFILLER_EXTENSION_ID__;
    }
    return null;
}

/**
 * Check if extension is installed and responsive
 */
export async function pingExtension(): Promise<{ installed: boolean; version?: string; extensionId?: string }> {
    const extensionId = getExtensionId();

    // If no extension ID found, extension is not installed or hasn't loaded yet
    if (!extensionId) {
        console.log('[ExtensionBridge] Extension not detected (no ID injected)');
        return { installed: false };
    }

    return new Promise((resolve) => {
        if (typeof chrome === 'undefined' || !chrome.runtime) {
            resolve({ installed: false });
            return;
        }

        try {
            chrome.runtime.sendMessage(
                extensionId,
                { type: 'PING' },
                (response) => {
                    if (chrome.runtime.lastError || !response?.success) {
                        resolve({ installed: false });
                    } else {
                        resolve({
                            installed: true,
                            version: response.version,
                            extensionId
                        });
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
    const extensionId = getExtensionId();

    if (!extensionId) {
        console.warn('[ExtensionBridge] No extension ID - using postMessage fallback');
        // Try postMessage fallback for when extension hasn't injected ID yet
        if (typeof window !== 'undefined') {
            window.postMessage({
                type: 'JOBFILLER_FLASH_SESSION',
                userId,
                projectId,
                session: sessionData
            }, '*');
        }
        return { success: true }; // Optimistic - postMessage sent
    }

    return new Promise((resolve) => {
        if (typeof chrome === 'undefined' || !chrome.runtime) {
            resolve({ success: false, error: 'Chrome API not available' });
            return;
        }

        try {
            chrome.runtime.sendMessage(
                extensionId,
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
    const extensionId = getExtensionId();

    if (!extensionId) {
        return { success: false };
    }

    return new Promise((resolve) => {
        if (typeof chrome === 'undefined' || !chrome.runtime) {
            resolve({ success: false });
            return;
        }

        try {
            chrome.runtime.sendMessage(
                extensionId,
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

/**
 * Wait for extension to be ready (useful on page load)
 * Listens for the custom event dispatched by extension
 */
export function waitForExtension(timeoutMs: number = 3000): Promise<string | null> {
    return new Promise((resolve) => {
        // Check if already available
        const existingId = getExtensionId();
        if (existingId) {
            resolve(existingId);
            return;
        }

        // Listen for extension ready event
        const handler = (event: CustomEvent) => {
            resolve(event.detail?.extensionId || null);
        };

        window.addEventListener('jobfiller-extension-ready', handler as EventListener, { once: true });

        // Timeout
        setTimeout(() => {
            window.removeEventListener('jobfiller-extension-ready', handler as EventListener);
            resolve(getExtensionId()); // Try one more time
        }, timeoutMs);
    });
}

/**
 * Check if extension is available (synchronous check)
 */
export function isExtensionAvailable(): boolean {
    return !!getExtensionId();
}

// Export for direct access
export { getExtensionId };

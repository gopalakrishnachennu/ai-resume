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
 * Get extension ID - auto-discovers from multiple sources (SYNC version)
 * Extension injects its ID via script element, data attribute, or postMessage
 */
function getExtensionId(): string | null {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return null;
    }

    // Method 1: Check window variable (set by injected script)
    if (window.__JOBFILLER_EXTENSION_ID__) {
        return window.__JOBFILLER_EXTENSION_ID__;
    }

    // Method 2: Check body data attribute (fallback)
    const bodyAttr = document.body?.getAttribute('data-jobfiller-extension-id');
    if (bodyAttr) {
        return bodyAttr;
    }

    return null;
}

/**
 * Get extension ID with Firebase admin fallback (ASYNC version)
 * This is the preferred method - uses admin-configured ID when auto-discovery fails
 */
async function getExtensionIdWithFallback(): Promise<string | null> {
    // First try auto-discovery
    const autoId = getExtensionId();
    if (autoId) {
        console.log('[ExtensionBridge] Using auto-discovered ID:', autoId);
        return autoId;
    }

    // Fallback: Read from admin settings in Firebase
    try {
        const { getActiveExtensionId } = await import('@/lib/services/extensionSettingsService');
        const adminId = await getActiveExtensionId();
        if (adminId) {
            console.log('[ExtensionBridge] Using admin-configured ID:', adminId);
            return adminId;
        }
    } catch (error) {
        console.log('[ExtensionBridge] Could not fetch admin settings:', error);
    }

    console.log('[ExtensionBridge] No extension ID found (neither auto nor admin)');
    return null;
}

/**
 * Check if extension is installed and responsive
 * Uses admin-configured ID as fallback when auto-discovery fails
 */
export async function pingExtension(): Promise<{ installed: boolean; version?: string; extensionId?: string }> {
    const extensionId = await getExtensionIdWithFallback();

    // If no extension ID found via any method
    if (!extensionId) {
        console.log('[ExtensionBridge] Extension not detected (no auto ID and no admin ID)');
        return { installed: false };
    }

    return new Promise((resolve) => {
        if (typeof chrome === 'undefined' || !chrome.runtime) {
            console.log('[ExtensionBridge] Chrome runtime not available');
            resolve({ installed: false });
            return;
        }

        try {
            chrome.runtime.sendMessage(
                extensionId,
                { type: 'PING' },
                (response) => {
                    if (chrome.runtime.lastError || !response?.success) {
                        console.log('[ExtensionBridge] Ping failed:', chrome.runtime.lastError?.message);
                        resolve({ installed: false });
                    } else {
                        console.log('[ExtensionBridge] Extension connected!', response.version);
                        resolve({
                            installed: true,
                            version: response.version,
                            extensionId
                        });
                    }
                }
            );

            // Timeout after 2 seconds
            setTimeout(() => resolve({ installed: false }), 2000);
        } catch (error) {
            console.log('[ExtensionBridge] Ping error:', error);
            resolve({ installed: false });
        }
    });
}

/**
 * Push Flash session data directly to extension
 * This bypasses Firebase read on the extension side
 * Uses admin-configured ID as fallback when auto-discovery fails
 */
export async function pushFlashSession(
    userId: string,
    projectId: string,
    sessionData: any
): Promise<{ success: boolean; error?: string }> {
    const extensionId = await getExtensionIdWithFallback();

    if (!extensionId) {
        console.warn('[ExtensionBridge] No extension ID available - using postMessage fallback');
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
 * Check if extension is available (async - includes admin ID check)
 */
export async function isExtensionAvailable(): Promise<boolean> {
    const id = await getExtensionIdWithFallback();
    return !!id;
}

/**
 * Sync user profile to extension
 * This replaces sample data with real user profile
 * Uses admin-configured ID as fallback when auto-discovery fails
 */
export async function syncProfileToExtension(profileData: any): Promise<{ success: boolean; error?: string }> {
    const extensionId = await getExtensionIdWithFallback();

    if (!extensionId) {
        console.log('[ExtensionBridge] Extension not detected for profile sync (no auto ID and no admin ID)');
        return { success: false, error: 'Extension not detected - check admin settings' };
    }

    console.log('[ExtensionBridge] Syncing profile to extension:', extensionId);

    return new Promise((resolve) => {
        if (typeof chrome === 'undefined' || !chrome.runtime) {
            resolve({ success: false, error: 'Chrome API not available' });
            return;
        }

        try {
            chrome.runtime.sendMessage(
                extensionId,
                {
                    type: 'SYNC_PROFILE',
                    data: profileData
                },
                (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn('[ExtensionBridge] Profile sync failed:', chrome.runtime.lastError);
                        resolve({ success: false, error: chrome.runtime.lastError.message });
                    } else if (response?.success) {
                        console.log('[ExtensionBridge] Profile synced to extension!');
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
 * Sync Groq AI settings to extension from admin panel
 */
export async function syncGroqSettingsToExtension(
    groqSettings: {
        groqApiKeys: string;
        groqModel: string;
        groqEnabled: boolean;
        groqTemperature: number;
        groqMaxTokensPerField: number;
    }
): Promise<{ success: boolean; error?: string; keyCount?: number }> {
    const extensionId = await getExtensionIdWithFallback();

    if (!extensionId) {
        console.warn('[ExtensionBridge] No extension ID for Groq sync');
        return { success: false, error: 'Extension not found' };
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
                    type: 'SYNC_GROQ_SETTINGS',
                    data: groqSettings
                },
                (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn('[ExtensionBridge] Groq sync failed:', chrome.runtime.lastError);
                        resolve({ success: false, error: chrome.runtime.lastError.message });
                    } else if (response?.success) {
                        console.log('[ExtensionBridge] Groq settings synced!', response.keyCount, 'keys');
                        resolve({ success: true, keyCount: response.keyCount });
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

// Export for direct access
export { getExtensionId };

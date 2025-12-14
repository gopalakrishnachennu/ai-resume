/**
 * Extension Bridge - Webapp Side
 * Add this to your Next.js app to communicate with the extension
 * 
 * Usage in your webapp:
 * import { syncToExtension, isExtensionInstalled } from './extensionBridge';
 * 
 * // Check if extension is installed
 * const installed = await isExtensionInstalled();
 * 
 * // Sync user data to extension
 * await syncToExtension(user, profile, resumeBlob);
 */

interface FlashSession {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    token: string;
    expiresAt: number;
}

interface SyncPayload {
    session: FlashSession;
    profile: any;
    resume?: {
        buffer: ArrayBuffer;
        name: string;
        type: string;
    };
    settings?: any;
}

/**
 * Check if extension is installed
 */
export async function isExtensionInstalled(): Promise<boolean> {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(false), 500);

        const handler = (event: MessageEvent) => {
            if (event.data?.type === "JOBFILLER_PONG") {
                clearTimeout(timeout);
                window.removeEventListener("message", handler);
                resolve(true);
            }
        };

        window.addEventListener("message", handler);
        window.postMessage({ type: "JOBFILLER_PING" }, "*");
    });
}

/**
 * Create flash session from Firebase user
 */
export async function createFlashSession(user: any): Promise<FlashSession> {
    const token = await user.getIdToken();

    return {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
        photoURL: user.photoURL || undefined,
        token,
        expiresAt: Date.now() + 3600000 // 1 hour
    };
}

/**
 * Convert file to ArrayBuffer
 */
async function fileToBuffer(file: File | Blob): Promise<ArrayBuffer> {
    return await file.arrayBuffer();
}

/**
 * Sync user data to extension
 */
export async function syncToExtension(
    user: any,
    profile: any,
    resumeFile?: File | Blob,
    settings?: any
): Promise<boolean> {
    try {
        // Check if extension is installed
        const installed = await isExtensionInstalled();
        if (!installed) {
            console.warn("[ExtensionBridge] Extension not installed");
            return false;
        }

        // Create flash session
        const session = await createFlashSession(user);

        // Prepare resume if provided
        let resume: SyncPayload["resume"] | undefined;
        if (resumeFile) {
            const buffer = await fileToBuffer(resumeFile);
            resume = {
                buffer,
                name: (resumeFile as File).name || "resume.pdf",
                type: resumeFile.type || "application/pdf"
            };
        }

        // Build payload
        const payload: SyncPayload = {
            session,
            profile,
            resume,
            settings
        };

        // Send to extension
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                window.removeEventListener("message", handler);
                resolve(false);
            }, 3000);

            const handler = (event: MessageEvent) => {
                if (event.data?.type === "JOBFILLER_SYNC_SUCCESS") {
                    clearTimeout(timeout);
                    window.removeEventListener("message", handler);
                    console.log("[ExtensionBridge] Sync successful");
                    resolve(true);
                } else if (event.data?.type === "JOBFILLER_SYNC_ERROR") {
                    clearTimeout(timeout);
                    window.removeEventListener("message", handler);
                    console.error("[ExtensionBridge] Sync error:", event.data.error);
                    resolve(false);
                }
            };

            window.addEventListener("message", handler);
            window.postMessage({ type: "JOBFILLER_SYNC", payload }, "*");
        });

    } catch (error) {
        console.error("[ExtensionBridge] Sync failed:", error);
        return false;
    }
}

/**
 * Auto-sync when user is authenticated
 * Call this in your auth context or layout
 */
export function setupAutoSync(
    getUser: () => any,
    getProfile: () => any,
    getResume?: () => File | Blob | undefined
) {
    // Sync on page load if user is authenticated
    const syncIfNeeded = async () => {
        const user = getUser();
        if (!user) return;

        const installed = await isExtensionInstalled();
        if (!installed) return;

        const profile = getProfile();
        const resume = getResume?.();

        await syncToExtension(user, profile, resume);
    };

    // Run on load
    if (typeof window !== "undefined") {
        window.addEventListener("load", syncIfNeeded);
    }

    // Also sync when visibility changes (user returns to tab)
    if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                syncIfNeeded();
            }
        });
    }
}

// Alias exports for backward compatibility
export const isExtensionAvailable = isExtensionInstalled;

/**
 * Push flash session to extension
 * Used by dashboard to send resume session data
 */
export async function pushFlashSession(
    uid: string,
    projectId: string,
    session: any
): Promise<{ success: boolean; error?: string }> {
    try {
        const installed = await isExtensionInstalled();
        if (!installed) {
            return { success: false, error: "Extension not installed" };
        }

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                window.removeEventListener("message", handler);
                resolve({ success: false, error: "Timeout" });
            }, 3000);

            const handler = (event: MessageEvent) => {
                if (event.data?.type === "JOBFILLER_SESSION_SUCCESS") {
                    clearTimeout(timeout);
                    window.removeEventListener("message", handler);
                    resolve({ success: true });
                } else if (event.data?.type === "JOBFILLER_SESSION_ERROR") {
                    clearTimeout(timeout);
                    window.removeEventListener("message", handler);
                    resolve({ success: false, error: event.data.error });
                }
            };

            window.addEventListener("message", handler);
            window.postMessage({
                type: "JOBFILLER_SESSION",
                payload: { uid, projectId, session }
            }, "*");
        });
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * Sync profile data to extension (standalone, no user required)
 * Used by dashboard for auto-sync
 */
export async function syncProfileToExtension(profile: any): Promise<boolean> {
    try {
        const installed = await isExtensionInstalled();
        if (!installed) {
            console.warn("[ExtensionBridge] Extension not installed");
            return false;
        }

        // Send profile directly to extension
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                window.removeEventListener("message", handler);
                resolve(false);
            }, 3000);

            const handler = (event: MessageEvent) => {
                if (event.data?.type === "JOBFILLER_PROFILE_SUCCESS") {
                    clearTimeout(timeout);
                    window.removeEventListener("message", handler);
                    console.log("[ExtensionBridge] Profile sync successful");
                    resolve(true);
                } else if (event.data?.type === "JOBFILLER_PROFILE_ERROR") {
                    clearTimeout(timeout);
                    window.removeEventListener("message", handler);
                    console.error("[ExtensionBridge] Profile sync error:", event.data.error);
                    resolve(false);
                }
            };

            window.addEventListener("message", handler);
            window.postMessage({ type: "JOBFILLER_PROFILE", payload: { profile } }, "*");
        });
    } catch (error) {
        console.error("[ExtensionBridge] Profile sync failed:", error);
        return false;
    }
}

/**
 * Sync Groq settings to extension (for admin panel)
 */
export async function syncGroqSettingsToExtension(settings: {
    groqApiKeys?: string;
    groqModel?: string;
    groqEnabled?: boolean;
    groqTemperature?: number;
    groqMaxTokensPerField?: number;
}): Promise<{ success: boolean; keyCount?: number }> {
    try {
        const installed = await isExtensionInstalled();
        if (!installed) {
            return { success: false };
        }

        // Parse API keys (comma-separated)
        const keys = settings.groqApiKeys?.split(',').map(k => k.trim()).filter(Boolean) || [];

        // Send to extension
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                window.removeEventListener("message", handler);
                resolve({ success: false });
            }, 3000);

            const handler = (event: MessageEvent) => {
                if (event.data?.type === "JOBFILLER_SETTINGS_SUCCESS") {
                    clearTimeout(timeout);
                    window.removeEventListener("message", handler);
                    resolve({ success: true, keyCount: keys.length });
                }
            };

            window.addEventListener("message", handler);
            window.postMessage({
                type: "JOBFILLER_SETTINGS",
                payload: {
                    groqApiKeys: keys,
                    groqModel: settings.groqModel || "llama3-8b-8192",
                    groqEnabled: settings.groqEnabled ?? true,
                    groqTemperature: settings.groqTemperature ?? 0.3,
                    groqMaxTokensPerField: settings.groqMaxTokensPerField ?? 200,
                }
            }, "*");
        });
    } catch (error) {
        console.error("[ExtensionBridge] Groq settings sync failed:", error);
        return { success: false };
    }
}

/**
 * Push flash session + resume file to extension
 * Used by dashboard flash button - simplified flow
 */
export async function pushFlashSessionWithResume(
    uid: string,
    session: any,
    resumeFile?: File | Blob
): Promise<{ success: boolean; error?: string }> {
    try {
        const installed = await isExtensionInstalled();
        if (!installed) {
            return { success: false, error: "Extension not installed" };
        }

        // Prepare resume if provided
        let resume: { buffer: ArrayBuffer; name: string; type: string } | undefined;
        if (resumeFile) {
            const buffer = await resumeFile.arrayBuffer();
            resume = {
                buffer,
                name: (resumeFile as File).name || "resume.pdf",
                type: resumeFile.type || "application/pdf"
            };
        }

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                window.removeEventListener("message", handler);
                resolve({ success: false, error: "Timeout" });
            }, 5000); // Longer timeout for file transfer

            const handler = (event: MessageEvent) => {
                if (event.data?.type === "JOBFILLER_SESSION_SUCCESS") {
                    clearTimeout(timeout);
                    window.removeEventListener("message", handler);
                    resolve({ success: true });
                } else if (event.data?.type === "JOBFILLER_SESSION_ERROR") {
                    clearTimeout(timeout);
                    window.removeEventListener("message", handler);
                    resolve({ success: false, error: event.data.error });
                }
            };

            window.addEventListener("message", handler);
            window.postMessage({
                type: "JOBFILLER_SESSION",
                payload: { uid, session, resume }
            }, "*");
        });
    } catch (error) {
        return { success: false, error: String(error) };
    }
}


/**
 * Content Script Listener
 * Handles messages from webapp (sync) and popup (fill)
 */

import { Profile } from "../core/profile";
import { SequentialFiller } from "../filler/sequential";
import { overlay } from "../ui/overlay";
import { storeFileFromBuffer } from "../files";
import { fillAllResumeInputs, attachResumeWithFormat } from "../files/resume";

console.log("[JobFiller Pro V2] Content Script Loaded 🚀");

/**
 * Listen for messages from popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("[Listener] Message received:", request.type);

    switch (request.type) {
        case "PING":
            sendResponse({ status: "PONG" });
            break;

        case "FILL_FORM":
            handleFillForm().then(sendResponse);
            return true; // Keep channel open for async response

        case "GET_STATUS":
            handleGetStatus().then(sendResponse);
            return true;

        case "UPLOAD_RESUME":
            handleUploadResume(request.format).then(sendResponse);
            return true;

        default:
            console.log("[Listener] Unknown message type:", request.type);
    }
});

/**
 * Listen for messages from webapp (postMessage)
 */
window.addEventListener("message", async (event) => {
    // Validate origin (should be your webapp)
    // if (event.origin !== 'https://your-webapp.com') return;

    const data = event.data;
    if (!data || !data.type) return;

    console.log("[Listener] Window message:", data.type);

    switch (data.type) {
        case "JOBFILLER_AUTH":
        case "JOBFILLER_SYNC":
            await handleSync(data);
            break;

        case "JOBFILLER_PROFILE":
            // Handle profile-only sync from dashboard
            await handleProfileSync(data.payload);
            break;

        case "JOBFILLER_SESSION":
            // Handle session push from flash
            await handleSessionSync(data.payload);
            break;

        case "JOBFILLER_SETTINGS":
            // Handle settings sync from admin
            await handleSettingsSync(data.payload);
            break;

        case "JOBFILLER_PING":
            // Respond to webapp to confirm extension is installed
            window.postMessage({ type: "JOBFILLER_PONG", installed: true }, "*");
            break;
    }
});

/**
 * Handle form fill request from popup
 */
async function handleFillForm(): Promise<{ success: boolean; filled?: number; error?: string }> {
    try {
        // 1. Load profile from storage
        const result = await chrome.storage.local.get(["profile", "auth"]);

        if (!result.profile) {
            return { success: false, error: "No profile synced. Please sync from dashboard first." };
        }

        const profile: Profile = result.profile;

        // 2. Show overlay
        overlay.show();

        // 3. Create filler with progress callback
        const filler = new SequentialFiller(profile, undefined, (current, total, field, status) => {
            overlay.update(current, total, field, status);
        });

        // 4. Fill the form
        const summary = await filler.fillForm();

        // 5. Also fill resume inputs
        await fillAllResumeInputs();

        // 6. Show summary
        overlay.showSummary(summary);

        // 7. Update stats
        await updateFillStats(summary.filled);

        return { success: true, filled: summary.filled };

    } catch (error) {
        console.error("[Listener] Fill error:", error);
        overlay.hide();
        return { success: false, error: String(error) };
    }
}

/**
 * Handle resume upload request from popup
 */
async function handleUploadResume(format: 'pdf' | 'docx'): Promise<{ success: boolean; error?: string }> {
    try {
        console.log(`[Listener] Uploading ${format.toUpperCase()} resume to page...`);

        const result = await attachResumeWithFormat(format);

        if (result.success) {
            console.log(`[Listener] ✓ Uploaded ${format.toUpperCase()} to ${result.count} input(s)`);
            return { success: true };
        } else {
            console.warn(`[Listener] Upload failed:`, result.error);
            return { success: false, error: result.error };
        }
    } catch (error) {
        console.error("[Listener] Upload error:", error);
        return { success: false, error: String(error) };
    }
}

/**
 * Handle sync from webapp
 */
async function handleSync(data: any): Promise<void> {
    try {
        const { session, profile, resume, settings } = data.payload || data;

        // Store auth/session
        if (session) {
            await chrome.storage.local.set({
                auth: {
                    uid: session.uid,
                    email: session.email,
                    displayName: session.displayName,
                    photoURL: session.photoURL,
                    token: session.token,
                    expiresAt: session.expiresAt || Date.now() + 3600000,
                    syncedAt: Date.now()
                }
            });
            console.log("[Sync] Auth stored for:", session.email);
        }

        // Store profile
        if (profile) {
            await chrome.storage.local.set({ profile });
            console.log("[Sync] Profile stored");
        }

        // Store resume file
        if (resume && resume.buffer) {
            await storeFileFromBuffer(
                "resume",
                resume.buffer,
                resume.name || "resume.pdf",
                resume.type || "application/pdf"
            );

            // Save resume info for popup
            await chrome.storage.local.set({
                resumeInfo: {
                    name: resume.name,
                    size: resume.buffer.byteLength,
                    type: resume.type
                }
            });
            console.log("[Sync] Resume stored:", resume.name);
        }

        // Store settings
        if (settings) {
            await chrome.storage.local.set({ settings });
            console.log("[Sync] Settings stored");
        }

        // Notify webapp of success
        window.postMessage({ type: "JOBFILLER_SYNC_SUCCESS" }, "*");

    } catch (error) {
        console.error("[Sync] Error:", error);
        window.postMessage({ type: "JOBFILLER_SYNC_ERROR", error: String(error) }, "*");
    }
}

/**
 * Get status for popup
 */
async function handleGetStatus(): Promise<any> {
    const result = await chrome.storage.local.get(["auth", "profile", "resumeInfo", "stats"]);

    return {
        isAuthenticated: !!result.auth?.uid,
        hasProfile: !!result.profile,
        hasResume: !!result.resumeInfo,
        stats: result.stats || { filledToday: 0, cached: 0 }
    };
}

/**
 * Update fill statistics
 */
async function updateFillStats(filled: number): Promise<void> {
    const result = await chrome.storage.local.get(["stats"]);
    const stats = result.stats || { filledToday: 0, cached: 0, totalFilled: 0 };

    stats.filledToday = (stats.filledToday || 0) + filled;
    stats.totalFilled = (stats.totalFilled || 0) + filled;

    await chrome.storage.local.set({ stats });
}

/**
 * Handle profile-only sync from dashboard
 */
async function handleProfileSync(payload: any): Promise<void> {
    try {
        const { profile } = payload || {};

        if (profile) {
            await chrome.storage.local.set({ profile });
            console.log("[Sync] Profile stored from dashboard");
        }

        window.postMessage({ type: "JOBFILLER_PROFILE_SUCCESS" }, "*");
    } catch (error) {
        console.error("[Sync] Profile error:", error);
        window.postMessage({ type: "JOBFILLER_PROFILE_ERROR", error: String(error) }, "*");
    }
}

/**
 * Handle session push from flash
 */
async function handleSessionSync(payload: any): Promise<void> {
    try {
        const { uid, projectId, session, resume, resumePdf, resumeDocx } = payload || {};

        console.log("[Sync] Session sync received:", {
            hasSession: !!session,
            hasResume: !!resume,
            hasResumePdf: !!resumePdf,
            hasResumeDocx: !!resumeDocx
        });

        if (session) {
            await chrome.storage.local.set({
                auth: {
                    uid: uid || session.uid,
                    email: session.personalInfo?.email || session.email || '',
                    displayName: session.personalInfo?.name || session.displayName || '',
                    syncedAt: Date.now()
                },
                session,
                profile: session // Store session as profile too for form filling
            });
            console.log("[Sync] Session stored from flash");
        }

        // Helper to convert buffer-like object to ArrayBuffer (postMessage can break ArrayBuffer)
        const toArrayBuffer = (bufferLike: any): ArrayBuffer | null => {
            if (!bufferLike) return null;

            // Already an ArrayBuffer
            if (bufferLike instanceof ArrayBuffer) {
                return bufferLike;
            }

            // It's a typed array view (Uint8Array etc.)
            if (bufferLike.buffer instanceof ArrayBuffer) {
                return bufferLike.buffer;
            }

            // It's an object with numeric keys (postMessage converted it)
            if (typeof bufferLike === 'object' && bufferLike !== null) {
                const keys = Object.keys(bufferLike);
                if (keys.length > 0 && keys.every(k => !isNaN(parseInt(k)))) {
                    const arr = new Uint8Array(keys.length);
                    for (let i = 0; i < keys.length; i++) {
                        arr[i] = bufferLike[i];
                    }
                    return arr.buffer;
                }
            }

            console.warn("[Sync] Could not convert buffer:", typeof bufferLike);
            return null;
        };

        // Store PDF resume (primary - used for PDF-accepting inputs)
        const pdfData = resumePdf || resume; // fallback to legacy 'resume' field
        if (pdfData) {
            console.log("[Sync] PDF data received:", {
                name: pdfData.name,
                type: pdfData.type,
                bufferType: typeof pdfData.buffer,
                bufferSize: pdfData.buffer?.byteLength || Object.keys(pdfData.buffer || {}).length
            });

            const buffer = toArrayBuffer(pdfData.buffer);
            if (buffer) {
                await storeFileFromBuffer(
                    "resume", // Primary ID for PDF (most common)
                    buffer,
                    pdfData.name || "resume.pdf",
                    pdfData.type || "application/pdf"
                );
                console.log("[Sync] PDF resume stored:", pdfData.name, buffer.byteLength, "bytes");
            } else {
                console.error("[Sync] Failed to convert PDF buffer");
            }
        }

        // Store DOCX resume (for DOCX-accepting inputs)
        if (resumeDocx) {
            console.log("[Sync] DOCX data received:", {
                name: resumeDocx.name,
                type: resumeDocx.type,
                bufferType: typeof resumeDocx.buffer
            });

            const buffer = toArrayBuffer(resumeDocx.buffer);
            if (buffer) {
                await storeFileFromBuffer(
                    "resume-docx",
                    buffer,
                    resumeDocx.name || "resume.docx",
                    resumeDocx.type || "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                );
                console.log("[Sync] DOCX resume stored:", resumeDocx.name, buffer.byteLength, "bytes");
            } else {
                console.error("[Sync] Failed to convert DOCX buffer");
            }
        }

        // Save resume info for popup (show both if available)
        const resumeInfo: any = {};
        if (pdfData?.buffer) {
            const buf = toArrayBuffer(pdfData.buffer);
            resumeInfo.pdf = { name: pdfData.name, size: buf?.byteLength || 0, type: pdfData.type };
        }
        if (resumeDocx?.buffer) {
            const buf = toArrayBuffer(resumeDocx.buffer);
            resumeInfo.docx = { name: resumeDocx.name, size: buf?.byteLength || 0, type: resumeDocx.type };
        }
        if (Object.keys(resumeInfo).length > 0) {
            await chrome.storage.local.set({ resumeInfo });
            console.log("[Sync] Resume info stored:", resumeInfo);
        }

        window.postMessage({ type: "JOBFILLER_SESSION_SUCCESS" }, "*");
    } catch (error) {
        console.error("[Sync] Session error:", error);
        window.postMessage({ type: "JOBFILLER_SESSION_ERROR", error: String(error) }, "*");
    }
}

/**
 * Handle settings sync from admin
 */
async function handleSettingsSync(payload: any): Promise<void> {
    try {
        const settings = payload || {};

        await chrome.storage.local.set({ settings });
        console.log("[Sync] Settings stored from admin");

        window.postMessage({ type: "JOBFILLER_SETTINGS_SUCCESS" }, "*");
    } catch (error) {
        console.error("[Sync] Settings error:", error);
        window.postMessage({ type: "JOBFILLER_SETTINGS_ERROR", error: String(error) }, "*");
    }
}

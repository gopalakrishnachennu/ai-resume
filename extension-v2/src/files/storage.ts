/**
 * File storage using chrome.storage.local
 * Uses Base64 encoding to store binary data
 * This ensures files are accessible across all origins
 */

export interface StoredFile {
    id: string;
    data: string; // Base64 encoded data
    name: string;
    type: string;
    size: number;
    updatedAt: number;
}

/**
 * Convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Convert Base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Store a file
 */
export async function storeFile(id: string, blob: Blob, name: string): Promise<void> {
    const buffer = await blob.arrayBuffer();
    const data = arrayBufferToBase64(buffer);

    const file: StoredFile = {
        id,
        data,
        name,
        type: blob.type,
        size: blob.size,
        updatedAt: Date.now()
    };

    const key = `file_${id}`;
    await chrome.storage.local.set({ [key]: file });
    console.log(`[Storage] Stored file: ${id} (${name}, ${blob.size} bytes)`);
}

/**
 * Retrieve a file with blob reconstructed
 */
export async function getFile(id: string): Promise<{ blob: Blob; name: string; type: string; size: number; updatedAt: number } | null> {
    const key = `file_${id}`;
    const result = await chrome.storage.local.get([key]);
    const file: StoredFile = result[key];

    if (!file) {
        return null;
    }

    // Reconstruct blob from Base64
    const buffer = base64ToArrayBuffer(file.data);
    const blob = new Blob([buffer], { type: file.type });

    return {
        blob,
        name: file.name,
        type: file.type,
        size: file.size,
        updatedAt: file.updatedAt
    };
}

/**
 * Delete a file
 */
export async function deleteFile(id: string): Promise<void> {
    const key = `file_${id}`;
    await chrome.storage.local.remove([key]);
    console.log(`[Storage] Deleted file: ${id}`);
}

/**
 * List all stored files (metadata only)
 */
export async function listFiles(): Promise<{ id: string; name: string; type: string; size: number }[]> {
    const all = await chrome.storage.local.get(null);
    const files: { id: string; name: string; type: string; size: number }[] = [];

    for (const key of Object.keys(all)) {
        if (key.startsWith('file_')) {
            const file = all[key] as StoredFile;
            files.push({
                id: file.id,
                name: file.name,
                type: file.type,
                size: file.size
            });
        }
    }

    return files;
}

/**
 * Store file from ArrayBuffer (from postMessage)
 */
export async function storeFileFromBuffer(
    id: string,
    buffer: ArrayBuffer,
    name: string,
    mimeType: string
): Promise<void> {
    const blob = new Blob([buffer], { type: mimeType });
    return storeFile(id, blob, name);
}

/**
 * IndexedDB wrapper for storing files (resume, cover letter)
 * No size limits like chrome.storage
 */

const DB_NAME = 'jobfiller-files';
const DB_VERSION = 1;
const STORE_NAME = 'files';

interface StoredFile {
    id: string;
    blob: Blob;
    name: string;
    type: string;
    size: number;
    updatedAt: number;
}

let dbInstance: IDBDatabase | null = null;

/**
 * Open/create the database
 */
async function openDB(): Promise<IDBDatabase> {
    if (dbInstance) return dbInstance;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
            dbInstance = request.result;
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

/**
 * Store a file
 */
export async function storeFile(id: string, blob: Blob, name: string): Promise<void> {
    const db = await openDB();

    const file: StoredFile = {
        id,
        blob,
        name,
        type: blob.type,
        size: blob.size,
        updatedAt: Date.now()
    };

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(file);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            console.log(`[Storage] Stored file: ${id} (${name}, ${blob.size} bytes)`);
            resolve();
        };
    });
}

/**
 * Retrieve a file
 */
export async function getFile(id: string): Promise<StoredFile | null> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || null);
    });
}

/**
 * Delete a file
 */
export async function deleteFile(id: string): Promise<void> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

/**
 * List all stored files
 */
export async function listFiles(): Promise<StoredFile[]> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
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

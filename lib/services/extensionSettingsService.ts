import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ExtensionSettings {
    flashEnabled: boolean;
    autoFillEnabled: boolean;
    pushToExtensionEnabled: boolean;
    firebaseFallbackEnabled: boolean;
    autoProfileSync: boolean;
    installMethod: 'developer' | 'store' | 'enterprise';
    extensionId: string;
    storeExtensionId: string;
    chromeWebStoreUrl: string;
    developerModeInstructions: string;
    extensionZipUrl: string;
    currentVersion: string;
    minSupportedVersion: string;
    showExtensionPrompt: boolean;
    showInstallGuide: boolean;
}

const defaultSettings: ExtensionSettings = {
    flashEnabled: true,
    autoFillEnabled: true,
    pushToExtensionEnabled: true,
    firebaseFallbackEnabled: true,
    autoProfileSync: true,
    installMethod: 'developer',
    extensionId: '',
    storeExtensionId: '',
    chromeWebStoreUrl: '',
    developerModeInstructions: '',
    extensionZipUrl: '',
    currentVersion: '2.0.0',
    minSupportedVersion: '2.0.0',
    showExtensionPrompt: true,
    showInstallGuide: true,
};

// Cache settings for 5 minutes
let cachedSettings: ExtensionSettings | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Get extension settings from Firebase admin settings
 * Cached for performance
 */
export async function getExtensionSettings(): Promise<ExtensionSettings> {
    // Return cached if fresh
    if (cachedSettings && Date.now() - cacheTimestamp < CACHE_DURATION) {
        return cachedSettings;
    }

    try {
        const docRef = doc(db, 'adminSettings', 'extension');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            cachedSettings = { ...defaultSettings, ...docSnap.data() } as ExtensionSettings;
        } else {
            cachedSettings = defaultSettings;
        }
        cacheTimestamp = Date.now();
        return cachedSettings;
    } catch (error) {
        console.error('[ExtensionSettingsService] Error fetching settings:', error);
        return defaultSettings;
    }
}

/**
 * Get the active extension ID based on install method
 */
export async function getActiveExtensionId(): Promise<string | null> {
    const settings = await getExtensionSettings();

    switch (settings.installMethod) {
        case 'store':
            return settings.storeExtensionId || null;
        case 'developer':
        case 'enterprise':
        default:
            return settings.extensionId || null;
    }
}

/**
 * Check if auto profile sync is enabled
 */
export async function isAutoProfileSyncEnabled(): Promise<boolean> {
    const settings = await getExtensionSettings();
    return settings.autoProfileSync;
}

/**
 * Clear cached settings (call after admin updates)
 */
export function clearSettingsCache(): void {
    cachedSettings = null;
    cacheTimestamp = 0;
}

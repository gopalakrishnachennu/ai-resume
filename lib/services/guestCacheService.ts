/**
 * Guest Cache Service
 * Manages localStorage caching for guest users
 * Provides instant UX while syncing to Firebase for data collection
 */

const CACHE_KEYS = {
    API_KEY: 'guest_api_key',
    API_PROVIDER: 'guest_api_provider',
    PROFILE: 'guest_profile',
    EXPERIENCE: 'guest_experience',
    EDUCATION: 'guest_education',
    SKILLS: 'guest_skills',
    USER_ID: 'guest_user_id',
} as const;

export class GuestCacheService {
    /**
     * Check if localStorage is available (SSR-safe)
     */
    private static isAvailable(): boolean {
        if (typeof window === 'undefined') return false;
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Save API key to cache
     */
    static saveApiKey(provider: string, apiKey: string): void {
        if (!this.isAvailable()) return;

        try {
            localStorage.setItem(CACHE_KEYS.API_PROVIDER, provider);
            localStorage.setItem(CACHE_KEYS.API_KEY, apiKey);
            console.log('[GuestCache] API key cached');
        } catch (error) {
            console.error('[GuestCache] Failed to cache API key:', error);
        }
    }

    /**
     * Load API key from cache
     */
    static loadApiKey(): { provider: string; apiKey: string } | null {
        if (!this.isAvailable()) return null;

        try {
            const provider = localStorage.getItem(CACHE_KEYS.API_PROVIDER);
            const apiKey = localStorage.getItem(CACHE_KEYS.API_KEY);

            if (provider && apiKey) {
                console.log('[GuestCache] API key loaded from cache');
                return { provider, apiKey };
            }
        } catch (error) {
            console.error('[GuestCache] Failed to load API key:', error);
        }

        return null;
    }

    /**
     * Save profile data to cache
     */
    static saveProfile(profile: any): void {
        if (!this.isAvailable()) return;

        try {
            localStorage.setItem(CACHE_KEYS.PROFILE, JSON.stringify(profile));
            console.log('[GuestCache] Profile cached');
        } catch (error) {
            console.error('[GuestCache] Failed to cache profile:', error);
        }
    }

    /**
     * Load profile data from cache
     */
    static loadProfile(): any | null {
        if (!this.isAvailable()) return null;

        try {
            const cached = localStorage.getItem(CACHE_KEYS.PROFILE);
            if (cached) {
                console.log('[GuestCache] Profile loaded from cache');
                return JSON.parse(cached);
            }
        } catch (error) {
            console.error('[GuestCache] Failed to load profile:', error);
        }

        return null;
    }

    /**
     * Save experience data to cache
     */
    static saveExperience(experience: any[]): void {
        if (!this.isAvailable()) return;

        try {
            localStorage.setItem(CACHE_KEYS.EXPERIENCE, JSON.stringify(experience));
            console.log('[GuestCache] Experience cached');
        } catch (error) {
            console.error('[GuestCache] Failed to cache experience:', error);
        }
    }

    /**
     * Load experience data from cache
     */
    static loadExperience(): any[] | null {
        if (!this.isAvailable()) return null;

        try {
            const cached = localStorage.getItem(CACHE_KEYS.EXPERIENCE);
            if (cached) {
                console.log('[GuestCache] Experience loaded from cache');
                return JSON.parse(cached);
            }
        } catch (error) {
            console.error('[GuestCache] Failed to load experience:', error);
        }

        return null;
    }

    /**
     * Save education data to cache
     */
    static saveEducation(education: any[]): void {
        if (!this.isAvailable()) return;

        try {
            localStorage.setItem(CACHE_KEYS.EDUCATION, JSON.stringify(education));
            console.log('[GuestCache] Education cached');
        } catch (error) {
            console.error('[GuestCache] Failed to cache education:', error);
        }
    }

    /**
     * Load education data from cache
     */
    static loadEducation(): any[] | null {
        if (!this.isAvailable()) return null;

        try {
            const cached = localStorage.getItem(CACHE_KEYS.EDUCATION);
            if (cached) {
                console.log('[GuestCache] Education loaded from cache');
                return JSON.parse(cached);
            }
        } catch (error) {
            console.error('[GuestCache] Failed to load education:', error);
        }

        return null;
    }

    /**
     * Save skills data to cache
     */
    static saveSkills(skills: string[]): void {
        if (!this.isAvailable()) return;

        try {
            localStorage.setItem(CACHE_KEYS.SKILLS, JSON.stringify(skills));
            console.log('[GuestCache] Skills cached');
        } catch (error) {
            console.error('[GuestCache] Failed to cache skills:', error);
        }
    }

    /**
     * Load skills data from cache
     */
    static loadSkills(): string[] | null {
        if (!this.isAvailable()) return null;

        try {
            const cached = localStorage.getItem(CACHE_KEYS.SKILLS);
            if (cached) {
                console.log('[GuestCache] Skills loaded from cache');
                return JSON.parse(cached);
            }
        } catch (error) {
            console.error('[GuestCache] Failed to load skills:', error);
        }

        return null;
    }

    /**
     * Save guest user ID to cache
     */
    static saveUserId(userId: string): void {
        if (!this.isAvailable()) return;

        try {
            localStorage.setItem(CACHE_KEYS.USER_ID, userId);
            console.log('[GuestCache] User ID cached');
        } catch (error) {
            console.error('[GuestCache] Failed to cache user ID:', error);
        }
    }

    /**
     * Load guest user ID from cache
     */
    static loadUserId(): string | null {
        if (!this.isAvailable()) return null;

        try {
            const userId = localStorage.getItem(CACHE_KEYS.USER_ID);
            if (userId) {
                console.log('[GuestCache] User ID loaded from cache');
                return userId;
            }
        } catch (error) {
            console.error('[GuestCache] Failed to load user ID:', error);
        }

        return null;
    }

    /**
     * Clear all guest cache (when user upgrades to full account)
     */
    static clearAll(): void {
        if (!this.isAvailable()) return;

        try {
            Object.values(CACHE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            console.log('[GuestCache] All cache cleared');
        } catch (error) {
            console.error('[GuestCache] Failed to clear cache:', error);
        }
    }

    /**
     * Check if guest has cached data
     */
    static hasCachedData(): boolean {
        if (!this.isAvailable()) return false;

        return !!(
            localStorage.getItem(CACHE_KEYS.API_KEY) ||
            localStorage.getItem(CACHE_KEYS.PROFILE) ||
            localStorage.getItem(CACHE_KEYS.EXPERIENCE)
        );
    }
}

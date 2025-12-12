// Storage Manager - Abstracts Chrome Storage API
// Provides easy-to-use methods for managing extension data

const StorageManager = {
    /**
     * Get data from local storage
     * @param {string|string[]} keys - Key(s) to retrieve
     * @returns {Promise<Object>}
     */
    async get(keys) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(keys, (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(result);
                }
            });
        });
    },

    /**
     * Set data in local storage
     * @param {Object} data - Data to store
     * @returns {Promise<void>}
     */
    async set(data) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set(data, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve();
                }
            });
        });
    },

    /**
     * Remove data from local storage
     * @param {string|string[]} keys - Key(s) to remove
     * @returns {Promise<void>}
     */
    async remove(keys) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.remove(keys, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve();
                }
            });
        });
    },

    /**
     * Clear all data from local storage
     * @returns {Promise<void>}
     */
    async clear() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.clear(() => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve();
                }
            });
        });
    },

    /**
     * Get user profile
     * @returns {Promise<Object|null>}
     */
    async getProfile() {
        const result = await this.get('userProfile');
        return result.userProfile || null;
    },

    /**
     * Save user profile
     * @param {Object} profile - Profile data
     * @returns {Promise<void>}
     */
    async saveProfile(profile) {
        profile.lastUpdated = new Date().toISOString();
        await this.set({ userProfile: profile });
    },

    /**
     * Get application history
     * @returns {Promise<Array>}
     */
    async getHistory() {
        const result = await this.get('applicationHistory');
        return result.applicationHistory || [];
    },

    /**
     * Add application to history
     * @param {Object} application - Application data
     * @returns {Promise<void>}
     */
    async addToHistory(application) {
        const history = await this.getHistory();

        application.id = `app_${Date.now()}`;
        application.appliedAt = new Date().toISOString();

        history.unshift(application);

        // Keep only last 100 applications
        if (history.length > 100) {
            history.splice(100);
        }

        await this.set({ applicationHistory: history });
    },

    /**
     * Get statistics
     * @returns {Promise<Object>}
     */
    async getStats() {
        const result = await this.get('stats');
        return result.stats || {
            fieldsFilled: 0,
            applicationsCompleted: 0,
            timeSaved: 0
        };
    },

    /**
     * Update statistics
     * @param {Object} updates - Stats to update
     * @returns {Promise<void>}
     */
    async updateStats(updates) {
        const stats = await this.getStats();

        if (updates.fieldsFilled) {
            stats.fieldsFilled = (stats.fieldsFilled || 0) + updates.fieldsFilled;
        }
        if (updates.applicationCompleted) {
            stats.applicationsCompleted = (stats.applicationsCompleted || 0) + 1;
        }

        await this.set({ stats });
    },

    /**
     * Get settings
     * @returns {Promise<Object>}
     */
    async getSettings() {
        const result = await this.get('settings');
        return result.settings || {
            showFloatingButton: true,
            autoDetect: true,
            apiEndpoint: '',
            apiKey: ''
        };
    },

    /**
     * Save settings
     * @param {Object} settings - Settings data
     * @returns {Promise<void>}
     */
    async saveSettings(settings) {
        await this.set({ settings });
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}

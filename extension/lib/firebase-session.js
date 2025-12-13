// Firebase Session Service - Reads active sessions from Firestore
// Uses REST API for simplicity in MV3 extensions

const FirebaseSession = {
    // Firebase project config - set via options page or get from storage
    // Default: check storage or use hardcoded fallback
    _projectId: null,

    async getProjectId() {
        if (this._projectId) return this._projectId;

        try {
            const result = await chrome.storage.local.get('firebaseProjectId');
            this._projectId = result.firebaseProjectId || 'ai-resume-builder-app';
            return this._projectId;
        } catch {
            return 'ai-resume-builder-app';
        }
    },

    // Firestore REST API base URL
    async getBaseUrl() {
        const projectId = await this.getProjectId();
        return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
    },

    /**
     * Get active session for a user
     * @param {string} userId - Firebase user ID
     * @returns {Promise<Object|null>} Session data or null
     */
    async getSession(userId) {
        if (!userId) {
            console.log('[FirebaseSession] No userId provided');
            return null;
        }

        try {
            const baseUrl = await this.getBaseUrl();
            const url = `${baseUrl}/activeSession/${userId}`;
            console.log('[FirebaseSession] Fetching session:', url);

            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 404) {
                    console.log('[FirebaseSession] No active session found');
                    return null;
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const session = this.parseFirestoreDocument(data);

            // Check if session is expired
            if (session.expiresAt) {
                const expiresAt = new Date(session.expiresAt);
                if (expiresAt < new Date()) {
                    console.log('[FirebaseSession] Session expired');
                    return null;
                }
            }

            // Check if session is active
            if (!session.active) {
                console.log('[FirebaseSession] Session not active');
                return null;
            }

            console.log('[FirebaseSession] Session loaded successfully');
            return session;
        } catch (error) {
            console.error('[FirebaseSession] Error fetching session:', error);
            return null;
        }
    },

    /**
     * Parse Firestore document format to plain object
     * Firestore REST API returns typed values like { stringValue: "..." }
     */
    parseFirestoreDocument(doc) {
        if (!doc.fields) return null;

        const parseValue = (value) => {
            if (value.stringValue !== undefined) return value.stringValue;
            if (value.integerValue !== undefined) return parseInt(value.integerValue);
            if (value.doubleValue !== undefined) return parseFloat(value.doubleValue);
            if (value.booleanValue !== undefined) return value.booleanValue;
            if (value.nullValue !== undefined) return null;
            if (value.timestampValue !== undefined) return value.timestampValue;
            if (value.arrayValue !== undefined) {
                return (value.arrayValue.values || []).map(parseValue);
            }
            if (value.mapValue !== undefined) {
                const obj = {};
                const fields = value.mapValue.fields || {};
                for (const [key, val] of Object.entries(fields)) {
                    obj[key] = parseValue(val);
                }
                return obj;
            }
            return value;
        };

        const result = {};
        for (const [key, value] of Object.entries(doc.fields)) {
            result[key] = parseValue(value);
        }
        return result;
    },

    /**
     * Check if there's an active session and return it
     * Uses userId from storage
     */
    async checkActiveSession() {
        try {
            const { firebaseUserId } = await chrome.storage.local.get('firebaseUserId');
            if (!firebaseUserId) {
                console.log('[FirebaseSession] No Firebase userId stored');
                return null;
            }
            return await this.getSession(firebaseUserId);
        } catch (error) {
            console.error('[FirebaseSession] Error checking session:', error);
            return null;
        }
    },

    /**
     * Convert session data to profile format for form filling
     * Maps session structure to the format expected by FormFiller
     */
    sessionToProfile(session) {
        if (!session) return null;

        const personalInfo = session.personalInfo || {};
        const skills = session.skills || {};
        const extensionSettings = session.extensionSettings || {};

        // Handle different name formats
        // Priority: firstName/lastName > fullName > name
        let firstName = personalInfo.firstName || '';
        let lastName = personalInfo.lastName || '';

        if (!firstName && !lastName) {
            // Try to extract from fullName or name
            const fullName = personalInfo.fullName || personalInfo.name || '';
            if (fullName) {
                const parts = fullName.trim().split(/\s+/);
                firstName = parts[0] || '';
                lastName = parts.slice(1).join(' ') || '';
            }
        }

        const computedFullName = personalInfo.fullName || personalInfo.name || `${firstName} ${lastName}`.trim();

        // Handle location - can be string or object
        let city = personalInfo.city || '';
        let state = personalInfo.state || '';
        let country = personalInfo.country || 'USA';
        let locationStr = personalInfo.location || '';

        if (typeof locationStr === 'string' && locationStr.includes(',') && (!city || !state)) {
            const parts = locationStr.split(',').map(p => p.trim());
            city = parts[0] || city;
            state = parts[1] || state;
            country = parts[2] || country;
        }

        return {
            // NESTED STRUCTURE for form-filler.js compatibility
            personalInfo: {
                firstName,
                lastName,
                fullName: computedFullName,
                middleName: personalInfo.middleName || '',
                email: personalInfo.email || '',
                phone: personalInfo.phone || '',
                location: {
                    address: locationStr,
                    city,
                    state,
                    country,
                    zipCode: personalInfo.zipCode || '',
                },
                linkedin: personalInfo.linkedin || '',
                github: personalInfo.github || '',
                twitter: personalInfo.twitter || '',
                portfolio: personalInfo.portfolio || '',
                website: personalInfo.portfolio || '',
            },

            // Experience array
            experience: (session.experience || []).map(exp => ({
                company: exp.company || '',
                position: exp.title || '',
                title: exp.title || '',
                location: exp.location || '',
                startDate: exp.startDate || '',
                endDate: exp.endDate || '',
                current: exp.current || false,
                description: (exp.responsibilities || []).join('\n'),
                responsibilities: exp.responsibilities || [],
            })),

            // Education array
            education: (session.education || []).map(edu => ({
                institution: edu.institution || '',
                school: edu.institution || '',
                degree: edu.degree || '',
                field: edu.field || '',
                major: edu.field || '',
                graduationDate: edu.graduationDate || '',
                gpa: edu.gpa || '',
            })),

            // Skills object
            skills: {
                all: skills.all || '',
                technical: {
                    programming: skills.languages || [],
                    frameworks: skills.frameworks || [],
                    tools: skills.tools || [],
                    databases: skills.databases || [],
                    cloud: skills.cloud || [],
                },
                soft: [],
            },

            // Preferences object
            preferences: {
                workAuthorized: extensionSettings.workAuthorization === 'authorized' || extensionSettings.workAuthorization === 'yes',
                sponsorshipRequired: extensionSettings.requireSponsorship === 'yes' || extensionSettings.requireSponsorship === true,
                willingToRelocate: extensionSettings.willingToRelocate === 'yes' || extensionSettings.willingToRelocate === true,
                salaryExpectation: {
                    min: extensionSettings.salaryMin || '',
                    max: extensionSettings.salaryMax || '',
                    expected: extensionSettings.salaryExpectation || '',
                },
                noticePeriod: extensionSettings.noticePeriod || 'Immediately',
                jobTypes: ['Full-time'],
                workArrangement: [extensionSettings.workType || 'Remote'],
            },

            // Professional Summary
            professionalSummary: session.professionalSummary || '',

            // Target job
            targetJobTitle: session.jobTitle || '',
            targetCompany: session.jobCompany || '',

            // URLs
            resumePdfUrl: session.pdfUrl || '',
            resumeDocxUrl: session.docxUrl || '',

            // Session metadata
            _sessionActive: true,
            _fromFlash: true,
        };
    },

    /**
     * Store userId for future session checks
     */
    async setUserId(userId) {
        await chrome.storage.local.set({ firebaseUserId: userId });
        console.log('[FirebaseSession] Stored userId:', userId);
    },

    /**
     * Get stored userId
     */
    async getUserId() {
        const { firebaseUserId } = await chrome.storage.local.get('firebaseUserId');
        return firebaseUserId || null;
    },

    /**
     * Clear stored userId
     */
    async clearUserId() {
        await chrome.storage.local.remove('firebaseUserId');
        console.log('[FirebaseSession] Cleared userId');
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseSession;
}

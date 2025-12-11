/**
 * Master Application Configuration
 * 
 * Control all app features, limits, and settings from this single file.
 * Can be edited via Admin Panel at /admin
 */

export const APP_CONFIG = {

    // ═══════════════════════════════════════════════════════
    // AUTHENTICATION & ACCESS CONTROL
    // ═══════════════════════════════════════════════════════

    auth: {
        enabled: true,              // Enable/disable authentication entirely
        requireLogin: false,        // Force login for everyone (no guest mode)
        allowAnonymous: true,       // Allow anonymous/guest users
        allowGoogleSignIn: true,    // Enable Google OAuth
        allowEmailSignIn: true,     // Enable email/password
    },


    // ═══════════════════════════════════════════════════════
    // GUEST/FREE USER SETTINGS
    // ═══════════════════════════════════════════════════════

    guest: {
        enabled: true,              // Enable guest mode
        unlimited: false,           // Unlimited access for guests

        limits: {
            resumeGenerations: 3,     // Max resumes
            jdAnalyses: 5,            // Max JD analyses
            aiSuggestions: 10,        // Max AI enhancements
            pdfDownloads: 3,          // Max PDF downloads
            docxDownloads: 3,         // Max DOCX downloads
            resumeEdits: 10,          // Max edit sessions
        },

        expiry: {
            enabled: true,            // Enable usage reset
            days: 7,                  // Reset after X days
        },

        restrictions: {
            canDownloadPDF: true,     // Allow PDF download
            canDownloadDOCX: true,    // Allow DOCX download
            canSaveResumes: true,     // Allow saving
            canEditResumes: true,     // Allow editing
            canViewHistory: false,    // Allow history view
            canUseAI: true,           // Allow AI features
        },
    },


    // ═══════════════════════════════════════════════════════
    // LOGGED-IN USER SETTINGS
    // ═══════════════════════════════════════════════════════

    loggedIn: {
        unlimited: true,            // Unlimited for logged-in users

        limits: {
            // Only used if unlimited = false
            resumeGenerations: 999,
            jdAnalyses: 999,
            aiSuggestions: 999,
            pdfDownloads: 999,
            docxDownloads: 999,
        },
    },


    // ═══════════════════════════════════════════════════════
    // FEATURE TOGGLES
    // ═══════════════════════════════════════════════════════

    features: {
        resumeGeneration: true,     // Enable/disable resume generation
        jdAnalysis: true,           // Enable/disable JD analysis
        aiEnhancement: true,        // Enable/disable AI suggestions
        pdfExport: true,            // Enable/disable PDF export
        docxExport: true,           // Enable/disable DOCX export
        resumeEditor: true,         // Enable/disable editor
        dashboard: true,            // Enable/disable dashboard
        profile: true,              // Enable/disable profile page
    },


    // ═══════════════════════════════════════════════════════
    // UI/UX SETTINGS
    // ═══════════════════════════════════════════════════════

    ui: {
        showUpgradePrompts: true,           // Show "Sign up" banners
        upgradeAfterUses: 2,                // Show after X uses
        upgradeMessage: "Sign up for unlimited access!",

        showUsageCounter: true,             // Show "2/3 resumes used"
        showLimitWarning: true,             // Warn before limit
        warningThreshold: 1,                // Warn when X uses left

        allowGuestDashboard: false,         // Show dashboard to guests
        allowGuestProfile: false,           // Show profile to guests
    },


    // ═══════════════════════════════════════════════════════
    // AI/LLM SETTINGS
    // ═══════════════════════════════════════════════════════

    ai: {
        enabled: true,                      // Enable AI features
        providers: {
            openai: true,                     // Enable OpenAI
            gemini: true,                     // Enable Gemini
            anthropic: false,                 // Enable Claude
        },

        globalKey: {
            enabled: true,
            provider: 'gemini',
            key: '',
            limit: 3,
        },

        limits: {
            maxTokensPerRequest: 2000,        // Max tokens per request
            maxRequestsPerMinute: 10,         // Rate limit
        },
    },


    // ═══════════════════════════════════════════════════════
    // STORAGE & CACHING
    // ═══════════════════════════════════════════════════════

    storage: {
        useFirebase: true,                  // Use Firebase
        useLocalStorage: false,             // Use localStorage
        cacheEnabled: true,                 // Enable caching
        cacheDuration: 3600,                // Cache duration (seconds)
    },


    // ═══════════════════════════════════════════════════════
    // ANALYTICS & TRACKING
    // ═══════════════════════════════════════════════════════

    analytics: {
        enabled: true,                      // Enable analytics
        trackGuestUsers: true,              // Track anonymous users
        trackUsage: true,                   // Track feature usage
        trackErrors: true,                  // Track errors
    },


    // ═══════════════════════════════════════════════════════
    // ADMIN SETTINGS
    // ═══════════════════════════════════════════════════════

    admin: {
        enabled: true,                      // Enable admin panel
        allowConfigEdit: true,              // Allow editing this config
        requirePassword: true,              // Protect admin panel
        adminEmails: [                      // Admin user emails
            'admin@example.com',
        ],
    },
};

// Type definitions for TypeScript
export type AppConfig = typeof APP_CONFIG;
export type GuestLimits = typeof APP_CONFIG.guest.limits;
export type FeatureToggles = typeof APP_CONFIG.features;

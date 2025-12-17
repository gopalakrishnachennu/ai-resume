/**
 * Centralized Configuration
 * Change these values once and they apply everywhere
 */

// ============================================
// 🔧 CHANGE YOUR DASHBOARD URL HERE
// ============================================
export const DASHBOARD_URL = "https://ai-resume-gopalakrishnachennu-5461s-projects.vercel.app";

// ============================================
// Other Configuration
// ============================================

export const CONFIG = {
    // Your webapp URL - change this!
    dashboardUrl: DASHBOARD_URL,

    // Extension settings
    fillDelay: 75,           // ms between fields
    showOverlay: true,       // Show progress widget
    autoFill: false,         // Auto-fill on page load

    // AI Settings
    groqModel: "llama3-8b-8192",

    // Cache settings
    maxCacheEntries: 500,

    // Version
    version: "2.0.0"
};

export default CONFIG;

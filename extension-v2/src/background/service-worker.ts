/**
 * JobFiller Pro V2 - Service Worker (Background)
 * Handles background tasks, alarms, and context menus
 */

import { CONFIG } from "../core/config";

// Extension installed/updated
chrome.runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails) => {
    console.log("[ServiceWorker] Installed:", details.reason);

    // Initialize storage with defaults from config
    chrome.storage.local.get(["settings", "stats"], (result: any) => {
        if (!result.settings) {
            chrome.storage.local.set({
                settings: {
                    dashboardUrl: CONFIG.dashboardUrl,
                    autoFill: CONFIG.autoFill,
                    showOverlay: CONFIG.showOverlay,
                    fillDelay: CONFIG.fillDelay
                }
            });
        }

        if (!result.stats) {
            chrome.storage.local.set({
                stats: {
                    filledToday: 0,
                    cached: 0,
                    totalFilled: 0,
                    lastReset: Date.now()
                }
            });
        }
    });

    // Create context menu
    chrome.contextMenus.create({
        id: "jobfiller-fill",
        title: "Fill with JobFiller Pro",
        contexts: ["page"]
    });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => {
    if (info.menuItemId === "jobfiller-fill" && tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: "FILL_FORM" });
    }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    console.log("[ServiceWorker] Message:", request.type);

    switch (request.type) {
        case "GET_AUTH":
            chrome.storage.local.get(["auth"], (result: any) => {
                sendResponse(result.auth || null);
            });
            return true;

        case "GET_PROFILE":
            chrome.storage.local.get(["profile"], (result: any) => {
                sendResponse(result.profile || null);
            });
            return true;

        case "LOG_FILL":
            console.log("[ServiceWorker] Fill logged:", request.data);
            sendResponse({ success: true });
            break;

        default:
            break;
    }
});

// Reset daily stats at midnight
chrome.alarms.create("reset-daily-stats", {
    when: getNextMidnight(),
    periodInMinutes: 24 * 60
});

chrome.alarms.onAlarm.addListener((alarm: chrome.alarms.Alarm) => {
    if (alarm.name === "reset-daily-stats") {
        chrome.storage.local.get(["stats"], (result: any) => {
            const stats = result.stats || {};
            stats.filledToday = 0;
            stats.lastReset = Date.now();
            chrome.storage.local.set({ stats });
            console.log("[ServiceWorker] Daily stats reset");
        });
    }
});

function getNextMidnight(): number {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
}

console.log("[ServiceWorker] JobFiller Pro V2 running 🚀");

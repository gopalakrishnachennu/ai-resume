/**
 * JobFiller Pro V2 - Content Script Entry Point
 * Loads all content script modules
 */

console.log("[JobFiller Pro V2] Content Script Loading... ⚡");

// Immediately add PING listener for extension detection
// This ensures webapp can detect extension even if other imports fail
window.addEventListener("message", (event) => {
    if (event.data?.type === "JOBFILLER_PING") {
        console.log("[JobFiller Pro V2] PING received, responding with PONG");
        window.postMessage({ type: "JOBFILLER_PONG", installed: true }, "*");
    }
});

// Import the listener module which sets up all message handlers
import "./listener";

console.log("[JobFiller Pro V2] Content Script Initialized ⚡");

'use client';

import React from 'react';

interface SaveIndicatorProps {
    isSaving: boolean;
    lastSaved: Date | null;
    hasUnsavedChanges: boolean;
    error?: string | null;
    className?: string;
}

/**
 * Visual indicator showing auto-save status
 */
export function SaveIndicator({
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    error,
    className = '',
}: SaveIndicatorProps) {
    const formatTime = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);

        if (diffSec < 10) return 'just now';
        if (diffSec < 60) return `${diffSec}s ago`;
        if (diffMin < 60) return `${diffMin}m ago`;
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (error) {
        return (
            <div className={`flex items-center gap-1.5 text-xs text-red-500 ${className}`}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Save failed</span>
            </div>
        );
    }

    if (isSaving) {
        return (
            <div className={`flex items-center gap-1.5 text-xs text-gray-400 ${className}`}>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Saving...</span>
            </div>
        );
    }

    if (hasUnsavedChanges) {
        return (
            <div className={`flex items-center gap-1.5 text-xs text-amber-500 ${className}`}>
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Unsaved</span>
            </div>
        );
    }

    if (lastSaved) {
        return (
            <div className={`flex items-center gap-1.5 text-xs text-green-600 ${className}`}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Saved {formatTime(lastSaved)}</span>
            </div>
        );
    }

    return null;
}

export default SaveIndicator;

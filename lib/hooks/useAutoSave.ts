'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface AutoSaveState {
    isSaving: boolean;
    lastSaved: Date | null;
    hasUnsavedChanges: boolean;
    error: string | null;
}

interface UseAutoSaveOptions {
    delay?: number;
    enabled?: boolean;
    onSaveStart?: () => void;
    onSaveSuccess?: () => void;
    onSaveError?: (error: Error) => void;
}

/**
 * A hook that provides debounced auto-save functionality.
 * 
 * @param data - The data to watch for changes
 * @param saveFunction - The async function to call when saving
 * @param options - Configuration options
 * @returns AutoSaveState with status information
 */
export function useAutoSave<T>(
    data: T,
    saveFunction: () => Promise<void>,
    options: UseAutoSaveOptions = {}
): AutoSaveState & { triggerSave: () => Promise<void> } {
    const {
        delay = 2000,
        enabled = true,
        onSaveStart,
        onSaveSuccess,
        onSaveError,
    } = options;

    const [state, setState] = useState<AutoSaveState>({
        isSaving: false,
        lastSaved: null,
        hasUnsavedChanges: false,
        error: null,
    });

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isFirstRender = useRef(true);
    const lastDataRef = useRef<string>('');
    const saveFunctionRef = useRef(saveFunction);

    // Keep save function reference up to date
    useEffect(() => {
        saveFunctionRef.current = saveFunction;
    }, [saveFunction]);

    // The actual save function
    const performSave = useCallback(async () => {
        if (state.isSaving) return;

        setState(prev => ({ ...prev, isSaving: true, error: null }));
        onSaveStart?.();

        try {
            await saveFunctionRef.current();
            setState(prev => ({
                ...prev,
                isSaving: false,
                lastSaved: new Date(),
                hasUnsavedChanges: false,
            }));
            onSaveSuccess?.();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Save failed';
            setState(prev => ({
                ...prev,
                isSaving: false,
                error: errorMessage,
            }));
            onSaveError?.(error instanceof Error ? error : new Error(errorMessage));
        }
    }, [state.isSaving, onSaveStart, onSaveSuccess, onSaveError]);

    // Watch for data changes and trigger debounced save
    useEffect(() => {
        if (!enabled) return;

        // Serialize data to detect real changes (with error handling)
        let serialized: string;
        try {
            serialized = JSON.stringify(data);
        } catch (e) {
            // If serialization fails (circular refs, etc), skip this update
            console.warn('Auto-save: Failed to serialize data', e);
            return;
        }

        // Skip first render
        if (isFirstRender.current) {
            isFirstRender.current = false;
            lastDataRef.current = serialized;
            return;
        }

        // Check if data actually changed
        if (serialized === lastDataRef.current) {
            return;
        }

        lastDataRef.current = serialized;

        // Mark as having unsaved changes
        setState(prev => ({ ...prev, hasUnsavedChanges: true }));

        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set new timeout for debounced save
        timeoutRef.current = setTimeout(() => {
            performSave();
        }, delay);

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [data, delay, enabled, performSave]);

    // Manual trigger save function
    const triggerSave = useCallback(async () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        await performSave();
    }, [performSave]);

    return {
        ...state,
        triggerSave,
    };
}

export default useAutoSave;

/**
 * Event Bus - Central Event Management System
 * 
 * Provides pub/sub functionality for the entire application.
 * All components can emit and listen to events through this bus.
 */

import { Event, EventHandler, EventSubscription } from '@/lib/types/Core';

export class EventBus {
    private static instance: EventBus;
    private subscribers: Map<string, Map<string, EventHandler>>;
    private eventHistory: Event[];
    private maxHistorySize: number;

    private constructor() {
        this.subscribers = new Map();
        this.eventHistory = [];
        this.maxHistorySize = 100; // Keep last 100 events
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): EventBus {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }

    /**
     * Subscribe to an event
     */
    public subscribe<T = any>(
        eventType: string,
        handler: EventHandler<T>
    ): EventSubscription {
        // Generate unique subscription ID
        const subscriptionId = `${eventType}_${Date.now()}_${Math.random()}`;

        // Get or create subscribers map for this event type
        if (!this.subscribers.has(eventType)) {
            this.subscribers.set(eventType, new Map());
        }

        const eventSubscribers = this.subscribers.get(eventType)!;
        eventSubscribers.set(subscriptionId, handler as EventHandler);

        console.log(`[EventBus] Subscribed to "${eventType}" (ID: ${subscriptionId})`);

        // Return subscription object
        return {
            id: subscriptionId,
            eventType,
            handler: handler as EventHandler,
            unsubscribe: () => this.unsubscribe(eventType, subscriptionId),
        };
    }

    /**
     * Unsubscribe from an event
     */
    public unsubscribe(eventType: string, subscriptionId: string): void {
        const eventSubscribers = this.subscribers.get(eventType);
        if (eventSubscribers) {
            eventSubscribers.delete(subscriptionId);
            console.log(`[EventBus] Unsubscribed from "${eventType}" (ID: ${subscriptionId})`);

            // Clean up empty event type maps
            if (eventSubscribers.size === 0) {
                this.subscribers.delete(eventType);
            }
        }
    }

    /**
     * Emit an event
     */
    public async emit<T = any>(
        eventType: string,
        payload: T,
        source: string = 'unknown'
    ): Promise<void> {
        const event: Event<T> = {
            type: eventType,
            payload,
            metadata: {
                timestamp: Date.now(),
                source,
                correlationId: this.generateCorrelationId(),
            },
        };

        // Add to history
        this.addToHistory(event);

        // Get subscribers for this event type
        const eventSubscribers = this.subscribers.get(eventType);
        if (!eventSubscribers || eventSubscribers.size === 0) {
            console.log(`[EventBus] No subscribers for "${eventType}"`);
            return;
        }

        console.log(`[EventBus] Emitting "${eventType}" to ${eventSubscribers.size} subscriber(s)`);

        // Execute all handlers
        const handlers = Array.from(eventSubscribers.values());
        await Promise.all(
            handlers.map(async (handler) => {
                try {
                    await handler(event);
                } catch (error) {
                    console.error(`[EventBus] Error in handler for "${eventType}":`, error);
                }
            })
        );
    }

    /**
     * Emit an event synchronously (fire and forget)
     */
    public emitSync<T = any>(
        eventType: string,
        payload: T,
        source: string = 'unknown'
    ): void {
        // Don't await - fire and forget
        this.emit(eventType, payload, source).catch((error) => {
            console.error(`[EventBus] Error emitting "${eventType}":`, error);
        });
    }

    /**
     * Get event history
     */
    public getHistory(eventType?: string): Event[] {
        if (eventType) {
            return this.eventHistory.filter((event) => event.type === eventType);
        }
        return [...this.eventHistory];
    }

    /**
     * Clear event history
     */
    public clearHistory(): void {
        this.eventHistory = [];
        console.log('[EventBus] Event history cleared');
    }

    /**
     * Get all active subscriptions
     */
    public getSubscriptions(): Map<string, number> {
        const subscriptionCounts = new Map<string, number>();
        this.subscribers.forEach((subscribers, eventType) => {
            subscriptionCounts.set(eventType, subscribers.size);
        });
        return subscriptionCounts;
    }

    /**
     * Clear all subscriptions
     */
    public clearAllSubscriptions(): void {
        this.subscribers.clear();
        console.log('[EventBus] All subscriptions cleared');
    }

    /**
     * Add event to history
     */
    private addToHistory(event: Event): void {
        this.eventHistory.push(event);

        // Trim history if too large
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
        }
    }

    /**
     * Generate correlation ID for event tracking
     */
    private generateCorrelationId(): string {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Export singleton instance
export const eventBus = EventBus.getInstance();

// ============================================================================
// COMMON EVENT TYPES
// ============================================================================

export const EventTypes = {
    // User events
    USER_LOGIN: 'user:login',
    USER_LOGOUT: 'user:logout',
    USER_SIGNUP: 'user:signup',
    USER_PROFILE_UPDATED: 'user:profile:updated',

    // API Key events
    API_KEY_UPDATED: 'apiKey:updated',
    API_KEY_VALIDATED: 'apiKey:validated',
    API_KEY_INVALID: 'apiKey:invalid',

    // Resume events
    RESUME_GENERATION_STARTED: 'resume:generation:started',
    RESUME_GENERATION_COMPLETED: 'resume:generation:completed',
    RESUME_GENERATION_FAILED: 'resume:generation:failed',

    // Pipeline events
    PIPELINE_STARTED: 'pipeline:started',
    PIPELINE_STAGE_COMPLETED: 'pipeline:stage:completed',
    PIPELINE_COMPLETED: 'pipeline:completed',
    PIPELINE_FAILED: 'pipeline:failed',

    // Plugin events
    PLUGIN_LOADED: 'plugin:loaded',
    PLUGIN_ENABLED: 'plugin:enabled',
    PLUGIN_DISABLED: 'plugin:disabled',
    PLUGIN_ERROR: 'plugin:error',

    // Cache events
    CACHE_HIT: 'cache:hit',
    CACHE_MISS: 'cache:miss',
    CACHE_UPDATED: 'cache:updated',
    CACHE_CLEARED: 'cache:cleared',

    // System events
    SYSTEM_ERROR: 'system:error',
    SYSTEM_WARNING: 'system:warning',
    SYSTEM_INFO: 'system:info',
} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];

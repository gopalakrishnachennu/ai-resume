/**
 * Plugin Registry - Plugin Management System
 * 
 * Manages plugin lifecycle, configuration, and execution.
 * Provides plugin discovery, loading, and monitoring capabilities.
 */

import { Plugin, PluginConfig, PluginMetadata, PluginStatus } from '@/lib/types/Core';
import { eventBus, EventTypes } from './EventBus';

export class PluginRegistry {
    private static instance: PluginRegistry;
    private plugins: Map<string, Plugin>;
    private pluginStatus: Map<string, PluginStatus>;

    private constructor() {
        this.plugins = new Map();
        this.pluginStatus = new Map();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): PluginRegistry {
        if (!PluginRegistry.instance) {
            PluginRegistry.instance = new PluginRegistry();
        }
        return PluginRegistry.instance;
    }

    /**
     * Register a plugin
     */
    public async registerPlugin(plugin: Plugin): Promise<void> {
        const pluginName = plugin.metadata.name;

        if (this.plugins.has(pluginName)) {
            console.warn(`[PluginRegistry] Plugin "${pluginName}" already registered. Overwriting.`);
        }

        console.log(`[PluginRegistry] Registering plugin: "${pluginName}" v${plugin.metadata.version}`);

        // Initialize plugin status
        this.pluginStatus.set(pluginName, {
            loaded: false,
            enabled: false,
            healthy: true,
            metrics: {
                totalCalls: 0,
                successfulCalls: 0,
                failedCalls: 0,
                averageExecutionTime: 0,
            },
        });

        // Check dependencies
        await this.checkDependencies(plugin);

        // Validate plugin
        if (plugin.validate) {
            const isValid = await plugin.validate();
            if (!isValid) {
                throw new Error(`Plugin "${pluginName}" validation failed`);
            }
        }

        // Call onLoad hook
        if (plugin.onLoad) {
            await plugin.onLoad();
        }

        // Register plugin
        this.plugins.set(pluginName, plugin);

        // Update status
        const status = this.pluginStatus.get(pluginName)!;
        status.loaded = true;

        // Call onInitialize hook
        if (plugin.onInitialize) {
            await plugin.onInitialize();
        }

        // Enable if configured
        if (plugin.config.enabled) {
            await this.enablePlugin(pluginName);
        }

        // Emit event
        await eventBus.emit(
            EventTypes.PLUGIN_LOADED,
            { pluginName, metadata: plugin.metadata },
            'PluginRegistry'
        );

        console.log(`[PluginRegistry] Plugin "${pluginName}" registered successfully`);
    }

    /**
     * Unregister a plugin
     */
    public async unregisterPlugin(pluginName: string): Promise<void> {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) {
            throw new Error(`Plugin "${pluginName}" not found`);
        }

        console.log(`[PluginRegistry] Unregistering plugin: "${pluginName}"`);

        // Disable first
        if (plugin.config.enabled) {
            await this.disablePlugin(pluginName);
        }

        // Call onUnload hook
        if (plugin.onUnload) {
            await plugin.onUnload();
        }

        // Remove plugin
        this.plugins.delete(pluginName);
        this.pluginStatus.delete(pluginName);

        console.log(`[PluginRegistry] Plugin "${pluginName}" unregistered`);
    }

    /**
     * Enable a plugin
     */
    public async enablePlugin(pluginName: string): Promise<void> {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) {
            throw new Error(`Plugin "${pluginName}" not found`);
        }

        if (plugin.config.enabled) {
            console.log(`[PluginRegistry] Plugin "${pluginName}" already enabled`);
            return;
        }

        console.log(`[PluginRegistry] Enabling plugin: "${pluginName}"`);

        // Call onEnable hook
        if (plugin.onEnable) {
            await plugin.onEnable();
        }

        // Update config
        plugin.config.enabled = true;

        // Update status
        const status = this.pluginStatus.get(pluginName)!;
        status.enabled = true;

        // Emit event
        await eventBus.emit(
            EventTypes.PLUGIN_ENABLED,
            { pluginName },
            'PluginRegistry'
        );

        console.log(`[PluginRegistry] Plugin "${pluginName}" enabled`);
    }

    /**
     * Disable a plugin
     */
    public async disablePlugin(pluginName: string): Promise<void> {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) {
            throw new Error(`Plugin "${pluginName}" not found`);
        }

        if (!plugin.config.enabled) {
            console.log(`[PluginRegistry] Plugin "${pluginName}" already disabled`);
            return;
        }

        console.log(`[PluginRegistry] Disabling plugin: "${pluginName}"`);

        // Call onDisable hook
        if (plugin.onDisable) {
            await plugin.onDisable();
        }

        // Update config
        plugin.config.enabled = false;

        // Update status
        const status = this.pluginStatus.get(pluginName)!;
        status.enabled = false;

        // Emit event
        await eventBus.emit(
            EventTypes.PLUGIN_DISABLED,
            { pluginName },
            'PluginRegistry'
        );

        console.log(`[PluginRegistry] Plugin "${pluginName}" disabled`);
    }

    /**
     * Execute a plugin
     */
    public async executePlugin<TInput = any, TOutput = any>(
        pluginName: string,
        context: TInput
    ): Promise<TOutput> {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) {
            throw new Error(`Plugin "${pluginName}" not found`);
        }

        if (!plugin.config.enabled) {
            throw new Error(`Plugin "${pluginName}" is disabled`);
        }

        const status = this.pluginStatus.get(pluginName)!;
        const startTime = Date.now();

        try {
            // Execute plugin
            const result = await plugin.execute(context);

            // Update metrics
            this.updateMetrics(pluginName, true, Date.now() - startTime);

            return result;
        } catch (error) {
            // Update metrics
            this.updateMetrics(pluginName, false, Date.now() - startTime);

            // Update status
            status.healthy = false;
            status.lastError = error as Error;

            // Emit error event
            await eventBus.emit(
                EventTypes.PLUGIN_ERROR,
                { pluginName, error },
                'PluginRegistry'
            );

            throw error;
        }
    }

    /**
     * Get plugin
     */
    public getPlugin(pluginName: string): Plugin | undefined {
        return this.plugins.get(pluginName);
    }

    /**
     * Get all plugins
     */
    public getAllPlugins(): Map<string, Plugin> {
        return new Map(this.plugins);
    }

    /**
     * Get plugins by category
     */
    public getPluginsByCategory(category: string): Plugin[] {
        return Array.from(this.plugins.values()).filter(
            (plugin) => plugin.metadata.category === category
        );
    }

    /**
     * Get plugin status
     */
    public async getPluginStatus(pluginName: string): Promise<PluginStatus | undefined> {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) return undefined;

        // Get status from plugin if available
        if (plugin.getStatus) {
            return await plugin.getStatus();
        }

        // Return cached status
        return this.pluginStatus.get(pluginName);
    }

    /**
     * Get all plugin statuses
     */
    public getAllPluginStatuses(): Map<string, PluginStatus> {
        return new Map(this.pluginStatus);
    }

    /**
     * Update plugin configuration
     */
    public updatePluginConfig(pluginName: string, config: Partial<PluginConfig>): void {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) {
            throw new Error(`Plugin "${pluginName}" not found`);
        }

        // Update config
        plugin.config = {
            ...plugin.config,
            ...config,
        };

        console.log(`[PluginRegistry] Updated config for plugin: "${pluginName}"`);
    }

    /**
     * Check plugin dependencies
     */
    private async checkDependencies(plugin: Plugin): Promise<void> {
        const dependencies = plugin.metadata.dependencies || [];

        for (const dependency of dependencies) {
            if (!this.plugins.has(dependency)) {
                throw new Error(
                    `Plugin "${plugin.metadata.name}" requires dependency "${dependency}" which is not loaded`
                );
            }
        }
    }

    /**
     * Update plugin metrics
     */
    private updateMetrics(pluginName: string, success: boolean, duration: number): void {
        const status = this.pluginStatus.get(pluginName);
        if (!status || !status.metrics) return;

        status.metrics.totalCalls++;
        if (success) {
            status.metrics.successfulCalls++;
        } else {
            status.metrics.failedCalls++;
        }

        // Update average execution time
        const totalTime =
            status.metrics.averageExecutionTime * (status.metrics.totalCalls - 1) + duration;
        status.metrics.averageExecutionTime = totalTime / status.metrics.totalCalls;
    }

    /**
     * Get plugin metrics
     */
    public getPluginMetrics(pluginName: string): PluginStatus['metrics'] | undefined {
        const status = this.pluginStatus.get(pluginName);
        return status?.metrics;
    }

    /**
     * Reset plugin metrics
     */
    public resetPluginMetrics(pluginName: string): void {
        const status = this.pluginStatus.get(pluginName);
        if (status && status.metrics) {
            status.metrics = {
                totalCalls: 0,
                successfulCalls: 0,
                failedCalls: 0,
                averageExecutionTime: 0,
            };
        }
    }

    /**
     * Check if plugin exists
     */
    public hasPlugin(pluginName: string): boolean {
        return this.plugins.has(pluginName);
    }

    /**
     * Get plugin count
     */
    public getPluginCount(): number {
        return this.plugins.size;
    }

    /**
     * Get enabled plugin count
     */
    public getEnabledPluginCount(): number {
        return Array.from(this.plugins.values()).filter((p) => p.config.enabled).length;
    }
}

// Export singleton instance
export const pluginRegistry = PluginRegistry.getInstance();

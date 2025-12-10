/**
 * Pipeline Manager - Core Pipeline Execution Engine
 * 
 * Manages pipeline registration, execution, monitoring, and error handling.
 * Coordinates pipeline stages and ensures proper execution flow.
 */

import {
    PipelineConfig,
    PipelineContext,
    PipelineResult,
    PipelineStage,
} from '@/lib/types/Core';
import { eventBus, EventTypes } from './EventBus';

export class PipelineManager {
    private static instance: PipelineManager;
    private pipelines: Map<string, PipelineConfig>;
    private activePipelines: Map<string, PipelineContext>;
    private pipelineMetrics: Map<string, PipelineMetrics>;

    private constructor() {
        this.pipelines = new Map();
        this.activePipelines = new Map();
        this.pipelineMetrics = new Map();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): PipelineManager {
        if (!PipelineManager.instance) {
            PipelineManager.instance = new PipelineManager();
        }
        return PipelineManager.instance;
    }

    /**
     * Register a pipeline
     */
    public registerPipeline(config: PipelineConfig): void {
        if (this.pipelines.has(config.name)) {
            console.warn(`[PipelineManager] Pipeline "${config.name}" already registered. Overwriting.`);
        }

        // Set defaults
        const pipelineConfig: PipelineConfig = {
            ...config,
            timeout: config.timeout || 30000, // 30s default
            retryAttempts: config.retryAttempts || 3,
            retryDelay: config.retryDelay || 1000, // 1s default
            rollbackOnError: config.rollbackOnError ?? true,
            enabled: config.enabled ?? true,
        };

        this.pipelines.set(config.name, pipelineConfig);

        // Initialize metrics
        this.pipelineMetrics.set(config.name, {
            totalExecutions: 0,
            successfulExecutions: 0,
            failedExecutions: 0,
            totalDuration: 0,
            averageDuration: 0,
            lastExecution: null,
        });

        console.log(`[PipelineManager] Registered pipeline: "${config.name}"`);

        // Emit event
        eventBus.emitSync(EventTypes.PIPELINE_STARTED, { pipelineName: config.name }, 'PipelineManager');
    }

    /**
     * Unregister a pipeline
     */
    public unregisterPipeline(pipelineName: string): void {
        this.pipelines.delete(pipelineName);
        this.pipelineMetrics.delete(pipelineName);
        console.log(`[PipelineManager] Unregistered pipeline: "${pipelineName}"`);
    }

    /**
     * Execute a pipeline
     */
    public async execute<TInput = any, TOutput = any>(
        pipelineName: string,
        input: TInput,
        user?: any
    ): Promise<PipelineResult<TOutput>> {
        const startTime = Date.now();
        const executionId = this.generateExecutionId(pipelineName);

        // Get pipeline config
        const pipeline = this.pipelines.get(pipelineName);
        if (!pipeline) {
            throw new Error(`Pipeline "${pipelineName}" not found`);
        }

        if (!pipeline.enabled) {
            throw new Error(`Pipeline "${pipelineName}" is disabled`);
        }

        // Create execution context
        const context: PipelineContext<TInput> = {
            executionId,
            input,
            user,
            metadata: {
                startTime,
                attempt: 1,
            },
            state: {},
        };

        // Track active pipeline
        this.activePipelines.set(executionId, context);

        console.log(`[PipelineManager] Executing pipeline: "${pipelineName}" (ID: ${executionId})`);

        // Emit start event
        await eventBus.emit(
            EventTypes.PIPELINE_STARTED,
            { pipelineName, executionId, input },
            'PipelineManager'
        );

        try {
            // Execute with retry logic
            const result = await this.executeWithRetry<TInput, TOutput>(pipeline, context);

            // Update metrics
            this.updateMetrics(pipelineName, true, Date.now() - startTime);

            // Emit completion event
            await eventBus.emit(
                EventTypes.PIPELINE_COMPLETED,
                { pipelineName, executionId, result },
                'PipelineManager'
            );

            return result as PipelineResult<TOutput>;
        } catch (error) {
            // Update metrics
            this.updateMetrics(pipelineName, false, Date.now() - startTime);

            // Emit failure event
            await eventBus.emit(
                EventTypes.PIPELINE_FAILED,
                { pipelineName, executionId, error },
                'PipelineManager'
            );

            return {
                success: false,
                error: error as Error,
                metadata: {
                    executionId,
                    duration: Date.now() - startTime,
                    stagesExecuted: this.getExecutedStages(context),
                },
            };
        } finally {
            // Clean up
            this.activePipelines.delete(executionId);
        }
    }

    /**
     * Execute pipeline with retry logic
     */
    private async executeWithRetry<TInput, TOutput>(
        pipeline: PipelineConfig,
        context: PipelineContext<TInput>
    ): Promise<PipelineResult<TOutput>> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= (pipeline.retryAttempts || 1); attempt++) {
            context.metadata.attempt = attempt;

            try {
                const result = await this.executeStages<TInput, TOutput>(pipeline, context);
                return result;
            } catch (error) {
                lastError = error as Error;
                console.error(
                    `[PipelineManager] Pipeline "${pipeline.name}" failed (attempt ${attempt}/${pipeline.retryAttempts}):`,
                    error
                );

                // Wait before retry (except on last attempt)
                if (attempt < (pipeline.retryAttempts || 1)) {
                    await this.delay(pipeline.retryDelay || 1000);
                }
            }
        }

        throw lastError || new Error('Pipeline execution failed');
    }

    /**
     * Execute all pipeline stages
     */
    private async executeStages<TInput, TOutput>(
        pipeline: PipelineConfig,
        context: PipelineContext<TInput>
    ): Promise<PipelineResult<TOutput>> {
        const executedStages: string[] = [];
        let currentData: any = context.input;

        try {
            for (const stage of pipeline.stages) {
                context.metadata.currentStage = stage.name;

                console.log(`[PipelineManager] Executing stage: "${stage.name}"`);

                // Validate stage (if validator exists)
                if (stage.validate) {
                    const isValid = await stage.validate(context);
                    if (!isValid) {
                        throw new Error(`Stage "${stage.name}" validation failed`);
                    }
                }

                // Execute stage
                const stageStartTime = Date.now();
                currentData = await this.executeStageWithTimeout(
                    stage,
                    { ...context, input: currentData },
                    pipeline.timeout || 30000
                );

                executedStages.push(stage.name);

                // Emit stage completion event
                await eventBus.emit(
                    EventTypes.PIPELINE_STAGE_COMPLETED,
                    {
                        pipelineName: pipeline.name,
                        stageName: stage.name,
                        duration: Date.now() - stageStartTime,
                    },
                    'PipelineManager'
                );

                // Cleanup stage (if cleanup exists)
                if (stage.cleanup) {
                    await stage.cleanup(context);
                }
            }

            return {
                success: true,
                data: currentData as TOutput,
                metadata: {
                    executionId: context.executionId,
                    duration: Date.now() - context.metadata.startTime,
                    stagesExecuted: executedStages,
                },
            };
        } catch (error) {
            // Handle error
            const failedStage = context.metadata.currentStage;

            // Try stage-specific error handler
            if (failedStage) {
                const stage = pipeline.stages.find((s) => s.name === failedStage);
                if (stage?.onError) {
                    await stage.onError(error as Error, context);
                }
            }

            // Rollback if configured
            if (pipeline.rollbackOnError) {
                await this.rollbackStages(executedStages, pipeline, context);
            }

            throw error;
        }
    }

    /**
     * Execute stage with timeout
     */
    private async executeStageWithTimeout<T>(
        stage: PipelineStage,
        context: PipelineContext,
        timeout: number
    ): Promise<T> {
        return Promise.race([
            stage.execute(context),
            this.createTimeoutPromise(timeout, stage.name),
        ]);
    }

    /**
     * Create timeout promise
     */
    private createTimeoutPromise(timeout: number, stageName: string): Promise<never> {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Stage "${stageName}" timed out after ${timeout}ms`));
            }, timeout);
        });
    }

    /**
     * Rollback executed stages
     */
    private async rollbackStages(
        executedStages: string[],
        pipeline: PipelineConfig,
        context: PipelineContext
    ): Promise<void> {
        console.log(`[PipelineManager] Rolling back ${executedStages.length} stages`);

        // Execute cleanup in reverse order
        for (let i = executedStages.length - 1; i >= 0; i--) {
            const stageName = executedStages[i];
            const stage = pipeline.stages.find((s) => s.name === stageName);

            if (stage?.cleanup) {
                try {
                    await stage.cleanup(context);
                    console.log(`[PipelineManager] Rolled back stage: "${stageName}"`);
                } catch (error) {
                    console.error(`[PipelineManager] Error rolling back stage "${stageName}":`, error);
                }
            }
        }
    }

    /**
     * Get executed stages from context
     */
    private getExecutedStages(context: PipelineContext): string[] {
        // This would be tracked in the context state
        return context.state.executedStages || [];
    }

    /**
     * Update pipeline metrics
     */
    private updateMetrics(pipelineName: string, success: boolean, duration: number): void {
        const metrics = this.pipelineMetrics.get(pipelineName);
        if (!metrics) return;

        metrics.totalExecutions++;
        if (success) {
            metrics.successfulExecutions++;
        } else {
            metrics.failedExecutions++;
        }
        metrics.totalDuration += duration;
        metrics.averageDuration = metrics.totalDuration / metrics.totalExecutions;
        metrics.lastExecution = Date.now();
    }

    /**
     * Get pipeline metrics
     */
    public getMetrics(pipelineName: string): PipelineMetrics | undefined {
        return this.pipelineMetrics.get(pipelineName);
    }

    /**
     * Get all pipeline metrics
     */
    public getAllMetrics(): Map<string, PipelineMetrics> {
        return new Map(this.pipelineMetrics);
    }

    /**
     * Get active pipelines
     */
    public getActivePipelines(): Map<string, PipelineContext> {
        return new Map(this.activePipelines);
    }

    /**
     * Get registered pipelines
     */
    public getRegisteredPipelines(): Map<string, PipelineConfig> {
        return new Map(this.pipelines);
    }

    /**
     * Enable/disable pipeline
     */
    public setPipelineEnabled(pipelineName: string, enabled: boolean): void {
        const pipeline = this.pipelines.get(pipelineName);
        if (pipeline) {
            pipeline.enabled = enabled;
            console.log(`[PipelineManager] Pipeline "${pipelineName}" ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    /**
     * Generate execution ID
     */
    private generateExecutionId(pipelineName: string): string {
        return `${pipelineName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Delay helper
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

// ============================================================================
// TYPES
// ============================================================================

interface PipelineMetrics {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    totalDuration: number;
    averageDuration: number;
    lastExecution: number | null;
}

// Export singleton instance
export const pipelineManager = PipelineManager.getInstance();

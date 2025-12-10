/**
 * V2 Pipelines - Main Export
 * 
 * Import all pipelines from here for easy access.
 */

// Pipelines
export { apiKeyPipeline, updateApiKey } from './ApiKeyPipeline';
export { profilePipeline, updateProfile } from './ProfilePipeline';
export { resumePipeline, generateResume } from './ResumePipeline';
export { authPipeline, authenticateUser } from './AuthPipeline';

// Re-export types for convenience
export type { PipelineConfig, PipelineStage, PipelineContext, PipelineResult } from '@/lib/types/Core';

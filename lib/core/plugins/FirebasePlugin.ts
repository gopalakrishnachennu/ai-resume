/**
 * Firebase Plugin
 * 
 * Manages Firestore operations with error handling and retry logic.
 * Provides a clean interface for database operations.
 */

import { Plugin, PluginConfig, PluginMetadata, PluginStatus } from '@/lib/types/Core';
import { db } from '@/lib/firebase';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs,
    DocumentData,
} from 'firebase/firestore';

export class FirebasePlugin implements Plugin {
    metadata: PluginMetadata = {
        name: 'firebase-plugin',
        version: '1.0.0',
        description: 'Manages Firestore database operations',
        author: 'AI Resume Builder',
        category: 'storage',
        tags: ['firebase', 'firestore', 'database', 'storage'],
    };

    config: PluginConfig = {
        enabled: true,
        settings: {
            retryAttempts: 3,
            retryDelay: 1000,
            timeout: 10000,
        },
    };

    private metrics = {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        totalExecutionTime: 0,
    };

    /**
     * Load hook
     */
    async onLoad() {
        console.log('[FirebasePlugin] Loading...');
    }

    /**
     * Initialize hook
     */
    async onInitialize() {
        console.log('[FirebasePlugin] Initializing...');

        // Test connection
        try {
            await this.testConnection();
            console.log('[FirebasePlugin] Connection test successful');
        } catch (error) {
            console.error('[FirebasePlugin] Connection test failed:', error);
            this.config.enabled = false;
        }
    }

    /**
     * Enable hook
     */
    async onEnable() {
        console.log('[FirebasePlugin] Enabled');
    }

    /**
     * Disable hook
     */
    async onDisable() {
        console.log('[FirebasePlugin] Disabled');
    }

    /**
     * Unload hook
     */
    async onUnload() {
        console.log('[FirebasePlugin] Unloading...');
    }

    /**
     * Execute plugin functionality
     */
    async execute(context: FirebaseContext): Promise<any> {
        const startTime = Date.now();
        this.metrics.totalCalls++;

        try {
            const { action, collection: collectionName, docId, data, queryParams } = context;

            let result;
            switch (action) {
                case 'get':
                    result = await this.getDocument(collectionName, docId!);
                    break;
                case 'set':
                    result = await this.setDocument(collectionName, docId!, data!);
                    break;
                case 'update':
                    result = await this.updateDocument(collectionName, docId!, data!);
                    break;
                case 'delete':
                    result = await this.deleteDocument(collectionName, docId!);
                    break;
                case 'query':
                    result = await this.queryDocuments(collectionName, queryParams!);
                    break;
                default:
                    throw new Error(`Unknown action: ${action}`);
            }

            this.metrics.successfulCalls++;
            this.metrics.totalExecutionTime += Date.now() - startTime;

            return result;
        } catch (error) {
            this.metrics.failedCalls++;
            this.metrics.totalExecutionTime += Date.now() - startTime;
            throw error;
        }
    }

    /**
     * Validate plugin
     */
    async validate(): Promise<boolean> {
        try {
            await this.testConnection();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get plugin status
     */
    async getStatus(): Promise<PluginStatus> {
        const averageExecutionTime = this.metrics.totalCalls > 0
            ? this.metrics.totalExecutionTime / this.metrics.totalCalls
            : 0;

        const healthy = await this.validate();

        return {
            loaded: true,
            enabled: this.config.enabled,
            healthy,
            metrics: {
                totalCalls: this.metrics.totalCalls,
                successfulCalls: this.metrics.successfulCalls,
                failedCalls: this.metrics.failedCalls,
                averageExecutionTime,
            },
        };
    }

    // ========================================================================
    // FIRESTORE OPERATIONS
    // ========================================================================

    /**
     * Get a document
     */
    private async getDocument(collectionName: string, docId: string): Promise<DocumentData | null> {
        try {
            const docRef = doc(db, collectionName, docId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return {
                    id: docSnap.id,
                    ...docSnap.data(),
                };
            }

            return null;
        } catch (error) {
            console.error('[FirebasePlugin] Get document error:', error);
            throw error;
        }
    }

    /**
     * Set a document (create or overwrite)
     */
    private async setDocument(
        collectionName: string,
        docId: string,
        data: DocumentData,
        merge: boolean = true
    ): Promise<boolean> {
        try {
            const docRef = doc(db, collectionName, docId);
            await setDoc(docRef, data, { merge });
            return true;
        } catch (error) {
            console.error('[FirebasePlugin] Set document error:', error);
            throw error;
        }
    }

    /**
     * Update a document
     */
    private async updateDocument(
        collectionName: string,
        docId: string,
        data: DocumentData
    ): Promise<boolean> {
        try {
            const docRef = doc(db, collectionName, docId);
            await updateDoc(docRef, data);
            return true;
        } catch (error) {
            console.error('[FirebasePlugin] Update document error:', error);
            throw error;
        }
    }

    /**
     * Delete a document
     */
    private async deleteDocument(collectionName: string, docId: string): Promise<boolean> {
        try {
            const docRef = doc(db, collectionName, docId);
            await deleteDoc(docRef);
            return true;
        } catch (error) {
            console.error('[FirebasePlugin] Delete document error:', error);
            throw error;
        }
    }

    /**
     * Query documents
     */
    private async queryDocuments(
        collectionName: string,
        queryParams: QueryParams
    ): Promise<DocumentData[]> {
        try {
            const collectionRef = collection(db, collectionName);

            // Build query
            let q = query(collectionRef);

            if (queryParams.where) {
                for (const condition of queryParams.where) {
                    q = query(q, where(condition.field, condition.operator, condition.value));
                }
            }

            const querySnapshot = await getDocs(q);

            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
        } catch (error) {
            console.error('[FirebasePlugin] Query documents error:', error);
            throw error;
        }
    }

    /**
     * Test Firebase connection
     */
    private async testConnection(): Promise<boolean> {
        try {
            // Try to read a test document
            const testRef = doc(db, '_test_', 'connection');
            await getDoc(testRef);
            return true;
        } catch (error) {
            console.error('[FirebasePlugin] Connection test failed:', error);
            return false;
        }
    }
}

// ============================================================================
// TYPES
// ============================================================================

interface FirebaseContext {
    action: 'get' | 'set' | 'update' | 'delete' | 'query';
    collection: string;
    docId?: string;
    data?: DocumentData;
    queryParams?: QueryParams;
}

interface QueryParams {
    where?: Array<{
        field: string;
        operator: any;
        value: any;
    }>;
    orderBy?: {
        field: string;
        direction: 'asc' | 'desc';
    };
    limit?: number;
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const firebasePlugin = new FirebasePlugin();

'use strict';

import { db } from '@/lib/firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
} from 'firebase/firestore';
import {
    TemplateSchema,
    DEFAULT_ATS_TEMPLATE,
    DEFAULT_MODERN_TEMPLATE,
    validateTemplate,
} from '@/lib/types/templateSchema';

const COLLECTION = 'templates';

/**
 * Template Service
 * Manages resume templates created by admins for users.
 */
export class TemplateService {
    /**
     * Get all published templates (for users)
     */
    static async getPublishedTemplates(): Promise<TemplateSchema[]> {
        try {
            const q = query(
                collection(db, COLLECTION),
                where('isPublished', '==', true),
                orderBy('name')
            );
            const snapshot = await getDocs(q);
            const templates = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
            })) as TemplateSchema[];

            // Always include built-in defaults if not in Firestore
            const hasAts = templates.some(t => t.id === 'ats-default');
            const hasModern = templates.some(t => t.id === 'modern-default');

            if (!hasAts) templates.unshift(DEFAULT_ATS_TEMPLATE);
            if (!hasModern) templates.splice(1, 0, DEFAULT_MODERN_TEMPLATE);

            return templates;
        } catch (error) {
            console.error('[TemplateService] Error fetching templates:', error);
            // Return defaults on error
            return [DEFAULT_ATS_TEMPLATE, DEFAULT_MODERN_TEMPLATE];
        }
    }

    /**
     * Get all templates (for admin - includes unpublished)
     */
    static async getAllTemplates(): Promise<TemplateSchema[]> {
        try {
            const q = query(collection(db, COLLECTION), orderBy('name'));
            const snapshot = await getDocs(q);
            const templates = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
            })) as TemplateSchema[];

            // Include defaults
            const hasAts = templates.some(t => t.id === 'ats-default');
            const hasModern = templates.some(t => t.id === 'modern-default');

            if (!hasAts) templates.unshift({ ...DEFAULT_ATS_TEMPLATE });
            if (!hasModern) templates.splice(1, 0, { ...DEFAULT_MODERN_TEMPLATE });

            return templates;
        } catch (error) {
            console.error('[TemplateService] Error fetching all templates:', error);
            return [DEFAULT_ATS_TEMPLATE, DEFAULT_MODERN_TEMPLATE];
        }
    }

    /**
     * Get a single template by ID
     */
    static async getTemplateById(id: string): Promise<TemplateSchema | null> {
        // Check built-in defaults first
        if (id === 'ats-default') return { ...DEFAULT_ATS_TEMPLATE };
        if (id === 'modern-default') return { ...DEFAULT_MODERN_TEMPLATE };

        try {
            const docSnap = await getDoc(doc(db, COLLECTION, id));
            if (!docSnap.exists()) return null;
            return { ...docSnap.data(), id: docSnap.id } as TemplateSchema;
        } catch (error) {
            console.error('[TemplateService] Error fetching template:', error);
            return null;
        }
    }

    /**
     * Create a new template (admin only)
     */
    static async createTemplate(
        template: Omit<TemplateSchema, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
        createdBy: string
    ): Promise<string> {
        // Validate
        const errors = validateTemplate(template as Partial<TemplateSchema>);
        if (errors.length > 0) {
            throw new Error(`Template validation failed: ${errors.join(', ')}`);
        }

        const id = `template_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const now = Timestamp.now();

        const fullTemplate: TemplateSchema = {
            ...template,
            id,
            createdBy,
            createdAt: now.toDate(),
            updatedAt: now.toDate(),
            version: 1,
        };

        await setDoc(doc(db, COLLECTION, id), {
            ...fullTemplate,
            createdAt: now,
            updatedAt: now,
        });

        console.log(`[TemplateService] Created template: ${id}`);
        return id;
    }

    /**
     * Update an existing template (admin only)
     * Creates a new version if published
     */
    static async updateTemplate(
        id: string,
        updates: Partial<TemplateSchema>,
        bumpVersion: boolean = false
    ): Promise<void> {
        // Don't allow updating built-in defaults directly
        if (id === 'ats-default' || id === 'modern-default') {
            throw new Error('Cannot modify built-in templates. Clone them first.');
        }

        const existing = await this.getTemplateById(id);
        if (!existing) {
            throw new Error(`Template ${id} not found`);
        }

        const updateData: any = {
            ...updates,
            updatedAt: Timestamp.now(),
        };

        if (bumpVersion) {
            updateData.version = (existing.version || 1) + 1;
        }

        await updateDoc(doc(db, COLLECTION, id), updateData);
        console.log(`[TemplateService] Updated template: ${id}`);
    }

    /**
     * Delete a template (admin only)
     */
    static async deleteTemplate(id: string): Promise<void> {
        if (id === 'ats-default' || id === 'modern-default') {
            throw new Error('Cannot delete built-in templates');
        }

        await deleteDoc(doc(db, COLLECTION, id));
        console.log(`[TemplateService] Deleted template: ${id}`);
    }

    /**
     * Clone a template (creates a copy for customization)
     */
    static async cloneTemplate(
        sourceId: string,
        newName: string,
        createdBy: string
    ): Promise<string> {
        const source = await this.getTemplateById(sourceId);
        if (!source) {
            throw new Error(`Source template ${sourceId} not found`);
        }

        const cloned = {
            ...source,
            name: newName,
            description: `Cloned from ${source.name}`,
            isPublished: false,
            createdBy,
        };

        // Remove id, dates, version - they'll be set fresh
        delete (cloned as any).id;
        delete (cloned as any).createdAt;
        delete (cloned as any).updatedAt;
        delete (cloned as any).version;

        return this.createTemplate(cloned, createdBy);
    }

    /**
     * Publish a template (make it available to users)
     */
    static async publishTemplate(id: string): Promise<void> {
        await this.updateTemplate(id, { isPublished: true }, true);
        console.log(`[TemplateService] Published template: ${id}`);
    }

    /**
     * Unpublish a template (hide from users)
     */
    static async unpublishTemplate(id: string): Promise<void> {
        await this.updateTemplate(id, { isPublished: false });
        console.log(`[TemplateService] Unpublished template: ${id}`);
    }

    /**
     * Get user's selected template preference
     */
    static async getUserTemplatePreference(userId: string): Promise<string> {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                return userDoc.data().selectedTemplateId || 'ats-default';
            }
            return 'ats-default';
        } catch (error) {
            console.error('[TemplateService] Error fetching user preference:', error);
            return 'ats-default';
        }
    }

    /**
     * Set user's selected template preference
     */
    static async setUserTemplatePreference(userId: string, templateId: string): Promise<void> {
        try {
            await updateDoc(doc(db, 'users', userId), {
                selectedTemplateId: templateId,
            });
            console.log(`[TemplateService] Set template preference for ${userId}: ${templateId}`);
        } catch (error) {
            // If user doc doesn't exist, create it
            await setDoc(doc(db, 'users', userId), { selectedTemplateId: templateId }, { merge: true });
        }
    }

    /**
     * Initialize default templates in Firestore (run once on app setup)
     */
    static async initializeDefaults(): Promise<void> {
        const atsExists = await getDoc(doc(db, COLLECTION, 'ats-default'));
        if (!atsExists.exists()) {
            await setDoc(doc(db, COLLECTION, 'ats-default'), {
                ...DEFAULT_ATS_TEMPLATE,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            });
            console.log('[TemplateService] Initialized ATS default template');
        }

        const modernExists = await getDoc(doc(db, COLLECTION, 'modern-default'));
        if (!modernExists.exists()) {
            await setDoc(doc(db, COLLECTION, 'modern-default'), {
                ...DEFAULT_MODERN_TEMPLATE,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            });
            console.log('[TemplateService] Initialized Modern default template');
        }
    }
}

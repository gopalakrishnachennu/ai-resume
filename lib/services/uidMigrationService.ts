/**
 * UID Migration Service
 * 
 * Handles UID consistency across browser reinstalls.
 * Firebase Auth can generate different UIDs for the same user after reinstall.
 * This service ensures user data persists by linking UIDs via email.
 */

import { db } from '@/lib/firebase';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    writeBatch,
    serverTimestamp,
} from 'firebase/firestore';
import { User } from 'firebase/auth';

// ============================================================================
// TYPES
// ============================================================================

interface UidMapping {
    email: string;
    currentUid: string;
    previousUids: string[];
    createdAt: any;
    updatedAt: any;
}

// ============================================================================
// UID MIGRATION SERVICE
// ============================================================================

export class UidMigrationService {
    /**
     * Check if user's UID has changed and migrate data if needed.
     * This should be called during every login.
     * 
     * @param user - The authenticated Firebase user
     * @returns Object with migration status
     */
    static async checkAndMigrateUser(user: User): Promise<{
        migrated: boolean;
        previousUid?: string;
        collectionsUpdated?: string[];
    }> {
        if (!user.email) {
            console.log('[UidMigration] User has no email, skipping migration check');
            return { migrated: false };
        }

        const email = user.email.toLowerCase();
        const currentUid = user.uid;

        try {
            // Step 1: Check if we have a UID mapping for this email
            const mappingRef = doc(db, 'uidMappings', email.replace(/\./g, '_'));
            const mappingDoc = await getDoc(mappingRef);

            if (!mappingDoc.exists()) {
                // First time seeing this email - create mapping
                console.log('[UidMigration] First login for email, creating mapping');
                await setDoc(mappingRef, {
                    email,
                    currentUid,
                    previousUids: [],
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                return { migrated: false };
            }

            const mapping = mappingDoc.data() as UidMapping;

            // Step 2: Check if UID is the same
            if (mapping.currentUid === currentUid) {
                console.log('[UidMigration] UID unchanged, no migration needed');
                return { migrated: false };
            }

            // Step 3: UID has changed! Migrate data from old UID to new UID
            console.log(`[UidMigration] UID changed from ${mapping.currentUid} to ${currentUid}`);
            const previousUid = mapping.currentUid;

            // Update the mapping first
            await updateDoc(mappingRef, {
                currentUid,
                previousUids: [...mapping.previousUids, previousUid],
                updatedAt: serverTimestamp(),
            });

            // Migrate data from all collections
            const collectionsUpdated = await this.migrateUserData(previousUid, currentUid);

            console.log(`[UidMigration] Migration complete. Collections updated: ${collectionsUpdated.join(', ')}`);

            return {
                migrated: true,
                previousUid,
                collectionsUpdated,
            };

        } catch (error) {
            console.error('[UidMigration] Migration check failed:', error);
            // Don't throw - allow login to continue
            return { migrated: false };
        }
    }

    /**
     * Migrate user data from old UID to new UID across all collections.
     */
    private static async migrateUserData(oldUid: string, newUid: string): Promise<string[]> {
        const collectionsToMigrate = [
            { name: 'resumes', field: 'userId' },
            { name: 'applications', field: 'userId' },
            { name: 'jobs', field: 'userId' },
        ];

        const updatedCollections: string[] = [];

        for (const { name, field } of collectionsToMigrate) {
            try {
                const updated = await this.migrateCollection(name, field, oldUid, newUid);
                if (updated > 0) {
                    updatedCollections.push(`${name}(${updated})`);
                }
            } catch (error) {
                console.error(`[UidMigration] Failed to migrate ${name}:`, error);
            }
        }

        // Migrate user document (special case - copy data, don't just update userId)
        try {
            await this.migrateUserDocument(oldUid, newUid);
            updatedCollections.push('users');
        } catch (error) {
            console.error('[UidMigration] Failed to migrate user document:', error);
        }

        // Migrate subcollections under users/
        const subcollections = ['appliedJobs', 'sessions', 'settings', 'prompts'];
        for (const subcol of subcollections) {
            try {
                const updated = await this.migrateUserSubcollection(oldUid, newUid, subcol);
                if (updated > 0) {
                    updatedCollections.push(`users/${subcol}(${updated})`);
                }
            } catch (error) {
                console.error(`[UidMigration] Failed to migrate users/${subcol}:`, error);
            }
        }

        return updatedCollections;
    }

    /**
     * Migrate a collection by updating userId field.
     */
    private static async migrateCollection(
        collectionName: string,
        userIdField: string,
        oldUid: string,
        newUid: string
    ): Promise<number> {
        const q = query(
            collection(db, collectionName),
            where(userIdField, '==', oldUid)
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) return 0;

        const batch = writeBatch(db);
        let count = 0;

        snapshot.docs.forEach((docSnap) => {
            batch.update(doc(db, collectionName, docSnap.id), {
                [userIdField]: newUid,
                _migratedFrom: oldUid,
                _migratedAt: serverTimestamp(),
            });
            count++;
        });

        await batch.commit();
        console.log(`[UidMigration] Migrated ${count} documents in ${collectionName}`);
        return count;
    }

    /**
     * Migrate user document by copying data from old to new.
     */
    private static async migrateUserDocument(oldUid: string, newUid: string): Promise<void> {
        const oldUserRef = doc(db, 'users', oldUid);
        const newUserRef = doc(db, 'users', newUid);

        const oldUserDoc = await getDoc(oldUserRef);
        if (!oldUserDoc.exists()) {
            console.log('[UidMigration] No old user document to migrate');
            return;
        }

        const newUserDoc = await getDoc(newUserRef);
        const oldData = oldUserDoc.data();

        if (newUserDoc.exists()) {
            // Merge old data into new, preserving new uid
            const newData = newUserDoc.data();
            await updateDoc(newUserRef, {
                // Merge profile data only if new doesn't have it
                profile: newData.profile || oldData.profile,
                baseExperience: newData.baseExperience || oldData.baseExperience,
                baseEducation: newData.baseEducation || oldData.baseEducation,
                baseSummary: newData.baseSummary || oldData.baseSummary,
                skills: newData.skills || oldData.skills,
                settings: { ...oldData.settings, ...newData.settings },
                subscription: newData.subscription || oldData.subscription,
                usage: newData.usage || oldData.usage,
                _migratedFrom: oldUid,
                _migratedAt: serverTimestamp(),
            });
        } else {
            // Create new user doc with old data but new uid
            await setDoc(newUserRef, {
                ...oldData,
                uid: newUid,
                _migratedFrom: oldUid,
                _migratedAt: serverTimestamp(),
            });
        }

        console.log('[UidMigration] User document migrated');
    }

    /**
     * Migrate a subcollection under users/.
     */
    private static async migrateUserSubcollection(
        oldUid: string,
        newUid: string,
        subcollectionName: string
    ): Promise<number> {
        const oldSubcolRef = collection(db, 'users', oldUid, subcollectionName);
        const snapshot = await getDocs(oldSubcolRef);

        if (snapshot.empty) return 0;

        const batch = writeBatch(db);
        let count = 0;

        for (const docSnap of snapshot.docs) {
            const newDocRef = doc(db, 'users', newUid, subcollectionName, docSnap.id);

            // Check if already exists in new location
            const existingDoc = await getDoc(newDocRef);
            if (!existingDoc.exists()) {
                batch.set(newDocRef, {
                    ...docSnap.data(),
                    _migratedFrom: oldUid,
                    _migratedAt: serverTimestamp(),
                });
                count++;
            }
        }

        if (count > 0) {
            await batch.commit();
        }

        console.log(`[UidMigration] Migrated ${count} documents in users/${subcollectionName}`);
        return count;
    }

    /**
     * Get the current UID for an email (for debugging/admin purposes).
     */
    static async getCurrentUidForEmail(email: string): Promise<string | null> {
        try {
            const mappingRef = doc(db, 'uidMappings', email.toLowerCase().replace(/\./g, '_'));
            const mappingDoc = await getDoc(mappingRef);

            if (mappingDoc.exists()) {
                return (mappingDoc.data() as UidMapping).currentUid;
            }
            return null;
        } catch (error) {
            console.error('[UidMigration] Failed to get UID for email:', error);
            return null;
        }
    }

    /**
     * Get all UIDs ever associated with an email.
     */
    static async getAllUidsForEmail(email: string): Promise<string[]> {
        try {
            const mappingRef = doc(db, 'uidMappings', email.toLowerCase().replace(/\./g, '_'));
            const mappingDoc = await getDoc(mappingRef);

            if (mappingDoc.exists()) {
                const mapping = mappingDoc.data() as UidMapping;
                return [mapping.currentUid, ...mapping.previousUids];
            }
            return [];
        } catch (error) {
            console.error('[UidMigration] Failed to get all UIDs for email:', error);
            return [];
        }
    }
}

export default UidMigrationService;

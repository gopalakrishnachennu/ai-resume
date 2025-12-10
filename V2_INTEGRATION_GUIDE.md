# 🎯 V2 PIPELINE & PLUGIN INTEGRATION GUIDE

## ✅ **WHAT'S IMPLEMENTED:**

### **1. API Key Pipeline** ✅
**File:** `lib/core/pipelines/ApiKeyPipeline.ts`

**Features:**
- ✅ Input validation
- ✅ Firebase save
- ✅ Cache update (with bug fix)
- ✅ Toast notifications
- ✅ Automatic retry (3 attempts)
- ✅ Rollback on error
- ✅ Event emission

### **2. Cache Plugin** ✅
**File:** `lib/core/plugins/CachePlugin.ts`

**Features:**
- ✅ Get/Set/Delete operations
- ✅ TTL (Time To Live) support
- ✅ Automatic cleanup
- ✅ Metrics tracking
- ✅ Lifecycle hooks

---

## 🔧 **HOW TO USE:**

### **Option 1: Use Pipeline Directly (Recommended)**

```typescript
// In your component (e.g., ApiKeySetup.tsx)
import { pipelineManager } from '@/lib/core';
import { apiKeyPipeline } from '@/lib/core/pipelines/ApiKeyPipeline';

// Register pipeline (do this once, maybe in _app.tsx or layout.tsx)
pipelineManager.registerPipeline(apiKeyPipeline);

// Use in your component
const handleSave = async () => {
    const result = await pipelineManager.execute(
        'api-key-update',
        { apiKey, provider },
        user
    );

    if (result.success) {
        // Success! Toast already shown by pipeline
        onComplete();
    } else {
        // Error! Toast already shown by pipeline
        console.error('Failed:', result.error);
    }
};
```

### **Option 2: Use Helper Function (Easier Migration)**

```typescript
// In your component
import { updateApiKey } from '@/lib/core/pipelines/ApiKeyPipeline';

const handleSave = async () => {
    const success = await updateApiKey(apiKey, provider, user);
    
    if (success) {
        onComplete();
    }
};
```

---

## 📊 **MIGRATION STRATEGY:**

### **Phase 1: Add V2 Alongside V1 (Current)**
```typescript
// Keep old code working
const handleSaveOld = async () => {
    await setDoc(doc(db, 'users', user.uid), { llmConfig });
    GuestCacheService.saveApiKey(provider, apiKey);
    toast.success('Saved!');
};

// Add new V2 code as alternative
const handleSaveV2 = async () => {
    await updateApiKey(apiKey, provider, user);
};

// Use V2 if available, fallback to V1
const handleSave = async () => {
    try {
        await handleSaveV2();
    } catch (error) {
        console.warn('V2 failed, using V1:', error);
        await handleSaveOld();
    }
};
```

### **Phase 2: Gradually Replace V1 with V2**
```typescript
// Replace old code with V2
const handleSave = async () => {
    await updateApiKey(apiKey, provider, user);
};
```

### **Phase 3: Remove V1 Code**
```typescript
// Only V2 remains
const handleSave = async () => {
    const result = await pipelineManager.execute(
        'api-key-update',
        { apiKey, provider },
        user
    );
};
```

---

## 🎯 **INTEGRATION POINTS:**

### **1. Update ApiKeySetup Component**

**File:** `components/ApiKeySetup.tsx`

**Current code (V1):**
```typescript
const handleSave = async () => {
    // ... validation ...
    
    await setDoc(doc(db, 'users', user.uid), { llmConfig }, { merge: true });
    
    if (user.isAnonymous) {
        GuestCacheService.saveApiKey(provider, apiKey.trim());
    }
    
    toast.success('API key saved successfully! 🎉');
    onComplete();
};
```

**New code (V2):**
```typescript
import { updateApiKey } from '@/lib/core/pipelines/ApiKeyPipeline';

const handleSave = async () => {
    const success = await updateApiKey(apiKey, provider, user);
    if (success) {
        onComplete();
    }
};
```

**Benefits:**
- ✅ Automatic validation
- ✅ Automatic retry
- ✅ Automatic rollback
- ✅ Automatic toast
- ✅ Automatic events
- ✅ Automatic metrics

---

### **2. Initialize V2 System**

**File:** `app/layout.tsx` or `app/providers.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { coreEngine } from '@/lib/core';
import { apiKeyPipeline } from '@/lib/core/pipelines/ApiKeyPipeline';
import { cachePlugin } from '@/lib/core/plugins/CachePlugin';

export function V2Provider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Initialize V2 system
        const initV2 = async () => {
            // Initialize core engine
            await coreEngine.initialize({
                debug: process.env.NODE_ENV === 'development',
                collectMetrics: true,
            });

            // Register plugins
            const { pluginRegistry } = await import('@/lib/core');
            await pluginRegistry.registerPlugin(cachePlugin);

            // Register pipelines
            const { pipelineManager } = await import('@/lib/core');
            pipelineManager.registerPipeline(apiKeyPipeline);

            console.log('✅ V2 System initialized');
        };

        initV2().catch(console.error);
    }, []);

    return <>{children}</>;
}
```

---

## 📈 **MONITORING:**

### **Check Pipeline Status:**
```typescript
import { pipelineManager } from '@/lib/core';

// Get metrics
const metrics = pipelineManager.getMetrics('api-key-update');
console.log('Pipeline metrics:', metrics);
// {
//   totalExecutions: 10,
//   successfulExecutions: 9,
//   failedExecutions: 1,
//   averageDuration: 250
// }
```

### **Check Plugin Status:**
```typescript
import { pluginRegistry } from '@/lib/core';

// Get status
const status = await pluginRegistry.getPluginStatus('cache-plugin');
console.log('Plugin status:', status);
// {
//   loaded: true,
//   enabled: true,
//   healthy: true,
//   metrics: { ... }
// }
```

### **Check System Health:**
```typescript
import { coreEngine } from '@/lib/core';

// Get system status
const status = await coreEngine.getStatus();
console.log('System status:', status);
// {
//   running: true,
//   activePipelines: 0,
//   loadedPlugins: 1,
//   health: 'healthy'
// }
```

---

## 🚀 **NEXT STEPS:**

### **Immediate (This Session):**
1. ✅ API Key Pipeline - DONE
2. ✅ Cache Plugin - DONE
3. ⏳ Test build
4. ⏳ Update ApiKeySetup to use V2
5. ⏳ Test in browser

### **Short-term (This Week):**
1. Profile Pipeline
2. Resume Generation Pipeline
3. Firebase Plugin
4. AI Provider Plugins

### **Long-term (2-3 Weeks):**
1. All pipelines implemented
2. All plugins implemented
3. Admin panel UI
4. Complete V1 to V2 migration

---

## ✅ **BENEFITS YOU GET NOW:**

### **With API Key Pipeline:**
- ✅ Automatic toast notifications
- ✅ Proper error handling
- ✅ Automatic retry on failure
- ✅ Cache bug fixed
- ✅ Event emission
- ✅ Metrics tracking

### **With Cache Plugin:**
- ✅ TTL support
- ✅ Automatic cleanup
- ✅ Better error handling
- ✅ Metrics tracking

---

**Status:** ✅ First pipeline and plugin complete!
**Next:** Test and integrate into existing code

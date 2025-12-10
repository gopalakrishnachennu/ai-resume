# 🎯 V2 CORE ENGINE - USAGE EXAMPLES

This document shows how to use the V2 Core Engine in your application.

---

## 📦 **BASIC SETUP**

### **1. Initialize the Core Engine**

```typescript
import { coreEngine } from '@/lib/core';

// Initialize with default config
await coreEngine.initialize();

// Or with custom config
await coreEngine.initialize({
    maxConcurrentPipelines: 10,
    globalTimeout: 60000,
    debug: true,
    collectMetrics: true,
});
```

---

## 🔄 **WORKING WITH PIPELINES**

### **2. Create a Pipeline**

```typescript
import { pipelineManager, PipelineConfig, PipelineStage } from '@/lib/core';

// Define pipeline stages
const validateInputStage: PipelineStage = {
    name: 'validate-input',
    description: 'Validate user input',
    
    execute: async (context) => {
        const { apiKey, provider } = context.input;
        
        if (!apiKey || !provider) {
            throw new Error('Missing required fields');
        }
        
        return { ...context.input, validated: true };
    },
    
    validate: async (context) => {
        return !!context.input.apiKey;
    },
    
    onError: async (error, context) => {
        console.error('Validation failed:', error);
    },
};

const saveToFirebaseStage: PipelineStage = {
    name: 'save-to-firebase',
    description: 'Save data to Firebase',
    
    execute: async (context) => {
        const { user } = context;
        const data = context.input;
        
        // Save to Firebase
        await setDoc(doc(db, 'users', user.uid), data);
        
        return { success: true, data };
    },
};

const updateCacheStage: PipelineStage = {
    name: 'update-cache',
    description: 'Update localStorage cache',
    
    execute: async (context) => {
        const data = context.input;
        
        // Update cache
        localStorage.setItem('cached_data', JSON.stringify(data));
        
        return data;
    },
    
    cleanup: async (context) => {
        // Cleanup if needed
        console.log('Cache stage cleanup');
    },
};

// Register the pipeline
const apiKeyPipeline: PipelineConfig = {
    name: 'api-key-update',
    description: 'Update API key with validation and caching',
    stages: [
        validateInputStage,
        saveToFirebaseStage,
        updateCacheStage,
    ],
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000,
    rollbackOnError: true,
    enabled: true,
};

pipelineManager.registerPipeline(apiKeyPipeline);
```

### **3. Execute a Pipeline**

```typescript
// Execute the pipeline
const result = await pipelineManager.execute(
    'api-key-update',
    {
        apiKey: 'sk-xxx',
        provider: 'openai',
    },
    user // Optional user context
);

if (result.success) {
    console.log('Pipeline executed successfully:', result.data);
} else {
    console.error('Pipeline failed:', result.error);
}
```

---

## 🔌 **WORKING WITH PLUGINS**

### **4. Create a Plugin**

```typescript
import { Plugin, PluginConfig, PluginMetadata } from '@/lib/core';

class CachePlugin implements Plugin {
    metadata: PluginMetadata = {
        name: 'cache-plugin',
        version: '1.0.0',
        description: 'Manages localStorage caching',
        author: 'Your Name',
        category: 'storage',
    };

    config: PluginConfig = {
        enabled: true,
        settings: {
            maxCacheSize: 100 * 1024 * 1024, // 100MB
            ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
        },
    };

    async onLoad() {
        console.log('[CachePlugin] Loading...');
    }

    async onInitialize() {
        console.log('[CachePlugin] Initializing...');
        // Setup cache
    }

    async onEnable() {
        console.log('[CachePlugin] Enabled');
    }

    async onDisable() {
        console.log('[CachePlugin] Disabled');
    }

    async execute(context: any) {
        const { action, key, value } = context;

        switch (action) {
            case 'get':
                return this.get(key);
            case 'set':
                return this.set(key, value);
            case 'delete':
                return this.delete(key);
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    private get(key: string): any {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    }

    private set(key: string, value: any): void {
        localStorage.setItem(key, JSON.stringify(value));
    }

    private delete(key: string): void {
        localStorage.removeItem(key);
    }

    async validate() {
        // Check if localStorage is available
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
        } catch {
            return false;
        }
    }

    async getStatus() {
        return {
            loaded: true,
            enabled: this.config.enabled,
            healthy: true,
            metrics: {
                totalCalls: 0,
                successfulCalls: 0,
                failedCalls: 0,
                averageExecutionTime: 0,
            },
        };
    }
}
```

### **5. Register and Use a Plugin**

```typescript
import { pluginRegistry } from '@/lib/core';

// Register the plugin
const cachePlugin = new CachePlugin();
await pluginRegistry.registerPlugin(cachePlugin);

// Execute the plugin
const cachedData = await pluginRegistry.executePlugin('cache-plugin', {
    action: 'get',
    key: 'api_key',
});

// Enable/disable plugin
await pluginRegistry.disablePlugin('cache-plugin');
await pluginRegistry.enablePlugin('cache-plugin');

// Get plugin status
const status = await pluginRegistry.getPluginStatus('cache-plugin');
console.log('Plugin status:', status);
```

---

## 📡 **WORKING WITH EVENTS**

### **6. Subscribe to Events**

```typescript
import { eventBus, EventTypes } from '@/lib/core';

// Subscribe to API key updates
const subscription = eventBus.subscribe(
    EventTypes.API_KEY_UPDATED,
    async (event) => {
        console.log('API key updated:', event.payload);
        
        // Update UI
        toast.success('API key updated successfully!');
        
        // Clear cache
        localStorage.removeItem('old_api_key');
    }
);

// Subscribe to pipeline events
eventBus.subscribe(
    EventTypes.PIPELINE_COMPLETED,
    async (event) => {
        const { pipelineName, result } = event.payload;
        console.log(`Pipeline "${pipelineName}" completed:`, result);
    }
);

// Subscribe to errors
eventBus.subscribe(
    EventTypes.SYSTEM_ERROR,
    async (event) => {
        console.error('System error:', event.payload);
        // Send to error tracking service
    }
);

// Unsubscribe when done
subscription.unsubscribe();
```

### **7. Emit Events**

```typescript
import { eventBus, EventTypes } from '@/lib/core';

// Emit an event
await eventBus.emit(
    EventTypes.API_KEY_UPDATED,
    {
        provider: 'openai',
        keyLength: 32,
        timestamp: Date.now(),
    },
    'ApiKeySetup'
);

// Emit synchronously (fire and forget)
eventBus.emitSync(
    EventTypes.CACHE_UPDATED,
    { key: 'api_key', size: 1024 },
    'CachePlugin'
);
```

---

## 📊 **MONITORING & METRICS**

### **8. Get System Status**

```typescript
import { coreEngine } from '@/lib/core';

// Get engine status
const status = await coreEngine.getStatus();
console.log('Engine status:', status);
// {
//   running: true,
//   activePipelines: 2,
//   loadedPlugins: 5,
//   activeSubscriptions: 10,
//   health: 'healthy'
// }

// Get system metrics
const metrics = await coreEngine.getMetrics();
console.log('System metrics:', metrics);
// {
//   uptime: 123456,
//   pipelines: { total: 5, active: 2, totalExecutions: 100, successRate: 98.5 },
//   plugins: { total: 5, enabled: 4, totalCalls: 500, successRate: 99.2 },
//   events: { subscriptions: 10, history: 50 }
// }
```

### **9. Get Pipeline Metrics**

```typescript
import { pipelineManager } from '@/lib/core';

// Get metrics for a specific pipeline
const metrics = pipelineManager.getMetrics('api-key-update');
console.log('Pipeline metrics:', metrics);
// {
//   totalExecutions: 50,
//   successfulExecutions: 48,
//   failedExecutions: 2,
//   totalDuration: 5000,
//   averageDuration: 100,
//   lastExecution: 1234567890
// }

// Get all pipeline metrics
const allMetrics = pipelineManager.getAllMetrics();
```

### **10. Get Plugin Metrics**

```typescript
import { pluginRegistry } from '@/lib/core';

// Get metrics for a specific plugin
const metrics = pluginRegistry.getPluginMetrics('cache-plugin');
console.log('Plugin metrics:', metrics);
// {
//   totalCalls: 100,
//   successfulCalls: 98,
//   failedCalls: 2,
//   averageExecutionTime: 5
// }
```

---

## 🎯 **COMPLETE EXAMPLE: API KEY UPDATE FLOW**

```typescript
import { 
    coreEngine, 
    pipelineManager, 
    pluginRegistry, 
    eventBus, 
    EventTypes 
} from '@/lib/core';

// 1. Initialize the engine
await coreEngine.initialize({
    debug: true,
    collectMetrics: true,
});

// 2. Register plugins
await pluginRegistry.registerPlugin(new CachePlugin());
await pluginRegistry.registerPlugin(new FirebasePlugin());

// 3. Register pipeline
pipelineManager.registerPipeline(apiKeyPipeline);

// 4. Subscribe to events
eventBus.subscribe(EventTypes.API_KEY_UPDATED, async (event) => {
    console.log('API key updated!', event.payload);
    toast.success('API key saved successfully!');
});

// 5. Execute pipeline
const result = await pipelineManager.execute(
    'api-key-update',
    {
        apiKey: 'sk-xxx',
        provider: 'openai',
    },
    user
);

// 6. Check result
if (result.success) {
    console.log('Success!', result.data);
} else {
    console.error('Failed:', result.error);
}

// 7. Get metrics
const metrics = await coreEngine.getMetrics();
console.log('System metrics:', metrics);
```

---

## 🔧 **ADMIN PANEL INTEGRATION**

```typescript
// Get all registered pipelines
const pipelines = pipelineManager.getRegisteredPipelines();

// Get active pipelines
const activePipelines = pipelineManager.getActivePipelines();

// Enable/disable pipeline
pipelineManager.setPipelineEnabled('api-key-update', false);

// Get all plugins
const plugins = pluginRegistry.getAllPlugins();

// Get plugins by category
const storagePlugins = pluginRegistry.getPluginsByCategory('storage');

// Get event history
const eventHistory = eventBus.getHistory();

// Get event subscriptions
const subscriptions = eventBus.getSubscriptions();
```

---

## 🎉 **BENEFITS OF V2 ARCHITECTURE**

### **Before (V1):**
```typescript
// Tightly coupled, hard to debug
async function updateApiKey(apiKey, provider) {
    // Validation
    if (!apiKey) throw new Error('Invalid');
    
    // Save to Firebase
    await setDoc(...);
    
    // Update cache
    localStorage.setItem(...);
    
    // No metrics, no events, no error handling
}
```

### **After (V2):**
```typescript
// Modular, observable, maintainable
const result = await pipelineManager.execute('api-key-update', { apiKey, provider });

// Automatic:
// ✅ Validation
// ✅ Error handling
// ✅ Retry logic
// ✅ Rollback on failure
// ✅ Event emission
// ✅ Metrics collection
// ✅ Health monitoring
```

---

**This is the power of V2 architecture!** 🚀

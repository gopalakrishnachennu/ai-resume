# Docs Consolidated

> Purpose: Single source of truth for issues, architecture improvements, flow wiring, and enterprise roadmap.
> Sources: `docs/ISSUES.md`, `docs/ARCHITECTURE_IMPROVEMENTS.md`, `docs/ENTERPRISE_ROADMAP.md`, `docs/FLOW.md`.

---

## 0) Quick Reference

### Priority Order

**P0 - CRITICAL (Fix Now):**
1. Admin Config Disconnect (toggles do not work)
2. Central Config Service (settings/global)
3. Feature Flags Enforcement
4. 5 Critical Bugs in Issues List

**P1 - Next Sprint:**
- Admin Access Control
- Safe Storage Wrapper (draftService.ts)
- LLM Response Hardening

**P2 - Later:**
- Data Model Normalization
- Editor Refactoring
- Pipeline Wiring

### Document Owners

| Doc | Owner | Update Frequency |
|-----|-------|------------------|
| Issues | Engineering | Per bug fix |
| Architecture Improvements | Tech Lead | Weekly |
| Enterprise Roadmap | Product | Quarterly |

---

## 1) Flow Diagram (Text-Based)

### 1.0 Wiring Reality Check (Current Divergences)

| Area | Doc Model | Actual Wiring | Impact |
|------|-----------|----------------|--------|
| Admin feature toggles | Enforced in runtime | Not enforced (settings saved, not read) | Admin panel gives false control |
| Auth toggles | Configurable via admin | `APP_CONFIG.auth` only in some paths | Require-login mode unreliable |
| UI toggles | Configurable via admin | `APP_CONFIG.ui` only | Admin UI switches ignored |
| Admin access | admins/{uid} | Hardcoded emails / no checks on templates page | Non-admins can access admin tools |
| Auto-save vs manual save | Same field | Imported resumes save to `updatedResume` vs `resume` | Edits lost on refresh |
| Resume storage | Single canonical store | 3 collections + schema heuristics in editor | Data drift and brittle conversions |
| Local storage | Cache only | Functional dependency for drafts/analysis | Loss in private mode, corruption crashes |

### 1.0.1 Feature Config Gate Audit

#### ✅ GATED (Admin Has Control)
| Feature | Where Gated | Config Source |
|---------|-------------|---------------|
| Guest limits | `guestService.ts` | `settings/global` ✅ |
| Global API key | `generate/page.tsx` | `settings/global` ✅ |
| Guest restrictions | `useGuestAuth.ts` | `settings/global` ✅ |
| Admin prompts | `promptService.ts` | `settings/prompts` ✅ |

#### ⚠️ PARTIALLY GATED (Firebase-First but No Feature Guard)
| Feature | Data Storage | Missing Guard |
|---------|--------------|---------------|
| Quick Format (Import) | `applications/{id}` ✅ | `features.quickFormat` |
| Dashboard | Reads from Firebase ✅ | `features.dashboard` (route guard) |

#### ❌ NOT GATED (Admin Has No Control)
| Feature | Current State | Should Check |
|---------|---------------|--------------|
| `features.resumeGeneration` | Never checked | `settings/global.features` |
| `features.jdAnalysis` | Never checked | `settings/global.features` |
| `features.pdfExport` | Never checked | `settings/global.features` |
| `features.docxExport` | Never checked | `settings/global.features` |
| `features.resumeEditor` | Never checked | `settings/global.features` |
| `features.profile` | Never checked | Route guard |
| `auth.requireLogin` | Static `APP_CONFIG` | `settings/global.auth` |
| `auth.allowGoogleSignIn` | Never checked | Block GoogleAuthProvider |
| `auth.allowEmailSignIn` | Never checked | Block email form |
| `auth.allowAnonymous` | Never checked | Block guest login |
| `ai.providers.*` | Never checked | Guard LLM calls |
| `ai.limits.*` | Never checked | Guard token usage |

#### Feature Dependencies
```
Resume Generation → Requires: jdAnalysis, aiGeneration, auth
PDF Export       → Requires: resumeEditor
DOCX Export      → Requires: resumeEditor  
Dashboard        → Requires: auth
Editor           → Requires: auth + (resumeGeneration OR import)
Profile          → Requires: auth
```

#### Impact
**~70% of admin toggles do nothing.** Admin sees switches but they have no effect.

#### Fix Required
```typescript
// [NEW] lib/guards/featureGuard.ts
async function guardFeature(feature: string): Promise<boolean> {
  const config = await getRuntimeConfig(); // From settings/global
  return config.features[feature] ?? true;
}

// Usage in app
if (!(await guardFeature('pdfExport'))) {
  toast.error('PDF export is disabled by admin');
  return;
}
```

### 1.0.2 Guarding Layers (In-Depth Implementation)

All features must be guarded at multiple layers for corporate-grade safety.

---

#### 1. Route Guards (Block Page Access)

Block entire pages when feature is disabled.

```typescript
// [NEW] lib/guards/routeGuard.ts
export async function canAccessRoute(route: string): Promise<boolean> {
  const config = await getRuntimeConfig();
  const routeFeatureMap: Record<string, string> = {
    '/dashboard': 'dashboard',
    '/editor': 'resumeEditor',
    '/generate': 'resumeGeneration',
    '/import': 'quickFormat',
    '/profile': 'profile',
  };
  const feature = routeFeatureMap[route];
  return feature ? (config.features[feature] ?? true) : true;
}

// Usage in page component
useEffect(() => {
  canAccessRoute('/import').then(allowed => {
    if (!allowed) {
      toast.error('This feature is disabled by admin');
      router.push('/dashboard');
    }
  });
}, []);
```

---

#### 2. Action Guards (Block Handler Execution)

Prevent actions even if page is accessed via deep link.

```typescript
// [NEW] lib/guards/featureGuard.ts
export async function guardFeature(feature: string): Promise<boolean> {
  const config = await getRuntimeConfig();
  return config.features[feature] ?? true;
}

// Usage in handlers
const handleExportPDF = async () => {
  if (!(await guardFeature('pdfExport'))) {
    toast.error('PDF export is disabled by admin');
    return;
  }
  // ... proceed with export
};

const handleAnalyzeJD = async () => {
  if (!(await guardFeature('jdAnalysis'))) {
    toast.error('JD Analysis is disabled');
    return;
  }
  // ... proceed
};

const handleGenerateResume = async () => {
  if (!(await guardFeature('resumeGeneration'))) {
    toast.error('Resume generation is disabled');
    return;
  }
  // ... proceed
};
```

---

#### 3. Data-Layer Guards (Firestore Security Rules)

Last line of defense - enforce in Firestore rules.

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper: read global config
    function getConfig() {
      return get(/databases/$(database)/documents/settings/global).data;
    }
    
    // Block resume writes if feature disabled
    match /applications/{appId} {
      allow create: if getConfig().features.resumeGeneration == true
                    || getConfig().features.quickFormat == true;
      allow update: if getConfig().features.resumeEditor == true;
    }
    
    // Block draft writes if disabled
    match /users/{userId}/drafts/{draftId} {
      allow write: if getConfig().features.resumeEditor == true;
    }
  }
}
```

---

#### 4. UI Guards (Hide/Disable Buttons)

Reduce confusion by hiding disabled features.

```tsx
// [NEW] components/guards/FeatureGuard.tsx
export function FeatureGuard({ 
  feature, 
  children, 
  fallback = null 
}: { 
  feature: string; 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [enabled, setEnabled] = useState(true);
  
  useEffect(() => {
    guardFeature(feature).then(setEnabled);
  }, [feature]);
  
  return enabled ? <>{children}</> : <>{fallback}</>;
}

// Usage - Hide export button if disabled
<FeatureGuard feature="pdfExport">
  <button onClick={handleExportPDF}>Export PDF</button>
</FeatureGuard>

// Usage - Show disabled state
<FeatureGuard 
  feature="docxExport" 
  fallback={<button disabled className="opacity-50">DOCX Disabled</button>}
>
  <button onClick={handleExportDOCX}>Export DOCX</button>
</FeatureGuard>
```

---

#### 5. Auth-Method Guards (Block Sign-In Methods)

Control which auth methods are available.

```typescript
// [NEW] lib/guards/authGuard.ts
export async function getEnabledAuthMethods(): Promise<string[]> {
  const config = await getRuntimeConfig();
  const methods: string[] = [];
  if (config.auth.allowGoogleSignIn) methods.push('google');
  if (config.auth.allowEmailSignIn) methods.push('email');
  if (config.auth.allowAnonymous) methods.push('guest');
  return methods;
}

// Usage in login page
const enabledMethods = await getEnabledAuthMethods();

// Conditionally render buttons
{enabledMethods.includes('google') && (
  <button onClick={signInWithGoogle}>Sign in with Google</button>
)}
{enabledMethods.includes('email') && (
  <EmailSignInForm />
)}
{enabledMethods.includes('guest') && (
  <button onClick={continueAsGuest}>Continue as Guest</button>
)}
```

---

#### 6. AI Provider + Token Guards

Enforce AI limits inside LLM service calls.

```typescript
// [NEW] lib/guards/aiGuard.ts
export async function guardAIUsage(provider: string, tokens: number): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const config = await getRuntimeConfig();
  
  // Check provider allowlist
  if (!config.ai.providers[provider]?.enabled) {
    return { allowed: false, reason: `${provider} is disabled by admin` };
  }
  
  // Check token limit
  if (tokens > config.ai.limits.maxTokensPerRequest) {
    return { allowed: false, reason: `Request exceeds ${config.ai.limits.maxTokensPerRequest} token limit` };
  }
  
  // TODO: Check monthly budget
  return { allowed: true };
}

// Usage in LLM router
const aiCheck = await guardAIUsage('openai', estimatedTokens);
if (!aiCheck.allowed) {
  throw new Error(aiCheck.reason);
}
```

---

#### Guard Implementation Checklist

| Feature | Route | Action | Data | UI | Auth | AI |
|---------|-------|--------|------|----|----- |----|
| Resume Generation | ✓ | ✓ | ✓ | ✓ | - | ✓ |
| JD Analysis | - | ✓ | - | ✓ | - | ✓ |
| PDF Export | - | ✓ | - | ✓ | - | - |
| DOCX Export | - | ✓ | - | ✓ | - | - |
| Quick Format | ✓ | ✓ | ✓ | ✓ | - | - |
| Dashboard | ✓ | - | - | - | - | - |
| Profile | ✓ | - | ✓ | - | - | - |
| Google Sign-In | - | ✓ | - | ✓ | ✓ | - |
| Guest Mode | - | ✓ | - | ✓ | ✓ | - |

### 1.1 App Boot + Auth Flow

```
User hits app
  │
  ├─ AuthProvider (firebase onAuthStateChanged)
  │    ├─ if logged-in user → set user
  │    └─ else → useGuestAuth() → getGlobalSettings()
  │               ├─ if guest enabled & not requireLogin → initializeGuestUser()
  │               └─ else → stay unauthenticated
  │
  └─ UI routes decide where to go next
```

Chokepoints:
- auth.requireLogin is read from static APP_CONFIG, not admin settings.
- Guest/limit rules depend on settings/global.

### 1.2 Generate Flow (JD → Analysis → Resume)

```
Generate Page
  │
  ├─ Load user + check API key
  │    ├─ userDoc.llmConfig OR
  │    └─ global API key from settings/global
  │
  ├─ JD Analyze
  │    ├─ JobProcessingService.processJobDescription()
  │    │    ├─ cache lookup (FirebaseCacheManager)
  │    │    └─ LLMBlackBox.executeJSON() → store in cache
  │    └─ save analysis in localStorage
  │
  └─ Resume Generate
       ├─ LLMBlackBox / ResumeGenerationService
       ├─ store resume in Firestore (varies by flow)
       └─ redirect to editor
```

Chokepoints:
- LLM JSON parsing is brittle.
- Feature toggles not enforced (admin settings).
- Mixed storage targets (resumes/applications).

### 1.3 Editor Flow (Load → Edit → Save/Export)

```
Editor Page (/editor/[id])
  │
  ├─ loadData()
  │    ├─ local draft (localStorage)
  │    ├─ imported resume (applications)
  │    ├─ AI resume (resumes / appliedResumes)
  │    └─ profile defaults (users doc)
  │
  ├─ normalize into editor schema
  │
  ├─ auto-save (useAutoSave → silent save)
  │    ├─ imported → applications.updatedResume
  │    ├─ ai resume → resumes.resumeData
  │    └─ legacy → appliedResumes
  │
  ├─ manual save (handleSave)
  │    ├─ imported → applications.resume
  │    ├─ ai resume → resumes.resumeData
  │    └─ legacy → appliedResumes
  │
  ├─ ATS scoring
  │    ├─ local ATS
  │    └─ server ATS (analyzeResume)
  │
  └─ export
       ├─ PDF (pdfmake)
       └─ DOCX (docx)
```

Chokepoints:
- Editor mega-module (load/save/export/ATS all in one file).
- Auto-save vs manual save write different fields.
- localStorage parsing without safety wrapper in some paths.

### 1.4 Dashboard Flow (Unified Applications View)

```
Dashboard Page
  │
  ├─ load applications (applications collection)
  ├─ load resumes (resumes collection)
  ├─ load jobs (jobs collection)
  ├─ merge into unified list
  ├─ status updates / delete / edit
  └─ open editor or preview
```

Chokepoints:
- Manual merge logic → duplicate handling is heuristic.
- Delete/update guesses collection by ID prefix.

### 1.5 Admin Flow

```
Admin Login
  │
  └─ useAdminAuth() → admins/{uid}.isAdmin

Admin Settings
  │
  └─ save settings/global (config)

Admin Prompts
  │
  └─ settings/prompts (global defaults)

Admin Templates
  │
  └─ templates CRUD + publish/unpublish
```

Chokepoints:
- Admin settings saved but mostly ignored at runtime.
- Admin access enforcement inconsistent (hardcoded emails in prompts page; templates page allows any user).

### 1.6 Data Stores & Sources of Truth

#### Current State (Problem)
```
Firestore (Admin CAN control):
  users/{uid}
  applications/{id}
  resumes/{id}
  appliedResumes/{id}
  jobs/{id}
  settings/global
  settings/prompts

Local Storage (Admin CANNOT control):
  draft_resume_{id}      ← No visibility, no backup, no audit
  draft_jobDescription   ← Lost on cache clear
  draft_analysis         ← Lost on cache clear
  jobAnalysis            ← No admin control
```

Problem:
- Admin has ZERO control over localStorage
- Cannot view, backup, or audit user drafts
- Data lost on cache clear or private mode
- No cross-device sync

### 1.7 Target Architecture: Firebase-First (CENTRAL)

#### Core Principle
> **Everything on Firebase. localStorage is CACHE ONLY.**

#### Current vs Target
- Current: Drafts and job analysis still rely on localStorage.
- Target: All drafts and analysis live in Firebase; localStorage is cache only.

#### Target Data Model
```
Firestore (Single Source of Truth):
  settings/
    global             ← All config (features, auth, AI, UI)
    prompts            ← Global prompts
  
  users/{uid}/
    profile            ← User info
    llmConfig          ← API keys
    drafts/            ← NEW: All drafts here
      {draftId}/
        type: 'resume' | 'analysis'
        data: {...}
        updatedAt
        autoSave: true
  
  applications/{id}/   ← Single resume collection
    resume             ← Canonical resume data
    jobAnalysis        ← Stored with resume
    status
    createdAt
```

#### localStorage Role (Cache Only)
```
localStorage:
  cache_draft_{id}     ← Hydration cache, synced from Firebase
  cache_analysis_{id}  ← Session cache, cleared on logout
  
Rules:
  - NEVER treat as source of truth
  - ALWAYS sync to Firebase first
  - CLEAR on logout
  - WRAP in try/catch
```

#### Compliance & Audit Rationale
- Firebase allows auditing, retention, legal holds, and recovery.
- localStorage cannot be audited or retained reliably.
- Corporate environments often block or wipe localStorage.

#### Admin Control Enabled
| Feature | Firebase | localStorage |
|---------|----------|-------------|
| View user drafts | ✅ Yes | ❌ No |
| Backup/restore | ✅ Yes | ❌ No |
| Audit logs | ✅ Yes | ❌ No |
| Enforce retention | ✅ Yes | ❌ No |
| Cross-device sync | ✅ Yes | ❌ No |
| Survive cache clear | ✅ Yes | ❌ No |

### 1.8 Central Config Service

```
getRuntimeConfig() → settings/global with APP_CONFIG fallback
guardFeature('pdfExport') → check settings/global.features
syncDraftToFirebase() → users/{uid}/drafts/{id}
loadDraftFromFirebase() → hydrate localStorage from Firebase
```

#### Config Load Contract
- Single runtime config loader used across app.
- Cache TTL (e.g., 60s) with fallback to APP_CONFIG.
- If config load fails: log + use APP_CONFIG defaults.

### 1.9 Recommended Wiring

```
Config:
  useAppConfig() → reads settings/global, fallback APP_CONFIG
  guardFeature() → enforces admin toggles

Resume:
  ResumeSchema (Zod)
  Store: applications/{id}.resume ONLY
  Drafts: users/{uid}/drafts/{id}

Editor:
  useResumeLoader()      → Firebase first, localStorage cache
  useResumeAutosave()    → Debounced Firebase writes
  useResumePersistence() → Sync to users/{uid}/drafts
```

Outcome:
- Full admin visibility and control
- No data loss on cache clear
- Cross-device sync
- Audit trail for compliance

#### Enforcement Order (Feature Flags)
1. Route guard (block pages)
2. Action guard (block handlers)
3. Data-layer guard (Firestore rules where possible)
4. UI guard (hide/disable)

#### Migration Checklist (Firebase-First)
1. Add `users/{uid}/drafts` collection
2. Add `applications/{id}.jobAnalysis`
3. Migrate local drafts to Firebase on next login
4. Update editor to load from Firebase first
5. Clear local cache after successful sync

---

## 2) Known Issues & Fixes

> Purpose: Track edge cases and bugs systematically. Fix one at a time without breaking other features.
> Last Updated: 2026-01-08

### 2.1 Critical Issues

#### Issue #1: ATS Analysis Assumes skills.technical Exists
Status: Open
File: app/actions/atsAnalysis.ts:59
Impact: Older resumes without skills.technical crash ATS analysis

Problem:
```
resume.skills.technical.join(' ')
```

Fix: Add fallback: (resume.skills?.technical || []).join(' ')

---

#### Issue #2: Resume Generation Assumes experience[0] Exists
Status: Open
File: lib/llm-black-box/services/resumeGeneration.ts:171
Impact: Empty experience crashes AI resume generation

Problem:
```
const recentRole = userProfile.experience[0];
```

Fix: Add guard: const recentRole = userProfile.experience[0] || { title: '' };

---

#### Issue #3: Guest Google Upgrade Uses Wrong Credential
Status: Open
File: lib/services/guestService.ts:145-149
Impact: Guest → Google upgrade always fails

Problem:
```
GoogleAuthProvider.credential(
    (await signInWithPopup(auth, provider)).user.uid
)
```

Fix: Use signInWithPopup result directly for linking.

---

#### Issue #4: jobProcessing tokensUsed NaN Risk
Status: Open
File: lib/llm-black-box/services/jobProcessing.ts:153
Impact: Missing tokensUsed leads to NaN in stats

Problem:
```
tokensUsed: existing.data().tokensUsed + tokensUsed
```

Fix: Add default: (existing.data().tokensUsed || 0) + tokensUsed

---

#### Issue #5: LLM JSON Parsing is Brittle
Status: Open
File: lib/llm-black-box/core/llmRouter.ts:221-230
Impact: Extra braces or multiple JSON blocks cause parse failures

Problem:
```
const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
```

Fix: Use balanced brace matching or stricter JSON extraction.

---

### 2.2 Medium Priority Issues

#### Issue #6: Experience Date Parsing Creates Invalid Dates
Status: Open
File: lib/llm-black-box/services/resumeGeneration.ts:313-315
Impact: Invalid date strings leak into prompts/exports

Fix: Validate dates with isNaN(date.getTime()) before use.

---

#### Issue #7: Export Date Formatting Outputs "Invalid Date"
Status: Open
File: lib/services/resumeExportService.ts:36-44
Impact: PDFs/DOCX show "Invalid Date" for malformed dates

Fix: Check isNaN(date.getTime()) before formatting.

---

#### Issue #8: jobAnalysis Parsed Without try/catch
Status: Open
File: app/editor/[id]/page.tsx:750-753
Impact: Corrupted jobAnalysis in localStorage crashes editor

Fix: Wrap JSON.parse in try/catch and clear on error.

---

#### Issue #9: Auto-Save Disabled for new Resumes
Status: Open
File: app/editor/[id]/page.tsx:583-594 + page.tsx:1330
Impact: New resumes lost if tab closed before manual save

Fix: Generate temp ID immediately on first keystroke.

---

#### Issue #10: Session Expires Without Warning
Status: Open
File: lib/services/sessionService.ts:314
Impact: Extension uses stale session data after 24 hours

Fix: Add expiry check and refresh prompt in popup.

---

#### Issue #11: Auto-Save Race Condition
Status: Open
File: lib/hooks/useAutoSave.ts:60
Impact: Rapid edits during slow save could lose last edit

Fix: Queue save requests instead of skipping.

---

### 2.3 Low Priority Issues

#### Issue #12: Dashboard Query Races
Status: Open
File: app/dashboard/page.tsx:267-271
Impact: Rapid filter changes can show stale data

Fix: Use debounce or abort controller for queries.

---

#### Issue #13: Draft Age Check Too Strict
Status: Open
File: app/editor/[id]/page.tsx:672
Impact: Draft older than 24 hours is discarded

Fix: Increase to 7 days or ask user before discarding.

---

#### Issue #14: Delete Collection Guessing
Status: Open
File: app/dashboard/page.tsx:576-609
Impact: Non-standard IDs could delete from wrong collection

Fix: Store collection source in application metadata.

---

#### Issue #15: Job Title Blur Navigates to Dashboard
Status: Open
File: app/editor/[id]/page.tsx (handleSave on blur)
Impact: Accidental blur ejects user mid-edit

Fix: Do not trigger navigation on blur; only on explicit save.

---

### 2.4 Not Bugs (Verified False Positives)

| Reported Issue | Reason Not a Bug |
|----------------|------------------|
| ResumePipeline validation | Skills param is string[] not arrays to validate |

---

### 2.5 Completed Fixes

Template:
```
Issue #X: Title
Status: Fixed
Fixed Date: YYYY-MM-DD
Notes: Short description
```

---

### 2.6 Fix Process

1. Pick one issue from the priority list
2. Implement minimal fix
3. Test locally
4. Update this doc
5. Commit and deploy

---

### 2.7 Extension Issues (Deferred)

| Issue | File | Impact |
|------|------|--------|
| Session expiration not checked | listener.ts:163 | Stale sessions |
| Undefined config reference | popup.js:329 | Dashboard crashes |
| Buffer conversion silent fail | listener.ts:286-312 | Resume not stored |

---

## 3) Architecture Improvements

> Purpose: System-level stability gaps and architectural patterns requiring refactoring for corporate-grade reliability.
> Last Updated: 2026-01-08

### Executive Summary
Systemic architecture issues affect maintainability, testability, and reliability at scale. These are not bugs but design patterns to refactor for enterprise-grade stability.

### 3.1 Data Model Fragmentation

Problem:
- Multiple resume storage formats create sync drift and unpredictable behavior.

Collections:
- resumes (AI-generated)
- appliedResumes (legacy)
- applications (new unified)

Field inconsistencies:
- personalInfo.name ↔ fullName
- experience.title ↔ position
- education.school ↔ institution
- skills.technical ↔ technicalSkills

Impact:
- Silent data loss during conversion
- Editor handles 4+ formats with heuristics
- Exports fail if fields missing

Recommendation:
1. Define canonical ResumeSchema
2. Add migration layer to normalize on read
3. Save only to applications
4. Deprecate resumes and appliedResumes

---

### 3.2 ID Scheme Inconsistency

Problem:
- resume_${Date.now()}
- app_import_${Date.now()}_${uid}
- app_${resumeId}
- Firestore auto IDs

Impact:
- Delete logic guesses collection
- Migrations and deduping unreliable
- No explicit linking between job/resume/application

Recommendation:
1. Use UUID v4 for all new records
2. Store collectionSource on each document
3. Add linkedIds for explicit relationships

---

### 3.3 Settings Precedence Ambiguity

Problem:
- Stored in user defaults, per-resume settings, and defaults

Impact:
- Inconsistent UX
- Hard to debug

Recommendation:
1. Define precedence: resume.settings > user.defaultSettings > APP_DEFAULTS
2. UI indicators for inherited vs custom
3. Reset to defaults with clear scope

---

### 3.4 Editor Lifecycle Complexity

Problem:
- editor page handles load/migrate/save/export/ATS/templating

Impact:
- Hard to test and maintain

Recommendation:
1. Extract composable hooks
2. Create ResumeNormalizer service
3. Add integration tests for loading paths

---

### 3.5 Auto-Save vs Manual Save Divergence

Problem:
- Auto-save writes updatedResume, manual save writes resume

Impact:
- Edits disappear after refresh

Recommendation:
1. Unify to resume field
2. Auto-save writes same format as manual
3. Add lastSavedAt

---

### 3.6 localStorage Dependency (CRITICAL)

Problem:
- Critical data stored in localStorage (drafts, jobAnalysis)
- Admin has ZERO control over localStorage
- Cannot view, backup, audit, or recover user data

Impact:
- Private mode breaks app
- Corruption crashes editor
- No admin visibility into user work
- No compliance/audit capability
- Data lost on cache clear

Target:
1. **Move ALL drafts to Firebase**: `users/{uid}/drafts/{id}`
2. **Move ALL analysis to Firebase**: `applications/{id}.jobAnalysis`
3. **localStorage = cache only**: hydration, never source of truth
4. **Sync pattern**: Write Firebase first → update localStorage cache
5. **Clear on logout**: remove all local cache

Migration:
```
[NEW] lib/services/draftService.ts
  - saveDraftToFirebase(uid, draftId, data)
  - loadDraftFromFirebase(uid, draftId)
  - syncToLocalCache(draftId, data)
  - clearLocalCache()
```

---

### 3.7 Resume Schema Validation

Problem:
- No central validation before save/export

Impact:
- Corrupted data persists
- Exports fail at render time

Recommendation:
1. validateResumeSchema(data)
2. Use Zod
3. Validate before save/export/cache
4. Log failures

---

### 3.8 LLM Response Handling

Problem:
- Regex-based JSON extraction
- No validation

Impact:
- Malformed responses fail generation

Recommendation:
1. Balanced brace parsing
2. JSON5 fallback
3. Validate structure before cache
4. Track parseAttempts

---

### 3.9 Cache Invalidation

Problem:
- No invalidation when prompts/models change

Impact:
- Stale analyses

Recommendation:
1. Add schemaVersion to cache keys
2. Bump on prompt/model changes
3. Add admin clear cache
4. Shorter TTL in dev

---

### 3.10 Error Handling & Observability

Problem:
- Errors only in console
- No error boundary

Recommendation:
1. Add Sentry or similar
2. Editor error boundary
3. Track failure metrics
4. Add report button

---

### 3.11 Admin Panel Configuration Disconnect (Critical)

Problem:
- Admin saves settings/global, runtime reads static APP_CONFIG

Recommendation:
1. useAppConfig hook to read settings/global with fallback
2. Replace APP_CONFIG usage
3. Add feature guards
4. Unify admin auth checks

---

### 3.12 Flow Review & Wiring Gaps

Current wiring:
- Auth/Guest: Firebase + settings/global (partial)
- Generate: LLM direct, pipelines bypassed
- Editor: Mega-module
- Dashboard: manual merge
- Admin: settings saved, not enforced

Wiring gaps:
- Feature toggles saved but not read
- Auth toggles saved but read from APP_CONFIG
- UI toggles saved but read from APP_CONFIG
- AI settings saved but not enforced
- Admin access inconsistent

Isolation issues:
- Direct Firestore calls in UI
- No config provider
- No storage wrapper

---

### 3.13 Priority Matrix

| Issue | Impact | Effort | Priority |
|-------|--------|--------|----------|
| Admin Config Disconnect | Critical | Medium | P0 |
| Central Config Service | Critical | Low | P0 |
| Feature Flags Enforcement | Critical | Low | P0 |
| Resume Schema Validation | High | Medium | P0 |
| Auto-Save Divergence | High | Low | P0 |
| Admin Access Control | High | Low | P1 |
| Safe Storage Wrapper | Medium | Low | P1 |
| LLM Response Hardening | Medium | Medium | P1 |
| Editor Lifecycle | High | High | P2 |
| Data Model Normalization | High | High | P2 |
| Pipeline Wiring | Medium | Medium | P2 |
| Analytics Scaling | Low | Low | P3 |

---

### 3.14 Unified Long-Form Prompt Architecture (NEW)

> **Problem**: Current UX forces users to provide multiple fragmented prompts across different sections (summary, experience, skills, etc.). In real-world scenarios, users want to provide ONE comprehensive, detailed prompt that captures their entire resume vision.

#### Current State (Fragmented)
```
Step 1: Paste JD → click analyze
Step 2: Fill summary prompt → generate
Step 3: Fill experience prompt → generate
Step 4: Fill skills prompt → generate
Step 5: Review each section separately
```

**Pain Points:**
- Users have to context-switch between sections
- Each section loses context of the whole
- Repetitive inputs (same context entered multiple times)
- Inconsistent tone/style across sections
- Harder to express holistic career narrative

#### Target State (Unified Long-Form Prompt)

```
Single Input Box:
┌─────────────────────────────────────────────────────────────┐
│ Tell me about your resume goals (as detailed as you want): │
│                                                             │
│ [Large text area - supports markdown, bullet points,        │
│  any format the user prefers. No character limit shown      │
│  prominently. Encourage detailed input.]                    │
│                                                             │
│ Examples:                                                   │
│ • "I'm a DevOps engineer with 5 years experience..."        │
│ • "Focus on my AWS and Kubernetes certifications..."        │
│ • "I want to transition from SWE to DevOps..."              │
│ • "Emphasize my leadership in the last 2 roles..."          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Implementation Plan

##### Phase 1: UI Changes
```typescript
// [NEW] components/prompts/UnifiedPromptInput.tsx
interface UnifiedPromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;  // Default: 10 (encourage long input)
  showExamples?: boolean;
}

// Features:
// - Large text area (no visible character limit)
// - Auto-expand as user types
// - Markdown preview toggle
// - Voice input option (future)
// - Save as draft
```

##### Phase 2: Prompt Processing Service
```typescript
// [NEW] lib/services/unifiedPromptService.ts
export interface UnifiedPromptContext {
  rawPrompt: string;           // User's long-form input
  jobDescription?: string;     // Optional JD for targeting
  userProfile?: UserProfile;   // Existing profile data
  targetRole?: string;         // If different from current
}

export interface ProcessedPromptSections {
  summaryGuidance: string;
  experienceGuidance: string;
  skillsGuidance: string;
  educationGuidance: string;
  globalTone: string;
  keyEmphasis: string[];
  avoidTopics: string[];
}

export async function processUnifiedPrompt(
  context: UnifiedPromptContext
): Promise<ProcessedPromptSections> {
  // Use LLM to intelligently parse long-form prompt into sections
  // Maintain context across all sections
  // Extract tone, emphasis, and preferences
}
```

##### Phase 3: LLM Integration
```typescript
// [MODIFY] lib/llm-black-box/services/resumeGeneration.ts

// Before: Multiple section prompts built separately
// After: Single unified prompt informs ALL sections

const systemPrompt = `
You are generating a resume based on the following unified instructions from the user:

---USER'S COMPLETE VISION---
${unifiedPrompt.rawPrompt}
---END USER'S VISION---

Job Description Context:
${unifiedPrompt.jobDescription || 'No specific JD provided'}

Ensure consistency in tone, emphasis, and narrative across ALL sections.
`;
```

#### UX Flow (New vs Old)

**Old Flow (5+ steps):**
```
JD Input → Analyze → Summary Prompt → Experience Prompt → Skills Prompt → Review
```

**New Flow (2 steps):**
```
[Optional] JD Input → Unified Prompt → Generate Full Resume → Review
```

#### Storage Schema Addition
```typescript
// [MODIFY] types/resume.ts
interface ResumeMetadata {
  // Existing fields...
  
  unifiedPrompt?: {
    rawInput: string;           // User's original long-form prompt
    processedAt: Date;          // When it was processed
    version: string;            // Prompt processing version
    extractedContext: {
      tone: string;
      keyThemes: string[];
      targetAudience: string;
    };
  };
}
```

#### Admin Controls
```typescript
// settings/global additions
{
  prompts: {
    // Existing...
    
    unifiedPromptConfig: {
      enabled: true,                    // Feature toggle
      minLength: 100,                   // Encourage detail
      suggestedLength: 500,             // Show as hint
      maxLength: 10000,                 // Generous limit
      showExamples: true,               // Show example prompts
      allowMarkdown: true,              // Parse markdown
      saveAsTemplate: true,             // Allow saving for reuse
    }
  }
}
```

#### Migration from Fragmented to Unified
- Keep existing fragmented prompts as "Advanced Mode"
- Default new users to Unified Prompt mode
- Show toggle: "Switch to Advanced (per-section) mode"
- Migrate existing section prompts into unified format on toggle

#### Benefits
| Aspect | Fragmented (Current) | Unified (Target) |
|--------|---------------------|------------------|
| User Effort | 5+ inputs | 1 input |
| Context Preservation | None across sections | Full |
| Consistency | Manual | Automatic |
| Flexibility | Rigid structure | Free-form |
| Time to Resume | 10+ minutes | 2-3 minutes |
| Real-world Use | Awkward | Natural |

#### Priority
**P1 - Next Sprint** (High user impact, medium effort)

---

### 3.15 Implementation Phases

Phase 1: Foundation
- Create ResumeSchema with Zod
- Fix auto-save/manual-save mismatch
- Wrap localStorage access

Phase 2: Reliability
- Extract editor into hooks
- Improve LLM JSON parsing
- Add error boundaries

Phase 3: Unification
- Migrate all data to applications
- Standardize ID generation
- Deprecate legacy collections

Phase 4: Enterprise
- Observability and monitoring
- Define settings precedence
- Cache invalidation strategy

---

## 4) Enterprise Roadmap

> Purpose: Corporate-grade product readiness.
> Last Updated: 2026-01-08

### 4.1 Current State Assessment

What exists today (partial):
- Binary admin role via admins/{uid}.isAdmin (not enforced across all admin pages)
- Admin template CRUD (no admin check on templates page)
- Admin prompt management (hardcoded admin email list)
- Feature toggles (config only; not enforced at runtime)
- Guest usage limits (enforced)
- AI provider toggles (config only; not enforced at runtime)
- Global API key (enforced in generate flow)

What is missing:
- Everything else in roadmap below.

---

### 4.2 Phase 1: Access Control (Week 1-4)

RBAC:
Roles: super_admin, org_admin, hr_manager, recruiter, viewer
Permissions include users, templates, prompts, exports, analytics, settings.

Organization Model:
- organizations/{orgId}
  - plan, members, settings
  - templates, resumes, prompts

Features:
- Team-scoped data isolation
- Shared templates
- Shared resume bank
- Team analytics

---

### 4.3 Phase 2: Governance (Week 5-8)

Feature Flags per Org:
- aiGeneration, atsScan, docxExport, pdfExport, customTemplates, extension, apiAccess

AI Provider Policy:
- allowedProviders, defaultProvider, useGlobalKey
- maxTokensPerRequest, temperatureCap, monthlyTokenBudget

Template Governance:
- status: draft/pending_review/approved/deprecated
- approvedBy, approvedAt, changelog

Prompt Governance:
- versioning, testing sandbox, rollback
- lock prompts, staged edits

---

### 4.4 Phase 3: Usage & Quotas (Week 9-12)

Quota System:
- Per org and per user limits
- Enforcement hard/soft
- Alerts at 80/95

Spend Controls:
- monthlyBudget, alertThresholds
- autoDisableAt, billingContact

---

### 4.5 Phase 4: Audit & Compliance (Week 13-16)

Audit Logs:
- eventId, timestamp, userId, orgId, action, resource, ip, userAgent

Retention & Deletion:
- resumeRetentionDays, auditLogRetentionDays
- legalHold, purge tool, export tool

# Technical Debt & Architecture Improvement Plan

> **Purpose**: System-level stability gaps and architectural patterns requiring refactoring for corporate-grade reliability.
> **Owner**: Engineering Team  
> **Last Updated**: 2026-01-08

---

## Executive Summary

This document captures systemic architecture issues that affect maintainability, testability, and reliability at scale. These are **not bugs** but rather design patterns that need refactoring for enterprise-grade stability.

---

## 1. Data Model Fragmentation

### Problem
Multiple resume storage formats create sync drift and unpredictable behavior.

| Collection | Purpose | Format |
|------------|---------|--------|
| `resumes` | AI-generated | `professionalSummary`, `technicalSkills` |
| `appliedResumes` | Legacy saved | `resumeData.summary`, `skills.technical` |
| `applications` | Unified (new) | `resume.professionalSummary` embedded |

### Field Naming Inconsistencies
```
personalInfo.name ↔ fullName
experience.title ↔ position
education.school ↔ institution
skills.technical ↔ technicalSkills
```

### Impact
- Silent data loss during format conversions
- Editor must handle 4+ loading paths with branching heuristics
- Exports can fail when expected fields missing

### Recommendation
1. Define canonical `ResumeSchema` type
2. Add migration layer that normalizes on read
3. Save only to unified `applications` collection
4. Deprecate `resumes`, `appliedResumes` over time

---

## 2. ID Scheme Inconsistency

### Problem
```
resume_${Date.now()}
app_import_${Date.now()}_${uid}
app_${resumeId}
Firestore auto-generated IDs
```

### Impact
- Dashboard delete logic guesses collection from ID prefix
- Migrations/deduping unreliable
- No deterministic linking between job ↔ resume ↔ application

### Recommendation
1. Use UUID v4 for all new records
2. Store `collectionSource` field on each document
3. Add `linkedIds: { jobId, resumeId }` for explicit relationships

---

## 3. Settings Precedence Ambiguity

### Problem
Settings stored in:
1. `users/{uid}.defaultSettings` (global user prefs)
2. Per-resume `settings` field
3. `DEFAULT_ATS_SETTINGS` constant (fallback)

No clear merge/override order defined.

### Impact
- Corporate users expect predictable defaults
- UI shows different settings than what saves
- Hard to debug "why did my settings change?"

### Recommendation
1. Define explicit precedence: `resume.settings > user.defaultSettings > APP_DEFAULTS`
2. Show UI indicator when using inherited vs custom settings
3. Add "Reset to defaults" with clear scope

---

## 4. Editor Lifecycle Complexity

### Problem
`app/editor/[id]/page.tsx` is 3000+ lines handling:
- Load from 5+ sources (draft, profile, 3 collections)
- Auto-save to localStorage
- Manual save to Firestore
- ATS calculation (local + server)
- PDF/DOCX export
- Section management
- Template rendering

### Impact
- Small changes can regress unrelated flows
- Hard to unit test individual behaviors
- Cognitive load too high for new developers

### Recommendation
1. Extract into composable hooks:
   - `useResumeLoader()` - unified load logic
   - `useResumeAutosave()` - localStorage + debounce
   - `useResumePersistence()` - Firestore save
   - `useATSScoring()` - local + server analysis
2. Create `ResumeNormalizer` service for format conversions
3. Add integration tests for each loading path

---

## 5. Auto-Save vs Manual Save Divergence

### Problem
```typescript
// Auto-save writes:
updatedResume: { ... }

// Manual save writes:
resume: { ... }
```

Load path reads `resume`, ignoring `updatedResume` after refresh.

### Impact
- User edits disappear after refresh
- "Did my changes save?" confusion

### Recommendation
1. Unify to single field: `resume`
2. Auto-save writes same format as manual save
3. Add `lastSavedAt` timestamp for UI feedback

---

## 6. localStorage Dependency

### Problem
Critical data stored in localStorage:
- `draft_resume_*` - active editing session
- `jobAnalysis` - ATS context
- `jobDescription` - original JD text

### Impact
- Private browsing mode breaks app
- Corporate locked-down browsers may block
- Corrupted JSON crashes editor

### Recommendation
1. Treat localStorage as cache only, not source of truth
2. Always have Firestore fallback
3. Wrap all `JSON.parse` in try/catch with recovery

---

## 7. Resume Schema Validation

### Problem
No central validation before save/export.

### Impact
- Corrupted data silently persists
- Exports fail at render time
- LLM responses with bad structure stored as-is

### Recommendation
1. Create `validateResumeSchema(data)` function
2. Use Zod or similar for runtime validation
3. Call before: save, export, LLM result storage
4. Log/alert on validation failures

---

## 8. LLM Response Handling

### Problem
- Regex-based JSON extraction (`/{[\s\S]*}/`)
- No retry with different parsing on failure
- Raw response stored without validation

### Impact
- Extra JSON fragments blow up parsing
- Cascading "generation failed" errors
- Garbage data stored in cache

### Recommendation
1. Use proper JSON extraction (find balanced braces)
2. Add fallback: try `JSON5.parse` for relaxed syntax
3. Validate parsed structure before caching
4. Add `parseAttempts` metric for monitoring

---

## 9. Cache Invalidation

### Problem
- Job analysis cached with TTL (24h)
- No invalidation when prompts/models change
- Stale analyses served after system updates

### Impact
- Users see outdated keyword analysis
- A/B testing impossible
- Bug fixes don't apply to cached results

### Recommendation
1. Add `schemaVersion` to cache keys
2. Bump version on prompt/model changes
3. Add admin "clear all caches" function
4. Consider shorter TTL (4h) for dev environments

---

## 10. Error Handling & Observability

### Problem
- Many errors only logged to console
- No central error boundary for editor
- No metrics on failure rates

### Recommendation
1. Add Sentry/similar for production error tracking
2. Create `<EditorErrorBoundary>` with recovery UI
3. Track: load failures, save failures, export failures, LLM failures
4. Add "Report an issue" button with context

---

## 11. Admin Panel Configuration Disconnect ⚠️ CRITICAL

### Problem
Admin panel saves settings to `settings/global` in Firestore, but **runtime code reads from static `APP_CONFIG`**.

### What's Actually Working ✅
| Feature | Why It Works |
|---------|--------------|
| Guest limits | `guestService.ts` calls `getGlobalSettings()` |
| Global API key | Generation flow reads from Firestore |
| Admin prompts | `promptService.ts` reads `settings/prompts` |

### What's Broken ❌

| Setting | Admin Saves To | Runtime Reads From | Result |
|---------|----------------|-------------------|--------|
| `features.*` toggles | `settings/global` | Never checked | **Dead code** |
| `auth.requireLogin` | `settings/global` | `APP_CONFIG.auth` | **Admin ignored** |
| `auth.allow*` | `settings/global` | Never checked | **Dead code** |
| `ui.showUpgrade*` | `settings/global` | `APP_CONFIG.ui` | **Admin ignored** |
| `ai.enabled` | `settings/global` | Never checked | **Dead code** |
| `ai.providers` | `settings/global` | Never checked | **Dead code** |
| `storage.*` | `settings/global` | Never checked | **Dead code** |
| `analytics.*` | `settings/global` | Never checked | **Dead code** |
| `admin.enabled` | `settings/global` | Never checked | **Dead code** |
| Logged-in limits | `settings/global` | Never checked | **Dead code** |

### Mixed Pattern Bug (Line 81 in `useGuestAuth.ts`)
```typescript
// Reads guestConfig from Firestore...
const guestConfig = settings?.guest || APP_CONFIG.guest;

// ...but auth still from static config! ❌
if (guestConfig.enabled && !APP_CONFIG.auth.requireLogin) {
```

### Admin Access Inconsistencies
- Most admin pages use `useAdminAuth` ✅
- Some pages may accept any logged-in user
- Hardcoded email lists instead of `admins` collection

### Impact
- **Corporate risk**: Admin toggles give false sense of control
- **Feature flags useless**: Can't disable features per-deployment
- **Auth controls ignored**: Can't enforce login-required mode

### Recommendation
1. Create `useAppConfig()` hook that reads `settings/global` with fallback to `APP_CONFIG`
2. Replace all `APP_CONFIG.*` references with `useAppConfig()`
3. Add feature guards throughout app
4. Unify admin auth checks across all `/admin/*` pages

---

## Priority Matrix

| Issue | Impact | Effort | Priority |
|-------|--------|--------|----------|
| **Admin Config Disconnect (#11)** | **Critical** | **Medium** | **P0** |
| Resume Schema Validation (#7) | High | Medium | P0 |
| Auto-Save Divergence (#5) | High | Low | P0 |
| Editor Lifecycle (#4) | High | High | P1 |
| Data Model Unification (#1) | High | High | P1 |
| localStorage Fallbacks (#6) | Medium | Low | P1 |
| LLM Response Handling (#8) | Medium | Medium | P2 |
| Settings Precedence (#3) | Medium | Medium | P2 |
| ID Scheme (#2) | Low | Medium | P3 |
| Cache Invalidation (#9) | Low | Low | P3 |
| Observability (#10) | Medium | Medium | P2 |

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Create `ResumeSchema` type with Zod validation
- [ ] Fix auto-save/manual-save field mismatch
- [ ] Wrap all localStorage in try/catch

### Phase 2: Reliability (Week 3-4)
- [ ] Extract editor into composable hooks
- [ ] Improve LLM JSON parsing
- [ ] Add error boundaries

### Phase 3: Unification (Week 5-8)
- [ ] Migrate all data to `applications` collection
- [ ] Standardize ID generation
- [ ] Deprecate legacy collections

### Phase 4: Enterprise (Week 9+)
- [ ] Add observability/monitoring
- [ ] Define settings precedence
- [ ] Cache invalidation strategy

---

## 12. Flow Review & Wiring Gaps

### Current Flow Overview

| Flow | Current Wiring | Status |
|------|---------------|--------|
| Auth/Guest | Firebase auth + guestService reads `settings/global` | ✅ Partial |
| Generate | JD → JobProcessingService → LLM direct (bypasses pipelines) | ⚠️ Gap |
| Editor | Load draft → Firestore → legacy formats → mega-module | ⚠️ Gap |
| Dashboard | Aggregates apps/resumes/jobs with manual merge | ✅ Works |
| Admin | Settings saved to Firestore, not enforced | ❌ Broken |

### Wiring Gaps (Settings Saved But Not Enforced)

| Setting | Where Saved | Where Read | Result |
|---------|-------------|------------|--------|
| Feature toggles | `settings/global` | Never | **Dead code** |
| Auth toggles | `settings/global` | `APP_CONFIG` static | **Admin ignored** |
| UI toggles | `settings/global` | `APP_CONFIG` static | **Admin ignored** |
| AI settings | `settings/global` | Never | **Dead code** |
| Admin access | `admins/{uid}` | Hardcoded emails | **Inconsistent** |

### Chokepoints (High-Risk Areas)

1. **Editor Page** (`app/editor/[id]/page.tsx`)
   - 3000+ lines mega-module
   - Load/migrate/save/export/ATS/templating all in one
   - Hard to test or change safely

2. **LLM JSON Parsing** (`llmRouter.ts`)
   - Regex-based extraction
   - Single malformed response breaks generation

3. **Admin Analytics** (`app/admin/analytics/page.tsx`)
   - Queries full collections
   - Slow/expensive at scale

4. **Data Schema Heuristics** (`app/editor/[id]/page.tsx`)
   - AI/imported/legacy formats normalized in UI
   - Fragile branching logic

### Isolation Issues

| Issue | Location | Problem |
|-------|----------|---------|
| Direct Firestore calls | UI components | Can't enforce policies centrally |
| No config provider | Each page | Config source inconsistent |
| No storage wrapper | Inline localStorage | Failures propagate to UI state |

---

## Improvement Suggestions (Corporate-Grade)

### 1. Central Config Service
**Impact**: Eliminates drift between admin settings and runtime

```
[NEW] lib/config/configService.ts
- getRuntimeConfig() merges APP_CONFIG + settings/global
- Cache with TTL
- Use everywhere: routes, features, auth, AI, UI
```

### 2. Feature Flags Enforcement Layer
**Impact**: Makes admin toggles real

```
[NEW] lib/guards/featureGuard.ts
- checkFeature('pdfExport') → boolean
- Apply in pages + actions (generate, export, editor)
```

### 3. Normalize Data Model
**Impact**: Reduces branching and data loss

```
[NEW] lib/schemas/resumeSchema.ts (Zod)
[NEW] lib/adapters/resumeAdapter.ts
- Define ONE resume schema
- Use adapters for legacy/import formats
- Store normalized structure only
```

### 4. Pipeline Wiring Consistency
**Impact**: Centralized validation, retries, logging, rollback

```
[MODIFY] app/page.tsx
- Route all operations through ResumePipeline
- Pipelines exist but UI bypasses them currently
```

### 5. Admin Access Control
**Impact**: Compliance and role consistency

```
[MODIFY] app/admin/prompts/page.tsx
- Remove hardcoded ADMIN_EMAILS (line 21)
- Use useAdminAuth() for all admin pages
- Enforce admins/{uid} collection
```

### 6. Error Isolation + Safe Storage
**Impact**: Prevents editor/load crashes on corrupted drafts

```
[NEW] lib/utils/safeStorage.ts
- safeGetJSON(key, fallback) with try/catch
- safeSetJSON(key, value) with error handling
- Version-aware localStorage
```

### 7. LLM Response Hardening
**Impact**: Reduces random generation failures

```
[MODIFY] lib/llm-black-box/core/llmRouter.ts
- Add balanced brace matching (not greedy regex)
- JSON schema validation with Zod
- Retry/re-prompt on parse failures
```

### 8. Analytics Scaling
**Impact**: Better performance as user base grows

```
[NEW] lib/services/analyticsService.ts
- Precomputed stats updated on write
- Avoid full collection reads
- incrementStat('resumesGenerated') on create
```

---

## Updated Priority Matrix

| Issue | Impact | Effort | Priority |
|-------|--------|--------|----------|
| **Admin Config Disconnect (#11)** | **Critical** | **Medium** | **P0** |
| **Central Config Service** | **Critical** | **Low** | **P0** |
| **Feature Flags Enforcement** | **Critical** | **Low** | **P0** |
| Resume Schema Validation (#7) | High | Medium | P0 |
| Auto-Save Divergence (#5) | High | Low | P0 |
| Admin Access Control | High | Low | P1 |
| Safe Storage Wrapper | Medium | Low | P1 |
| LLM Response Hardening | Medium | Medium | P1 |
| Editor Lifecycle (#4) | High | High | P2 |
| Data Model Normalization | High | High | P2 |
| Pipeline Wiring | Medium | Medium | P2 |
| Analytics Scaling | Low | Low | P3 |


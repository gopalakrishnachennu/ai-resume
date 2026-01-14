# AI Resume Builder - Known Issues & Fixes

> **Purpose**: Track edge cases and bugs systematically. Fix one at a time without breaking other features.
> **Last Updated**: 2026-01-08

---

## 🔴 Critical Issues

### Issue #1: ATS Analysis Assumes skills.technical Exists
**Status**: 🔴 Open  
**File**: `app/actions/atsAnalysis.ts:59`  
**Impact**: Older resumes without `skills.technical` crash ATS analysis

**Problem**:
```typescript
resume.skills.technical.join(' ') // ❌ No guard for undefined
```

**Fix**: Add fallback: `(resume.skills?.technical || []).join(' ')`

---

### Issue #2: Resume Generation Assumes experience[0] Exists
**Status**: 🔴 Open  
**File**: `lib/llm-black-box/services/resumeGeneration.ts:171`  
**Impact**: Empty experience crashes AI resume generation

**Problem**:
```typescript
const recentRole = userProfile.experience[0]; // ❌ Crashes if empty
```

**Fix**: Add guard: `const recentRole = userProfile.experience[0] || { title: '' };`

---

### Issue #3: Guest Google Upgrade Uses Wrong Credential
**Status**: 🔴 Open  
**File**: `lib/services/guestService.ts:145-149`  
**Impact**: Guest → Google upgrade always fails

**Problem**:
```typescript
GoogleAuthProvider.credential(
    (await signInWithPopup(auth, provider)).user.uid // ❌ UID is NOT a valid credential
)
```

**Fix**: Use `signInWithPopup` result directly for linking.

---

### Issue #4: jobProcessing tokensUsed NaN Risk
**Status**: 🔴 Open  
**File**: `lib/llm-black-box/services/jobProcessing.ts:153`  
**Impact**: Missing tokensUsed leads to NaN in stats

**Problem**:
```typescript
tokensUsed: existing.data().tokensUsed + tokensUsed // ❌ Could be NaN
```

**Fix**: Add default: `(existing.data().tokensUsed || 0) + tokensUsed`

---

### Issue #5: LLM JSON Parsing is Brittle
**Status**: 🔴 Open  
**File**: `lib/llm-black-box/core/llmRouter.ts:221-230`  
**Impact**: Extra braces or multiple JSON blocks cause parse failures

**Problem**: 
```typescript
const jsonMatch = cleaned.match(/\{[\s\S]*\}/); // ❌ Greedy, can match wrong block
```

**Fix**: Use balanced brace matching or stricter JSON extraction.

---

## 🟡 Medium Priority Issues

### Issue #6: Experience Date Parsing Creates Invalid Dates
**Status**: 🟡 Open  
**File**: `lib/llm-black-box/services/resumeGeneration.ts:313-315`  
**Impact**: Invalid date strings (e.g., "Invalid Date") leak into prompts/exports

**Problem**:
```typescript
const startDate = new Date(exp.startDate); // ❌ Returns Invalid Date on garbage
```

**Fix**: Add validation: `isNaN(startDate.getTime()) ? defaults : startDate`

---

### Issue #7: Export Date Formatting Outputs "Invalid Date"
**Status**: 🟡 Open  
**File**: `lib/services/resumeExportService.ts:36-44`  
**Impact**: PDFs/DOCX show "Invalid Date" for malformed dates

**Problem**: `toLocaleDateString` returns "Invalid Date" string, not an error.

**Fix**: Check `isNaN(date.getTime())` before formatting.

---

### Issue #8: jobAnalysis Parsed Without try/catch
**Status**: 🟡 Open  
**File**: `app/editor/[id]/page.tsx:750-753`  
**Impact**: Corrupted jobAnalysis in localStorage crashes editor

**Problem**:
```typescript
const analysisStr = localStorage.getItem('jobAnalysis');
if (analysisStr) setJobAnalysis(JSON.parse(analysisStr)); // ❌ No try/catch
```

**Fix**: Wrap in try/catch, clear on error.

---

### Issue #9: Auto-Save Disabled for new Resumes
**Status**: 🟡 Open  
**File**: `app/editor/[id]/page.tsx:583-594` + `page.tsx:1330`  
**Impact**: New resumes lost if tab closed before manual save

**Problem**: `performSilentSave` returns early for `params.id === 'new'`.

**Fix**: Generate temp ID immediately on first keystroke.

---

### Issue #10: Session Expires Without Warning
**Status**: 🟡 Open  
**File**: `lib/services/sessionService.ts:314`  
**Impact**: Extension uses stale session data after 24 hours

**Fix**: Add expiry check and refresh prompt in popup.

---

### Issue #11: Auto-Save Race Condition
**Status**: 🟡 Open  
**File**: `lib/hooks/useAutoSave.ts:60`  
**Impact**: Rapid edits during slow save could lose last edit

**Fix**: Queue the save request instead of skipping.

---

## 🟠 Low Priority Issues

### Issue #12: Dashboard Query Races
**Status**: 🟠 Open  
**File**: `app/dashboard/page.tsx:267-271`  
**Impact**: Rapid filter changes can show stale data

**Fix**: Use debounce or abort controller for queries.

---

### Issue #13: Draft Age Check Too Strict
**Status**: 🟠 Open  
**File**: `app/editor/[id]/page.tsx:672`  
**Impact**: Draft older than 24 hours is discarded

**Fix**: Increase to 7 days or ask user before discarding.

---

### Issue #14: Delete Collection Guessing
**Status**: 🟠 Open  
**File**: `app/dashboard/page.tsx:576-609`  
**Impact**: Non-standard IDs could delete from wrong collection

**Fix**: Store collection source in application metadata.

---

### Issue #15: Job Title Blur Navigates to Dashboard
**Status**: 🟠 Open  
**File**: `app/editor/[id]/page.tsx` (handleSave on blur)  
**Impact**: Accidental blur ejects user mid-edit

**Fix**: Don't trigger navigation on blur, only on explicit save.

---

## ❌ Not Bugs (Verified False Positives)

| Reported Issue | Reason Not a Bug |
|----------------|------------------|
| LocalStorage not guarded | Lines 662-747 **have** try/catch around JSON.parse |
| Imported resume autosave loses edits | Load path checks BOTH `updatedResume` and `resume` fields |
| ApplicationService.updateWithResume no existence check | Line 115 **does** `getDoc` first |
| ResumePipeline validation | Skills param is `string[]`, not arrays to validate |

---

## ✅ Completed Fixes

<!-- 
Template for completed items:
### Issue #X: [Title]
**Status**: ✅ Fixed  
**Fixed Date**: YYYY-MM-DD  
**Notes**: Brief description of the fix
-->

---

## 📋 Fix Process

1. **Pick one issue** from the top of the priority list
2. **Write the fix** - minimal changes only
3. **Test locally** - verify fix works
4. **Update this doc** - move to Completed
5. **Commit & deploy**

---

## 🔧 Extension Issues (Deferred)

| Issue | File | Impact |
|-------|------|--------|
| Session expiration not checked | `listener.ts:163` | Stale sessions |
| Undefined `config` reference | `popup.js:329` | Dashboard crashes |
| Buffer conversion silent fail | `listener.ts:286-312` | Resume not stored |

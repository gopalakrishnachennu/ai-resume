# App Flow Diagram (Text-Based)

> Purpose: Show end-to-end flow, wiring, and choke points for the current app.

---

## 1) App Boot + Auth Flow

```
User hits app
  │
  ├─ authStore (store/authStore.ts)
  │    └─ onAuthStateChanged → set user state
  │
  ├─ useGuestAuth (lib/hooks/useGuestAuth.ts)
  │    └─ onAuthStateChanged → getGlobalSettings()
  │         ├─ if guest enabled & not requireLogin → initializeGuestUser()
  │         └─ else → stay unauthenticated
  │
  └─ UI routes decide where to go next
```

Chokepoints:
- `auth.requireLogin` is read from static `APP_CONFIG`, not admin settings.
- Guest/limit rules depend on `settings/global`.

---

## 2) Generate Flow (JD → Analysis → Resume)

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
- LLM JSON parsing fragile.
- Feature toggles not enforced (admin settings).
- Mixed storage targets (resumes / applications).

---

## 3) Editor Flow (Load → Edit → Save/Export)

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

---

## 4) Dashboard Flow (Unified Applications View)

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

---

## 5) Admin Flow

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

---

## 6) Import / Quick Format Flow

```
Import Page
  │
  ├─ Upload JSON / Paste Resume
  │    └─ Parse via sessionService.ts
  │
  ├─ Create application
  │    └─ ApplicationService.createFromImport()
  │         → applications/{app_import_*}
  │
  └─ Redirect to editor (/editor/app_import_*)
```

Chokepoints:
- Parse logic assumes specific JSON structure.
- No validation before storing.

---

## 7) Profile Setup Flow

```
Profile Page (/profile)
  │
  ├─ Load users/{uid}
  │    ├─ profile (name, phone, location, links)
  │    ├─ baseExperience[]
  │    ├─ baseEducation[]
  │    └─ baseSkills
  │
  ├─ Save updates to users/{uid}
  │
  └─ Used as defaults when creating new resumes
```

Chokepoints:
- Profile fields use `institution`, editor expects `school`.
- No sync between profile updates and existing resumes.

---

## 8) Extension Sync Flow

```
User Logs In (non-anonymous)
  │
  └─ useGuestAuth() → syncToExtension()
       │
       ├─ extensionBridge.ts
       │    ├─ Check if extension installed
       │    └─ Send user identity + session
       │
       └─ Extension stores in chrome.storage.local
            └─ Used for auto-fill, job capture
```

Chokepoints:
- Session expiry not checked (24h TTL).
- Extension reads cached session without refresh.

---

## 9) Data Stores & Sources of Truth

```
Firestore:
  users/{uid}
  applications/{id}
  resumes/{id}
  appliedResumes/{id}
  jobs/{id}
  settings/global
  settings/prompts

Local Storage:
  draft_resume_{id}
  jobAnalysis
  jobDescription
```

Chokepoints:
- Multiple resume schemas and collections.
- Local storage used as a functional dependency instead of cache.

---

## 10) Recommended Wiring Consolidation (Target)

```
Config:
  getRuntimeConfig() → merges APP_CONFIG + settings/global
  guardFeature('pdfExport', config)

Resume:
  ResumeSchema (Zod)
  ResumeAdapter (legacy/import → canonical)
  Store only applications/{id}.resume (canonical)

Editor:
  useResumeLoader()
  useResumeAutosave()
  useResumePersistence()
  useATSScoring()
```

Outcome:
- Predictable admin control.
- Single resume schema.
- Reduced regressions and easier testing.

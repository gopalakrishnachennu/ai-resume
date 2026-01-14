# Enterprise Features Roadmap

> **Purpose**: Feature roadmap for corporate/enterprise-grade product readiness.
> **Owner**: Product & Engineering
> **Last Updated**: 2026-01-08

---

## Current State Assessment

### ✅ What Exists Today

| Feature | Status | Location |
|---------|--------|----------|
| Binary Admin Role | ✅ | `useAdminAuth.ts` - checks `admins/{uid}.isAdmin` |
| Admin Template CRUD | ✅ | `templateService.ts` - publish/unpublish |
| Admin Prompt Management | ✅ | `promptService.ts` - global prompts with priority |
| Feature Toggles | ✅ | `appConfig.ts` - per-feature booleans |
| Guest Usage Limits | ✅ | `appConfig.guest.limits` |
| AI Provider Toggles | ✅ | `appConfig.ai.providers` |
| Global API Key | ✅ | `appConfig.ai.globalKey` |

### ❌ What's Missing

Everything else in the wishlist below.

---

## Enterprise Roadmap

### Phase 1: Access Control (Week 1-4)

#### 1.1 Role-Based Access Control (RBAC)
**Priority**: P0 (Critical)

| Role | Permissions |
|------|-------------|
| Super Admin | Full system access, user management, billing |
| Org Admin | Org settings, user invites, template approval |
| HR Manager | View team data, manage templates, export reports |
| Recruiter | Create/edit own resumes, use approved templates |
| Viewer | Read-only access to shared resumes |

**Implementation**:
```typescript
interface UserRole {
  role: 'super_admin' | 'org_admin' | 'hr_manager' | 'recruiter' | 'viewer';
  organizationId: string;
  permissions: Permission[];
}

type Permission = 
  | 'users:manage' | 'users:view'
  | 'templates:create' | 'templates:approve' | 'templates:use'
  | 'prompts:edit' | 'prompts:lock'
  | 'exports:pdf' | 'exports:docx'
  | 'analytics:view' | 'analytics:export'
  | 'settings:org' | 'settings:global';
```

#### 1.2 Organization/Workspace Model
**Priority**: P0 (Critical)

```
organizations/
  {orgId}/
    name: string
    plan: 'free' | 'team' | 'enterprise'
    members: { [uid]: UserRole }
    settings: OrgSettings
    
    templates/     # Org-shared templates
    resumes/       # Org-shared resumes (optional)
    prompts/       # Org-customized prompts
```

**Features**:
- Team-scoped data isolation
- Shared templates library
- Shared resume bank (opt-in)
- Team-level analytics

---

### Phase 2: Governance (Week 5-8)

#### 2.1 Feature Flags per Org
**Priority**: P1

```typescript
interface OrgFeatureFlags {
  aiGeneration: boolean;
  atsScan: boolean;
  docxExport: boolean;
  pdfExport: boolean;
  customTemplates: boolean;
  chromeExtension: boolean;
  apiAccess: boolean;
}
```

**Admin UI**: Toggle switches per org in Super Admin panel.

#### 2.2 AI Provider Policy
**Priority**: P1

```typescript
interface ProviderPolicy {
  allowedProviders: ('openai' | 'gemini' | 'claude')[];
  defaultProvider: string;
  useGlobalKey: boolean;       // Force org's key
  maxTokensPerRequest: number;
  temperatureCap: number;      // 0.0 - 1.0
  monthlyTokenBudget: number;
}
```

#### 2.3 Template Governance
**Priority**: P1

```typescript
interface Template {
  status: 'draft' | 'pending_review' | 'approved' | 'deprecated';
  version: number;
  approvedBy: string;          // Admin UID
  approvedAt: Timestamp;
  changelog: string[];
}
```

**Workflow**:
1. Creator submits template → `pending_review`
2. Org Admin reviews → `approved` or feedback
3. Only approved templates visible to users
4. Deprecation removes from selection, keeps history

#### 2.4 Prompt Governance
**Priority**: P2

```typescript
interface PromptVersion {
  version: number;
  content: string;
  createdBy: string;
  createdAt: Timestamp;
  status: 'draft' | 'testing' | 'production' | 'rolled_back';
  testResults?: { atsScore: number; samples: string[] };
}
```

**Features**:
- Lock prompts (prevent user override)
- Staged edits with preview
- Rollback to previous version
- Testing sandbox before deploy

---

### Phase 3: Usage & Quotas (Week 9-12)

#### 3.1 Quota System
**Priority**: P1

```typescript
interface OrgQuotas {
  perOrg: {
    resumeGenerations: number;   // Per month
    aiTokens: number;            // Per month
    storageGB: number;
    exportsPDF: number;
    exportsDOCX: number;
  };
  perUser: {
    resumeGenerations: number;   // Per month
    aiTokens: number;
  };
  enforcement: 'hard' | 'soft';  // Hard = block, Soft = warn
}
```

**Admin UI**:
- Set quotas per org
- View usage dashboards
- Receive alerts at 80%, 95%
- Manual quota increase

#### 3.2 Spend Controls
**Priority**: P2

```typescript
interface SpendControls {
  monthlyBudget: number;        // USD
  alertThresholds: number[];    // [50, 80, 95]
  autoDisableAt: number;        // 100 = disable at budget
  billingContact: string;       // Email for alerts
}
```

---

### Phase 4: Audit & Compliance (Week 13-16)

#### 4.1 Audit Logs
**Priority**: P1

```typescript
interface AuditEvent {
  eventId: string;
  timestamp: Timestamp;
  userId: string;
  organizationId: string;
  action: AuditAction;
  resource: { type: string; id: string };
  details: Record<string, any>;
  ip: string;
  userAgent: string;
}

type AuditAction = 
  | 'user.login' | 'user.logout' | 'user.invite' | 'user.remove'
  | 'resume.create' | 'resume.edit' | 'resume.delete' | 'resume.export'
  | 'template.create' | 'template.approve' | 'template.delete'
  | 'prompt.edit' | 'prompt.lock' | 'prompt.rollback'
  | 'settings.update' | 'quota.override'
  | 'admin.impersonate' | 'admin.cache_clear';
```

**Retention**: 90 days default, configurable per org.

#### 4.2 Data Retention & Deletion
**Priority**: P1

```typescript
interface RetentionPolicy {
  resumeRetentionDays: number;       // Auto-delete after X days
  auditLogRetentionDays: number;
  legalHoldEnabled: boolean;         // Prevent deletion
  purgeTool: boolean;                // Manual purge UI
  exportTool: boolean;               // GDPR export
}
```

**Admin Actions**:
- Set retention window per org
- Place/release legal hold
- Export all user data (GDPR)
- Purge user data

#### 4.3 Compliance Controls
**Priority**: P2

```typescript
interface ComplianceSettings {
  piiRedactionEnabled: boolean;      // Auto-mask SSN, etc.
  exportWatermark: boolean;          // Add org watermark to PDFs
  dataResidency: 'us' | 'eu' | 'asia';
  encryptionAtRest: boolean;
}
```

---

### Phase 5: Security (Week 17-20)

#### 5.1 Authentication Security
**Priority**: P0 for Enterprise

| Feature | Description |
|---------|-------------|
| Domain-Restricted Signup | Only `@company.com` can join |
| SSO/SAML | Okta, Azure AD, Google Workspace |
| MFA Enforcement | Per-org toggle, required for admins |
| Session Management | Max concurrent, timeout, forced logout |

#### 5.2 Network Security
**Priority**: P2

```typescript
interface SecuritySettings {
  ipAllowlist: string[];             // CIDR ranges
  apiRateLimits: { rpm: number };
  sessionTimeout: number;            // Minutes
  concurrentSessions: number;
}
```

---

### Phase 6: Analytics & Reporting (Week 21-24)

#### 6.1 Activity Reporting
**Priority**: P2

| Report | Metrics |
|--------|---------|
| Usage by Team | Resumes created, AI calls, exports |
| Success Rates | ATS scores, generation success % |
| ATS Deltas | Score improvements over time |
| Export Stats | PDF vs DOCX, by user/team |
| AI Usage | Tokens by provider, by prompt type |

**Export Formats**: CSV, PDF, scheduled email.

#### 6.2 Support Tooling
**Priority**: P2

| Tool | Purpose | Audit |
|------|---------|-------|
| Impersonate User | Debug as user | ✅ Logged |
| User Reset | Clear user data | ✅ Logged |
| Cache Clear | Force refresh | ✅ Logged |
| Forced Logout | Security response | ✅ Logged |
| Backup/Restore | Template & prompt recovery | ✅ Logged |

---

## Implementation Priority

| Phase | Features | Timeline | Effort |
|-------|----------|----------|--------|
| **Phase 1** | RBAC, Orgs | Week 1-4 | High |
| **Phase 2** | Feature Flags, Governance | Week 5-8 | Medium |
| **Phase 3** | Quotas, Spend Controls | Week 9-12 | Medium |
| **Phase 4** | Audit, Retention | Week 13-16 | Medium |
| **Phase 5** | SSO, Security | Week 17-20 | High |
| **Phase 6** | Analytics, Support | Week 21-24 | Low |

---

## Quick Wins (Can Do This Week)

1. **Domain-restricted signup** - Add setting + check in `authService.signup()`
2. **Audit log table** - Create Firestore `auditLogs` collection
3. **Usage dashboard** - Add admin page with query on `users` collection
4. **Template versioning** - Add `version` field to templates

---

## Dependencies

- **Firebase Security Rules** - Must update for org-scoped access
- **Admin UI** - Need pages for all settings
- **Billing Integration** - Stripe/similar for spend controls
- **SSO Provider** - NextAuth.js or Firebase Auth extension

---

## Out of Scope (For Now)

- Multi-tenant SaaS with custom domains
- White-labeling
- On-premise deployment
- API marketplace

# Documentation

> **Location**: `/docs/`  
> **Purpose**: Track bugs, architecture improvements, and enterprise roadmap

---

## Files

| Document | Purpose |
|----------|---------|
| [`CONSOLIDATED.md`](./CONSOLIDATED.md) | Single source of truth (issues + architecture + roadmap + flow) |
| [`ISSUES.md`](./ISSUES.md) | Bug tracker with 15 verified issues |
| [`ARCHITECTURE_IMPROVEMENTS.md`](./ARCHITECTURE_IMPROVEMENTS.md) | 12 systemic patterns + flow review + improvements |
| [`ENTERPRISE_ROADMAP.md`](./ENTERPRISE_ROADMAP.md) | Enterprise feature wishlist (RBAC, orgs, SSO, etc.) |

---

## Quick Reference

### Priority Order

**P0 - Fix Now:**
1. Admin Config Disconnect (toggles don't work)
2. Central Config Service 
3. Feature Flags Enforcement
4. 5 Critical Bugs in ISSUES.md

**P1 - Next Sprint:**
- Admin Access Control
- Safe Storage Wrapper  
- LLM Response Hardening

**P2 - Later:**
- Data Model Normalization
- Editor Refactoring
- Pipeline Wiring

---

## Document Owners

| Doc | Owner | Update Frequency |
|-----|-------|-----------------|
| ISSUES.md | Engineering | Per bug fix |
| ARCHITECTURE_IMPROVEMENTS.md | Tech Lead | Weekly |
| ENTERPRISE_ROADMAP.md | Product | Quarterly |

# Changelog

## [2.3.0] - 2025-12-19

### Added
- **Profile Name Sync:** AI-generated resumes now automatically use the First and Last Name from your Profile Settings as the "Full Name" source.
- **Editor Auto-fill:** The resume editor now intelligently auto-fills the "Full Name" field from your profile if it discovers an empty name in the resume.
- **Cached Draft Repair:** Added logic to repair stale local drafts that were missing name data by injecting the current profile name.

### Fixed
- **Editor Crash:** Resolved a "Client-side Exception" that occurred when loading corrupt or incomplete local drafts. Added robust safety checks to the resume loading logic.
- **Quick Format Import:** Fixed an issue where imported resumes (Quick Format) were not receiving the name auto-fill benefit.

### Changed
- Refactored `loadData` in the Editor to prioritize profile fetching and data integrity.

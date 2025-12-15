# JobFiller Pro V2 - Chrome Extension

> **AI-Powered Job Application Auto-Filler** - Fill 100+ job applications in minutes, not hours.

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/gopalakrishnachennu/ai-resume)
[![Chrome Extension](https://img.shields.io/badge/platform-Chrome-green.svg)](https://chrome.google.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

---

## 🚀 Features

### Core Functionality
- **🤖 AI-Powered Form Filling** - Uses Groq LLM to intelligently answer complex questions
- **📝 Sequential Field Fill** - Fills fields one-by-one with visual progress overlay
- **📄 Resume Auto-Upload** - Automatically attaches PDF/DOCX resumes to file inputs
- **🔄 Profile Sync** - One-click sync from the web dashboard to extension

### Supported Job Portals
| Portal | Support Level | Notes |
|--------|---------------|-------|
| **Lever** | ✅ Full | Native & custom dropdowns |
| **Greenhouse** | ✅ Full | All field types |
| **Workday** | ✅ Full | Multi-page forms |
| **LinkedIn** | ✅ Full | Easy Apply |
| **Indeed** | ✅ Full | Quick Apply |
| **Generic** | ✅ Fallback | Works on most forms |

### Smart Features
- **6-Tier Matching Engine** - Profile → Canonical → Patterns → Templates → AI → Cache
- **Intelligent Transforms** - Auto-converts gender → pronouns, country → Yes/No, etc.
- **Answer Caching** - Learns from AI responses to speed up repeat questions
- **Auto Cache Clear** - Bad answers are wiped on extension updates

---

## 📦 Installation

### For Development

```bash
# Clone the repository
git clone https://github.com/gopalakrishnachennu/ai-resume.git
cd ai-resume/extension-v2

# Install dependencies
npm install

# Build the extension
npm run build

# For development with hot reload
npm run dev
```

### Load in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension-v2/dist` folder
5. The extension icon should appear in your toolbar

---

## 🔧 Configuration

### Connect to Dashboard

1. Go to your [AI Resume Dashboard](https://ai-resume-builder.vercel.app)
2. Navigate to **Settings → Extension**
3. Click **⚡ Flash** on any resume to sync profile data
4. The extension popup should show "Connected"

### Profile Data Structure

The extension uses this profile structure from your dashboard:

```typescript
interface Profile {
  identity: {
    fullName: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: { city, state, country, full };
    pronouns: string;
  };
  experience: {
    currentTitle: string;
    currentCompany: string;
    totalYears: number;
    history: WorkExperience[];
  };
  education: {
    history: Education[];
  };
  skills: {
    technical: string[];
    soft: string[];
  };
  authorization: {
    authorized: boolean;      // US work authorization
    needSponsor: boolean;     // Visa sponsorship needed
    willingToRelocate: boolean;
  };
  // ... more fields
}
```

---

## 🏗️ Architecture

```
extension-v2/
├── src/
│   ├── adapters/           # Job portal adapters
│   │   ├── base.ts         # Abstract base adapter
│   │   ├── lever.ts        # Lever.co adapter
│   │   ├── greenhouse.ts   # Greenhouse adapter
│   │   ├── workday.ts      # Workday adapter
│   │   └── generic.ts      # Fallback adapter
│   │
│   ├── ai/                 # AI Integration
│   │   ├── groq.ts         # Single question API
│   │   └── groq-batch.ts   # Batch question API
│   │
│   ├── core/               # Core logic
│   │   ├── canonical.ts    # Question→Profile mappings
│   │   ├── patterns.ts     # Regex pattern matching
│   │   ├── transforms.ts   # Value transformations
│   │   └── config.ts       # Configuration
│   │
│   ├── filler/             # Form filling engine
│   │   └── sequential.ts   # Sequential field filler
│   │
│   ├── matcher/            # Multi-tier matcher
│   │   ├── index.ts        # Main matcher logic
│   │   └── cache.ts        # AI answer cache
│   │
│   ├── files/              # File handling
│   │   ├── storage.ts      # Base64 file storage
│   │   └── resume.ts       # Resume attachment
│   │
│   ├── content/            # Content scripts
│   │   └── listener.ts     # Message listener
│   │
│   ├── background/         # Service worker
│   │   └── service-worker.ts
│   │
│   └── ui/                 # User interface
│       ├── popup/          # Extension popup
│       │   ├── popup.html
│       │   ├── popup.css
│       │   └── popup.js
│       └── overlay.ts      # Progress overlay
│
├── dist/                   # Built extension
└── manifest.json           # Extension manifest
```

### Matching Engine (6 Tiers)

```
Question: "What is your email address?"
         ↓
┌─────────────────────────────────────────────┐
│ Tier 1: Profile Direct Match                │
│ "email" → profile.identity.email ✓          │
└─────────────────────────────────────────────┘
         ↓ (if no match)
┌─────────────────────────────────────────────┐
│ Tier 2: Canonical Mappings                  │
│ "your email address" → identity.email       │
└─────────────────────────────────────────────┘
         ↓ (if no match)
┌─────────────────────────────────────────────┐
│ Tier 3: Regex Patterns                      │
│ /e-?mail/i → identity.email                 │
└─────────────────────────────────────────────┘
         ↓ (if no match)
┌─────────────────────────────────────────────┐
│ Tier 4: Answer Templates                    │
│ Static/computed answers                     │
└─────────────────────────────────────────────┘
         ↓ (if no match)
┌─────────────────────────────────────────────┐
│ Tier 5: Groq AI (LLM)                       │
│ Batch questions → AI response               │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│ Tier 6: Cache                               │
│ Store AI answers for future use             │
└─────────────────────────────────────────────┘
```

---

## 💻 Usage

### Auto-Fill a Job Application

1. Navigate to any supported job application page
2. Click the **JobFiller Pro** extension icon
3. Click **"Auto-Fill Form"**
4. Watch fields fill sequentially with the progress overlay
5. Review and submit!

### Manual Resume Upload

1. Open the extension popup
2. In the "Resume Files" section:
   - Click **📕 PDF** to upload PDF resume
   - Click **📘 DOCX** to upload DOCX resume
3. The file attaches to any file input on the current page

### Sync Profile Data

1. Click **🔄 Refresh** in the popup to re-sync from Firebase
2. Or go to Dashboard → Settings → Extension → **⚡ Flash**

---

## 🔑 API Keys

### Groq API (Required for AI)

1. Get a free API key from [console.groq.com](https://console.groq.com)
2. Add it in Dashboard → Settings → API Keys → Groq
3. Click **⚡ Flash** to sync to extension

### Supported Models

- `llama-3.1-8b-instant` (default, fastest)
- `llama-3.1-70b-versatile` (more accurate)
- `mixtral-8x7b-32768`

---

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Extension not connecting | Go to Dashboard → Settings → Extension → Flash |
| Fields not filling | Check console for `[Lever]` or `[Sequential]` logs |
| Wrong AI answers | Extension auto-clears cache on update; reload extension |
| Dropdowns not selecting | Open an issue with the job portal URL |
| Resume not uploading | Ensure PDF/DOCX is synced (shows "✓ Ready") |

### Debug Logs

Open DevTools Console (F12) and look for:
- `[Sequential]` - Form filling progress
- `[Lever]` / `[Greenhouse]` - Adapter-specific logs
- `[Groq Batch]` - AI API calls
- `[Cache]` - Answer caching

---

## 📊 Stats

The extension tracks (locally only):
- Fields filled today
- Total fields filled
- Cache hit rate

View in the extension popup.

---

## 🛡️ Privacy

- **No data sent to external servers** (except Groq API for AI answers)
- Profile data stored in `chrome.storage.local`
- Resume files stored as Base64 in local storage
- All processing happens client-side

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](../LICENSE) file

---

## 🙏 Acknowledgments

- [Groq](https://groq.com) - Ultra-fast LLM inference
- [Vite](https://vitejs.dev) - Lightning-fast build tool
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/)

---

**Made with ❤️ by [Gopalakrishna Chennu](https://github.com/gopalakrishnachennu)**

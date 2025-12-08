# 🚀 Firebase Hosting CI/CD Setup Guide

## ✅ **What's Been Set Up:**

1. ✅ **GitHub Actions Workflow** (`.github/workflows/firebase-hosting.yml`)
2. ✅ **Firebase Configuration** (`firebase.json`)
3. ✅ **Next.js Static Export** (`next.config.ts`)

---

## 📋 **Setup Steps:**

### **Step 1: Install Firebase CLI**

```bash
npm install -g firebase-tools
```

### **Step 2: Login to Firebase**

```bash
firebase login
```

### **Step 3: Initialize Firebase Hosting**

```bash
firebase init hosting
```

**Select:**
- ✅ Use existing project (select your project)
- ✅ Public directory: `out`
- ✅ Configure as single-page app: `Yes`
- ✅ Set up automatic builds with GitHub: `No` (we'll use GitHub Actions)

### **Step 4: Get Firebase Service Account**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **⚙️ Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Download the JSON file

### **Step 5: Add GitHub Secrets**

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

#### **Firebase Secrets:**
```
FIREBASE_SERVICE_ACCOUNT
```
- Paste the **entire contents** of the service account JSON file

```
FIREBASE_PROJECT_ID
```
- Your Firebase project ID (e.g., `ai-resume-builder-12345`)

#### **Firebase Config Secrets (from your .env.local):**
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

---

## 🎯 **How It Works:**

### **Automatic Deployment Flow:**

```
1. You push code to GitHub (main/master branch)
   ↓
2. GitHub Actions triggers automatically
   ↓
3. Installs dependencies (npm ci)
   ↓
4. Builds Next.js app (npm run build)
   ↓
5. Deploys to Firebase Hosting
   ↓
6. Your site is LIVE! 🎉
```

---

## 🧪 **Test the Setup:**

### **1. Build Locally First**

```bash
npm run build
```

This creates the `out` folder with your static site.

### **2. Test Firebase Hosting Locally**

```bash
firebase serve
```

Visit `http://localhost:5000` to preview.

### **3. Manual Deploy (Optional)**

```bash
firebase deploy --only hosting
```

### **4. Push to GitHub (Automatic Deploy)**

```bash
git add .
git commit -m "Setup Firebase Hosting CI/CD"
git push origin main
```

**GitHub Actions will automatically:**
- ✅ Build your app
- ✅ Deploy to Firebase
- ✅ Show deployment URL in Actions tab

---

## 📊 **Monitor Deployments:**

### **GitHub Actions:**
- Go to **Actions** tab in your repo
- See build logs and deployment status

### **Firebase Console:**
- Go to **Hosting** section
- See deployment history and URLs

---

## 🔧 **Configuration Files:**

### **`.github/workflows/firebase-hosting.yml`**
- Defines the CI/CD pipeline
- Runs on every push to main/master
- Builds and deploys automatically

### **`firebase.json`**
- Firebase Hosting configuration
- Points to `out` directory (Next.js static export)
- Sets up rewrites for SPA routing
- Configures caching headers

### **`next.config.ts`**
- Enables static export (`output: 'export'`)
- Disables image optimization (not needed for static)
- Adds trailing slashes for better routing

---

## 🎉 **Benefits:**

- ✅ **Automatic Deployment**: Push to GitHub → Auto-deploy
- ✅ **Fast CDN**: Firebase Hosting uses Google's global CDN
- ✅ **Free SSL**: Automatic HTTPS
- ✅ **Custom Domain**: Easy to add
- ✅ **Rollback**: Easy to revert to previous versions
- ✅ **Preview Channels**: Test before going live

---

## 🌐 **Your Deployment URL:**

After first deployment, you'll get:
```
https://YOUR-PROJECT-ID.web.app
https://YOUR-PROJECT-ID.firebaseapp.com
```

---

## 🚨 **Important Notes:**

1. **Static Export Limitations:**
   - No API routes (use Firebase Functions if needed)
   - No server-side rendering
   - No dynamic routes (unless pre-generated)

2. **Environment Variables:**
   - Must start with `NEXT_PUBLIC_` to be included in build
   - Set them as GitHub Secrets

3. **Build Time:**
   - First build may take 3-5 minutes
   - Subsequent builds are faster with caching

---

## 🎯 **Next Steps:**

1. ✅ Add GitHub secrets (Step 5 above)
2. ✅ Push code to GitHub
3. ✅ Watch GitHub Actions deploy
4. ✅ Visit your live site!

**Your AI Resume Builder will be live on Firebase Hosting!** 🚀

// Form Filling Diagnostics - Quality checks to identify issues
// Run this to see what's working and what's not

const FormDiagnostics = {
    results: {},

    // Run all diagnostic checks
    async runAll() {
        console.log('\n═══════════════════════════════════════════════');
        console.log('🔍 JobFiller Pro - DIAGNOSTICS');
        console.log('═══════════════════════════════════════════════\n');

        await this.checkStoredData();
        await this.checkSessionData();
        await this.checkFieldDetection();
        await this.checkValueResolution();
        await this.checkGroqConfig();

        this.printSummary();
        return this.results;
    },

    // Check 1: Stored data in chrome.storage.local
    async checkStoredData() {
        console.log('📦 CHECK 1: Chrome Storage Data');
        console.log('─────────────────────────────────');

        try {
            const data = await chrome.storage.local.get(null);

            const checks = {
                userProfile: !!data.userProfile,
                flashSession: !!data.flashSession,
                firebaseUserId: !!data.firebaseUserId,
                groqApiKeys: !!(data.groqApiKeys && data.groqApiKeys.length > 0),
                groqSettings: !!data.groqSettings,
            };

            this.results.storage = checks;

            console.log('  ✅ userProfile:', checks.userProfile ? 'EXISTS' : '❌ MISSING');
            console.log('  ✅ flashSession:', checks.flashSession ? 'EXISTS' : '❌ MISSING');
            console.log('  ✅ firebaseUserId:', checks.firebaseUserId ? 'EXISTS' : '❌ MISSING');
            console.log('  ✅ groqApiKeys:', checks.groqApiKeys ? `${data.groqApiKeys.length} keys` : '❌ MISSING');
            console.log('  ✅ groqSettings:', checks.groqSettings ? 'EXISTS' : '❌ MISSING');

            if (data.userProfile) {
                console.log('\n  📋 Profile Summary:');
                const p = data.userProfile;
                console.log('    Name:', p.personalInfo?.firstName, p.personalInfo?.lastName || '❌');
                console.log('    Email:', p.personalInfo?.email || '❌');
                console.log('    Phone:', p.personalInfo?.phone || '❌');
                console.log('    LinkedIn:', p.personalInfo?.linkedin || '❌');
                console.log('    Location:', p.personalInfo?.location?.city || '❌');
                console.log('    Experience:', p.experience?.length || 0, 'entries');
                console.log('    Education:', p.education?.length || 0, 'entries');
            }

            console.log('');
        } catch (e) {
            console.log('  ❌ ERROR:', e.message);
            this.results.storage = { error: e.message };
        }
    },

    // Check 2: Flash session data
    async checkSessionData() {
        console.log('⚡ CHECK 2: Flash Session Data');
        console.log('─────────────────────────────────');

        try {
            const data = await chrome.storage.local.get(['flashSession', 'flashSessionTimestamp']);

            if (!data.flashSession) {
                console.log('  ❌ No flash session found');
                console.log('  💡 TIP: Click "Flash" on a resume in the webapp dashboard');
                this.results.flashSession = { exists: false };
                return;
            }

            const session = data.flashSession;
            const age = data.flashSessionTimestamp ?
                ((Date.now() - data.flashSessionTimestamp) / 60000).toFixed(1) + ' mins old' :
                'unknown age';

            console.log('  ✅ Flash session exists (' + age + ')');
            console.log('\n  📋 Session Contents:');
            console.log('    personalInfo:', session.personalInfo ? 'YES' : '❌');
            console.log('    experience:', session.experience?.length || 0, 'entries');
            console.log('    education:', session.education?.length || 0, 'entries');
            console.log('    skills:', session.skills ? 'YES' : '❌');
            console.log('    preferences:', session.preferences ? 'YES' : '❌');

            if (session.personalInfo) {
                console.log('\n  👤 Personal Info Fields:');
                const pi = session.personalInfo;
                const fields = ['firstName', 'lastName', 'email', 'phone', 'linkedin', 'github', 'website'];
                fields.forEach(f => {
                    console.log(`    ${f}: ${pi[f] || '❌ MISSING'}`);
                });
                if (pi.location) {
                    console.log('    city:', pi.location.city || '❌');
                    console.log('    state:', pi.location.state || '❌');
                    console.log('    country:', pi.location.country || '❌');
                }
            }

            this.results.flashSession = {
                exists: true,
                age,
                hasPersonalInfo: !!session.personalInfo,
                hasExperience: session.experience?.length > 0,
                hasEducation: session.education?.length > 0
            };

            console.log('');
        } catch (e) {
            console.log('  ❌ ERROR:', e.message);
            this.results.flashSession = { error: e.message };
        }
    },

    // Check 3: Field detection on current page
    async checkFieldDetection() {
        console.log('🔎 CHECK 3: Field Detection');
        console.log('─────────────────────────────────');

        try {
            // Try to use the FormDetector if available
            if (typeof FormDetector === 'undefined') {
                console.log('  ❌ FormDetector not loaded');
                this.results.fieldDetection = { error: 'FormDetector not loaded' };
                return;
            }

            const detector = new FormDetector();
            detector.init();
            const fields = detector.detectFormFields();

            const categories = ['personal', 'experience', 'education', 'skills', 'preferences', 'documents', 'misc'];
            let totalFields = 0;

            console.log('\n  📊 Detected Fields by Category:');
            categories.forEach(cat => {
                const count = fields[cat]?.length || 0;
                totalFields += count;
                if (count > 0) {
                    console.log(`    ${cat}: ${count} fields`);
                    // Show first 3 fields in each category
                    fields[cat].slice(0, 3).forEach(f => {
                        console.log(`      - ${f.classification || 'unclassified'}: "${f.label || f.placeholder || f.name || 'no label'}"`);
                    });
                    if (fields[cat].length > 3) {
                        console.log(`      ... and ${fields[cat].length - 3} more`);
                    }
                }
            });

            console.log(`\n  📈 Total fields detected: ${totalFields}`);

            // Check for unclassified fields
            let unclassified = 0;
            categories.forEach(cat => {
                fields[cat]?.forEach(f => {
                    if (f.classification === 'unknown' || !f.classification) {
                        unclassified++;
                    }
                });
            });

            if (unclassified > 0) {
                console.log(`  ⚠️ Unclassified fields: ${unclassified}`);
            }

            this.results.fieldDetection = { total: totalFields, unclassified };
            console.log('');
        } catch (e) {
            console.log('  ❌ ERROR:', e.message);
            this.results.fieldDetection = { error: e.message };
        }
    },

    // Check 4: Value resolution for detected fields
    async checkValueResolution() {
        console.log('🎯 CHECK 4: Value Resolution');
        console.log('─────────────────────────────────');

        try {
            const data = await chrome.storage.local.get(['flashSession', 'userProfile']);
            const session = data.flashSession || data.userProfile;

            if (!session) {
                console.log('  ❌ No session data to resolve values');
                this.results.resolution = { error: 'No session data' };
                return;
            }

            if (typeof FieldResolver === 'undefined') {
                console.log('  ❌ FieldResolver not loaded');
                this.results.resolution = { error: 'FieldResolver not loaded' };
                return;
            }

            if (typeof FormDetector === 'undefined') {
                console.log('  ❌ FormDetector not loaded');
                return;
            }

            const detector = new FormDetector();
            detector.init();
            const fields = detector.detectFormFields();

            const allFields = [
                ...(fields.personal || []),
                ...(fields.experience || []),
                ...(fields.education || []),
                ...(fields.preferences || []),
            ];

            let resolved = 0;
            let needsAI = 0;

            console.log('\n  🔄 Resolution Results:');
            allFields.slice(0, 10).forEach(field => {
                const result = FieldResolver.resolve(field, session);
                const label = field.label || field.placeholder || field.name || 'unknown';
                if (result) {
                    resolved++;
                    console.log(`    ✅ ${label} → Tier ${result.tier}: "${(result.value || '').substring(0, 30)}..."`);
                } else {
                    needsAI++;
                    console.log(`    ⚠️ ${label} → NEEDS AI`);
                }
            });

            if (allFields.length > 10) {
                console.log(`    ... and ${allFields.length - 10} more fields`);
            }

            console.log(`\n  📊 Summary: ${resolved} resolvable, ${needsAI} need AI`);

            this.results.resolution = { resolved, needsAI };
            console.log('');
        } catch (e) {
            console.log('  ❌ ERROR:', e.message);
            this.results.resolution = { error: e.message };
        }
    },

    // Check 5: Groq API configuration
    async checkGroqConfig() {
        console.log('🤖 CHECK 5: Groq AI Configuration');
        console.log('─────────────────────────────────');

        try {
            const data = await chrome.storage.local.get(['groqApiKeys', 'groqSettings']);

            if (!data.groqApiKeys || data.groqApiKeys.length === 0) {
                console.log('  ❌ No Groq API keys configured');
                console.log('  💡 TIP: Add API keys in Admin → Extension Settings → Groq AI');
                this.results.groq = { configured: false };
                return;
            }

            console.log(`  ✅ ${data.groqApiKeys.length} API key(s) configured`);

            if (data.groqSettings) {
                console.log('  ⚙️ Settings:');
                console.log(`    Model: ${data.groqSettings.model || 'default'}`);
                console.log(`    Temperature: ${data.groqSettings.temperature || 0.3}`);
                console.log(`    Max tokens: ${data.groqSettings.maxTokensPerField || 150}`);
                console.log(`    Enabled: ${data.groqSettings.enabled !== false ? 'YES' : 'NO'}`);
            }

            // Test API key validity
            if (typeof GroqClient !== 'undefined') {
                console.log('\n  🧪 Testing API key...');
                try {
                    const testResult = await GroqClient.testConnection();
                    console.log('  ✅ API connection: OK');
                } catch (testError) {
                    console.log('  ❌ API test failed:', testError.message);
                }
            }

            this.results.groq = {
                configured: true,
                keyCount: data.groqApiKeys.length,
                enabled: data.groqSettings?.enabled !== false
            };
            console.log('');
        } catch (e) {
            console.log('  ❌ ERROR:', e.message);
            this.results.groq = { error: e.message };
        }
    },

    // Print final summary
    printSummary() {
        console.log('═══════════════════════════════════════════════');
        console.log('📋 DIAGNOSTIC SUMMARY');
        console.log('═══════════════════════════════════════════════\n');

        const issues = [];

        if (!this.results.storage?.userProfile && !this.results.flashSession?.exists) {
            issues.push('❌ No profile data - Flash a resume from the webapp dashboard');
        }
        if (this.results.fieldDetection?.total < 5) {
            issues.push('❌ Low field detection - Form structure may not be recognized');
        }
        if (this.results.resolution?.needsAI > 0 && !this.results.groq?.configured) {
            issues.push('❌ Fields need AI but Groq not configured');
        }
        if (this.results.flashSession?.exists && !this.results.flashSession?.hasPersonalInfo) {
            issues.push('❌ Flash session missing personal info');
        }

        if (issues.length === 0) {
            console.log('  ✅ All checks passed! Form filling should work.');
        } else {
            console.log('  ⚠️ Issues Found:\n');
            issues.forEach(issue => console.log('  ' + issue));
        }

        console.log('\n═══════════════════════════════════════════════\n');
        return issues;
    }
};

// Make it easy to run from console
window.runDiagnostics = () => FormDiagnostics.runAll();

console.log('[JobFiller Pro] Diagnostics loaded. Run: window.runDiagnostics()');

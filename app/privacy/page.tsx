import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy - JobFiller Pro',
    description: 'Privacy Policy for JobFiller Pro Chrome Extension',
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
            <div className="max-w-4xl mx-auto px-6 py-16">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-slate-400">JobFiller Pro Chrome Extension</p>
                    <p className="text-slate-500 text-sm mt-2">Last Updated: December 2024</p>
                </div>

                {/* Content */}
                <div className="prose prose-invert prose-lg max-w-none space-y-8">

                    {/* Overview */}
                    <section className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50">
                        <h2 className="text-2xl font-semibold text-white mb-4">Overview</h2>
                        <p className="text-slate-300">
                            JobFiller Pro (&quot;we&quot;, &quot;our&quot;, &quot;the extension&quot;) is a Chrome extension designed to help users
                            automatically fill job application forms. This privacy policy explains how we handle your data.
                        </p>
                    </section>

                    {/* Data Collection */}
                    <section className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50">
                        <h2 className="text-2xl font-semibold text-white mb-4">Data Collection</h2>

                        <h3 className="text-xl font-medium text-indigo-400 mt-6 mb-3">What We Collect</h3>
                        <ul className="list-disc list-inside text-slate-300 space-y-2">
                            <li><strong>Profile Information:</strong> Name, email, phone, location, work history, skills, and other information you provide for filling job applications.</li>
                            <li><strong>Resume Files:</strong> PDF or document files you choose to sync for attachment to applications.</li>
                            <li><strong>Usage Statistics:</strong> Anonymous counts of forms filled (stored locally, not transmitted).</li>
                        </ul>

                        <h3 className="text-xl font-medium text-green-400 mt-6 mb-3">What We DO NOT Collect</h3>
                        <ul className="list-none text-slate-300 space-y-2">
                            <li>❌ Browsing history</li>
                            <li>❌ Passwords or login credentials</li>
                            <li>❌ Financial information (SSN, bank accounts, credit cards)</li>
                            <li>❌ Personal identifiers beyond what&apos;s needed for applications</li>
                            <li>❌ Any data from websites you don&apos;t actively fill</li>
                        </ul>
                    </section>

                    {/* Data Storage */}
                    <section className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50">
                        <h2 className="text-2xl font-semibold text-white mb-4">Data Storage</h2>
                        <ul className="list-disc list-inside text-slate-300 space-y-2">
                            <li><strong>Local Storage:</strong> All your profile data, settings, and files are stored locally in your browser using Chrome&apos;s secure storage APIs.</li>
                            <li><strong>Dashboard Sync:</strong> When you sync with your dashboard, data is stored in Firebase with proper authentication.</li>
                            <li><strong>Session Data:</strong> Authentication tokens from your dashboard sync are stored locally and expire after 1 hour.</li>
                        </ul>
                    </section>

                    {/* Data Sharing */}
                    <section className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50">
                        <h2 className="text-2xl font-semibold text-white mb-4">Data Sharing</h2>
                        <p className="text-slate-300">
                            We do <strong className="text-green-400">NOT</strong> share, sell, or transmit your personal data to any third parties.
                        </p>
                    </section>

                    {/* Third-Party Services */}
                    <section className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50">
                        <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Services</h2>
                        <ul className="list-disc list-inside text-slate-300 space-y-2">
                            <li><strong>Groq AI (Optional):</strong> If you enable AI-powered form filling, question text (not your personal data) may be sent to Groq&apos;s API for generating answers. See <a href="https://groq.com/privacy/" className="text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">Groq&apos;s Privacy Policy</a>.</li>
                            <li><strong>Firebase:</strong> We use Google Firebase for authentication and data storage. See <a href="https://firebase.google.com/support/privacy" className="text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">Firebase Privacy Policy</a>.</li>
                        </ul>
                    </section>

                    {/* Security */}
                    <section className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50">
                        <h2 className="text-2xl font-semibold text-white mb-4">Security Measures</h2>
                        <ul className="list-disc list-inside text-slate-300 space-y-2">
                            <li>Data is stored using Chrome&apos;s secure storage APIs</li>
                            <li>Authentication tokens expire after 1 hour</li>
                            <li>Sensitive fields (SSN, passwords) are never filled automatically</li>
                            <li>The extension only activates on job application pages</li>
                        </ul>
                    </section>

                    {/* Your Rights */}
                    <section className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50">
                        <h2 className="text-2xl font-semibold text-white mb-4">Your Rights</h2>
                        <p className="text-slate-300 mb-4">You can:</p>
                        <ul className="list-disc list-inside text-slate-300 space-y-2">
                            <li><strong>View</strong> all stored data via Chrome&apos;s extension settings</li>
                            <li><strong>Delete</strong> all data by removing the extension</li>
                            <li><strong>Control</strong> what fields are filled via extension settings</li>
                            <li><strong>Opt-out</strong> of AI features at any time</li>
                        </ul>
                    </section>

                    {/* Data Retention */}
                    <section className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50">
                        <h2 className="text-2xl font-semibold text-white mb-4">Data Retention</h2>
                        <ul className="list-disc list-inside text-slate-300 space-y-2">
                            <li>Data is retained locally until you delete it or uninstall the extension</li>
                            <li>Dashboard data is retained until you delete your account</li>
                        </ul>
                    </section>

                    {/* Contact */}
                    <section className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50">
                        <h2 className="text-2xl font-semibold text-white mb-4">Contact</h2>
                        <p className="text-slate-300">
                            For questions about this privacy policy, please contact us through the dashboard or create an issue on our GitHub repository.
                        </p>
                    </section>

                    {/* Footer */}
                    <div className="text-center text-slate-500 text-sm pt-8 border-t border-slate-700">
                        <p>© 2024 JobFiller Pro. All rights reserved.</p>
                        <a href="/dashboard" className="text-indigo-400 hover:underline mt-2 inline-block">
                            ← Back to Dashboard
                        </a>
                    </div>

                </div>
            </div>
        </div>
    );
}

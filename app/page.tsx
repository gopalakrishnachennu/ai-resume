'use client';

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-cyan-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-20 right-1/4 w-72 h-72 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <header className="glass border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className={`flex items-center gap-3 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl animate-spin-slow opacity-30"></div>
              <div className="absolute inset-0.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              AI Resume Builder
            </span>
          </div>

          <div className={`flex gap-4 ${mounted ? 'animate-fade-in-up animate-delay-200' : 'opacity-0'}`}>
            <Link
              href="/login"
              className="px-5 py-2.5 text-slate-600 hover:text-slate-900 font-medium transition-all duration-300 hover:scale-105"
            >
              Sign In
            </Link>
            <Link
              href="/generate"
              className="relative px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/25 hover:scale-105 overflow-hidden group"
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center mb-20 relative">
          {/* Decorative Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-blob"></div>
          </div>

          <h1 className={`text-6xl md:text-7xl font-extrabold text-slate-900 mb-6 leading-tight ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
            Build ATS-Optimized Resumes
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-gradient-x">
              with AI Assistance
            </span>
          </h1>

          <p className={`text-xl md:text-2xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed ${mounted ? 'animate-fade-in-up animate-delay-200' : 'opacity-0'}`}>
            Paste a job description, and our AI creates a{" "}
            <span className="text-slate-900 font-semibold">perfectly tailored resume</span>
            {" "}in seconds. Get past ATS systems and land more interviews.
          </p>

          <div className={`flex gap-5 justify-center flex-wrap ${mounted ? 'animate-fade-in-up animate-delay-400' : 'opacity-0'}`}>
            <Link
              href="/generate"
              className="group relative px-10 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-lg transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-1 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start Building Free
              </span>
              <div className="absolute inset-0 shimmer-btn"></div>
            </Link>

            <Link
              href="/import"
              className="group px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-lg transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-1 overflow-hidden"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Quick Format
              </span>
            </Link>

            <Link
              href="/login"
              className="px-10 py-4 bg-white/80 backdrop-blur-sm border-2 border-slate-200 text-slate-700 rounded-2xl font-bold text-lg transition-all duration-300 hover:border-slate-300 hover:bg-white hover:shadow-lg hover:-translate-y-1"
            >
              Sign In
            </Link>
          </div>

          {/* Trust Badges */}
          <div className={`mt-16 flex items-center justify-center gap-8 text-slate-400 text-sm ${mounted ? 'animate-fade-in-up animate-delay-600' : 'opacity-0'}`}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Free to start</span>
            </div>
            <div className="w-px h-4 bg-slate-300"></div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>No credit card</span>
            </div>
            <div className="w-px h-4 bg-slate-300"></div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>AI-powered</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          {[
            {
              icon: (
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              ),
              title: "AI-Powered",
              description: "Gemini, Claude, and OpenAI analyze job descriptions and generate perfectly tailored resumes.",
              color: "blue",
              delay: "100"
            },
            {
              icon: (
                <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
              title: "ATS Scoring",
              description: "Real-time ATS score (0-100%) with keyword matching and optimization suggestions.",
              color: "indigo",
              delay: "200"
            },
            {
              icon: (
                <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              ),
              title: "Multiple Formats",
              description: "Export as PDF, DOCX, or LaTeX. Choose from modern, professional, or creative templates.",
              color: "purple",
              delay: "300"
            }
          ].map((feature, index) => (
            <div
              key={index}
              className={`group card-hover icon-hover glass p-8 rounded-3xl border border-white/50 ${mounted ? `animate-fade-in-up animate-delay-${feature.delay}` : 'opacity-0'}`}
            >
              <div className={`icon-animate w-14 h-14 bg-gradient-to-br from-${feature.color}-100 to-${feature.color}-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="mt-32">
          <h2 className={`text-4xl md:text-5xl font-bold text-center text-slate-900 mb-16 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
            How It{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Works</span>
          </h2>

          <div className="relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-8 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 z-0"></div>

            <div className="grid md:grid-cols-4 gap-8 relative z-10">
              {[
                { step: 1, title: "Paste Job Description", desc: "Copy the job posting you're applying for", color: "from-blue-500 to-blue-600" },
                { step: 2, title: "AI Analyzes", desc: "Extracts keywords, skills, and requirements", color: "from-indigo-500 to-indigo-600" },
                { step: 3, title: "Generate Resume", desc: "AI creates tailored resume with high ATS score", color: "from-purple-500 to-purple-600" },
                { step: 4, title: "Download & Apply", desc: "Export as PDF/DOCX and submit with confidence", color: "from-pink-500 to-rose-600" }
              ].map((item, index) => (
                <div
                  key={index}
                  className={`text-center group ${mounted ? `animate-fade-in-up animate-delay-${(index + 1) * 100}` : 'opacity-0'}`}
                >
                  <div className={`relative w-16 h-16 bg-gradient-to-br ${item.color} text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ${mounted ? 'animate-pop-in' : ''}`} style={{ animationDelay: `${0.5 + index * 0.15}s` }}>
                    {item.step}
                    <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2 text-lg">{item.title}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className={`mt-32 text-center ${mounted ? 'animate-fade-in-up animate-delay-800' : 'opacity-0'}`}>
          <div className="glass rounded-3xl p-12 md:p-16 border border-white/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"></div>
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 relative z-10">
              Ready to land your dream job?
            </h3>
            <p className="text-xl text-slate-600 mb-8 relative z-10">
              Join thousands of job seekers using AI to create winning resumes
            </p>
            <Link
              href="/generate"
              className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-lg transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-1 glow-on-hover relative z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Get Started Now — It's Free
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="glass border-t border-white/20 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-lg font-semibold text-slate-800">AI Resume Builder</span>
            </div>
            <p className="text-slate-500 text-sm">
              © 2024 AI Resume Builder. Built with Next.js, Firebase, and AI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

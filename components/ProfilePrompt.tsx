'use client';

import Link from 'next/link';

interface ProfilePromptProps {
    show: boolean;
    onClose: () => void;
    message?: string;
}

export default function ProfilePrompt({ show, onClose, message }: ProfilePromptProps) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
                {/* Icon */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">👤</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Profile Required
                    </h2>
                    <p className="text-gray-600 text-sm">
                        {message || 'We need your profile information to generate a tailored resume'}
                    </p>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-900 font-medium mb-2">
                        📝 What we need:
                    </p>
                    <ul className="text-xs text-blue-700 space-y-1">
                        <li>• Your name and contact information</li>
                        <li>• Work experience (at least one job)</li>
                        <li>• Education background</li>
                        <li>• Skills and qualifications</li>
                    </ul>
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                    <Link
                        href="/profile"
                        className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold text-center hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                    >
                        Complete Profile Now
                    </Link>

                    <button
                        onClick={onClose}
                        className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:border-gray-400 transition-all"
                    >
                        Cancel
                    </button>
                </div>

                <p className="text-xs text-gray-500 text-center mt-4">
                    💡 Your profile will be saved and used for all future resumes
                </p>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { TemplateService } from '@/lib/services/templateService';
import { TemplateSchema, DEFAULT_ATS_TEMPLATE, DEFAULT_MODERN_TEMPLATE } from '@/lib/types/templateSchema';
import { toast } from 'react-hot-toast';

export default function NewTemplatePage() {
    const router = useRouter();
    const { user, loading } = useAuthStore();
    const [name, setName] = useState('');
    const [baseTemplateId, setBaseTemplateId] = useState('ats-default');
    const [creating, setCreating] = useState(false);
    const [publishedTemplates, setPublishedTemplates] = useState<TemplateSchema[]>([]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
            return;
        }
        loadBaseTemplates();
    }, [user, loading, router]);

    const loadBaseTemplates = async () => {
        const templates = await TemplateService.getPublishedTemplates();
        setPublishedTemplates(templates);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Please enter a template name');
            return;
        }

        setCreating(true);
        try {
            // Clone logic: we are creating a NEW template based on the selected base
            // But TemplateService.cloneTemplate takes sourceId.
            // We can simple use that.

            if (!user?.uid) throw new Error('User not found');

            const newId = await TemplateService.cloneTemplate(
                baseTemplateId,
                name.trim(),
                user.uid
            );

            toast.success('Template created!');
            router.push(`/templates/${newId}`);
        } catch (error) {
            console.error('Error creating template:', error);
            toast.error('Failed to create template');
        } finally {
            setCreating(false);
        }
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Create New Template</h1>
                <p className="text-slate-500 mb-6">Start fresh by cloning an existing design.</p>

                <form onSubmit={handleCreate} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Template Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Awesome Resume"
                            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Base Design</label>
                        <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                            {publishedTemplates.map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => setBaseTemplateId(t.id)}
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${baseTemplateId === t.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <div className="font-semibold text-slate-900">{t.name}</div>
                                    <div className="text-xs text-slate-500 truncate">{t.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={creating}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
                        >
                            {creating ? 'Creating...' : 'Create Template'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

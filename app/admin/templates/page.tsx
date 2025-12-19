'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { TemplateService } from '@/lib/services/templateService';
import { TemplateSchema, DEFAULT_ATS_TEMPLATE } from '@/lib/types/templateSchema';
import { toast } from 'react-hot-toast';

export default function AdminTemplatesPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [templates, setTemplates] = useState<TemplateSchema[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        // Check if user is admin (you can customize this check)
        const checkAdmin = async () => {
            if (!user) {
                router.push('/login');
                return;
            }
            // For now, allow any logged-in user; you can add admin check later
            setIsAdmin(true);
            await loadTemplates();
        };
        checkAdmin();
    }, [user, router]);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const allTemplates = await TemplateService.getAllTemplates();
            setTemplates(allTemplates);
        } catch (error) {
            console.error('Error loading templates:', error);
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = async () => {
        try {
            const newId = await TemplateService.createTemplate(
                {
                    ...DEFAULT_ATS_TEMPLATE,
                    name: 'New Template',
                    description: 'Custom template',
                    isPublished: false,
                    atsCompatible: true,
                },
                user?.uid || 'admin'
            );
            toast.success('Template created!');
            router.push(`/admin/templates/${newId}`);
        } catch (error) {
            console.error('Error creating template:', error);
            toast.error('Failed to create template');
        }
    };

    const handleClone = async (template: TemplateSchema) => {
        try {
            const newId = await TemplateService.cloneTemplate(
                template.id,
                `${template.name} (Copy)`,
                user?.uid || 'admin'
            );
            toast.success('Template cloned!');
            await loadTemplates();
            router.push(`/admin/templates/${newId}`);
        } catch (error) {
            console.error('Error cloning template:', error);
            toast.error('Failed to clone template');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;

        try {
            await TemplateService.deleteTemplate(id);
            toast.success('Template deleted');
            await loadTemplates();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete template');
        }
    };

    const handleTogglePublish = async (template: TemplateSchema) => {
        try {
            if (template.isPublished) {
                await TemplateService.unpublishTemplate(template.id);
                toast.success('Template unpublished');
            } else {
                await TemplateService.publishTemplate(template.id);
                toast.success('Template published!');
            }
            await loadTemplates();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update template');
        }
    };

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
                    <p className="text-slate-600 mt-2">You need admin access to view this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
                            ← Back to Dashboard
                        </Link>
                        <h1 className="text-xl font-bold text-slate-900">Template Builder</h1>
                    </div>
                    <button
                        onClick={handleCreateNew}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                    >
                        + New Template
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">Resume Templates</h2>
                    <p className="text-slate-600 mt-1">Create and manage templates for your users</p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map(template => (
                            <div
                                key={template.id}
                                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                            >
                                {/* Template Preview Thumbnail */}
                                <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center border-b">
                                    <div className="text-center">
                                        <div className="text-4xl mb-2">📄</div>
                                        <span className="text-sm text-slate-500">{template.typography?.fontFamily || 'Roboto'}</span>
                                    </div>
                                </div>

                                {/* Template Info */}
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="font-bold text-slate-900">{template.name}</h3>
                                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                                                {template.description}
                                            </p>
                                        </div>
                                        <div className="flex gap-1">
                                            {template.atsCompatible && (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                                    ATS ✓
                                                </span>
                                            )}
                                            {template.isPublished ? (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                                    Live
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs font-medium rounded-full">
                                                    Draft
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-xs text-slate-400 mb-4">
                                        v{template.version || 1} • {template.id.startsWith('ats-') || template.id.startsWith('modern-') ? 'Built-in' : 'Custom'}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/admin/templates/${template.id}`}
                                            className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg text-center hover:bg-slate-200 transition-colors"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => handleClone(template)}
                                            className="px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
                                            title="Clone"
                                        >
                                            📋
                                        </button>
                                        {!template.id.startsWith('ats-') && !template.id.startsWith('modern-') && (
                                            <>
                                                <button
                                                    onClick={() => handleTogglePublish(template)}
                                                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${template.isPublished
                                                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        }`}
                                                    title={template.isPublished ? 'Unpublish' : 'Publish'}
                                                >
                                                    {template.isPublished ? '📤' : '🚀'}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(template.id)}
                                                    className="px-3 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors"
                                                    title="Delete"
                                                >
                                                    🗑️
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

'use client';

import { useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import TemplateBuilder from '@/components/templates/TemplateBuilder';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function UserTemplateEditorPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading } = useAuthStore();
    const templateId = params.id as string;

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <TemplateBuilder
            templateId={templateId}
            userId={user.uid}
            backLink="/settings/templates"
        />
    );
}

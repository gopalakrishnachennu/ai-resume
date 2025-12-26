'use client';

import { useParams } from 'next/navigation';
import TemplateBuilder from '@/components/templates/TemplateBuilder';

export default function AdminTemplateEditorPage() {
    const params = useParams();
    const templateId = params.id as string;

    return (
        <TemplateBuilder
            templateId={templateId}
            backLink="/admin/templates"
        />
    );
}

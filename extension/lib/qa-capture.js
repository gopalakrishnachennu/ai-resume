// Q&A Capture - Captures all filled form questions and answers for interview prep
// Saves to Firebase under applied jobs

const QACapture = {
    // Capture all filled fields as Q&A pairs
    capture: (detectedFields) => {
        const qaList = [];
        const categories = ['personal', 'experience', 'education', 'skills', 'preferences',
            'documents', 'demographics', 'misc', 'other'];

        for (const cat of categories) {
            const fields = detectedFields[cat];
            if (!Array.isArray(fields)) continue;

            for (const field of fields) {
                const element = field.element;
                if (!element) continue;

                const value = QACapture.getFieldValue(element);
                if (!value) continue;

                const question = QACapture.getFieldQuestion(field);
                if (!question) continue;

                qaList.push({
                    question,
                    answer: value,
                    category: cat,
                    classification: field.classification || 'unknown',
                    fieldType: field.type || element.type || 'text',
                    timestamp: Date.now()
                });
            }
        }

        return qaList;
    },

    // Get the question/label for a field
    getFieldQuestion: (field) => {
        // Priority: label > aria-label > placeholder > name
        if (field.label && field.label.trim()) {
            return field.label.trim();
        }
        if (field.ariaLabel && field.ariaLabel.trim()) {
            return field.ariaLabel.trim();
        }
        if (field.placeholder && field.placeholder.trim()) {
            return field.placeholder.trim();
        }
        if (field.name) {
            // Convert camelCase/snake_case to readable
            return field.name
                .replace(/([A-Z])/g, ' $1')
                .replace(/[_-]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        }
        return null;
    },

    // Get the current value of a field
    getFieldValue: (element) => {
        if (!element) return null;

        const tagName = element.tagName?.toLowerCase();

        if (tagName === 'select') {
            const selected = element.options[element.selectedIndex];
            return selected?.text || selected?.value || '';
        }

        if (element.type === 'checkbox') {
            return element.checked ? 'Yes' : 'No';
        }

        if (element.type === 'radio') {
            const name = element.name;
            if (!name) return null;
            const checked = document.querySelector(`input[name="${name}"]:checked`);
            if (!checked) return null;
            // Get label text
            const label = checked.closest('label')?.textContent?.trim();
            return label || checked.value;
        }

        return element.value?.trim() || null;
    },

    // Build application summary for Firebase
    buildApplicationSummary: (qaList, metadata = {}) => {
        return {
            url: window.location.href,
            title: document.title,
            platform: metadata.platform || 'Unknown',
            jobTitle: metadata.jobTitle || QACapture.extractJobTitle(),
            company: metadata.company || QACapture.extractCompany(),
            appliedAt: new Date().toISOString(),
            questionsAnswered: qaList.length,
            qa: qaList.map(qa => ({
                q: qa.question,
                a: qa.answer,
                cat: qa.category
            })),
            // Group by category for easy viewing
            byCategory: QACapture.groupByCategory(qaList)
        };
    },

    // Group Q&A by category
    groupByCategory: (qaList) => {
        const grouped = {};
        for (const qa of qaList) {
            if (!grouped[qa.category]) {
                grouped[qa.category] = [];
            }
            grouped[qa.category].push({
                q: qa.question,
                a: qa.answer
            });
        }
        return grouped;
    },

    // Try to extract job title from page
    extractJobTitle: () => {
        // Common selectors for job title
        const selectors = [
            'h1.job-title', '.job-details-jobs-unified-top-card__job-title',
            '.jobs-unified-top-card__job-title', '.jobsearch-JobInfoHeader-title',
            'h1[data-automation="job-title"]', '.job-title', 'h1'
        ];

        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el?.textContent?.trim()) {
                return el.textContent.trim().substring(0, 200);
            }
        }
        return document.title.split('|')[0]?.trim() || '';
    },

    // Try to extract company name from page
    extractCompany: () => {
        const selectors = [
            '.company-name', '.jobs-unified-top-card__company-name',
            '.jobsearch-InlineCompanyRating-companyHeader',
            '[data-automation="company-name"]', '.employer-name'
        ];

        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el?.textContent?.trim()) {
                return el.textContent.trim().substring(0, 100);
            }
        }
        return '';
    },

    // Save to Firebase via background script
    saveToFirebase: async (applicationData) => {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'SAVE_APPLICATION_QA',
                data: applicationData
            });

            if (response?.success) {
                console.log('[QACapture] Saved to Firebase:', response.docId);
                return { success: true, docId: response.docId };
            } else {
                console.warn('[QACapture] Save failed:', response?.error);
                return { success: false, error: response?.error };
            }
        } catch (error) {
            console.error('[QACapture] Save error:', error);
            return { success: false, error: error.message };
        }
    },

    // Save to local storage as backup
    saveToLocal: async (applicationData) => {
        try {
            const result = await chrome.storage.local.get('appliedJobs');
            const jobs = result.appliedJobs || [];

            jobs.unshift({
                ...applicationData,
                savedLocally: true
            });

            // Keep last 50 applications
            if (jobs.length > 50) jobs.splice(50);

            await chrome.storage.local.set({ appliedJobs: jobs });
            console.log('[QACapture] Saved to local storage');
            return { success: true };
        } catch (error) {
            console.error('[QACapture] Local save error:', error);
            return { success: false, error: error.message };
        }
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QACapture;
}

// Centralized AI Provider Icons
// Using official company SVG logos

export const AIProviderIcons = {
    gemini: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#4285F4" />
            <path d="M2 17L12 22L22 17L12 12L2 17Z" fill="#34A853" />
            <path d="M2 7V17L12 12V2L2 7Z" fill="#FBBC04" />
            <path d="M22 7V17L12 12V2L22 7Z" fill="#EA4335" />
        </svg>
    ),

    openai: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.2819 9.8211C23.1986 8.0856 23.0128 5.9644 21.7261 4.37152C20.4395 2.77865 18.3152 2.04812 16.2927 2.51766C15.0054 0.934515 12.9291 0.0950928 10.8058 0.387787C8.68254 0.680481 6.89801 2.05679 6.02643 4.01186C4.05538 4.42326 2.49598 5.85121 1.87601 7.75122C1.25604 9.65123 1.66824 11.7342 2.95153 13.2871C2.03486 15.0226 2.22064 17.1438 3.50729 18.7367C4.79394 20.3296 6.91828 21.0601 8.94073 20.5906C10.228 22.1737 12.3043 23.0131 14.4276 22.7204C16.5509 22.4277 18.3354 21.0514 19.207 19.0963C21.178 18.6849 22.7374 17.257 23.3574 15.357C23.9774 13.457 23.5652 11.374 22.2819 9.8211Z" fill="#10A37F" />
            <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" fill="white" />
        </svg>
    ),

    claude: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="4" fill="#CC9B7A" />
            <path d="M7 8.5C7 7.67157 7.67157 7 8.5 7H15.5C16.3284 7 17 7.67157 17 8.5V15.5C17 16.3284 16.3284 17 15.5 17H8.5C7.67157 17 7 16.3284 7 15.5V8.5Z" fill="white" />
            <circle cx="12" cy="12" r="3" fill="#CC9B7A" />
        </svg>
    ),
};

export const getProviderConfig = (provider: 'gemini' | 'openai' | 'claude') => {
    const configs = {
        gemini: {
            name: 'Gemini',
            color: 'bg-blue-50 text-blue-700 border-blue-200',
            icon: AIProviderIcons.gemini,
        },
        openai: {
            name: 'ChatGPT',
            color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            icon: AIProviderIcons.openai,
        },
        claude: {
            name: 'Claude',
            color: 'bg-amber-50 text-amber-700 border-amber-200',
            icon: AIProviderIcons.claude,
        },
    };

    return configs[provider];
};

import { Profile } from "../core/profile";

// Approximate typing for Chrome's experimental prompt API
interface AILanguageModel {
    prompt(text: string): Promise<string>;
    promptStreaming(text: string): ReadableStream;
}

interface AICapabilities {
    available: "readily" | "after-download" | "no";
}

declare global {
    interface Window {
        ai?: {
            languageModel?: {
                create(options?: any): Promise<AILanguageModel>;
                capabilities(): Promise<AICapabilities>;
            };
        };
    }
}

export async function askGeminiNano(
    question: string,
    context: { profile: Profile; options?: string[] }
): Promise<string> {
    if (!window.ai?.languageModel) {
        throw new Error("Gemini Nano not supported");
    }

    const caps = await window.ai.languageModel.capabilities();
    if (caps.available === "no") {
        throw new Error("Gemini Nano not available");
    }

    const session = await window.ai.languageModel.create();

    // Condense profile for small context window
    const shortProfile = {
        name: context.profile.identity.fullName,
        email: context.profile.identity.email,
        skills: context.profile.skills.technical.slice(0, 10),
        job: context.profile.role.targetTitle,
        company: context.profile.experience.currentCompany
    };

    const optionsText = context.options?.length
        ? `Options: ${JSON.stringify(context.options)}`
        : "";

    const prompt = `
Context: ${JSON.stringify(shortProfile)}
Question: ${question}
${optionsText}
Answer with only the value.
`;

    try {
        const minResult = await session.prompt(prompt);
        return minResult.trim();
    } catch (e) {
        console.error("Nano failed", e);
        throw e;
    }
}

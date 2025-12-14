import { Profile } from "../core/profile";

interface GroqResponse {
    choices: {
        message: {
            content: string;
        };
    }[];
}

const DEFAULT_MODEL = "llama3-8b-8192";

export async function askGroq(
    question: string,
    context: { profile: Profile; options?: string[] }
): Promise<string> {
    // 1. Get API Key
    const { settings } = await chrome.storage.local.get("settings");
    const apiKey = settings?.groqApiKey;

    if (!apiKey) {
        throw new Error("Groq API Key missing");
    }

    // 2. Construct Prompt
    const profileInfo = JSON.stringify(context.profile, null, 2);
    const optionsInfo = context.options?.length
        ? `Choose strictly from these options: ${JSON.stringify(context.options)}`
        : "Answer concisely.";

    const systemPrompt = `You are a helpful assistant filling out a job application for this user. 
User Profile: ${profileInfo}

Rules:
1. Be truthful based on profile.
2. If info is missing, say "N/A".
3. Output ONLY the answer value, no explanation.
4. ${optionsInfo}`;

    // 3. Call API
    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: settings?.groqModel || DEFAULT_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Question: ${question}` }
                ],
                temperature: 0.1,
                max_tokens: 100
            })
        });

        if (!res.ok) {
            throw new Error(`Groq API Error: ${res.statusText}`);
        }

        const data: GroqResponse = await res.json();
        return data.choices[0]?.message?.content?.trim() || "";

    } catch (error) {
        console.error("Groq AI failed:", error);
        throw error;
    }
}

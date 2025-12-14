import { Profile } from "../core/profile";

interface GroqResponse {
    choices: {
        message: {
            content: string;
        };
    }[];
    error?: {
        message: string;
        code?: string;
    };
}

// Updated to match user's working Python code model
const DEFAULT_MODEL = "llama-3.1-8b-instant";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000; // 2 seconds between retries for rate limits

export async function askGroq(
    question: string,
    context: { profile: Profile; options?: string[] }
): Promise<string> {
    // 1. Get API Key
    const { settings } = await chrome.storage.local.get("settings");
    const apiKey = settings?.groqApiKey;

    if (!apiKey) {
        console.warn("[Groq] No API key configured");
        throw new Error("Groq API Key missing");
    }

    // 2. Construct Prompt (matching user's working Python prompt style)
    const profileInfo = JSON.stringify(context.profile, null, 2);
    const optionsInfo = context.options?.length
        ? `Choose strictly from these options: ${JSON.stringify(context.options)}`
        : "Answer concisely in 1-2 sentences.";

    const systemPrompt = `You are a helpful assistant filling out a job application. 
User Profile: ${profileInfo}

Rules:
1. Be truthful based on profile.
2. If info is missing, say "N/A".
3. Output ONLY the answer value, no explanation or preamble.
4. For Yes/No questions, respond with just "Yes" or "No".
5. For salary questions, respond with just the number like "$140,000".
6. ${optionsInfo}`;

    // 3. Call API with retry logic for rate limits
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
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
                    temperature: 0.2,
                    max_tokens: 150
                })
            });

            // Handle different error codes
            if (res.status === 429) {
                console.warn(`[Groq] Rate limited (attempt ${attempt}/${MAX_RETRIES}). Waiting ${RETRY_DELAY_MS}ms...`);
                await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt)); // Exponential backoff
                lastError = new Error("Rate limited");
                continue;
            }

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(`Groq API Error ${res.status}: ${errorData?.error?.message || res.statusText}`);
            }

            const data: GroqResponse = await res.json();

            if (data.error) {
                throw new Error(`Groq Error: ${data.error.message}`);
            }

            const answer = data.choices?.[0]?.message?.content?.trim();
            if (!answer) {
                throw new Error("Empty response from Groq");
            }

            console.log(`[Groq] Success for "${question.substring(0, 30)}...": ${answer.substring(0, 50)}`);
            return answer;

        } catch (error) {
            lastError = error as Error;
            console.error(`[Groq] Attempt ${attempt} failed:`, error);

            if (attempt < MAX_RETRIES) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }
    }

    throw lastError || new Error("Groq failed after max retries");
}


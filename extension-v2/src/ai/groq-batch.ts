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

interface BatchQuestion {
    id: string;
    question: string;
    options?: string[];
}

interface BatchAnswer {
    id: string;
    answer: string;
}

const DEFAULT_MODEL = "llama-3.1-8b-instant";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Batch ask Groq - Send ALL questions in ONE API call
 * This is the "LLM Box" - scans all questions, gets all answers at once
 */
export async function batchAskGroq(
    questions: BatchQuestion[],
    profile: Profile
): Promise<BatchAnswer[]> {
    // 1. Get API Key
    const { settings } = await chrome.storage.local.get("settings");
    const apiKey = settings?.groqApiKey;

    if (!apiKey) {
        console.warn("[Groq Batch] No API key configured");
        throw new Error("Groq API Key missing");
    }

    if (questions.length === 0) {
        return [];
    }

    console.log(`[Groq Batch] Processing ${questions.length} questions in one call`);

    // 2. Build the batch prompt
    const profileInfo = JSON.stringify(profile, null, 2);

    // Format questions as numbered list with options
    const questionsFormatted = questions.map((q, i) => {
        const optionsText = q.options?.length
            ? `\n   Options: ${JSON.stringify(q.options)}`
            : '';
        return `${i + 1}. [ID:${q.id}] ${q.question}${optionsText}`;
    }).join('\n\n');

    const systemPrompt = `You are a job application assistant helping fill out forms.

CANDIDATE PROFILE:
${profileInfo}

RULES:
1. Answer ONLY based on the profile data provided
2. If info not in profile, respond with "N/A"
3. For Yes/No questions, respond with just "Yes" or "No"
4. For dropdowns with options, pick the CLOSEST matching option
5. For salary questions, respond just the number like "$140,000"
6. Keep answers SHORT and DIRECT - no explanations
7. For pronouns: Male→"He/him", Female→"She/her"

OUTPUT FORMAT:
Respond with EXACTLY one answer per line in format:
[ID:xxx] Your Answer

Example:
[ID:first_name] John
[ID:sponsorship] No
[ID:salary] $140,000`;

    const userPrompt = `Answer ALL these job application questions based on the candidate profile:

${questionsFormatted}`;

    // 3. Call API with retry logic
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
                        { role: "user", content: userPrompt }
                    ],
                    temperature: 0.1,
                    max_tokens: 1500 // Increased for batch responses
                })
            });

            if (res.status === 429) {
                console.warn(`[Groq Batch] Rate limited (attempt ${attempt}/${MAX_RETRIES})`);
                await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
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

            const content = data.choices?.[0]?.message?.content?.trim();
            if (!content) {
                throw new Error("Empty response from Groq");
            }

            console.log("[Groq Batch] Raw response:", content.substring(0, 200));

            // 4. Parse the batch response
            return parseBatchResponse(content, questions);

        } catch (error) {
            lastError = error as Error;
            console.error(`[Groq Batch] Attempt ${attempt} failed:`, error);

            if (attempt < MAX_RETRIES) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }
    }

    throw lastError || new Error("Groq batch failed after max retries");
}

/**
 * Parse the LLM batch response into structured answers
 */
function parseBatchResponse(content: string, questions: BatchQuestion[]): BatchAnswer[] {
    const results: BatchAnswer[] = [];
    const lines = content.split('\n').filter(l => l.trim());

    // Create a map of question IDs for quick lookup
    const questionIds = new Set(questions.map(q => q.id));

    for (const line of lines) {
        // Match pattern: [ID:xxx] Answer
        const match = line.match(/\[ID:([^\]]+)\]\s*(.+)/);
        if (match) {
            const id = match[1].trim();
            const answer = match[2].trim();

            if (questionIds.has(id)) {
                results.push({ id, answer });
                console.log(`[Groq Batch] Parsed: ${id} → ${answer.substring(0, 30)}`);
            }
        }
    }

    // Log any missed questions
    const answeredIds = new Set(results.map(r => r.id));
    for (const q of questions) {
        if (!answeredIds.has(q.id)) {
            console.warn(`[Groq Batch] No answer for: ${q.id}`);
            // Add N/A for missing answers
            results.push({ id: q.id, answer: "N/A" });
        }
    }

    return results;
}

// Re-export single question function for backwards compatibility
export { askGroq } from "./groq";

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
    // 1. Get API Key - Try local storage first, then Firebase
    const { settings } = await chrome.storage.local.get("settings");
    let apiKey = settings?.groqApiKey || settings?.groqApiKeys;
    let model = settings?.groqModel || DEFAULT_MODEL;

    // If no key in local storage, try to get from Firebase (via stored auth)
    if (!apiKey) {
        console.log("[Groq Batch] No key in local storage, checking Firebase...");
        try {
            // Get auth from storage
            const { auth } = await chrome.storage.local.get("auth");
            if (auth?.uid) {
                // Try to get from admin settings via fetch (adminSettings/extension in Firestore)
                const projectId = "ai-resume-f9b01"; // Firebase project ID
                const adminUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/adminSettings/extension`;

                const response = await fetch(adminUrl);
                if (response.ok) {
                    const data = await response.json();
                    const fields = data.fields || {};
                    apiKey = fields.groqApiKeys?.stringValue || fields.groqApiKey?.stringValue;
                    model = fields.groqModel?.stringValue || model;

                    if (apiKey) {
                        console.log("[Groq Batch] ✅ Got API key from Firebase admin settings");
                        // Cache it for next time
                        await chrome.storage.local.set({
                            settings: { ...settings, groqApiKey: apiKey, groqModel: model }
                        });
                    }
                }
            }
        } catch (e) {
            console.warn("[Groq Batch] Firebase fallback failed:", e);
        }
    }

    // If apiKey is multiline (multiple keys), use the first one
    if (apiKey && apiKey.includes('\n')) {
        apiKey = apiKey.split('\n')[0].trim();
    }

    console.log(`[Groq Batch] Settings loaded:`, {
        hasSettings: !!settings,
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey?.length || 0,
        model: model
    });

    if (!apiKey) {
        console.warn("[Groq Batch] No API key configured");
        throw new Error("Groq API Key missing. Open extension popup to sync settings, or add key in admin.");
    }

    if (questions.length === 0) {
        return [];
    }

    console.log(`[Groq Batch] Processing ${questions.length} questions in one call`);

    // 2. Build the batch prompt
    // Extract key skills and experience for the prompt
    const skills = profile.skills?.technical?.join(', ') || 'Python, SQL, JavaScript';
    const experience = profile.experience?.history?.[0] || {};
    const education = profile.education?.history?.[0] || {};

    // Create a focused profile summary instead of dumping entire JSON
    const profileSummary = `
CANDIDATE SUMMARY:
- Name: ${profile.identity?.fullName || 'Candidate'}
- Current Role: ${experience.title || profile.experience?.currentTitle || 'Software Engineer'}
- Current Company: ${experience.company || profile.experience?.currentCompany || 'Tech Company'}
- Technical Skills: ${skills}
- Education: ${education.degree || ''} from ${education.school || 'University'}
- Years of Experience: ${profile.experience?.history?.length || 3}+ years
- Location: ${profile.identity?.location?.city || ''}, ${profile.identity?.location?.state || ''}
`;

    // Format questions with clear type hints
    const questionsFormatted = questions.map((q, i) => {
        const question = q.question.toLowerCase();
        let typeHint = '';

        // Detect question type
        if (question.includes('rate') && (question.includes('1') || question.includes('5') || question.includes('scale'))) {
            typeHint = '(RESPOND WITH A NUMBER 1-5 ONLY)';
        } else if (question.includes('describe') || question.includes('explain') || question.includes('tell us') || question.includes('how have you')) {
            typeHint = '(WRITE 2-3 SENTENCES ABOUT RELEVANT EXPERIENCE)';
        } else if (question.includes('what technical tools') || question.includes('comfortable with')) {
            typeHint = '(LIST SPECIFIC TOOLS/TECHNOLOGIES)';
        }

        const optionsText = q.options?.length
            ? `\n   Options: ${JSON.stringify(q.options)}`
            : '';
        return `${i + 1}. [ID:${q.id}] ${q.question} ${typeHint}${optionsText}`;
    }).join('\n\n');

    const systemPrompt = `You are filling out a job application form. Read each question carefully and provide an appropriate answer.

${profileSummary}

CRITICAL RULES - FOLLOW EXACTLY:

1. READ THE QUESTION CAREFULLY before answering
   - "What technical tools" = Answer with TOOLS like "Python, Apache Airflow, dbt, SQL, Kubernetes"
   - "Rate your experience 1-5" = Answer with JUST A NUMBER like "4" or "5"
   - "Describe how you" = Answer with 2-3 sentences about relevant experience

2. NEVER put education info (degree, university) in a tools/experience question
3. NEVER put dates in a description question
4. For rating questions (1-5 scale), ONLY respond with a single number (e.g., "4")
5. For description questions, write complete sentences about relevant experience

OUTPUT FORMAT - EXACTLY LIKE THIS:
[ID:field_0] Python, Apache Airflow, dbt, SQL, Kubernetes
[ID:field_1] 4
[ID:field_2] I have extensive experience using data quality tools like Great Expectations and dbt tests to implement automated data validation pipelines. These tools helped catch data anomalies early and maintain data integrity.`;

    const userPrompt = `Answer each question based on the candidate's profile. Match the answer type to the question type.

${questionsFormatted}

Remember:
- "tools" questions → list technologies
- "rate 1-5" questions → single number
- "describe" questions → 2-3 sentences`;

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

'use server';

import natural from 'natural';
import stringSimilarity from 'string-similarity';

// Types (re-defined here to avoid client-side type leakage if needed, or import shared types)
interface ResumeData {
    personalInfo: any;
    experience: any[];
    education: any[];
    skills: { technical: string[] };
    technicalSkills?: Record<string, string[] | string>;
    summary: string;
}

export interface AdvancedATSResult {
    totalScore: number;
    sections: {
        keywords: { score: number; max: number; matched: string[]; missing: string[] };
        quality: { score: number; max: number; issues: string[] };
        formatting: { score: number; max: number; issues: string[] };
    };
    feedback: string[];
}

const BUZZWORDS = [
    'go-getter', 'synergy', 'thought leader', 'rockstar', 'ninja', 'guru',
    'hard worker', 'team player', 'motivated', 'passionate', 'driven',
    'strategic', 'visionary', 'expert', 'specialist', 'best of breed'
];

const ACTION_VERBS = [
    'accelerated', 'achieved', 'added', 'awarded', 'changed', 'contributed', 'decreased', 'delivered',
    'eliminated', 'exceeded', 'expanded', 'gained', 'generated', 'grew', 'improved', 'increased',
    'introduced', 'maximized', 'minimized', 'optimized', 'produced', 'reduced', 'saved', 'sold',
    'stabilized', 'started', 'strengthened', 'succeeded', 'surpassed', 'transformed', 'led', 'managed',
    'developed', 'designed', 'created', 'built', 'engineered', 'architected', 'deployed'
];

/**
 * Advanced ATS Analysis using NLP
 * Runs on server to keep client bundle light
 */
export async function analyzeResume(resume: ResumeData, jobDescription?: string): Promise<AdvancedATSResult> {
    const tokenizer = new natural.WordTokenizer();
    const stemmer = natural.PorterStemmer;

    let feedback: string[] = [];
    let qualityScore = 0;
    let keywordScore = 0;
    let formatScore = 0;

    // --- 1. NLP & Keyword Analysis (TF-IDF) ---
    // Extract text from resume
    const resumeText = [
        resume.summary,
        ...resume.experience.map(e => `${e.title} ${e.company} ${e.bullets?.join(' ')}`),
        ...resume.education.map(e => `${e.degree} ${e.field} ${e.school}`),
        resume.skills.technical.join(' '),
        Object.values(resume.technicalSkills || {}).flat().join(' ')
    ].join(' ').toLowerCase();

    const resumeTokens = tokenizer.tokenize(resumeText) || [];
    const resumeStems = resumeTokens.map(t => stemmer.stem(t));

    let matchedKeywords: string[] = [];
    let missingKeywords: string[] = [];

    if (jobDescription) {
        // Advanced: Use TF-IDF to find important words in JD
        const tfidf = new natural.TfIdf();
        tfidf.addDocument(jobDescription);

        // Get top 20 terms from JD
        const importantTerms = tfidf.listTerms(0 /* doc index */)
            .filter(item => item.tfidf > 2 && item.term.length > 3) // Filter out noise
            .slice(0, 20)
            .map(item => item.term);

        importantTerms.forEach(term => {
            const stem = stemmer.stem(term);
            // Check for stem match (e.g., "managing" matches "manage")
            // Or fuzzy match (handle typos)
            const hasStemMatch = resumeStems.includes(stem);

            // Fuzzy match check (slower, but catches "Javascript" vs "Java Script")
            // We search in the raw text for fuzzy matches
            const fuzzyMatches = stringSimilarity.findBestMatch(term, resumeTokens);
            const hasFuzzyMatch = fuzzyMatches.bestMatch.rating > 0.85;

            if (hasStemMatch || hasFuzzyMatch) {
                matchedKeywords.push(term);
            } else {
                missingKeywords.push(term);
            }
        });

        // Score based on coverage of Top 20 terms
        const coverage = importantTerms.length > 0 ? matchedKeywords.length / importantTerms.length : 1;
        keywordScore = Math.round(coverage * 40); // Max 40 pts for keywords

        if (missingKeywords.length > 0) {
            feedback.push(`Missing key terms from JD: ${missingKeywords.slice(0, 5).join(', ')}...`);
        }
    } else {
        // No JD: Base keyword score on "Richness" of technical vocabulary
        // We'll give points for having a good volume of unique non-common words
        const uniqueStems = new Set(resumeStems);
        keywordScore = Math.min(40, Math.round(uniqueStems.size / 5)); // Heuristic
        feedback.push("Add a Job Description to check for specific keyword matches.");
    }

    // --- 2. Quality & Content Checks ---
    let qualityIssues: string[] = [];

    // Check Clichés / Buzzwords
    const foundBuzzwords = BUZZWORDS.filter(w => resumeText.includes(w));
    if (foundBuzzwords.length > 0) {
        qualityIssues.push(`Avoid clichés: ${foundBuzzwords.join(', ')}`);
        qualityScore -= foundBuzzwords.length * 2;
    }

    // Check Action Verb Variety
    const experienceText = resume.experience.map(e => e.bullets?.join(' ')).join(' ').toLowerCase();
    const usedVerbs = ACTION_VERBS.filter(v => experienceText.includes(v));
    const verbVarietyScore = Math.min(10, usedVerbs.length); // Max 10 pts for variety

    if (usedVerbs.length < 5) {
        qualityIssues.push("Use more varied action verbs (e.g., Led, Developed, Engineered).");
    }

    // Check Repetition (Same verb used > 3 times)
    // Simple heuristic: specific common verbs
    ['led', 'managed', 'responsible for'].forEach(phrase => {
        const regex = new RegExp(phrase, 'g');
        const count = (experienceText.match(regex) || []).length;
        if (count > 3) {
            qualityIssues.push(`Repetitive use of "${phrase}" (${count}x). Try synonyms.`);
            qualityScore -= 2;
        }
    });

    // Check Metrics (Quantifiable impact)
    const metricCount = (experienceText.match(/\d+%|\$\d+|\d+x/g) || []).length;
    if (metricCount < 3) {
        qualityIssues.push("Add more metrics (%, $, x) to prove your impact.");
    } else {
        qualityScore += 5; // Bonus for metrics
    }

    qualityScore += 25; // Base score
    // Clamp quality
    qualityScore = Math.max(0, Math.min(35, qualityScore + verbVarietyScore));

    feedback = [...feedback, ...qualityIssues];


    // --- 3. Formatting & Completeness ---
    let formatIssues: string[] = [];
    let fScore = 0;

    if (resume.personalInfo.email && resume.personalInfo.phone) fScore += 5;
    else formatIssues.push("Missing contact info.");

    if (resume.summary && resume.summary.length > 50 && resume.summary.length < 600) fScore += 5;
    else formatIssues.push("Summary should be between 50-600 characters.");

    if (resume.education.length > 0) fScore += 5;
    else formatIssues.push("Education section is empty.");

    if (resume.experience.length > 0) fScore += 10;
    else formatIssues.push("Experience section is empty.");

    formatScore = Math.min(25, fScore);
    feedback = [...feedback, ...formatIssues];

    // --- Final Calculation ---
    const totalScore = keywordScore + qualityScore + formatScore;

    return {
        totalScore,
        sections: {
            keywords: { score: keywordScore, max: 40, matched: matchedKeywords, missing: missingKeywords },
            quality: { score: qualityScore, max: 35, issues: qualityIssues },
            formatting: { score: formatScore, max: 25, issues: formatIssues }
        },
        feedback: feedback.slice(0, 5) // Top 5
    };
}

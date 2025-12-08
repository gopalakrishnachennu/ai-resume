/**
 * LLM Black Box - Prompt Registry
 * 
 * All prompts stored as TypeScript constants for:
 * - Zero I/O overhead
 * - Type safety
 * - Git version control
 * - In-memory caching
 */

export interface PromptTemplate {
  system: string;
  user: string;
  maxTokens: number;
  temperature: number;
  description?: string;
}

export interface PromptRegistry {
  version: string;
  phase1: {
    jobParser: PromptTemplate;
    keywordExtractor: PromptTemplate;
    experienceDetector: PromptTemplate;
  };
  phase2: {
    resumeGenerator: PromptTemplate;
    summaryWriter: PromptTemplate;
    skillsOptimizer: PromptTemplate;
    experienceWriter: PromptTemplate;
  };
  phase3: {
    atsScorer: PromptTemplate;
    keywordMatcher: PromptTemplate;
    formatChecker: PromptTemplate;
  };
  phase4: {
    suggestionGenerator: PromptTemplate;
    summaryImprover: PromptTemplate;
    experienceOptimizer: PromptTemplate;
    skillsEnhancer: PromptTemplate;
  };
}

export const PROMPT_REGISTRY: PromptRegistry = {
  version: '1.0.0',

  // ========================================
  // PHASE 1: JOB DESCRIPTION PROCESSING
  // ========================================
  phase1: {
    jobParser: {
      system: 'You are an expert job description analyzer. Extract structured data accurately and concisely.',
      user: `Analyze this job description and extract key information.

Job Description:
{{ job_description }}

Return ONLY valid JSON with these fields:
- title: exact job title
- company: company name or empty string
- requiredSkills: array of required skills
- preferredSkills: array of preferred/nice-to-have skills
- keywords: array of important keywords for ATS
- experienceLevel: one of Entry, Mid, Senior, Lead, Executive
- yearsRequired: number of years required
- qualifications: array of required qualifications
- responsibilities: array of key responsibilities

No markdown formatting, just pure JSON.`,
      maxTokens: 500,
      temperature: 0.1,
      description: 'Parse job description into structured data',
    },

    keywordExtractor: {
      system: 'You are a keyword extraction specialist focused on ATS optimization.',
      user: `Extract the top 15 most important keywords from this job description for ATS optimization.

Job Description:
{{ job_description }}

Focus on:
- Technical skills
- Tools and technologies
- Industry-specific terms
- Action verbs
- Certifications

Return ONLY a JSON array: ["keyword1", "keyword2", ...]`,
      maxTokens: 200,
      temperature: 0.0,
      description: 'Extract ATS-optimized keywords',
    },

    experienceDetector: {
      system: 'You are an experience level classifier.',
      user: `Determine the experience level required for this job.

Job Description:
{{ job_description }}

Analyze:
- Years of experience mentioned
- Seniority indicators (junior, senior, lead, etc.)
- Responsibility level
- Team leadership requirements

Return valid JSON with fields: level (Entry/Mid/Senior/Lead/Executive), yearsMin (number), yearsMax (number), reasoning (string).`,
      maxTokens: 150,
      temperature: 0.1,
      description: 'Detect required experience level',
    },
  },

  // ========================================
  // PHASE 2: RESUME GENERATION
  // ========================================
  phase2: {
    resumeGenerator: {
      system: 'You are an expert resume writer specializing in ATS optimization and compelling narratives.',
      user: `Generate ALL resume sections in ONE response for maximum efficiency.

Job Requirements (cached reference):
- Title: {{ job_title }}
- Required Skills: {{ required_skills }}
- Keywords: {{ job_keywords }}
- Experience Level: {{ experience_level }}

User Profile:
Name: {{ user_name }}
Email: {{ user_email }}
Phone: {{ user_phone }}
Location: {{ user_location }}

Experience:
{{ user_experience }}

Education:
{{ user_education }}

Skills:
{{ user_skills }}

Generate these sections optimized for the job:

1. Professional Summary (3-4 lines, include metrics)
2. Technical Skills (prioritized by job relevance)
3. Experience (rewrite bullets with action verbs + metrics)
4. Education (formatted consistently)
5. Certifications (if any)
6. Projects (if relevant)

Return ONLY valid JSON:
{
  "professionalSummary": "...",
  "technicalSkills": ["skill1", "skill2"],
  "experience": [
    {
      "company": "...",
      "title": "...",
      "location": "...",
      "startDate": "...",
      "endDate": "...",
      "bullets": ["bullet1", "bullet2"]
    }
  ],
  "education": [...],
  "certifications": [...],
  "projects": [...]
}`,
      maxTokens: 2000,
      temperature: 0.3,
      description: 'Generate all resume sections in one call',
    },

    summaryWriter: {
      system: 'You are a professional summary specialist. Generate ORIGINAL content based on user data. DO NOT copy examples.',
      user: `Write a compelling professional summary for this candidate.

Job Title: {{ job_title }}
Required Skills: {{ required_skills }}
Years Experience: {{ years_experience }}
Current Title: {{ current_title }}
Current Company: {{ current_company }}
Job Keywords: {{ job_keywords }}

CRITICAL RULES:
1. Generate ORIGINAL content - DO NOT copy the example below
2. Use the candidate's ACTUAL data ({{ current_title }}, {{ current_company }}, {{ years_experience }} years)
3. Include 2-3 specific metrics or achievements
4. Match these keywords naturally: {{ job_keywords }}
5. Sound HUMAN, not robotic or AI-generated
6. 3-4 sentences maximum
7. Start with candidate's expertise, not generic phrases

Example FORMAT ONLY (DO NOT COPY - create original based on user data):
"Results-driven Data Scientist with 5+ years architecting ML solutions at Amazon. Specialized in Python, AWS, and large-scale data processing with proven track record of reducing latency by 45% and improving model accuracy by 32%. Expert in leading cross-functional teams to deliver production-ready ML systems serving 10M+ users."

Now generate an ORIGINAL summary using the candidate's actual data above.
Return plain text only (no JSON).`,
      maxTokens: 200,
      temperature: 0.7, // Higher for more creative, human-like output
      description: 'Write professional summary',
    },
    skillsOptimizer: {
      system: 'You are a technical skills optimizer for ATS systems.',
      user: `Optimize and prioritize this skills list for the job.

User's Skills:
{{ user_skills }}

Job Required Skills:
{{ required_skills }}

Job Preferred Skills:
{{ preferred_skills }}

Instructions:
1. Prioritize skills that match job requirements
2. Group by category (Languages, Frameworks, Tools, Cloud, etc.)
3. Remove irrelevant skills
4. Add missing critical skills if user likely has them

Return ONLY valid JSON:
{
  "technical": ["Python", "JavaScript"],
  "frameworks": ["React", "Node.js"],
  "tools": ["Docker", "Git"],
  "cloud": ["AWS", "Azure"],
  "databases": ["PostgreSQL", "MongoDB"],
  "soft": ["Leadership", "Communication"]
}`,
      maxTokens: 300,
      temperature: 0.2,
      description: 'Optimize skills for job match',
    },

    experienceWriter: {
      system: 'You are an experience bullet point optimizer. Generate ORIGINAL content. NEVER copy examples.',
      user: `Generate 4-5 natural-sounding responsibility bullets for this role.

Company: {{ company }}
Title: {{ title }}
Location: {{ location }}
Dates: {{ start_date }} - {{ end_date }}

Target Job: {{ job_title }}
Required Skills: {{ required_skills }}
Job Keywords: {{ job_keywords }}

CRITICAL RULES - READ CAREFULLY:
1. Generate COMPLETELY ORIGINAL bullets - DO NOT copy the examples below
2. Use the ACTUAL company ({{ company }}) and title ({{ title }})
3. Make it sound HUMAN, not AI-generated
4. Vary sentence structure (don't start every bullet the same way)
5. Include specific metrics (%, numbers, scale like "1M+ users", "40% faster")
6. Match these keywords naturally: {{ job_keywords }}
7. Use strong action verbs: Led, Architected, Implemented, Designed, Optimized
8. Each bullet should be 1-2 lines maximum

Example FORMAT ONLY (DO NOT COPY THESE - they are just to show style):
- "Led cross-functional team of 8 engineers to architect scalable microservices platform, reducing API latency by 45%"
- "Implemented CI/CD pipeline using Jenkins and Docker, cutting deployment time from 2 hours to 15 minutes"
- "Designed real-time analytics dashboard processing 2M+ events daily, improving decision-making speed by 60%"

Now generate 4-5 ORIGINAL bullets for {{ title }} at {{ company }} that match {{ job_title }}.
Return ONLY a JSON array: ["bullet1", "bullet2", "bullet3", "bullet4"]`,
      maxTokens: 500,
      temperature: 0.8, // Higher for more creative, varied output
      description: 'Generate natural experience bullets',
    },
  },

  // ========================================
  // PHASE 3: ATS SCORING
  // ========================================
  phase3: {
    atsScorer: {
      system: 'You are an ATS (Applicant Tracking System) analyzer with expertise in resume scoring.',
      user: `Score this resume against the job requirements.

Resume Content:
{{ resume_content }}

Job Requirements:
- Title: {{ job_title }}
- Required Skills: {{ required_skills }}
- Keywords: {{ job_keywords }}

Analyze these factors:
1. Keyword Match (0-100): How many job keywords appear in resume?
2. Skills Match (0-100): How many required skills are present?
3. Format (0-100): Is it ATS-friendly? (no tables, images, columns)
4. Completeness (0-100): Are all sections present and detailed?
5. Experience Match (0-100): Does experience align with job level?

Return ONLY valid JSON:
{
  "overall": 85,
  "breakdown": {
    "keywordMatch": 90,
    "skillsMatch": 85,
    "format": 95,
    "completeness": 80,
    "experienceMatch": 85
  },
  "weakSections": ["experience", "skills"],
  "missingKeywords": ["Docker", "Kubernetes"],
  "missingSkills": ["AWS", "CI/CD"],
  "strengths": ["Strong format", "Good keyword density"],
  "recommendations": ["Add more metrics", "Include certifications"]
}`,
      maxTokens: 500,
      temperature: 0.0,
      description: 'Calculate comprehensive ATS score',
    },

    keywordMatcher: {
      system: 'You are a keyword matching specialist.',
      user: `Compare resume keywords with job keywords.

Resume Text:
{{ resume_text }}

Job Keywords:
{{ job_keywords }}

For each job keyword, check if it appears in the resume.

Return ONLY valid JSON:
{
  "matched": ["keyword1", "keyword2"],
  "missing": ["keyword3", "keyword4"],
  "matchRate": 0.75,
  "density": {
    "keyword1": 3,
    "keyword2": 5
  }
}`,
      maxTokens: 300,
      temperature: 0.0,
      description: 'Match keywords between resume and job',
    },

    formatChecker: {
      system: 'You are an ATS format compatibility checker.',
      user: `Check if this resume format is ATS-friendly.

Resume Content:
{{ resume_content }}

Check for:
- No tables or columns
- No images or graphics
- Standard section headers
- Consistent formatting
- Proper date formats
- No special characters

Return ONLY valid JSON:
{
  "score": 95,
  "issues": ["Uses tables in experience section"],
  "warnings": ["Unusual section header: 'My Journey'"],
  "recommendations": ["Use standard headers like 'Experience'"]
}`,
      maxTokens: 200,
      temperature: 0.0,
      description: 'Check ATS format compatibility',
    },
  },

  // ========================================
  // PHASE 4: SMART SUGGESTIONS
  // ========================================
  phase4: {
    suggestionGenerator: {
      system: 'You are a resume improvement specialist focused on actionable suggestions.',
      user: `Generate 3 specific, actionable suggestions to improve this resume section.

Section: {{ section_name }}

Current Content:
{{ current_content }}

Job Context:
- Title: {{ job_title }}
- Required Keywords: {{ job_keywords }}
- Missing Keywords: {{ missing_keywords }}
- Current ATS Score: {{ current_score }}

For each suggestion:
1. Show the current text
2. Show the improved version
3. Explain why it's better
4. Estimate ATS score impact (+X points)

Return ONLY valid JSON array:
[
  {
    "id": 1,
    "current": "Worked on projects",
    "suggested": "Led cross-functional team of 5 engineers to deliver 3 microservices, reducing latency by 40%",
    "reason": "Added action verb (Led), team size (5), quantifiable results (40% reduction), and technical keywords (microservices)",
    "atsImpact": 8,
    "keywords": ["Led", "cross-functional", "microservices"]
  },
  {
    "id": 2,
    "current": "...",
    "suggested": "...",
    "reason": "...",
    "atsImpact": 5,
    "keywords": [...]
  },
  {
    "id": 3,
    "current": "...",
    "suggested": "...",
    "reason": "...",
    "atsImpact": 6,
    "keywords": [...]
  }
]`,
      maxTokens: 600,
      temperature: 0.3,
      description: 'Generate section-specific improvement suggestions',
    },

    summaryImprover: {
      system: 'You are a professional summary improvement specialist.',
      user: `Improve this professional summary.

Current Summary:
{{ current_summary }}

Job Requirements:
- Title: {{ job_title }}
- Keywords: {{ job_keywords }}
- Missing Keywords: {{ missing_keywords }}

Improvements needed:
- Add missing keywords naturally
- Include metrics if missing
- Strengthen action verbs
- Highlight unique value

Return ONLY valid JSON:
{
  "improved": "Improved summary text...",
  "changes": ["Added keyword: leadership", "Included metric: 40% improvement"],
  "atsImpact": 12
}`,
      maxTokens: 250,
      temperature: 0.3,
      description: 'Improve professional summary',
    },

    experienceOptimizer: {
      system: 'You are an experience section optimizer.',
      user: `Optimize these experience bullets.

Current Bullets:
{{ current_bullets }}

Job Context:
- Keywords: {{ job_keywords }}
- Required Skills: {{ required_skills }}

For each bullet:
- Use strong action verbs (Led, Architected, Implemented)
- Add quantifiable metrics
- Include relevant keywords
- Show impact and results

Return ONLY valid JSON:
{
  "optimized": [
    {
      "original": "Worked on backend systems",
      "improved": "Architected scalable backend systems using Node.js and PostgreSQL, supporting 1M+ daily users",
      "improvements": ["Action verb: Architected", "Tech keywords: Node.js, PostgreSQL", "Metric: 1M+ users"]
    }
  ],
  "atsImpact": 10
}`,
      maxTokens: 500,
      temperature: 0.3,
      description: 'Optimize experience bullets',
    },

    skillsEnhancer: {
      system: 'You are a skills section enhancement specialist.',
      user: `Enhance this skills section.

Current Skills:
{{ current_skills }}

Job Requirements:
- Required Skills: {{ required_skills }}
- Preferred Skills: {{ preferred_skills }}
- Missing Skills: {{ missing_skills }}

Suggest:
1. Skills to add (if user likely has them based on experience)
2. Skills to remove (irrelevant to job)
3. Better categorization
4. Priority order

Return ONLY valid JSON:
{
  "suggested": {
    "technical": ["Python", "JavaScript"],
    "frameworks": ["React", "Django"],
    "tools": ["Docker", "Git"],
    "cloud": ["AWS", "GCP"]
  },
  "toAdd": ["Docker", "Kubernetes"],
  "toRemove": ["MS Office"],
  "reasoning": "Added Docker/Kubernetes as they're required and user has DevOps experience",
  "atsImpact": 8
}`,
      maxTokens: 400,
      temperature: 0.2,
      description: 'Enhance skills section',
    },
  },
};

// Export individual phases for easier access
export const PHASE1_PROMPTS = PROMPT_REGISTRY.phase1;
export const PHASE2_PROMPTS = PROMPT_REGISTRY.phase2;
export const PHASE3_PROMPTS = PROMPT_REGISTRY.phase3;
export const PHASE4_PROMPTS = PROMPT_REGISTRY.phase4;

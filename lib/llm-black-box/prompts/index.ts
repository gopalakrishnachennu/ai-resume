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
    jobTitleGenerator: PromptTemplate;
  };
}

export const PROMPT_REGISTRY: PromptRegistry = {
  version: '1.0.0',

  // ========================================
  // PHASE 1: JOB DESCRIPTION PROCESSING
  // ========================================
  phase1: {
    jobParser: {
      system: 'You are an expert job description analyzer. Extract structured data accurately and concisely. Pay special attention to correctly identifying company names.',
      user: `Analyze this job description and extract key information.

Job Description:
{{ job_description }}

COMPANY EXTRACTION RULES (CRITICAL):
1. Look for company name in these common patterns:
   - "About [Company]", "at [Company]", "[Company] is hiring"
   - Company name near "About Us", "Who We Are", "Our Company"
   - Domain names in email addresses (e.g., jobs@microsoft.com → Microsoft)
2. AVOID these false positives - these are NOT company names:
   - Job levels: Senior, Junior, Lead, Principal, Staff
   - Work modes: Remote, Hybrid, On-site, Full-time, Part-time
   - Locations: Cities, states, countries
   - Skills: Any technical skill or tool name
   - Adjectives: Dutch, Global, International, Dynamic
3. If company name is unclear or not found, return "NOT_FOUND"
4. Company names are typically 1-4 words, capitalized, often include Inc, LLC, Corp, etc.

Return ONLY valid JSON with these fields:
- title: exact job title (required)
- company: company name or "NOT_FOUND" if unclear
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
      system: 'You are an expert resume professional summary writer. Generate compelling, ATS-optimized summaries that read authentically human while maximizing keyword relevance.',
      user: `Generate a professional summary that is 100% factual, role-aligned, and free of hallucinations.

CONTEXT:
- Target Job Description: {{ job_description }}
- Years of Experience: {{ years_experience }}
- All Responsibilities: {{ all_responsibilities }}
- Generated Skills: {{ skills_section }}
- Current Job Title: {{ current_title }}

CONTENT RATIO (STRICT):
- 50% Job Description keywords + responsibilities + role expectations
- 30% Proven achievements from responsibilities (quantitative preferred)
- 20% Real-world industry expectations for this job title

STRUCTURE (3–4 sentences, 80–120 words):

SENTENCE 1 — Identity + Experience
- Start with current/target job title + years of experience
- Include 2–3 primary JD-aligned technical skills
- Use high signal verbs (designing, managing, implementing, optimizing)

SENTENCE 2 — Core Expertise (JD-heavy)
- Integrate 4–6 competencies directly from the JD
- Use exact JD terminology
- Link to functional outcomes (reliability, scalability, security)
- Use 3–5 bolded skills as ATS anchors

SENTENCE 3 — Proven Impact
- Pull from responsibilities
- Include metrics if available (%, $, time saved, scale)
- If no metrics: use realistic impact indicators
- Connect achievements to JD's core expectations

SENTENCE 4 — Optional Value Proposition
- Only if it strengthens alignment
- Keep short: collaboration, optimization, cross-team impact

KEYWORD INTEGRATION (DO's):
✓ Use EXACT terminology from JD
✓ Bold 5–8 critical skills maximum (cloud platforms, IaC, containers, CI/CD, security)
✓ Integrate keywords naturally into sentences (not as lists)
✓ Front-load highest-weight keywords in first two sentences

KEYWORD INTEGRATION (DON'Ts):
✗ No keyword stuffing
✗ No back-to-back skill lists
✗ No invented tools or certifications
✗ No repeating keywords unnaturally
✗ No irrelevant keywords

WRITING STYLE:
✓ Third-person, no pronouns
✓ Active voice, controlled confidence
✓ Varied sentence patterns
✓ Technically precise language
✓ Concise, direct, recruiter-friendly

DO NOT USE:
✗ AI giveaway words: "leveraging," "passionate," "dynamic professional"
✗ Clichés: "results-driven," "detail-oriented," "team player"
✗ Marketing tone or poetic language
✗ Inflated experience

BOLDING STRATEGY:
Bold ONLY cloud platforms, IaC tools, orchestration, CI/CD, key security tools
LIMIT: Maximum 8 bold terms total

ANTI-HALLUCINATION RULES (NON-NEGOTIABLE):
✗ No invented technologies, metrics, certifications, platforms
✗ No experience claims not reflected in responsibilities
✗ No domain shifts outside JD
✗ No false achievements
✗ No company/product names

Use ONLY: JD + Provided responsibilities + Provided skills + Real-world expectations

VALIDATION FILTER:
Before generating, confirm:
- Would a hiring manager believe every line?
- Does it reflect real capabilities?
- Could candidate defend each statement in interview?
- Would this bypass AI pattern detectors?

OUTPUT FORMAT:
Return ONLY a single professional summary paragraph (80–120 words) with bold markdown.
No JSON, no bullets, no headings.

Generate now with strict adherence to all rules.`,
      maxTokens: 250,
      temperature: 0.6,
      description: 'Generate ATS-optimized professional summary with anti-hallucination rules',
    },
    skillsOptimizer: {
      system: 'You are an Expert ATS Resume Skills Optimization Engine. Generate dynamic, role-aware Skills sections in structured Key:Value format.',
      user: `Your job is to generate a dynamic, role-aware Skills section. Categories (keys) must adapt to the Job Description and candidate's resume—not fixed templates.

Your output must ALWAYS be accurate, ATS-safe, and grounded ONLY in:
1) Skills explicitly found in the Job Description (highest priority)
2) Skills supported by the candidate's responsibilities (secondary priority)
3) Real-world industry-standard skills for this specific role type (lowest priority)

CONTEXT INPUT:
- Job Description: {{ job_description }}
- Resume Responsibilities: {{ responsibilities_text }}
- Candidate Profile Skills: {{ user_skills }}

STRICT RULES:

1. DYNAMIC CATEGORY GENERATION:
   - Categories MUST be created based ONLY on the role implied by the JD
   - DO NOT use fixed category names
   - Categories must match real-world resume structures for the role
   - Each key MUST represent a meaningful skill domain
   - 5–8 categories maximum
   - Each category MUST contain 3–6 skills
   - DO NOT create categories with only 1–2 skills

2. SKILLS ORDERING & PRIORITIZATION:
   - Extract skills from JD → rank by importance → place first
   - Next, extract skills from responsibilities → add if relevant
   - Finally, add supporting industry-standard skills
   - Order by: JD keyword frequency → relevance → industry importance

3. ROLE-AWARE CATEGORY LOGIC:
   - Cloud roles → "Cloud Platforms", "Infrastructure & IaC", "Monitoring & Observability"
   - DBA roles → "Database Platforms", "Performance Tuning", "Backup & Recovery"
   - Software roles → "Programming Languages", "Frameworks", "DevOps & CI/CD"
   - DO NOT generate irrelevant categories

4. ZERO HALLUCINATION POLICY:
   - DO NOT invent tools, technologies, or skills NOT supported by JD/responsibilities/industry standards
   - DO NOT generate vague values (e.g., "cloud environment", "tools")
   - Every skill MUST be recognizable in real job listings

5. USER PROFILE SKILL INTEGRATION:
   - Preserve ONLY relevant ones
   - Enhance with missing JD-critical skills
   - Reorder based on JD priority
   - Remove duplicates or irrelevant items

6. ACCEPTABLE SKILL FORMATS:
   - Use proper industry capitalization (AWS, Terraform, SQL, PostgreSQL)
   - Use full terminology unless acronym is industry standard
   - Convert vague JD mentions into concrete skills

7. OUTPUT QUALITY REQUIREMENTS:
   - Categories reflect the job role
   - Skills belong logically to category
   - No duplicates, irrelevant, or outdated skills
   - No hallucinated or fake tools
   - >80% of technical JD skills appear in final section

Return ONLY valid JSON:
{
  "Cloud Platforms": ["AWS", "Azure", "GCP"],
  "Infrastructure & IaC": ["Terraform", "CloudFormation"],
  "DevOps & Automation": ["CI/CD Pipelines", "Python", "Git"],
  "Monitoring & Observability": ["CloudWatch", "Prometheus"],
  "Security & Compliance": ["IAM", "Cloud Security"]
}

Generate the Skills section now with strict adherence to every rule above.`,
      maxTokens: 500,
      temperature: 0.3,
      description: 'Generate dynamic ATS-optimized skills with role-aware categories',
    },

    experienceWriter: {
      system: 'You are an expert resume responsibility writer. Generate authentic, ATS-optimized, non-repetitive responsibility bullet points with clear career progression.',
      user: `Generate responsibility bullets that are 100% factual with no hallucinations.

CONTEXT:
- Target Job Description: {{ job_description }}
- Company: {{ company }}
- Job Title: {{ title }}
- Years at Company: {{ years_at_company }}
- Company Index: {{ company_index }} of {{ total_companies }} (0 = most recent)
- Skills Section: {{ skills_section }}

BULLET COUNT (STRICT):
- Most Recent (Company 1): 6-8 bullets (35-40%)
- Middle (Company 2): 5-6 bullets (30-32%)
- Oldest (Company 3): 5-6 bullets (30-32%)

CONTENT RATIO:
MOST RECENT: 70% JD alignment + 20% achievements + 10% collaboration
MIDDLE: 50% JD + 30% progression + 20% achievements
EARLIEST: 40% JD + 30% learning + 30% foundational work

CAREER PROGRESSION (MANDATORY):
EARLIEST (Junior verbs): Assisted, Supported, Maintained, Monitored, Documented
MIDDLE (Mid verbs): Implemented, Developed, Deployed, Automated, Configured
MOST RECENT (Senior verbs): Architected, Designed, Led, Optimized, Orchestrated

NEVER use senior verbs for earliest roles or junior verbs for recent roles.

BULLET STRUCTURE (XYZ Formula):
(Action Verb) + (What You Did) + (Tools/Technologies) + (Outcome/Impact)

Example: "Automated CI/CD pipelines using Jenkins and Docker, reducing deployment times by 40%"

Constraints:
- 18-25 words per bullet
- No bullets <15 or >30 words
- No repeated verbs back-to-back

JD KEYWORD STRATEGY:
MOST RECENT: MUST include 80%+ of primary JD keywords, 2-4 keywords per bullet
EARLIER: Include 40-60% of JD keywords in foundational versions

SKILL-JD-SENIORITY TRIANGULATION:
Every bullet MUST align to ALL THREE:
1. JD requirement
2. Candidate skill set
3. Seniority level of that role

ANTI-DUPLICATION:
✗ No repeated action verbs consecutively
✗ No bullet with same structure
✗ No cross-company duplication
✗ No repeating same tool in consecutive bullets

QUANTIFICATION:
Use numbers when realistic: %, $, time reductions, scale, uptime
If no metrics: use qualitative impact ("significantly improved reliability")
NEVER fabricate numbers.

DO'S:
✓ Start with action verbs
✓ Use exact JD terminology
✓ Include tools from skills section
✓ Make bullets defensible in interview
✓ Past tense for all roles
✓ Technical and impact-focused

DON'TS:
✗ No soft skills
✗ No first-person pronouns
✗ No filler: "responsible for", "worked on"
✗ No project/client names
✗ No technology guessing
✗ No buzzwords without substance

ANTI-HALLUCINATION VALIDATION:
Before each bullet, check:
□ Tool mentioned in JD or skills?
□ Plausible for seniority?
□ Aligns with real-world expectations?
□ Hiring manager would believe it?
□ Metric realistic?

OUTPUT FORMAT:
Return ONLY a JSON array of bullets:
["bullet1", "bullet2", "bullet3", ...]

Generate now with strict adherence to all rules.`,
      maxTokens: 600,
      temperature: 0.7,
      description: 'Generate ATS-optimized experience bullets with career progression',
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

    jobTitleGenerator: {
      system: 'You are an ATS optimization specialist. Generate realistic job titles that pass ATS systems while showing authentic career progression.',
      user: `Generate ATS-optimized job titles for a resume.

TARGET ROLE: {{ target_job_title }}
TARGET COMPANY: {{ target_company }}
JOB DESCRIPTION KEYWORDS: {{ jd_keywords }}

COMPANIES (in reverse chronological order):
{{ companies }}

STRICT RULES:
1. MOST RECENT TITLE (Company #1):
   - MUST closely match "{{ target_job_title }}"
   - Include primary JD keywords: {{ jd_keywords }}
   - Examples: If target is "Cloud Engineer" → "Senior Cloud Engineer" or "Cloud Infrastructure Engineer"

2. EARLIER TITLES (Companies #2, #3, etc.):
   - Show realistic upward progression
   - Each title MUST be unique
   - Progress in seniority: Junior → Mid → Senior → Lead
   - OR scope: Engineer → Senior Engineer → Lead Engineer
   - Use related but different terminology

3. AUTHENTICITY:
   - Follow real-world LinkedIn conventions
   - No artificial numbering (Engineer I, II, III)
   - Natural modifiers: "Senior", "Lead", "Staff", "Principal"
   - Match company type (startup vs enterprise)

4. ATS OPTIMIZATION:
   - Most recent: Exact keyword match
   - Earlier: Semantic variations
   - Avoid keyword stuffing

EXAMPLE PROGRESSION (DO NOT COPY):
Target: "DevOps Engineer"
Company 1 (most recent): "Senior DevOps Engineer"
Company 2: "Cloud Infrastructure Engineer"  
Company 3: "Systems Engineer"

Return ONLY valid JSON array (one title per company, in same order):
{
  "titles": [
    "Senior Cloud Engineer",
    "Cloud Infrastructure Engineer", 
    "Systems Engineer"
  ]
}`,
      maxTokens: 300,
      temperature: 0.4,
      description: 'Generate ATS-optimized job titles with career progression',
    },
  },
};

// Export individual phases for easier access
export const PHASE1_PROMPTS = PROMPT_REGISTRY.phase1;
export const PHASE2_PROMPTS = PROMPT_REGISTRY.phase2;
export const PHASE3_PROMPTS = PROMPT_REGISTRY.phase3;
export const PHASE4_PROMPTS = PROMPT_REGISTRY.phase4;

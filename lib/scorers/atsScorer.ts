
export interface ATSScoreResult {
    total: number;
    breakdown: {
        contact: number; // 15
        experience: number; // 40
        skills: number; // 20
        formatting: number; // 25
    };
    feedback: string[];
}

const ACTION_VERBS = [
    'accelerated', 'achieved', 'added', 'awarded', 'changed', 'contributed', 'decreased', 'delivered',
    'eliminated', 'exceeded', 'expanded', 'gained', 'generated', 'grew', 'improved', 'increased',
    'introduced', 'maximized', 'minimized', 'optimized', 'produced', 'reduced', 'saved', 'sold',
    'stabilized', 'starter', 'strengthened', 'succeeded', 'surpassed', 'transformed',
    'analysis', 'analyzed', 'audited', 'calculated', 'categorized', 'clarified', 'collected',
    'compared', 'computed', 'conducted', 'defined', 'determined', 'evaluated', 'examined',
    'explored', 'forecasted', 'identified', 'inspected', 'investigated', 'measured', 'modeled',
    'projected', 'qualified', 'quantified', 'researched', 'tested', 'tracked', 'verified',
    'built', 'charted', 'coded', 'converted', 'debugged', 'designed', 'developed', 'devised',
    'engineered', 'fabricated', 'installed', 'maintained', 'operated', 'overhauled', 'programmed',
    'remodelled', 'repaired', 'restored', 'solved', 'standardized', 'streamlined', 'upgraded',
    'validated', 'addressed', 'advised', 'arranged', 'authored', 'co-authored', 'collaborated',
    'communicated', 'composed', 'contacted', 'convinced', 'corresponded', 'counseled',
    'demonstrated', 'directed', 'documented', 'drafted', 'edited', 'explained', 'facilitated',
    'formulated', 'influenced', 'interpreted', 'lectured', 'mediated', 'moderated', 'negotiated',
    'persuaded', 'presented', 'promoted', 'publicized', 'published', 'reported', 'represented',
    'translated', 'wrote', 'acquired', 'administered', 'allocated', 'approved', 'assigned',
    'chaired', 'chaired', 'consolidated', 'contracted', 'controlled', 'coordinated', 'delegated',
    'directed', 'enforced', 'executed', 'handled', 'headed', 'hired', 'hosted', 'initiated',
    'instituted', 'led', 'managed', 'merged', 'motivated', 'organized', 'oversaw', 'planned',
    'presided', 'prioritized', 'produced', 'recommended', 'reorganized', 'reviewed', 'scheduled',
    'supervised', 'trained'
].map(v => v.toLowerCase());

const WEAK_WORDS = [
    'responsible for', 'handled', 'worked on', 'helped', 'assisted', 'attempted', 'participated'
].map(w => w.toLowerCase());

export const calculateResumeScore = (data: any): ATSScoreResult => {
    let feedback: string[] = [];

    // 1. Contact Info (15 pts)
    let contactScore = 0;
    const { personalInfo } = data;
    if (personalInfo.name) contactScore += 3;
    if (personalInfo.email && personalInfo.email.includes('@')) contactScore += 3;
    if (personalInfo.phone && personalInfo.phone.length > 5) contactScore += 3;
    if (personalInfo.location) contactScore += 3;
    if (personalInfo.linkedin && personalInfo.linkedin.includes('linkedin.com')) contactScore += 3;

    // Feedback for missing critical info
    if (!personalInfo.linkedin) feedback.push("Add your LinkedIn profile URL.");
    if (!personalInfo.location) feedback.push("Add your location (City, State) for better local search visibility.");

    // 2. Experience Quality (40 pts)
    let experienceScore = 0;
    const { experience = [] } = data;

    if (experience.length === 0) {
        feedback.push("Add your work experience. It's the most critical section.");
    } else {
        // Base score for having experience
        experienceScore += 10;

        let totalBullets = 0;
        let actionVerbCount = 0;
        let metricCount = 0;
        let weakWordCount = 0;

        experience.forEach((job: any) => {
            const bullets = job.bullets || [];
            if (bullets.length > 0) totalBullets += bullets.length;

            bullets.forEach((bullet: string) => {
                const lower = bullet.toLowerCase();

                // Check Action Verbs (start of sentence usually)
                const firstWord = lower.split(' ')[0];
                if (ACTION_VERBS.includes(firstWord)) actionVerbCount++;

                // Check for Numbers/Metrics (%, $, 0-9)
                if (/\d+%|\$\d+|\d+/.test(bullet)) metricCount++;

                // Check weak words
                if (WEAK_WORDS.some(w => lower.includes(w))) weakWordCount++;
            });
        });

        // Score calculations
        const avgBullets = experience.length ? totalBullets / experience.length : 0;

        // Bullet count health (Aim for 3-6 per role)
        if (avgBullets >= 3) experienceScore += 10;
        else feedback.push("Aim for at least 3 bullet points per job role.");

        // Action Verb Usage
        const verbRatio = totalBullets ? actionVerbCount / totalBullets : 0;
        if (verbRatio > 0.6) experienceScore += 10;
        else if (verbRatio > 0.3) experienceScore += 5;
        else feedback.push("Start detailed bullet points with strong action verbs (e.g., Led, Developed).");

        // Metrics Usage (Impact)
        const metricRatio = totalBullets ? metricCount / totalBullets : 0;
        if (metricRatio > 0.4) experienceScore += 10;
        else if (metricRatio > 0.2) experienceScore += 5;
        else feedback.push("Quantify your impact using numbers, percentages, or dollar amounts.");
    }

    // 3. Skills & Education (20 pts)
    let skillsScore = 0;
    const { skills, technicalSkills, education = [] } = data;

    // Tech skills check
    const hasTechSkills = (skills?.technical && skills.technical.length > 0) ||
        (technicalSkills && Object.keys(technicalSkills).length > 0);

    if (hasTechSkills) {
        skillsScore += 10;
        // Check for reasonable number of skills
        const skillCount = (skills?.technical?.length || 0) +
            (technicalSkills ? Object.values(technicalSkills).flat().length : 0);
        if (skillCount < 5) feedback.push("Add more relevant technical skills.");
    } else {
        feedback.push("Add a specific 'Technical Skills' section.");
    }

    // Education check
    if (education.length > 0) {
        skillsScore += 10;
        const missingDegree = education.some((edu: any) => !edu.degree);
        if (missingDegree) feedback.push("Ensure all education entries have a 'Degree' listed.");
    } else {
        feedback.push("Add your educational background.");
    }

    // 4. Formatting & Consistency (25 pts)
    let formattingScore = 0;
    const { summary } = data;

    // Summary check
    if (summary && summary.length > 50) {
        formattingScore += 10;
        if (summary.length > 500) feedback.push("Your professional summary might be too long. Keep it concise.");
    } else {
        feedback.push("Add a professional summary to introduce yourself.");
    }

    // Section Completeness (implicit check based on data presence)
    if (experience.length > 0 && education.length > 0 && hasTechSkills) {
        formattingScore += 15;
    }

    const total = contactScore + experienceScore + skillsScore + formattingScore;

    return {
        total: Math.min(100, Math.max(0, total)),
        breakdown: {
            contact: contactScore,
            experience: experienceScore,
            skills: skillsScore,
            formatting: formattingScore
        },
        feedback: feedback.slice(0, 3) // Top 3 tips
    };
};

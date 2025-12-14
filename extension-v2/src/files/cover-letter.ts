import { Profile } from "../core/profile";
import { JobContext } from "../core/templates";
import { storeFile } from "./storage";

/**
 * Cover Letter Generation
 * Creates DOCX on-the-fly using profile + job context
 */

const COVER_LETTER_ID = 'cover-letter';

/**
 * Generate cover letter content
 */
function generateContent(profile: Profile, job?: JobContext): string {
    const name = profile.identity.fullName ||
        `${profile.identity.firstName} ${profile.identity.lastName}`;
    const company = job?.company || 'your organization';
    const role = job?.jobTitle || profile.role.targetTitle || 'this position';
    const skills = profile.skills.technical.slice(0, 4).join(', ');
    const years = profile.experience.totalYears || 'several';
    const currentRole = profile.experience.currentTitle || 'professional';

    const paragraphs = [
        `Dear Hiring Manager,`,
        ``,
        `I am writing to express my strong interest in the ${role} position at ${company}. With ${years} years of experience as a ${currentRole}, I am confident that my skills and expertise would make me a valuable addition to your team.`,
        ``,
        `Throughout my career, I have developed strong proficiency in ${skills}. I am passionate about delivering high-quality work and continuously improving my skill set. My background has prepared me to excel in fast-paced environments where attention to detail and problem-solving are essential.`,
        ``,
        `I am particularly drawn to ${company} because of its reputation for innovation and excellence. I believe my experience and enthusiasm would allow me to contribute meaningfully to your mission while growing professionally.`,
        ``,
        `I would welcome the opportunity to discuss how my background and skills align with your needs. Thank you for considering my application.`,
        ``,
        `Sincerely,`,
        name,
        profile.identity.email,
        profile.identity.phone
    ];

    return paragraphs.join('\n');
}

/**
 * Generate cover letter as plain text (for textarea fields)
 */
export function generateCoverLetterText(profile: Profile, job?: JobContext): string {
    return generateContent(profile, job);
}

/**
 * Generate cover letter as DOCX Blob
 * Note: For full DOCX generation, you'd need the 'docx' library
 * This is a simplified version that creates a text-based file
 */
export async function generateCoverLetterDocx(
    profile: Profile,
    job?: JobContext
): Promise<Blob> {
    const content = generateContent(profile, job);

    // For MVP: Create a simple text-based doc
    // TODO: Use 'docx' library for proper DOCX generation

    // Create a simple RTF (Rich Text Format) which Word can open
    const rtfContent = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0 Arial;}}
{\\colortbl;\\red0\\green0\\blue0;}
\\f0\\fs24
${content.split('\n').map(line => line + '\\par').join('\n')}
}`;

    const blob = new Blob([rtfContent], {
        type: 'application/rtf'
    });

    return blob;
}

/**
 * Generate and store cover letter
 */
export async function generateAndStoreCoverLetter(
    profile: Profile,
    job?: JobContext
): Promise<void> {
    const blob = await generateCoverLetterDocx(profile, job);
    const company = job?.company?.replace(/[^a-zA-Z0-9]/g, '_') || 'Company';
    const filename = `Cover_Letter_${company}.rtf`;

    await storeFile(COVER_LETTER_ID, blob, filename);
    console.log(`[CoverLetter] Generated and stored: ${filename}`);
}

/**
 * Attach cover letter to file input
 */
export async function attachCoverLetter(
    fileInput: HTMLInputElement,
    profile: Profile,
    job?: JobContext
): Promise<boolean> {
    try {
        const blob = await generateCoverLetterDocx(profile, job);
        const company = job?.company?.replace(/[^a-zA-Z0-9]/g, '_') || 'Company';
        const filename = `Cover_Letter_${company}.rtf`;

        const file = new File([blob], filename, {
            type: blob.type,
            lastModified: Date.now()
        });

        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;

        fileInput.dispatchEvent(new Event('change', { bubbles: true }));

        console.log(`[CoverLetter] Attached: ${filename}`);
        return true;

    } catch (error) {
        console.error('[CoverLetter] Failed to attach:', error);
        return false;
    }
}

/**
 * Find cover letter file inputs
 */
export function findCoverLetterInputs(): HTMLInputElement[] {
    const inputs = document.querySelectorAll<HTMLInputElement>('input[type="file"]');

    return Array.from(inputs).filter(input => {
        const label = (input.getAttribute('aria-label') ||
            input.closest('label')?.textContent ||
            '').toLowerCase();

        return label.includes('cover') || label.includes('letter');
    });
}

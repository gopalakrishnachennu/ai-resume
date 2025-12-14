export interface CanonicalMapping {
    path: string;
    transform?: string;
    tier?: number; // Default 2
    inferFrom?: string; // Optional: derive value from another field (e.g., gender → pronouns)
}

export const CANONICAL: Record<string, CanonicalMapping> = {
    // --- IDENTITY ---
    "first name": { path: "identity.firstName" },
    "given name": { path: "identity.firstName" },
    "first": { path: "identity.firstName" },
    "last name": { path: "identity.lastName" },
    "family name": { path: "identity.lastName" },
    "surname": { path: "identity.lastName" },
    "last": { path: "identity.lastName" },
    "full name": { path: "identity.fullName" },
    "name": { path: "identity.fullName" },
    "email": { path: "identity.email" },
    "email address": { path: "identity.email" },
    "phone": { path: "identity.phone", transform: "formatPhone" },
    "phone number": { path: "identity.phone", transform: "formatPhone" },
    "mobile": { path: "identity.phone", transform: "formatPhone" },
    "contact number": { path: "identity.phone", transform: "formatPhone" },
    "address": { path: "identity.location.address" },
    "street address": { path: "identity.location.address" },
    "city": { path: "identity.location.city" },
    "town": { path: "identity.location.city" },
    "state": { path: "identity.location.state" },
    "province": { path: "identity.location.state" },
    "region": { path: "identity.location.state" },
    "zip": { path: "identity.location.zip" },
    "zip code": { path: "identity.location.zip" },
    "postal code": { path: "identity.location.zip" },
    "country": { path: "identity.location.country" },
    "linkedin": { path: "identity.linkedin" },
    "linkedin url": { path: "identity.linkedin" },
    "linkedin profile": { path: "identity.linkedin" },
    "github": { path: "identity.github" },
    "github url": { path: "identity.github" },
    "portfolio": { path: "identity.portfolio" },
    "website": { path: "identity.website" },
    "personal website": { path: "identity.website" },

    // --- WORK AUTHORIZATION ---
    "are you legally authorized to work in the united states?": { path: "authorization.workAuth", transform: "authToOption" },
    "are you legally authorized to work in the country where this job is located?": { path: "authorization.workAuth", transform: "authToOption" },
    "work authorization": { path: "authorization.workAuth", transform: "authToOption" },
    "will you now or in the future require sponsorship for employment visa status?": { path: "authorization.needSponsor", transform: "boolToYesNo" },
    "do you require sponsorship?": { path: "authorization.needSponsor", transform: "boolToYesNo" },
    "sponsorship": { path: "authorization.needSponsor", transform: "boolToYesNo" },
    "are you willing to relocate?": { path: "authorization.willingToRelocate", transform: "boolToYesNo" },
    "willing to relocate": { path: "authorization.willingToRelocate", transform: "boolToYesNo" },
    "relocation": { path: "authorization.willingToRelocate", transform: "boolToYesNo" },

    // --- ROLE PREFERENCES ---
    "desired salary": { path: "role.salaryMin", transform: "formatSalary" },
    "expected salary": { path: "role.salaryMin", transform: "formatSalary" },
    "salary expectation": { path: "role.salaryMin", transform: "formatSalary" },
    "preferred start date": { path: "role.startDate" },
    "start date": { path: "role.startDate" },
    "notice period": { path: "role.noticePeriod" },
    "how did you hear about us?": { path: "meta.source", transform: "sourceToOption" }, // Needs meta field or constant

    // --- EEO / DEMOGRAPHICS ---
    "gender": { path: "compliance.gender" },
    "what is your gender?": { path: "compliance.gender" },
    "pronouns": { path: "identity.pronouns", inferFrom: "compliance.gender", transform: "genderToPronouns" },
    "your pronouns": { path: "identity.pronouns", inferFrom: "compliance.gender", transform: "genderToPronouns" },
    "preferred pronouns": { path: "identity.pronouns", inferFrom: "compliance.gender", transform: "genderToPronouns" },
    "race": { path: "compliance.ethnicity" },
    "race/ethnicity": { path: "compliance.ethnicity" },
    "ethnicity": { path: "compliance.ethnicity" },
    "veteran status": { path: "compliance.veteran" },
    "are you a veteran?": { path: "compliance.veteran" },
    "disability status": { path: "compliance.disability" },
    "are you disabled?": { path: "compliance.disability" },

    // --- EDUCATION ---
    "school": { path: "education.history.0.school" }, // Simple fill for 1st entry
    "university": { path: "education.history.0.school" },
    "degree": { path: "education.history.0.degree" },
    "major": { path: "education.history.0.fieldOfStudy" },
    "field of study": { path: "education.history.0.fieldOfStudy" },

    // --- WORK HISTORY (Usually complex, mapped via patterns mostly, but simple matches here) ---
    "current company": { path: "experience.currentCompany" },
    "current employer": { path: "experience.currentCompany" },
    "current title": { path: "experience.currentTitle" },
    "job title": { path: "experience.currentTitle" },
};

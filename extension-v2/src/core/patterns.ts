export interface PatternMapping {
    regex: RegExp;
    path: string;
    transform?: string;
}

export const PATTERNS: PatternMapping[] = [
    // Identity
    { regex: /first\s*name|given\s*name/i, path: "identity.firstName" },
    { regex: /last\s*name|family\s*name|surname/i, path: "identity.lastName" },
    { regex: /full\s*name/i, path: "identity.fullName" },
    { regex: /phone|mobile|cell/i, path: "identity.phone", transform: "formatPhone" },
    { regex: /email/i, path: "identity.email" },

    // Location
    { regex: /address|street/i, path: "identity.location.address" },
    { regex: /city|town/i, path: "identity.location.city" },
    { regex: /zip|postal/i, path: "identity.location.zip" },

    // Links
    { regex: /linkedin/i, path: "identity.linkedin" },
    { regex: /github/i, path: "identity.github" },
    { regex: /portfolio|website/i, path: "identity.portfolio" },

    // Role
    { regex: /salary|compensation|pay|wage/i, path: "role.salaryMin", transform: "formatSalary" },
    { regex: /start\s*date/i, path: "role.startDate" },
    { regex: /notice/i, path: "role.noticePeriod" },

    // Auth
    { regex: /authorized.*work|legal.*work|eligible.*work/i, path: "authorization.workAuth", transform: "authToOption" },
    { regex: /sponsor/i, path: "authorization.needSponsor", transform: "boolToYesNo" },
    { regex: /relocat/i, path: "authorization.willingToRelocate", transform: "boolToYesNo" },

    // EEO
    { regex: /gender|sex/i, path: "compliance.gender" },
    { regex: /race|ethnicity/i, path: "compliance.ethnicity" },
    { regex: /veteran/i, path: "compliance.veteran" },
    { regex: /disability/i, path: "compliance.disability" }
];

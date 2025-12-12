// Field Patterns - Comprehensive patterns for detecting form fields
// Covers all common job application fields across different platforms

const FieldPatterns = {
    // Personal Information
    firstName: {
        patterns: [
            /first[\s_-]?name/i,
            /fname/i,
            /given[\s_-]?name/i,
            /forename/i,
            /^name$/i,
            /legal[\s_-]?first/i,
            /preferred[\s_-]?first/i
        ],
        category: 'personal',
        priority: 10
    },
    lastName: {
        patterns: [
            /last[\s_-]?name/i,
            /lname/i,
            /surname/i,
            /family[\s_-]?name/i,
            /legal[\s_-]?last/i
        ],
        category: 'personal',
        priority: 10
    },
    fullName: {
        patterns: [
            /full[\s_-]?name/i,
            /complete[\s_-]?name/i,
            /your[\s_-]?name/i,
            /applicant[\s_-]?name/i,
            /candidate[\s_-]?name/i,
            /^name$/i
        ],
        category: 'personal',
        priority: 9
    },
    middleName: {
        patterns: [
            /middle[\s_-]?name/i,
            /mname/i
        ],
        category: 'personal',
        priority: 5
    },
    email: {
        patterns: [
            /e[\s_-]?mail/i,
            /email[\s_-]?address/i,
            /contact[\s_-]?email/i,
            /primary[\s_-]?email/i,
            /work[\s_-]?email/i
        ],
        inputTypes: ['email'],
        category: 'personal',
        priority: 10
    },
    phone: {
        patterns: [
            /phone/i,
            /mobile/i,
            /cell/i,
            /tel/i,
            /telephone/i,
            /contact[\s_-]?number/i,
            /primary[\s_-]?phone/i
        ],
        inputTypes: ['tel'],
        category: 'personal',
        priority: 10
    },
    address: {
        patterns: [
            /^address$/i,
            /street[\s_-]?address/i,
            /address[\s_-]?line[\s_-]?1/i,
            /mailing[\s_-]?address/i,
            /home[\s_-]?address/i,
            /addr1/i
        ],
        category: 'personal',
        priority: 8
    },
    addressLine2: {
        patterns: [
            /address[\s_-]?line[\s_-]?2/i,
            /apt/i,
            /suite/i,
            /unit/i,
            /addr2/i
        ],
        category: 'personal',
        priority: 6
    },
    city: {
        patterns: [
            /^city$/i,
            /town/i,
            /municipality/i,
            /current[\s_-]?city/i
        ],
        category: 'personal',
        priority: 8
    },
    state: {
        patterns: [
            /^state$/i,
            /province/i,
            /region/i,
            /territory/i
        ],
        category: 'personal',
        priority: 8
    },
    zipCode: {
        patterns: [
            /zip/i,
            /postal/i,
            /postcode/i,
            /zip[\s_-]?code/i
        ],
        category: 'personal',
        priority: 8
    },
    country: {
        patterns: [
            /country/i,
            /nation/i,
            /country[\s_-]?of[\s_-]?residence/i
        ],
        category: 'personal',
        priority: 8
    },

    // Online Profiles
    linkedin: {
        patterns: [
            /linkedin/i,
            /linked[\s_-]?in/i,
            /linkedin[\s_-]?profile/i,
            /linkedin[\s_-]?url/i
        ],
        inputTypes: ['url'],
        category: 'personal',
        priority: 9
    },
    website: {
        patterns: [
            /website/i,
            /portfolio/i,
            /personal[\s_-]?website/i,
            /personal[\s_-]?site/i,
            /^url$/i,
            /homepage/i,
            /blog/i
        ],
        inputTypes: ['url'],
        category: 'personal',
        priority: 7
    },
    github: {
        patterns: [
            /github/i,
            /git[\s_-]?hub/i,
            /github[\s_-]?profile/i,
            /github[\s_-]?url/i
        ],
        inputTypes: ['url'],
        category: 'personal',
        priority: 8
    },
    twitter: {
        patterns: [
            /twitter/i,
            /x[\s_-]?profile/i
        ],
        inputTypes: ['url'],
        category: 'personal',
        priority: 5
    },

    // Experience
    company: {
        patterns: [
            /company/i,
            /employer/i,
            /organization/i,
            /firm/i,
            /company[\s_-]?name/i,
            /current[\s_-]?employer/i,
            /most[\s_-]?recent[\s_-]?company/i
        ],
        category: 'experience',
        priority: 9
    },
    position: {
        patterns: [
            /^position$/i,
            /job[\s_-]?title/i,
            /^title$/i,
            /^role$/i,
            /designation/i,
            /current[\s_-]?title/i,
            /current[\s_-]?position/i
        ],
        category: 'experience',
        priority: 9
    },
    startDate: {
        patterns: [
            /start[\s_-]?date/i,
            /from[\s_-]?date/i,
            /begin[\s_-]?date/i,
            /date[\s_-]?started/i,
            /joined/i
        ],
        inputTypes: ['date', 'month'],
        category: 'experience',
        priority: 7
    },
    endDate: {
        patterns: [
            /end[\s_-]?date/i,
            /to[\s_-]?date/i,
            /until/i,
            /date[\s_-]?left/i,
            /date[\s_-]?ended/i
        ],
        inputTypes: ['date', 'month'],
        category: 'experience',
        priority: 7
    },
    currentlyWorking: {
        patterns: [
            /current/i,
            /present/i,
            /still[\s_-]?working/i,
            /i[\s_-]?currently[\s_-]?work/i
        ],
        inputTypes: ['checkbox'],
        category: 'experience',
        priority: 6
    },
    responsibilities: {
        patterns: [
            /responsibilit/i,
            /duties/i,
            /description/i,
            /what[\s_-]?you[\s_-]?do/i,
            /job[\s_-]?description/i,
            /work[\s_-]?description/i
        ],
        category: 'experience',
        priority: 7
    },
    yearsOfExperience: {
        patterns: [
            /years[\s_-]?of[\s_-]?experience/i,
            /experience[\s_-]?years/i,
            /total[\s_-]?experience/i,
            /work[\s_-]?experience/i,
            /how[\s_-]?many[\s_-]?years/i
        ],
        inputTypes: ['number', 'select'],
        category: 'experience',
        priority: 8
    },

    // Education
    school: {
        patterns: [
            /school/i,
            /university/i,
            /college/i,
            /institution/i,
            /academy/i,
            /alma[\s_-]?mater/i,
            /school[\s_-]?name/i
        ],
        category: 'education',
        priority: 9
    },
    degree: {
        patterns: [
            /degree/i,
            /qualification/i,
            /diploma/i,
            /level[\s_-]?of[\s_-]?education/i,
            /highest[\s_-]?education/i
        ],
        category: 'education',
        priority: 9
    },
    fieldOfStudy: {
        patterns: [
            /field[\s_-]?of[\s_-]?study/i,
            /major/i,
            /specialization/i,
            /concentration/i,
            /discipline/i,
            /area[\s_-]?of[\s_-]?study/i
        ],
        category: 'education',
        priority: 8
    },
    gpa: {
        patterns: [
            /^gpa$/i,
            /grade[\s_-]?point/i,
            /cgpa/i,
            /cumulative[\s_-]?gpa/i
        ],
        category: 'education',
        priority: 6
    },
    graduationDate: {
        patterns: [
            /graduation[\s_-]?date/i,
            /graduation[\s_-]?year/i,
            /year[\s_-]?graduated/i,
            /completed[\s_-]?date/i
        ],
        inputTypes: ['date', 'month', 'number'],
        category: 'education',
        priority: 7
    },

    // Skills
    skills: {
        patterns: [
            /skills?/i,
            /expertise/i,
            /proficienc/i,
            /technologies/i,
            /technical[\s_-]?skills/i,
            /key[\s_-]?skills/i,
            /competenc/i
        ],
        category: 'skills',
        priority: 8
    },

    // Work Preferences
    salary: {
        patterns: [
            /salary/i,
            /compensation/i,
            /expected[\s_-]?salary/i,
            /desired[\s_-]?salary/i,
            /pay[\s_-]?expectation/i,
            /salary[\s_-]?requirement/i
        ],
        inputTypes: ['number'],
        category: 'preferences',
        priority: 7
    },
    availability: {
        patterns: [
            /availab/i,
            /when[\s_-]?can[\s_-]?you[\s_-]?start/i,
            /start[\s_-]?date/i,
            /earliest[\s_-]?start/i,
            /how[\s_-]?soon/i
        ],
        category: 'preferences',
        priority: 7
    },
    noticePeriod: {
        patterns: [
            /notice[\s_-]?period/i,
            /current[\s_-]?notice/i,
            /days[\s_-]?notice/i
        ],
        category: 'preferences',
        priority: 6
    },
    workType: {
        patterns: [
            /work[\s_-]?type/i,
            /employment[\s_-]?type/i,
            /job[\s_-]?type/i,
            /full[\s_-]?time/i,
            /part[\s_-]?time/i
        ],
        category: 'preferences',
        priority: 6
    },
    remoteWork: {
        patterns: [
            /remote/i,
            /work[\s_-]?from[\s_-]?home/i,
            /wfh/i,
            /hybrid/i,
            /on[\s_-]?site/i,
            /location[\s_-]?preference/i
        ],
        category: 'preferences',
        priority: 6
    },
    sponsorship: {
        patterns: [
            /sponsor/i,
            /visa/i,
            /work[\s_-]?authorization/i,
            /eligible[\s_-]?to[\s_-]?work/i,
            /require[\s_-]?sponsorship/i,
            /authorized[\s_-]?to[\s_-]?work/i,
            /legally[\s_-]?authorized/i
        ],
        inputTypes: ['checkbox', 'radio', 'select'],
        category: 'preferences',
        priority: 8
    },
    relocate: {
        patterns: [
            /relocat/i,
            /willing[\s_-]?to[\s_-]?move/i,
            /open[\s_-]?to[\s_-]?relocat/i
        ],
        inputTypes: ['checkbox', 'radio', 'select'],
        category: 'preferences',
        priority: 6
    },

    // Documents & Additional
    coverLetter: {
        patterns: [
            /cover[\s_-]?letter/i,
            /why[\s_-]?you/i,
            /motivation/i,
            /why[\s_-]?interested/i,
            /why[\s_-]?this[\s_-]?role/i,
            /why[\s_-]?do[\s_-]?you[\s_-]?want/i
        ],
        category: 'documents',
        priority: 7
    },
    additionalInfo: {
        patterns: [
            /additional[\s_-]?info/i,
            /other[\s_-]?information/i,
            /anything[\s_-]?else/i,
            /comments/i,
            /notes/i,
            /message/i
        ],
        category: 'documents',
        priority: 5
    },
    howDidYouHear: {
        patterns: [
            /how[\s_-]?did[\s_-]?you[\s_-]?hear/i,
            /referral[\s_-]?source/i,
            /source/i,
            /where[\s_-]?did[\s_-]?you[\s_-]?find/i
        ],
        category: 'misc',
        priority: 4
    },
    heardAbout: {
        patterns: [
            /heard[\s_-]?about/i,
            /learn[\s_-]?about/i,
            /find[\s_-]?out[\s_-]?about/i
        ],
        category: 'misc',
        priority: 4
    },

    // Demographics (usually optional)
    gender: {
        patterns: [
            /gender/i,
            /sex/i
        ],
        category: 'demographics',
        priority: 3
    },
    ethnicity: {
        patterns: [
            /ethnic/i,
            /race/i
        ],
        category: 'demographics',
        priority: 3
    },
    veteranStatus: {
        patterns: [
            /veteran/i,
            /military[\s_-]?service/i
        ],
        category: 'demographics',
        priority: 3
    },
    disabilityStatus: {
        patterns: [
            /disabilit/i,
            /handicap/i
        ],
        category: 'demographics',
        priority: 3
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FieldPatterns;
}

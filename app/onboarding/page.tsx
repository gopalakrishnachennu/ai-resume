'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

export default function OnboardingPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form data
    const [profile, setProfile] = useState({
        phone: '',
        location: '',
        linkedin: '',
        github: '',
        portfolio: '',
    });

    const [experience, setExperience] = useState([
        {
            company: '',
            title: '',
            location: '',
            startDate: '',
            endDate: '',
            current: false,
            bullets: [''],
        },
    ]);

    const [education, setEducation] = useState([
        {
            school: '',
            degree: '',
            field: '',
            location: '',
            graduationDate: '',
            gpa: '',
        },
    ]);

    const [skills, setSkills] = useState({
        technical: [] as string[],
        soft: [] as string[],
        tools: [] as string[],
    });

    const [techSkillInput, setTechSkillInput] = useState('');
    const [softSkillInput, setSoftSkillInput] = useState('');
    const [toolInput, setToolInput] = useState('');

    const handleSave = async () => {
        if (!user) return;

        setLoading(true);

        try {
            await updateDoc(doc(db, 'users', user.uid), {
                profile,
                baseExperience: experience,
                baseEducation: education,
                baseSkills: skills,
            });

            toast.success('Profile saved! 🎉');
            router.push('/dashboard');
        } catch (error: any) {
            toast.error('Failed to save profile');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const addExperience = () => {
        setExperience([
            ...experience,
            {
                company: '',
                title: '',
                location: '',
                startDate: '',
                endDate: '',
                current: false,
                bullets: [''],
            },
        ]);
    };

    const addEducation = () => {
        setEducation([
            ...education,
            {
                school: '',
                degree: '',
                field: '',
                location: '',
                graduationDate: '',
                gpa: '',
            },
        ]);
    };

    const addSkill = (type: 'technical' | 'soft' | 'tools', value: string) => {
        if (!value.trim()) return;
        setSkills({
            ...skills,
            [type]: [...skills[type], value.trim()],
        });
        if (type === 'technical') setTechSkillInput('');
        if (type === 'soft') setSoftSkillInput('');
        if (type === 'tools') setToolInput('');
    };

    const removeSkill = (type: 'technical' | 'soft' | 'tools', index: number) => {
        setSkills({
            ...skills,
            [type]: skills[type].filter((_, i) => i !== index),
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
            <div className="max-w-4xl mx-auto px-4">
                {/* Progress */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-3xl font-bold text-gray-900">Complete Your Profile</h1>
                        <span className="text-sm text-gray-600">Step {step} of 4</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(step / 4) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Step 1: Personal Info */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Personal Information</h2>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={profile.phone}
                                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="(555) 123-4567"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        value={profile.location}
                                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="San Francisco, CA"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        LinkedIn URL
                                    </label>
                                    <input
                                        type="url"
                                        value={profile.linkedin}
                                        onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="linkedin.com/in/yourname"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        GitHub URL
                                    </label>
                                    <input
                                        type="url"
                                        value={profile.github}
                                        onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="github.com/yourname"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Portfolio/Website (Optional)
                                    </label>
                                    <input
                                        type="url"
                                        value={profile.portfolio}
                                        onChange={(e) => setProfile({ ...profile, portfolio: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="yourportfolio.com"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                            >
                                Next: Work Experience →
                            </button>
                        </div>
                    )}

                    {/* Step 2: Experience */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Work Experience</h2>
                            <p className="text-gray-600 mb-6">
                                Add your work experience. This will be used as a base for all your resumes.
                            </p>

                            {experience.map((exp, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-6 space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            value={exp.company}
                                            onChange={(e) => {
                                                const newExp = [...experience];
                                                newExp[index].company = e.target.value;
                                                setExperience(newExp);
                                            }}
                                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Company Name"
                                        />
                                        <input
                                            type="text"
                                            value={exp.title}
                                            onChange={(e) => {
                                                const newExp = [...experience];
                                                newExp[index].title = e.target.value;
                                                setExperience(newExp);
                                            }}
                                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Job Title"
                                        />
                                    </div>

                                    <input
                                        type="text"
                                        value={exp.location}
                                        onChange={(e) => {
                                            const newExp = [...experience];
                                            newExp[index].location = e.target.value;
                                            setExperience(newExp);
                                        }}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Location"
                                    />

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <input
                                            type="month"
                                            value={exp.startDate}
                                            onChange={(e) => {
                                                const newExp = [...experience];
                                                newExp[index].startDate = e.target.value;
                                                setExperience(newExp);
                                            }}
                                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                        <input
                                            type="month"
                                            value={exp.endDate}
                                            onChange={(e) => {
                                                const newExp = [...experience];
                                                newExp[index].endDate = e.target.value;
                                                setExperience(newExp);
                                            }}
                                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            disabled={exp.current}
                                        />
                                    </div>

                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={exp.current}
                                            onChange={(e) => {
                                                const newExp = [...experience];
                                                newExp[index].current = e.target.checked;
                                                setExperience(newExp);
                                            }}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm text-gray-700">I currently work here</span>
                                    </label>

                                    <textarea
                                        value={exp.bullets[0]}
                                        onChange={(e) => {
                                            const newExp = [...experience];
                                            newExp[index].bullets[0] = e.target.value;
                                            setExperience(newExp);
                                        }}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Key achievements (one per line)"
                                        rows={4}
                                    />
                                </div>
                            ))}

                            <button
                                onClick={addExperience}
                                className="w-full border-2 border-dashed border-gray-300 text-gray-600 py-3 rounded-lg font-semibold hover:border-gray-400 hover:text-gray-700 transition-colors"
                            >
                                + Add Another Position
                            </button>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                                >
                                    ← Back
                                </button>
                                <button
                                    onClick={() => setStep(3)}
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                                >
                                    Next: Education →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Education */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Education</h2>

                            {education.map((edu, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-6 space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            value={edu.school}
                                            onChange={(e) => {
                                                const newEdu = [...education];
                                                newEdu[index].school = e.target.value;
                                                setEducation(newEdu);
                                            }}
                                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="School Name"
                                        />
                                        <input
                                            type="text"
                                            value={edu.degree}
                                            onChange={(e) => {
                                                const newEdu = [...education];
                                                newEdu[index].degree = e.target.value;
                                                setEducation(newEdu);
                                            }}
                                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Degree (e.g., Bachelor of Science)"
                                        />
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            value={edu.field}
                                            onChange={(e) => {
                                                const newEdu = [...education];
                                                newEdu[index].field = e.target.value;
                                                setEducation(newEdu);
                                            }}
                                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Field of Study"
                                        />
                                        <input
                                            type="month"
                                            value={edu.graduationDate}
                                            onChange={(e) => {
                                                const newEdu = [...education];
                                                newEdu[index].graduationDate = e.target.value;
                                                setEducation(newEdu);
                                            }}
                                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <input
                                        type="text"
                                        value={edu.gpa}
                                        onChange={(e) => {
                                            const newEdu = [...education];
                                            newEdu[index].gpa = e.target.value;
                                            setEducation(newEdu);
                                        }}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="GPA (Optional)"
                                    />
                                </div>
                            ))}

                            <button
                                onClick={addEducation}
                                className="w-full border-2 border-dashed border-gray-300 text-gray-600 py-3 rounded-lg font-semibold hover:border-gray-400 hover:text-gray-700 transition-colors"
                            >
                                + Add Another Degree
                            </button>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setStep(2)}
                                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                                >
                                    ← Back
                                </button>
                                <button
                                    onClick={() => setStep(4)}
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                                >
                                    Next: Skills →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Skills */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Skills</h2>

                            {/* Technical Skills */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Technical Skills
                                </label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={techSkillInput}
                                        onChange={(e) => setTechSkillInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addSkill('technical', techSkillInput);
                                            }
                                        }}
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., Python, JavaScript, AWS"
                                    />
                                    <button
                                        onClick={() => addSkill('technical', techSkillInput)}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {skills.technical.map((skill, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
                                        >
                                            {skill}
                                            <button
                                                onClick={() => removeSkill('technical', index)}
                                                className="text-blue-900 hover:text-blue-700"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Soft Skills */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Soft Skills
                                </label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={softSkillInput}
                                        onChange={(e) => setSoftSkillInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addSkill('soft', softSkillInput);
                                            }
                                        }}
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., Leadership, Communication"
                                    />
                                    <button
                                        onClick={() => addSkill('soft', softSkillInput)}
                                        className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {skills.soft.map((skill, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-2"
                                        >
                                            {skill}
                                            <button
                                                onClick={() => removeSkill('soft', index)}
                                                className="text-purple-900 hover:text-purple-700"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Tools */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tools & Technologies
                                </label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={toolInput}
                                        onChange={(e) => setToolInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addSkill('tools', toolInput);
                                            }
                                        }}
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., Git, Docker, Jira"
                                    />
                                    <button
                                        onClick={() => addSkill('tools', toolInput)}
                                        className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {skills.tools.map((tool, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-2"
                                        >
                                            {tool}
                                            <button
                                                onClick={() => removeSkill('tools', index)}
                                                className="text-green-900 hover:text-green-700"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setStep(3)}
                                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                                >
                                    ← Back
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-xl transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : '✨ Complete Setup'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }
        loadProfile();
    }, [user]);

    const loadProfile = async () => {
        if (!user) return;

        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));

            if (userDoc.exists()) {
                const data = userDoc.data();

                if (data.profile) setProfile(data.profile);
                if (data.baseExperience && data.baseExperience.length > 0) {
                    setExperience(data.baseExperience);
                }
                if (data.baseEducation && data.baseEducation.length > 0) {
                    setEducation(data.baseEducation);
                }
                if (data.baseSkills) setSkills(data.baseSkills);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);

        try {
            await updateDoc(doc(db, 'users', user.uid), {
                profile,
                baseExperience: experience,
                baseEducation: education,
                baseSkills: skills,
            });

            toast.success('Profile updated! 🎉');
        } catch (error) {
            console.error('Error saving:', error);
            toast.error('Failed to save profile');
        } finally {
            setSaving(false);
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

    const removeExperience = (index: number) => {
        setExperience(experience.filter((_, i) => i !== index));
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

    const removeEducation = (index: number) => {
        setEducation(education.filter((_, i) => i !== index));
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="text-gray-700 hover:text-gray-900"
                        >
                            ← Back to Dashboard
                        </button>
                        <h1 className="text-xl font-bold text-gray-900">Profile Settings</h1>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : '💾 Save Profile'}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
                    {/* Personal Info */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Personal Information</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <input
                                type="tel"
                                value={profile.phone}
                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Phone Number"
                            />
                            <input
                                type="text"
                                value={profile.location}
                                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Location (e.g., San Francisco, CA)"
                            />
                            <input
                                type="url"
                                value={profile.linkedin}
                                onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="LinkedIn URL"
                            />
                            <input
                                type="url"
                                value={profile.github}
                                onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="GitHub URL"
                            />
                        </div>
                    </div>

                    {/* Experience */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">Work Experience</h2>
                            <button
                                onClick={addExperience}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                            >
                                + Add Experience
                            </button>
                        </div>

                        {experience.map((exp, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-6 mb-4 space-y-4">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-gray-900">Position #{index + 1}</h3>
                                    {experience.length > 1 && (
                                        <button
                                            onClick={() => removeExperience(index)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>

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
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                                        <input
                                            type="month"
                                            value={exp.startDate}
                                            onChange={(e) => {
                                                const newExp = [...experience];
                                                newExp[index].startDate = e.target.value;
                                                setExperience(newExp);
                                            }}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">End Date</label>
                                        <input
                                            type="month"
                                            value={exp.endDate}
                                            onChange={(e) => {
                                                const newExp = [...experience];
                                                newExp[index].endDate = e.target.value;
                                                setExperience(newExp);
                                            }}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            disabled={exp.current}
                                        />
                                    </div>
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
                    </div>

                    {/* Education */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">Education</h2>
                            <button
                                onClick={addEducation}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                            >
                                + Add Education
                            </button>
                        </div>

                        {education.map((edu, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-6 mb-4 space-y-4">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-gray-900">Degree #{index + 1}</h3>
                                    {education.length > 1 && (
                                        <button
                                            onClick={() => removeEducation(index)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>

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
                            </div>
                        ))}
                    </div>

                    {/* Skills */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Skills</h2>

                        {/* Technical Skills */}
                        <div className="mb-6">
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
                                            className="text-blue-900 hover:text-blue-700 font-bold"
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
                                            className="text-green-900 hover:text-green-700 font-bold"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl text-lg font-bold hover:shadow-2xl transition-all disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : '✨ Save Profile'}
                    </button>
                </div>
            </main>
        </div>
    );
}

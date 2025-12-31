'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface EditSuggestion {
    target_text: string;
    new_content: string;
    action: string;
    rationale?: string;
}

interface SectionAnalysis {
    section_name: string;
    original_text?: string;
    gaps: string[];
    suggestions?: string[];
    edits: EditSuggestion[];
}

interface SavedResume {
    id: number;
    filename: string;
    original_text: string;
    tailored_text: string;
    tailored_sections: SectionAnalysis[];
    created_at: string;
}

export default function ResumeViewerPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [resume, setResume] = useState<SavedResume | null>(null);
    const [sections, setSections] = useState<SectionAnalysis[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('preview'); // Default to preview

    useEffect(() => {
        const fetchResume = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    router.push('/login');
                    return;
                }

                const response = await fetch(`http://localhost:8000/api/resume/${params.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setResume(data);
                    setSections(data.tailored_sections);
                } else {
                    console.error('Failed to fetch resume');
                    router.push('/tracker');
                }
            } catch (error) {
                console.error('Error fetching resume:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResume();
    }, [params.id, router]);

    const handleUpdateSuggestion = (sectionIndex: number, editIndex: number, newValue: string) => {
        if (!sections) return;
        const newSections = [...sections];
        newSections[sectionIndex].edits[editIndex].new_content = newValue;
        setSections(newSections);
    };

    const handleSaveChanges = async () => {
        if (!sections || !resume) return;

        setIsSaving(true);
        try {
            // Reconstruct tailored text
            const tailoredText = sections.map(s => {
                let text = s.original_text || "";
                s.edits.forEach(edit => {
                    text = text.replace(edit.target_text, edit.new_content);
                });
                return text;
            }).join('\n\n');

            const token = localStorage.getItem('auth_token');
            const response = await fetch(`http://localhost:8000/api/resume/${resume.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    filename: resume.filename,
                    original_text: resume.original_text,
                    tailored_text: tailoredText,
                    tailored_sections: sections
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setResume(prev => prev ? { ...prev, tailored_text: tailoredText, tailored_sections: sections } : null);
                alert('Changes saved successfully!');
                setViewMode('preview');
            } else {
                alert('Failed to save changes.');
            }
        } catch (error) {
            console.error('Error saving changes:', error);
            alert('Error saving changes.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!resume || !sections) return null;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                    <Link href="/tracker" className="text-slate-500 hover:text-slate-800 transition-colors">
                        ← Back to Tracker
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {resume.filename}
                    </h1>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('preview')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'preview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Preview & Compare
                    </button>
                    <button
                        onClick={() => setViewMode('edit')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'edit' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Edit Suggestions
                    </button>
                </div>
            </div>

            {viewMode === 'edit' && (
                <div className="space-y-8 animate-fade-in-up">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-blue-800 text-sm">
                        Edit the suggestions below. Click "Save Changes" to update your tailored resume.
                    </div>

                    <div className="space-y-6">
                        {sections.map((section, sectionIdx) => (
                            <div key={sectionIdx} className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">{section.section_name}</h3>

                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-sm leading-relaxed text-slate-700 whitespace-pre-wrap font-sans">
                                    {(() => {
                                        if (!section.original_text) {
                                            return section.edits.length === 0 ?
                                                <p className="italic text-slate-400">No edits suggested.</p> :
                                                section.edits.map((edit, editIdx) => (
                                                    <div key={editIdx} className="mb-4 border-b pb-4 last:border-0">
                                                        <div className="line-through decoration-red-400 decoration-2 opacity-60 text-slate-500 mb-1">{edit.target_text}</div>
                                                        <textarea
                                                            className="w-full p-2 bg-green-50 border border-green-200 rounded text-green-800 text-sm focus:ring-2 focus:ring-green-500/20 outline-none"
                                                            value={edit.new_content}
                                                            onChange={(e) => handleUpdateSuggestion(sectionIdx, editIdx, e.target.value)}
                                                        />
                                                    </div>
                                                ));
                                        }

                                        const text = section.original_text;
                                        const elements = [];
                                        let lastIndex = 0;

                                        const sortedEdits = [...section.edits].map((e, i) => {
                                            const pos = text.indexOf(e.target_text);
                                            return { ...e, origIdx: i, pos };
                                        }).filter(e => e.pos !== -1).sort((a, b) => a.pos - b.pos);

                                        let validEdits = [];
                                        let currentCoverageLimit = -1;
                                        for (const edit of sortedEdits) {
                                            if (edit.pos >= currentCoverageLimit) {
                                                validEdits.push(edit);
                                                currentCoverageLimit = edit.pos + edit.target_text.length;
                                            }
                                        }

                                        validEdits.forEach((edit) => {
                                            if (edit.pos > lastIndex) {
                                                elements.push(<span key={`pre-${edit.origIdx}`}>{text.substring(lastIndex, edit.pos)}</span>);
                                            }

                                            elements.push(
                                                <span key={`edit-${edit.origIdx}`} className="mx-1 inline-block align-top">
                                                    <span className="line-through decoration-red-400 decoration-2 opacity-60 text-slate-500 mr-1 bg-red-50/50 px-1 rounded">
                                                        {edit.target_text}
                                                    </span>
                                                    <textarea
                                                        className="inline-block min-w-[300px] w-full max-w-full p-2 bg-green-50 border border-green-200 text-green-800 rounded text-sm mt-1 focus:ring-2 focus:ring-green-500/20 outline-none resize-y"
                                                        rows={Math.max(2, Math.ceil(edit.new_content.length / 60))}
                                                        value={edit.new_content}
                                                        onChange={(e) => handleUpdateSuggestion(sectionIdx, edit.origIdx, e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </span>
                                            );
                                            lastIndex = edit.pos + edit.target_text.length;
                                        });

                                        if (lastIndex < text.length) {
                                            elements.push(<span key="end">{text.substring(lastIndex)}</span>);
                                        }

                                        return elements;
                                    })()}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="fixed bottom-8 right-8">
                        <button
                            onClick={handleSaveChanges}
                            disabled={isSaving}
                            className={`px-8 py-4 rounded-full font-bold text-lg shadow-2xl transition-all transform hover:scale-105
                            ${isSaving ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            )}

            {viewMode === 'preview' && (
                <div className="grid grid-cols-2 gap-6 h-[calc(100vh-200px)] animate-fade-in-up">
                    <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col bg-white">
                        <div className="bg-slate-50 p-3 border-b border-slate-200 font-bold text-slate-500 uppercase text-xs tracking-wider">Original</div>
                        <div className="p-6 overflow-y-auto flex-1 whitespace-pre-wrap text-sm text-slate-600 font-mono">
                            {resume.original_text}
                        </div>
                    </div>

                    <div className="border border-green-200 rounded-xl overflow-hidden flex flex-col shadow-lg shadow-green-100 bg-white">
                        <div className="bg-green-50 p-3 border-b border-green-200 font-bold text-green-700 uppercase text-xs tracking-wider flex justify-between">
                            <span>Tailored Version</span>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 whitespace-pre-wrap text-sm text-slate-800 font-medium">
                            {sections.map(s => {
                                let text = s.original_text || "";
                                s.edits.forEach(edit => {
                                    text = text.replace(edit.target_text, edit.new_content);
                                });
                                return text;
                            }).join('\n\n')}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

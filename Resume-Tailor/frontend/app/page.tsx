'use client';

import { useState, useRef, useEffect } from 'react';
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

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [status, setStatus] = useState('');

  // New state for analysis flow
  const [sections, setSections] = useState<SectionAnalysis[] | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState('');
  const [initialScore, setInitialScore] = useState(0);
  const [projectedScore, setProjectedScore] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for passed JD from Tracker
  // Check for passed JD from Tracker
  useEffect(() => {
    const savedJD = localStorage.getItem('tailor_jd');
    if (savedJD) {
      setJobDescription(savedJD);
      localStorage.removeItem('tailor_jd');
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!file || !jobDescription) return;

    setIsLoading(true);
    setStatus('Uploading and Analyzing...');
    setDownloadUrl('');
    setSections(null);

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('job_description', jobDescription);

    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.sections) {
        setSections(data.sections);
        setUploadedFilename(data.filename);
        setInitialScore(data.initial_score || 0);
        setProjectedScore(data.projected_score || 0);
        setStatus('Analysis complete! Please review the suggestions below.');
      } else {
        setStatus('Something went wrong during analysis. Please try again.');
        console.log(data);
      }
    } catch (error) {
      console.error('Error analyzing file:', error);
      setStatus('Error connecting to server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSuggestion = (sectionIndex: number, editIndex: number, newValue: string) => {
    if (!sections) return;
    const newSections = [...sections];
    newSections[sectionIndex].edits[editIndex].new_content = newValue;
    setSections(newSections);
  };

  const handleFinalGenerate = async () => {
    if (!uploadedFilename || !sections) return;

    setIsLoading(true);
    setStatus('Applying changes and generating PDF...');

    try {
      const response = await fetch('http://localhost:8000/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: uploadedFilename,
          sections: sections
        }),
      });

      const data = await response.json();
      if (data.download_url) {
        setDownloadUrl(data.download_url);
        setStatus('Resume generated successfully!');
        setSections(null); // Hide the review section
      } else {
        setStatus('Something went wrong generating the PDF.');
      }
    } catch (error) {
      console.error('Error generating file:', error);
      setStatus('Error connecting to server.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper for Score Color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 border-green-200';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="sticky top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl group-hover:bg-indigo-700 transition">R</div>
              <h1 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition">Resume Tailor AI</h1>
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link href="/tracker" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">Application Tracker</Link>
            </nav>
          </div>
          <span className="text-sm font-medium text-slate-500 hidden sm:block">Fast. Private. Professional.</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Content Area (Left) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Tailor your resume in seconds.</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Upload your existing PDF resume and the job description you are targeting.
              Review our AI's suggestions before generating your final resume.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-8 md:p-10 space-y-8">

              {/* Step 1: Upload */}
              <div className={`transition-all duration-300 ${isLoading || sections || downloadUrl ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center mb-4">
                  <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mr-3">1</span>
                  <label className="text-lg font-semibold text-slate-800">Upload Resume (PDF)</label>
                </div>

                <div className="relative group">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-3 file:px-6
                    file:rounded-xl file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-50 file:text-indigo-700
                    file:transition-colors
                    hover:file:bg-indigo-100
                    cursor-pointer"
                  />
                  {!file && (
                    <p className="mt-2 text-sm text-slate-400 pl-2">Max file size: 10MB</p>
                  )}
                  {file && (
                    <p className="mt-2 text-sm text-green-600 pl-2 font-medium">✓ {file.name}</p>
                  )}
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Step 2: Job Description */}
              <div className={`transition-all duration-300 ${isLoading || sections || downloadUrl ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center mb-4">
                  <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mr-3">2</span>
                  <label className="text-lg font-semibold text-slate-800">Job Description</label>
                </div>
                <textarea
                  className="w-full p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-700 placeholder:text-slate-400 min-h-[200px] resize-y"
                  placeholder="Paste the full job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>

              {/* Action Area: Analyze */}
              {!sections && !downloadUrl && (
                <div className="pt-4">
                  <button
                    onClick={handleAnalyze}
                    disabled={isLoading || !file || !jobDescription}
                    className={`w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all transform duration-200
                    ${isLoading
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0'
                      }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {status || 'Processing...'}
                      </span>
                    ) : 'Start Gap Analysis'}
                  </button>
                </div>
              )}

              {/* Step 3: Review & Edit */}
              {sections && !downloadUrl && (
                <div className="pt-4 space-y-8 animate-fade-in-up">


                  <div className="flex items-center">
                    <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mr-3">3</span>
                    <label className="text-lg font-semibold text-slate-800">Review Analysis & Suggestions</label>
                  </div>
                  <p className="text-slate-600">Review the AI's analysis for each section. Check the identified gaps and edit the suggestions before regenerating.</p>

                  <div className="space-y-8">
                    {sections.map((section, sectionIdx) => (
                      <div key={sectionIdx} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">{section.section_name}</h3>

                        {/* Gaps Display */}
                        {section.gaps && section.gaps.length > 0 && (
                          <div className="mb-6 bg-orange-50 p-4 rounded-xl border border-orange-100">
                            <h4 className="text-sm font-bold uppercase text-orange-600 tracking-wide mb-2 flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                              Identified Gaps
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                              {section.gaps.map((gap, i) => (
                                <li key={i}>{gap}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Suggestions Display */}
                        {section.suggestions && section.suggestions.length > 0 && (
                          <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <h4 className="text-sm font-bold uppercase text-blue-600 tracking-wide mb-2 flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              Strategic Advice
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                              {section.suggestions.map((suggestion, i) => (
                                <li key={i}>{suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Edits Display */}
                        {/* Inline Text Review */}
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

                            // Find edits positions
                            const sortedEdits = [...section.edits].map((e, i) => {
                              const pos = text.indexOf(e.target_text);
                              return { ...e, origIdx: i, pos };
                            }).filter(e => e.pos !== -1).sort((a, b) => a.pos - b.pos);

                            // Filter overlapping edits
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

                  <button
                    onClick={handleFinalGenerate}
                    disabled={isLoading}
                    className={`w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all transform duration-200 mt-6
                    ${isLoading
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-green-500/30 hover:-translate-y-0.5 active:translate-y-0'
                      }`}
                  >
                    {isLoading ? 'Generating Final Resume...' : 'Approve & Generate Resume'}
                  </button>
                </div>
              )}

              {/* Success Area */}
              {downloadUrl && (
                <div className="flex flex-col items-center justify-center space-y-4 animate-fade-in-up pt-8">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mb-2">✓</div>
                  <h3 className="text-2xl font-bold text-slate-800">Your Resume is Ready!</h3>
                  <p className="text-slate-500 mb-4 text-center">We've successfully tailored your resume based on your approved suggestions.</p>

                  <div className="flex space-x-4 w-full justify-center">
                    <a
                      href={downloadUrl}
                      download
                      className="flex-1 max-w-sm bg-indigo-600 text-white font-bold py-4 px-6 rounded-xl text-center hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download PDF
                    </a>
                    <button
                      onClick={() => {
                        setDownloadUrl('');
                        setJobDescription('');
                        setFile(null);
                        setStatus('');
                        setSections(null);
                        setUploadedFilename('');
                        setInitialScore(0);
                        setProjectedScore(0);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="flex-1 max-w-xs bg-white border border-slate-200 text-slate-600 font-bold py-4 px-6 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      Start Over
                    </button>
                  </div>
                </div>
              )}

              {status && !downloadUrl && !sections && <p className="text-center text-slate-500 mt-4 animate-pulse">{status}</p>}
            </div>
          </div>

          <p className="text-center text-slate-400 mt-12 text-sm">
            Powered by GPT-4 and Advanced Resume Logic. Private & Secure.
          </p>
        </div >

        {/* Right Sidebar - Scorecard */}
        < div className="lg:col-span-1" >
          <div className="sticky top-24 transition-all duration-500">
            {(sections || initialScore > 0) ? (
              <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl animate-fade-in-up">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-100 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    Scorecard
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">Live analysis against JD.</p>
                </div>

                <div className="space-y-6">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-slate-300 text-sm font-medium">Initial Match</span>
                      <span className={`text-2xl font-bold ${getScoreColor(initialScore).split(' ')[0]}`}>{initialScore}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className={`h-2 rounded-full ${getScoreColor(initialScore).replace('text-', 'bg-').split(' ')[1]}`} style={{ width: `${initialScore}%` }}></div>
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 relative overflow-hidden">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-green-400 text-sm font-bold">Projected Match</span>
                      <span className="text-3xl font-bold text-green-400">{projectedScore}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3">
                      <div className="h-3 rounded-full bg-gradient-to-r from-green-500 to-green-300 shadow-[0_0_10px_rgba(34,197,94,0.5)]" style={{ width: `${projectedScore}%` }}></div>
                    </div>
                    <p className="text-xs text-green-500/80 mt-3 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                      After applying AI suggestions
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm opacity-60 pointer-events-none grayscale">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto flex items-center justify-center text-slate-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  </div>
                  <h3 className="font-bold text-slate-400">No Analysis Yet</h3>
                  <p className="text-xs text-slate-400">Upload a resume and JD to see your scorecard here.</p>
                </div>
              </div>
            )}
          </div>
        </div >
      </div >
    </main >
  );
}

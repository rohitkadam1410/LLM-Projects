'use client';

import { useState } from 'react';

interface EditSuggestion {
  target_text: string;
  new_content: string;
  action: string;
  rationale?: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [status, setStatus] = useState('');

  // New state for analysis flow
  const [analysisResults, setAnalysisResults] = useState<EditSuggestion[] | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState('');

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
    setAnalysisResults(null);

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('job_description', jobDescription);

    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.analysis) {
        setAnalysisResults(data.analysis);
        setUploadedFilename(data.filename);
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

  const handleUpdateSuggestion = (index: number, newValue: string) => {
    if (!analysisResults) return;
    const newResults = [...analysisResults];
    newResults[index].new_content = newValue;
    setAnalysisResults(newResults);
  };

  const handleFinalGenerate = async () => {
    if (!uploadedFilename || !analysisResults) return;

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
          edits: analysisResults
        }),
      });

      const data = await response.json();
      if (data.download_url) {
        setDownloadUrl(data.download_url);
        setStatus('Resume generated successfully!');
        setAnalysisResults(null); // Hide the review section
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

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="sticky top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">R</div>
            <h1 className="text-xl font-bold text-slate-800">Resume Tailor AI</h1>
          </div>
          <span className="text-sm font-medium text-slate-500">Fast. Private. Professional.</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Tailor your resume in seconds.</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Upload your existing PDF resume and the job description you are targeting.
            Review our AI's suggestions before generating your final resume.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="p-8 md:p-10 space-y-8">

            {/* Step 1: Upload */}
            <div className={`transition-all duration-300 ${isLoading || analysisResults || downloadUrl ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center mb-4">
                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mr-3">1</span>
                <label className="text-lg font-semibold text-slate-800">Upload Resume (PDF)</label>
              </div>

              <div className="relative group">
                <input
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
            <div className={`transition-all duration-300 ${isLoading || analysisResults || downloadUrl ? 'opacity-50 pointer-events-none' : ''}`}>
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
            {!analysisResults && !downloadUrl && (
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
            {analysisResults && !downloadUrl && (
              <div className="pt-4 space-y-6 animate-fade-in-up">
                <div className="flex items-center mb-4">
                  <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mr-3">3</span>
                  <label className="text-lg font-semibold text-slate-800">Review & Edit Suggestions</label>
                </div>
                <p className="text-slate-600">Review the AI's suggestions below. You can edit the "Suggested Text" before proceeding.</p>

                <div className="space-y-4">
                  {analysisResults.map((edit, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      {edit.rationale && (
                        <div className="mb-2">
                          <span className="text-xs font-bold uppercase text-indigo-500 tracking-wide">Rationale</span>
                          <p className="text-sm text-slate-600 italic">{edit.rationale}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs font-bold uppercase text-slate-400 tracking-wide">Original Text</span>
                          <div className="p-3 bg-white rounded-lg border border-red-100 text-sm text-slate-500 mt-1">
                            {edit.target_text}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs font-bold uppercase text-green-600 tracking-wide">Suggested Text (Editable)</span>
                          <textarea
                            className="w-full p-3 bg-white rounded-lg border border-green-200 text-sm text-slate-800 mt-1 focus:ring-2 focus:ring-green-500/20 outline-none"
                            rows={4}
                            value={edit.new_content}
                            onChange={(e) => handleUpdateSuggestion(idx, e.target.value)}
                          />
                        </div>
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
                      setAnalysisResults(null);
                      setUploadedFilename('');
                    }}
                    className="flex-1 max-w-xs bg-white border border-slate-200 text-slate-600 font-bold py-4 px-6 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Start Over
                  </button>
                </div>
              </div>
            )}

            {status && !downloadUrl && !analysisResults && <p className="text-center text-slate-500 mt-4 animate-pulse">{status}</p>}
          </div>
        </div>

        <p className="text-center text-slate-400 mt-12 text-sm">
          Powered by GPT-4 and Advanced Resume Logic. Private & Secure.
        </p>
      </div>
    </main>
  );
}

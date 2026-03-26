/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileUp, 
  FileText, 
  Image as ImageIcon, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  X,
  ChevronRight,
  Info,
  Terminal,
  History
} from 'lucide-react';
import { analyzePdf, AnalysisResult } from './lib/pdf-analyzer';

export default function App() {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [result?.logs]);

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }

    setError(null);
    setResult(null);
    setIsAnalyzing(true);
    setShowLogs(true);

    try {
      const analysis = await analyzePdf(file);
      setResult(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans selection:bg-[#1A1A1A] selection:text-white">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <FileText className="text-white w-5 h-5" />
            </div>
            <h1 className="font-semibold tracking-tight text-lg">PDF Text Detector</h1>
          </div>
          <div className="flex items-center gap-4">
            {result && (
              <button 
                onClick={() => setShowLogs(!showLogs)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${showLogs ? 'bg-black text-white' : 'bg-black/5 text-black/40 hover:bg-black/10'}`}
              >
                <Terminal className="w-3.5 h-3.5" />
                {showLogs ? 'Hide Logs' : 'Show Logs'}
              </button>
            )}
            <div className="text-xs font-mono text-black/40 uppercase tracking-widest hidden sm:block">
              Client-Side Analysis
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid gap-8">
          {/* Upload Section */}
          <section>
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`
                relative group cursor-pointer
                border-2 border-dashed rounded-2xl p-12
                transition-all duration-300 ease-out
                flex flex-col items-center justify-center gap-4
                ${isDragging ? 'border-black bg-black/5 scale-[0.99]' : 'border-black/10 bg-white hover:border-black/20'}
              `}
            >
              <input 
                type="file" 
                accept=".pdf" 
                onChange={onFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              
              <div className={`
                w-16 h-16 rounded-full flex items-center justify-center
                transition-transform duration-300 group-hover:scale-110
                ${isDragging ? 'bg-black text-white' : 'bg-black/5 text-black/40'}
              `}>
                {isAnalyzing ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <FileUp className="w-8 h-8" />
                )}
              </div>

              <div className="text-center">
                <p className="font-medium text-lg">
                  {isAnalyzing ? 'Analyzing Document...' : 'Drop your PDF here'}
                </p>
                <p className="text-black/40 text-sm mt-1">
                  or click to browse your files
                </p>
              </div>

              {isAnalyzing && (
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  className="absolute bottom-0 left-0 h-1 bg-black rounded-b-2xl"
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
              )}
            </div>
          </section>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3 text-red-900"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Analysis Failed</p>
                  <p className="text-sm opacity-80">{error}</p>
                </div>
                <button 
                  onClick={() => setError(null)}
                  className="p-1 hover:bg-red-100 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Analysis Logs */}
          <AnimatePresence>
            {showLogs && result?.logs && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-[#1A1A1A] text-white/80 rounded-2xl p-6 font-mono text-xs shadow-xl border border-white/10">
                  <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-green-400" />
                      <span className="font-bold uppercase tracking-widest text-white">Analysis Logs</span>
                    </div>
                    <button 
                      onClick={() => setShowLogs(false)}
                      className="text-white/40 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                    {result.logs.map((log, idx) => (
                      <div key={idx} className="flex gap-3">
                        <span className="text-white/20 shrink-0">[{log.timestamp}]</span>
                        <span className={`
                          ${log.type === 'success' ? 'text-green-400' : 
                            log.type === 'warning' ? 'text-amber-400' : 
                            log.type === 'error' ? 'text-red-400' : 'text-white/60'}
                        `}>
                          {log.message}
                        </span>
                      </div>
                    ))}
                    <div ref={logEndRef} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Section */}
          <AnimatePresence>
            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-8"
              >
                {/* Summary Card */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-black/5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">{result.fileName}</h2>
                      <p className="text-black/40 font-mono text-sm mt-1 uppercase tracking-wider">
                        {result.totalPages} Pages Processed
                      </p>
                    </div>
                    
                    <div className={`
                      px-6 py-3 rounded-full flex items-center gap-3 font-semibold
                      ${result.isAllText ? 'bg-green-50 text-green-700 border border-green-100' : 
                        result.isAllImage ? 'bg-amber-50 text-amber-700 border border-amber-100' : 
                        'bg-blue-50 text-blue-700 border border-blue-100'}
                    `}>
                      {result.isAllText ? (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Fully Selectable
                        </>
                      ) : result.isAllImage ? (
                        <>
                          <ImageIcon className="w-5 h-5" />
                          Image-Only Document
                        </>
                      ) : (
                        <>
                          <Info className="w-5 h-5" />
                          Mixed Content
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#F9F9F9] p-6 rounded-xl border border-black/5">
                      <p className="text-black/40 text-xs font-bold uppercase tracking-widest mb-1">Selectable Pages</p>
                      <p className="text-3xl font-bold">{result.textOnlyPages.length}</p>
                    </div>
                    <div className="bg-[#F9F9F9] p-6 rounded-xl border border-black/5">
                      <p className="text-black/40 text-xs font-bold uppercase tracking-widest mb-1">Image-Only Pages</p>
                      <p className="text-3xl font-bold">{result.imageOnlyPages.length}</p>
                    </div>
                    <div className="bg-[#F9F9F9] p-6 rounded-xl border border-black/5">
                      <p className="text-black/40 text-xs font-bold uppercase tracking-widest mb-1">Text Coverage</p>
                      <p className="text-3xl font-bold">
                        {Math.round((result.textOnlyPages.length / result.totalPages) * 100)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detailed Report */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-black/5">
                  <div className="px-8 py-6 border-b border-black/5 flex items-center justify-between bg-[#FAFAFA]">
                    <h3 className="font-bold text-lg">Page-by-Page Analysis</h3>
                    <div className="flex gap-4 text-xs font-medium">
                      <span className="flex items-center gap-1.5 text-green-600">
                        <div className="w-2 h-2 rounded-full bg-current" /> Selectable
                      </span>
                      <span className="flex items-center gap-1.5 text-amber-600">
                        <div className="w-2 h-2 rounded-full bg-current" /> Image-Only
                      </span>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-black/5 max-h-[600px] overflow-y-auto">
                    {result.pages.map((page) => (
                      <div 
                        key={page.pageNumber}
                        className="px-8 py-4 flex items-center justify-between hover:bg-[#F9F9F9] transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-black/30 w-8">
                            {page.pageNumber.toString().padStart(2, '0')}
                          </span>
                          <div className="flex flex-col">
                            <span className="font-semibold">
                              {page.hasText ? 'Selectable Text' : 'Image Only'}
                            </span>
                            {page.error ? (
                              <span className="text-xs text-red-500">{page.error}</span>
                            ) : (
                              <span className="text-xs text-black/40">
                                {page.hasText ? `${page.textCount} text elements detected` : 'No text content found'}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center
                          ${page.hasText ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}
                        `}>
                          {page.hasText ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex justify-center pb-12">
                  <button 
                    onClick={() => { setResult(null); setShowLogs(false); }}
                    className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full font-semibold hover:bg-black/80 transition-all active:scale-95"
                  >
                    Analyze Another PDF
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State / Intro */}
          {!result && !isAnalyzing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-2xl mx-auto text-center py-12"
            >
              <h2 className="text-3xl font-bold tracking-tight mb-4">Why check for selectable text?</h2>
              <p className="text-black/50 leading-relaxed mb-8">
                PDFs that are just images (like scanned documents) aren't searchable, 
                can't be indexed by search engines, and are inaccessible to screen readers. 
                Our tool helps you identify these pages so you can run OCR on them.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                <div className="p-6 bg-white rounded-2xl border border-black/5 shadow-sm">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold mb-2">100% Private</h4>
                  <p className="text-sm text-black/40">Your files never leave your computer. Analysis happens entirely in your browser.</p>
                </div>
                <div className="p-6 bg-white rounded-2xl border border-black/5 shadow-sm">
                  <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                    <History className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold mb-2">Analysis Logs</h4>
                  <p className="text-sm text-black/40">Track the analysis process in real-time with detailed logs for every page.</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <footer className="border-t border-black/5 py-12 bg-white">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-40">
            <FileText className="w-4 h-4" />
            <span className="text-xs font-mono uppercase tracking-widest">PDF Text Detector v1.1</span>
          </div>
          <div className="flex gap-8 text-xs font-medium text-black/40 uppercase tracking-widest">
            <span>Privacy First</span>
            <span>No Server Logs</span>
            <span>Open Source</span>
          </div>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}

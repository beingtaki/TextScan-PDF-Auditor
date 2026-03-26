import * as pdfjs from 'pdfjs-dist';

// Use the worker from the package itself via Vite's ?url import
// @ts-ignore - Vite specific import suffix
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface PageResult {
  pageNumber: number;
  hasText: boolean;
  textCount: number;
  error?: string;
}

export interface AnalysisResult {
  fileName: string;
  totalPages: number;
  pages: PageResult[];
  isAllText: boolean;
  isAllImage: boolean;
  textOnlyPages: number[];
  imageOnlyPages: number[];
  logs: LogEntry[];
}

export async function analyzePdf(file: File): Promise<AnalysisResult> {
  const logs: LogEntry[] = [];
  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    logs.push({
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    });
  };

  addLog(`Starting analysis for: ${file.name}`);
  const arrayBuffer = await file.arrayBuffer();
  
  try {
    addLog('Loading PDF document...');
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    addLog(`PDF loaded successfully. Total pages: ${pdf.numPages}`, 'success');
    
    const results: PageResult[] = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        addLog(`Analyzing page ${i}...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Check if there are any text items
        const hasText = textContent.items.length > 0;
        
        if (hasText) {
          addLog(`Page ${i}: Selectable text detected (${textContent.items.length} items)`, 'success');
        } else {
          addLog(`Page ${i}: No selectable text found (image-only)`, 'warning');
        }
        
        results.push({
          pageNumber: i,
          hasText,
          textCount: textContent.items.length
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to parse page';
        addLog(`Page ${i}: Error - ${errorMsg}`, 'error');
        results.push({
          pageNumber: i,
          hasText: false,
          textCount: 0,
          error: errorMsg
        });
      }
    }
    
    const imageOnlyPages = results.filter(r => !r.hasText).map(r => r.pageNumber);
    const textOnlyPages = results.filter(r => r.hasText).map(r => r.pageNumber);
    
    addLog('Analysis complete.', 'success');
    
    return {
      fileName: file.name,
      totalPages: pdf.numPages,
      pages: results,
      isAllText: imageOnlyPages.length === 0,
      isAllImage: textOnlyPages.length === 0,
      textOnlyPages,
      imageOnlyPages,
      logs
    };
  } catch (err) {
    if (err instanceof Error && err.name === 'PasswordException') {
      addLog('Error: PDF is encrypted', 'error');
      throw new Error('This PDF is encrypted. Please provide an unencrypted file.');
    }
    addLog(`Critical Error: ${err instanceof Error ? err.message : 'Failed to load PDF'}`, 'error');
    throw new Error(err instanceof Error ? err.message : 'Failed to load PDF');
  }
}

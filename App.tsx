import React, { useState, useEffect } from 'react';
import { analyzeProperty } from './services/geminiService';
import { PropertyData, FinancialParams, SavedAnalysis } from './types';
import { Dashboard } from './components/Dashboard';
import { calculateMetrics, formatCurrency } from './utils/calculations';

const DEFAULT_PARAMS: FinancialParams = {
  downPaymentPercent: 20,
  interestRate: 6.5,
  loanTermYears: 30,
  closingCostsPercent: 2,
};

function App() {
  const [apiKey, setApiKey] = useState<string>('');
  const [isKeyEntered, setIsKeyEntered] = useState(false);

  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [financialParams, setFinancialParams] = useState<FinancialParams>(DEFAULT_PARAMS);
  const [history, setHistory] = useState<SavedAnalysis[]>([]);
  const [sharedView, setSharedView] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Load API Key, History, and Check URL for Shared Data on Mount
  useEffect(() => {
    // 1. Check for Shared Data in URL
    const urlParams = new URLSearchParams(window.location.search);
    const sharedDataRaw = urlParams.get('share');
    
    if (sharedDataRaw) {
      try {
        const decoded = JSON.parse(decodeURIComponent(sharedDataRaw));
        if (decoded.property && decoded.params) {
          setPropertyData(decoded.property);
          setFinancialParams(decoded.params);
          setSharedView(true); // Flag to bypass gatekeeper
        }
      } catch (e) {
        console.error("Failed to parse shared data", e);
        setError("The shared link is invalid or corrupted.");
      }
    }

    // 2. Load API Key
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      setIsKeyEntered(true);
    }

    // 3. Load History
    const storedHistory = localStorage.getItem('caprate_history');
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim().length > 10) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setIsKeyEntered(true);
    }
  };

  const handleLogout = () => {
    if (window.confirm("This will clear your API Key. Your saved history will remain.")) {
      localStorage.removeItem('gemini_api_key');
      setApiKey('');
      setIsKeyEntered(false);
      setPropertyData(null);
      setSharedView(false);
    }
  };

  const saveToHistory = (prop: PropertyData, params: FinancialParams) => {
    const newItem: SavedAnalysis = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      address: prop.address,
      property: prop,
      params: params
    };

    const filteredHistory = history.filter(h => h.address.toLowerCase() !== prop.address.toLowerCase());
    const newHistory = [newItem, ...filteredHistory];
    
    setHistory(newHistory);
    localStorage.setItem('caprate_history', JSON.stringify(newHistory));
  };

  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem('caprate_history', JSON.stringify(newHistory));
  };

  const loadFromHistory = (item: SavedAnalysis) => {
    setPropertyData(item.property);
    setFinancialParams(item.params);
    setAddress(item.address);
    setError(null);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    setLoading(true);
    setError(null);
    setPropertyData(null);
    setSharedView(false); // Reset shared view on new search

    try {
      const data = await analyzeProperty(address, apiKey);
      setPropertyData(data);
      saveToHistory(data, financialParams);
    } catch (err) {
      setError("We couldn't analyze that property. Please check the address, your API Key, or try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setPropertyData(null);
    setAddress('');
    setError(null);
    setSharedView(false);
    // Remove share param from URL without reloading
    window.history.pushState({}, document.title, window.location.pathname);
  };

  const handlePrintPdf = async () => {
    if (!propertyData) return;
    setGeneratingPdf(true);

    // Wait for state to propagate and DOM to update (removing scrollbars etc)
    setTimeout(async () => {
      try {
        const element = document.getElementById('dashboard-container');
        if (!element) throw new Error("Dashboard not found");

        const html2canvas = (window as any).html2canvas;
        const jspdf = (window as any).jspdf;

        if (!html2canvas || !jspdf) {
          throw new Error("PDF libraries not loaded. Please refresh.");
        }

        const canvas = await html2canvas(element, {
          scale: 2, // High resolution
          useCORS: true, // Allow external images if any
          logging: false
        });

        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = jspdf;
        
        // PDF Dimensions
        const pdfWidth = 210; // A4 width in mm
        const margin = 10;    // 10mm margin
        const imgWidth = pdfWidth - (margin * 2);
        
        const imgProps = { width: canvas.width, height: canvas.height };
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        
        // Height includes top/bottom margins
        const pdfHeight = imgHeight + (margin * 2);

        const doc = new jsPDF({
          orientation: pdfHeight > pdfWidth ? 'p' : 'l',
          unit: 'mm',
          format: [pdfWidth, pdfHeight] // Custom format to accommodate length
        });

        // Add image with margin coordinates
        doc.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
        
        // Clean filename
        const filename = `Analysis_${propertyData.address.replace(/[^a-z0-9]/gi, '_').substring(0, 20)}.pdf`;
        doc.save(filename);

      } catch (err) {
        console.error("PDF Generation failed", err);
        setError("Failed to generate PDF. You can try standard printing (Ctrl+P) instead.");
      } finally {
        setGeneratingPdf(false);
      }
    }, 500);
  };

  const handleShare = () => {
    if (!propertyData) return;

    // Create a compact object for the URL
    const shareObj = {
      property: propertyData,
      params: financialParams
    };

    const encoded = encodeURIComponent(JSON.stringify(shareObj));
    const shareUrl = `${window.location.origin}${window.location.pathname}?share=${encoded}`;

    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

  // ------------------------------------------------------------------
  // RENDER: API Key Entry (Gatekeeper)
  // Only show if we don't have a key AND we aren't viewing a shared link
  // ------------------------------------------------------------------
  if (!isKeyEntered && !sharedView) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-100">
           <div className="text-center mb-6">
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-brand-900">
                CapRate AI
              </h1>
              <p className="text-gray-500 mt-2 text-sm">Enter your Gemini API Key to access the tool.</p>
           </div>
           
           <form onSubmit={handleKeySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">API Key</label>
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none transition-shadow bg-gray-50"
                  required
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors"
              >
                Access App
              </button>
           </form>
           <p className="text-xs text-gray-400 mt-4 text-center">
             Your key is stored locally in your browser and sent directly to Google. It is never saved to our servers.
           </p>
            <div className="mt-4 text-center">
             <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline">
               Get a free Gemini API Key here
             </a>
           </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // RENDER: Dashboard (Analysis Result)
  // ------------------------------------------------------------------
  if (propertyData) {
    return (
      <div className="min-h-screen bg-slate-50 text-gray-800 font-sans print:bg-white">
        <header className="bg-white border-b py-4 shadow-sm sticky top-0 z-30 print:hidden no-print">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <button 
                onClick={handleBack}
                className="flex items-center text-gray-500 hover:text-brand-600 transition-colors"
               >
                 <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                 Back
               </button>
               <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-brand-900 cursor-default">
                 CapRate AI
               </h1>
            </div>
            
            <div className="flex gap-2">
               {/* Share Button */}
               <button 
                 onClick={handleShare}
                 className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors border border-brand-200"
               >
                 {shareCopied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      Copied!
                    </>
                 ) : (
                    <>
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                       Share
                    </>
                 )}
               </button>

               {/* Print Button */}
               <button 
                 onClick={handlePrintPdf}
                 disabled={generatingPdf}
                 className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 disabled:opacity-50"
               >
                 {generatingPdf ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Generating...
                    </>
                 ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                      Save PDF
                    </>
                 )}
               </button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 pb-20 mt-6 print:mt-0 print:px-0 print:pb-0">
           {/* Verification Warning - Hide in Print */}
           {!generatingPdf && (
             <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r shadow-sm animate-fade-in-up no-print">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong className="font-medium">Verification Needed:</strong> The data below (Rent, Taxes, Price) are estimates powered by AI. Please review and adjust the inputs on the left to ensure accuracy before making decisions.
                    </p>
                  </div>
                </div>
              </div>
           )}

            {/* Read-only / Shared View Banner */}
            {sharedView && (
               <div className="bg-blue-50 border border-blue-200 p-3 mb-6 rounded text-center no-print">
                  <p className="text-sm text-blue-800">
                    You are viewing a <strong>shared analysis</strong>. 
                    {!isKeyEntered && <span className="ml-1">To run your own search, please <button onClick={handleBack} className="underline font-bold">enter an API Key</button>.</span>}
                  </p>
               </div>
            )}

            <div className="animate-fade-in-up">
              <Dashboard 
                property={propertyData} 
                params={financialParams}
                onPropertyChange={(p) => {
                  setPropertyData(p);
                  if (!sharedView) saveToHistory(p, financialParams); 
                }}
                onParamsChange={(p) => {
                  setFinancialParams(p);
                  if (!sharedView) saveToHistory(propertyData, p);
                }}
                isPdfGenerating={generatingPdf}
              />
            </div>
        </main>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // RENDER: Search & History
  // ------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 font-sans flex flex-col items-center pt-20 px-4">
      <div className="w-full max-w-2xl text-center mb-8 relative group">
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-brand-900 cursor-default mb-4">
          CapRate AI
        </h1>
        <p className="text-gray-500 text-lg">Instant rental yield analysis powered by Gemini.</p>
        <button onClick={handleLogout} className="absolute top-0 right-0 text-xs text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          Logout / Clear Key
        </button>
      </div>

      <div className="w-full max-w-xl mb-12">
        <form onSubmit={handleSearch} className="relative w-full">
            <div className="relative group shadow-sm hover:shadow-md transition-shadow rounded-lg">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input
              type="text"
              className="block w-full p-4 pl-10 text-sm text-gray-900 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none"
              placeholder="Enter property address (e.g. 123 Main St, Austin, TX)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2.5 bottom-2.5 bg-brand-600 hover:bg-brand-700 text-white focus:ring-4 focus:outline-none focus:ring-brand-300 font-medium rounded-md text-sm px-4 py-2 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </span>
              ) : "Calculate"}
            </button>
            </div>
            {loading && (
              <p className="mt-4 text-center text-sm text-gray-500 animate-pulse">Gathering comps from Zillow, StreetEasy & local records...</p>
            )}
        </form>
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
             <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             <p>{error}</p>
          </div>
        )}
      </div>

      {/* History List */}
      {history.length > 0 && (
        <div className="w-full max-w-3xl animate-fade-in-up">
           <h3 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-4 border-b pb-2">Recent Analyses</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {history.map((item) => {
               const metrics = calculateMetrics(item.property, item.params);
               return (
                 <div 
                  key={item.id} 
                  onClick={() => loadFromHistory(item)}
                  className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative"
                 >
                    <div className="flex justify-between items-start mb-2">
                       <h4 className="font-bold text-gray-900 truncate pr-6">{item.address}</h4>
                       <button 
                        onClick={(e) => deleteHistoryItem(e, item.id)}
                        className="text-gray-300 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                        title="Delete from history"
                       >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                       </button>
                    </div>
                    <div className="flex justify-between items-end">
                       <div>
                         <div className="text-xs text-gray-500">List: {formatCurrency(item.property.listPrice)}</div>
                         <div className="text-xs text-gray-500">Units: {item.property.numUnits}</div>
                       </div>
                       <div className="text-right">
                          <div className="text-sm font-bold text-brand-600">{metrics.capRate.toFixed(2)}% Cap</div>
                          <div className="text-xs text-gray-400">{new Date(item.timestamp).toLocaleDateString()}</div>
                       </div>
                    </div>
                 </div>
               );
             })}
           </div>
        </div>
      )}
    </div>
  );
}

export default App;
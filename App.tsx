import React, { useState, useEffect } from 'react';
import { analyzeProperty } from './services/geminiService';
import { PropertyData, FinancialParams } from './types';
import { Dashboard } from './components/Dashboard';

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
  const [hasSearched, setHasSearched] = useState(false);
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [financialParams, setFinancialParams] = useState<FinancialParams>(DEFAULT_PARAMS);

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      setIsKeyEntered(true);
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
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setIsKeyEntered(false);
    setPropertyData(null);
    setHasSearched(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const data = await analyzeProperty(address, apiKey);
      setPropertyData(data);
    } catch (err) {
      setError("We couldn't analyze that property. Please check the address, your API Key, or try again later.");
      setHasSearched(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isKeyEntered) {
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

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 font-sans">
      {/* Header / Hero */}
      <header className={`bg-white border-b transition-all duration-500 ease-in-out ${hasSearched ? 'py-4 shadow-sm sticky top-0 z-30' : 'py-32 flex flex-col items-center justify-center min-h-[60vh]'}`}>
        <div className={`container mx-auto px-4 ${hasSearched ? 'flex items-center justify-between' : 'text-center max-w-2xl'}`}>
          
          <div className={`${hasSearched ? 'flex items-center gap-6 flex-1' : 'w-full'}`}>
             {/* Logo / Title */}
             <div className={`${hasSearched ? 'shrink-0' : 'mb-8'} relative group`}>
               <h1 className={`${hasSearched ? 'text-xl' : 'text-5xl'} font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-brand-900 cursor-default`}>
                 CapRate AI
               </h1>
               {!hasSearched && <p className="mt-4 text-gray-500 text-lg">Instant rental yield analysis powered by Gemini.</p>}
               {/* Logout hidden button */}
               <button onClick={handleLogout} className="absolute -top-4 -left-4 text-xs text-gray-300 hover:text-red-500 p-2">
                 Reset Key
               </button>
             </div>

             {/* Search Form */}
             <form onSubmit={handleSearch} className={`relative ${hasSearched ? 'max-w-xl w-full' : 'w-full'}`}>
               <div className="relative group">
                 <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                 </div>
                 <input
                  type="text"
                  className="block w-full p-4 pl-10 text-sm text-gray-900 border border-gray-200 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none transition-shadow"
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
               {loading && !hasSearched && (
                 <p className="mt-4 text-sm text-gray-500 animate-pulse">Gathering comps from Zillow, StreetEasy & local records...</p>
               )}
             </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-20">
        {error && (
          <div className="max-w-2xl mx-auto mt-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
             <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             <p>{error}</p>
          </div>
        )}

        {!loading && propertyData && (
          <div className="animate-fade-in-up mt-6">
             <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r shadow-sm">
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

            <Dashboard 
              property={propertyData} 
              params={financialParams}
              onPropertyChange={setPropertyData}
              onParamsChange={setFinancialParams}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
import React, { useEffect, useState } from 'react';
import { db } from './services/firebase';
import { Match } from './types';
import { Marquee } from './components/Layout/Marquee';
import { CricketCard } from './components/Cards/CricketCard';
import { NetballCard } from './components/Cards/NetballCard';
import { AdminPanel } from './components/Admin/AdminPanel';

export default function App() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const unsubscribe = db.collection('matches').onSnapshot((snapshot) => {
      const ms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
      // Sort: Live first, then by Last Updated
      ms.sort((a, b) => {
        if (a.status === 'LIVE' && b.status !== 'LIVE') return -1;
        if (a.status !== 'LIVE' && b.status === 'LIVE') return 1;
        return (b.lastUpdated || 0) - (a.lastUpdated || 0);
      });
      setMatches(ms);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    if (pin === 'PENRICE') {
      setIsAdmin(true);
      setShowLogin(false);
      setPin('');
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-penrice-gold selection:text-black">
      <Marquee matches={matches} />

      {/* Header - Increased z-index to z-[60] to sit above expanded cards (z-50) */}
      <header className="bg-white border-b border-black sticky top-0 z-[60] shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center h-auto md:h-24">
           <div className="flex items-center w-full md:w-auto px-6 py-4 md:py-0">
               <div>
                   <h1 className="text-4xl font-display font-bold text-black leading-[0.85] uppercase tracking-tight">Match<br/>Centre</h1>
                   <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1.5 ml-0.5">Official Scores</span>
               </div>
           </div>
           <div className="flex items-center w-full md:w-auto border-t md:border-t-0 md:border-l border-gray-100 h-full">
               <button onClick={() => window.location.reload()} className="flex-1 md:flex-none h-12 md:h-full px-8 text-[10px] font-bold text-gray-500 hover:text-black hover:bg-gray-50 uppercase tracking-widest border-r border-gray-100 transition-colors">
                  <i className="fa-solid fa-rotate-right mr-2"></i> Refresh
               </button>
               <button 
                  onClick={() => isAdmin ? setIsAdmin(false) : setShowLogin(true)} 
                  className="flex-1 md:flex-none h-12 md:h-full px-8 text-[10px] font-bold bg-black text-white hover:bg-penrice-gold hover:text-black transition-colors uppercase tracking-widest"
               >
                  {isAdmin ? 'Logout' : 'Staff Login'}
               </button>
           </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-grow max-w-5xl mx-auto w-full px-4 lg:px-0 py-12 relative">
          {loading && (
             <div className="absolute inset-0 flex items-start justify-center pt-20 bg-white/80 z-20 backdrop-blur-[2px]">
                 <div className="text-2xl font-display font-bold text-black uppercase tracking-tight animate-pulse">Loading Fixtures...</div>
             </div>
          )}

          {isAdmin ? (
              <AdminPanel matches={matches} onClose={() => setIsAdmin(false)} />
          ) : (
             <div className="space-y-6">
                 <div className="mb-8 flex items-end gap-4 border-b-2 border-black pb-2">
                    <span className="text-sm font-bold text-black uppercase tracking-widest">Today's Fixtures</span>
                    <span className="text-[10px] font-mono text-gray-400 mb-0.5">LIVE UPDATES</span>
                 </div>
                 
                 {matches.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center py-32 border border-dashed border-gray-300">
                        <h3 className="text-2xl font-display font-bold text-gray-300 uppercase tracking-widest">No Active Matches</h3>
                    </div>
                 )}

                 {matches.map(match => (
                    match.sport === 'netball' 
                      ? <NetballCard key={match.id} match={match} /> 
                      : <CricketCard key={match.id} match={match} />
                 ))}
             </div>
          )}
      </main>

      {/* Login Modal */}
      {showLogin && (
          <div className="fixed inset-0 bg-white/95 z-[100] flex items-center justify-center p-4">
              <div className="w-full max-w-sm text-center border border-black p-8 card-shadow-hard bg-white">
                  <div className="w-10 h-10 bg-black text-white flex items-center justify-center mx-auto mb-6"><i className="fa-solid fa-lock"></i></div>
                  <h2 className="text-3xl font-display font-bold text-black uppercase tracking-tight mb-8">Staff<br/>Access</h2>
                  <input 
                    type="password" 
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className={`w-full text-center text-3xl font-display font-bold tracking-[0.5em] border-b-2 py-4 mb-8 outline-none bg-transparent ${error ? 'border-red-600 text-red-600' : 'border-black'}`}
                    placeholder="••••"
                  />
                  {error && <div className="text-red-600 text-xs font-bold mb-6 uppercase tracking-wider">Invalid Access Code</div>}
                  <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => { setShowLogin(false); setPin(''); setError(false); }} className="py-3 text-[10px] font-bold text-black border border-gray-200 hover:bg-gray-50 uppercase tracking-widest">Cancel</button>
                      <button onClick={handleLogin} className="py-3 text-[10px] font-bold text-white bg-black hover:bg-penrice-gold hover:text-black border border-black uppercase tracking-widest transition-colors">Authenticate</button>
                  </div>
              </div>
          </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-black py-12 mt-auto">
          <div className="max-w-5xl mx-auto px-4 flex justify-between items-center">
              <div className="text-black font-display font-bold text-2xl tracking-tighter uppercase leading-none">Penrice<br/><span className="text-gray-400">Sport</span></div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Powered by HippoLive</p>
          </div>
      </footer>
    </div>
  );
}
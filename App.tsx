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
  
  // App Access State
  const [isAppLocked, setIsAppLocked] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [unlockError, setUnlockError] = useState(false);
  
  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const unsubscribe = db.collection('matches').onSnapshot((snapshot) => {
      const ms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
      // Sort Logic: Manual sortOrder first. 
      // If sortOrder matches or is missing, fallback to stable ID sort to prevent jumping.
      ms.sort((a, b) => {
        const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) return orderA - orderB;
        
        // Fallback for items without sortOrder:
        // We do NOT use lastUpdated here to prevent jumping when editing.
        // Use ID for stable sorting of unsorted items.
        return a.id.localeCompare(b.id);
      });
      setMatches(ms);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAppUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'Hippo') {
        setIsAppLocked(false);
        setShowWelcome(true);
        setPasswordInput('');
    } else {
        setUnlockError(true);
    }
  };

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

  // --- VIEW 1: LOCK SCREEN ---
  if (isAppLocked) {
      return (
        <div className="min-h-screen bg-penrice-navy flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-penrice-gold opacity-10 blur-3xl animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400 opacity-10 blur-3xl animate-pulse delay-500"></div>

            <div className="max-w-md w-full bg-white p-8 md:p-12 card-shadow-hard border-2 border-black z-10 opacity-0 animate-pop-in">
                <div className="flex justify-center mb-8 opacity-0 animate-fade-in-down delay-200">
                    <div className="bg-white p-2 rounded-lg">
                        <img src="/pr-logo.png" alt="Penrice Logo" className="h-24 w-auto object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                    </div>
                </div>
                <div className="opacity-0 animate-fade-in-up delay-300">
                    <h1 className="text-3xl font-display font-bold text-center uppercase mb-2 leading-none">Penrice<br/>Match Centre</h1>
                    <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-8">Authorised Access Only</p>
                </div>
                
                <form onSubmit={handleAppUnlock} className="opacity-0 animate-fade-in-up delay-500">
                    <div className="relative mb-8">
                        <input 
                            type="password"
                            value={passwordInput}
                            onChange={(e) => { setPasswordInput(e.target.value); setUnlockError(false); }}
                            placeholder="Enter Password"
                            className={`w-full text-center font-bold text-xl border-b-2 py-3 outline-none transition-colors bg-transparent ${unlockError ? 'border-red-600 text-red-600 placeholder-red-300' : 'border-gray-200 focus:border-black text-black'}`}
                            autoFocus
                        />
                        {unlockError && <div className="absolute left-0 right-0 -bottom-6 text-center text-[10px] text-red-600 font-bold uppercase tracking-wider animate-bounce">Incorrect Password</div>}
                    </div>
                    <button type="submit" className="w-full bg-black text-white font-bold py-4 text-xs uppercase tracking-[0.15em] hover:bg-penrice-gold hover:text-black transition-colors border border-black">
                        Enter App
                    </button>
                </form>
            </div>
            <div className="absolute bottom-8 text-[9px] font-bold text-white/40 uppercase tracking-widest opacity-0 animate-fade-in delay-1000">Penrice Academy Sport</div>
        </div>
      );
  }

  // --- VIEW 2: WELCOME / ONBOARDING ---
  if (showWelcome) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
             <div className="max-w-xl w-full">
                 <div className="text-center mb-10 opacity-0 animate-fade-in-down">
                     <img src="/pr-logo.png" alt="Penrice Logo" className="h-20 w-auto mx-auto mb-6 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                     <span className="text-[10px] font-bold text-penrice-gold uppercase tracking-[0.3em] bg-black px-3 py-1 mb-4 inline-block">Official Hub</span>
                     <h2 className="text-5xl md:text-6xl font-display font-bold uppercase mb-2 tracking-tighter text-black leading-[0.9]">Welcome<br/>to Match Centre</h2>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Scores & Real-Time Updates</p>
                 </div>

                 <div className="bg-white border-2 border-black p-0 shadow-[8px_8px_0px_rgba(0,0,0,0.1)] mb-8 overflow-hidden opacity-0 animate-fade-in-up delay-200">
                     <div className="bg-black p-3 flex justify-between items-center">
                        <h3 className="text-[10px] font-bold text-white uppercase tracking-widest">Today's Fixtures</h3>
                        <span className="text-[10px] font-bold text-penrice-gold">{matches.length} Games</span>
                     </div>
                     
                     {loading ? (
                         <div className="text-center py-8 text-xs font-bold text-gray-300 uppercase animate-pulse">Loading Schedule...</div>
                     ) : matches.length > 0 ? (
                         <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto custom-scroll">
                             {matches.map(m => (
                                 <div key={m.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                                     <div className="flex items-center gap-4">
                                         <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-lg">
                                            {m.sport === 'netball' ? '🏐' : '🏏'}
                                         </div>
                                         <div>
                                             <div className="text-xs font-bold text-black uppercase leading-tight">{m.teamName} <span className="text-gray-400 mx-1">vs</span> {m.opponent}</div>
                                             <div className="text-[9px] font-bold text-gray-400 mt-1 flex items-center gap-2">
                                                 <span>{m.yearGroup || 'Fixture'}</span>
                                                 <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                 <span>{m.sport}</span>
                                             </div>
                                         </div>
                                     </div>
                                     <div>
                                         {m.status === 'LIVE' && <span className="bg-red-600 text-white text-[9px] font-bold px-2 py-1 uppercase rounded-sm animate-pulse">Live</span>}
                                         {m.status === 'UPCOMING' && <span className="bg-gray-100 text-gray-500 text-[9px] font-bold px-2 py-1 uppercase rounded-sm">Soon</span>}
                                         {(m.status === 'FT' || m.status === 'RESULT') && <span className="bg-black text-white text-[9px] font-bold px-2 py-1 uppercase rounded-sm">FT</span>}
                                     </div>
                                 </div>
                             ))}
                         </div>
                     ) : (
                         <div className="text-center py-8">
                             <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">No fixtures scheduled today</p>
                         </div>
                     )}
                 </div>

                 <button 
                    onClick={() => setShowWelcome(false)} 
                    className="opacity-0 animate-fade-in-up delay-300 w-full bg-penrice-gold border-2 border-black text-black font-display font-bold text-xl py-5 uppercase tracking-wider hover:bg-black hover:text-white transition-all shadow-[6px_6px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none group"
                 >
                     Enter Match Centre <i className="fa-solid fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
                 </button>
             </div>
        </div>
      );
  }

  // --- VIEW 3: MAIN APP ---
  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-penrice-gold selection:text-black animate-fade-in">
      <Marquee matches={matches} />

      {/* Header - Increased z-index to z-[60] to sit above expanded cards (z-50) */}
      <header className="bg-white border-b border-black sticky top-0 z-[60] shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center h-auto md:h-24">
           <div className="flex items-center w-full md:w-auto px-6 py-4 md:py-0">
               <div>
                   <h1 className="text-4xl font-display font-bold text-black leading-[0.85] uppercase tracking-tight">Penrice<br/>Match Centre</h1>
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
                      ? <NetballCard key={match.id} match={match} allMatches={matches} /> 
                      : <CricketCard key={match.id} match={match} allMatches={matches} />
                 ))}
             </div>
          )}
      </main>

      {/* Login Modal */}
      {showLogin && (
          <div className="fixed inset-0 bg-white/95 z-[100] flex items-center justify-center p-4 animate-fade-in">
              <div className="w-full max-w-sm text-center border border-black p-8 card-shadow-hard bg-white animate-pop-in">
                  <div className="w-10 h-10 bg-black text-white flex items-center justify-center mx-auto mb-6"><i className="fa-solid fa-lock"></i></div>
                  <h2 className="text-3xl font-display font-bold text-black uppercase tracking-tight mb-8">Staff<br/>Access</h2>
                  <input 
                    type="password" 
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className={`w-full text-center text-3xl font-display font-bold tracking-[0.5em] border-b-2 py-4 mb-8 outline-none bg-transparent ${error ? 'border-red-600 text-red-600' : 'border-black'}`}
                    placeholder="••••"
                    autoFocus
                  />
                  {error && <div className="text-red-600 text-xs font-bold mb-6 uppercase tracking-wider animate-bounce">Invalid Access Code</div>}
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
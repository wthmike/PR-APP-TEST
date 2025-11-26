import React, { useEffect, useState } from 'react';
import { db, auth } from './services/firebase';
import { Match } from './types';
import { Marquee } from './components/Layout/Marquee';
import { CricketCard } from './components/Cards/CricketCard';
import { NetballCard } from './components/Cards/NetballCard';
import { RugbyCard } from './components/Cards/RugbyCard';
import { AdminPanel } from './components/Admin/AdminPanel';
import { NewsFeed } from './components/News/NewsFeed';
import { Logo } from './components/Shared';

export default function App() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  
  // App Access State
  const [isAppLocked, setIsAppLocked] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [unlockError, setUnlockError] = useState(false);
  
  // View State
  const [viewMode, setViewMode] = useState<'live' | 'news'>('live');
  
  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
          // If not logged in, try to sign in anonymously to read data
          try {
              await auth.signInAnonymously();
          } catch (err) {
              console.error("Anonymous Auth Failed:", err);
              setLoading(false);
          }
          return;
      }

      // User is authenticated, connect to DB
      if (!unsubscribeSnapshot) {
          unsubscribeSnapshot = db.collection('matches').onSnapshot((snapshot) => {
            const ms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
            // Sort Logic: Manual sortOrder first. 
            // If sortOrder matches or is missing, fallback to stable ID sort to prevent jumping.
            ms.sort((a, b) => {
              const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
              const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
              if (orderA !== orderB) return orderA - orderB;
              
              // Fallback for items without sortOrder:
              return a.id.localeCompare(b.id);
            });
            setMatches(ms);
            setLoading(false);
          }, (error) => {
            console.error("Firestore Permission Error:", error);
            setLoading(false);
          });
      }
    });

    return () => {
        if (unsubscribeSnapshot) (unsubscribeSnapshot as () => void)();
        unsubscribeAuth();
    };
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

  const getSportIcon = (sport: string) => {
      if (sport === 'cricket') return '🏏';
      if (sport === 'netball') return '🏐';
      if (sport === 'rugby') return '🏉';
      return '🏆';
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
                    <div className="p-2 rounded-lg">
                        <Logo className="h-24" />
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
      const liveCount = matches.filter(m => m.status === 'LIVE').length;
      
      return (
        <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden font-sans">
             {/* Background Effects */}
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
             <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-penrice-navy rounded-full blur-[120px] opacity-40 -translate-y-1/2 translate-x-1/4 animate-pulse"></div>
             <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-900 rounded-full blur-[120px] opacity-30 translate-y-1/3 -translate-x-1/4"></div>

             {/* Top Bar */}
             <div className="relative z-10 px-6 py-8 flex justify-between items-center opacity-0 animate-fade-in-down">
                <div className="flex items-center gap-3">
                    <div className="bg-penrice-navy p-1.5 rounded-lg border border-white/20">
                        <Logo className="h-8 w-8 md:h-10 md:w-10" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-display font-bold text-lg leading-none tracking-wider uppercase hidden md:inline">Penrice Academy</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest hidden md:inline">Match Centre v2.0</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 backdrop-blur-sm">
                        <div className={`w-1.5 h-1.5 rounded-full ${liveCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
                        {liveCount > 0 ? `${liveCount} Live Matches` : 'System Online'}
                    </span>
                </div>
             </div>

             <div className="flex-1 max-w-6xl mx-auto w-full px-6 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 relative z-10 py-12">
                 
                 {/* Left: Text & Features */}
                 <div className="flex-1 text-center lg:text-left">
                     <div className="inline-block mb-6 opacity-0 animate-fade-in-up delay-100">
                        <span className="bg-penrice-gold text-black text-[10px] font-bold px-3 py-1.5 uppercase tracking-[0.25em] rounded-sm">The Official Hub</span>
                     </div>
                     <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold uppercase leading-[0.9] tracking-tighter mb-6 opacity-0 animate-fade-in-up delay-200 drop-shadow-2xl">
                         Game Day<br/>
                         <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">Central</span>
                     </h1>
                     <p className="text-gray-400 text-sm md:text-base max-w-lg mx-auto lg:mx-0 font-medium leading-relaxed mb-10 opacity-0 animate-fade-in-up delay-300">
                         Welcome to the digital home of Penrice Sport. Track every run, goal, and try in real-time. Access match reports, live statistics, and team news instantly from the sideline.
                     </p>
                     
                     {/* Feature Grid */}
                     <div className="grid grid-cols-3 gap-6 border-t border-white/10 pt-8 opacity-0 animate-fade-in-up delay-500 max-w-lg mx-auto lg:mx-0">
                         <div className="group">
                             <div className="w-10 h-10 bg-penrice-navy/30 rounded-lg flex items-center justify-center mb-3 group-hover:bg-penrice-gold group-hover:text-black transition-colors">
                                <i className="fa-solid fa-bolt text-penrice-gold text-lg group-hover:text-black"></i>
                             </div>
                             <div className="text-[9px] font-bold uppercase text-gray-500 tracking-wider mb-0.5">Real-Time</div>
                             <div className="font-display font-bold text-lg">Live Scores</div>
                         </div>
                         <div className="group">
                             <div className="w-10 h-10 bg-penrice-navy/30 rounded-lg flex items-center justify-center mb-3 group-hover:bg-penrice-gold group-hover:text-black transition-colors">
                                <i className="fa-solid fa-chart-pie text-penrice-gold text-lg group-hover:text-black"></i>
                             </div>
                             <div className="text-[9px] font-bold uppercase text-gray-500 tracking-wider mb-0.5">Deep Dive</div>
                             <div className="font-display font-bold text-lg">Statistics</div>
                         </div>
                         <div className="group">
                             <div className="w-10 h-10 bg-penrice-navy/30 rounded-lg flex items-center justify-center mb-3 group-hover:bg-penrice-gold group-hover:text-black transition-colors">
                                <i className="fa-regular fa-images text-penrice-gold text-lg group-hover:text-black"></i>
                             </div>
                             <div className="text-[9px] font-bold uppercase text-gray-500 tracking-wider mb-0.5">Media</div>
                             <div className="font-display font-bold text-lg">Reports</div>
                         </div>
                     </div>
                 </div>

                 {/* Right: Daily Schedule Card */}
                 <div className="w-full max-w-md opacity-0 animate-fade-in-up delay-700">
                     <div className="bg-gradient-to-b from-white to-gray-100 text-black p-1 rounded-sm shadow-[16px_16px_0px_rgba(255,184,28,0.15)] relative group">
                         <div className="absolute inset-0 bg-penrice-gold opacity-0 group-hover:opacity-100 transition-opacity blur-xl -z-10"></div>
                         
                         <div className="bg-white border border-gray-200 p-5">
                             <div className="flex justify-between items-end mb-6 border-b border-gray-100 pb-4">
                                 <div>
                                     <div className="flex items-center gap-2 mb-1">
                                         <div className="w-2 h-2 bg-black rounded-full"></div>
                                         <h3 className="text-xs font-bold text-black uppercase tracking-widest">Today's Schedule</h3>
                                     </div>
                                     <div className="text-[10px] text-gray-400 font-bold uppercase pl-4">{new Date().toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric'})}</div>
                                 </div>
                                 <div className="text-right">
                                     <div className="text-3xl font-display font-bold leading-none">{matches.length}</div>
                                     <div className="text-[9px] text-gray-400 font-bold uppercase">Active Fixtures</div>
                                 </div>
                             </div>

                             {/* List */}
                             <div className="space-y-3 max-h-[280px] overflow-y-auto custom-scroll pr-2 mb-6">
                                 {loading ? (
                                     <div className="py-12 text-center">
                                         <i className="fa-solid fa-circle-notch fa-spin text-gray-300 text-2xl mb-2"></i>
                                         <div className="text-[10px] font-bold text-gray-400 uppercase animate-pulse">Syncing Fixtures...</div>
                                     </div>
                                 ) : matches.length === 0 ? (
                                     <div className="py-12 text-center bg-gray-50 border border-dashed border-gray-200 rounded-sm">
                                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No fixtures today</p>
                                     </div>
                                 ) : (
                                     matches.map(m => (
                                         <div key={m.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 p-3 hover:border-black hover:bg-white hover:shadow-md transition-all group/item">
                                             <div className="flex items-center gap-4 overflow-hidden">
                                                 <div className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full text-sm group-hover/item:scale-110 transition-transform">
                                                     {getSportIcon(m.sport)}
                                                 </div>
                                                 <div className="flex flex-col truncate">
                                                     <span className="text-[9px] font-bold uppercase text-gray-400 leading-none mb-1">{m.teamName} vs</span>
                                                     <span className="text-xs font-bold uppercase leading-none truncate">{m.opponent}</span>
                                                 </div>
                                             </div>
                                             <div className="pl-2">
                                                 {m.status === 'LIVE' ? (
                                                     <div className="flex items-center gap-1.5 bg-red-600/10 border border-red-600/20 px-2 py-1 rounded-sm">
                                                         <span className="w-1.5 h-1.5 bg-red-600 rounded-full block animate-pulse"></span>
                                                         <span className="text-[9px] font-bold text-red-600 uppercase">Live</span>
                                                     </div>
                                                 ) : (
                                                     <span className="text-[9px] font-bold text-gray-400 uppercase bg-gray-100 px-2 py-1 rounded-sm">{m.status === 'UPCOMING' ? (m.league ? 'TBC' : 'Soon') : 'FT'}</span>
                                                 )}
                                             </div>
                                         </div>
                                     ))
                                 )}
                             </div>

                             {/* CTA */}
                             <button 
                                onClick={() => setShowWelcome(false)}
                                className="w-full bg-black text-white py-4 font-display font-bold uppercase text-lg tracking-wide hover:bg-penrice-gold hover:text-black transition-all active:scale-[0.98] group/btn flex items-center justify-center gap-3 relative overflow-hidden"
                             >
                                 <span className="relative z-10">Enter Match Centre</span>
                                 <i className="fa-solid fa-arrow-right text-xs relative z-10 group-hover/btn:translate-x-1 transition-transform"></i>
                             </button>
                         </div>
                     </div>
                 </div>

             </div>

             {/* Footer Strip */}
             <div className="relative z-10 border-t border-white/5 bg-black/40 backdrop-blur-sm py-4 px-6 flex flex-col md:flex-row justify-between items-center text-[9px] font-bold text-gray-500 uppercase tracking-widest gap-2">
                 <span>&copy; {new Date().getFullYear()} Penrice Academy</span>
                 <span className="flex items-center gap-4">
                     <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
                     <span className="hover:text-white cursor-pointer transition-colors">Support</span>
                     <span className="flex items-center gap-1"><i className="fa-solid fa-signal text-green-500"></i> System Operational</span>
                 </span>
             </div>
        </div>
      );
  }

  // --- VIEW 3: MAIN APP ---
  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-penrice-gold selection:text-black animate-fade-in">
      <Marquee matches={matches} />

      {/* Header */}
      <header className="bg-white border-b border-black sticky top-0 z-[60] shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center h-auto md:h-24">
           <div className="flex items-center w-full md:w-auto px-6 py-4 md:py-0">
               <div>
                   <h1 className="text-4xl font-display font-bold text-black leading-[0.85] uppercase tracking-tight">Penrice<br/>Match Centre</h1>
                   <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1.5 ml-0.5">Official Scores</span>
               </div>
           </div>
           <div className="flex items-center w-full md:w-auto border-t md:border-t-0 md:border-l border-gray-100 h-full">
               {/* Nav Tabs */}
               {!isAdmin && (
                   <>
                       <button 
                           onClick={() => setViewMode('live')}
                           className={`flex-1 md:flex-none h-12 md:h-full px-6 text-[10px] font-bold uppercase tracking-widest border-r border-gray-100 transition-colors ${viewMode === 'live' ? 'bg-black text-white' : 'text-gray-500 hover:text-black hover:bg-gray-50'}`}
                       >
                           Live Scores
                       </button>
                       <button 
                           onClick={() => setViewMode('news')}
                           className={`flex-1 md:flex-none h-12 md:h-full px-6 text-[10px] font-bold uppercase tracking-widest border-r border-gray-100 transition-colors ${viewMode === 'news' ? 'bg-black text-white' : 'text-gray-500 hover:text-black hover:bg-gray-50'}`}
                       >
                           News & Reports
                       </button>
                   </>
               )}
               
               <button onClick={() => window.location.reload()} className="h-12 md:h-full px-6 text-gray-500 hover:text-black border-r border-gray-100">
                  <i className="fa-solid fa-rotate-right"></i>
               </button>
               <button 
                  onClick={() => isAdmin ? setIsAdmin(false) : setShowLogin(true)} 
                  className="flex-1 md:flex-none h-12 md:h-full px-8 text-[10px] font-bold bg-penrice-gold text-black hover:bg-black hover:text-white transition-colors uppercase tracking-widest"
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
             <>
                 {viewMode === 'live' ? (
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

                         {matches.map(match => {
                            if (match.sport === 'netball') return <NetballCard key={match.id} match={match} allMatches={matches} />;
                            if (match.sport === 'rugby') return <RugbyCard key={match.id} match={match} allMatches={matches} />;
                            return <CricketCard key={match.id} match={match} allMatches={matches} />;
                         })}
                     </div>
                 ) : (
                     <NewsFeed matches={matches} />
                 )}
             </>
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
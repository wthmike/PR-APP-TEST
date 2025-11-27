import React, { useEffect, useState } from 'react';
import { db, auth } from './services/firebase';
import { Match } from './types';
import { Marquee } from './components/Layout/Marquee';
import { CricketCard } from './components/Cards/CricketCard';
import { NetballCard } from './components/Cards/NetballCard';
import { RugbyCard } from './components/Cards/RugbyCard';
import { AdminPanel } from './components/Admin/AdminPanel';
import { NewsFeed } from './components/News/NewsFeed';
import { Logo, getContrastYIQ } from './components/Shared';

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

  // Onboarding Carousel State
  const [heroIndex, setHeroIndex] = useState(0);

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

  // --- HERO CAROUSEL LOGIC ---
  const liveMatches = matches.filter(m => m.status === 'LIVE');
  const upcomingMatches = matches.filter(m => m.status === 'UPCOMING');
  
  // Determine the pool of matches to cycle through in the Hero section
  // Priority: 1. LIVE Matches, 2. UPCOMING Matches (if no live), 3. RECENT (if nothing else)
  let heroPool: Match[] = [];
  let heroTitleLabel = "";
  
  if (liveMatches.length > 0) {
      heroPool = liveMatches;
      heroTitleLabel = "Live Now";
  } else if (upcomingMatches.length > 0) {
      heroPool = upcomingMatches;
      heroTitleLabel = "Up Next";
  } else {
      heroPool = matches.slice(0, 3); // Fallback to whatever is available
      heroTitleLabel = "Recent Activity";
  }

  const heroCount = heroPool.length;
  const currentHeroMatch = heroCount > 0 ? heroPool[heroIndex % heroCount] : null;

  useEffect(() => {
      if (!showWelcome) return;
      
      // Cycle only if we have more than 1 item in the hero source
      if (heroCount > 1) {
          const timer = setInterval(() => {
              setHeroIndex(prev => (prev + 1) % heroCount);
          }, 5000);
          return () => clearInterval(timer);
      } else {
          setHeroIndex(0);
      }
  }, [showWelcome, heroCount]);

  // --- BOTTOM LIST LOGIC ---
  // Exclude the match currently shown in the Hero card to avoid duplication
  const secondaryMatches = matches
    .filter(m => m.id !== currentHeroMatch?.id)
    .sort((a, b) => {
        // Custom Sort Priority: LIVE -> UPCOMING -> FT -> RESULT
        const score = (status: string) => {
            if (status === 'LIVE') return 0;
            if (status === 'UPCOMING') return 1;
            return 2;
        };
        return score(a.status) - score(b.status);
    })
    .slice(0, 3); // Take top 3 relevant matches

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

  // Helper to render hero content
  const renderHeroContent = (m: Match) => {
      const isLive = m.status === 'LIVE';
      const isCricket = m.sport === 'cricket';
      const homeColor = m.homeTeamColor || '#000000';
      const awayColor = m.awayTeamColor || '#ffffff';

      return (
          <div className="w-full h-full relative overflow-hidden group">
              {/* Dynamic Background */}
              <div className="absolute inset-0 flex">
                  <div style={{ backgroundColor: homeColor }} className="w-1/2 h-full opacity-20"></div>
                  <div style={{ backgroundColor: awayColor }} className="w-1/2 h-full opacity-20"></div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
              
              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 text-center animate-fade-in key={m.id}">
                  <div className="flex items-center gap-2 mb-4">
                      {isLive ? (
                          <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse uppercase tracking-widest">Live Now</span>
                      ) : (
                          <span className="bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">{heroTitleLabel}</span>
                      )}
                      <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest border-l border-white/20 pl-2">{m.sport}</span>
                  </div>

                  <div className="flex items-center justify-center gap-4 md:gap-12 w-full">
                      <div className="flex-1 text-right">
                          <h2 className="text-2xl md:text-4xl font-display font-bold uppercase text-white leading-none mb-1">{m.teamName}</h2>
                          {isLive && isCricket && m.penriceStatus === 'batting' && <span className="text-penrice-gold text-xs font-bold uppercase tracking-widest">Batting</span>}
                      </div>
                      
                      <div className="flex flex-col items-center">
                          <div className="text-4xl md:text-6xl font-display font-bold text-white bg-white/10 px-4 py-2 rounded-sm backdrop-blur-sm border border-white/10 shadow-lg min-w-[140px] text-center">
                              {m.homeScore}<span className="opacity-50 mx-1">-</span>{m.awayScore}
                          </div>
                          {isCricket && (
                              <div className="mt-2 text-xs font-mono text-gray-400">
                                  {m.currentOver?.toFixed(1)} Overs
                              </div>
                          )}
                           {!isCricket && isLive && (
                              <div className="mt-2 text-xs font-mono text-gray-400">
                                  {m.period}
                              </div>
                          )}
                      </div>

                      <div className="flex-1 text-left">
                          <h2 className="text-2xl md:text-4xl font-display font-bold uppercase text-white leading-none mb-1">{m.opponent}</h2>
                          {isLive && isCricket && m.penriceStatus !== 'batting' && <span className="text-penrice-gold text-xs font-bold uppercase tracking-widest">Batting</span>}
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  // --- VIEW 1: LOCK SCREEN ---
  if (isAppLocked) {
      return (
        <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden selection:bg-penrice-gold selection:text-black">
            {/* Background Layers */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-penrice-navy/40 via-neutral-950 to-black"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay animate-pulse"></div>
            
            {/* Animated Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-penrice-gold/5 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] animate-pulse delay-1000"></div>

            {/* Main Login Container */}
            <div className="relative z-10 w-full max-w-md">
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 md:p-12 shadow-2xl relative overflow-hidden group">
                    {/* Top Decoration Line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-penrice-gold to-transparent opacity-50"></div>
                    
                    <div className="flex flex-col items-center mb-10 opacity-0 animate-fade-in-down">
                         {/* Logo Container - White Background for visibility */}
                         <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-black mb-6 shadow-[0_0_30px_rgba(255,184,28,0.4)]">
                             <Logo className="h-14" />
                         </div>
                         <h1 className="text-3xl font-display font-bold text-white uppercase tracking-tight text-center leading-none mb-2">
                             Match<span className="text-penrice-gold">Centre</span>
                         </h1>
                         <div className="flex items-center gap-3">
                             <div className="h-px w-8 bg-white/20"></div>
                             <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">Restricted Access</span>
                             <div className="h-px w-8 bg-white/20"></div>
                         </div>
                    </div>

                    <form onSubmit={handleAppUnlock} className="space-y-6 opacity-0 animate-fade-in-up delay-200">
                        <div className="relative group">
                            <div className={`absolute -inset-0.5 bg-gradient-to-r from-penrice-gold to-penrice-navy rounded-sm opacity-0 transition duration-500 group-hover:opacity-30 ${unlockError ? 'opacity-100 from-red-600 to-red-600' : ''}`}></div>
                            <input 
                                type="password"
                                value={passwordInput}
                                onChange={(e) => { setPasswordInput(e.target.value); setUnlockError(false); }}
                                placeholder="Enter Access Code"
                                className="relative w-full bg-neutral-900/80 border border-white/10 text-center text-white placeholder-gray-600 font-bold text-lg py-4 outline-none focus:border-penrice-gold/50 focus:bg-neutral-900 transition-all rounded-sm"
                                autoFocus
                            />
                        </div>
                        
                        {unlockError && (
                            <div className="text-center animate-bounce">
                                <span className="inline-block bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-sm">
                                    Access Denied
                                </span>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="w-full bg-white text-black font-display font-bold text-sm uppercase tracking-widest py-4 hover:bg-penrice-gold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                        >
                            Connect to Dashboard
                        </button>
                    </form>

                    <div className="mt-8 text-center opacity-0 animate-fade-in delay-500">
                        <p className="text-[9px] text-gray-600 uppercase tracking-widest">Penrice Academy Sport • Internal System</p>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // --- VIEW 2: WELCOME / ONBOARDING (DASHBOARD PREVIEW) ---
  if (showWelcome) {
      return (
        <div className="min-h-screen bg-neutral-950 flex flex-col font-sans text-white overflow-hidden relative">
            {/* Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-penrice-navy/30 via-neutral-950 to-black pointer-events-none"></div>

            {/* Header Area */}
            <div className="relative z-10 px-6 py-6 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border-2 border-black">
                        <Logo className="h-6" />
                     </div>
                     <h1 className="text-xl font-display font-bold uppercase tracking-tight">Penrice<span className="text-penrice-gold">Sport</span></h1>
                 </div>
                 <button 
                    onClick={() => setShowWelcome(false)}
                    className="bg-white text-black px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-penrice-gold transition-colors shadow-lg"
                >
                    Enter App <i className="fa-solid fa-arrow-right ml-2"></i>
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8 relative z-10">
                
                {/* 1. HERO CARD (Carousel) */}
                <div className="w-full max-w-4xl bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl relative aspect-video md:aspect-[21/9]">
                    {currentHeroMatch ? (
                        <div className="absolute inset-0" key={currentHeroMatch.id}>
                            {renderHeroContent(currentHeroMatch)}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500 font-bold uppercase tracking-widest text-sm">
                            No active fixtures
                        </div>
                    )}
                    
                    {/* Carousel Indicators */}
                    {heroCount > 1 && (
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                            {Array.from({ length: heroCount }).map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === heroIndex ? 'bg-white w-4' : 'bg-white/30'}`}
                                ></div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 2. SECONDARY CARDS (Bottom List) */}
                <div className="w-full max-w-4xl">
                    <div className="flex justify-between items-end mb-3 border-b border-white/10 pb-1">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Other Fixtures</span>
                        <span className="text-[9px] font-bold text-penrice-gold uppercase tracking-widest">
                            {upcomingMatches.length > 0 ? 'Upcoming' : 'Results'}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         {secondaryMatches.length === 0 && (
                             <div className="col-span-3 text-center py-6 text-gray-600 text-xs italic border border-dashed border-white/10 rounded-lg">
                                 No other matches scheduled.
                             </div>
                         )}
                         {secondaryMatches.map(m => (
                             <div key={m.id} className="bg-white/5 border border-white/10 p-4 rounded-lg hover:bg-white/10 transition-colors flex flex-col justify-between h-24 group cursor-pointer" onClick={() => setShowWelcome(false)}>
                                 <div className="flex justify-between items-start">
                                     <span className="text-[9px] font-bold text-penrice-gold uppercase tracking-widest">{m.sport}</span>
                                     <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase ${m.status==='LIVE' ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-700 text-gray-300'}`}>
                                         {m.status === 'UPCOMING' ? 'SOON' : m.status}
                                     </span>
                                 </div>
                                 <div>
                                     <div className="font-display font-bold text-lg text-white leading-none truncate group-hover:text-penrice-gold transition-colors">{m.opponent}</div>
                                     <div className="text-xs text-gray-400 font-medium truncate mt-1">
                                         {m.yearGroup} {m.league ? `• ${m.league}` : ''}
                                     </div>
                                 </div>
                             </div>
                         ))}
                    </div>
                </div>
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
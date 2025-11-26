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

  // Carousel Effect for Welcome Screen
  useEffect(() => {
      if (!showWelcome) return;
      
      const liveCount = matches.filter(m => m.status === 'LIVE').length;
      if (liveCount > 1) {
          const timer = setInterval(() => {
              setHeroIndex(prev => (prev + 1) % liveCount);
          }, 5000);
          return () => clearInterval(timer);
      } else {
          // Reset if only 1 or 0 to ensure valid index
          setHeroIndex(0);
      }
  }, [showWelcome, matches]);

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
      const liveMatches = matches.filter(m => m.status === 'LIVE');
      const upcomingMatches = matches.filter(m => m.status === 'UPCOMING').sort((a,b) => (a.sortOrder||99) - (b.sortOrder||99));
      const finishedMatches = matches.filter(m => m.status === 'FT' || m.status === 'RESULT').sort((a,b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
      
      const activeLiveMatch = liveMatches.length > 0 ? liveMatches[heroIndex % liveMatches.length] : null;
      const nextMatch = upcomingMatches[0];
      
      // Determine what to show in Hero
      // If live matches exist, show current carousel item. Else show first upcoming.
      const heroMatch = activeLiveMatch || nextMatch;
      const isHeroLive = !!activeLiveMatch;

      // Build bottom list (max 4 items)
      // If hero is live, show upcoming + finished
      // If hero is upcoming, show upcoming[1+] + finished
      let bottomList: Match[] = [];
      if (isHeroLive) {
          bottomList = [...upcomingMatches, ...finishedMatches];
      } else {
          bottomList = [...upcomingMatches.slice(1), ...finishedMatches];
      }
      bottomList = bottomList.slice(0, 4);

      return (
        <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden font-sans">
             {/* Dynamic Background */}
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
             <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-penrice-navy/40 via-black to-black z-0"></div>
             
             {/* Content Container */}
             <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 md:p-12">
                 
                 <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center h-full">
                     
                     {/* LEFT: Branding & Actions */}
                     <div className="lg:col-span-5 space-y-10 animate-fade-in-up flex flex-col justify-center h-full">
                          <div className="border-l-4 border-penrice-gold pl-6 py-2">
                               <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-penrice-gold mb-2">Penrice Academy</h2>
                               <h1 className="text-6xl md:text-8xl font-display font-bold uppercase leading-[0.85] tracking-tighter">
                                   Match<br/>Centre
                               </h1>
                          </div>

                          <p className="text-gray-400 text-lg leading-relaxed max-w-md border-t border-white/10 pt-6">
                              Real-time tracking for all Academy fixtures. View live scores, match statistics, and post-game reports.
                          </p>
                          
                          <div className="flex flex-col sm:flex-row gap-4">
                              <button 
                                 onClick={() => setShowWelcome(false)}
                                 className="group relative overflow-hidden bg-white text-black px-8 py-4 font-display font-bold uppercase text-lg tracking-wider hover:bg-penrice-gold transition-colors shadow-[8px_8px_0px_rgba(255,255,255,0.1)] hover:shadow-[8px_8px_0px_rgba(255,184,28,0.5)]"
                              >
                                  <span className="relative z-10">Launch Dashboard</span>
                              </button>
                          </div>
                     </div>

                     {/* RIGHT: Status Hero Card & Ticker */}
                     <div className="lg:col-span-7 w-full flex flex-col justify-center gap-6 animate-fade-in-up delay-200">
                         {/* MAIN HERO CARD */}
                         <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 p-1 rounded-2xl shadow-2xl relative overflow-hidden h-[340px] transition-all duration-500">
                             {/* Glossy sheen */}
                             <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                             
                             <div className="bg-black/40 rounded-xl p-8 h-full flex flex-col justify-between relative z-10">
                                  {/* Header */}
                                  <div className="flex justify-between items-start mb-4">
                                      <div className="flex items-center gap-2">
                                           <div className={`w-2 h-2 rounded-full ${isHeroLive ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                               {isHeroLive ? 'Live Now' : (heroMatch ? 'Next Up' : 'System Online')}
                                           </span>
                                           {liveMatches.length > 1 && isHeroLive && (
                                                <div className="flex gap-1 ml-2">
                                                    {liveMatches.map((_, i) => (
                                                        <div key={i} className={`w-1 h-1 rounded-full ${i === (heroIndex % liveMatches.length) ? 'bg-white' : 'bg-white/20'}`}></div>
                                                    ))}
                                                </div>
                                           )}
                                      </div>
                                      <Logo className="h-6 invert opacity-50" />
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1 flex flex-col justify-center">
                                      {heroMatch ? (
                                          <div className="animate-fade-in">
                                              <div className="text-[10px] font-bold text-penrice-gold uppercase tracking-widest mb-2 border-b border-white/10 pb-2 inline-block">
                                                  {isHeroLive ? 'In Progress' : 'Upcoming'} • {heroMatch.sport}
                                              </div>
                                              <div className="flex flex-col gap-1 mb-4">
                                                  <div className="flex justify-between items-baseline">
                                                      <span className="text-3xl font-display font-bold uppercase truncate pr-4">{heroMatch.teamName}</span>
                                                      <span className={`text-4xl font-display font-bold ${isHeroLive ? 'text-penrice-gold' : 'text-white/50'}`}>{heroMatch.homeScore}</span>
                                                  </div>
                                                  <div className="flex justify-between items-baseline opacity-80">
                                                      <span className="text-2xl font-display font-bold uppercase truncate pr-4 text-gray-300">{heroMatch.opponent}</span>
                                                      <span className={`text-3xl font-display font-bold ${isHeroLive ? 'text-white' : 'text-white/50'}`}>{heroMatch.awayScore}</span>
                                                  </div>
                                              </div>
                                              {isHeroLive && heroMatch.events?.length > 0 && (
                                                  <div className="text-xs text-gray-400 font-mono mt-2 bg-white/5 p-2 rounded-sm border-l-2 border-penrice-gold">
                                                      Latest: {heroMatch.events[heroMatch.events.length-1].desc}
                                                  </div>
                                              )}
                                              {!isHeroLive && (
                                                  <div className="text-xs text-gray-400 mt-2 font-bold uppercase tracking-widest">
                                                      {heroMatch.yearGroup} • {heroMatch.league}
                                                  </div>
                                              )}
                                          </div>
                                      ) : (
                                          <div className="text-center py-8">
                                              <i className="fa-solid fa-check-circle text-4xl text-gray-700 mb-4"></i>
                                              <h3 className="text-xl font-display font-bold text-gray-500 uppercase">No Active Fixtures</h3>
                                          </div>
                                      )}
                                  </div>
                             </div>
                         </div>

                         {/* SUB CARDS GRID */}
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-32">
                             {bottomList.length > 0 ? bottomList.map((m) => {
                                 const isFT = m.status === 'FT' || m.status === 'RESULT';
                                 return (
                                     <div key={m.id} className="bg-white/5 border border-white/10 rounded-lg p-3 backdrop-blur-sm flex flex-col justify-between hover:bg-white/10 transition-colors cursor-default">
                                         <div className="flex justify-between items-start">
                                             <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                                                 {isFT ? 'Result' : 'Upcoming'}
                                             </span>
                                             <span className="text-xs">{getSportIcon(m.sport)}</span>
                                         </div>
                                         <div>
                                             <div className="font-display font-bold text-sm text-white leading-tight uppercase truncate">{m.opponent}</div>
                                             <div className="text-[10px] font-bold text-gray-500 uppercase truncate">{m.yearGroup}</div>
                                         </div>
                                         <div className="text-right border-t border-white/10 pt-1 mt-1">
                                             {isFT ? (
                                                 <span className="font-mono text-xs font-bold text-penrice-gold">{m.homeScore}-{m.awayScore}</span>
                                             ) : (
                                                 <span className="font-mono text-[9px] text-gray-400">VS</span>
                                             )}
                                         </div>
                                     </div>
                                 );
                             }) : (
                                 <div className="col-span-full flex items-center justify-center text-[10px] font-bold text-gray-600 uppercase tracking-widest border border-white/5 rounded-lg border-dashed">
                                     No other fixtures scheduled
                                 </div>
                             )}
                         </div>

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
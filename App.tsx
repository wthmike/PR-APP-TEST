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

  // Carousel Effect for Welcome Screen
  const liveMatches = matches.filter(m => m.status === 'LIVE');
  const liveCount = liveMatches.length;

  useEffect(() => {
      if (!showWelcome) return;
      
      // Cycle only if we have more than 1 live match
      if (liveCount > 1) {
          const timer = setInterval(() => {
              setHeroIndex(prev => (prev + 1) % liveCount);
          }, 5000);
          return () => clearInterval(timer);
      } else {
          setHeroIndex(0);
      }
  }, [showWelcome, liveCount]);

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

  // --- VIEW 1: LOCK SCREEN (UPDATED DESIGN) ---
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
                         <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10 mb-6 shadow-[0_0_30px_rgba(255,184,28,0.1)]">
                             <Logo className="h-10" />
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
                
                {/* Decorative brackets */}
                <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-white/20"></div>
                <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-white/20"></div>
            </div>
        </div>
      );
  }

  // --- VIEW 2: WELCOME / ONBOARDING ---
  if (showWelcome) {
      const upcomingMatches = matches.filter(m => m.status === 'UPCOMING').sort((a,b) => (a.sortOrder||99) - (b.sortOrder||99));
      const finishedMatches = matches.filter(m => m.status === 'FT' || m.status === 'RESULT').sort((a,b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
      
      const activeLiveMatch = liveMatches.length > 0 ? liveMatches[heroIndex % liveMatches.length] : null;
      const nextMatch = upcomingMatches[0];
      
      // Hero Logic
      const heroMatch = activeLiveMatch || nextMatch;
      const isHeroLive = !!activeLiveMatch;

      // Bottom List Logic: Show next 3 relevant matches excluding the one in hero
      let bottomList: Match[] = [];
      if (isHeroLive) {
          bottomList = [...upcomingMatches, ...finishedMatches];
      } else {
          bottomList = [...upcomingMatches.slice(1), ...finishedMatches];
      }
      bottomList = bottomList.slice(0, 3);
      
      return (
        <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden font-sans bg-white">
            {/* LEFT PANEL - WELCOME & CONTEXT */}
            <div className="w-full md:w-5/12 bg-white flex flex-col justify-center p-8 md:p-12 relative z-20 shadow-[20px_0_40px_rgba(0,0,0,0.1)]">
                <Logo className="h-16 mb-8 self-start" /> 
                
                <div className="mb-2 flex items-center gap-2 animate-fade-in-up">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Live Coverage</span>
                </div>
                
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-penrice-navy uppercase leading-[0.9] mb-6 animate-fade-in-up delay-100">
                    Match<br/><span className="text-penrice-gold">Centre</span>
                </h1>
                
                <p className="text-gray-500 font-medium leading-relaxed max-w-md mb-10 animate-fade-in-up delay-200">
                    Welcome to the official home of Penrice Academy sport. Follow live scores, match results, and fixture updates for Netball, Cricket, and Rugby.
                </p>
                
                <button 
                    onClick={() => setShowWelcome(false)}
                    className="group w-full md:w-auto flex items-center justify-between gap-6 bg-black text-white px-8 py-5 text-xs font-bold uppercase tracking-widest hover:bg-penrice-navy transition-all rounded-sm shadow-lg hover:shadow-xl hover:-translate-y-1 animate-fade-in-up delay-300"
                >
                    <span>Enter Dashboard</span>
                    <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                </button>

                <div className="mt-auto pt-12 border-t border-gray-100 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-fade-in delay-500">
                    <span>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
            </div>

            {/* RIGHT PANEL - LIVE FEED */}
            <div className="flex-1 bg-neutral-900 relative flex flex-col justify-center items-center p-8 md:p-12 overflow-hidden">
                {/* Background FX */}
                <div className="absolute inset-0 bg-gradient-to-br from-penrice-navy to-black opacity-90"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
                
                {/* Decorative Elements */}
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-penrice-gold rounded-full blur-[100px] opacity-10 animate-pulse"></div>

                {/* Content Wrapper */}
                <div className="relative z-10 w-full max-w-xl flex flex-col gap-6">
                    
                    {/* HEADER FOR RIGHT SIDE */}
                    <div className="flex justify-between items-center text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2 animate-fade-in">
                        <span>Featured Match</span>
                        {liveMatches.length > 1 && <span>Auto-Rotating</span>}
                    </div>

                    {/* MAIN CARD (CAROUSEL) */}
                    {heroMatch ? (
                        <div key={heroMatch.id} className="bg-white rounded-sm shadow-2xl overflow-hidden animate-fade-in-up">
                            {/* Status Bar */}
                            <div className="bg-gray-100 p-4 flex justify-between items-center border-b border-gray-200">
                                <div className="flex items-center gap-2">
                                    {isHeroLive ? (
                                        <span className="bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider animate-pulse">Live Now</span>
                                    ) : (
                                        <span className="bg-black text-white text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">Upcoming</span>
                                    )}
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate max-w-[150px]">{heroMatch.sport} • {heroMatch.yearGroup}</span>
                                </div>
                                {heroMatch.sport === 'cricket' && isHeroLive && <span className="text-xs font-bold text-black font-mono">Ov {heroMatch.currentOver?.toFixed(1) || '0.0'}</span>}
                                {heroMatch.sport !== 'cricket' && isHeroLive && <span className="text-xs font-bold text-black font-mono">{heroMatch.period}</span>}
                            </div>

                            {/* Score Body */}
                            <div className="p-8 flex items-center justify-between">
                                {/* Home */}
                                <div className="flex flex-col text-center w-1/3">
                                    <span className="text-xl md:text-2xl font-display font-bold text-black uppercase leading-none mb-2 break-words line-clamp-2">{heroMatch.teamName}</span>
                                    <span className="text-4xl md:text-5xl font-display font-bold text-penrice-navy">
                                        {heroMatch.homeScore}{heroMatch.sport==='cricket' && <span className="text-2xl md:text-3xl text-gray-400">/{heroMatch.homeWickets}</span>}
                                    </span>
                                </div>

                                {/* VS */}
                                <div className="w-px h-16 bg-gray-200 mx-2"></div>

                                {/* Away */}
                                <div className="flex flex-col text-center w-1/3">
                                    <span className="text-xl md:text-2xl font-display font-bold text-black uppercase leading-none mb-2 break-words line-clamp-2">{heroMatch.opponent}</span>
                                    <span className="text-4xl md:text-5xl font-display font-bold text-gray-500">
                                        {heroMatch.awayScore}{heroMatch.sport==='cricket' && <span className="text-2xl md:text-3xl text-gray-300">/{heroMatch.awayWickets}</span>}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Latest Event Footer */}
                            {isHeroLive && heroMatch.events && heroMatch.events.length > 0 && (
                                <div className="bg-penrice-navy text-white p-3 text-xs flex items-center gap-3">
                                    <span className="text-penrice-gold font-bold uppercase text-[9px] tracking-widest shrink-0">Latest</span>
                                    <span className="truncate opacity-90">{heroMatch.events[heroMatch.events.length-1].desc}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white/5 border border-white/10 p-12 rounded-sm text-center animate-fade-in">
                            <i className="fa-regular fa-calendar-xmark text-4xl text-white/20 mb-4"></i>
                            <div className="text-white/50 text-sm font-bold uppercase tracking-widest">No active fixtures</div>
                        </div>
                    )}

                    {/* SUB LIST (Smaller Cards) */}
                    {bottomList.length > 0 && (
                        <div className="space-y-3 mt-4 animate-fade-in-up delay-100">
                            <div className="text-white/30 text-[9px] font-bold uppercase tracking-widest">Other Fixtures</div>
                            {bottomList.map(m => (
                                <div key={m.id} className="bg-white/10 hover:bg-white/20 border border-white/5 p-3 rounded-sm flex items-center justify-between transition-colors backdrop-blur-sm cursor-default">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs shrink-0">
                                            {m.sport === 'cricket' ? '🏏' : (m.sport === 'rugby' ? '🏉' : '🏐')}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-bold text-white uppercase truncate">{m.opponent}</span>
                                            <span className="text-[9px] text-gray-400 uppercase truncate">{m.yearGroup} • {m.status === 'FT' ? 'Result' : m.status}</span>
                                        </div>
                                    </div>
                                    {(m.status === 'LIVE' || m.status === 'FT' || m.status === 'RESULT') && (
                                        <span className="font-mono text-xs font-bold text-penrice-gold ml-2 shrink-0">
                                            {m.homeScore}{m.sport==='cricket'&&`/${m.homeWickets}`} - {m.awayScore}{m.sport==='cricket'&&`/${m.awayWickets}`}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
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
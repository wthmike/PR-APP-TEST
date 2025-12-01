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
  
  // Filter State
  const [sportFilter, setSportFilter] = useState<'all' | 'cricket' | 'netball' | 'rugby'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'LIVE' | 'UPCOMING' | 'FT'>('all');
  
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

  // --- FILTERING LOGIC ---
  const filteredMatches = matches.filter(m => {
      // 1. Filter by Sport
      const matchSport = sportFilter === 'all' || m.sport === sportFilter;
      
      // 2. Filter by Status
      let matchStatus = true;
      if (statusFilter === 'all') matchStatus = true;
      else if (statusFilter === 'LIVE') matchStatus = m.status === 'LIVE';
      else if (statusFilter === 'UPCOMING') matchStatus = m.status === 'UPCOMING';
      else if (statusFilter === 'FT') matchStatus = m.status === 'FT' || m.status === 'RESULT';

      return matchSport && matchStatus;
  });

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
          }, 6000); // Slower cycle for editorial feel
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
    .slice(0, 6); // More matches for the list view

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

  // --- VIEW 2: EDITORIAL WELCOME SCREEN ---
  if (showWelcome) {
      return (
        <div className="fixed inset-0 z-[200] bg-white font-sans flex flex-col md:flex-row overflow-hidden animate-fade-in">
            
            {/* LEFT PANEL: HERO / COVER STORY (70% Width) */}
            <div className="relative w-full md:w-[70%] h-[60vh] md:h-full bg-neutral-900 text-white overflow-hidden">
                {currentHeroMatch ? (
                    <div key={currentHeroMatch.id} className="absolute inset-0 animate-fade-in">
                        {/* Dynamic Split Background */}
                        <div className="absolute inset-0 flex">
                             <div className="w-full h-full relative">
                                <div style={{ backgroundColor: currentHeroMatch.homeTeamColor || '#000000' }} className="absolute inset-0 opacity-40 mix-blend-color-dodge"></div>
                                <div style={{ backgroundColor: currentHeroMatch.awayTeamColor || '#ffffff' }} className="absolute inset-0 opacity-20 mix-blend-overlay bg-gradient-to-l from-transparent to-black"></div>
                             </div>
                        </div>
                        {/* Texture & Gradients */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80"></div>

                        {/* Content Container */}
                        <div className="absolute inset-0 flex flex-col justify-center items-center p-8 md:p-16 text-center z-10">
                            
                            {/* Top Badge */}
                            <div className="mb-6 flex flex-col items-center gap-3 animate-fade-in-down">
                                <span className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] border ${currentHeroMatch.status === 'LIVE' ? 'border-red-600 text-red-500 bg-red-950/30' : 'border-white/30 text-white/70'}`}>
                                    {currentHeroMatch.status === 'LIVE' ? 'Happening Now' : 'Featured Match'}
                                </span>
                                <div className="h-8 w-px bg-white/20"></div>
                            </div>

                            {/* Teams - Massive Typography */}
                            <div className="flex flex-col gap-2 md:gap-4 w-full max-w-4xl">
                                <h1 className="font-display font-bold text-5xl md:text-8xl lg:text-9xl uppercase tracking-tighter leading-[0.85] text-white drop-shadow-2xl opacity-90 truncate">
                                    {currentHeroMatch.teamName}
                                </h1>
                                <div className="flex items-center justify-center gap-6 my-2 md:my-4">
                                     <div className="h-px flex-1 bg-gradient-to-r from-transparent via-penrice-gold to-transparent opacity-50"></div>
                                     <span className="font-display font-bold text-2xl md:text-4xl text-penrice-gold italic">VS</span>
                                     <div className="h-px flex-1 bg-gradient-to-r from-transparent via-penrice-gold to-transparent opacity-50"></div>
                                </div>
                                <h1 className="font-display font-bold text-5xl md:text-8xl lg:text-9xl uppercase tracking-tighter leading-[0.85] text-white drop-shadow-2xl opacity-90 truncate">
                                    {currentHeroMatch.opponent}
                                </h1>
                            </div>

                            {/* Score & Context */}
                            <div className="mt-8 md:mt-12 flex flex-col items-center animate-fade-in-up">
                                <div className="font-display font-bold text-6xl md:text-8xl text-white tracking-tight leading-none mb-2">
                                    {currentHeroMatch.homeScore}<span className="text-white/20 mx-2">-</span>{currentHeroMatch.awayScore}
                                </div>
                                <p className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">
                                    {currentHeroMatch.sport} • {currentHeroMatch.league || 'Fixture'} • {currentHeroMatch.yearGroup}
                                </p>
                            </div>
                        </div>

                        {/* Carousel Indicators */}
                        {heroCount > 1 && (
                            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 z-20">
                                {Array.from({ length: heroCount }).map((_, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => setHeroIndex(i)}
                                        className={`h-1 transition-all duration-300 ${i === heroIndex ? 'w-8 bg-penrice-gold' : 'w-2 bg-white/20 hover:bg-white/50'}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-black">
                        <span className="text-gray-600 font-bold uppercase tracking-widest text-xs">No Featured Matches</span>
                    </div>
                )}
            </div>

            {/* RIGHT PANEL: SIDEBAR / AGENDA (30% Width) */}
            <div className="relative w-full md:w-[30%] h-[40vh] md:h-full bg-white border-l border-gray-100 flex flex-col z-20 shadow-2xl">
                 {/* Header */}
                 <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-50/50">
                     <div className="flex items-center justify-between mb-4">
                         <Logo className="h-6" />
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date().toLocaleDateString('en-GB', {weekday: 'short', day: 'numeric'})}</span>
                     </div>
                     <h2 className="font-display font-bold text-3xl uppercase tracking-tight leading-none">Match Day<br/><span className="text-gray-400">Programme</span></h2>
                 </div>

                 {/* Scrollable List */}
                 <div className="flex-1 overflow-y-auto custom-scroll p-0">
                     {secondaryMatches.length === 0 ? (
                         <div className="p-8 text-center text-gray-400 text-xs font-bold uppercase tracking-widest italic">
                             No other fixtures scheduled today.
                         </div>
                     ) : (
                         secondaryMatches.map((m, i) => (
                             <div key={m.id} className="group border-b border-gray-100 p-6 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setShowWelcome(false)}>
                                 <div className="flex justify-between items-start mb-2">
                                     <span className="text-[9px] font-bold text-penrice-gold uppercase tracking-widest">{m.sport}</span>
                                     <span className={`text-[9px] font-bold uppercase ${m.status === 'LIVE' ? 'text-red-600 animate-pulse' : 'text-gray-400'}`}>
                                         {m.status === 'UPCOMING' ? m.time || 'Today' : m.status}
                                     </span>
                                 </div>
                                 <div className="flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="font-display font-bold text-lg text-black uppercase leading-none group-hover:underline decoration-2 decoration-penrice-gold underline-offset-4">{m.opponent}</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">{m.yearGroup}</span>
                                    </div>
                                    <div className="text-xl font-display font-bold text-gray-300 group-hover:text-black transition-colors">
                                        {m.status === 'UPCOMING' ? 'VS' : `${m.homeScore}-${m.awayScore}`}
                                    </div>
                                 </div>
                             </div>
                         ))
                     )}
                 </div>

                 {/* Footer Action */}
                 <div className="p-6 md:p-8 border-t border-gray-100 bg-white">
                     <button 
                        onClick={() => setShowWelcome(false)}
                        className="w-full bg-black text-white py-4 md:py-5 font-display font-bold text-lg uppercase tracking-widest hover:bg-penrice-gold hover:text-black transition-all flex items-center justify-center group"
                     >
                         Enter Match Centre
                         <i className="fa-solid fa-arrow-right ml-3 text-sm group-hover:translate-x-1 transition-transform"></i>
                     </button>
                     <p className="text-center text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-4">
                         Penrice Academy Official Sport
                     </p>
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
                         
                         {/* Filters Header */}
                         <div className="mb-8 space-y-4">
                            <div className="flex flex-col md:flex-row justify-between items-end border-b-2 border-black pb-2 gap-4">
                                <div>
                                    <span className="text-sm font-bold text-black uppercase tracking-widest">Today's Fixtures</span>
                                     <div className="text-[10px] font-mono text-gray-400 mt-1">
                                        Showing {filteredMatches.length} {sportFilter === 'all' ? '' : sportFilter} Match{filteredMatches.length !== 1 ? 'es' : ''}
                                     </div>
                                </div>

                                {/* Status Filters */}
                                <div className="flex gap-1">
                                    {['all', 'LIVE', 'UPCOMING', 'FT'].map(s => (
                                        <button 
                                            key={s}
                                            onClick={() => setStatusFilter(s as any)}
                                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors rounded-sm ${statusFilter === s ? 'bg-black text-white' : 'text-gray-400 hover:text-black hover:bg-gray-50'}`}
                                        >
                                            {s === 'all' ? 'All' : (s === 'FT' ? 'Results' : s)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sport Filters - Tab Style */}
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                 {['all', 'cricket', 'netball', 'rugby'].map(s => (
                                     <button
                                        key={s}
                                        onClick={() => setSportFilter(s as any)}
                                        className={`flex items-center gap-2 px-4 py-2 border rounded-sm transition-all text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${sportFilter === s ? 'bg-penrice-gold border-penrice-gold text-black shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:border-black'}`}
                                     >
                                         {s === 'all' && <i className="fa-solid fa-layer-group"></i>}
                                         {s === 'cricket' && <span>🏏</span>}
                                         {s === 'netball' && <span>🏐</span>}
                                         {s === 'rugby' && <span>🏉</span>}
                                         {s === 'all' ? 'All Sports' : s}
                                     </button>
                                 ))}
                            </div>
                         </div>
                         
                         {/* Empty State */}
                         {filteredMatches.length === 0 && !loading && (
                            <div className="flex flex-col items-center justify-center py-20 bg-gray-50 border border-dashed border-gray-300 rounded-sm">
                                <i className="fa-solid fa-filter text-2xl text-gray-300 mb-2"></i>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">No matches found</h3>
                                <button onClick={() => { setSportFilter('all'); setStatusFilter('all'); }} className="mt-4 text-[10px] font-bold text-black underline uppercase">Clear Filters</button>
                            </div>
                         )}

                         {filteredMatches.map(match => {
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
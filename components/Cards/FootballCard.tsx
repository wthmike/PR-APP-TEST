import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Match, GameEvent } from '../../types';
import { Badge, getContrastYIQ } from '../Shared';
import { Marquee } from '../Layout/Marquee';

// Reusable Possession Bar Component
const PossessionBar = ({ match, theme = 'dark' }: { match: Match, theme?: 'dark' | 'light' }) => {
    if (!match.footballStats?.enableAdvancedStats) return null;

    const [now, setNow] = useState(Date.now());
    const stats = match.footballStats;

    useEffect(() => {
        if (stats.possessionStatus !== 'neutral') {
            const timer = setInterval(() => setNow(Date.now()), 1000);
            return () => clearInterval(timer);
        }
    }, [stats.possessionStatus]);

    let homeTime = stats.possessionHome || 0;
    let awayTime = stats.possessionAway || 0;
    
    if (stats.possessionStatus === 'home') {
        homeTime += (now - (stats.lastPossessionUpdate || now));
    } else if (stats.possessionStatus === 'away') {
        awayTime += (now - (stats.lastPossessionUpdate || now));
    }

    const totalTime = homeTime + awayTime;
    const homePct = totalTime === 0 ? 50 : Math.round((homeTime / totalTime) * 100);
    const awayPct = 100 - homePct;

    const barBg = theme === 'dark' ? 'bg-white/10' : 'bg-gray-100';
    const textCol = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

    return (
        <div className="mb-4">
            <div className={`flex justify-between text-xs font-bold uppercase ${textCol} mb-2`}>
                <span>{homePct}%</span>
                <span>Possession</span>
                <span>{awayPct}%</span>
            </div>
            <div className={`h-3 w-full ${barBg} rounded-full overflow-hidden flex`}>
                <div 
                    style={{ width: `${homePct}%`, backgroundColor: match.homeTeamColor || '#000' }} 
                    className="h-full transition-all duration-1000 ease-linear"
                ></div>
                <div 
                    style={{ width: `${awayPct}%`, backgroundColor: match.awayTeamColor || '#ccc' }} 
                    className="h-full transition-all duration-1000 ease-linear"
                ></div>
            </div>
        </div>
    );
};

// Reusable Stat Row
const StatRow = ({ label, homeVal, awayVal, theme = 'dark' }: { label: string, homeVal: number, awayVal: number, theme?: 'dark' | 'light' }) => {
    const total = homeVal + awayVal;
    const homePct = total === 0 ? 50 : (homeVal / total) * 100;
    
    const barBg = theme === 'dark' ? 'bg-white/10' : 'bg-gray-100';
    const fillBase = theme === 'dark' ? 'bg-white/80' : 'bg-black/80';
    const fillFade = theme === 'dark' ? 'bg-white/30' : 'bg-black/30';
    const textCol = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

    return (
        <div className="mb-3">
            <div className={`flex justify-between text-xs font-bold uppercase ${textCol} mb-1`}>
                <span>{homeVal}</span>
                <span>{label}</span>
                <span>{awayVal}</span>
            </div>
            <div className={`h-1.5 ${barBg} rounded-full overflow-hidden flex`}>
                <div style={{ width: `${homePct}%` }} className={`${fillBase} h-full`}></div>
                <div style={{ width: `${100 - homePct}%` }} className={`${fillFade} h-full`}></div>
            </div>
        </div>
    );
};

const FootballPresentationOverlay = ({ match, allMatches, celebration, onClose }: { match: Match, allMatches?: Match[], celebration: {type: string, text: string} | null, onClose: () => void }) => {
    const homeColor = match.homeTeamColor || '#000000';
    const awayColor = match.awayTeamColor || '#ffffff';
    
    // Robust Filtering using Team Tag OR Fallback to Name
    const isHomeEvent = (e: GameEvent) => {
        if (e.team === 'home') return true;
        if (e.team === 'away') return false;
        return (e.player === match.teamName || match.homeTeamStats?.some(p => p.name === e.player));
    };

    const isAwayEvent = (e: GameEvent) => {
        if (e.team === 'away') return true;
        if (e.team === 'home') return false;
        return (e.player === match.opponent || match.awayTeamStats?.some(p => p.name === e.player));
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-neutral-900 text-white flex flex-col font-sans overflow-hidden h-screen w-screen">
             {/* Celebration Overlay */}
             {celebration && (
                <div className="absolute inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
                    <div className="text-center animate-pop-in relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-[80px] animate-pulse"></div>
                        <div className="relative text-[12vw] font-display font-bold leading-none italic uppercase tracking-tighter text-white drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)]">
                            {celebration.type}
                        </div>
                        <div className="text-4xl md:text-5xl font-display font-bold text-green-500 uppercase tracking-[0.2em] mt-4 border-t border-white/20 pt-6">
                            {celebration.text}
                        </div>
                    </div>
                </div>
            )}

            {/* Split Background */}
            <div className="absolute inset-0 flex">
                <div style={{ backgroundColor: homeColor }} className="w-1/2 h-full opacity-20 relative">
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent to-neutral-900"></div>
                </div>
                <div style={{ backgroundColor: awayColor }} className="w-1/2 h-full opacity-20 relative">
                     <div className="absolute inset-0 bg-gradient-to-l from-transparent to-neutral-900"></div>
                </div>
            </div>
            
            {/* Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>

            {/* Header */}
            <div className="h-20 flex justify-between items-center px-12 relative z-20 border-b border-white/5 bg-black/20 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                     <div className="bg-white text-black px-4 py-1 text-xs font-bold uppercase tracking-widest">Match Day Live</div>
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                        <span className="text-sm font-mono font-bold text-gray-300 uppercase">{match.period || '1st Half'}</span>
                     </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 hover:bg-white/10 text-gray-400 transition-colors">
                    <i className="fa-solid fa-xmark"></i>
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative z-10 px-8 py-8">
                
                {/* Scoreboard Section */}
                <div className="flex-1 flex items-center justify-center w-full mb-8">
                    <div className="flex items-center justify-between w-full max-w-7xl">
                        
                        {/* Home Team */}
                        <div className="flex-1 text-right pr-12">
                            <h2 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tight text-white mb-4 drop-shadow-lg">{match.teamName}</h2>
                            <div className="flex flex-col items-end space-y-2">
                                {match.events?.filter(e => e.type === 'GOAL' && isHomeEvent(e)).map((e, i) => (
                                    <span key={i} className="text-sm md:text-lg text-green-400 font-bold uppercase flex items-center gap-3">
                                        {e.player} <span className="bg-green-400 text-black px-1.5 py-0.5 rounded text-xs">{e.time}</span>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Score Center */}
                        <div className="bg-neutral-950/80 backdrop-blur-xl border border-white/10 px-12 py-8 rounded-sm shadow-2xl flex items-center gap-8 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                            <span className="text-8xl md:text-9xl font-display font-bold text-white leading-none tabular-nums">{match.homeScore}</span>
                            <div className="h-20 w-px bg-white/20"></div>
                            <span className="text-8xl md:text-9xl font-display font-bold text-white leading-none tabular-nums">{match.awayScore}</span>
                        </div>

                        {/* Away Team */}
                        <div className="flex-1 text-left pl-12">
                             <h2 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tight text-white mb-4 drop-shadow-lg">{match.opponent}</h2>
                             <div className="flex flex-col items-start space-y-2">
                                {match.events?.filter(e => e.type === 'GOAL' && isAwayEvent(e)).map((e, i) => (
                                    <span key={i} className="text-sm md:text-lg text-green-400 font-bold uppercase flex items-center gap-3">
                                        <span className="bg-green-400 text-black px-1.5 py-0.5 rounded text-xs">{e.time}</span> {e.player}
                                    </span>
                                ))}
                             </div>
                        </div>

                    </div>
                </div>

                {/* Stats & Timeline Grid */}
                <div className="h-64 grid grid-cols-12 gap-8 w-full max-w-7xl mx-auto">
                    {/* Stats */}
                    <div className="col-span-5 bg-black/40 border border-white/5 p-6 rounded-sm backdrop-blur-md flex flex-col justify-center">
                        <PossessionBar match={match} theme="dark" />
                        <StatRow label="Corners" homeVal={match.footballStats?.homeCorners || 0} awayVal={match.footballStats?.awayCorners || 0} theme="dark" />
                        <StatRow label="Fouls" homeVal={match.footballStats?.homeFouls || 0} awayVal={match.footballStats?.awayFouls || 0} theme="dark" />
                        <StatRow label="Cards (Y/R)" homeVal={(match.footballStats?.homeYellows||0)+(match.footballStats?.homeReds||0)} awayVal={(match.footballStats?.awayYellows||0)+(match.footballStats?.awayReds||0)} theme="dark" />
                    </div>

                    {/* Timeline Feed */}
                    <div className="col-span-7 bg-black/40 border border-white/5 p-6 rounded-sm backdrop-blur-md overflow-hidden flex flex-col">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Match Events</h4>
                        <div className="flex-1 overflow-y-auto custom-scroll pr-2">
                            {[...(match.events || [])].reverse().map((e, i) => {
                                let icon = '•';
                                let color = 'text-gray-400';
                                if (e.type === 'GOAL') { icon = '⚽'; color = 'text-green-500'; }
                                if (e.type === 'YEL') { icon = '🟨'; color = 'text-yellow-400'; }
                                if (e.type === 'RED') { icon = '🟥'; color = 'text-red-500'; }
                                return (
                                    <div key={i} className="mb-3 flex gap-4 items-center animate-fade-in-up">
                                        <div className="font-mono text-xs text-gray-500 w-8">{e.time}</div>
                                        <div className={`text-sm font-bold uppercase ${color} flex items-center gap-2 flex-1`}>
                                            <span>{icon}</span> {e.type} 
                                            <span className="text-white text-xs ml-2 font-medium normal-case opacity-80">{e.desc}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

             {/* Footer Ticker */}
            <div className="relative z-50">
                {allMatches && <Marquee matches={allMatches} />}
            </div>
        </div>
    );
};

export const FootballCard: React.FC<{ match: Match, allMatches?: Match[] }> = ({ match, allMatches }) => {
  const [expanded, setExpanded] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [celebration, setCelebration] = useState<{type: string, text: string} | null>(null);

  const isLive = match.status === 'LIVE';
  const isResult = match.status === 'FT' || match.status === 'RESULT';
  const lastEvent = match.events && match.events.length > 0 ? match.events[match.events.length - 1] : null;

  const homeColor = match.homeTeamColor || '#000000';
  const awayColor = match.awayTeamColor || '#ffffff';

  useEffect(() => {
      if(match.events && match.events.length > 0) {
          const latest = match.events[match.events.length - 1];
          if (latest.type === 'GOAL') {
              setCelebration({ type: 'GOAL!', text: `${latest.player} scores!` });
              setTimeout(() => setCelebration(null), 4000);
          }
      }
  }, [match.events]);

  return (
    <>
    {presentationMode && createPortal(<FootballPresentationOverlay match={match} allMatches={allMatches} celebration={celebration} onClose={() => setPresentationMode(false)} />, document.body)}
    
    <div className={`w-full bg-white border border-gray-200 transition-all duration-300 relative z-10 ${expanded ? 'border-black card-shadow-hover z-50' : 'hover:border-black hover:card-shadow-hover'}`}>
      {/* Header */}
      <div className="grid grid-cols-2 cursor-pointer bg-white border-b border-gray-100" onClick={() => setExpanded(!expanded)}>
        <div className="p-3 border-r border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
                {isLive ? <Badge color="red">LIVE</Badge> : (isResult ? <Badge color="black">FT</Badge> : <Badge>SOON</Badge>)}
                <Badge color="black">FOOTBALL</Badge>
                {match.yearGroup && <Badge color="gray">{match.yearGroup}</Badge>}
            </div>
            <div className="text-[10px] font-bold text-black uppercase tracking-wide">{match.league || 'Fixture'}</div>
        </div>
        <div className="p-3 flex items-center justify-end gap-4 bg-gray-50/50">
           <div className="flex flex-col items-end">
              {isLive && <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Clock</div>}
              <div className="font-display font-bold text-xl text-black leading-none">{isLive ? (match.period || '1st Half') : (isResult ? 'FT' : '-')}</div>
           </div>
           <button onClick={(e) => { e.stopPropagation(); setPresentationMode(true); }} className="hidden md:flex w-8 h-8 rounded-full hover:bg-black hover:text-white items-center justify-center transition-colors text-gray-400 border border-gray-200" title="Presentation Mode"><i className="fa-solid fa-expand text-xs"></i></button>
        </div>
      </div>

      {/* Main Scoreboard */}
      <div className="cursor-pointer relative min-h-[160px] flex items-stretch overflow-hidden bg-white" onClick={() => setExpanded(!expanded)}>
         {/* Home */}
         <div className="flex-1 flex flex-col items-center justify-center p-6 relative border-r border-gray-100">
            <div className="absolute left-0 top-0 bottom-0 w-3" style={{ backgroundColor: homeColor }}></div>
            <div className="font-display font-bold text-2xl md:text-3xl uppercase tracking-tighter leading-none mb-3 text-center text-black px-4">{match.teamName}</div>
            <div className="font-display font-bold text-7xl md:text-8xl tracking-tighter text-black">{match.homeScore}</div>
         </div>
         <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
             <div className="w-10 h-10 bg-gray-50 rotate-45 flex items-center justify-center border-4 border-white shadow-md">
                 <div className="-rotate-45 font-display font-bold text-gray-300 text-xs">VS</div>
             </div>
         </div>
         {/* Away */}
         <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
            <div className="absolute right-0 top-0 bottom-0 w-3" style={{ backgroundColor: awayColor }}></div>
            <div className="font-display font-bold text-2xl md:text-3xl uppercase tracking-tighter leading-none mb-3 text-center text-black px-4">{match.opponent}</div>
            <div className="font-display font-bold text-7xl md:text-8xl tracking-tighter text-black">{match.awayScore}</div>
         </div>
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none"></div>
      </div>

      {/* Live Ticker Strip */}
      {isLive && lastEvent && (
          <div className="bg-black border-t-4 border-penrice-gold text-white px-4 py-3 flex items-center justify-between cursor-pointer relative z-30 shadow-lg" onClick={() => setExpanded(!expanded)}>
              <div className="flex items-center overflow-hidden">
                  <div className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider mr-3 shrink-0 animate-pulse">Latest</div>
                  <div className="flex items-center text-sm font-bold uppercase truncate">
                      <span className="text-penrice-gold mr-3">{lastEvent.type}</span>
                      {lastEvent.player && <span className="font-medium mr-3 border-l border-white/20 pl-3">{lastEvent.player}</span>}
                      <span className="font-mono text-gray-400 text-xs">{lastEvent.time}</span>
                  </div>
              </div>
              <i className={`fa-solid fa-chevron-down text-[10px] text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}></i>
          </div>
      )}

      {/* Expanded Content */}
      <div className={`overflow-hidden transition-all duration-500 ease-in-out bg-white border-t border-gray-100 ${expanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
         
         {/* Advanced Stats Section for Regular Card */}
         {match.footballStats?.enableAdvancedStats && (
            <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="mb-4">
                     <span className="text-[10px] font-bold text-black uppercase tracking-widest block mb-2">Match Stats</span>
                     <PossessionBar match={match} theme="light" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <StatRow label="Corners" homeVal={match.footballStats.homeCorners} awayVal={match.footballStats.awayCorners} theme="light" />
                    <StatRow label="Fouls" homeVal={match.footballStats.homeFouls} awayVal={match.footballStats.awayFouls} theme="light" />
                </div>
            </div>
         )}

         <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
             <span className="text-[10px] font-bold text-black uppercase tracking-widest">Match Timeline</span>
         </div>
         <div className="p-6 h-64 overflow-y-auto custom-scroll">
             {[...(match.events || [])].reverse().map((e, idx) => (
                <div key={idx} className="relative pl-8 pb-8 last:pb-0">
                    <div className="absolute left-[5px] top-0 bottom-0 w-px bg-gray-200"></div>
                    <div className={`absolute left-[2px] top-2 w-2 h-2 border transform rotate-45 z-10 ${e.type === 'GOAL' ? 'bg-green-600 border-green-600' : 'bg-white border-gray-300'}`}></div>
                    <div className="flex items-start gap-4">
                        <div className="font-mono text-[10px] font-bold text-gray-400 w-8 pt-1">{e.time}</div>
                        <div className="flex-1">
                            <div className="text-xs font-bold text-black uppercase flex flex-wrap items-center">
                                <span className={`mr-2 px-1.5 py-0.5 text-[9px] font-bold border rounded-sm ${e.type === 'GOAL' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-black border-black'}`}>{e.type}</span>
                                {e.player}
                            </div>
                            {e.desc && <div className="text-xs text-gray-500 mt-1">{e.desc}</div>}
                        </div>
                    </div>
                </div>
             ))}
         </div>
      </div>
      
      {(!isLive || !lastEvent) && (
        <div className="py-1 flex justify-center border-t border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => setExpanded(!expanded)}>
            <i className={`fa-solid fa-chevron-down text-[10px] text-gray-300 transition-transform ${expanded ? 'rotate-180' : ''}`}></i>
        </div>
      )}
    </div>
    </>
  );
};
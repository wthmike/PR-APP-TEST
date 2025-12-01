
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Match, GameEvent, PlayerStats } from '../../types';
import { Badge, getContrastYIQ } from '../Shared';
import { Marquee } from '../Layout/Marquee';

// --- Components ---

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

    const barBg = theme === 'dark' ? 'bg-white/10' : 'bg-gray-200';
    const textCol = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
    const numCol = theme === 'dark' ? 'text-white' : 'text-black';

    return (
        <div className="w-full">
            <div className={`flex justify-between text-[10px] font-bold uppercase ${textCol} mb-1`}>
                <span className={numCol}>{homePct}%</span>
                <span>Possession</span>
                <span className={numCol}>{awayPct}%</span>
            </div>
            <div className={`h-2 w-full ${barBg} rounded-full overflow-hidden flex`}>
                <div 
                    style={{ width: `${homePct}%`, backgroundColor: match.homeTeamColor || '#000' }} 
                    className="h-full transition-all duration-1000 ease-linear relative"
                >
                    <div className="absolute inset-0 bg-white/10"></div>
                </div>
                <div 
                    style={{ width: `${awayPct}%`, backgroundColor: match.awayTeamColor || '#ccc' }} 
                    className="h-full transition-all duration-1000 ease-linear relative"
                >
                    <div className="absolute inset-0 bg-black/5"></div>
                </div>
            </div>
        </div>
    );
};

const StatRow = ({ label, homeVal, awayVal, theme = 'dark' }: { label: string, homeVal: number, awayVal: number, theme?: 'dark' | 'light' }) => {
    const total = homeVal + awayVal;
    const homePct = total === 0 ? 50 : (homeVal / total) * 100;
    
    const barBg = theme === 'dark' ? 'bg-white/5' : 'bg-gray-100';
    const fillHome = theme === 'dark' ? 'bg-white' : 'bg-black';
    const fillAway = theme === 'dark' ? 'bg-gray-600' : 'bg-gray-400';
    const textCol = theme === 'dark' ? 'text-gray-500' : 'text-gray-400';
    const numCol = theme === 'dark' ? 'text-white' : 'text-black';

    return (
        <div className="w-full">
            <div className={`flex justify-between text-[10px] font-bold uppercase ${textCol} mb-1`}>
                <span className={numCol}>{homeVal}</span>
                <span>{label}</span>
                <span className={numCol}>{awayVal}</span>
            </div>
            <div className={`h-1 w-full ${barBg} flex gap-0.5`}>
                <div style={{ width: `${homePct}%` }} className={`${fillHome} h-full rounded-l-full transition-all duration-500`}></div>
                <div style={{ width: `${100 - homePct}%` }} className={`${fillAway} h-full rounded-r-full transition-all duration-500`}></div>
            </div>
        </div>
    );
};

const LineupList = ({ players, teamName, color, align = 'left' }: { players?: PlayerStats[], teamName: string, color: string, align?: 'left' | 'right' }) => {
    const starters = players?.filter(p => p.status === 'starting') || [];
    const subs = players?.filter(p => p.status === 'sub') || [];

    const alignClass = align === 'right' ? 'text-right items-end' : 'text-left items-start';

    return (
        <div className={`flex flex-col ${alignClass} h-full`}>
            <div className={`mb-6 pb-2 border-b border-white/10 w-full ${align === 'right' ? 'flex flex-col items-end' : ''}`}>
                 <h3 className="font-display font-bold text-2xl uppercase tracking-tighter text-white leading-none mb-1">{teamName}</h3>
                 <div className="h-1 w-12" style={{ backgroundColor: color }}></div>
            </div>
            
            <div className={`flex-1 overflow-y-auto custom-scroll w-full space-y-1 ${align === 'right' ? 'pr-2' : 'pl-2'}`}>
                {starters.length === 0 && <div className="text-gray-600 text-xs uppercase tracking-widest italic">No Lineup Available</div>}
                
                {starters.map((p, i) => (
                    <div key={i} className={`py-1.5 border-b border-white/5 flex items-center gap-3 group ${align === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="font-mono text-gray-600 text-[10px] group-hover:text-penrice-gold transition-colors">{i+1}</span>
                        <span className="text-sm font-medium text-gray-300 uppercase tracking-tight group-hover:text-white transition-colors">{p.name}</span>
                        {p.dismissal && (
                            <div className="flex gap-1">
                                {p.dismissal.includes('Yellow') && <div className="w-2 h-3 bg-yellow-400 rounded-[1px]"></div>}
                                {p.dismissal.includes('Red') && <div className="w-2 h-3 bg-red-600 rounded-[1px]"></div>}
                            </div>
                        )}
                        {p.runs > 0 && ( // Goals
                            <div className="flex gap-1">
                                {Array.from({length: p.runs}).map((_, g) => (
                                    <span key={g} className="text-[10px]">⚽</span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {subs.length > 0 && (
                    <div className="mt-6">
                        <h4 className={`text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ${align === 'right' ? 'text-right' : 'text-left'}`}>Substitutes</h4>
                        {subs.map((p, i) => (
                            <div key={`sub-${i}`} className={`py-1 flex items-center gap-3 ${align === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <span className="text-xs text-gray-500 uppercase tracking-tight">{p.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Presentation Overlay ---

const FootballPresentationOverlay = ({ match, allMatches, celebration, onClose }: { match: Match, allMatches?: Match[], celebration: {type: string, text: string} | null, onClose: () => void }) => {
    const homeColor = match.homeTeamColor || '#000000';
    const awayColor = match.awayTeamColor || '#ffffff';
    
    // Robust Filtering for Events
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
        <div className="fixed inset-0 z-[9999] bg-black text-white flex flex-col font-sans overflow-hidden">
             {/* Celebration Overlay */}
             {celebration && (
                <div className="absolute inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
                    <div className="text-center animate-pop-in relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-penrice-gold/10 rounded-full blur-[80px] animate-pulse"></div>
                        <div className="relative text-[8vw] font-display font-bold leading-none italic uppercase tracking-tighter text-white drop-shadow-2xl">
                            {celebration.type}
                        </div>
                        <div className="text-3xl md:text-5xl font-display font-bold text-penrice-gold uppercase tracking-[0.2em] mt-4 border-t border-white/20 pt-6">
                            {celebration.text}
                        </div>
                    </div>
                </div>
            )}

            {/* Background Layers */}
            <div className="absolute inset-0 flex">
                <div className="w-1/2 h-full bg-gradient-to-r from-neutral-900 to-black relative">
                     <div className="absolute inset-0 opacity-20 mix-blend-color" style={{ backgroundColor: homeColor }}></div>
                </div>
                <div className="w-1/2 h-full bg-gradient-to-l from-neutral-900 to-black relative">
                    <div className="absolute inset-0 opacity-20 mix-blend-color" style={{ backgroundColor: awayColor }}></div>
                </div>
            </div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

            {/* Header */}
            <div className="relative z-30 h-16 flex justify-between items-center px-8 border-b border-white/10 bg-black/50 backdrop-blur-md">
                 <div className="flex items-center gap-4">
                     <div className="bg-white text-black px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm">Match Day Live</div>
                     <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{match.league} • {match.yearGroup}</span>
                 </div>
                 <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/20 transition-colors">
                     <i className="fa-solid fa-xmark text-gray-400"></i>
                 </button>
            </div>

            {/* Main Layout - 3 Columns */}
            <div className="relative z-20 flex-1 grid grid-cols-12 gap-0 overflow-hidden">
                
                {/* LEFT: Home Lineup */}
                <div className="col-span-3 bg-black/20 border-r border-white/5 p-8 pt-10 backdrop-blur-sm">
                    <LineupList players={match.homeTeamStats} teamName={match.teamName} color={homeColor} align="left" />
                </div>

                {/* CENTER: Scoreboard & Stats */}
                <div className="col-span-6 flex flex-col relative">
                     
                     {/* Scoreboard */}
                     <div className="flex-1 flex flex-col justify-center items-center">
                         
                         {/* Clock/Status Pill */}
                         <div className="mb-8 bg-neutral-900/80 border border-white/10 px-6 py-2 rounded-full shadow-xl flex items-center gap-3">
                             {match.status === 'LIVE' && <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>}
                             <span className="font-mono font-bold text-lg text-white uppercase tracking-widest">{match.period || 'KO'}</span>
                         </div>

                         {/* Scores */}
                         <div className="flex items-center justify-center w-full gap-12 mb-8">
                             <div className="text-center">
                                 <div className="text-[10rem] font-display font-bold leading-[0.8] tracking-tighter text-white drop-shadow-2xl tabular-nums">{match.homeScore}</div>
                             </div>
                             <div className="h-32 w-px bg-white/10 skew-x-[-20deg]"></div>
                             <div className="text-center">
                                 <div className="text-[10rem] font-display font-bold leading-[0.8] tracking-tighter text-white drop-shadow-2xl tabular-nums">{match.awayScore}</div>
                             </div>
                         </div>

                         {/* Match Events (Goals + Cards) */}
                         <div className="w-full max-w-lg flex justify-between px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-12">
                             <div className="text-left space-y-1">
                                 {match.events?.filter(e => ['GOAL', 'YEL', 'RED'].includes(e.type) && isHomeEvent(e)).map((e, i) => (
                                     <div key={i} className="flex items-center gap-2">
                                         {e.type === 'GOAL' && (
                                            <>
                                                <span className="text-green-400">⚽</span> 
                                                <span className="text-green-400">
                                                    {e.player} {e.time}
                                                    {e.assist && <span className="text-gray-500 text-[9px] ml-1 block">Ast: {e.assist}</span>}
                                                </span>
                                            </>
                                         )}
                                         {e.type === 'YEL' && <><div className="w-2 h-3 bg-yellow-400 rounded-[1px]"></div> <span className="text-yellow-400">{e.player} {e.time}</span></>}
                                         {e.type === 'RED' && <><div className="w-2 h-3 bg-red-600 rounded-[1px]"></div> <span className="text-red-600">{e.player} {e.time}</span></>}
                                     </div>
                                 ))}
                             </div>
                             <div className="text-right space-y-1">
                                 {match.events?.filter(e => ['GOAL', 'YEL', 'RED'].includes(e.type) && isAwayEvent(e)).map((e, i) => (
                                     <div key={i} className="flex items-center justify-end gap-2">
                                         {e.type === 'GOAL' && (
                                            <>
                                                <span className="text-green-400">
                                                    {e.player} {e.time}
                                                    {e.assist && <span className="text-gray-500 text-[9px] mr-1 block">Ast: {e.assist}</span>}
                                                </span> 
                                                <span className="text-green-400">⚽</span>
                                            </>
                                         )}
                                         {e.type === 'YEL' && <><span className="text-yellow-400">{e.player} {e.time}</span> <div className="w-2 h-3 bg-yellow-400 rounded-[1px]"></div></>}
                                         {e.type === 'RED' && <><span className="text-red-600">{e.player} {e.time}</span> <div className="w-2 h-3 bg-red-600 rounded-[1px]"></div></>}
                                     </div>
                                 ))}
                             </div>
                         </div>

                         {/* Live Stats Panel */}
                         <div className="w-full max-w-md bg-black/40 border border-white/10 p-6 rounded-sm backdrop-blur-md">
                             <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 text-center">Live Match Stats</h4>
                             <div className="space-y-4">
                                 <PossessionBar match={match} theme="dark" />
                                 <div className="grid grid-cols-2 gap-8">
                                     <StatRow label="Corners" homeVal={match.footballStats?.homeCorners || 0} awayVal={match.footballStats?.awayCorners || 0} theme="dark" />
                                     <StatRow label="Fouls" homeVal={match.footballStats?.homeFouls || 0} awayVal={match.footballStats?.awayFouls || 0} theme="dark" />
                                 </div>
                             </div>
                         </div>
                     </div>
                </div>

                {/* RIGHT: Away Lineup */}
                <div className="col-span-3 bg-black/20 border-l border-white/5 p-8 pt-10 backdrop-blur-sm">
                    <LineupList players={match.awayTeamStats} teamName={match.opponent} color={awayColor} align="right" />
                </div>
            </div>

            {/* Bottom Ticker */}
            <div className="relative z-50">
                {allMatches && <Marquee matches={allMatches} />}
            </div>
        </div>
    );
};

// --- Main Card ---

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

      {/* Main Scoreboard - Responsive Fixes */}
      <div className="cursor-pointer relative min-h-[140px] md:min-h-[160px] flex overflow-hidden bg-white" onClick={() => setExpanded(!expanded)}>
         
         {/* Home */}
         <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 relative border-r border-gray-100">
            <div className="absolute left-0 top-0 bottom-0 w-2 md:w-3" style={{ backgroundColor: homeColor }}></div>
            <div className="font-display font-bold text-xl md:text-3xl uppercase tracking-tighter leading-tight mb-2 text-center text-black px-2 md:px-4 break-words w-full line-clamp-2">
                {match.teamName}
            </div>
            <div className="font-display font-bold text-5xl md:text-8xl tracking-tighter text-black leading-none">{match.homeScore}</div>
         </div>

         {/* Center VS Element */}
         <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
             <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-50 rotate-45 flex items-center justify-center border-2 md:border-4 border-white shadow-md">
                 <div className="-rotate-45 font-display font-bold text-gray-300 text-[10px] md:text-xs">VS</div>
             </div>
         </div>

         {/* Away */}
         <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 relative">
            <div className="absolute right-0 top-0 bottom-0 w-2 md:w-3" style={{ backgroundColor: awayColor }}></div>
            <div className="font-display font-bold text-xl md:text-3xl uppercase tracking-tighter leading-tight mb-2 text-center text-black px-2 md:px-4 break-words w-full line-clamp-2">
                {match.opponent}
            </div>
            <div className="font-display font-bold text-5xl md:text-8xl tracking-tighter text-black leading-none">{match.awayScore}</div>
         </div>
         
         {/* Texture */}
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
         
         <div className="p-4 h-80 overflow-y-auto custom-scroll relative">
            {/* Central Spine */}
            <div className="absolute left-1/2 top-4 bottom-4 w-px bg-gray-200 -translate-x-1/2"></div>
            
            {match.events && match.events.length === 0 && (
                 <div className="text-center py-12 text-gray-300 text-xs font-bold uppercase tracking-widest absolute inset-0 flex items-center justify-center">
                    Kick Off Pending...
                </div>
            )}

            {[...(match.events || [])].reverse().map((e, idx) => {
                let side = 'left'; 
                // Determine side based on team property if available, otherwise heuristic
                if (e.team === 'away') side = 'right';
                else if (e.team === 'home') side = 'left';
                else if (match.awayTeamStats?.some(p => p.name === e.player) || e.player === match.opponent) side = 'right';
                
                const isLeft = side === 'left';
                const typeColor = e.type === 'GOAL' ? 'bg-green-600 border-green-600 text-white' : 
                                  (e.type === 'RED' ? 'bg-red-600 border-red-600 text-white' : 
                                  (e.type === 'YEL' ? 'bg-yellow-400 border-yellow-400 text-black' : 
                                  'bg-white border-gray-300 text-black'));

                return (
                    <div key={idx} className="flex items-center w-full mb-6 relative group">
                        {/* Left Content (Home) */}
                        <div className={`w-1/2 pr-8 text-right flex flex-col items-end ${!isLeft ? 'invisible' : ''}`}>
                            <span className="font-mono text-[10px] font-bold text-gray-400 mb-1">{e.time}</span>
                            <div className="flex items-center justify-end gap-2 mb-1">
                                <span className="text-xs font-bold text-black uppercase">{e.player}</span>
                                <span className={`px-1.5 py-px text-[9px] font-bold border rounded-sm ${typeColor}`}>{e.type}</span>
                            </div>
                            <div className="text-[10px] text-gray-500 leading-tight">
                                {e.desc}
                                {e.assist && <span className="block text-gray-400 italic">Ast: {e.assist}</span>}
                            </div>
                        </div>

                        {/* Center Icon */}
                        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center z-10">
                            <div className={`w-3 h-3 border-2 rotate-45 transition-transform group-hover:scale-125 ${typeColor}`}></div>
                        </div>

                        {/* Right Content (Away) */}
                        <div className={`w-1/2 pl-8 text-left flex flex-col items-start ${isLeft ? 'invisible' : ''}`}>
                            <span className="font-mono text-[10px] font-bold text-gray-400 mb-1">{e.time}</span>
                            <div className="flex items-center justify-start gap-2 mb-1">
                                <span className={`px-1.5 py-px text-[9px] font-bold border rounded-sm ${typeColor}`}>{e.type}</span>
                                <span className="text-xs font-bold text-black uppercase">{e.player}</span>
                            </div>
                            <div className="text-[10px] text-gray-500 leading-tight">
                                {e.desc}
                                {e.assist && <span className="block text-gray-400 italic">Ast: {e.assist}</span>}
                            </div>
                        </div>
                    </div>
                );
            })}
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

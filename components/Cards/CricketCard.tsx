import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Match, PlayerStats, GameEvent } from '../../types';
import { Badge } from '../Shared';
import { Marquee } from '../Layout/Marquee';

// --- Presentation Overlay Component ---
const CricketPresentationOverlay = ({ 
  match, 
  allMatches, 
  celebration, 
  onClose 
}: { 
  match: Match, 
  allMatches?: Match[], 
  celebration: {type: string, text: string} | null,
  onClose: () => void 
}) => {
    // State for Scorecard Tab
    const [activeTab, setActiveTab] = useState<'batting' | 'bowling'>('batting');

    // Derived Data
    const isPenriceBatting = match.penriceStatus === 'batting';
    
    // Identify Teams based on current innings status for "Batting" vs "Bowling" context
    // Batting Team = The team currently at the crease
    const battingTeamName = isPenriceBatting ? match.teamName : match.opponent;
    const battingScore = isPenriceBatting ? match.homeScore : match.awayScore;
    const battingWickets = isPenriceBatting ? match.homeWickets : match.awayWickets;
    const battingStats = isPenriceBatting ? match.homeTeamStats : match.awayTeamStats;

    // Bowling Team = The team in the field
    const bowlingTeamName = isPenriceBatting ? match.opponent : match.teamName;
    const bowlingScore = isPenriceBatting ? match.awayScore : match.homeScore;
    const bowlingWickets = isPenriceBatting ? match.awayWickets : match.homeWickets;
    const bowlingStats = isPenriceBatting ? match.awayTeamStats : match.homeTeamStats;

    // Resolve Data for the Sidebar based on Tab Selection
    // Note: We map 'batting' tab to the CURRENT batting team, and 'bowling' to the CURRENT bowling team
    // regardless of whether they are Home or Away.
    const sidebarTeamName = activeTab === 'batting' ? battingTeamName : bowlingTeamName;
    const sidebarStats = activeTab === 'batting' ? battingStats : bowlingStats;
    const sidebarScore = activeTab === 'batting' ? `${battingScore}/${battingWickets}` : `${bowlingScore}/${bowlingWickets}`;

    const lastEvent = match.events?.[match.events.length - 1];
    
    const strikerP = battingStats?.find(p => p.name === match.currentStriker);
    const nonStrikerP = battingStats?.find(p => p.name === match.currentNonStriker);
    const bowlerP = bowlingStats?.find(p => p.name === match.currentBowler);
    
    const bowlerOvers = bowlerP ? `${Math.floor((bowlerP.bowlBalls || 0) / 6)}.${(bowlerP.bowlBalls || 0) % 6}` : '0.0';
    const bowlerFigures = bowlerP ? `${bowlerP.bowlWkts || 0}-${bowlerP.bowlRuns || 0}` : '0-0';

    // Logic for Status (Chasing / Target)
    const isSecondInnings = (match.events || []).some(e => e.type === 'INNINGS BREAK');
    const target = (bowlingScore || 0) + 1;
    const runsNeeded = target - (battingScore || 0);

    return (
        <div className="fixed inset-0 z-[9999] bg-neutral-950 text-white flex flex-col font-sans overflow-hidden h-screen w-screen selection:bg-penrice-gold selection:text-black">
            {/* Celebration Overlay */}
            {celebration && (
                <div className="absolute inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
                    <div className="text-center animate-pop-in relative">
                        {/* Decorative burst */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-penrice-gold/10 rounded-full blur-[100px] animate-pulse"></div>
                        
                        <div className={`relative text-[18vw] font-display font-bold leading-none italic uppercase tracking-tighter ${celebration.type === 'WICKET' || celebration.type === 'HOWZAT!' || celebration.text === 'DUCK!' ? 'text-red-600' : 'text-penrice-gold'} drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)]`}>
                            {celebration.text}
                        </div>
                        {celebration.type === '4' && <div className="text-5xl font-display font-bold text-white uppercase tracking-[0.5em] mt-8 border-t border-white/20 pt-8">Boundary</div>}
                        {celebration.type === '6' && <div className="text-5xl font-display font-bold text-white uppercase tracking-[0.5em] mt-8 border-t border-white/20 pt-8">Maximum</div>}
                        {(celebration.type === 'WICKET' || celebration.type === 'HOWZAT!') && <div className="text-5xl font-display font-bold text-white uppercase tracking-[0.5em] mt-8 border-t border-white/20 pt-8">Wicket Down</div>}
                    </div>
                </div>
            )}

            {/* Top Bar */}
            <div className="h-16 flex justify-between items-center px-8 border-b border-white/10 bg-black/40 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-6">
                     <div className="font-display font-bold text-penrice-gold text-2xl uppercase tracking-tighter leading-none">
                        Match<span className="text-white">Centre</span>
                     </div>
                     <div className="h-8 w-px bg-white/10"></div>
                     <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{match.yearGroup}</span>
                        <span className="text-xs font-bold text-white uppercase tracking-widest leading-none">{match.league}</span>
                     </div>
                </div>
                <div className="flex items-center gap-4">
                     <div className="px-3 py-1 bg-red-600/20 border border-red-600/50 text-red-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 rounded-full">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div> Live
                     </div>
                     <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 hover:bg-white/10 text-gray-400 transition-colors">
                        <i className="fa-solid fa-xmark"></i>
                     </button>
                </div>
            </div>

            {/* Main Layout */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* LEFT: Match Situation (Hero) */}
                <div className="flex-[2] flex flex-col border-r border-white/10 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black relative">
                    {/* Background Texture */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                    
                    <div className="flex-1 flex flex-col p-8 md:p-12 relative z-10">
                        {/* Score Header */}
                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <div className="text-penrice-gold font-bold uppercase tracking-[0.3em] text-xs mb-2">Batting Innings</div>
                                <h1 className="font-display font-bold text-7xl uppercase text-white tracking-tight leading-none mb-1">{battingTeamName}</h1>
                                <div className="text-gray-500 font-bold uppercase tracking-wider text-sm">vs {bowlingTeamName}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-display font-bold text-9xl text-white leading-[0.8] tracking-tighter">
                                    {battingScore}<span className="text-gray-600 text-6xl align-top">/{battingWickets}</span>
                                </div>
                                <div className="text-4xl font-display font-bold text-gray-600 uppercase mt-2">
                                    Ov {match.currentOver?.toFixed(1)} <span className="text-2xl text-gray-700">/ {match.maxOvers || 20}</span>
                                </div>
                            </div>
                        </div>

                        {/* Middle Section: Active Players Grid */}
                        <div className="grid grid-cols-12 gap-8 mb-auto">
                            {/* Striker Card */}
                            <div className="col-span-5 bg-white/5 border border-white/10 p-6 rounded-lg backdrop-blur-sm relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-penrice-gold"></div>
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-penrice-gold font-bold uppercase tracking-widest text-xs">On Strike</span>
                                    <i className="fa-solid fa-baseball-bat-ball text-white/20 text-xl group-hover:scale-110 transition-transform"></i>
                                </div>
                                <div className="font-display font-bold text-4xl text-white truncate mb-1">{match.currentStriker || '-'}</div>
                                <div className="font-mono text-3xl text-gray-400">
                                    {strikerP?.runs || 0}<span className="text-lg text-gray-600 ml-1">({strikerP?.balls || 0})</span>
                                </div>
                            </div>

                            {/* Non-Striker Card */}
                            <div className="col-span-4 bg-white/5 border border-white/10 p-6 rounded-lg backdrop-blur-sm relative overflow-hidden">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Non-Striker</span>
                                </div>
                                <div className="font-display font-bold text-3xl text-gray-300 truncate mb-1">{match.currentNonStriker || '-'}</div>
                                <div className="font-mono text-2xl text-gray-500">
                                    {nonStrikerP?.runs || 0}<span className="text-base text-gray-600 ml-1">({nonStrikerP?.balls || 0})</span>
                                </div>
                            </div>

                            {/* Bowler Card */}
                            <div className="col-span-3 bg-black/20 border border-white/5 p-6 rounded-lg flex flex-col justify-center">
                                <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mb-2">Bowling</span>
                                <div className="font-display font-bold text-xl text-white truncate leading-none mb-2">{match.currentBowler || '-'}</div>
                                <div className="font-mono text-xl text-penrice-gold">{bowlerFigures} <span className="text-sm text-gray-600">({bowlerOvers})</span></div>
                            </div>
                        </div>

                        {/* Match Status Footer */}
                        <div className="mt-8 border-t border-white/10 pt-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/5 rounded-full">
                                    <i className="fa-solid fa-scale-balanced text-gray-400"></i>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Match Equation</div>
                                    <div className="text-xl font-display font-bold text-white uppercase tracking-wide">
                                        {isSecondInnings ? (
                                            <>Target {target} <span className="text-gray-600 mx-2">•</span> <span className="text-penrice-gold">Need {Math.max(0, runsNeeded)} to win</span></>
                                        ) : (
                                            <>1st Innings <span className="text-gray-600 mx-2">•</span> Setting Target</>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Current Run Rate */}
                            <div className="text-right">
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Current Run Rate</div>
                                <div className="text-2xl font-mono font-bold text-white">
                                    {match.currentOver && match.currentOver > 0 ? (battingScore / match.currentOver).toFixed(2) : '0.00'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer: Commentary */}
                    <div className="h-20 bg-black/60 backdrop-blur-md border-t border-white/10 flex items-center px-8 shrink-0">
                         <div className="mr-8 flex items-center gap-3 border-r border-white/10 pr-8 h-full">
                             <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Feed</span>
                         </div>
                         <div className="flex-1 overflow-hidden">
                            {lastEvent ? (
                                <div className="flex items-center gap-4 animate-fade-in-up">
                                    <span className="font-mono text-penrice-gold font-bold text-lg">{lastEvent.time}</span>
                                    <div className={`font-display font-bold text-2xl px-3 py-0.5 rounded-sm ${['WICKET','HOWZAT!'].includes(lastEvent.type) ? 'bg-red-600 text-white' : (['4','6'].includes(lastEvent.type) ? 'bg-white text-black' : 'bg-gray-800 text-gray-300')}`}>
                                        {lastEvent.type}
                                    </div>
                                    <span className="text-white text-lg font-bold uppercase truncate opacity-90">{lastEvent.desc}</span>
                                </div>
                            ) : (
                                <span className="text-gray-500 font-bold uppercase tracking-widest text-sm">Waiting for play to commence...</span>
                            )}
                         </div>
                    </div>
                </div>

                {/* RIGHT: Scorecard Sidebar */}
                <div className="flex-1 flex flex-col bg-neutral-900 border-l border-white/5 w-1/3 min-w-[350px]">
                    {/* Team Toggle Tabs */}
                    <div className="flex border-b border-white/10">
                        <button 
                            onClick={() => setActiveTab('batting')}
                            className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'batting' ? 'bg-white/5 text-penrice-gold border-b-2 border-penrice-gold' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            {battingTeamName}
                        </button>
                        <button 
                            onClick={() => setActiveTab('bowling')}
                            className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'bowling' ? 'bg-white/5 text-penrice-gold border-b-2 border-penrice-gold' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            {bowlingTeamName}
                        </button>
                    </div>

                    {/* Stats Header */}
                    <div className="p-6 pb-2">
                        <div className="flex justify-between items-end mb-4">
                            <h3 className="font-display font-bold text-3xl text-white uppercase leading-none">{sidebarTeamName}</h3>
                            <span className="font-mono text-xl text-gray-400">{sidebarScore}</span>
                        </div>
                        <div className="h-px w-full bg-white/10"></div>
                    </div>

                    {/* Scrollable List */}
                    <div className="flex-1 overflow-y-auto custom-scroll p-6 pt-0 space-y-1">
                        {!sidebarStats || sidebarStats.length === 0 ? (
                            <div className="text-center py-12 text-gray-600 text-xs font-bold uppercase tracking-widest">No Data Available</div>
                        ) : (
                            sidebarStats.map((p, i) => {
                                // Determining styling based on status
                                const isCurrentBatting = p.status === 'batting';
                                const isOut = p.status === 'out';
                                const isNotOut = p.status === 'not out';
                                const isYetToBat = p.status === 'waiting';

                                return (
                                    <div key={i} className={`flex items-center justify-between py-3 border-b border-white/5 group hover:bg-white/5 px-2 -mx-2 rounded-sm transition-colors ${isCurrentBatting ? 'bg-white/5' : ''}`}>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold text-sm ${isCurrentBatting ? 'text-penrice-gold' : (isOut ? 'text-gray-500 line-through' : (isNotOut ? 'text-white' : 'text-gray-600'))}`}>
                                                    {p.name}
                                                </span>
                                                {isCurrentBatting && <div className="w-1.5 h-1.5 bg-penrice-gold rounded-full animate-pulse"></div>}
                                            </div>
                                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                                                {p.dismissal || (isCurrentBatting ? 'Batting' : (isNotOut ? 'Not Out' : (isYetToBat ? '' : '')))}
                                            </span>
                                        </div>
                                        <div className={`font-mono text-sm ${isYetToBat ? 'text-gray-700' : 'text-white font-bold'}`}>
                                            {p.runs} <span className="text-gray-600 text-[10px] font-sans">({p.balls})</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        
                        {/* Bowling Stats Section (if viewing bowling team tab, or at bottom of batting tab?) 
                            Usually standard scorecard shows Batting Stats. 
                            If we want to see bowling figures, they belong to the Opponent.
                            Let's keep it simple: This list shows the BATTING stats for the selected team.
                        */}
                    </div>
                </div>
            </div>

            {/* Bottom Ticker */}
            <div className="relative z-50">
                {allMatches && <Marquee matches={allMatches} />}
            </div>
        </div>
    );
};

// --- Main Cricket Card Component ---
export const CricketCard: React.FC<{ match: Match, allMatches?: Match[] }> = ({ match, allMatches }) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'away'>('home');
  const [presentationMode, setPresentationMode] = useState(false);
  const [celebration, setCelebration] = useState<{type: string, text: string} | null>(null);
  
  // Refs for tracking new events for animation
  const lastEventCountRef = useRef(match.events?.length || 0);

  const isLive = match.status === 'LIVE';
  const isResult = match.status === 'FT' || match.status === 'RESULT';
  const isPenriceBatting = match.penriceStatus === 'batting';
  
  // Formatters
  const homeScoreText = `${match.homeScore || 0}-${match.homeWickets || 0}`;
  const awayScoreText = `${match.awayScore || 0}-${match.awayWickets || 0}`;
  
  const activeStyle = "text-black border-l-4 border-black pl-3 bg-gray-50";
  const inactiveStyle = "text-gray-400 pl-4";

  // Data retrieval for Live Strip
  const battingTeamStats = isPenriceBatting ? match.homeTeamStats : match.awayTeamStats;
  const bowlingTeamStats = isPenriceBatting ? match.awayTeamStats : match.homeTeamStats;
  
  const strikerP = battingTeamStats?.find(p => p.name === match.currentStriker);
  const nonStrikerP = battingTeamStats?.find(p => p.name === match.currentNonStriker);
  const bowlerP = bowlingTeamStats?.find(p => p.name === match.currentBowler);
  
  const bowlerOvers = bowlerP ? `${Math.floor((bowlerP.bowlBalls || 0) / 6)}.${(bowlerP.bowlBalls || 0) % 6}` : '0.0';
  const bowlerFigures = bowlerP ? `${bowlerP.bowlWkts || 0}-${bowlerP.bowlRuns || 0} (${bowlerOvers})` : '';

  // Effect to trigger celebration
  useEffect(() => {
      if (!match.events) return;
      
      if (match.events.length > lastEventCountRef.current) {
          const latestEvent = match.events[match.events.length - 1];
          const type = latestEvent.type;
          
          if (['4', '6', 'WICKET', 'HOWZAT!'].includes(type) || latestEvent.duckType) {
              let text = type;
              if (type === '4') text = "BOUNDARY!";
              if (type === '6') text = "MAXIMUM!";
              if (type === 'WICKET' || type === 'HOWZAT!') text = "WICKET!";
              if (latestEvent.duckType) text = "DUCK!";
              
              setCelebration({ type, text });
              
              // Clear after 5 seconds
              const timer = setTimeout(() => {
                  setCelebration(null);
              }, 5000);
              return () => clearTimeout(timer);
          }
      }
      lastEventCountRef.current = match.events.length;
  }, [match.events]);

  // Effect to handle Escape key
  useEffect(() => {
      const handleEsc = (e: KeyboardEvent) => {
          if (e.key === 'Escape') setPresentationMode(false);
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Scorecard Row Component
  const ScorecardTable = ({ stats, striker }: { stats: PlayerStats[] | undefined, striker?: string }) => {
      if (!stats || stats.length === 0) return <div className="text-xs text-gray-400 italic text-center py-4">Waiting for team data...</div>;
      
      const batters = stats;
      const bowlers = stats.filter(p => (p.bowlBalls || 0) > 0 || (p.bowlWkts || 0) > 0);

      return (
          <div>
            {batters.map((p, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 text-xs">
                    <div className="flex-1">
                        <div className={`${(p.status === 'batting' || p.status === 'not out') ? 'text-black font-bold' : (p.status === 'out' ? 'text-red-600 line-through decoration-red-200' : 'text-gray-500 font-medium')}`}>
                            {p.name} {p.name === striker && p.status === 'batting' && '●'}
                        </div>
                        {p.dismissal && <div className="text-[9px] text-gray-400 mt-0.5 uppercase tracking-wide">{p.dismissal}</div>}
                        {p.status === 'not out' && <div className="text-[9px] text-penrice-navy mt-0.5 uppercase tracking-wide font-bold">Not Out</div>}
                    </div>
                    <div className={`font-mono font-bold text-sm w-16 text-right ${p.status === 'waiting' ? 'text-gray-300' : 'text-black'}`}>
                        {p.runs} <span className="text-gray-300 font-sans font-normal text-[9px]">({p.balls})</span>
                    </div>
                </div>
            ))}
            
            {bowlers.length > 0 && (
                <div className="mt-6 pt-2 border-t border-black">
                     <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">Bowling</div>
                     {bowlers.map((p, i) => {
                         const overs = Math.floor((p.bowlBalls || 0) / 6) + '.' + ((p.bowlBalls || 0) % 6);
                         return (
                            <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-100 text-xs text-gray-600">
                                <span className="font-bold text-black uppercase tracking-wide text-[10px]">{p.name}</span>
                                <div className="flex gap-4 font-mono text-[10px]">
                                    <span><span className="text-gray-300 mr-1">O:</span>{overs}</span>
                                    <span><span className="text-gray-300 mr-1">R:</span>{p.bowlRuns || 0}</span>
                                    <span className="font-bold text-black"><span className="text-gray-300 mr-1 font-normal">W:</span>{p.bowlWkts || 0}</span>
                                </div>
                            </div>
                         );
                     })}
                </div>
            )}
          </div>
      );
  };

  return (
    <>
    {presentationMode && createPortal(
        <CricketPresentationOverlay 
            match={match} 
            allMatches={allMatches} 
            celebration={celebration} 
            onClose={() => setPresentationMode(false)} 
        />, 
        document.body
    )}
    <div className={`w-full bg-white border border-gray-200 transition-all duration-300 relative z-10 ${expanded ? 'border-black card-shadow-hover z-50' : 'hover:border-black hover:card-shadow-hover'}`}>
      {/* Header */}
      <div className="grid grid-cols-2 cursor-pointer border-b border-gray-100" onClick={() => setExpanded(!expanded)}>
        <div className="p-3 border-r border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
                {isLive ? <Badge color="red">LIVE</Badge> : (isResult ? <Badge color="black">FT</Badge> : <Badge>UPCOMING</Badge>)}
                <Badge color="navy">CRICKET</Badge>
                {match.yearGroup && <Badge color="gray">{match.yearGroup}</Badge>}
            </div>
            <div className="text-[10px] font-bold text-black uppercase tracking-wide">
              {match.league || 'Fixture'}
              {match.maxOvers ? <span className="text-gray-400"> • {match.maxOvers} Overs</span> : ''}
            </div>
        </div>
        <div className="p-3 flex items-center justify-end gap-4 bg-gray-50/50">
           <div className="flex flex-col items-end">
               {isLive && <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Overs</div>}
               <div className="font-display font-bold text-xl text-black leading-none">{match.currentOver?.toFixed(1) || '0.0'}</div>
           </div>
           
           {/* Expand / Presentation Button */}
           <button 
                onClick={(e) => { e.stopPropagation(); setPresentationMode(true); }}
                className="w-8 h-8 rounded-full hover:bg-black hover:text-white flex items-center justify-center transition-colors text-gray-400 border border-gray-200"
                title="Presentation Mode"
           >
               <i className="fa-solid fa-expand text-xs"></i>
           </button>
        </div>
      </div>

      {/* Main Scoreboard */}
      <div className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
         {isResult && match.result && (
             <div className="bg-black text-white text-center py-3 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                 <i className="fa-solid fa-trophy text-penrice-gold"></i> {match.result}
             </div>
         )}
         <div className="flex flex-col border-b border-black">
             {/* Home */}
             <div className={`flex items-center justify-between py-6 pr-6 transition-all ${isPenriceBatting ? activeStyle : inactiveStyle}`}>
                <div className="flex items-center">
                    <span className="font-display font-bold text-xl uppercase tracking-tight">{match.teamName}</span>
                    {isPenriceBatting && <i className="fa-solid fa-play text-[10px] ml-2 text-penrice-gold"></i>}
                </div>
                <span className="font-display font-bold text-4xl tracking-tighter">{homeScoreText}</span>
             </div>
             <div className="h-px w-full bg-gray-100"></div>
             {/* Away */}
             <div className={`flex items-center justify-between py-6 pr-6 transition-all ${!isPenriceBatting ? activeStyle : inactiveStyle}`}>
                <div className="flex items-center">
                    <span className="font-display font-bold text-xl uppercase tracking-tight">{match.opponent}</span>
                    {!isPenriceBatting && <i className="fa-solid fa-play text-[10px] ml-2 text-penrice-gold"></i>}
                </div>
                <span className="font-display font-bold text-4xl tracking-tighter">{awayScoreText}</span>
             </div>
         </div>
      </div>

      {/* Live Batter/Bowler Strips - UPDATED */}
      {isLive && (
        <div className="grid grid-cols-2 bg-gray-50 border-b border-gray-200">
            {/* Batting Column */}
            <div className="p-4 border-r border-gray-200">
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Batters</div>
                
                {/* Striker */}
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-black truncate pr-2">{match.currentStriker || 'Striker'} *</span>
                    <span className="font-mono text-xs font-bold text-penrice-navy">
                        {strikerP?.runs || 0} <span className="text-gray-400 font-normal">({strikerP?.balls || 0})</span>
                    </span>
                </div>
                
                {/* Non-Striker */}
                <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500 truncate pr-2">{match.currentNonStriker || 'Non-Striker'}</span>
                    <span className="font-mono text-xs text-gray-500">
                         {nonStrikerP?.runs || 0} <span className="text-gray-300 font-normal">({nonStrikerP?.balls || 0})</span>
                    </span>
                </div>
            </div>
            
            {/* Bowling Column */}
            <div className="p-4 flex flex-col justify-center">
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Bowler</div>
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-black truncate pr-2">{match.currentBowler || 'Changing'}</span>
                    <span className="font-mono text-xs font-bold text-penrice-navy">{bowlerFigures}</span>
                </div>
            </div>
        </div>
      )}

      {/* Expanded Content */}
      <div className={`overflow-hidden transition-all duration-500 ease-in-out bg-white ${expanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
         {/* Tabs */}
         <div className="flex border-b border-gray-200 bg-gray-50">
             <div className="flex-1 p-2 flex items-center justify-center">
                 <span className="text-[10px] font-bold text-black uppercase tracking-widest">Match Centre</span>
             </div>
             <div className="flex">
                 <button 
                    onClick={(e) => { e.stopPropagation(); setActiveTab('home'); }}
                    className={`px-5 py-3 text-[10px] font-bold uppercase tracking-widest border-l border-gray-200 transition-colors ${activeTab === 'home' ? 'bg-white text-black' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                 >
                     {match.teamName.substring(0,3)}
                 </button>
                 <button 
                    onClick={(e) => { e.stopPropagation(); setActiveTab('away'); }}
                    className={`px-5 py-3 text-[10px] font-bold uppercase tracking-widest border-l border-gray-200 transition-colors ${activeTab === 'away' ? 'bg-white text-black' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                 >
                     {match.opponent.substring(0,3)}
                 </button>
             </div>
         </div>

         <div className="flex flex-col-reverse md:flex-row h-auto md:h-[400px]">
             {/* Feed (Left on Desktop) */}
             <div className="w-full md:w-7/12 p-6 custom-scroll overflow-y-auto border-t md:border-t-0 md:border-r border-gray-100 bg-white h-80 md:h-auto">
                {match.events?.length === 0 && <div className="text-center text-xs text-gray-300 font-bold uppercase tracking-widest mt-10">Match Starting Soon</div>}
                {[...(match.events || [])].reverse().map((e, idx) => {
                     const isWicket = e.type === 'WICKET' || e.type === 'HOWZAT!';
                     const isBoundary = e.type === '4' || e.type === '6';
                     return (
                        <div key={idx} className="relative pl-8 pb-8 last:pb-0">
                            <div className="absolute left-[5px] top-0 bottom-0 w-px bg-gray-200"></div>
                            <div className={`absolute left-[2px] top-2 w-2 h-2 border transform rotate-45 z-10 ${isWicket ? 'bg-red-600 border-red-600' : (isBoundary ? 'bg-black border-black' : 'bg-white border-gray-300')}`}></div>
                            <div className="flex items-start gap-4">
                                <div className="font-mono text-[10px] font-bold text-gray-400 w-8 pt-1">{e.time}</div>
                                <div className="flex-1">
                                    <div className="text-xs font-bold text-black uppercase flex flex-wrap items-center leading-tight">
                                        {isWicket && <span className="bg-red-600 text-white px-2 py-0.5 text-[9px] mr-2">HOWZAT!</span>}
                                        {isBoundary && <span className="border border-black px-1.5 py-px text-[9px] mr-2">{e.type}</span>}
                                        {e.player}
                                        {e.duckType === 'golden' && (
                                            <>
                                                <span className="ml-2 bg-penrice-gold text-black text-[9px] px-1.5 py-0.5 border border-black">
                                                    QUACK QUACK
                                                </span>
                                                <span className="text-sm animate-duck-slide inline-block origin-bottom-left ml-1">🦆</span>
                                            </>
                                        )}
                                        {e.duckType === 'regular' && (
                                            <>
                                                <span className="ml-2 bg-black text-white text-[9px] px-1.5 py-0.5 border border-black">
                                                    QUACK
                                                </span>
                                                <span className="text-sm animate-duck-slide inline-block origin-bottom-left ml-1">🦆</span>
                                            </>
                                        )}
                                    </div>
                                    {e.desc && <div className="text-xs text-gray-500 mt-1">{e.desc}</div>}
                                </div>
                            </div>
                        </div>
                     );
                })}
             </div>

             {/* Scorecard (Right on Desktop) */}
             <div className="w-full md:w-5/12 bg-gray-50 p-6 custom-scroll overflow-y-auto">
                 {activeTab === 'home' ? (
                     <ScorecardTable stats={match.homeTeamStats} striker={match.currentStriker} />
                 ) : (
                     <ScorecardTable stats={match.awayTeamStats} striker={match.currentStriker} />
                 )}
             </div>
         </div>
      </div>
      
      {/* Toggle */}
      <div 
        className="py-1 flex justify-center border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <i className={`fa-solid fa-chevron-down text-[10px] text-gray-300 transition-transform ${expanded ? 'rotate-180' : ''}`}></i>
      </div>
    </div>
    </>
  );
};
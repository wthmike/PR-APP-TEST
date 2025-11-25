import React, { useState, useEffect, useRef } from 'react';
import { Match, PlayerStats, GameEvent } from '../../types';
import { Badge } from '../Shared';

export const CricketCard = ({ match }: { match: Match }) => {
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

  // Presentation Mode Component
  const PresentationOverlay = () => {
      const battingStats = isPenriceBatting ? match.homeTeamStats : match.awayTeamStats;
      const teamName = isPenriceBatting ? match.teamName : match.opponent;
      const score = isPenriceBatting ? match.homeScore : match.awayScore;
      const wickets = isPenriceBatting ? match.homeWickets : match.awayWickets;
      
      const lastEvent = match.events?.[match.events.length - 1];

      return (
          <div className="fixed inset-0 z-[100] bg-gray-900 text-white flex flex-col font-sans overflow-hidden">
             {/* Celebration Overlay */}
             {celebration && (
                 <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                     <div className="text-center animate-pop-in">
                         <div className={`text-[15vw] font-display font-bold leading-none ${celebration.type === 'WICKET' || celebration.type === 'HOWZAT!' || celebration.text === 'DUCK!' ? 'text-red-600' : 'text-penrice-gold'} drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]`}>
                             {celebration.text}
                         </div>
                         {celebration.type === '4' && <div className="text-4xl font-bold text-white uppercase tracking-[1em] mt-4">Four Runs</div>}
                         {celebration.type === '6' && <div className="text-4xl font-bold text-white uppercase tracking-[1em] mt-4">Six Runs</div>}
                         {(celebration.type === 'WICKET' || celebration.type === 'HOWZAT!') && <div className="text-4xl font-bold text-white uppercase tracking-[1em] mt-4">Batter Dismissed</div>}
                     </div>
                 </div>
             )}

             {/* Header */}
             <div className="h-16 bg-black border-b border-gray-800 flex justify-between items-center px-8">
                 <div className="flex items-center gap-4">
                     <span className="text-penrice-gold font-display font-bold text-2xl uppercase tracking-wider">Penrice Match Centre</span>
                     <div className="h-6 w-px bg-gray-700"></div>
                     <span className="text-gray-400 font-bold uppercase tracking-widest text-sm">{match.yearGroup} • {match.league}</span>
                 </div>
                 <button onClick={() => setPresentationMode(false)} className="text-gray-400 hover:text-white uppercase font-bold text-xs tracking-widest border border-gray-700 px-4 py-2 hover:bg-gray-800 rounded-sm transition-colors">
                     Exit Fullscreen (ESC)
                 </button>
             </div>

             {/* Main Content */}
             <div className="flex-1 flex overflow-hidden">
                 {/* LEFT: Big Score & Current Play */}
                 <div className="w-2/3 p-12 flex flex-col justify-center border-r border-gray-800 relative bg-gradient-to-br from-gray-900 to-black">
                     <div className="absolute top-8 left-8 text-penrice-gold font-bold uppercase tracking-[0.2em] text-lg">Batting Now</div>
                     
                     <div className="mb-12">
                         <h1 className="font-display font-bold text-6xl uppercase mb-2 text-white tracking-tight">{teamName}</h1>
                         <div className="flex items-baseline gap-8">
                             <div className="font-display font-bold text-[12rem] leading-[0.85] text-white tracking-tighter">
                                 {score}<span className="text-gray-600">/</span>{wickets}
                             </div>
                             <div className="text-4xl font-bold text-gray-500 uppercase tracking-widest">
                                 Ov {match.currentOver?.toFixed(1)} <span className="text-2xl text-gray-700">/ {match.maxOvers}</span>
                             </div>
                         </div>
                     </div>

                     <div className="grid grid-cols-2 gap-12">
                         {/* Striker */}
                         <div className="bg-gray-800/50 p-6 border-l-4 border-penrice-gold backdrop-blur-sm">
                             <div className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Striker</div>
                             <div className="text-4xl font-display font-bold text-white mb-1 truncate">{match.currentStriker || '-'}</div>
                             <div className="text-3xl font-mono text-penrice-gold">
                                 {strikerP?.runs || 0} <span className="text-xl text-gray-500">({strikerP?.balls || 0})</span>
                             </div>
                         </div>
                         
                         {/* Non-Striker */}
                         <div className="bg-gray-800/30 p-6 border-l-4 border-gray-600">
                             <div className="text-gray-500 font-bold uppercase tracking-widest text-sm mb-2">Non-Striker</div>
                             <div className="text-4xl font-display font-bold text-gray-300 mb-1 truncate">{match.currentNonStriker || '-'}</div>
                             <div className="text-3xl font-mono text-gray-400">
                                 {nonStrikerP?.runs || 0} <span className="text-xl text-gray-600">({nonStrikerP?.balls || 0})</span>
                             </div>
                         </div>
                     </div>

                     {/* Current Bowler */}
                     <div className="mt-12 flex items-center gap-6 text-gray-400">
                         <div className="text-sm font-bold uppercase tracking-widest">Current Bowler</div>
                         <div className="h-px bg-gray-700 flex-1"></div>
                         <div className="text-2xl font-display font-bold text-white uppercase">{match.currentBowler || '-'}</div>
                         <div className="font-mono text-xl text-penrice-gold">{bowlerFigures}</div>
                     </div>
                 </div>

                 {/* RIGHT: Scorecard */}
                 <div className="w-1/3 bg-gray-900 flex flex-col border-l border-gray-800">
                     <div className="p-6 bg-black border-b border-gray-800">
                         <h3 className="text-white font-display font-bold text-xl uppercase tracking-wider">Scorecard</h3>
                     </div>
                     <div className="flex-1 overflow-y-auto p-6 space-y-4">
                         {battingStats?.map((p, i) => (
                             <div key={i} className={`flex justify-between items-center pb-3 border-b border-gray-800 ${p.status === 'batting' ? 'opacity-100' : 'opacity-60'}`}>
                                 <div>
                                     <div className={`font-bold text-lg ${p.status === 'batting' ? 'text-penrice-gold' : (p.status === 'out' ? 'text-red-500 line-through decoration-red-900/50' : 'text-white')}`}>
                                         {p.name} {p.status === 'batting' && '*'}
                                     </div>
                                     <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">{p.dismissal || (p.status === 'batting' ? 'Batting' : (p.status === 'not out' ? 'Not Out' : 'Yet to Bat'))}</div>
                                 </div>
                                 <div className={`font-mono text-xl ${p.status === 'waiting' ? 'text-gray-700' : 'text-white'}`}>
                                     {p.runs} <span className="text-sm text-gray-600">({p.balls})</span>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
             </div>

             {/* Footer: Commentary */}
             <div className="h-24 bg-penrice-navy border-t-4 border-penrice-gold flex items-center px-8 relative overflow-hidden">
                 <div className="absolute left-0 top-0 bottom-0 w-24 bg-penrice-gold flex items-center justify-center text-black font-bold text-2xl z-10">
                     <i className="fa-solid fa-microphone-lines"></i>
                 </div>
                 <div className="pl-24 w-full">
                     {lastEvent ? (
                         <div className="flex items-center gap-6 animate-fade-in-up">
                             <span className="font-mono text-penrice-gold font-bold text-2xl">{lastEvent.time}</span>
                             <div className="text-white text-2xl font-bold uppercase truncate">
                                 {lastEvent.desc}
                             </div>
                         </div>
                     ) : (
                         <span className="text-gray-400 font-bold uppercase tracking-widest text-lg ml-8">Awaiting start of play...</span>
                     )}
                 </div>
             </div>
          </div>
      );
  };

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
    {presentationMode && <PresentationOverlay />}
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
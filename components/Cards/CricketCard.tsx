import React, { useState } from 'react';
import { Match, PlayerStats } from '../../types';
import { Badge } from '../Shared';

export const CricketCard = ({ match }: { match: Match }) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'away'>('home');
  
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
    <div className={`w-full bg-white border border-gray-200 transition-all duration-300 relative z-10 ${expanded ? 'border-black card-shadow-hover z-50' : 'hover:border-black hover:card-shadow-hover'}`}>
      {/* Header */}
      <div className="grid grid-cols-2 cursor-pointer border-b border-gray-100" onClick={() => setExpanded(!expanded)}>
        <div className="p-3 border-r border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
                {isLive ? <Badge color="red">LIVE</Badge> : (isResult ? <Badge color="black">FT</Badge> : <Badge>UPCOMING</Badge>)}
                <Badge color="navy">CRICKET</Badge>
            </div>
            <div className="text-[10px] font-bold text-black uppercase tracking-wide">
              {match.league || 'Fixture'}
              {match.maxOvers ? <span className="text-gray-400"> • {match.maxOvers} Overs</span> : ''}
            </div>
        </div>
        <div className="p-3 flex flex-col justify-center items-end bg-gray-50/50">
           {isLive && <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Overs</div>}
           <div className="font-display font-bold text-xl text-black leading-none">{match.currentOver?.toFixed(1) || '0.0'}</div>
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
  );
};
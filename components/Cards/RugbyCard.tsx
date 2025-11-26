import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Match } from '../../types';
import { Badge, getContrastYIQ } from '../Shared';
import { Marquee } from '../Layout/Marquee';

const RugbyPresentationOverlay = ({ 
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
    const isLive = match.status === 'LIVE';
    
    const homeColor = match.homeTeamColor || '#000000';
    const awayColor = match.awayTeamColor || '#ffffff';

    return (
        <div className="fixed inset-0 z-[9999] bg-neutral-950 text-white flex flex-col font-sans overflow-hidden h-screen w-screen selection:bg-penrice-gold selection:text-black">
             {celebration && (
                <div className="absolute inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
                    <div className="text-center animate-pop-in relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-penrice-gold/10 rounded-full blur-[80px] animate-pulse"></div>
                        <div className="relative text-[15vw] font-display font-bold leading-none italic uppercase tracking-tighter text-penrice-gold drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)]">
                            {celebration.type}
                        </div>
                        <div className="text-4xl md:text-6xl font-display font-bold text-white uppercase tracking-[0.2em] mt-4 border-t border-white/20 pt-6">
                            {celebration.text}
                        </div>
                    </div>
                </div>
            )}

            {/* Top Bar */}
            <div className="h-16 flex justify-between items-center px-8 border-b border-white/10 bg-black/40 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-6">
                     <div className="font-display font-bold text-penrice-gold text-2xl uppercase tracking-tighter leading-none">Match<span className="text-white">Centre</span></div>
                     <div className="h-8 w-px bg-white/10"></div>
                     <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{match.yearGroup}</span>
                        <span className="text-xs font-bold text-white uppercase tracking-widest leading-none">{match.league}</span>
                     </div>
                </div>
                <div className="flex items-center gap-4">
                     {isLive && (
                         <div className="px-3 py-1 bg-red-600/20 border border-red-600/50 text-red-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 rounded-full">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div> Live
                         </div>
                     )}
                     <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 hover:bg-white/10 text-gray-400 transition-colors">
                        <i className="fa-solid fa-xmark"></i>
                     </button>
                </div>
            </div>

            {/* Main Score Area */}
            <div className="flex-1 flex overflow-hidden relative">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
                 <div className="flex-1 flex flex-col relative z-10">
                    <div className="flex justify-center py-8">
                        <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-full backdrop-blur-sm">
                            <span className="text-penrice-gold font-bold uppercase tracking-[0.3em] text-sm">
                                {isLive ? (match.period || '1st Half') : 'Full Time'}
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-px items-center relative">
                        <div className="absolute left-1/2 top-10 bottom-10 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
                        {/* Home Team */}
                        <div className="flex flex-col items-center justify-center p-8 text-center h-full transition-colors duration-500" style={{ backgroundColor: homeColor }}>
                            <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
                            <div className="relative z-10">
                                <h2 className={`font-display font-bold text-5xl md:text-7xl uppercase tracking-tight leading-none mb-4 ${getContrastYIQ(homeColor) === 'white' ? 'text-white' : 'text-black'}`}>{match.teamName}</h2>
                                <div className={`font-display font-bold text-[12rem] md:text-[16rem] leading-[0.85] tracking-tighter drop-shadow-2xl ${getContrastYIQ(homeColor) === 'white' ? 'text-white' : 'text-black'}`}>
                                    {match.homeScore}
                                </div>
                            </div>
                        </div>
                        {/* Away Team */}
                        <div className="flex flex-col items-center justify-center p-8 text-center h-full transition-colors duration-500" style={{ backgroundColor: awayColor }}>
                            <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
                            <div className="relative z-10">
                                <h2 className={`font-display font-bold text-5xl md:text-7xl uppercase tracking-tight leading-none mb-4 ${getContrastYIQ(awayColor) === 'white' ? 'text-white' : 'text-black'}`}>{match.opponent}</h2>
                                <div className={`font-display font-bold text-[12rem] md:text-[16rem] leading-[0.85] tracking-tighter drop-shadow-2xl ${getContrastYIQ(awayColor) === 'white' ? 'text-white' : 'text-black'}`}>
                                    {match.awayScore}
                                </div>
                            </div>
                        </div>
                    </div>

                     {/* Footer: Feed */}
                    <div className="h-24 bg-black/60 backdrop-blur-md border-t border-white/10 flex items-center px-8 shrink-0 mt-auto">
                        <div className="mr-8 flex items-center gap-3 border-r border-white/10 pr-8 h-full">
                             <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Feed</span>
                        </div>
                        <div className="flex-1 overflow-hidden">
                             {match.events && match.events.length > 0 ? (
                                <div className="flex items-center gap-4 animate-fade-in-up">
                                    <span className="font-mono text-penrice-gold font-bold text-lg">{match.events[match.events.length - 1].time}</span>
                                    <div className="font-display font-bold text-2xl px-3 py-0.5 rounded-sm bg-white text-black">
                                        {match.events[match.events.length - 1].type}
                                    </div>
                                    <span className="text-white text-lg font-bold uppercase truncate opacity-90">{match.events[match.events.length - 1].desc}</span>
                                </div>
                            ) : (
                                <span className="text-gray-500 font-bold uppercase tracking-widest text-sm">Kick Off</span>
                            )}
                        </div>
                    </div>
                 </div>
            </div>

            <div className="relative z-50">
                {allMatches && <Marquee matches={allMatches} />}
            </div>
        </div>
    );
}

export const RugbyCard: React.FC<{ match: Match, allMatches?: Match[] }> = ({ match, allMatches }) => {
  const [expanded, setExpanded] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [celebration, setCelebration] = useState<{type: string, text: string} | null>(null);
  
  const isLive = match.status === 'LIVE';
  const isResult = match.status === 'FT' || match.status === 'RESULT';
  
  // Get last event for the ticker
  const lastEvent = match.events && match.events.length > 0 ? match.events[match.events.length - 1] : null;

  // Colors with defaults (Penrice Black, Opponent White)
  const homeColor = match.homeTeamColor || '#000000';
  const awayColor = match.awayTeamColor || '#ffffff';
  
  const homeTextColor = getContrastYIQ(homeColor);
  const awayTextColor = getContrastYIQ(awayColor);

  useEffect(() => {
      if(match.events && match.events.length > 0) {
          // Logic for celebration triggers could go here
      }
  }, [match.events]);

  return (
    <>
    {presentationMode && createPortal(
        <RugbyPresentationOverlay match={match} allMatches={allMatches} celebration={celebration} onClose={() => setPresentationMode(false)} />, 
        document.body
    )}

    <div className={`w-full bg-white border border-gray-200 transition-all duration-300 relative z-10 ${expanded ? 'border-black card-shadow-hover z-50' : 'hover:border-black hover:card-shadow-hover'}`}>
      {/* Header */}
      <div className="grid grid-cols-2 cursor-pointer bg-white border-b border-gray-100" onClick={() => setExpanded(!expanded)}>
        <div className="p-3 border-r border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
                {isLive ? <Badge color="red">LIVE</Badge> : (isResult ? <Badge color="black">FT</Badge> : <Badge>SOON</Badge>)}
                <Badge color="navy">RUGBY</Badge>
                {match.yearGroup && <Badge color="gray">{match.yearGroup}</Badge>}
            </div>
            <div className="text-[10px] font-bold text-black uppercase tracking-wide">{match.league || 'Fixture'}</div>
        </div>
        <div className="p-3 flex items-center justify-end gap-4 bg-gray-50/50">
           <div className="flex flex-col items-end">
              {isLive && <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Period</div>}
              <div className="font-display font-bold text-xl text-black leading-none">{isLive ? (match.period || '1st Half') : (isResult ? 'FT' : '-')}</div>
           </div>
           <button 
                onClick={(e) => { e.stopPropagation(); setPresentationMode(true); }}
                className="hidden md:flex w-8 h-8 rounded-full hover:bg-black hover:text-white items-center justify-center transition-colors text-gray-400 border border-gray-200"
                title="Presentation Mode"
           >
               <i className="fa-solid fa-expand text-xs"></i>
           </button>
        </div>
      </div>

      {/* Dynamic Scoreboard - Split Design */}
      <div 
        className="cursor-pointer relative min-h-[180px] flex items-center overflow-hidden" 
        onClick={() => setExpanded(!expanded)}
        style={{ background: `linear-gradient(90deg, ${homeColor} 50%, ${awayColor} 50%)` }}
      >
         {/* Home Team (Left) */}
         <div className={`flex-1 flex flex-col items-center justify-center p-4 pr-12 relative z-10 ${homeTextColor === 'white' ? 'text-white' : 'text-black'}`}>
            <div className="font-display font-bold text-2xl md:text-3xl uppercase tracking-tighter leading-none mb-1 opacity-90 text-center">{match.teamName}</div>
            <div className="font-display font-bold text-8xl md:text-9xl tracking-tighter drop-shadow-xl">{match.homeScore}</div>
         </div>

         {/* Away Team (Right) */}
         <div className={`flex-1 flex flex-col items-center justify-center p-4 pl-12 relative z-10 ${awayTextColor === 'white' ? 'text-white' : 'text-black'}`}>
            <div className="font-display font-bold text-2xl md:text-3xl uppercase tracking-tighter leading-none mb-1 opacity-80 text-center">{match.opponent}</div>
            <div className="font-display font-bold text-8xl md:text-9xl tracking-tighter">{match.awayScore}</div>
         </div>

         {/* Central "VS" Diamond Badge */}
         <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
             <div className="w-12 h-12 bg-penrice-gold rotate-45 flex items-center justify-center border-4 border-white shadow-[0_4px_10px_rgba(0,0,0,0.3)]">
                 <div className="-rotate-45 font-display font-bold text-black text-sm">VS</div>
             </div>
         </div>
         
         {/* Overlay Pattern for texture */}
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>
      </div>

      {/* Last Action Strip (Ticker) - High Impact */}
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

      {/* Expandable Feed */}
      <div className={`overflow-hidden transition-all duration-500 ease-in-out bg-white border-t border-gray-100 ${expanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
         <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
             <span className="text-[10px] font-bold text-black uppercase tracking-widest">Match Timeline</span>
             <span className="text-[9px] font-bold text-gray-400 uppercase">Most Recent First</span>
         </div>
         <div className="p-6 h-64 overflow-y-auto custom-scroll relative">
            {match.events?.length === 0 && <div className="text-center text-gray-300 text-xs font-bold uppercase tracking-widest mt-10">Waiting for Kick Off...</div>}
            
            {[...(match.events || [])].reverse().map((e, idx) => {
                const isTry = e.type.includes('TRY');
                const isKick = e.type === 'CON' || e.type === 'PEN' || e.type === 'DG';
                
                return (
                    <div key={idx} className="relative pl-8 pb-8 last:pb-0">
                        <div className="absolute left-[5px] top-0 bottom-0 w-px bg-gray-200"></div>
                        <div className={`absolute left-[2px] top-2 w-2 h-2 border transform rotate-45 z-10 ${isTry ? 'bg-penrice-navy border-penrice-navy' : (isKick ? 'bg-penrice-gold border-penrice-gold' : 'bg-white border-gray-300')}`}></div>
                        <div className="flex items-start gap-4">
                            <div className="font-mono text-[10px] font-bold text-gray-400 w-8 pt-1">{e.time}</div>
                            <div className="flex-1">
                                <div className="text-xs font-bold text-black uppercase flex flex-wrap items-center">
                                    <span className={`mr-2 px-1.5 py-0.5 text-[9px] font-bold border rounded-sm ${isTry ? 'bg-penrice-navy text-white border-penrice-navy' : 'bg-white text-black border-black'}`}>{e.type}</span>
                                    {e.player}
                                </div>
                                {e.desc && <div className="text-xs text-gray-500 mt-1">{e.desc}</div>}
                            </div>
                        </div>
                    </div>
                );
            })}
         </div>
      </div>
      
       {/* Toggler Visual (Only show if not live/no events, otherwise ticker handles it) */}
      {(!isLive || !lastEvent) && (
        <div className="py-1 flex justify-center border-t border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => setExpanded(!expanded)}>
            <i className={`fa-solid fa-chevron-down text-[10px] text-gray-300 transition-transform ${expanded ? 'rotate-180' : ''}`}></i>
        </div>
      )}
    </div>
    </>
  );
};
import React, { useState } from 'react';
import { Match } from '../../types';
import { Badge } from '../Shared';

export const NetballCard = ({ match }: { match: Match }) => {
  const [expanded, setExpanded] = useState(false);
  const isLive = match.status === 'LIVE';
  const isResult = match.status === 'FT' || match.status === 'RESULT';

  return (
    <div className={`w-full bg-white border border-gray-200 transition-all duration-300 relative z-10 ${expanded ? 'border-black card-shadow-hover z-50' : 'hover:border-black hover:card-shadow-hover'}`}>
      {/* Header */}
      <div 
        className="grid grid-cols-2 cursor-pointer border-b border-gray-100"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="p-3 border-r border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
                {isLive ? <Badge color="red">LIVE</Badge> : (isResult ? <Badge color="black">FT</Badge> : <Badge>SOON</Badge>)}
                <Badge color="navy">NETBALL</Badge>
            </div>
            <div className="text-[10px] font-bold text-black uppercase tracking-wide">{match.league || 'Fixture'}</div>
        </div>
        <div className="p-3 flex flex-col justify-center items-end bg-gray-50/50">
           {isLive && <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Period</div>}
           <div className="font-display font-bold text-xl text-black leading-none">{isLive ? match.period : (isResult ? 'FT' : '-')}</div>
        </div>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
         <div className="border-r border-gray-100 p-6 flex flex-col items-center justify-center">
             <div className="font-display font-bold text-lg text-black uppercase mb-2 text-center leading-none">{match.teamName}</div>
             <div className="font-display font-bold text-6xl text-black tracking-tighter">{match.homeScore}</div>
         </div>
         <div className="p-6 flex flex-col items-center justify-center">
             <div className="font-display font-bold text-lg text-black uppercase mb-2 text-center leading-none">{match.opponent}</div>
             <div className="font-display font-bold text-6xl text-black tracking-tighter">{match.awayScore}</div>
         </div>
      </div>

      {/* Expandable Feed */}
      <div className={`overflow-hidden transition-all duration-500 ease-in-out bg-white border-t border-black ${expanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
         <div className="p-3 bg-gray-50 border-b border-gray-200">
             <span className="text-[10px] font-bold text-black uppercase tracking-widest">Match Timeline</span>
         </div>
         <div className="p-6 h-64 overflow-y-auto custom-scroll">
            {match.events?.length === 0 && <div className="text-center text-gray-300 text-xs font-bold uppercase tracking-widest mt-10">Waiting for first center pass...</div>}
            {[...(match.events || [])].reverse().map((e, idx) => {
                const isPeriod = e.type === 'PERIOD';
                return (
                    <div key={idx} className="relative pl-8 pb-8 last:pb-0">
                        <div className="absolute left-[5px] top-0 bottom-0 w-px bg-gray-200"></div>
                        <div className={`absolute left-[2px] top-2 w-2 h-2 border transform rotate-45 z-10 ${isPeriod ? 'bg-black border-black' : 'bg-white border-gray-300'}`}></div>
                        <div className="flex items-start gap-4">
                            <div className="font-mono text-[10px] font-bold text-gray-400 w-8 pt-1">{e.time}</div>
                            <div className="flex-1">
                                <div className="text-xs font-bold text-black uppercase flex flex-wrap items-center">
                                    {isPeriod ? <span className="bg-black text-white px-2 py-px text-[9px] mr-2">{e.desc}</span> : <span className="text-black mr-2 font-bold text-xs border border-black px-1">GOAL</span>}
                                    {e.player}
                                </div>
                                {!isPeriod && e.desc && <div className="text-xs text-gray-500 mt-1">{e.desc}</div>}
                            </div>
                        </div>
                    </div>
                );
            })}
         </div>
      </div>

      {/* Toggler Visual */}
      <div 
        className="py-1 flex justify-center border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <i className={`fa-solid fa-chevron-down text-[10px] text-gray-300 transition-transform ${expanded ? 'rotate-180' : ''}`}></i>
      </div>
    </div>
  );
};
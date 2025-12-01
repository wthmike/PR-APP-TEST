import React from 'react';
import { LiveDot } from '../Shared';
import { Match } from '../../types';

export const Marquee = ({ matches }: { matches: Match[] }) => {
  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
  
  const activeMatches = matches.filter(m => m.status === 'LIVE' || m.status === 'FT' || m.status === 'RESULT');
  
  const getMatchDisplay = (m: Match) => {
    const isLive = m.status === 'LIVE';
    
    const StatusBadge = ({ text, live }: { text: string, live: boolean }) => (
       <div className={`flex items-center px-2 py-0.5 mr-3 text-[10px] font-bold tracking-widest uppercase ${live ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-700 text-gray-300'}`}>
          {live && <span className="w-1.5 h-1.5 bg-white rounded-full mr-1.5"></span>}
          {text}
       </div>
    );

    const YearBadge = ({ year }: { year?: string }) => {
        if (!year) return null;
        return <span className="text-penrice-gold font-bold mr-2 text-[10px] border border-penrice-gold/30 px-1.5 py-0.5">{year}</span>
    };

    const SportLabel = ({ sport }: { sport: string }) => {
        let icon = '🏏';
        if (sport.toLowerCase() === 'netball') icon = '🏐';
        if (sport.toLowerCase() === 'rugby') icon = '🏉';
        if (sport.toLowerCase() === 'football') icon = '⚽';
        
        return (
            <span className="font-display font-bold text-white uppercase tracking-wider mr-3 text-sm flex items-center">
                <span className="mr-2 text-base">{icon}</span>
                {sport}
            </span>
        );
    };

    if (m.sport === 'netball' || m.sport === 'rugby' || m.sport === 'football') {
       const statusText = isLive ? (m.period || 'LIVE') : 'FT';
       return (
         <div className="flex items-center">
            <YearBadge year={m.yearGroup} />
            <SportLabel sport={m.sport.toUpperCase()} />
            <StatusBadge text={statusText} live={isLive} />
            <span className="font-display text-white text-lg font-bold tracking-wide">
                {m.teamName.toUpperCase()} <span className="text-penrice-gold mx-1">{m.homeScore} - {m.awayScore}</span> {m.opponent.toUpperCase()}
            </span>
         </div>
       );
    } else {
       const statusText = isLive ? `OV ${m.currentOver?.toFixed(1) || '0.0'} / ${m.maxOvers || 20}` : 'FT';
       const isPenriceBatting = m.penriceStatus === 'batting';
       return (
         <div className="flex items-center">
            <YearBadge year={m.yearGroup} />
            <SportLabel sport="CRICKET" />
            <StatusBadge text={statusText} live={isLive} />
            <span className={`font-display text-lg tracking-wide ${isLive && isPenriceBatting ? "text-white font-bold" : "text-gray-400"}`}>
                {m.teamName.toUpperCase()} {m.homeScore}/{m.homeWickets}
                {isLive && isPenriceBatting && <span className="text-penrice-gold ml-1 text-sm align-top">*</span>}
            </span>
            <span className="mx-2 text-gray-600 font-display text-lg">v</span>
            <span className={`font-display text-lg tracking-wide ${isLive && !isPenriceBatting ? "text-white font-bold" : "text-gray-400"}`}>
                {m.opponent.toUpperCase()} {m.awayScore}/{m.awayWickets}
                {isLive && !isPenriceBatting && <span className="text-penrice-gold ml-1 text-sm align-top">*</span>}
            </span>
         </div>
       );
    }
  };

  const itemSeparator = <div className="h-6 w-px bg-white/20 mx-8 skew-x-[-20deg]"></div>;

  const content = (
    <div className="flex items-center px-4">
      <div className="flex items-center mr-8">
        <span className="text-penrice-gold font-display font-bold text-xl tracking-tight mr-2">PENRICE</span>
        <span className="text-white text-[10px] font-bold tracking-[0.2em] border-l border-white/20 pl-2">MATCH CENTRE</span>
      </div>
      {activeMatches.map(m => (
          <div key={m.id} className="flex items-center">
             {itemSeparator}
             {getMatchDisplay(m)}
          </div>
      ))}
      {itemSeparator}
      <span className="font-display font-bold text-gray-500 text-lg">{dateStr}</span>
    </div>
  );

  return (
    <div className="bg-black border-b-2 border-penrice-gold py-2 overflow-hidden relative z-30 shadow-lg">
      <div className="whitespace-nowrap flex animate-marquee w-max items-center">
        {content}
        {content}
        {content}
        {content}
      </div>
    </div>
  );
};
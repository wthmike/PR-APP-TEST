import React, { useState } from 'react';
import { Match, PlayerStats } from '../../types';
import { getContrastYIQ } from '../Shared';

// Helper for Overs formatting
const formatOvers = (balls: number) => `${Math.floor(balls / 6)}.${balls % 6}`;

// Batting Row Component
const BattingRow: React.FC<{ p: PlayerStats }> = ({ p }) => {
    // Skip players who haven't batted (waiting) or subs, but show DNB (Did Not Bat) players if they are listed as 'not out' or 'out'
    if (p.status === 'waiting' || p.status === 'sub' || p.status === 'starting') return null;
    
    return (
        <div className="flex justify-between items-center text-[10px] py-1.5 border-b border-white/5 last:border-0 group hover:bg-white/5 px-2 -mx-2 transition-colors">
            <div className="flex-1 mr-2 min-w-0 flex items-center gap-2">
                 <span className={`truncate font-bold ${p.status === 'out' ? 'text-gray-500 line-through decoration-gray-600' : 'text-gray-200'}`}>{p.name}</span>
            </div>
            <div className="font-mono text-right tabular-nums">
                <span className={`font-bold ${p.runs >= 30 ? 'text-penrice-gold' : 'text-white'}`}>{p.runs}</span>
                <span className="text-[9px] text-gray-500 ml-1">({p.balls})</span>
            </div>
        </div>
    );
}

// Bowling Row Component
const BowlingRow: React.FC<{ p: PlayerStats }> = ({ p }) => {
    if (!p.bowlBalls || p.bowlBalls === 0) return null;

    return (
        <div className="flex justify-between items-center text-[10px] py-1.5 border-b border-white/5 last:border-0 group hover:bg-white/5 px-2 -mx-2 transition-colors">
            <div className="flex-1 mr-2 min-w-0">
                 <span className="truncate font-bold text-gray-300">{p.name}</span>
            </div>
            <div className="font-mono text-right flex gap-3 text-gray-400">
                <span>{formatOvers(p.bowlBalls)}<span className="text-[8px] opacity-50 ml-px">O</span></span>
                <span className={`${p.bowlWkts ? 'text-penrice-gold font-bold' : 'text-gray-400'}`}>
                    {p.bowlWkts || 0}-{p.bowlRuns || 0}<span className="text-[8px] opacity-50 ml-px">W-R</span>
                </span>
            </div>
        </div>
    );
}

export const ResultCard = ({ match, small = false, interactive = false }: { match: Match, small?: boolean, interactive?: boolean }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    const homeColor = match.homeTeamColor || '#000000';
    const awayColor = match.awayTeamColor || '#ffffff';
    const homeText = getContrastYIQ(homeColor) === 'white' ? 'text-white' : 'text-black';
    const awayText = getContrastYIQ(awayColor) === 'white' ? 'text-white' : 'text-black';

    const getIcon = () => {
        if (match.sport === 'cricket') return '🏏';
        if (match.sport === 'rugby') return '🏉';
        return '🏐';
    };

    const isWinnerHome = match.homeScore > match.awayScore;
    const isDraw = match.homeScore === match.awayScore;

    const showOverlay = interactive && isHovered && match.sport === 'cricket';

    return (
        <div 
            className={`group relative overflow-hidden bg-white border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 ${small ? 'h-40' : 'h-72'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            
            {/* Background Split with Texture */}
            <div className="absolute inset-0 flex">
                <div style={{ backgroundColor: homeColor }} className="w-1/2 h-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/10"></div>
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                </div>
                <div style={{ backgroundColor: awayColor }} className="w-1/2 h-full relative overflow-hidden">
                     <div className="absolute inset-0 bg-black/10"></div>
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                </div>
            </div>

            {/* Main Content Layer */}
            <div className={`relative z-10 flex h-full items-center justify-between px-2 md:px-8 transition-opacity duration-300 ${showOverlay ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'}`}>
                {/* Home */}
                <div className={`flex flex-col items-center justify-center w-1/2 text-center ${homeText} relative z-10`}>
                    <span className={`font-display font-bold uppercase tracking-tighter leading-none ${small ? 'text-lg' : 'text-3xl md:text-5xl'} mb-1 md:mb-2 opacity-90`}>{match.teamName}</span>
                    <span className={`font-display font-bold ${small ? 'text-4xl' : 'text-7xl md:text-9xl'} leading-[0.8] tracking-tighter drop-shadow-xl`}>
                        {match.homeScore}
                        {match.sport === 'cricket' && <span className="text-2xl md:text-4xl opacity-70 ml-1">/{match.homeWickets}</span>}
                    </span>
                    {isWinnerHome && !isDraw && !small && <span className="mt-4 bg-white text-black text-[10px] font-bold px-3 py-1 uppercase tracking-widest border border-black shadow-sm">Winner</span>}
                </div>

                {/* VS Badge - Modernized */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <div className={`${small ? 'w-8 h-8' : 'w-16 h-16'} bg-black rotate-45 flex items-center justify-center border-4 border-white shadow-xl group-hover:bg-penrice-gold transition-colors duration-300`}>
                         <div className="-rotate-45 font-display font-bold text-white group-hover:text-black text-sm md:text-lg">{getIcon()}</div>
                    </div>
                </div>

                {/* Away */}
                <div className={`flex flex-col items-center justify-center w-1/2 text-center ${awayText} relative z-10`}>
                    <span className={`font-display font-bold uppercase tracking-tighter leading-none ${small ? 'text-lg' : 'text-3xl md:text-5xl'} mb-1 md:mb-2 opacity-90`}>{match.opponent}</span>
                    <span className={`font-display font-bold ${small ? 'text-4xl' : 'text-7xl md:text-9xl'} leading-[0.8] tracking-tighter drop-shadow-xl`}>
                        {match.awayScore}
                        {match.sport === 'cricket' && <span className="text-2xl md:text-4xl opacity-70 ml-1">/{match.awayWickets}</span>}
                    </span>
                    {!isWinnerHome && !isDraw && !small && <span className="mt-4 bg-white text-black text-[10px] font-bold px-3 py-1 uppercase tracking-widest border border-black shadow-sm">Winner</span>}
                </div>
            </div>

            {/* Hover Overlay for Cricket - Editorial Style */}
            {showOverlay && (
                <div className="absolute inset-0 z-30 bg-neutral-900/95 backdrop-blur-md flex text-white animate-fade-in">
                    
                    {/* Column 1: Home Stats */}
                    <div className="flex-1 flex flex-col border-r border-white/10 overflow-hidden relative group/col">
                         {/* Header */}
                         <div className="p-4 border-b border-white/10 bg-white/5">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="font-display font-bold text-penrice-gold text-lg uppercase truncate pr-2">{match.teamName}</span>
                                <span className="font-display font-bold text-xl">{match.homeScore}/{match.homeWickets}</span>
                            </div>
                         </div>
                         
                         {/* Scrollable Content */}
                         <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-4">
                            {/* Batting */}
                            <div>
                                <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">Batting</h4>
                                {match.homeTeamStats?.map((p, i) => <BattingRow key={`bat-${i}`} p={p} />)}
                            </div>
                            
                            {/* Bowling */}
                            {match.homeTeamStats?.some(p => (p.bowlBalls || 0) > 0) && (
                                <div>
                                    <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 border-b border-white/5 pb-1 pt-2">Bowling</h4>
                                    {match.homeTeamStats?.map((p, i) => <BowlingRow key={`bowl-${i}`} p={p} />)}
                                </div>
                            )}
                         </div>
                    </div>

                    {/* Column 2: Away Stats */}
                    <div className="flex-1 flex flex-col overflow-hidden relative group/col">
                         {/* Header */}
                         <div className="p-4 border-b border-white/10 bg-white/5">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="font-display font-bold text-penrice-gold text-lg uppercase truncate pr-2">{match.opponent}</span>
                                <span className="font-display font-bold text-xl">{match.awayScore}/{match.awayWickets}</span>
                            </div>
                         </div>
                         
                         {/* Scrollable Content */}
                         <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-4">
                            {/* Batting */}
                            <div>
                                <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">Batting</h4>
                                {match.awayTeamStats?.map((p, i) => <BattingRow key={`bat-${i}`} p={p} />)}
                            </div>
                            
                            {/* Bowling */}
                            {match.awayTeamStats?.some(p => (p.bowlBalls || 0) > 0) && (
                                <div>
                                    <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 border-b border-white/5 pb-1 pt-2">Bowling</h4>
                                    {match.awayTeamStats?.map((p, i) => <BowlingRow key={`bowl-${i}`} p={p} />)}
                                </div>
                            )}
                         </div>
                    </div>
                </div>
            )}

            {/* Result Strip */}
            {match.result && !showOverlay && (
                <div className="absolute bottom-0 left-0 right-0 bg-black text-white text-center py-1.5 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-penrice-gold">{match.result}</span>
                </div>
            )}
        </div>
    );
};

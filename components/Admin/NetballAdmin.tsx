import React, { useState } from 'react';
import { Match } from '../../types';
import { MatchesService } from '../../services/firebase';
import { Modal } from '../Shared';

export const NetballAdmin = ({ match }: { match: Match }) => {
  const [error, setError] = useState<string | null>(null);

  // Game Flow Definition
  const PERIODS = [
    { label: 'Q1', type: 'PLAY', nextBtn: 'End Q1' },
    { label: 'Q1 End', type: 'BREAK', nextBtn: 'Start Q2' },
    { label: 'Q2', type: 'PLAY', nextBtn: 'Half Time' },
    { label: 'HT', type: 'BREAK', nextBtn: 'Start Q3' },
    { label: 'Q3', type: 'PLAY', nextBtn: 'End Q3' },
    { label: 'Q3 End', type: 'BREAK', nextBtn: 'Start Q4' },
    { label: 'Q4', type: 'PLAY', nextBtn: 'End Game' },
    { label: 'FT', type: 'END', nextBtn: 'Game Over' }
  ];

  const currentIdx = match.periodIdx ?? -1; // -1 represents Warmup/Pre-match
  const isWarmup = currentIdx === -1;
  const isFinished = currentIdx >= PERIODS.length - 1;
  
  const currentPeriodObj = !isWarmup ? PERIODS[currentIdx] : null;
  const isPlaying = currentPeriodObj?.type === 'PLAY';
  const isBreak = currentPeriodObj?.type === 'BREAK' || isWarmup;

  // Determine Main Action Button Text
  let mainButtonText = "Start Match (Q1)";
  if (!isWarmup) {
      mainButtonText = currentPeriodObj?.nextBtn || 'Finish';
  }

  const updateScore = async (team: 'home' | 'away', delta: number) => {
    if (!isPlaying) {
        setError(`Please start ${!isWarmup ? PERIODS[currentIdx + 1]?.label : 'the game'} before adding scores.`);
        return;
    }

    const field = team === 'home' ? 'homeScore' : 'awayScore';
    const current = match[field] || 0;
    const newScore = Math.max(0, current + delta);
    
    let newEvents = [...(match.events || [])];
    if (delta > 0) {
        newEvents.push({ 
            type: 'GOAL', 
            player: team === 'home' ? match.teamName : match.opponent, 
            time: match.period || 'Play', 
            desc: `Goal for ${team === 'home' ? match.teamName : match.opponent}!` 
        });
    }
    await MatchesService.update(match.id, { [field]: newScore, events: newEvents });
  };

  const advancePeriod = async () => {
    if (isFinished) return;

    const nextIdx = currentIdx + 1;
    const nextPeriod = PERIODS[nextIdx];
    
    let updates: any = { period: nextPeriod.label, periodIdx: nextIdx };
    
    if (nextPeriod.label === 'Q1') updates.status = 'LIVE';
    if (nextPeriod.type === 'END') {
        updates.status = 'FT';
        updates.result = match.homeScore > match.awayScore ? `${match.teamName} Win` : (match.homeScore < match.awayScore ? `${match.opponent} Win` : 'Draw');
    }
    
    // Add event log for period change
    updates.events = [...(match.events||[]), { 
        type: 'PERIOD', 
        time: '', 
        desc: nextPeriod.label, 
        player: '' 
    }];
    
    await MatchesService.update(match.id, updates);
  };

  return (
    <div>
        {error && (
            <Modal title="Action Paused" onClose={() => setError(null)}>
                <p className="text-sm text-gray-600 font-bold mb-4">{error}</p>
                <button onClick={() => setError(null)} className="w-full py-3 bg-black text-white text-xs font-bold uppercase tracking-widest">OK</button>
            </Modal>
        )}
        
        {/* Score Board Controls */}
        <div className={`grid grid-cols-2 gap-px bg-gray-200 border border-gray-200 mb-4 relative transition-opacity duration-300 ${isBreak ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            
            {/* Break Overlay */}
            {isBreak && (
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <div className="bg-black/90 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest shadow-lg">
                        {isWarmup ? 'Warmup - Ready to Start' : 'Period Break - Scoring Paused'}
                    </div>
                </div>
            )}

            <div className="bg-white p-4 flex flex-col items-center gap-2">
                <div className="text-[10px] font-bold text-penrice-navy uppercase truncate w-full text-center">{match.teamName}</div>
                <div className="font-display font-bold text-5xl">{match.homeScore}</div>
                <div className="flex gap-2 w-full">
                    <button onClick={() => updateScore('home', -1)} className="flex-1 py-3 bg-gray-50 border border-gray-200 text-sm font-bold hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">-</button>
                    <button onClick={() => updateScore('home', 1)} className="flex-[2] py-3 bg-penrice-navy text-white text-xs font-bold uppercase hover:bg-black transition-colors">+ Goal</button>
                </div>
            </div>
            <div className="bg-white p-4 flex flex-col items-center gap-2">
                <div className="text-[10px] font-bold text-gray-500 uppercase truncate w-full text-center">{match.opponent}</div>
                <div className="font-display font-bold text-5xl">{match.awayScore}</div>
                <div className="flex gap-2 w-full">
                    <button onClick={() => updateScore('away', -1)} className="flex-1 py-3 bg-gray-50 border border-gray-200 text-sm font-bold hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">-</button>
                    <button onClick={() => updateScore('away', 1)} className="flex-[2] py-3 bg-gray-700 text-white text-xs font-bold uppercase hover:bg-black transition-colors">+ Goal</button>
                </div>
            </div>
        </div>

        {/* Main Control Button */}
        {!isFinished && (
            <button 
                onClick={advancePeriod} 
                className={`w-full py-4 font-display font-bold uppercase tracking-widest text-xs border-2 transition-all flex items-center justify-center gap-3
                    ${isBreak 
                        ? 'bg-penrice-gold text-black border-penrice-gold hover:bg-black hover:text-white hover:border-black animate-pulse' 
                        : 'bg-black text-white border-black hover:bg-gray-800'
                    }`}
            >
                {mainButtonText} 
                {isBreak ? <i className="fa-solid fa-play"></i> : <i className="fa-solid fa-pause"></i>}
            </button>
        )}
        
        {isFinished && (
            <div className="w-full py-4 bg-gray-100 text-gray-400 font-bold uppercase tracking-widest text-xs text-center border border-gray-200 cursor-not-allowed">
                Match Finished
            </div>
        )}
    </div>
  );
};
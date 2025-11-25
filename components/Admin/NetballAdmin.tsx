import React, { useState } from 'react';
import { Match } from '../../types';
import { MatchesService } from '../../services/firebase';
import { Modal } from '../Shared';

export const NetballAdmin = ({ match }: { match: Match }) => {
  const [error, setError] = useState<string | null>(null);
  const pLabels = ['Start Q1', 'End Q1', 'Start Q2', 'End Q2', 'Start Q3', 'End Q3', 'Start Q4', 'End Game'];
  const currentPIdx = match.periodIdx || 0;
  const nextPText = pLabels[currentPIdx] || 'Game Over';

  const updateScore = async (team: 'home' | 'away', delta: number) => {
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
    const periods = ['Q1', 'Q1 End', 'Q2', 'HT', 'Q3', 'Q3 End', 'Q4', 'FT'];
    const nextIdx = (match.periodIdx !== undefined ? match.periodIdx : -1) + 1;
    if (nextIdx >= periods.length) {
        setError("Match is already at Full Time.");
        return;
    }

    const nextPeriod = periods[nextIdx];
    let updates: any = { period: nextPeriod, periodIdx: nextIdx };
    
    if (nextPeriod === 'Q1') updates.status = 'LIVE';
    if (nextPeriod === 'FT') {
        updates.status = 'FT';
        updates.result = match.homeScore > match.awayScore ? `${match.teamName} Win` : (match.homeScore < match.awayScore ? `${match.opponent} Win` : 'Draw');
    }
    
    updates.events = [...(match.events||[]), { type: 'PERIOD', time: '', desc: nextPeriod, player: '' }];
    await MatchesService.update(match.id, updates);
  };

  return (
    <div>
        {error && (
            <Modal title="Action Ignored" onClose={() => setError(null)}>
                <p className="text-sm text-gray-600 font-bold mb-4">{error}</p>
                <button onClick={() => setError(null)} className="w-full py-3 bg-black text-white text-xs font-bold uppercase tracking-widest">OK</button>
            </Modal>
        )}
        <div className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200 mb-4">
            <div className="bg-white p-4 flex flex-col items-center gap-2">
                <div className="text-[10px] font-bold text-penrice-navy uppercase">{match.teamName}</div>
                <div className="font-display font-bold text-5xl">{match.homeScore}</div>
                <div className="flex gap-2 w-full">
                    <button onClick={() => updateScore('home', -1)} className="flex-1 py-2 bg-gray-50 border border-gray-200 text-xs font-bold hover:bg-red-50">-1</button>
                    <button onClick={() => updateScore('home', 1)} className="flex-[2] py-2 bg-penrice-navy text-white text-xs font-bold uppercase hover:bg-black">+1 Goal</button>
                </div>
            </div>
            <div className="bg-white p-4 flex flex-col items-center gap-2">
                <div className="text-[10px] font-bold text-gray-500 uppercase">{match.opponent}</div>
                <div className="font-display font-bold text-5xl">{match.awayScore}</div>
                <div className="flex gap-2 w-full">
                    <button onClick={() => updateScore('away', -1)} className="flex-1 py-2 bg-gray-50 border border-gray-200 text-xs font-bold hover:bg-red-50">-1</button>
                    <button onClick={() => updateScore('away', 1)} className="flex-[2] py-2 bg-gray-700 text-white text-xs font-bold uppercase hover:bg-black">+1 Goal</button>
                </div>
            </div>
        </div>
        <button onClick={advancePeriod} className="w-full py-4 bg-penrice-gold text-black font-display font-bold uppercase tracking-widest text-xs border-2 border-penrice-gold hover:border-black transition-all">
            {nextPText} <i className="fa-solid fa-arrow-right ml-2"></i>
        </button>
    </div>
  );
};
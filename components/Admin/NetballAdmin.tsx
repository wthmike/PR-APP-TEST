import React, { useState } from 'react';
import { Match } from '../../types';
import { MatchesService } from '../../services/firebase';
import { NetballLogic } from '../../services/netballLogic';
import { Modal } from '../Shared';

export const NetballAdmin = ({ match }: { match: Match }) => {
  const [error, setError] = useState<string | null>(null);

  // Initialization State (Netball usually 7 starters)
  const [initMode, setInitMode] = useState(!match.homeTeamStats || match.homeTeamStats.length === 0);
  const [homePlayers, setHomePlayers] = useState<string[]>(Array(7).fill(''));
  const [awayPlayers, setAwayPlayers] = useState<string[]>(Array(7).fill(''));

  // Initialization Handlers
  const updatePlayerName = (isHome: boolean, index: number, value: string) => {
      const target = isHome ? [...homePlayers] : [...awayPlayers];
      target[index] = value;
      isHome ? setHomePlayers(target) : setAwayPlayers(target);
  };

  const autoFillPlayers = (isHome: boolean) => {
      const count = isHome ? homePlayers.length : awayPlayers.length;
      const newNames = Array.from({length: count}, (_, i) => `Player ${i + 1}`);
      if (isHome) setHomePlayers(newNames);
      else setAwayPlayers(newNames);
  };

  const addSubSlot = (isHome: boolean) => {
      if (isHome) setHomePlayers([...homePlayers, '']);
      else setAwayPlayers([...awayPlayers, '']);
  };

  const handleSetup = async () => {
      try {
        await NetballLogic.setupTeams(match, homePlayers, awayPlayers);
        setInitMode(false);
      } catch (err: any) {
        setError("Setup Failed: " + err.message);
      }
  };

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

  if (initMode) {
      return (
          <div className="bg-gray-50 p-4 border border-gray-200 rounded-sm">
             {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
             )}
             <h5 className="text-xs font-bold text-black mb-4 uppercase tracking-widest border-b border-gray-200 pb-2">Netball Squad Setup</h5>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                 <div>
                    <div className="flex justify-between items-center mb-2">
                        <h6 className="text-[10px] font-bold text-penrice-navy uppercase">{match.teamName} Lineup</h6>
                        <button onClick={() => autoFillPlayers(true)} className="text-[9px] font-bold text-gray-500 underline hover:text-black">Auto-Fill</button>
                    </div>
                    <div className="space-y-1 mb-3">
                        {homePlayers.map((p, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <span className={`text-[9px] font-mono w-4 ${i >= 7 ? 'text-penrice-gold font-bold' : 'text-gray-400'}`}>{i+1}.</span>
                                <input 
                                    className="w-full p-1 text-xs border border-gray-300 focus:border-black outline-none" 
                                    placeholder={i >= 7 ? "Substitute" : "Player Name"} 
                                    value={p} 
                                    onChange={e => updatePlayerName(true, i, e.target.value)} 
                                />
                            </div>
                        ))}
                    </div>
                    <button onClick={() => addSubSlot(true)} className="w-full py-2 bg-white border border-dashed border-gray-300 text-[10px] font-bold uppercase hover:border-black hover:bg-gray-50">
                        <i className="fa-solid fa-plus mr-1"></i> Add Substitute
                    </button>
                 </div>
                 <div>
                    <div className="flex justify-between items-center mb-2">
                        <h6 className="text-[10px] font-bold text-black uppercase">{match.opponent} Lineup</h6>
                        <button onClick={() => autoFillPlayers(false)} className="text-[9px] font-bold text-gray-500 underline hover:text-black">Auto-Fill</button>
                    </div>
                     <div className="space-y-1 mb-3">
                        {awayPlayers.map((p, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <span className={`text-[9px] font-mono w-4 ${i >= 7 ? 'text-penrice-gold font-bold' : 'text-gray-400'}`}>{i+1}.</span>
                                <input 
                                    className="w-full p-1 text-xs border border-gray-300 focus:border-black outline-none" 
                                    placeholder={i >= 7 ? "Substitute" : "Player Name"} 
                                    value={p} 
                                    onChange={e => updatePlayerName(false, i, e.target.value)} 
                                />
                            </div>
                        ))}
                    </div>
                    <button onClick={() => addSubSlot(false)} className="w-full py-2 bg-white border border-dashed border-gray-300 text-[10px] font-bold uppercase hover:border-black hover:bg-gray-50">
                        <i className="fa-solid fa-plus mr-1"></i> Add Substitute
                    </button>
                 </div>
             </div>
             <button onClick={handleSetup} className="w-full bg-black text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-penrice-gold hover:text-black">Confirm Squad</button>
          </div>
      );
  }

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
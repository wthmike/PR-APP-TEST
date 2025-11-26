import React, { useState } from 'react';
import { Match } from '../../types';
import { RugbyLogic } from '../../services/rugbyLogic';
import { Modal } from '../Shared';

export const RugbyAdmin = ({ match }: { match: Match }) => {
  // Use status to determine if we are in init mode. 
  // If match is already LIVE/FT/RESULT, we skip init even if stats are empty.
  const isMatchActive = match.status === 'LIVE' || match.status === 'FT' || match.status === 'RESULT';
  const [initMode, setInitMode] = useState(!isMatchActive);
  
  // Initialization State
  const [homePlayers, setHomePlayers] = useState<string[]>(Array(15).fill(''));
  const [awayPlayers, setAwayPlayers] = useState<string[]>(Array(15).fill(''));
  
  // Scoring Modal State
  const [scoringModal, setScoringModal] = useState<{type: 'TRY'|'CON'|'PEN'|'DG', points: number, isHome: boolean} | null>(null);
  const [scoreTime, setScoreTime] = useState('');
  const [scorePlayer, setScorePlayer] = useState('');
  const [isConversionIncluded, setIsConversionIncluded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePlayerName = (isHome: boolean, index: number, value: string) => {
      const target = isHome ? [...homePlayers] : [...awayPlayers];
      target[index] = value;
      isHome ? setHomePlayers(target) : setAwayPlayers(target);
  };

  const autoFillPlayers = (isHome: boolean) => {
      // Auto-fill currently displayed slots
      const count = isHome ? homePlayers.length : awayPlayers.length;
      const newNames = Array.from({length: count}, (_, i) => `Player ${i + 1}`);
      if (isHome) setHomePlayers(newNames);
      else setAwayPlayers(newNames);
  };

  const addSubSlot = (isHome: boolean) => {
      if (isHome) {
          setHomePlayers([...homePlayers, '']);
      } else {
          setAwayPlayers([...awayPlayers, '']);
      }
  };

  const handleSetup = async () => {
      try {
        await RugbyLogic.setupTeams(match, homePlayers, awayPlayers);
        setInitMode(false);
      } catch (err: any) {
        setError("Setup Failed: " + err.message);
      }
  };

  // Triggered when a scoring button is clicked
  const initiateScore = (type: 'TRY' | 'CON' | 'PEN' | 'DG', points: number, isHome: boolean) => {
      setScoringModal({ type, points, isHome });
      setScoreTime('');
      setScorePlayer('');
      setIsConversionIncluded(false);
  };

  const confirmScore = () => {
      if (!scoringModal) return;

      let formattedTime = scoreTime.trim();
      // Auto-append minute marker if it's just a number
      if (formattedTime && !isNaN(Number(formattedTime))) {
          formattedTime += "'";
      }

      try {
          // Logic for Try + Conversion
          if (scoringModal.type === 'TRY' && isConversionIncluded) {
              // Add 7 points total (5 + 2)
              RugbyLogic.score(match, scoringModal.isHome, 'TRY (CON)', 7, scorePlayer, formattedTime);
          } else {
              // Standard Score
              RugbyLogic.score(match, scoringModal.isHome, scoringModal.type, scoringModal.points, scorePlayer, formattedTime);
          }
          setScoringModal(null);
      } catch (err: any) {
          setError("Scoring Failed: " + err.message);
      }
  };

  if (initMode) {
      return (
          <div className="bg-gray-50 p-4 border border-gray-200 rounded-sm">
             {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
             )}
             <h5 className="text-xs font-bold text-black mb-4 uppercase tracking-widest border-b border-gray-200 pb-2">Rugby XV Squad Setup</h5>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                 <div>
                    <div className="flex justify-between items-center mb-2">
                        <h6 className="text-[10px] font-bold text-penrice-navy uppercase">{match.teamName} Lineup</h6>
                        <button onClick={() => autoFillPlayers(true)} className="text-[9px] font-bold text-gray-500 underline hover:text-black">Auto-Fill</button>
                    </div>
                    <div className="space-y-1 mb-3">
                        {homePlayers.map((p, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <span className={`text-[9px] font-mono w-4 ${i >= 15 ? 'text-penrice-gold font-bold' : 'text-gray-400'}`}>{i+1}.</span>
                                <input 
                                    className="w-full p-1 text-xs border border-gray-300 focus:border-black outline-none" 
                                    placeholder={i >= 15 ? "Substitute" : "Player Name"} 
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
                                <span className={`text-[9px] font-mono w-4 ${i >= 15 ? 'text-penrice-gold font-bold' : 'text-gray-400'}`}>{i+1}.</span>
                                <input 
                                    className="w-full p-1 text-xs border border-gray-300 focus:border-black outline-none" 
                                    placeholder={i >= 15 ? "Substitute" : "Player Name"} 
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
             <button onClick={handleSetup} className="w-full bg-black text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-penrice-gold hover:text-black">Start Match</button>
          </div>
      );
  }

  // Active Scoring UI
  const periods = ['1st Half', 'Half Time', '2nd Half', 'FT'];
  
  return (
    <div className="bg-white">
        {error && (
            <Modal title="Error" onClose={() => setError(null)} type="danger">
                 <p className="text-sm font-bold text-gray-600 mb-6">{error}</p>
                 <button onClick={() => setError(null)} className="w-full py-3 bg-red-600 text-white text-xs font-bold uppercase tracking-widest">OK</button>
            </Modal>
        )}

        {/* Scoring Details Modal */}
        {scoringModal && (
            <Modal title={`Scoring: ${scoringModal.type}`} onClose={() => setScoringModal(null)}>
                <div className="space-y-4">
                    {/* Time Input */}
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Time (Minutes)</label>
                        <input 
                            className="w-full border border-gray-300 p-3 font-bold text-lg outline-none focus:border-black"
                            placeholder="e.g. 15"
                            value={scoreTime}
                            onChange={(e) => setScoreTime(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {/* Scorer Selection (Penrice only usually, but available for both) */}
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Scorer</label>
                        <select 
                            className="w-full border border-gray-300 p-3 font-bold text-sm bg-white outline-none focus:border-black"
                            value={scorePlayer}
                            onChange={(e) => setScorePlayer(e.target.value)}
                        >
                            <option value="">-- Unspecified / Opponent --</option>
                            {(scoringModal.isHome ? match.homeTeamStats : match.awayTeamStats)?.map(p => (
                                <option key={p.name} value={p.name}>{p.name} {p.status === 'sub' ? '(Sub)' : ''}</option>
                            ))}
                        </select>
                    </div>

                    {/* Conversion Toggle for Try */}
                    {scoringModal.type === 'TRY' && (
                        <div className="bg-gray-50 p-3 border border-gray-200">
                             <label className="flex items-center gap-3 cursor-pointer">
                                 <input 
                                    type="checkbox" 
                                    className="w-5 h-5 accent-black"
                                    checked={isConversionIncluded}
                                    onChange={(e) => setIsConversionIncluded(e.target.checked)}
                                 />
                                 <span className="text-sm font-bold text-black">Conversion Scored? (+2 pts)</span>
                             </label>
                        </div>
                    )}

                    <button 
                        onClick={confirmScore}
                        className="w-full bg-black text-white py-4 font-bold uppercase tracking-widest text-xs hover:bg-penrice-gold hover:text-black transition-colors"
                    >
                        Confirm {scoringModal.type === 'TRY' && isConversionIncluded ? 'Try & Conversion (7)' : `${scoringModal.type} (${scoringModal.points})`}
                    </button>
                </div>
            </Modal>
        )}

        {/* Score Correction */}
        <div className="bg-gray-50 border border-gray-200 p-4 mb-6 flex justify-between items-center">
            <div className="text-center w-1/3">
                 <div className="text-[10px] font-bold text-penrice-navy uppercase mb-1">{match.teamName}</div>
                 <input 
                    type="number" 
                    className="w-20 text-center text-3xl font-display font-bold bg-transparent border-b border-gray-300 focus:border-black outline-none" 
                    value={match.homeScore} 
                    onChange={e => RugbyLogic.manualCorrection(match, parseInt(e.target.value) || 0, match.awayScore)} 
                 />
            </div>
            <div className="w-1/3 px-2">
                 <select 
                    className="w-full p-2 text-xs font-bold text-center border border-gray-300 bg-white"
                    value={match.period}
                    onChange={e => RugbyLogic.updatePeriod(match, e.target.value)}
                 >
                    {periods.map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
            </div>
             <div className="text-center w-1/3">
                 <div className="text-[10px] font-bold text-black uppercase mb-1">{match.opponent}</div>
                 <input 
                    type="number" 
                    className="w-20 text-center text-3xl font-display font-bold bg-transparent border-b border-gray-300 focus:border-black outline-none" 
                    value={match.awayScore} 
                    onChange={e => RugbyLogic.manualCorrection(match, match.homeScore, parseInt(e.target.value) || 0)} 
                 />
            </div>
        </div>

        {/* Scoring Buttons */}
        <div className="grid grid-cols-2 gap-8">
            {/* Home Actions */}
            <div className="bg-penrice-navy/5 p-4 border border-penrice-navy/10 relative">
                 <div className="absolute -top-3 left-4 bg-penrice-navy text-white text-[9px] font-bold px-2 py-1 uppercase tracking-wider">{match.teamName}</div>
                 <div className="grid grid-cols-2 gap-2 mt-2">
                     <button onClick={() => initiateScore('TRY', 5, true)} className="bg-penrice-navy text-white py-4 font-display font-bold text-lg hover:bg-black uppercase">Try (5)</button>
                     <button onClick={() => initiateScore('CON', 2, true)} className="bg-white border border-penrice-navy text-penrice-navy py-4 font-display font-bold text-lg hover:bg-gray-50 uppercase">Con (2)</button>
                     <button onClick={() => initiateScore('PEN', 3, true)} className="bg-white border border-penrice-navy text-penrice-navy py-4 font-display font-bold text-lg hover:bg-gray-50 uppercase">Pen (3)</button>
                     <button onClick={() => initiateScore('DG', 3, true)} className="bg-white border border-penrice-navy text-penrice-navy py-4 font-display font-bold text-lg hover:bg-gray-50 uppercase">DG (3)</button>
                 </div>
            </div>

            {/* Away Actions */}
             <div className="bg-gray-50 p-4 border border-gray-200 relative">
                 <div className="absolute -top-3 left-4 bg-black text-white text-[9px] font-bold px-2 py-1 uppercase tracking-wider">{match.opponent}</div>
                 <div className="grid grid-cols-2 gap-2 mt-2">
                     <button onClick={() => initiateScore('TRY', 5, false)} className="bg-black text-white py-4 font-display font-bold text-lg hover:bg-gray-800 uppercase">Try (5)</button>
                     <button onClick={() => initiateScore('CON', 2, false)} className="bg-white border border-black text-black py-4 font-display font-bold text-lg hover:bg-gray-50 uppercase">Con (2)</button>
                     <button onClick={() => initiateScore('PEN', 3, false)} className="bg-white border border-black text-black py-4 font-display font-bold text-lg hover:bg-gray-50 uppercase">Pen (3)</button>
                     <button onClick={() => initiateScore('DG', 3, false)} className="bg-white border border-black text-black py-4 font-display font-bold text-lg hover:bg-gray-50 uppercase">DG (3)</button>
                 </div>
            </div>
        </div>
    </div>
  );
};
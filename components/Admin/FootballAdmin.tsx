import React, { useState } from 'react';
import { Match } from '../../types';
import { FootballLogic } from '../../services/footballLogic';
import { Modal } from '../Shared';

export const FootballAdmin = ({ match }: { match: Match }) => {
  const isMatchActive = match.status === 'LIVE' || match.status === 'FT' || match.status === 'RESULT';
  const [initMode, setInitMode] = useState(!isMatchActive);
  
  // Initialization State (11 Players)
  const [homePlayers, setHomePlayers] = useState<string[]>(Array(11).fill(''));
  const [awayPlayers, setAwayPlayers] = useState<string[]>(Array(11).fill(''));
  const [homeColor, setHomeColor] = useState(match.homeTeamColor || '#000000');
  const [awayColor, setAwayColor] = useState(match.awayTeamColor || '#ffffff');
  const [advancedStats, setAdvancedStats] = useState(false);
  
  // Scoring Modal State
  const [actionModal, setActionModal] = useState<{type: 'GOAL'|'YELLOW'|'RED', isHome: boolean} | null>(null);
  const [actionTime, setActionTime] = useState('');
  const [actionPlayer, setActionPlayer] = useState('');
  const [actionAssist, setActionAssist] = useState('');
  const [error, setError] = useState<string | null>(null);

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
        await FootballLogic.setupTeams(match, homePlayers, awayPlayers, homeColor, awayColor, advancedStats);
        setInitMode(false);
      } catch (err: any) {
        setError("Setup Failed: " + err.message);
      }
  };
  
  const handleColorUpdate = async (isHome: boolean, color: string) => {
      if(isHome) setHomeColor(color); else setAwayColor(color);
      if (!initMode) {
          await FootballLogic.updateColors(match, isHome ? color : (match.homeTeamColor || '#000000'), !isHome ? color : (match.awayTeamColor || '#ffffff'));
      }
  };

  const initiateAction = (type: 'GOAL'|'YELLOW'|'RED', isHome: boolean) => {
      setActionModal({ type, isHome });
      setActionTime('');
      setActionPlayer('');
      setActionAssist('');
  };

  const confirmAction = async () => {
      if (!actionModal) return;
      let formattedTime = actionTime.trim();
      if (formattedTime && !isNaN(Number(formattedTime))) formattedTime += "'";

      try {
          if (actionModal.type === 'GOAL') {
              await FootballLogic.addGoal(match, actionModal.isHome, actionPlayer, actionAssist, formattedTime);
          } else {
              await FootballLogic.addCard(match, actionModal.isHome, actionModal.type === 'YELLOW' ? 'Yellow' : 'Red', actionPlayer, formattedTime);
          }
          setActionModal(null);
      } catch (err: any) {
          setError("Action Failed: " + err.message);
      }
  };

  if (initMode) {
      return (
          <div className="bg-gray-50 p-4 border border-gray-200 rounded-sm">
             {error && <div className="text-red-600 text-xs font-bold mb-4">{error}</div>}
             <h5 className="text-xs font-bold text-black mb-4 uppercase tracking-widest border-b border-gray-200 pb-2">Football Squad Setup</h5>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                 <div>
                    <div className="flex items-center gap-3 mb-2">
                        <input type="color" value={homeColor} onChange={(e) => setHomeColor(e.target.value)} className="w-6 h-6 p-0 border-0 rounded cursor-pointer" />
                        <h6 className="text-[10px] font-bold text-penrice-navy uppercase">{match.teamName} Lineup</h6>
                        <button onClick={() => autoFillPlayers(true)} className="text-[9px] font-bold text-gray-500 underline hover:text-black ml-auto">Auto-Fill</button>
                    </div>
                    <div className="space-y-1 mb-3">
                        {homePlayers.map((p, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <span className={`text-[9px] font-mono w-4 ${i >= 11 ? 'text-penrice-gold font-bold' : 'text-gray-400'}`}>{i+1}.</span>
                                <input className="w-full p-1 text-xs border border-gray-300 focus:border-black outline-none" placeholder={i >= 11 ? "Substitute" : "Player Name"} value={p} onChange={e => updatePlayerName(true, i, e.target.value)} />
                            </div>
                        ))}
                    </div>
                    <button onClick={() => addSubSlot(true)} className="w-full py-2 bg-white border border-dashed border-gray-300 text-[10px] font-bold uppercase hover:border-black hover:bg-gray-50"><i className="fa-solid fa-plus mr-1"></i> Add Sub</button>
                 </div>
                 <div>
                    <div className="flex items-center gap-3 mb-2">
                        <input type="color" value={awayColor} onChange={(e) => setAwayColor(e.target.value)} className="w-6 h-6 p-0 border-0 rounded cursor-pointer" />
                        <h6 className="text-[10px] font-bold text-black uppercase">{match.opponent} Lineup</h6>
                        <button onClick={() => autoFillPlayers(false)} className="text-[9px] font-bold text-gray-500 underline hover:text-black ml-auto">Auto-Fill</button>
                    </div>
                     <div className="space-y-1 mb-3">
                        {awayPlayers.map((p, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <span className={`text-[9px] font-mono w-4 ${i >= 11 ? 'text-penrice-gold font-bold' : 'text-gray-400'}`}>{i+1}.</span>
                                <input className="w-full p-1 text-xs border border-gray-300 focus:border-black outline-none" placeholder={i >= 11 ? "Substitute" : "Player Name"} value={p} onChange={e => updatePlayerName(false, i, e.target.value)} />
                            </div>
                        ))}
                    </div>
                    <button onClick={() => addSubSlot(false)} className="w-full py-2 bg-white border border-dashed border-gray-300 text-[10px] font-bold uppercase hover:border-black hover:bg-gray-50"><i className="fa-solid fa-plus mr-1"></i> Add Sub</button>
                 </div>
             </div>
             
             {/* Advanced Stats Toggle */}
             <div className="bg-white border border-gray-200 p-4 mb-6 flex items-center gap-3">
                 <input 
                    type="checkbox" 
                    id="advStats" 
                    className="w-5 h-5 accent-black" 
                    checked={advancedStats} 
                    onChange={(e) => setAdvancedStats(e.target.checked)} 
                 />
                 <div>
                     <label htmlFor="advStats" className="text-xs font-bold uppercase block text-black">Enable Advanced Stats</label>
                     <span className="text-[10px] text-gray-500">Includes live possession tracking, foul counts, and detailed match analysis.</span>
                 </div>
             </div>

             <button onClick={handleSetup} className="w-full bg-black text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-penrice-gold hover:text-black">Kick Off</button>
          </div>
      );
  }

  const periods = ['1st Half', 'Half Time', '2nd Half', 'FT'];
  const posStatus = match.footballStats?.possessionStatus || 'neutral';
  const showAdvanced = match.footballStats?.enableAdvancedStats;

  return (
    <div className="bg-white">
        {error && <Modal title="Error" onClose={() => setError(null)} type="danger"><p className="text-sm font-bold text-gray-600 mb-6">{error}</p><button onClick={() => setError(null)} className="w-full py-3 bg-red-600 text-white text-xs font-bold uppercase tracking-widest">OK</button></Modal>}

        {actionModal && (
            <Modal title={actionModal.type === 'GOAL' ? 'Goal Scored' : 'Card Given'} onClose={() => setActionModal(null)}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Time (Minute)</label>
                        <input className="w-full border border-gray-300 p-3 font-bold text-lg outline-none focus:border-black" placeholder="e.g. 23" value={actionTime} onChange={(e) => setActionTime(e.target.value)} autoFocus />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Player</label>
                        <select className="w-full border border-gray-300 p-3 font-bold text-sm bg-white outline-none focus:border-black" value={actionPlayer} onChange={(e) => setActionPlayer(e.target.value)}>
                            <option value="">-- Select Player --</option>
                            {(actionModal.isHome ? match.homeTeamStats : match.awayTeamStats)?.map(p => (
                                <option key={p.name} value={p.name}>{p.name} {p.status === 'sub' ? '(Sub)' : ''}</option>
                            ))}
                        </select>
                    </div>

                    {/* Assist Selection (Goals Only) */}
                    {actionModal.type === 'GOAL' && (
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Assist (Optional)</label>
                            <select className="w-full border border-gray-300 p-3 font-bold text-sm bg-white outline-none focus:border-black" value={actionAssist} onChange={(e) => setActionAssist(e.target.value)}>
                                <option value="">-- None / Unassisted --</option>
                                {(actionModal.isHome ? match.homeTeamStats : match.awayTeamStats)?.map(p => (
                                    <option key={p.name} value={p.name}>{p.name} {p.status === 'sub' ? '(Sub)' : ''}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button onClick={confirmAction} className={`w-full py-4 font-bold uppercase tracking-widest text-xs text-white transition-colors ${actionModal.type === 'GOAL' ? 'bg-black hover:bg-penrice-gold hover:text-black' : (actionModal.type === 'YELLOW' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-red-600 hover:bg-red-700')}`}>
                        Confirm {actionModal.type}
                    </button>
                </div>
            </Modal>
        )}

        {/* Score & Period Control */}
        <div className="bg-gray-50 border border-gray-200 p-4 mb-6 flex justify-between items-center relative">
             <input type="color" value={match.homeTeamColor || '#000000'} onChange={(e) => handleColorUpdate(true, e.target.value)} className="absolute top-2 left-2 w-4 h-4 p-0 border-0 opacity-10 hover:opacity-100 cursor-pointer" />
             <input type="color" value={match.awayTeamColor || '#ffffff'} onChange={(e) => handleColorUpdate(false, e.target.value)} className="absolute top-2 right-2 w-4 h-4 p-0 border-0 opacity-10 hover:opacity-100 cursor-pointer" />

            <div className="text-center w-1/3">
                 <div className="text-[10px] font-bold text-penrice-navy uppercase mb-1">{match.teamName}</div>
                 <input type="number" className="w-20 text-center text-3xl font-display font-bold bg-transparent border-b border-gray-300 focus:border-black outline-none" value={match.homeScore} onChange={e => FootballLogic.manualCorrection(match, parseInt(e.target.value) || 0, match.awayScore)} />
            </div>
            <div className="w-1/3 px-2">
                 <select className="w-full p-2 text-xs font-bold text-center border border-gray-300 bg-white" value={match.period} onChange={e => FootballLogic.updatePeriod(match, e.target.value)}>
                    {periods.map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
            </div>
             <div className="text-center w-1/3">
                 <div className="text-[10px] font-bold text-black uppercase mb-1">{match.opponent}</div>
                 <input type="number" className="w-20 text-center text-3xl font-display font-bold bg-transparent border-b border-gray-300 focus:border-black outline-none" value={match.awayScore} onChange={e => FootballLogic.manualCorrection(match, match.homeScore, parseInt(e.target.value) || 0)} />
            </div>
        </div>
        
        {/* Possession Tracker (Advanced Stats) */}
        {showAdvanced && (
            <div className="bg-black text-white p-4 mb-6 rounded-sm">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Possession Tracker</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm ${posStatus === 'neutral' ? 'bg-gray-700 text-white' : 'bg-green-500 text-black'}`}>
                        {posStatus === 'neutral' ? 'Paused' : `${posStatus === 'home' ? 'Home' : 'Away'} Ball`}
                    </span>
                </div>
                <div className="flex gap-1 h-12">
                    <button 
                        onClick={() => FootballLogic.updatePossession(match, 'home')}
                        className={`flex-1 font-bold uppercase tracking-widest text-xs transition-all ${posStatus === 'home' ? 'bg-penrice-gold text-black' : 'bg-gray-800 hover:bg-gray-700'}`}
                    >
                        {match.teamName}
                    </button>
                    <button 
                         onClick={() => FootballLogic.updatePossession(match, 'neutral')}
                         className={`w-16 flex items-center justify-center font-bold uppercase tracking-widest text-xs transition-all ${posStatus === 'neutral' ? 'bg-red-600' : 'bg-gray-800 hover:bg-gray-700'}`}
                    >
                        <i className={`fa-solid ${posStatus === 'neutral' ? 'fa-pause' : 'fa-stop'}`}></i>
                    </button>
                    <button 
                        onClick={() => FootballLogic.updatePossession(match, 'away')}
                        className={`flex-1 font-bold uppercase tracking-widest text-xs transition-all ${posStatus === 'away' ? 'bg-white text-black' : 'bg-gray-800 hover:bg-gray-700'}`}
                    >
                        {match.opponent}
                    </button>
                </div>
            </div>
        )}

        {/* Stats Control */}
        <div className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200 mb-6">
             <div className="bg-white p-4">
                 <div className="text-center text-[10px] font-bold uppercase mb-2">Home Stats</div>
                 <div className="flex justify-between items-center mb-2">
                     <span className="text-xs text-gray-500 font-bold">Corners</span>
                     <div className="flex items-center gap-2">
                         <button onClick={() => FootballLogic.updateStat(match, 'Corners', true, -1)} className="w-6 h-6 bg-gray-100 hover:bg-gray-200 text-xs">-</button>
                         <span className="w-4 text-center text-xs font-bold">{match.footballStats?.homeCorners || 0}</span>
                         <button onClick={() => FootballLogic.updateStat(match, 'Corners', true, 1)} className="w-6 h-6 bg-gray-100 hover:bg-gray-200 text-xs">+</button>
                     </div>
                 </div>
                 {showAdvanced && (
                     <div className="flex justify-between items-center">
                         <span className="text-xs text-gray-500 font-bold">Fouls</span>
                         <div className="flex items-center gap-2">
                             <button onClick={() => FootballLogic.updateStat(match, 'Fouls', true, -1)} className="w-6 h-6 bg-gray-100 hover:bg-gray-200 text-xs">-</button>
                             <span className="w-4 text-center text-xs font-bold">{match.footballStats?.homeFouls || 0}</span>
                             <button onClick={() => FootballLogic.updateStat(match, 'Fouls', true, 1)} className="w-6 h-6 bg-gray-100 hover:bg-gray-200 text-xs">+</button>
                         </div>
                     </div>
                 )}
             </div>
             <div className="bg-white p-4">
                 <div className="text-center text-[10px] font-bold uppercase mb-2">Away Stats</div>
                 <div className="flex justify-between items-center mb-2">
                     <span className="text-xs text-gray-500 font-bold">Corners</span>
                     <div className="flex items-center gap-2">
                         <button onClick={() => FootballLogic.updateStat(match, 'Corners', false, -1)} className="w-6 h-6 bg-gray-100 hover:bg-gray-200 text-xs">-</button>
                         <span className="w-4 text-center text-xs font-bold">{match.footballStats?.awayCorners || 0}</span>
                         <button onClick={() => FootballLogic.updateStat(match, 'Corners', false, 1)} className="w-6 h-6 bg-gray-100 hover:bg-gray-200 text-xs">+</button>
                     </div>
                 </div>
                 {showAdvanced && (
                     <div className="flex justify-between items-center">
                         <span className="text-xs text-gray-500 font-bold">Fouls</span>
                         <div className="flex items-center gap-2">
                             <button onClick={() => FootballLogic.updateStat(match, 'Fouls', false, -1)} className="w-6 h-6 bg-gray-100 hover:bg-gray-200 text-xs">-</button>
                             <span className="w-4 text-center text-xs font-bold">{match.footballStats?.awayFouls || 0}</span>
                             <button onClick={() => FootballLogic.updateStat(match, 'Fouls', false, 1)} className="w-6 h-6 bg-gray-100 hover:bg-gray-200 text-xs">+</button>
                         </div>
                     </div>
                 )}
             </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
                 <button onClick={() => initiateAction('GOAL', true)} className="w-full py-4 bg-penrice-navy text-white font-display font-bold text-lg hover:bg-black uppercase">Home Goal</button>
                 <div className="grid grid-cols-2 gap-2">
                     <button onClick={() => initiateAction('YELLOW', true)} className="bg-yellow-400 text-black py-3 font-bold text-xs uppercase hover:bg-yellow-500">Yellow Card</button>
                     <button onClick={() => initiateAction('RED', true)} className="bg-red-600 text-white py-3 font-bold text-xs uppercase hover:bg-red-700">Red Card</button>
                 </div>
            </div>
            <div className="space-y-2">
                 <button onClick={() => initiateAction('GOAL', false)} className="w-full py-4 bg-black text-white font-display font-bold text-lg hover:bg-gray-800 uppercase">Away Goal</button>
                 <div className="grid grid-cols-2 gap-2">
                     <button onClick={() => initiateAction('YELLOW', false)} className="bg-yellow-400 text-black py-3 font-bold text-xs uppercase hover:bg-yellow-500">Yellow Card</button>
                     <button onClick={() => initiateAction('RED', false)} className="bg-red-600 text-white py-3 font-bold text-xs uppercase hover:bg-red-700">Red Card</button>
                 </div>
            </div>
        </div>
    </div>
  );
};
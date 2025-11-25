import React, { useState } from 'react';
import { Match } from '../../types';
import { MatchesService } from '../../services/firebase';
import { CricketLogic } from '../../services/cricketLogic';
import { ScoreKey, ConfirmDialog, Modal } from '../Shared';

export const CricketAdmin = ({ match }: { match: Match }) => {
  const [initMode, setInitMode] = useState(!match.homeTeamStats || match.homeTeamStats.length === 0);
  const [homeList, setHomeList] = useState('');
  const [awayList, setAwayList] = useState('');
  const [overs, setOvers] = useState(20);
  const [batFirst, setBatFirst] = useState<'penrice' | 'opponent'>('penrice');
  
  // Interaction State
  const [wicketMode, setWicketMode] = useState(false);
  const [wktMethod, setWktMethod] = useState('Caught');
  const [wktFielder, setWktFielder] = useState('');
  
  // Modal States
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [showOverConfirm, setShowOverConfirm] = useState(false);
  const [showEndGameConfirm, setShowEndGameConfirm] = useState(false);
  const [pendingResult, setPendingResult] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (initMode) {
      return (
        <div className="bg-gray-50 p-4 border border-gray-200 rounded-sm">
            <h5 className="text-xs font-bold text-black mb-4 uppercase tracking-widest border-b border-gray-200 pb-2">Initialize Teams</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <textarea className="w-full h-32 text-xs p-3 border border-gray-300 rounded-sm focus:border-black outline-none" placeholder={`Enter ${match.teamName} Players (one per line)`} value={homeList} onChange={e => setHomeList(e.target.value)} />
                <textarea className="w-full h-32 text-xs p-3 border border-gray-300 rounded-sm focus:border-black outline-none" placeholder={`Enter ${match.opponent} Players (one per line)`} value={awayList} onChange={e => setAwayList(e.target.value)} />
            </div>
            <div className="flex gap-4 mb-6">
                <div className="w-24">
                    <label className="text-[10px] font-bold block mb-1 uppercase text-gray-500">Overs</label>
                    <input type="number" value={overs} onChange={e => setOvers(parseInt(e.target.value))} className="w-full border border-gray-300 p-2 text-sm font-bold rounded-sm" />
                </div>
                <div className="flex-1 flex flex-col justify-center gap-2">
                    <label className="text-xs font-bold flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={batFirst === 'penrice'} onChange={() => setBatFirst('penrice')} className="accent-black" /> 
                        <span>{match.teamName} Bats 1st</span>
                    </label>
                    <label className="text-xs font-bold flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={batFirst === 'opponent'} onChange={() => setBatFirst('opponent')} className="accent-black" /> 
                        <span>{match.opponent} Bats 1st</span>
                    </label>
                </div>
            </div>
            <button onClick={async () => { await CricketLogic.setupTeams(match, homeList, awayList, batFirst, overs); setInitMode(false); }} className="w-full bg-black text-white font-bold py-3 text-xs uppercase tracking-widest hover:bg-penrice-gold hover:text-black transition-colors rounded-sm">Start Match</button>
        </div>
      );
  }

  const isPenriceBatting = match.penriceStatus === 'batting';
  const battingStats = isPenriceBatting ? match.homeTeamStats : match.awayTeamStats;
  const bowlingStats = isPenriceBatting ? match.awayTeamStats : match.homeTeamStats;
  const availableBatters = battingStats?.filter(p => p.status !== 'out') || [];

  const handleBall = async (type: any) => {
      try {
          const result = await CricketLogic.processBall(match, type);
          if (result.isMatchWon) {
              setPendingResult(result.matchResultText);
              setShowEndGameConfirm(true);
          } else if (result.isInningsComplete && !result.isSecondInnings) {
              setShowSwitchConfirm(true);
          } else if (result.isOverComplete) {
              setShowOverConfirm(true);
          }
      } catch (e: any) {
          setErrorMsg(e.message || "An error occurred");
      }
  };

  const handleWicket = async () => {
      let desc = wktMethod;
      if (wktMethod === 'Caught') desc = `c ${wktFielder || 'Sub'} b ${match.currentBowler}`;
      else if (wktMethod === 'Bowled') desc = `b ${match.currentBowler}`;
      else if (wktMethod === 'LBW') desc = `lbw b ${match.currentBowler}`;
      else if (wktMethod === 'Run Out') desc = `run out (${wktFielder || 'Sub'})`;
      else if (wktMethod === 'Stumped') desc = `st ${wktFielder} b ${match.currentBowler}`;

      try {
          const result = await CricketLogic.processBall(match, 'WICKET', desc);
          setWicketMode(false);
          setWktMethod('Caught');
          setWktFielder('');
          
          if (result.isMatchWon) {
              setPendingResult(result.matchResultText);
              setShowEndGameConfirm(true);
          } else if (result.isInningsComplete && !result.isSecondInnings) {
              setShowSwitchConfirm(true);
          }
      } catch (e: any) {
          setErrorMsg(e.message);
      }
  };

  return (
    <div className="relative">
        {/* Modals */}
        {errorMsg && (
            <Modal title="Action Required" onClose={() => setErrorMsg(null)} type="danger">
                <p className="text-sm font-bold text-gray-600 mb-6">{errorMsg}</p>
                <button onClick={() => setErrorMsg(null)} className="w-full py-3 bg-red-600 text-white text-xs font-bold uppercase tracking-widest border border-red-600 hover:bg-white hover:text-red-600 rounded-sm">Dismiss</button>
            </Modal>
        )}
        
        {showEndGameConfirm && (
             <ConfirmDialog 
                title="Match Finished"
                message={`${pendingResult}. End the game now?`}
                onCancel={() => setShowEndGameConfirm(false)}
                onConfirm={() => { CricketLogic.endGame(match, pendingResult); setShowEndGameConfirm(false); }}
                confirmText="End Game"
                isDanger={false}
            />
        )}
        
        {showSwitchConfirm && (
            <ConfirmDialog 
                title="Innings Complete" 
                message="The innings has concluded. Do you want to switch teams now?"
                onCancel={() => setShowSwitchConfirm(false)}
                onConfirm={() => { CricketLogic.switchInnings(match); setShowSwitchConfirm(false); }}
                confirmText="Switch Teams"
            />
        )}

        {showOverConfirm && (
            <ConfirmDialog 
                title="Over Complete" 
                message="End of the over. Start the next one?"
                onCancel={() => setShowOverConfirm(false)}
                onConfirm={() => { CricketLogic.endOver(match); setShowOverConfirm(false); }}
                confirmText="Start New Over"
            />
        )}

        {/* Score Correction Panel - REDESIGNED */}
        <div className="bg-gray-50 border border-gray-200 p-4 mb-6 rounded-sm">
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">Score Correction</div>
            <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col">
                    <label className="text-[9px] font-bold text-black mb-1 uppercase text-center">Overs</label>
                    <input 
                        type="number" 
                        step="0.1"
                        className="w-full text-center text-base font-bold border border-gray-300 bg-white p-2 rounded-sm outline-none focus:border-black focus:ring-1 focus:ring-black" 
                        value={match.currentOver || 0} 
                        onChange={(e) => CricketLogic.manualScoreUpdate(match, 'overs', parseFloat(e.target.value) || 0)}
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-[9px] font-bold text-black mb-1 uppercase text-center truncate px-1">Runs</label>
                    <input 
                        type="number" 
                        className="w-full text-center text-base font-bold border border-gray-300 bg-white p-2 rounded-sm outline-none focus:border-black focus:ring-1 focus:ring-black" 
                        value={isPenriceBatting ? match.homeScore : match.awayScore} 
                        onChange={(e) => CricketLogic.manualScoreUpdate(match, 'runs', parseInt(e.target.value) || 0, isPenriceBatting)}
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-[9px] font-bold text-black mb-1 uppercase text-center">Wickets</label>
                    <input 
                        type="number" 
                        className="w-full text-center text-base font-bold border border-gray-300 bg-white p-2 rounded-sm outline-none focus:border-black focus:ring-1 focus:ring-black" 
                        value={isPenriceBatting ? match.homeWickets : match.awayWickets} 
                        onChange={(e) => CricketLogic.manualScoreUpdate(match, 'wickets', parseInt(e.target.value) || 0, isPenriceBatting)}
                    />
                </div>
            </div>
        </div>

        {/* Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div className="bg-white border border-gray-200 p-3 rounded-sm shadow-sm">
                <label className="text-[9px] font-bold text-penrice-navy block mb-1 uppercase tracking-wider">Striker</label>
                <select 
                    value={match.currentStriker} 
                    onChange={(e) => MatchesService.update(match.id, { currentStriker: e.target.value })} 
                    className="w-full text-sm font-bold bg-transparent outline-none h-10 border-b border-gray-200 focus:border-black transition-colors"
                >
                    <option value="">Select Batter</option>
                    {availableBatters.map(p => <option key={p.name} value={p.name}>{p.name} {p.status==='batting'?'*':''}</option>)}
                </select>
            </div>
            <div className="bg-white border border-gray-200 p-3 rounded-sm shadow-sm">
                <label className="text-[9px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Non-Striker</label>
                <select 
                    value={match.currentNonStriker} 
                    onChange={(e) => MatchesService.update(match.id, { currentNonStriker: e.target.value })} 
                    className="w-full text-sm font-bold bg-transparent outline-none h-10 border-b border-gray-200 focus:border-black transition-colors"
                >
                    <option value="">Select Batter</option>
                    {availableBatters.map(p => <option key={p.name} value={p.name}>{p.name} {p.status==='batting'?'*':''}</option>)}
                </select>
            </div>
        </div>
        
        <div className="bg-white border border-gray-200 p-3 rounded-sm shadow-sm mb-6">
             <label className="text-[9px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Bowler</label>
             <select 
                value={match.currentBowler} 
                onChange={(e) => MatchesService.update(match.id, { currentBowler: e.target.value })} 
                className="w-full text-sm font-bold bg-transparent outline-none h-10 border-b border-gray-200 focus:border-black transition-colors"
             >
                <option value="">Select Bowler</option>
                {bowlingStats?.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
             </select>
        </div>

        {/* Wicket Modal Overlay */}
        {wicketMode ? (
            <div className="bg-red-50 p-4 md:p-6 border border-red-200 mb-6 animate-pulse-once rounded-sm">
                <h5 className="text-xs font-bold text-red-700 mb-4 uppercase tracking-widest border-b border-red-200 pb-2">Process Wicket</h5>
                
                <div className="mb-4">
                    <label className="text-[9px] font-bold text-red-400 block mb-1 uppercase">Method</label>
                    <select value={wktMethod} onChange={(e) => setWktMethod(e.target.value)} className="w-full border border-red-200 p-3 text-sm font-bold rounded-sm bg-white outline-none focus:border-red-600">
                        <option value="Caught">Caught</option>
                        <option value="Bowled">Bowled</option>
                        <option value="LBW">LBW</option>
                        <option value="Run Out">Run Out</option>
                        <option value="Stumped">Stumped</option>
                    </select>
                </div>
                
                {['Caught', 'Run Out', 'Stumped'].includes(wktMethod) && (
                     <div className="mb-6">
                        <label className="text-[9px] font-bold text-red-400 block mb-1 uppercase">Fielder (Optional)</label>
                        <select value={wktFielder} onChange={(e) => setWktFielder(e.target.value)} className="w-full border border-red-200 p-3 text-sm font-bold rounded-sm bg-white outline-none focus:border-red-600">
                            <option value="">Select Fielder</option>
                            {bowlingStats?.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                        </select>
                    </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setWicketMode(false)} className="bg-white border border-gray-300 text-black text-xs font-bold py-3 uppercase rounded-sm hover:bg-gray-50">Cancel</button>
                    <button onClick={handleWicket} className="bg-red-600 text-white text-xs font-bold py-3 uppercase border border-red-600 rounded-sm hover:bg-red-700">Confirm OUT</button>
                </div>
            </div>
        ) : (
            /* Keypad */
            <div className="mb-4">
                <div className="grid grid-cols-4 gap-2 mb-3">
                    <ScoreKey label="DOT" onClick={() => handleBall(0)} />
                    <ScoreKey label="1" onClick={() => handleBall(1)} />
                    <ScoreKey label="2" onClick={() => handleBall(2)} />
                    <ScoreKey label="3" onClick={() => handleBall(3)} />
                    <ScoreKey label="4" color="navy" onClick={() => handleBall(4)} />
                    <ScoreKey label="6" color="navy" onClick={() => handleBall(6)} />
                    <ScoreKey label="WD" color="orange" onClick={() => handleBall('WD')} />
                    <ScoreKey label="NB" color="orange" onClick={() => handleBall('NB')} />
                    <ScoreKey label="BYE" onClick={() => handleBall('BYE')} />
                    <ScoreKey label="LB" onClick={() => handleBall('LB')} />
                    <ScoreKey label="OUT" color="red" onClick={() => setWicketMode(true)} />
                    <ScoreKey label="END" sub="OVER" color="black" onClick={() => setShowOverConfirm(true)} />
                </div>
                <div className="flex gap-3">
                     <button onClick={() => CricketLogic.undo(match)} className="flex-1 bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-bold py-4 uppercase hover:bg-gray-200 rounded-sm transition-colors">Undo Last</button>
                     <button onClick={() => setShowSwitchConfirm(true)} className="flex-1 bg-white border border-gray-300 text-black text-[10px] font-bold py-4 uppercase hover:bg-gray-50 rounded-sm transition-colors">Switch Innings</button>
                </div>
            </div>
        )}
    </div>
  );
};
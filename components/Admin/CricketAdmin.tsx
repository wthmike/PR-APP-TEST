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
        <div className="bg-gray-50 p-4 border border-gray-200">
            <h5 className="text-xs font-bold text-black mb-4 uppercase tracking-widest">Initialize Teams</h5>
            <div className="grid grid-cols-2 gap-4 mb-4">
                <textarea className="w-full h-32 text-xs p-2 border" placeholder={`Enter ${match.teamName} Players`} value={homeList} onChange={e => setHomeList(e.target.value)} />
                <textarea className="w-full h-32 text-xs p-2 border" placeholder={`Enter ${match.opponent} Players`} value={awayList} onChange={e => setAwayList(e.target.value)} />
            </div>
            <div className="flex gap-4 mb-4">
                <div className="flex-1">
                    <label className="text-[10px] font-bold block mb-1">Overs</label>
                    <input type="number" value={overs} onChange={e => setOvers(parseInt(e.target.value))} className="w-full border p-2 text-xs font-bold" />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                    <label className="text-xs font-bold flex items-center gap-2 mb-1">
                        <input type="radio" checked={batFirst === 'penrice'} onChange={() => setBatFirst('penrice')} /> {match.teamName} Bats 1st
                    </label>
                    <label className="text-xs font-bold flex items-center gap-2">
                        <input type="radio" checked={batFirst === 'opponent'} onChange={() => setBatFirst('opponent')} /> {match.opponent} Bats 1st
                    </label>
                </div>
            </div>
            <button onClick={async () => { await CricketLogic.setupTeams(match, homeList, awayList, batFirst, overs); setInitMode(false); }} className="w-full bg-black text-white font-bold py-3 text-xs uppercase">Start Match</button>
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
                <button onClick={() => setErrorMsg(null)} className="w-full py-3 bg-red-600 text-white text-xs font-bold uppercase tracking-widest border border-red-600 hover:bg-white hover:text-red-600">Dismiss</button>
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

        {/* Score Correction Panel */}
        <div className="bg-penrice-gold/10 border border-penrice-gold p-3 mb-4 flex flex-wrap items-center justify-between gap-y-2">
            <div className="text-[9px] font-bold text-black uppercase tracking-widest w-full md:w-auto">Score Correction</div>
            <div className="flex gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-black">OVERS</span>
                    <input 
                        type="number" 
                        step="0.1"
                        className="w-12 text-center text-xs font-bold border-b border-black bg-transparent outline-none" 
                        value={match.currentOver || 0} 
                        onChange={(e) => CricketLogic.manualScoreUpdate(match, 'overs', parseFloat(e.target.value) || 0)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-black">{isPenriceBatting ? match.teamName : match.opponent} RUNS</span>
                    <input 
                        type="number" 
                        className="w-16 text-center text-xs font-bold border-b border-black bg-transparent outline-none" 
                        value={isPenriceBatting ? match.homeScore : match.awayScore} 
                        onChange={(e) => CricketLogic.manualScoreUpdate(match, 'runs', parseInt(e.target.value) || 0, isPenriceBatting)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-black">WKTS</span>
                    <input 
                        type="number" 
                        className="w-12 text-center text-xs font-bold border-b border-black bg-transparent outline-none" 
                        value={isPenriceBatting ? match.homeWickets : match.awayWickets} 
                        onChange={(e) => CricketLogic.manualScoreUpdate(match, 'wickets', parseInt(e.target.value) || 0, isPenriceBatting)}
                    />
                </div>
            </div>
        </div>

        {/* Selection Grid */}
        <div className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200 mt-4">
            <div className="bg-white p-3">
                <label className="text-[9px] font-bold text-penrice-navy block mb-1 uppercase">Striker</label>
                <select value={match.currentStriker} onChange={(e) => MatchesService.update(match.id, { currentStriker: e.target.value })} className="w-full text-xs font-bold border-b outline-none h-8">
                    <option value="">Select</option>
                    {availableBatters.map(p => <option key={p.name} value={p.name}>{p.name} {p.status==='batting'?'🏏':''}</option>)}
                </select>
            </div>
            <div className="bg-white p-3">
                <label className="text-[9px] font-bold text-gray-500 block mb-1 uppercase">Non-Striker</label>
                <select value={match.currentNonStriker} onChange={(e) => MatchesService.update(match.id, { currentNonStriker: e.target.value })} className="w-full text-xs font-bold border-b outline-none h-8">
                    <option value="">Select</option>
                    {availableBatters.map(p => <option key={p.name} value={p.name}>{p.name} {p.status==='batting'?'🏏':''}</option>)}
                </select>
            </div>
        </div>
        <div className="mb-6 bg-white p-3 border border-t-0 border-gray-200">
             <label className="text-[9px] font-bold text-gray-500 block mb-1 uppercase">Bowler</label>
             <select value={match.currentBowler} onChange={(e) => MatchesService.update(match.id, { currentBowler: e.target.value })} className="w-full text-xs font-bold border-b outline-none h-8">
                <option value="">Select Bowler</option>
                {bowlingStats?.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
             </select>
        </div>

        {/* Wicket Modal Overlay */}
        {wicketMode ? (
            <div className="bg-red-50 p-6 border border-red-200 mb-6 animate-pulse-once">
                <h5 className="text-xs font-bold text-red-700 mb-4 uppercase">Process Wicket</h5>
                <select value={wktMethod} onChange={(e) => setWktMethod(e.target.value)} className="w-full mb-4 border p-2 text-xs font-bold">
                    <option value="Caught">Caught</option>
                    <option value="Bowled">Bowled</option>
                    <option value="LBW">LBW</option>
                    <option value="Run Out">Run Out</option>
                    <option value="Stumped">Stumped</option>
                </select>
                {['Caught', 'Run Out', 'Stumped'].includes(wktMethod) && (
                    <select value={wktFielder} onChange={(e) => setWktFielder(e.target.value)} className="w-full mb-4 border p-2 text-xs font-bold">
                        <option value="">Select Fielder</option>
                        {bowlingStats?.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                    </select>
                )}
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setWicketMode(false)} className="bg-white border text-xs font-bold py-3 uppercase">Cancel</button>
                    <button onClick={handleWicket} className="bg-red-600 text-white text-xs font-bold py-3 uppercase">Confirm OUT</button>
                </div>
            </div>
        ) : (
            /* Keypad */
            <div className="mb-4">
                <div className="grid grid-cols-4 gap-2 mb-2">
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
                <div className="flex gap-2">
                     <button onClick={() => CricketLogic.undo(match)} className="flex-1 bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-bold py-3 uppercase hover:bg-gray-200">Undo Last Ball</button>
                     <button onClick={() => setShowSwitchConfirm(true)} className="flex-1 bg-white border border-gray-300 text-black text-[10px] font-bold py-3 uppercase hover:bg-gray-50">Switch Innings</button>
                </div>
            </div>
        )}
    </div>
  );
};
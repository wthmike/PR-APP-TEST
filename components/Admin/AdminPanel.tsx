import React, { useState } from 'react';
import { MatchesService } from '../../services/firebase';
import { Match, SportType } from '../../types';
import { NetballAdmin } from './NetballAdmin';
import { CricketAdmin } from './CricketAdmin';
import { ConfirmDialog, Modal } from '../Shared';

interface AdminPanelProps {
  matches: Match[];
  onClose: () => void;
}

export const AdminPanel = ({ matches, onClose }: AdminPanelProps) => {
  const [sport, setSport] = useState<SportType>('cricket');
  const [team, setTeam] = useState('Penrice Academy');
  const [opponent, setOpponent] = useState('');
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createMatch = async () => {
    if (!opponent) {
        setError("Please enter an opponent name.");
        return;
    }
    
    const baseData: any = {
        sport,
        teamName: team,
        opponent: opponent,
        status: 'UPCOMING',
        league: 'School Fixture',
        lastUpdated: Date.now(),
        homeScore: 0, homeWickets: 0, awayScore: 0, awayWickets: 0,
        events: []
    };

    if (sport === 'cricket') {
        baseData.homeTeamStats = [];
        baseData.awayTeamStats = [];
        baseData.format = 'Limited Overs';
        baseData.maxOvers = 20;
    } else {
        baseData.format = '4 Quarters';
        baseData.period = 'Warmup';
        baseData.periodIdx = -1;
    }

    await MatchesService.create(baseData);
    setOpponent('');
  };

  const handleDelete = () => {
      if (deleteCandidateId) {
          MatchesService.delete(deleteCandidateId);
          setDeleteCandidateId(null);
      }
  };

  return (
    <div className="mb-12 border border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] bg-white animate-pulse-once relative">
        {/* Error Modal */}
        {error && (
            <Modal title="Input Required" onClose={() => setError(null)} type="danger">
                 <p className="text-sm font-bold text-gray-600 mb-6">{error}</p>
                 <button onClick={() => setError(null)} className="w-full py-3 bg-red-600 text-white text-xs font-bold uppercase tracking-widest">OK</button>
            </Modal>
        )}

        {/* Modal for Deletion */}
        {deleteCandidateId && (
            <ConfirmDialog 
                title="Delete Fixture" 
                message="Are you sure you want to permanently delete this fixture? This action cannot be undone."
                isDanger={true}
                confirmText="Delete Match"
                onCancel={() => setDeleteCandidateId(null)}
                onConfirm={handleDelete}
            />
        )}

        {/* Header - Sticky for mobile ease */}
        <div className="bg-black text-white px-4 py-3 md:px-6 md:py-4 flex justify-between items-center sticky top-0 z-20 shadow-md">
            <h2 className="font-display font-bold text-lg md:text-xl uppercase tracking-wider">Staff Control Panel</h2>
            <button onClick={onClose} className="text-[10px] font-bold text-white/70 hover:text-white uppercase tracking-widest border border-white/30 px-3 py-1 hover:bg-white/10">
                Close
            </button>
        </div>

        {/* Create Match */}
        <div className="p-4 md:p-8 border-b border-gray-100">
            <h3 className="text-[10px] font-bold text-black uppercase tracking-widest mb-4 md:mb-6 border-l-2 border-penrice-gold pl-3">Create New Fixture</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 items-end">
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Sport</label>
                    <select 
                        className="w-full border-b-2 border-gray-200 py-2 text-sm font-bold outline-none bg-transparent rounded-none"
                        value={sport}
                        onChange={(e) => setSport(e.target.value as SportType)}
                    >
                        <option value="cricket">Cricket</option>
                        <option value="netball">Netball</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Our Team</label>
                    <input 
                        className="w-full border-b-2 border-gray-200 py-2 text-sm font-bold outline-none bg-transparent rounded-none"
                        value={team}
                        onChange={(e) => setTeam(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Opponent</label>
                    <input 
                        className="w-full border-b-2 border-gray-200 py-2 text-sm font-bold outline-none bg-transparent rounded-none"
                        placeholder="School Name"
                        value={opponent}
                        onChange={(e) => setOpponent(e.target.value)}
                    />
                </div>
                <button 
                    onClick={createMatch}
                    className="w-full py-3 bg-black hover:bg-penrice-gold hover:text-black text-white font-bold uppercase tracking-widest text-xs transition-colors border border-black"
                >
                    Create Match
                </button>
            </div>
        </div>

        {/* Match List */}
        <div className="p-4 md:p-8 bg-gray-50 flex flex-col gap-6 md:gap-8">
            {matches.map(match => (
                <div key={match.id} className="bg-white border border-gray-200 p-4 md:p-6 relative shadow-sm">
                    <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                        <div>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Editing</span>
                            <h4 className="font-display font-bold text-xl text-black uppercase leading-tight mt-1">{match.teamName} <span className="text-gray-300">vs</span> {match.opponent}</h4>
                        </div>
                        <button onClick={() => setDeleteCandidateId(match.id)} className="text-gray-300 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-sm">
                            <i className="fa-solid fa-trash-can"></i>
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Status</label>
                            <select 
                                value={match.status} 
                                onChange={(e) => MatchesService.update(match.id, { status: e.target.value })}
                                className="w-full border border-gray-300 bg-white p-2 text-xs font-bold rounded-sm h-10"
                            >
                                <option value="UPCOMING">Upcoming</option>
                                <option value="LIVE">Live</option>
                                <option value="FT">Full Time</option>
                            </select>
                        </div>
                         <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">League</label>
                            <input 
                                value={match.league || ''} 
                                onChange={(e) => MatchesService.update(match.id, { league: e.target.value })}
                                className="w-full border border-gray-300 p-2 text-xs h-10 rounded-sm"
                            />
                        </div>
                    </div>

                    {match.sport === 'netball' ? <NetballAdmin match={match} /> : <CricketAdmin match={match} />}
                </div>
            ))}
        </div>
    </div>
  );
};
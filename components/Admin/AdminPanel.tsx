
import React, { useState } from 'react';
import { MatchesService } from '../../services/firebase';
import { Match, SportType } from '../../types';
import { NetballAdmin } from './NetballAdmin';
import { CricketAdmin } from './CricketAdmin';
import { RugbyAdmin } from './RugbyAdmin';
import { NewsAdmin } from './NewsAdmin';
import { ConfirmDialog, Modal } from '../Shared';

interface AdminPanelProps {
  matches: Match[];
  onClose: () => void;
}

export const AdminPanel = ({ matches, onClose }: AdminPanelProps) => {
  const [activeSection, setActiveSection] = useState<'sports' | 'news'>('sports');
  const [activeSportTab, setActiveSportTab] = useState<SportType>('rugby');
  
  const [team, setTeam] = useState('Penrice Academy');
  const [opponent, setOpponent] = useState('');
  const [yearGroup, setYearGroup] = useState('Year 7');
  const [time, setTime] = useState('');
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReorderCollapsed, setIsReorderCollapsed] = useState(false);

  // Filter matches for the current sport tab
  const activeMatches = activeSection === 'sports' ? matches.filter(m => m.sport === activeSportTab) : [];
  
  // Sorted matches for the order list (All active/upcoming matches)
  const orderedMatches = [...matches].sort((a, b) => {
      const orderA = a.sortOrder ?? 9999;
      const orderB = b.sortOrder ?? 9999;
      if (orderA !== orderB) return orderA - orderB;
      return a.id.localeCompare(b.id);
  });

  const createMatch = async () => {
    try {
        if (!opponent) {
            setError("Please enter an opponent name.");
            return;
        }
        
        // Default order to end of list
        const maxOrder = matches.length; 

        const baseData: any = {
            sport: activeSportTab,
            teamName: team,
            opponent: opponent,
            yearGroup: yearGroup,
            time: time,
            status: 'UPCOMING',
            league: 'School Fixture',
            lastUpdated: Date.now(),
            sortOrder: maxOrder,
            homeScore: 0, homeWickets: 0, awayScore: 0, awayWickets: 0,
            events: []
        };

        if (activeSportTab === 'cricket') {
            baseData.homeTeamStats = [];
            baseData.awayTeamStats = [];
            baseData.format = 'Limited Overs';
            baseData.maxOvers = 20;
        } else if (activeSportTab === 'rugby') {
            baseData.format = 'Rugby Union';
            baseData.period = '1st Half';
            baseData.homeTeamStats = [];
            baseData.awayTeamStats = [];
        } else {
            baseData.format = '4 Quarters';
            baseData.period = 'Warmup';
            baseData.periodIdx = -1;
        }

        await MatchesService.create(baseData);
        setOpponent('');
        setTime('');
    } catch (err: any) {
        console.error("Create Match Error:", err);
        let msg = "Failed to create match.";
        if (err.code === 'permission-denied') {
            msg += " PERMISSION DENIED: Please update your Firestore Security Rules.";
        } else {
            msg += " " + (err.message || "Please check your connection.");
        }
        setError(msg);
    }
  };

  const handleDelete = async () => {
      try {
          if (deleteCandidateId) {
              await MatchesService.delete(deleteCandidateId);
              setDeleteCandidateId(null);
          }
      } catch (err: any) {
          setError("Failed to delete. " + err.message);
      }
  };

  const moveCard = async (matchId: string, direction: 'up' | 'down') => {
      const sorted = [...matches].sort((a, b) => {
          const orderA = a.sortOrder ?? 9999;
          const orderB = b.sortOrder ?? 9999;
          if (orderA !== orderB) return orderA - orderB;
          return a.id.localeCompare(b.id);
      });

      const index = sorted.findIndex(m => m.id === matchId);
      
      if (index === -1) return;
      if (direction === 'up' && index === 0) return;
      if (direction === 'down' && index === sorted.length - 1) return;
      
      const itemToMove = sorted[index];
      sorted.splice(index, 1);
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      sorted.splice(newIndex, 0, itemToMove);
      
      try {
          await Promise.all(sorted.map((m, idx) => 
              MatchesService.update(m.id, { sortOrder: idx })
          ));
      } catch (err: any) {
          setError("Reorder failed: " + err.message);
      }
  };

  const renderAdminComponent = (match: Match) => {
      switch(match.sport) {
          case 'cricket': return <CricketAdmin match={match} />;
          case 'netball': return <NetballAdmin match={match} />;
          case 'rugby': return <RugbyAdmin match={match} />;
          default: return null;
      }
  };

  return (
    <div className="mb-12 border-t border-black bg-gray-100 min-h-screen relative pb-20">
        {/* Error Modal */}
        {error && (
            <Modal title="System Message" onClose={() => setError(null)} type="danger">
                 <p className="text-sm font-bold text-gray-600 mb-6">{error}</p>
                 <button onClick={() => setError(null)} className="w-full py-3 bg-red-600 text-white text-xs font-bold uppercase tracking-widest">OK</button>
            </Modal>
        )}

        {/* Delete Modal */}
        {deleteCandidateId && (
            <ConfirmDialog 
                title="Delete Fixture" 
                message="Are you sure you want to permanently delete this fixture?"
                isDanger={true}
                confirmText="Delete"
                onCancel={() => setDeleteCandidateId(null)}
                onConfirm={handleDelete}
            />
        )}

        {/* --- SECTION 1: HEADER & ORDER --- */}
        <div className="bg-white border-b border-gray-300 shadow-sm sticky top-0 z-50">
            <div className="flex justify-between items-center px-4 py-3 bg-black text-white">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <h2 className="font-display font-bold text-lg uppercase tracking-wider">Admin Panel</h2>
                </div>
                <button onClick={onClose} className="text-[10px] font-bold text-white/70 hover:text-white uppercase tracking-widest bg-white/10 px-4 py-2 rounded-sm h-full">
                    Close
                </button>
            </div>

            {/* Top Level Nav */}
            <div className="flex border-b border-gray-200">
                <button 
                    onClick={() => setActiveSection('sports')}
                    className={`flex-1 py-4 text-center text-xs font-bold uppercase tracking-widest transition-colors ${activeSection === 'sports' ? 'bg-white text-black border-b-4 border-penrice-gold' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                    <i className="fa-solid fa-trophy mr-2"></i> Sports Management
                </button>
                <button 
                    onClick={() => setActiveSection('news')}
                    className={`flex-1 py-4 text-center text-xs font-bold uppercase tracking-widest transition-colors ${activeSection === 'news' ? 'bg-white text-black border-b-4 border-penrice-gold' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                    <i className="fa-solid fa-newspaper mr-2"></i> News Centre
                </button>
            </div>

            {/* Collapsible Order Widget (Only on Sports) */}
            {activeSection === 'sports' && (
                <div className="bg-gray-50 border-b border-gray-200">
                    <div 
                        className="px-4 py-2 flex justify-between items-center cursor-pointer hover:bg-gray-100"
                        onClick={() => setIsReorderCollapsed(!isReorderCollapsed)}
                    >
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center">
                            <i className="fa-solid fa-sort mr-2 text-sm"></i> 
                            Active Fixture Order
                        </span>
                        <i className={`fa-solid fa-chevron-down text-xs text-gray-400 transition-transform ${isReorderCollapsed ? '-rotate-90' : ''}`}></i>
                    </div>
                    
                    {!isReorderCollapsed && (
                        <div className="px-2 pb-3 overflow-x-auto whitespace-nowrap custom-scroll flex gap-2">
                            {orderedMatches.length === 0 && <div className="p-4 text-xs text-gray-400 italic">No matches created yet.</div>}
                            {orderedMatches.map((m, idx) => (
                                <div key={m.id} className="inline-flex flex-col w-40 bg-white border border-gray-200 shadow-sm rounded-sm p-2 shrink-0 relative">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm ${m.sport==='rugby'?'bg-penrice-navy text-white':(m.sport==='cricket'?'bg-green-700 text-white':'bg-pink-600 text-white')}`}>
                                            {m.sport.substr(0,1)}
                                        </span>
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={(e) => {e.stopPropagation(); moveCard(m.id, 'up')}}
                                                disabled={idx === 0}
                                                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-black hover:text-white rounded-sm disabled:opacity-20 transition-colors"
                                            >
                                                <i className="fa-solid fa-caret-left text-xs"></i>
                                            </button>
                                            <button 
                                                onClick={(e) => {e.stopPropagation(); moveCard(m.id, 'down')}}
                                                disabled={idx === orderedMatches.length - 1}
                                                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-black hover:text-white rounded-sm disabled:opacity-20 transition-colors"
                                            >
                                                <i className="fa-solid fa-caret-right text-xs"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-bold text-black truncate leading-tight mt-1">{m.opponent}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* --- SECTION 2: CONTENT --- */}
        
        {/* If News Tab */}
        {activeSection === 'news' ? (
            <div className="bg-gray-50 min-h-[500px]">
                <div className="p-6 bg-white border-b border-gray-200 shadow-sm mb-4">
                     <h2 className="text-xl font-display font-bold uppercase text-black mb-1">Match Report Centre</h2>
                     <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Write articles, generate smart facts, and manage news feeds.</p>
                </div>
                <NewsAdmin matches={matches} />
            </div>
        ) : (
            /* If Sport Tab */
            <>
                {/* Secondary Sport Nav */}
                <div className="sticky top-[113px] z-40 bg-white shadow-md grid grid-cols-3 border-b border-gray-300">
                     {(['rugby', 'netball', 'cricket'] as SportType[]).map(tab => (
                         <button
                            key={tab}
                            onClick={() => setActiveSportTab(tab)}
                            className={`h-16 flex flex-col items-center justify-center border-b-4 transition-all active:bg-gray-100 ${activeSportTab === tab ? 'border-black bg-gray-50' : 'border-transparent text-gray-400 hover:bg-gray-50'}`}
                         >
                             <span className="text-2xl mb-1 filter drop-shadow-sm">
                                {tab === 'cricket' && '🏏'}
                                {tab === 'rugby' && '🏉'}
                                {tab === 'netball' && '🏐'}
                             </span>
                             <span className={`text-[10px] font-bold uppercase tracking-widest ${activeSportTab === tab ? 'text-black' : 'text-gray-400'}`}>
                                 {tab}
                             </span>
                         </button>
                     ))}
                </div>

                {/* CREATE NEW (Context Aware) */}
                <div className="p-4 bg-white border-b border-gray-200 md:border md:m-4 md:rounded-sm shadow-sm mt-4">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <i className="fa-solid fa-plus-circle"></i>
                        Create New {activeSportTab} Match
                    </h3>
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col md:flex-row gap-3">
                            <input 
                                className="flex-1 border border-gray-200 p-3 h-12 text-sm font-bold outline-none focus:border-black rounded-sm bg-gray-50"
                                placeholder="Year Group (e.g. Year 8)"
                                value={yearGroup}
                                onChange={(e) => setYearGroup(e.target.value)}
                            />
                            <input 
                                className="flex-1 border border-gray-200 p-3 h-12 text-sm font-bold outline-none focus:border-black rounded-sm bg-gray-50"
                                placeholder="Time (e.g. 15:30)"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                            />
                            <input 
                                className="flex-[2] border border-gray-200 p-3 h-12 text-sm font-bold outline-none focus:border-black rounded-sm bg-gray-50"
                                value={team}
                                onChange={(e) => setTeam(e.target.value)}
                                placeholder="Home Team"
                            />
                        </div>
                        <div className="flex flex-col md:flex-row gap-3">
                            <input 
                                className="flex-[2] border border-gray-200 p-3 h-12 text-sm font-bold outline-none focus:border-black rounded-sm bg-gray-50"
                                placeholder="Opponent Name"
                                value={opponent}
                                onChange={(e) => setOpponent(e.target.value)}
                            />
                            <button 
                                onClick={createMatch}
                                className="flex-1 h-12 bg-black text-white font-bold uppercase tracking-widest text-[10px] rounded-sm hover:bg-penrice-gold hover:text-black transition-colors shadow-sm"
                            >
                                Create Match
                            </button>
                        </div>
                    </div>
                </div>

                {/* MATCH LIST */}
                <div className="flex flex-col gap-6 pb-12 md:px-4">
                    {activeMatches.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            <i className="fa-solid fa-clipboard-list text-4xl mb-4 opacity-20"></i>
                            <p className="text-xs font-bold uppercase tracking-widest">No {activeSportTab} matches found</p>
                        </div>
                    )}

                    {activeMatches.map((match) => (
                        <div key={match.id} className="bg-white border-y md:border border-gray-200 md:rounded-sm overflow-hidden animate-fade-in-up shadow-sm">
                            {/* Card Header */}
                            <div className="bg-gray-50 border-b border-gray-100 p-3 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="bg-black text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">{match.yearGroup || 'Fixture'}</span>
                                    <span className="font-display font-bold text-lg uppercase text-black leading-none truncate max-w-[200px]">{match.opponent}</span>
                                </div>
                                <button 
                                    onClick={() => setDeleteCandidateId(match.id)}
                                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                >
                                    <i className="fa-solid fa-trash-can text-sm"></i>
                                </button>
                            </div>

                            {/* Quick Settings */}
                            <div className="grid grid-cols-3 gap-px bg-gray-100 border-b border-gray-100">
                                <select 
                                    value={match.status} 
                                    onChange={(e) => MatchesService.update(match.id, { status: e.target.value })}
                                    className="p-3 h-12 text-xs font-bold outline-none bg-white text-center appearance-none"
                                >
                                    <option value="UPCOMING">Upcoming</option>
                                    <option value="LIVE">Live</option>
                                    <option value="FT">Full Time</option>
                                </select>
                                <input 
                                    value={match.time || ''}
                                    onChange={(e) => MatchesService.update(match.id, { time: e.target.value })}
                                    className="p-3 h-12 text-xs font-bold outline-none bg-white text-center placeholder-gray-300"
                                    placeholder="Time"
                                />
                                <input 
                                    value={match.league || ''}
                                    onChange={(e) => MatchesService.update(match.id, { league: e.target.value })}
                                    className="p-3 h-12 text-xs font-bold outline-none bg-white text-center placeholder-gray-300"
                                    placeholder="League / Info"
                                />
                            </div>

                            {/* Sport Specific Admin */}
                            <div className="p-3">
                                {renderAdminComponent(match)}
                            </div>
                        </div>
                    ))}
                </div>
            </>
        )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Match, MatchReport } from '../../types';
import { MatchesService } from '../../services/firebase';
import { ResultCard } from '../News/ResultCard';

export const NewsAdmin = ({ matches }: { matches: Match[] }) => {
  // Filter for ONLY Full Time or Result matches
  const eligibleMatches = matches.filter(m => m.status === 'FT' || m.status === 'RESULT');
  
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [formData, setFormData] = useState<MatchReport>({
      title: '',
      author: 'Penrice Sport',
      body: '',
      image: '',
      publishedAt: Date.now(),
      tags: []
  });
  const [tagsInput, setTagsInput] = useState('');
  const [facts, setFacts] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [isProcessingImg, setIsProcessingImg] = useState(false);

  const selectedMatch = matches.find(m => m.id === selectedMatchId);

  // Generate Smart Facts when a match is selected
  useEffect(() => {
      if (!selectedMatch) return;

      const f: string[] = [];
      const m = selectedMatch;
      const winner = m.homeScore > m.awayScore ? m.teamName : (m.awayScore > m.homeScore ? m.opponent : 'Draw');
      const margin = Math.abs(m.homeScore - m.awayScore);

      f.push(`Winner: ${winner} ${winner !== 'Draw' ? `(by ${margin} ${m.sport === 'cricket' ? 'runs/wickets' : 'points'})` : ''}`);
      
      if (m.sport === 'cricket') {
          // Find Top Scorers
          const allBatters = [...(m.homeTeamStats || []), ...(m.awayTeamStats || [])];
          if (allBatters.length > 0) {
              const topBatter = allBatters.reduce((prev, current) => (prev.runs > current.runs) ? prev : current, allBatters[0]);
              if (topBatter.runs > 0) f.push(`Top Scorer: ${topBatter.name} with ${topBatter.runs} runs`);

              // Find Best Bowlers
              const allBowlers = allBatters.filter(p => (p.bowlWkts || 0) > 0);
              if (allBowlers.length > 0) {
                  const topBowler = allBowlers.reduce((prev, current) => ((prev.bowlWkts || 0) > (current.bowlWkts || 0)) ? prev : current, allBowlers[0]);
                  if ((topBowler.bowlWkts || 0) > 0) {
                      f.push(`Best Bowler: ${topBowler.name} (${topBowler.bowlWkts || 0}/${topBowler.bowlRuns || 0})`);
                  }
              }
          }
          
          if (m.events.some(e => e.duckType === 'golden')) f.push("Golden Duck alert! Someone had a shocker!");
      }

      if (m.sport === 'rugby') {
          const tries = m.events.filter(e => e.type === 'TRY');
          f.push(`Total Tries: ${tries.length}`);
          // Count tries per player
          const counts: Record<string, number> = {};
          tries.forEach(t => { if(t.player) counts[t.player] = (counts[t.player] || 0) + 1; });
          Object.entries(counts).forEach(([player, count]) => {
              if (count > 1) f.push(`${player} scored ${count} tries!`);
          });
      }

      if (m.sport === 'netball') {
           const goals = m.events.filter(e => e.type === 'GOAL');
           if (goals.length > 0) f.push(`Total Goals Scored: ${goals.length}`);
      }

      setFacts(f);
      
      // Pre-fill if report exists
      if (m.report) {
          setFormData(m.report);
          setTagsInput(m.report.tags?.join(', ') || '');
      } else {
          // Reset default
          setFormData({
              title: `${m.teamName} vs ${m.opponent} Match Report`,
              author: 'Penrice Sport',
              body: '',
              image: '',
              publishedAt: Date.now(),
              tags: [m.sport, m.yearGroup || 'Fixture']
          });
          setTagsInput(`${m.sport}, ${m.yearGroup || 'Fixture'}`);
      }

  }, [selectedMatchId, matches]);

  const handleSave = async () => {
      if (!selectedMatchId) return;
      
      const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);
      const report = { ...formData, tags, publishedAt: Date.now() };

      await MatchesService.update(selectedMatchId, { report });
      setSuccessMsg("Article published successfully!");
      setTimeout(() => setSuccessMsg(''), 3000);
  };

  const insertFact = (fact: string) => {
      setFormData({...formData, body: formData.body + (formData.body ? '\n\n' : '') + fact});
  };

  // Image Upload with Basic Resize logic to keep payload light for Firestore
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setIsProcessingImg(true);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                // Resize to max width 800px
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    setFormData({...formData, image: dataUrl});
                }
                setIsProcessingImg(false);
            }
        };
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4">
        {/* Left Col: Selector & Editor */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 border border-gray-200 rounded-sm shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Select Completed Match</h3>
                <select 
                    className="w-full p-3 border border-gray-300 rounded-sm font-bold text-sm outline-none focus:border-black"
                    value={selectedMatchId}
                    onChange={(e) => setSelectedMatchId(e.target.value)}
                >
                    <option value="">-- Choose a Game --</option>
                    {eligibleMatches.length === 0 && <option disabled>No matches at Full Time yet.</option>}
                    {eligibleMatches.map(m => (
                        <option key={m.id} value={m.id}>
                            [{m.sport.toUpperCase()}] {m.teamName} vs {m.opponent} ({m.result || 'FT'})
                        </option>
                    ))}
                </select>
            </div>

            {selectedMatchId && (
                <div className="bg-white p-6 border border-gray-200 rounded-sm shadow-sm animate-fade-in-up">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-2">
                        <h3 className="text-xs font-bold text-black uppercase tracking-widest">Article Editor</h3>
                        {successMsg && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-sm">{successMsg}</span>}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Headline</label>
                            <input 
                                className="w-full p-3 border border-gray-300 font-display font-bold text-xl uppercase rounded-sm focus:border-black outline-none"
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                placeholder="E.g. Penrice Storm to Victory"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Author</label>
                            <input 
                                className="w-full p-3 border border-gray-300 font-bold text-sm rounded-sm focus:border-black outline-none"
                                value={formData.author}
                                onChange={e => setFormData({...formData, author: e.target.value})}
                            />
                         </div>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Header Image</label>
                            <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <label className="flex-1 cursor-pointer bg-white border border-gray-300 border-dashed p-3 rounded-sm flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-black transition-colors">
                                        {isProcessingImg ? (
                                            <span className="text-xs font-bold uppercase animate-pulse">Processing...</span>
                                        ) : (
                                            <>
                                                <i className="fa-solid fa-camera text-gray-400"></i>
                                                <span className="text-xs font-bold uppercase text-gray-600">Choose Photo</span>
                                            </>
                                        )}
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isProcessingImg} />
                                    </label>
                                    
                                    {formData.image && (
                                        <button 
                                            onClick={() => setFormData({...formData, image: ''})}
                                            className="px-4 border border-red-200 text-red-600 hover:bg-red-50 rounded-sm"
                                            title="Remove Image"
                                        >
                                            <i className="fa-solid fa-trash"></i>
                                        </button>
                                    )}
                                </div>
                                
                                <input 
                                    className="w-full p-2 border border-gray-200 text-[10px] rounded-sm focus:border-gray-400 outline-none text-gray-400 bg-gray-50"
                                    value={formData.image}
                                    onChange={e => setFormData({...formData, image: e.target.value})}
                                    placeholder="Or paste an image URL here..."
                                />
                            </div>
                            
                            {formData.image && (
                                <div className="mt-2 h-40 w-full bg-gray-100 relative rounded-sm overflow-hidden border border-gray-200">
                                     <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Article Body</label>
                            <textarea 
                                className="w-full p-4 border border-gray-300 font-sans text-sm leading-relaxed rounded-sm focus:border-black outline-none min-h-[300px]"
                                value={formData.body}
                                onChange={e => setFormData({...formData, body: e.target.value})}
                                placeholder="Write your match report here..."
                            />
                        </div>

                         <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tags (Comma Separated)</label>
                            <input 
                                className="w-full p-3 border border-gray-300 text-sm font-bold rounded-sm focus:border-black outline-none"
                                value={tagsInput}
                                onChange={e => setTagsInput(e.target.value)}
                            />
                        </div>

                        <button 
                            onClick={handleSave}
                            className="w-full py-4 bg-black text-white font-display font-bold uppercase tracking-widest text-sm hover:bg-penrice-gold hover:text-black transition-colors"
                        >
                            Publish Article
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* Right Col: Helpers & Preview */}
        {selectedMatch && (
            <div className="space-y-6">
                {/* Result Card Preview */}
                <div className="bg-white p-4 border border-gray-200 rounded-sm shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Graphic Preview</h3>
                    <div className="transform scale-90 origin-top">
                        <ResultCard match={selectedMatch} />
                    </div>
                </div>

                {/* Smart Facts */}
                <div className="bg-penrice-navy/5 border border-penrice-navy/20 p-6 rounded-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <i className="fa-solid fa-lightbulb text-penrice-navy"></i>
                        <h3 className="text-xs font-bold text-penrice-navy uppercase tracking-widest">Match Facts & Prompts</h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">Click to insert into article.</p>
                    
                    <div className="space-y-2">
                        {facts.length === 0 && <span className="text-xs text-gray-400 italic">No specific highlights found.</span>}
                        {facts.map((fact, i) => (
                            <button 
                                key={i}
                                onClick={() => insertFact(fact)}
                                className="w-full text-left p-3 bg-white border border-gray-200 hover:border-penrice-navy hover:text-penrice-navy text-xs font-bold rounded-sm transition-colors shadow-sm"
                            >
                                {fact}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
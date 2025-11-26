import React, { useState } from 'react';
import { Match } from '../../types';
import { ResultCard } from './ResultCard';

export const NewsFeed = ({ matches }: { matches: Match[] }) => {
  // Filter only matches that have a report attached
  const reports = matches
    .filter(m => m.report)
    .sort((a, b) => (b.report?.publishedAt || 0) - (a.report?.publishedAt || 0));

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  if (reports.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center py-32 bg-gray-50 border border-dashed border-gray-300 rounded-sm">
              <i className="fa-regular fa-newspaper text-4xl text-gray-300 mb-4"></i>
              <h3 className="text-lg font-display font-bold text-gray-400 uppercase tracking-widest">No Match Reports Yet</h3>
              <p className="text-xs text-gray-400 mt-2">Check back after the final whistle!</p>
          </div>
      );
  }

  // If a specific article is open
  if (selectedMatch && selectedMatch.report) {
      const { report } = selectedMatch;
      return (
          <div className="animate-fade-in-up">
              <button 
                onClick={() => setSelectedMatch(null)}
                className="mb-6 flex items-center text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
              >
                  <i className="fa-solid fa-arrow-left mr-2"></i> Back to News
              </button>

              <article className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                  {/* Hero Image or Result Card */}
                  <div className="w-full bg-gray-100 border-b border-gray-200">
                      {report.image ? (
                          <div className="relative h-64 md:h-96 w-full">
                              <img src={report.image} alt={report.title} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                              <div className="absolute bottom-0 left-0 p-8 text-white">
                                  <div className="flex items-center gap-2 mb-3">
                                      <span className="bg-penrice-gold text-black text-[9px] font-bold px-2 py-1 uppercase">{selectedMatch.sport}</span>
                                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{new Date(report.publishedAt).toLocaleDateString()}</span>
                                  </div>
                                  <h1 className="text-3xl md:text-5xl font-display font-bold uppercase leading-none tracking-tight">{report.title}</h1>
                              </div>
                          </div>
                      ) : (
                          <div className="p-8 bg-gray-50">
                             <ResultCard match={selectedMatch} interactive={true} />
                             <h1 className="text-3xl md:text-5xl font-display font-bold uppercase leading-none tracking-tight mt-8 mb-2">{report.title}</h1>
                             <div className="flex items-center gap-2 text-gray-500">
                                <span className="text-[10px] font-bold uppercase tracking-widest">By {report.author}</span>
                                <span>•</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest">{new Date(report.publishedAt).toLocaleDateString()}</span>
                             </div>
                          </div>
                      )}
                  </div>

                  {/* Article Content */}
                  <div className="p-6 md:p-12 max-w-4xl mx-auto">
                      {/* If image was used as hero, show result card here */}
                      {report.image && (
                          <div className="mb-10 transform -rotate-1 hover:rotate-0 transition-transform duration-500">
                              <ResultCard match={selectedMatch} interactive={true} />
                          </div>
                      )}

                      <div className="prose prose-lg prose-headings:font-display prose-headings:uppercase prose-headings:font-bold max-w-none">
                          {report.body.split('\n').map((paragraph, i) => (
                              paragraph.trim() && <p key={i} className="mb-4 text-gray-800 leading-relaxed font-sans">{paragraph}</p>
                          ))}
                      </div>

                      {/* Footer Tags */}
                      <div className="mt-12 pt-8 border-t border-gray-100 flex flex-wrap gap-2">
                          <span className="text-xs font-bold text-gray-400 uppercase mr-2">Tags:</span>
                          {report.tags?.map(tag => (
                              <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-1 text-[10px] font-bold uppercase rounded-sm">#{tag}</span>
                          ))}
                      </div>
                  </div>
              </article>
          </div>
      );
  }

  const Featured = reports[0];
  const GridItems = reports.slice(1);

  return (
    <div className="space-y-8 animate-fade-in">
        {/* Featured Article */}
        <div 
            onClick={() => setSelectedMatch(Featured)}
            className="group cursor-pointer relative bg-black text-white overflow-hidden shadow-lg border-2 border-black"
        >
            <div className="absolute inset-0 opacity-40 group-hover:opacity-30 transition-opacity bg-gradient-to-r from-penrice-navy to-black"></div>
            {Featured.report?.image && (
                <img src={Featured.report.image} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700" alt="" />
            )}
            
            <div className="relative p-8 md:p-12 flex flex-col md:flex-row gap-8 items-start md:items-center">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="bg-penrice-gold text-black text-[9px] font-bold px-2 py-1 uppercase tracking-widest animate-pulse">Featured Match</span>
                        <span className="border border-white/30 text-white px-2 py-1 text-[9px] font-bold uppercase">{Featured.sport}</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-display font-bold uppercase leading-[0.9] mb-4 group-hover:text-penrice-gold transition-colors">{Featured.report?.title}</h2>
                    <p className="text-gray-300 font-medium line-clamp-2 max-w-xl mb-6">{Featured.report?.body}</p>
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest border-b border-penrice-gold pb-1">Read Report</span>
                </div>
                
                <div className="w-full md:w-1/3 transform md:rotate-2 group-hover:rotate-0 transition-transform duration-500">
                    <ResultCard match={Featured} small />
                </div>
            </div>
        </div>

        {/* Grid */}
        {GridItems.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {GridItems.map(m => (
                    <div 
                        key={m.id} 
                        onClick={() => setSelectedMatch(m)}
                        className="bg-white border border-gray-200 hover:border-black hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group flex flex-col h-full"
                    >
                        <div className="h-48 overflow-hidden relative bg-gray-100 border-b border-gray-100">
                            {m.report?.image ? (
                                <img src={m.report.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                            ) : (
                                <div className="p-4 transform scale-75 origin-top"><ResultCard match={m} small /></div>
                            )}
                            <div className="absolute top-2 left-2">
                                <span className="bg-black text-white text-[9px] font-bold px-2 py-1 uppercase">{m.sport}</span>
                            </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <h3 className="text-xl font-display font-bold uppercase leading-tight mb-3 group-hover:text-penrice-navy transition-colors line-clamp-2">{m.report?.title}</h3>
                            <p className="text-sm text-gray-500 line-clamp-3 mb-4 flex-1">{m.report?.body}</p>
                            <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-auto">
                                <span className="text-[9px] font-bold text-gray-400 uppercase">{m.report?.author}</span>
                                <span className="text-[9px] font-bold text-gray-400 uppercase">{new Date(m.report?.publishedAt || 0).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};
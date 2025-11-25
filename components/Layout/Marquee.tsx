import React from 'react';
import { LiveDot } from '../Shared';

export const Marquee = () => {
  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
  
  const content = (
    <div className="flex items-center gap-16 px-4">
      <span className="text-penrice-gold">/// BREAKING</span>
      <span className="flex items-center"><LiveDot /> LIVE FEED ACTIVE</span>
      <span>{dateStr}</span>
      <span>PENRICE ACADEMY SPORT</span>
    </div>
  );

  return (
    <div className="bg-black text-white text-[10px] font-bold py-2.5 overflow-hidden relative z-30 uppercase tracking-widest border-b border-white/10">
      <div className="whitespace-nowrap flex animate-marquee w-max">
        {content}
        {content}
        {content}
        {content}
      </div>
    </div>
  );
};
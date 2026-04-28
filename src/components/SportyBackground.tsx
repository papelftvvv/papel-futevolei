import React from 'react';

interface SportyBackgroundProps {
  children: React.ReactNode;
  topHeight?: string;
  bgColor?: string;
  dividerColor?: string;
}

export default function SportyBackground({ children, topHeight, bgColor, dividerColor }: SportyBackgroundProps) {
  return (
    <div className="relative min-h-screen w-full bg-black text-white overflow-x-hidden bg-grid-white">
      {/* Decorative Gradient Glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 -right-24 w-80 h-80 bg-white/5 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Optional Top Overlay to mimic the old design structure if needed */}
      {topHeight && (
        <div 
          className="absolute top-0 left-0 w-full bg-white/5 z-0" 
          style={{ height: topHeight }}
        ></div>
      )}

      {/* Content */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
}

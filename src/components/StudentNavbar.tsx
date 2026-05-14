import React from 'react';
import { Link } from 'react-router-dom';

interface StudentNavbarProps {
  activePage: 'home' | 'agenda' | 'perfil' | 'ranking';
}

export default function StudentNavbar({ activePage }: StudentNavbarProps) {
  const activeClass = "flex flex-col items-center justify-center bg-white text-black rounded-2xl px-5 py-2 scale-110 -translate-y-1 shadow-lg transition-all shrink-0";
  const inactiveClass = "flex flex-col items-center justify-center text-white/50 opacity-80 px-4 py-2 hover:text-white transition-colors shrink-0";
  const labelStyle: React.CSSProperties = { fontFamily: "'Orbitron', sans-serif", fontSize: '7px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' };

  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-2 pb-6 pt-3 bg-[#1A1A1A]/95 backdrop-blur-md z-50 rounded-t-3xl shadow-[0px_-10px_30px_rgba(0,0,0,0.3)] border-t border-white/10">
      <Link to="/student" className={activePage === 'home' ? activeClass : inactiveClass}>
        <span className="material-symbols-outlined text-sm" style={activePage === 'home' ? { fontVariationSettings: "'FILL' 1" } : undefined}>home</span>
        <span style={labelStyle}>Início</span>
      </Link>
      <Link to="/ranking" className={activePage === 'ranking' ? activeClass : inactiveClass}>
        <span className="material-symbols-outlined text-sm" style={activePage === 'ranking' ? { fontVariationSettings: "'FILL' 1" } : undefined}>workspace_premium</span>
        <span style={labelStyle}>Ranking</span>
      </Link>
      <Link to="/student/history" className={activePage === 'agenda' ? activeClass : inactiveClass}>
        <span className="material-symbols-outlined text-sm" style={activePage === 'agenda' ? { fontVariationSettings: "'FILL' 1" } : undefined}>history_edu</span>
        <span style={labelStyle}>Agenda</span>
      </Link>
      <Link to="/profile" className={activePage === 'perfil' ? activeClass : inactiveClass}>
        <span className="material-symbols-outlined text-sm" style={activePage === 'perfil' ? { fontVariationSettings: "'FILL' 1" } : undefined}>person</span>
        <span style={labelStyle}>Perfil</span>
      </Link>
    </nav>
  );
}

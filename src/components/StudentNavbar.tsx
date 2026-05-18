import React from 'react';
import { Link } from 'react-router-dom';

interface StudentNavbarProps {
  activePage: 'home' | 'agendar' | 'agenda' | 'perfil' | 'ranking' | 'my-bookings';
}

export default function StudentNavbar({ activePage }: StudentNavbarProps) {
  const activeClass = "flex flex-col items-center justify-center bg-primary text-on-primary rounded-2xl px-5 py-2 scale-110 -translate-y-1 shadow-lg transition-all shrink-0";
  const inactiveClass = "flex flex-col items-center justify-center text-on-surface-variant/60 px-4 py-2 hover:text-primary transition-colors shrink-0";
  const labelStyle: React.CSSProperties = { fontFamily: "'Orbitron', sans-serif", fontSize: '7px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' };

  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-2 pb-6 pt-3 bg-surface-container-highest/95 backdrop-blur-md z-50 rounded-t-3xl shadow-[0px_-10px_30px_rgba(0,0,0,0.3)] border-t border-outline-variant transition-colors duration-500">
      <Link to="/student" className={activePage === 'home' ? activeClass : inactiveClass}>
        <span className="material-symbols-outlined text-sm" style={activePage === 'home' ? { fontVariationSettings: "'FILL' 1" } : undefined}>home</span>
        <span style={labelStyle}>Início</span>
      </Link>
      <Link to="/book-class" className={activePage === 'agendar' ? activeClass : inactiveClass}>
        <span className="material-symbols-outlined text-sm" style={activePage === 'agendar' ? { fontVariationSettings: "'FILL' 1" } : undefined}>sports_volleyball</span>
        <span style={labelStyle}>Check-in</span>
      </Link>
      <Link to="/my-bookings" className={activePage === 'my-bookings' ? activeClass : inactiveClass}>
        <span className="material-symbols-outlined text-sm" style={activePage === 'my-bookings' ? { fontVariationSettings: "'FILL' 1" } : undefined}>calendar_month</span>
        <span style={labelStyle}>Meus Check-ins</span>
      </Link>
      <Link to="/ranking" className={activePage === 'ranking' ? activeClass : inactiveClass}>
        <span className="material-symbols-outlined text-sm" style={activePage === 'ranking' ? { fontVariationSettings: "'FILL' 1" } : undefined}>workspace_premium</span>
        <span style={labelStyle}>Ranking</span>
      </Link>
    </nav>
  );
}

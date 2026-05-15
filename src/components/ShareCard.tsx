import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUnit } from '../contexts/UnitContext';

interface ShareCardProps {
  isOpen: boolean;
  onClose: () => void;
  stats: {
    name: string;
    avatar: string;
    checkinsThisMonth: number;
    checkinsThisWeek: number;
    points: number;
    rank?: number;
  };
}

export default function ShareCard({ isOpen, onClose, stats }: ShareCardProps) {
  const { activeUnit } = useUnit();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="relative w-full max-w-[380px] aspect-[9/16] bg-surface rounded-[40px] overflow-hidden shadow-2xl border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[80px] opacity-20 ${activeUnit?.id === 'ctl' ? 'bg-white' : 'bg-primary'}`} />
            <div className={`absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-[80px] opacity-20 ${activeUnit?.id === 'ctl' ? 'bg-primary' : 'bg-primary/50'}`} />
          </div>

          <div className="relative h-full flex flex-col p-8 items-center text-center justify-between z-10">
            {/* Header */}
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <img 
                   src={activeUnit?.id === 'ctl' ? "/logo-ctl.png" : "/logo-complexo.png"} 
                   alt="Logo" 
                   className="h-10 object-contain brightness-0 invert"
                   onError={(e) => (e.currentTarget.style.display = 'none')}
                />
                <span className="font-headline font-black text-xl italic text-on-surface tracking-tighter">PAPEL <span className="text-primary">FUTEVÔLEI</span></span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-on-surface-variant">Check-in Realizado</p>
            </div>

            {/* Profile Info */}
            <div className="space-y-4">
              <div className="relative inline-block">
                <div className="w-28 h-28 rounded-full border-4 border-primary p-1 bg-surface shadow-xl">
                  <img 
                    src={stats.avatar || `https://ui-avatars.com/api/?name=${stats.name}&background=random`} 
                    className="w-full h-full rounded-full object-cover" 
                    alt={stats.name} 
                  />
                </div>
                <div className="absolute -bottom-2 right-0 bg-primary text-on-primary text-[10px] font-black px-3 py-1 rounded-full shadow-lg">
                   FERA
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-headline font-black text-3xl text-on-surface uppercase italic tracking-tighter leading-none">{stats.name.split(' ')[0]}</h3>
                <p className="text-[11px] font-bold text-primary uppercase tracking-widest">@papelfutevolei</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="w-full grid grid-cols-2 gap-4">
              <div className="bg-surface-container/30 backdrop-blur-xl border border-white/5 p-4 rounded-3xl text-center">
                <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Na Semana</p>
                <p className="text-3xl font-black text-on-surface">{stats.checkinsThisWeek}</p>
                <p className="text-[8px] font-bold text-primary uppercase mt-1">Check-ins</p>
              </div>
              <div className="bg-surface-container/30 backdrop-blur-xl border border-white/5 p-4 rounded-3xl text-center">
                <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1">No Mês</p>
                <p className="text-3xl font-black text-on-surface">{stats.checkinsThisMonth}</p>
                <p className="text-[8px] font-bold text-primary uppercase mt-1">Total</p>
              </div>
            </div>

            {/* Quote / Message */}
            <div className="bg-primary p-6 rounded-[32px] w-full shadow-lg shadow-primary/20">
               <p className="font-headline font-black text-xl text-on-primary italic leading-tight uppercase tracking-tighter">
                 "CONSTÂNCIA É A CHAVE. <br/>A META DE HOJE TÁ PAGA!"
               </p>
            </div>

            {/* Footer / Call to Action */}
            <div className="mb-4">
               <p className="text-[10px] font-bold text-on-surface-variant/60 italic">Tire um print e compartilhe sua evolução! 🚀</p>
            </div>
          </div>

          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

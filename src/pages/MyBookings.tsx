import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import SportyBackground from '../components/SportyBackground';
import TopAppBar from '../components/TopAppBar';
import StudentNavbar from '../components/StudentNavbar';
import { motion, AnimatePresence } from 'framer-motion';
import { useUnit } from '../contexts/UnitContext';

import ShareCard from '../components/ShareCard';

export default function MyBookings() {
  const navigate = useNavigate();
  const { activeUnit } = useUnit();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return navigate('/login');

      // Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      setProfile(profileData);

      if (!activeUnit) return;

      // Fetch ALL activity (past and future) for this unit
      const [bookingsRes, rentalsRes, dayUseRes] = await Promise.all([
        supabase
          .from('bookings')
          .select(`id, status, class:class_id (name, start_time, unit_id)`)
          .eq('student_id', user.id)
          .neq('status', 'cancelado'),
        supabase
          .from('court_rentals')
          .select('*')
          .eq('unit_id', activeUnit.id)
          .or(`student_id.eq.${user.id},participants.cs.{${user.id}}`)
          .neq('status', 'cancelado'),
        supabase
          .from('day_use_bookings')
          .select('*, day_use_offers!inner(unit_id)')
          .eq('student_id', user.id)
          .eq('day_use_offers.unit_id', activeUnit.id)
          .neq('status', 'cancelado')
      ]);

      const all = [
        ...(bookingsRes.data?.filter(b => b.class?.unit_id === activeUnit.id).map(b => ({
          id: b.id,
          date: b.class.start_time.split('T')[0],
          type: 'AULA',
          status: b.status
        })) || []),
        ...(rentalsRes.data?.map(r => ({
          id: r.id,
          date: r.rental_date, // Court rentals use 'rental_date'
          type: 'ALUGUEL',
          status: r.status
        })) || []),
        ...(dayUseRes.data?.map(d => ({
          id: d.id,
          date: d.booking_date || d.date, // Check which field is used for day use date
          type: 'DAYUSE',
          status: d.status
        })) || [])
      ];

      setActivities(all);

    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  }, [activeUnit, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calendar logic for Monthly View
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay(); 
    
    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push({ day: null, date: null });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayActivities = activities.filter(a => a.date === dateStr);
      days.push({ 
        day: i, 
        date: dateStr,
        hasActivity: dayActivities.length > 0,
        activities: dayActivities
      });
    }
    
    return days;
  }, [currentDate, activities]);

  // Annual View logic
  const annualData = useMemo(() => {
    const year = currentDate.getFullYear();
    const months = [];
    
    for (let m = 0; m < 12; m++) {
      const firstDay = new Date(year, m, 1);
      const lastDay = new Date(year, m + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDay = firstDay.getDay();
      
      const days = [];
      for (let i = 0; i < startingDay; i++) days.push({ day: null, active: false });
      for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        days.push({ 
          day: i,
          active: activities.some(a => a.date === dateStr)
        });
      }
      
      months.push({
        name: new Date(year, m, 1).toLocaleString('pt-BR', { month: 'short' }).replace('.', ''),
        days,
        count: activities.filter(a => a.date.startsWith(`${year}-${String(m + 1).padStart(2, '0')}`)).length
      });
    }
    return months;
  }, [currentDate, activities]);

  const nextDate = () => {
    if (viewMode === 'month') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    else setCurrentDate(new Date(currentDate.getFullYear() + 1, 0));
  };
  
  const prevDate = () => {
    if (viewMode === 'month') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    else setCurrentDate(new Date(currentDate.getFullYear() - 1, 0));
  };

  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });
  const totalCheckins = activities.length;

  // Calculate stats for ShareCard
  const shareStats = useMemo(() => {
    const today = new Date();
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay());
    const weekStr = firstDayOfWeek.toISOString().split('T')[0];

    const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    return {
      name: profile?.full_name || 'Atleta',
      avatar: profile?.avatar_url || '',
      checkinsThisMonth: activities.filter(a => a.date.startsWith(monthStr)).length,
      checkinsThisWeek: activities.filter(a => a.date >= weekStr).length,
      points: profile?.points || 0
    };
  }, [activities, profile]);

  return (
    <SportyBackground topHeight="20%">
      <div className="bg-surface text-on-surface min-h-screen pb-32 font-body relative overflow-hidden">
        <TopAppBar 
          title="HISTÓRICO" 
          avatarSrc={profile?.avatar_url} 
          avatarAlt={profile?.full_name} 
        />

        <main className="mt-20 px-6 max-w-2xl mx-auto space-y-6 relative z-10">
          <section className="flex justify-between items-end">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em]">
                    <span className="material-symbols-outlined text-sm">history</span>
                    Frequência na Unidade
                </div>
                <h2 className="font-headline text-4xl font-black tracking-tighter text-on-surface">Meus <span className="text-primary">Check-ins</span></h2>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsShareModalOpen(true)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm active:scale-95 transition-all"
                title="Compartilhar Conquista"
              >
                <span className="material-symbols-outlined font-black">share</span>
              </button>
              <div className="bg-surface-bright px-4 py-2 rounded-2xl border border-outline-variant shadow-sm text-center">
                <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none mb-1">Total</p>
                <p className="text-xl font-black text-primary leading-none">{totalCheckins}</p>
              </div>
            </div>
          </section>

          {/* Seletor de Visão */}
          <div className="flex p-1.5 bg-surface-container-low rounded-2xl border border-outline-variant/30 w-fit mx-auto">
             <button 
               onClick={() => setViewMode('month')}
               className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'month' ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:text-on-surface'}`}
             >
               Mensal
             </button>
             <button 
               onClick={() => setViewMode('year')}
               className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'year' ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:text-on-surface'}`}
             >
               Anual
             </button>
          </div>

          <AnimatePresence mode="wait">
            {viewMode === 'month' ? (
              <motion.section 
                key="month"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-surface-bright rounded-[40px] border-2 border-outline-variant shadow-xl overflow-hidden"
              >
                <div className="p-6 bg-surface-container/50 border-b border-outline-variant flex justify-between items-center">
                  <button onClick={prevDate} className="w-10 h-10 flex items-center justify-center text-primary active:scale-90 transition-all"><span className="material-symbols-outlined font-black">chevron_left</span></button>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{currentDate.getFullYear()}</p>
                    <h3 className="font-headline font-black text-xl text-on-surface uppercase italic tracking-tighter">{monthName}</h3>
                  </div>
                  <button onClick={nextDate} className="w-10 h-10 flex items-center justify-center text-primary active:scale-90 transition-all"><span className="material-symbols-outlined font-black">chevron_right</span></button>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-7 mb-4">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                      <div key={i} className="text-center text-[10px] font-black text-on-surface-variant/40">{d}</div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-y-2">
                    {calendarData.map((d, i) => (
                      <div key={i} className="aspect-square flex flex-col items-center justify-center relative">
                        {d.day && (
                          <>
                            <span className={`text-xs font-bold ${d.hasActivity ? 'text-primary' : 'text-on-surface-variant/60'}`}>
                              {d.day}
                            </span>
                            {d.hasActivity && (
                              <motion.div 
                                layoutId="indicator"
                                className="absolute inset-2 border-2 border-primary rounded-xl -z-10 bg-primary/5"
                              />
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.section>
            ) : (
              <motion.section 
                key="year"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center bg-surface-bright p-4 rounded-3xl border border-outline-variant shadow-sm">
                   <button onClick={prevDate} className="w-10 h-10 flex items-center justify-center text-primary"><span className="material-symbols-outlined font-black">chevron_left</span></button>
                   <h3 className="font-headline font-black text-3xl text-on-surface italic tracking-tighter">{currentDate.getFullYear()}</h3>
                   <button onClick={nextDate} className="w-10 h-10 flex items-center justify-center text-primary"><span className="material-symbols-outlined font-black">chevron_right</span></button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {annualData.map((m, idx) => (
                    <div key={idx} className="bg-surface-bright p-4 rounded-[32px] border border-outline-variant shadow-sm hover:border-primary/50 transition-colors">
                      <div className="flex justify-between items-center mb-3 px-1">
                        <span className="text-[10px] font-black text-on-surface uppercase tracking-widest">{m.name}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${m.count > 0 ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'bg-surface-container text-on-surface-variant/40'}`}>
                          {m.count}
                        </span>
                      </div>
                      <div className="grid grid-cols-7 gap-1.5">
                        {m.days.map((d, i) => (
                          <div 
                            key={i} 
                            className={`w-2 h-2 rounded-full transition-all ${!d.day ? 'opacity-0' : d.active ? 'bg-primary scale-110 shadow-[0_0_8px_rgba(var(--primary-rgb),0.4)]' : 'bg-on-surface-variant/25 border border-on-surface-variant/5'}`} 
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Detalhes (Apenas na visão mensal para não poluir) */}
          {viewMode === 'month' && (
            <div className="space-y-4">
               <h4 className="font-headline font-black text-xs text-on-surface-variant uppercase tracking-[0.2em] px-2">Detalhes de {monthName}</h4>
               {calendarData.filter(d => d.hasActivity).length > 0 ? (
                 calendarData.filter(d => d.hasActivity).reverse().map(d => (
                   <div key={d.date} className="bg-surface-bright p-4 rounded-2xl border border-outline-variant flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                         <span className="material-symbols-outlined text-xl font-bold">check_circle</span>
                      </div>
                      <div className="flex-1">
                         <p className="text-[10px] font-black text-on-surface-variant uppercase">{d.day} de {monthName}</p>
                         <p className="font-bold text-sm text-on-surface">
                           {d.activities.map(a => a.type).join(' + ')} REALIZADO
                         </p>
                      </div>
                   </div>
                 ))
               ) : (
                 <div className="p-8 text-center bg-surface-bright rounded-3xl border border-dashed border-outline-variant">
                    <p className="text-xs font-bold text-on-surface-variant">Nenhum registro neste mês.</p>
                 </div>
               )}
            </div>
          )}
          {/* Share Modal */}
          <ShareCard 
            isOpen={isShareModalOpen} 
            onClose={() => setIsShareModalOpen(false)} 
            stats={shareStats}
          />
        </main>

        <StudentNavbar activePage="my-bookings" />
      </div>
    </SportyBackground>
  );
}

import React, { useState, useEffect } from 'react';
import TopAppBar from '../components/TopAppBar';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';

export default function AdminAnalytics() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activePlans: 0,
    totalBookings: 0,
    pendingApprovals: 0,
    pointsDistributed: 0,
    bookingsByDay: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      setLoading(true);

      const { count: studentsCount } = await supabase
        .from('profiles').select('*', { count: 'exact', head: true })
        .not('role', 'eq', 'admin').not('role', 'eq', 'teacher');

      const { count: activePlansCount } = await supabase
        .from('profiles').select('*', { count: 'exact', head: true })
        .eq('plan_status', 'ativo');

      const { count: bookingsCount } = await supabase
        .from('bookings').select('*', { count: 'exact', head: true })
        .neq('status', 'cancelado');

      const { count: pendingCount } = await supabase
        .from('profiles').select('*', { count: 'exact', head: true })
        .eq('plan_status', 'pendente');

      const { data: pointsData } = await supabase
        .from('loyalty_points').select('balance');
      const totalPoints = pointsData?.reduce((acc, curr) => acc + curr.balance, 0) || 0;

      const { data: bookingsByDay } = await supabase
        .from('bookings').select('created_at');
      
      const dayStats = [0, 0, 0, 0, 0, 0, 0];
      bookingsByDay?.forEach(b => {
        const day = new Date(b.created_at).getDay();
        dayStats[day]++;
      });

      setStats({
        totalStudents: studentsCount || 0,
        activePlans: activePlansCount || 0,
        totalBookings: bookingsCount || 0,
        pendingApprovals: pendingCount || 0,
        pointsDistributed: totalPoints,
        bookingsByDay: dayStats
      });

    } catch (error: any) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-4">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        <p className="font-headline font-bold text-white animate-pulse">RECOLHENDO DADOS DO CLUBE...</p>
    </div>
  );

  const maxBookings = Math.max(...stats.bookingsByDay, 1);
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="bg-black font-body text-white antialiased min-h-screen pb-32">
      <TopAppBar title="INDICADORES" showBackButton />

      <main className="pt-24 px-6 max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="font-headline font-black text-3xl tracking-tighter leading-none text-white">Dashboard Executivo</h1>
          <p className="text-white/50 text-sm font-medium mt-1">Acompanhe a saúde do PAPEL FUTEVÔLEI em tempo real.</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Alunos Totais" value={stats.totalStudents} icon="groups" color="bg-white" iconColor="text-black" />
          <StatCard title="Planos Ativos" value={stats.activePlans} icon="verified" color="bg-white" iconColor="text-black" />
          <StatCard title="Check-ins" value={stats.totalBookings} icon="sports_volleyball" color="bg-orange-500" iconColor="text-white" />
          <StatCard title="Aguardando" value={stats.pendingApprovals} icon="pending" color="bg-red-500" iconColor="text-white" />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Booking Frequency Chart */}
          <div className="bg-zinc-900 border border-white/10 p-8 rounded-[40px] shadow-sm space-y-6">
            <h3 className="font-headline font-bold text-lg flex items-center gap-2 text-white">
              <span className="material-symbols-outlined text-white">analytics</span>
              Adesão por Dia
            </h3>
            <div className="flex items-end justify-between h-40 gap-2">
              {stats.bookingsByDay.map((count, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${(count / maxBookings) * 100}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className={`w-full max-w-[20px] rounded-t-lg ${i === new Date().getDay() ? 'bg-white' : 'bg-white/20'}`}
                  ></motion.div>
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter">{dayNames[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Loyalty Distribution */}
          <div className="bg-zinc-900 border border-white/10 p-8 rounded-[40px] shadow-lg text-white space-y-6">
            <div className="flex justify-between items-start">
               <div>
                 <h3 className="font-headline font-black text-2xl leading-tight">Sistema de Fidelidade</h3>
                 <p className="text-white/50 text-xs font-medium">Economia de pontos circulando no app</p>
               </div>
               <span className="material-symbols-outlined text-4xl opacity-20">loyalty</span>
            </div>
            <div className="space-y-2">
                <div className="text-5xl font-headline font-black leading-none">{stats.pointsDistributed.toLocaleString()}</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">PONTOS TOTAIS EMITIDOS</div>
            </div>
            <button className="w-full bg-white/10 backdrop-blur-md py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10">Ver Relatório de Resgates</button>
          </div>
        </div>

        {/* Growth Highlight */}
        <section className="bg-zinc-900 border border-white/10 p-8 rounded-[40px] flex items-center justify-between">
           <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white/10 rounded-[24px] flex items-center justify-center text-white">
                 <span className="material-symbols-outlined text-3xl">trending_up</span>
              </div>
              <div>
                 <h4 className="font-headline font-bold text-xl text-white">Taxa de Conversão</h4>
                 <p className="text-white/50 text-xs font-medium">
                    {stats.totalStudents > 0 ? ((stats.activePlans / stats.totalStudents) * 100).toFixed(1) : 0}% dos cadastros são alunos pagantes ativos.
                 </p>
              </div>
           </div>
           <div className="hidden md:block">
              <div className="text-3xl font-headline font-black text-white">
                +12% <span className="text-[10px] font-bold text-white/40 align-middle">ESTE MÊS</span>
              </div>
           </div>
        </section>

      </main>
    </div>
  );
}

function StatCard({ title, value, icon, color, iconColor }: any) {
  return (
    <div className="bg-zinc-900 border border-white/10 p-6 rounded-[32px] shadow-sm space-y-3 transition-transform hover:-translate-y-1">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-sm`}>
        <span className={`material-symbols-outlined text-xl ${iconColor}`}>{icon}</span>
      </div>
      <div>
        <div className="text-2xl font-headline font-black text-white leading-none">{value.toLocaleString()}</div>
        <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">{title}</div>
      </div>
    </div>
  );
}

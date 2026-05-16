import React, { useState, useEffect } from 'react';
import TopAppBar from '../components/TopAppBar';
import TeacherNavbar from '../components/TeacherNavbar';
import MonthCalendar from '../components/MonthCalendar';
import { supabase } from '../lib/supabase';
import { useUnit } from '../contexts/UnitContext';

export default function ScheduleView() {
  const { units } = useUnit();
  const [profile, setProfile] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          setProfile(data);
        }

        // Buscar aulas existentes para o calendário
        const { data: classesData } = await supabase.from('classes').select('*');
        setClasses(classesData || []);
      } catch (error) {
        console.error('Error fetching schedule data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen pb-32">
      <TopAppBar 
        title="GRADE DE AULAS" 
        avatarSrc={profile?.avatar_url || undefined}
        showBackButton
      />

      <main className="relative min-h-screen pt-24 pb-8 px-6 max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className="font-headline font-extrabold text-4xl text-on-surface tracking-tight leading-none mb-2">Consulta de Grade</h2>
          <p className="text-on-surface-variant font-medium text-sm">VISUALIZAÇÃO MENSAL</p>
        </div>

        {loading ? (
          <div className="text-center text-white/50 py-12">Carregando calendário...</div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <MonthCalendar 
              classes={classes} 
              units={units}
            />
          </div>
        )}
      </main>
      <TeacherNavbar activePage="agenda" />
    </div>
  );
}

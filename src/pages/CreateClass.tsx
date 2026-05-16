import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopAppBar from '../components/TopAppBar';
import TeacherNavbar from '../components/TeacherNavbar';
import MonthCalendar from '../components/MonthCalendar';
import { supabase } from '../lib/supabase';
import { useUnit } from '../contexts/UnitContext';

export default function CreateClass() {
  const navigate = useNavigate();
  const { activeUnit, units } = useUnit();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  
  const [name, setName] = useState('Futevôlei');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [capacity, setCapacity] = useState(8);
  const [court, setCourt] = useState('Quadra 1');
  const [unitId, setUnitId] = useState(activeUnit?.id || '');
  const [wristbandLevel, setWristbandLevel] = useState(1);
  const [isRecurring, setIsRecurring] = useState(false);
  const [finalDate, setFinalDate] = useState('');

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
        
        if (data && data.role !== 'admin') {
          alert('Apenas administradores podem acessar esta página.');
          navigate('/');
          return;
        }
      }
      
      // Unidades são pegas do contexto UnitContext
      if (!unitId && units && units.length > 0) setUnitId(units[0].id);

      // Buscar aulas existentes para o calendário
      const { data: classesData } = await supabase.from('classes').select('*');
      setClasses(classesData || []);
    }
    fetchData();
  }, [units, unitId, navigate]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const startDateTime = new Date(`${date}T${time}`);
      
      const classesToInsert = [];

      if (isRecurring && finalDate) {
        const endDateObj = new Date(`${finalDate}T23:59:59`);
        let currentStartDate = new Date(startDateTime);

        while (currentStartDate <= endDateObj) {
          classesToInsert.push({
            teacher_id: user.id,
            name,
            start_time: currentStartDate.toISOString(),
            capacity,
            court,
            unit_id: unitId,
            wristband_level: wristbandLevel
          });

          // Add 7 days
          currentStartDate.setDate(currentStartDate.getDate() + 7);
        }
      } else {
        classesToInsert.push({
          teacher_id: user.id,
          name,
          start_time: startDateTime.toISOString(),
          capacity,
          court,
          unit_id: unitId,
          wristband_level: wristbandLevel
        });
      }

      const { error } = await supabase.from('classes').insert(classesToInsert);

      if (error) throw error;
      alert(`Aula(s) criada(s) com sucesso! Total: ${classesToInsert.length}`);
      
      // Atualizar lista de aulas
      const { data: classesData } = await supabase.from('classes').select('*');
      setClasses(classesData || []);
      
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen pb-32">
      <TopAppBar 
        title="PAPEL FUTEVÔLEI BEACH CLUB" 
        avatarSrc={profile?.avatar_url || undefined}
        showBackButton
      />

      <main className="relative min-h-screen pt-24 pb-8 px-6 max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className="font-headline font-extrabold text-4xl text-on-surface tracking-tight leading-none mb-2">Gestão de Aulas</h2>
          <p className="text-on-surface-variant font-medium text-sm">PORTAL DO PROFESSOR</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário (1/3 do espaço no desktop) */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900 rounded-[32px] border border-white/10 p-6 space-y-6">
              <h3 className="font-headline font-black text-xl uppercase text-white mb-4">Nova Aula</h3>
              <form onSubmit={handleCreate} className="space-y-6">
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">Nome/Nível da Aula</label>
                    <input 
                      value={name} onChange={e => setName(e.target.value)}
                      className="w-full h-14 px-6 rounded-2xl bg-zinc-900 border border-white/10 text-white focus:ring-2 focus:ring-primary transition-all font-bold"
                      placeholder="Ex: Futevôlei Iniciante" required
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">Data</label>
                       <input 
                        type="date" value={date} onChange={e => setDate(e.target.value)}
                        className="w-full h-14 px-6 rounded-2xl bg-zinc-900 border border-white/10 text-white focus:ring-2 focus:ring-primary transition-all font-bold"
                        required
                       />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">Hora</label>
                      <input 
                        type="time" value={time} onChange={e => setTime(e.target.value)}
                        className="w-full h-14 px-6 rounded-2xl bg-zinc-900 border border-white/10 text-white focus:ring-2 focus:ring-primary transition-all font-bold"
                        required
                      />
                    </div>
                </div>
                
                {/* Recorrência */}
                <div className="flex items-center gap-2 ml-1">
                  <input 
                    type="checkbox" 
                    id="recurring" 
                    checked={isRecurring} 
                    onChange={e => setIsRecurring(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="recurring" className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Aula Recorrente</label>
                </div>

                {isRecurring && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">Data Final da Recorrência</label>
                    <input 
                      type="date" value={finalDate} onChange={e => setFinalDate(e.target.value)}
                      className="w-full h-14 px-6 rounded-2xl bg-zinc-900 border border-white/10 text-white focus:ring-2 focus:ring-primary transition-all font-bold"
                      required={isRecurring}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">Unidade</label>
                       <select 
                        value={unitId} onChange={e => setUnitId(e.target.value)}
                        className="w-full h-14 px-6 rounded-2xl bg-zinc-900 border border-white/10 text-white focus:ring-2 focus:ring-primary transition-all font-bold"
                       >
                         {units.map(u => (
                           <option key={u.id} value={u.id}>{u.name}</option>
                         ))}
                       </select>
                    </div>
                    <div>
                       <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">Quadra</label>
                       <select 
                         value={court} onChange={e => setCourt(e.target.value)}
                         className="w-full h-14 px-6 rounded-2xl bg-zinc-900 border border-white/10 text-white focus:ring-2 focus:ring-primary transition-all font-bold"
                       >
                         <option value="Quadra 1">Quadra 1</option>
                         <option value="Quadra 2">Quadra 2</option>
                         <option value="Quadra 3">Quadra 3 (Central)</option>
                       </select>
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">Vagas (Capacidade)</label>
                    <input 
                      type="number" value={capacity} onChange={e => setCapacity(Number(e.target.value))}
                      className="w-full h-14 px-6 rounded-2xl bg-zinc-900 border border-white/10 text-white focus:ring-2 focus:ring-primary transition-all font-bold"
                      min="1" max="20" required
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">Nível da Pulseira Requerido</label>
                    <select 
                      value={wristbandLevel} onChange={e => setWristbandLevel(parseInt(e.target.value))}
                      className="w-full h-14 px-6 rounded-2xl bg-zinc-900 border border-white/10 text-white focus:ring-2 focus:ring-primary transition-all font-bold"
                    >
                      <option value={1}>⬜ Branco (Iniciante N1)</option>
                      <option value={2}>🩶 Cinza (Iniciante N2)</option>
                      <option value={3}>🔵 Azul (Intermediário N1)</option>
                      <option value={4}>🟡 Amarelo (Intermediário N2)</option>
                      <option value={5}>🟠 Laranja (Avançado N1)</option>
                      <option value={6}>🟢 Verde (Avançado N2)</option>
                      <option value={7}>🔴 Vermelho (Pro N1)</option>
                      <option value={8}>⬛ Preto (Profissional)</option>
                    </select>
                </div>

                <button 
                  type="submit" disabled={loading}
                  className="w-full bg-primary py-4 rounded-2xl text-on-primary font-headline font-extrabold uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? 'CRIANDO...' : 'CRIAR E PUBLICAR AULA'}
                  <span className="material-symbols-outlined">send</span>
                </button>
              </form>
            </div>
          </div>

          {/* Calendário (2/3 do espaço no desktop) */}
          <div className="lg:col-span-2">
            <MonthCalendar 
              classes={classes} 
              units={units}
              onSelectDate={(selectedDate) => setDate(selectedDate)}
            />
          </div>
        </div>
      </main>
      <TeacherNavbar activePage="agenda" />
    </div>
  );
}

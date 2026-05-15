import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import TopAppBar from '../components/TopAppBar';
import StudentNavbar from '../components/StudentNavbar';
import SportyBackground from '../components/SportyBackground';
import { motion } from 'framer-motion';

interface RankingUser {
  user_id: string;
  full_name: string;
  avatar_url: string;
  points_earned: number;
}

const WRISTBANDS = [
  { level: 1, name: 'Branco', color: 'bg-white text-black border border-white/20' },
  { level: 2, name: 'Cinza', color: 'bg-zinc-500 text-white' },
  { level: 3, name: 'Azul', color: 'bg-blue-600 text-white' },
  { level: 4, name: 'Amarelo', color: 'bg-yellow-500 text-black' },
  { level: 5, name: 'Laranja', color: 'bg-orange-500 text-white' },
  { level: 6, name: 'Verde', color: 'bg-green-600 text-white' },
  { level: 7, name: 'Vermelho', color: 'bg-red-600 text-white' },
  { level: 8, name: 'Preto', color: 'bg-black text-white border border-[#D4AF37]' },
];

export default function Ranking() {
  const navigate = useNavigate();
  const [ranking, setRanking] = useState<(RankingUser & { wristband_level?: number })[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0); // 0 = Geral, 1 = Branco, etc.

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
          if (profileData) setProfile(profileData);
          else {
            setProfile({
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
              avatar_url: user.user_metadata?.avatar_url
            });
          }
        }

        // Busca todos os perfis (ou top 100) para poder filtrar por cor
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, points, wristband_level')
          .order('points', { ascending: false })
          .limit(100);

        if (profilesError) throw profilesError;

        const formattedData = (profilesData || []).map(p => ({
          user_id: p.id,
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          points_earned: p.points || 0,
          wristband_level: p.wristband_level || 1
        }));

        setRanking(formattedData);
      } catch (error) {
        console.error('Error fetching ranking:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const currentMonth = new Date().toLocaleString('pt-BR', { month: 'long' });
  const capitalizedMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);

  const tabs = [
    { id: 0, name: 'Geral', color: 'bg-primary text-on-primary' },
    ...WRISTBANDS.map(w => ({ id: w.level, name: w.name, color: w.color }))
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-white uppercase animate-pulse bg-black">Calculando Pódio PAPEL FUTEVÔLEI...</div>;

  return (
    <SportyBackground topHeight="20%">
      <div className="pb-32 min-h-screen font-body relative text-white bg-black">
        <TopAppBar title="RANKING MENSAL" avatarSrc={profile?.avatar_url} avatarAlt={profile?.full_name || "Perfil"} />

        <main className="mt-20 space-y-6">
          {/* Header Title */}
          <div className="text-center space-y-2 px-6">
            <h2 className="font-headline font-black text-4xl text-white uppercase italic tracking-tighter shadow-sm">
              RANKING <span className="text-primary">DE ELITE</span>
            </h2>
            <p className="text-white/50 font-black uppercase text-[10px] tracking-[0.3em] font-body">
              TOP FERAS - DESLIZE PARA O LADO
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border border-white/10
                  ${activeTab === tab.id 
                    ? `${tab.color} shadow-lg scale-105` 
                    : 'bg-zinc-900 text-white/60'
                  }
                `}
                onClick={() => {
                  setActiveTab(tab.id);
                  const el = document.getElementById(`ranking-list-${tab.id}`);
                  el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* Horizontal Scroll Container */}
          <div 
            className="overflow-x-auto flex snap-x snap-mandatory no-scrollbar px-6 gap-6"
          >
            {tabs.map(tab => {
                const filteredRanking = tab.id === 0 
                  ? ranking 
                  : ranking.filter(u => u.wristband_level === tab.id);
                
                const tabTop3 = filteredRanking.slice(0, 3);
                const tabOthers = filteredRanking.slice(3);

                return (
                  <div 
                    key={tab.id} 
                    id={`ranking-list-${tab.id}`}
                    className="w-[calc(100vw-3rem)] max-w-2xl shrink-0 snap-center space-y-6"
                  >
                    {/* Podium */}
                    <div className="flex items-end justify-center gap-2 pt-8 min-h-[180px]">
                      {/* 2nd Place */}
                      {tabTop3[1] && (
                        <div className="flex flex-col items-center flex-1">
                          <div className="relative">
                              <img src={tabTop3[1].avatar_url || 'https://via.placeholder.com/150'} className="w-16 h-16 rounded-full border-4 border-slate-300 object-cover shadow-lg" />
                              <div className="absolute -top-2 -right-2 bg-slate-300 text-slate-800 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">2</div>
                          </div>
                          <p className="mt-2 text-[10px] font-bold text-white/70 uppercase text-center truncate w-full">{tabTop3[1].full_name.split(' ')[0]}</p>
                          <div className="bg-slate-300 w-full h-14 rounded-t-2xl mt-2 flex flex-col items-center justify-center text-slate-800 shadow-inner">
                              <span className="text-xs font-black">{tabTop3[1].points_earned}</span>
                              <span className="text-[10px] font-bold uppercase opacity-60">pts</span>
                          </div>
                        </div>
                      )}

                      {/* 1st Place */}
                      {tabTop3[0] && (
                        <div className="flex flex-col items-center flex-1 z-10">
                          <div className="relative">
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                                  <span className="material-symbols-outlined text-primary text-3xl animate-bounce">workspace_premium</span>
                              </div>
                              <img src={tabTop3[0].avatar_url || 'https://via.placeholder.com/150'} className="w-20 h-20 rounded-full border-4 border-primary object-cover shadow-xl" />
                              <div className="absolute -top-2 -right-2 bg-primary text-on-primary w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-lg">1</div>
                          </div>
                          <p className="mt-2 text-xs font-black text-white uppercase text-center truncate w-full">{tabTop3[0].full_name.split(' ')[0]}</p>
                          <div className="bg-primary w-full h-20 rounded-t-2xl mt-2 flex flex-col items-center justify-center text-on-primary shadow-2xl">
                              <span className="text-xl font-black">{tabTop3[0].points_earned}</span>
                              <span className="text-[10px] font-bold uppercase opacity-80">pontos</span>
                          </div>
                        </div>
                      )}

                      {/* 3rd Place */}
                      {tabTop3[2] && (
                        <div className="flex flex-col items-center flex-1">
                          <div className="relative">
                              <img src={tabTop3[2].avatar_url || 'https://via.placeholder.com/150'} className="w-14 h-14 rounded-full border-4 border-orange-400 object-cover shadow-lg" />
                              <div className="absolute -top-2 -right-2 bg-orange-400 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">3</div>
                          </div>
                          <p className="mt-2 text-[10px] font-bold text-white/70 uppercase text-center truncate w-full">{tabTop3[2].full_name.split(' ')[0]}</p>
                          <div className="bg-orange-400 w-full h-10 rounded-t-2xl mt-2 flex flex-col items-center justify-center text-white shadow-inner">
                              <span className="text-xs font-black">{tabTop3[2].points_earned}</span>
                              <span className="text-[10px] font-bold uppercase opacity-60">pts</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* List */}
                    <div className="bg-zinc-900 rounded-[32px] border border-white/10 overflow-hidden mb-6">
                      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                          <h3 className="font-headline font-black text-xs uppercase tracking-[0.2em] text-white/60">{tab.name}</h3>
                          <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase">Ranking</span>
                      </div>

                      <div className="divide-y divide-white/5">
                          {tabOthers.length > 0 ? tabOthers.map((user, index) => {
                              const isMe = user.user_id === currentUser?.id;
                              return (
                                  <div key={user.user_id} className={`flex items-center gap-4 p-4 transition-colors ${isMe ? 'bg-primary/10' : ''}`}>
                                      <span className="w-6 text-sm font-black text-white/40">#{index + 4}</span>
                                      <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10">
                                          <img src={user.avatar_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                                      </div>
                                      <div className="flex-1">
                                          <p className={`font-bold text-sm ${isMe ? 'text-primary' : 'text-white'}`}>
                                              {user.full_name}
                                              {isMe && <span className="ml-2 text-[9px] font-black bg-primary/20 text-primary px-1.5 py-0.5 rounded italic">VOCÊ</span>}
                                          </p>
                                      </div>
                                      <div className="text-right">
                                          <p className="text-sm font-black text-white">{user.points_earned}</p>
                                          <p className="text-[9px] font-bold text-white/40 uppercase">pts</p>
                                      </div>
                                  </div>
                              );
                          }) : (
                              <div className="p-10 text-center text-white/40 italic font-medium uppercase text-xs tracking-widest leading-loose">
                                  {tabTop3.length === 0 ? 'Ninguém nesse nível ainda!' : 'Fim do ranking.'}
                              </div>
                          )}
                      </div>
                    </div>
                  </div>
                );
            })}
          </div>

          {/* Mini Info Card */}
          <div className="bg-zinc-900 p-6 rounded-[28px] border border-white/10 flex items-start gap-4 mx-6">
              <span className="material-symbols-outlined text-primary text-3xl">info</span>
              <div className="space-y-1">
                  <h4 className="font-headline font-bold text-primary text-sm uppercase">Como subir no Ranking?</h4>
                  <p className="text-[10px] font-medium text-white/50 leading-relaxed uppercase">
                      Agende aulas, participe de aluguéis e Day Use. Cada interação gera pontos! O ranking é atualizado em tempo real.
                  </p>
              </div>
          </div>
        </main>

        <StudentNavbar activePage="ranking" />
      </div>
    </SportyBackground>
  );
}

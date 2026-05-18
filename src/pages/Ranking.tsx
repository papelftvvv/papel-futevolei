import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import TopAppBar from '../components/TopAppBar';
import StudentNavbar from '../components/StudentNavbar';
import SportyBackground from '../components/SportyBackground';
import { motion, AnimatePresence } from 'framer-motion';
import { useUnit } from '../contexts/UnitContext';

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

const BORDER_COLORS: { [key: number]: string } = {
  1: 'border-white',
  2: 'border-zinc-500',
  3: 'border-blue-600',
  4: 'border-yellow-500',
  5: 'border-orange-500',
  6: 'border-green-600',
  7: 'border-red-600',
  8: 'border-[#D4AF37]'
};

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? '100%' : '-100%',
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (dir: number) => ({
    x: dir < 0 ? '100%' : '-100%',
    opacity: 0
  })
};

export default function Ranking() {
  const navigate = useNavigate();
  const { activeUnit } = useUnit();
  const [ranking, setRanking] = useState<(RankingUser & { wristband_level?: number })[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0); // 0 = Geral, 1 = Branco, etc.
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [direction, setDirection] = useState(1);


  // State para Grupos Privados
  const [groups, setGroups] = useState<any[]>([]);
  const [activeGroupRanking, setActiveGroupRanking] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupPassword, setGroupPassword] = useState('');
  const [isViewingGroup, setIsViewingGroup] = useState(false);
  const [selectedGroupName, setSelectedGroupName] = useState('');

  // Busca dados do ranking apenas uma vez ao montar o componente
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
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

        // Busca os top 100 pontos da tabela loyalty_points
        const { data: pointsData, error: pointsError } = await supabase
          .from('loyalty_points')
          .select('user_id, balance')
          .order('balance', { ascending: false })
          .limit(100);

        if (pointsError) throw pointsError;

        if (pointsData && pointsData.length > 0) {
          const userIds = pointsData.map(p => p.user_id);
          
          // Busca os perfis desses usuários
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, wristband_level')
            .in('id', userIds);

          if (profilesError) throw profilesError;

          const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));

          const formattedData = pointsData.map(p => {
            const prof = profilesMap.get(p.user_id);
            return {
              user_id: p.user_id,
              full_name: prof?.full_name || 'Desconhecido',
              avatar_url: prof?.avatar_url,
              points_earned: p.balance || 0,
              wristband_level: prof?.wristband_level || 1
            };
          });

          setRanking(formattedData);
        } else {
          setRanking([]);
        }
      } catch (error) {
        console.error('Error fetching ranking:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Busca os grupos do usuário somente quando currentUser ficar disponível
  useEffect(() => {
    if (currentUser) {
      fetchGroups();
    }
  }, [currentUser]);

  async function handleCreateGroup() {
    try {
      if (!groupName || !groupPassword) {
        alert('Preencha todos os campos!');
        return;
      }
      
      const { data, error } = await supabase
        .from('private_groups')
        .insert({
          name: groupName,
          password: groupPassword,
          creator_id: currentUser?.id
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Auto enter group
      const { error: memberError } = await supabase
        .from('private_group_members')
        .insert({
          group_id: data.id,
          user_id: currentUser?.id
        });
        
      if (memberError) throw memberError;
      
      alert('Grupo criado com sucesso!');
      setShowCreateModal(false);
      setGroupName('');
      setGroupPassword('');
      fetchGroups();
    } catch (error: any) {
      alert(error.message);
    }
  }

  async function handleJoinGroup() {
    try {
      if (!groupName || !groupPassword) {
        alert('Preencha todos os campos!');
        return;
      }
      
      const { data: group, error: groupError } = await supabase
        .from('private_groups')
        .select('*')
        .eq('name', groupName)
        .maybeSingle();
        
      if (groupError) throw groupError;
      if (!group) {
        alert('Grupo não encontrado!');
        return;
      }
      
      if (group.password !== groupPassword) {
        alert('Senha incorreta!');
        return;
      }
      
      const { error: memberError } = await supabase
        .from('private_group_members')
        .insert({
          group_id: group.id,
          user_id: currentUser?.id
        });
        
      if (memberError) {
        if (memberError.code === '23505') {
          alert('Você já está neste grupo!');
        } else {
          throw memberError;
        }
      } else {
        alert('Você entrou no grupo com sucesso!');
      }
      
      setShowJoinModal(false);
      setGroupName('');
      setGroupPassword('');
      fetchGroups();
    } catch (error: any) {
      alert(error.message);
    }
  }

  async function fetchGroups() {
    try {
      const { data, error } = await supabase
        .from('private_group_members')
        .select('group_id, private_groups(id, name)')
        .eq('user_id', currentUser?.id);
        
      if (error) throw error;
      
      const formattedGroups = data.map((d: any) => d.private_groups).filter(Boolean);
      setGroups(formattedGroups);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  }

  async function handleViewGroup(group: any) {
    try {
      setLoading(true);
      const { data: members, error: membersError } = await supabase
        .from('private_group_members')
        .select('user_id')
        .eq('group_id', group.id);
        
      if (membersError) throw membersError;
      
      const userIds = members.map((m: any) => m.user_id);
      
      const { data: pointsData, error: pointsError } = await supabase
        .from('loyalty_points')
        .select('user_id, balance')
        .in('user_id', userIds)
        .order('balance', { ascending: false });
        
      if (pointsError) throw pointsError;
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, wristband_level')
        .in('id', userIds);
        
      if (profilesError) throw profilesError;
      
      const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
      
      const formattedData = pointsData.map(p => {
        const prof = profilesMap.get(p.user_id);
        return {
          user_id: p.user_id,
          full_name: prof?.full_name || 'Desconhecido',
          avatar_url: prof?.avatar_url,
          points_earned: p.balance || 0,
          wristband_level: prof?.wristband_level || 1
        };
      });
      
      setActiveGroupRanking(formattedData);
      setIsViewingGroup(true);
      setSelectedGroupName(group.name);
    } catch (error) {
      console.error('Error viewing group:', error);
    } finally {
      setLoading(false);
    }
  }

  const currentMonth = new Date().toLocaleString('pt-BR', { month: 'long' });
  const capitalizedMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);

  const tabs = [
    { id: 0, name: 'Geral', color: 'bg-primary text-on-primary' },
    ...WRISTBANDS.map(w => ({ id: w.level, name: w.name, color: w.color })),
    { id: 9, name: 'Grupos', color: 'bg-zinc-800 text-white' }
  ];

  // Mínimo de pixels percorridos para ser considerado um swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null); // reseta para evitar cliques acidentais
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Swipe para a esquerda -> avança para a próxima aba/cor
      setDirection(1);
      setActiveTab((prev) => {
        const nextIdx = tabs.findIndex(t => t.id === prev) + 1;
        if (nextIdx < tabs.length) {
          return tabs[nextIdx].id;
        }
        return prev;
      });
    } else if (isRightSwipe) {
      // Swipe para a direita -> volta para a aba anterior
      setDirection(-1);
      setActiveTab((prev) => {
        const prevIdx = tabs.findIndex(t => t.id === prev) - 1;
        if (prevIdx >= 0) {
          return tabs[prevIdx].id;
        }
        return prev;
      });
    }
  };



  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-white uppercase animate-pulse bg-black">Calculando Pódio PAPEL FUTEVÔLEI...</div>;

  return (
    <SportyBackground topHeight="20%">
      <div className={`pb-32 min-h-screen font-body relative ${activeUnit?.slug === 'ctl' ? 'text-white bg-zinc-900' : 'text-zinc-900 bg-slate-50'}`}>
        <TopAppBar title="RANKING MENSAL" avatarSrc={profile?.avatar_url} avatarAlt={profile?.full_name || "Perfil"} wristbandLevel={profile?.wristband_level} />

        <main 
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="mt-20 space-y-6 select-none"
        >
          {/* Header Title */}
          <div className="text-center space-y-2 px-6">
            <h2 className={`font-headline font-black text-4xl uppercase italic tracking-tighter shadow-sm ${activeUnit?.slug === 'ctl' ? 'text-white' : 'text-zinc-900'}`}>
              RANKING <span className="text-primary">DE ELITE</span>
            </h2>
            <p className={`${activeUnit?.slug === 'ctl' ? 'text-zinc-400' : 'text-zinc-500'} font-black uppercase text-[10px] tracking-[0.3em] font-body`}>
              TOP FERAS - DESLIZE PARA O LADO
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border
                  ${tab.color}
                  ${activeTab === tab.id 
                    ? 'shadow-lg scale-110 ring-2 ring-white/40 border-transparent' 
                    : 'opacity-50 border-transparent hover:opacity-80'
                  }
                `}
                onClick={() => {
                  setDirection(tab.id > activeTab ? 1 : -1);
                  setActiveTab(tab.id);
                }}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* Conteúdo do Ranking Selecionado */}
          <div className="overflow-hidden w-full min-h-[60vh] relative">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={activeTab}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                className="px-6 space-y-6 w-full"
              >
            {(() => {
                const activeTabObj = tabs.find(t => t.id === activeTab);
                if (!activeTabObj) return null;

                if (activeTabObj.id === 9) {
                  return (
                    <div className="max-w-2xl mx-auto space-y-6">
                      {/* UI de Grupos */}
                      {isViewingGroup ? (
                        <div className={`${activeUnit?.slug === 'ctl' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-100'} rounded-3xl p-6 shadow-xl border space-y-4`}>
                          <div className="flex justify-between items-center">
                            <div>
                              <button onClick={() => setIsViewingGroup(false)} className="text-primary text-xs font-bold flex items-center gap-1 mb-1">
                                <span className="material-symbols-outlined text-xs">arrow_back</span> Voltar para Grupos
                              </button>
                              <h3 className={`font-headline font-black text-xl uppercase ${activeUnit?.slug === 'ctl' ? 'text-white' : 'text-zinc-900'}`}>Ranking: {selectedGroupName}</h3>
                            </div>
                            <span className="material-symbols-outlined text-primary text-3xl">trophy</span>
                          </div>
                          
                          {/* Podium do Grupo */}
                          <div className="flex items-end justify-center gap-2 pt-8 min-h-[180px]">
                            {/* 2nd Place */}
                            {activeGroupRanking[1] && (
                              <div className="flex flex-col items-center flex-1">
                                <div className="relative">
                                    <img src={activeGroupRanking[1].avatar_url || 'https://via.placeholder.com/150'} className="w-16 h-16 rounded-full border-4 border-slate-300 object-cover shadow-lg" />
                                    <div className="absolute -top-2 -right-2 bg-slate-300 text-slate-800 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">2</div>
                                </div>
                                <p className="mt-2 text-[10px] font-bold text-zinc-700 uppercase text-center truncate w-full">{activeGroupRanking[1].full_name.split(' ')[0]}</p>
                                <div className="bg-slate-300 w-full h-14 rounded-t-2xl mt-2 flex flex-col items-center justify-center text-slate-800 shadow-inner">
                                    <span className="text-xs font-black">{activeGroupRanking[1].points_earned}</span>
                                    <span className="text-[10px] font-bold uppercase opacity-60">pts</span>
                                </div>
                              </div>
                            )}

                            {/* 1st Place */}
                            {activeGroupRanking[0] && (
                              <div className="flex flex-col items-center flex-1 z-10">
                                <div className="relative">
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                                        <span className="material-symbols-outlined text-primary text-3xl animate-bounce">workspace_premium</span>
                                    </div>
                                    <img src={activeGroupRanking[0].avatar_url || 'https://via.placeholder.com/150'} className="w-20 h-20 rounded-full border-4 border-primary object-cover shadow-xl" />
                                    <div className="absolute -top-2 -right-2 bg-primary text-on-primary w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-lg">1</div>
                                </div>
                                <p className="mt-2 text-xs font-black text-zinc-900 uppercase text-center truncate w-full">{activeGroupRanking[0].full_name.split(' ')[0]}</p>
                                <div className="bg-primary w-full h-20 rounded-t-2xl mt-2 flex flex-col items-center justify-center text-on-primary shadow-2xl">
                                    <span className="text-xl font-black">{activeGroupRanking[0].points_earned}</span>
                                    <span className="text-[10px] font-bold uppercase opacity-80">pontos</span>
                                </div>
                              </div>
                            )}

                            {/* 3rd Place */}
                            {activeGroupRanking[2] && (
                              <div className="flex flex-col items-center flex-1">
                                <div className="relative">
                                    <img src={activeGroupRanking[2].avatar_url || 'https://via.placeholder.com/150'} className="w-14 h-14 rounded-full border-4 border-orange-400 object-cover shadow-lg" />
                                    <div className="absolute -top-2 -right-2 bg-orange-400 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">3</div>
                                </div>
                                <p className="mt-2 text-[10px] font-bold text-zinc-700 uppercase text-center truncate w-full">{activeGroupRanking[2].full_name.split(' ')[0]}</p>
                                <div className="bg-orange-400 w-full h-10 rounded-t-2xl mt-2 flex flex-col items-center justify-center text-white shadow-inner">
                                    <span className="text-xs font-black">{activeGroupRanking[2].points_earned}</span>
                                    <span className="text-[10px] font-bold uppercase opacity-60">pts</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Lista */}
                          <div className={`${activeUnit?.slug === 'ctl' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-100'} rounded-[32px] border overflow-hidden mb-6`}>
                            <div className={`divide-y ${activeUnit?.slug === 'ctl' ? 'divide-zinc-700' : 'divide-zinc-100'}`}>
                                {activeGroupRanking.slice(3).length > 0 ? activeGroupRanking.slice(3).map((user, index) => {
                                    const isMe = user.user_id === currentUser?.id;
                                    return (
                                        <div key={user.user_id} className={`flex items-center gap-4 p-4 transition-colors ${isMe ? 'bg-primary/10' : ''}`}>
                                            <span className={`w-6 text-sm font-black ${activeUnit?.slug === 'ctl' ? 'text-zinc-500' : 'text-zinc-400'}`}>#{index + 4}</span>
                                            <div className={`w-10 h-10 rounded-full overflow-hidden border-2 ${BORDER_COLORS[Number(user.wristband_level)] || 'border-white/10'} bg-primary/10`}>
                                                <img src={user.avatar_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <p className={`font-bold text-sm ${isMe ? 'text-primary' : (activeUnit?.slug === 'ctl' ? 'text-white' : 'text-zinc-900')}`}>
                                                    {user.full_name}
                                                    {isMe && <span className="ml-2 text-[9px] font-black bg-primary/20 text-primary px-1.5 py-0.5 rounded italic">VOCÊ</span>}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-black ${activeUnit?.slug === 'ctl' ? 'text-white' : 'text-zinc-900'}`}>{user.points_earned}</p>
                                                <p className={`text-[9px] font-bold ${activeUnit?.slug === 'ctl' ? 'text-zinc-400' : 'text-zinc-500'} uppercase`}>pts</p>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="p-10 text-center text-zinc-400 italic font-medium uppercase text-xs tracking-widest leading-loose">
                                        Fim do ranking.
                                    </div>
                                )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className={`${activeUnit?.slug === 'ctl' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-100'} rounded-3xl p-6 shadow-xl border space-y-4`}>
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className={`font-headline font-black text-xl uppercase ${activeUnit?.slug === 'ctl' ? 'text-white' : 'text-zinc-900'}`}>Seus Grupos</h3>
                              <p className={`${activeUnit?.slug === 'ctl' ? 'text-zinc-400' : 'text-zinc-500'} text-xs`}>Crie ou entre em um grupo para competir!</p>
                            </div>
                            <span className="material-symbols-outlined text-primary text-3xl">groups</span>
                          </div>
                          
                          {/* Botões */}
                          <div className="grid grid-cols-2 gap-4">
                            <button 
                              onClick={() => setShowCreateModal(true)}
                              className="bg-primary text-on-primary py-3 rounded-2xl font-bold uppercase text-xs shadow-lg"
                            >
                              Criar Grupo
                            </button>
                            <button 
                              onClick={() => setShowJoinModal(true)}
                              className={`py-3 rounded-2xl font-bold uppercase text-xs shadow-lg ${activeUnit?.slug === 'ctl' ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-white'}`}
                            >
                              Entrar
                            </button>
                          </div>
                          
                          {/* Lista de Grupos */}
                          <div className="space-y-3">
                            {groups.length === 0 ? (
                              <div className={`p-6 text-center italic text-xs ${activeUnit?.slug === 'ctl' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                Você não participa de nenhum grupo ainda.
                              </div>
                            ) : (
                              groups.map(group => (
                                <button 
                                  key={group.id} 
                                  onClick={() => handleViewGroup(group)}
                                  className={`w-full p-4 rounded-2xl flex justify-between items-center transition-colors border ${activeUnit?.slug === 'ctl' ? 'bg-zinc-700/50 hover:bg-zinc-700 border-zinc-700' : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-100'}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeUnit?.slug === 'ctl' ? 'bg-zinc-700' : 'bg-zinc-200'}`}>
                                      <span className={`material-symbols-outlined ${activeUnit?.slug === 'ctl' ? 'text-zinc-400' : 'text-zinc-600'}`}>trophy</span>
                                    </div>
                                    <div className="text-left">
                                      <p className={`font-bold text-sm ${activeUnit?.slug === 'ctl' ? 'text-white' : 'text-zinc-900'}`}>{group.name}</p>
                                      <p className={`${activeUnit?.slug === 'ctl' ? 'text-zinc-400' : 'text-zinc-500'} text-[10px] uppercase font-black`}>Toque para ver</p>
                                    </div>
                                  </div>
                                  <span className={`material-symbols-outlined ${activeUnit?.slug === 'ctl' ? 'text-zinc-500' : 'text-zinc-400'}`}>chevron_right</span>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                const filteredRanking = activeTabObj.id === 0 
                  ? ranking 
                  : ranking.filter(u => Number(u.wristband_level) === activeTabObj.id);
                
                const tabTop3 = filteredRanking.slice(0, 3);
                const tabOthers = filteredRanking.slice(3);

                return (
                  <div className="max-w-2xl mx-auto space-y-6">
                    {/* Podium */}
                    <div className="flex items-end justify-center gap-2 pt-8 min-h-[180px]">
                      {/* 2nd Place */}
                      {tabTop3[1] && (
                        <div className="flex flex-col items-center flex-1">
                          <div className="relative">
                              <img src={tabTop3[1].avatar_url || 'https://via.placeholder.com/150'} className="w-16 h-16 rounded-full border-4 border-slate-300 object-cover shadow-lg" />
                              <div className="absolute -top-2 -right-2 bg-slate-300 text-slate-800 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">2</div>
                          </div>
                          <p className={`mt-2 text-[10px] font-bold uppercase text-center truncate w-full ${activeUnit?.slug === 'ctl' ? 'text-zinc-300' : 'text-zinc-700'}`}>{tabTop3[1].full_name.split(' ')[0]}</p>
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
                          <p className={`mt-2 text-xs font-black uppercase text-center truncate w-full ${activeUnit?.slug === 'ctl' ? 'text-white' : 'text-zinc-900'}`}>{tabTop3[0].full_name.split(' ')[0]}</p>
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
                          <p className={`mt-2 text-[10px] font-bold uppercase text-center truncate w-full ${activeUnit?.slug === 'ctl' ? 'text-zinc-300' : 'text-zinc-700'}`}>{tabTop3[2].full_name.split(' ')[0]}</p>
                          <div className="bg-orange-400 w-full h-10 rounded-t-2xl mt-2 flex flex-col items-center justify-center text-white shadow-inner">
                              <span className="text-xs font-black">{tabTop3[2].points_earned}</span>
                              <span className="text-[10px] font-bold uppercase opacity-60">pts</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* List */}
                    <div className={`${activeUnit?.slug === 'ctl' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-100'} rounded-[32px] border overflow-hidden mb-6`}>
                      <div className={`p-4 border-b flex justify-between items-center ${activeUnit?.slug === 'ctl' ? 'bg-zinc-700/50 border-zinc-700' : 'bg-zinc-50 border-zinc-100'}`}>
                          <h3 className={`font-headline font-black text-xs uppercase tracking-[0.2em] ${activeUnit?.slug === 'ctl' ? 'text-zinc-300' : 'text-zinc-500'}`}>{activeTabObj.name}</h3>
                          <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase">Ranking</span>
                      </div>

                      <div className={`divide-y ${activeUnit?.slug === 'ctl' ? 'divide-zinc-700' : 'divide-zinc-100'}`}>
                          {tabOthers.length > 0 ? tabOthers.map((user, index) => {
                              const isMe = user.user_id === currentUser?.id;
                              return (
                                  <div key={user.user_id} className={`flex items-center gap-4 p-4 transition-colors ${isMe ? 'bg-primary/10' : ''}`}>
                                      <span className={`w-6 text-sm font-black ${activeUnit?.slug === 'ctl' ? 'text-zinc-500' : 'text-zinc-400'}`}>#{index + 4}</span>
                                      <div className={`w-10 h-10 rounded-full overflow-hidden border-2 ${BORDER_COLORS[Number(user.wristband_level)] || 'border-white/10'} bg-primary/10`}>
                                          <img src={user.avatar_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                                      </div>
                                      <div className="flex-1">
                                          <p className={`font-bold text-sm ${isMe ? 'text-primary' : (activeUnit?.slug === 'ctl' ? 'text-white' : 'text-zinc-900')}`}>
                                              {user.full_name}
                                              {isMe && <span className="ml-2 text-[9px] font-black bg-primary/20 text-primary px-1.5 py-0.5 rounded italic">VOCÊ</span>}
                                          </p>
                                      </div>
                                      <div className="text-right">
                                          <p className={`text-sm font-black ${activeUnit?.slug === 'ctl' ? 'text-white' : 'text-zinc-900'}`}>{user.points_earned}</p>
                                          <p className={`text-[9px] font-bold ${activeUnit?.slug === 'ctl' ? 'text-zinc-400' : 'text-zinc-500'} uppercase`}>pts</p>
                                      </div>
                                  </div>
                              );
                          }) : (
                              <div className={`p-10 text-center italic font-medium uppercase text-xs tracking-widest leading-loose ${activeUnit?.slug === 'ctl' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                  {tabTop3.length === 0 ? 'Ninguém nesse nível ainda!' : 'Fim do ranking.'}
                              </div>
                          )}
                      </div>
                    </div>
                  </div>
                );
            })()}
              </motion.div>
            </AnimatePresence>
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

        {/* Modal Criar Grupo */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4">
              <h3 className="font-headline font-black text-xl text-zinc-900 uppercase">Criar Novo Grupo</h3>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Nome do Grupo</label>
                <input 
                  type="text" 
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-zinc-100 p-3 rounded-xl text-sm"
                  placeholder="Ex: Feras do Futevôlei"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Senha de Acesso</label>
                <input 
                  type="password" 
                  value={groupPassword}
                  onChange={(e) => setGroupPassword(e.target.value)}
                  className="w-full bg-zinc-100 p-3 rounded-xl text-sm"
                  placeholder="Mínimo 4 caracteres"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="bg-zinc-100 text-zinc-600 py-3 rounded-xl font-bold uppercase text-xs"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreateGroup}
                  className="bg-primary text-on-primary py-3 rounded-xl font-bold uppercase text-xs shadow-lg"
                >
                  Criar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Entrar em Grupo */}
        {showJoinModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4">
              <h3 className="font-headline font-black text-xl text-zinc-900 uppercase">Entrar em Grupo</h3>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Nome do Grupo</label>
                <input 
                  type="text" 
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-zinc-100 p-3 rounded-xl text-sm"
                  placeholder="Digite o nome exato"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Senha de Acesso</label>
                <input 
                  type="password" 
                  value={groupPassword}
                  onChange={(e) => setGroupPassword(e.target.value)}
                  className="w-full bg-zinc-100 p-3 rounded-xl text-sm"
                  placeholder="Digite a senha"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button 
                  onClick={() => setShowJoinModal(false)}
                  className="bg-zinc-100 text-zinc-600 py-3 rounded-xl font-bold uppercase text-xs"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleJoinGroup}
                  className="bg-zinc-800 text-white py-3 rounded-xl font-bold uppercase text-xs shadow-lg"
                >
                  Entrar
                </button>
              </div>
            </div>
          </div>
        )}

        <StudentNavbar activePage="ranking" />
      </div>
    </SportyBackground>
  );
}

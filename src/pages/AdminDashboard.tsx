import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import SportyBackground from '../components/SportyBackground';
import TopAppBar from '../components/TopAppBar';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const menuItems = [
    { title: 'Gestão de Alunos', icon: 'groups', path: '/admin/students', bg: 'bg-white', text: 'text-black' },
    { title: 'Dashboard & Métricas', icon: 'analytics', path: '/admin/analytics', bg: 'bg-white', text: 'text-black' },
    { title: 'Aprovações Pendentes', icon: 'how_to_reg', path: '/admin/approvals', bg: 'bg-white', text: 'text-black' },
    { title: 'Gestão de Lazer', icon: 'stadium', path: '/admin/leisure', bg: 'bg-white', text: 'text-black' },
    { title: 'Prêmios (Fidelidade)', icon: 'redeem', path: '/admin/loyalty', bg: 'bg-white', text: 'text-black' },
    { title: 'Caixa (Resgate)', icon: 'qr_code_scanner', path: '/admin/scan-pontos', bg: 'bg-white', text: 'text-black' },
    { title: 'Gestão de Professores', icon: 'badge', path: '/manage-teachers', bg: 'bg-white', text: 'text-black' },
    { title: 'Gestão de Planos', icon: 'payments', path: '/manage-plans', bg: 'bg-white', text: 'text-black' },
    { title: 'Gestão de Marketing', icon: 'campaign', path: '/admin/marketing', bg: 'bg-white', text: 'text-black' },
    { title: 'Criar Aula', icon: 'add_circle', path: '/create-class', bg: 'bg-white', text: 'text-black' },
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  return (
    <SportyBackground topHeight="25%">
      <div className="min-h-screen pb-32 font-body relative">
      <TopAppBar title="PAINEL ADMINISTRATIVO" />

      <main className="mt-20 px-6 max-w-2xl mx-auto space-y-8">
        {/* Header — sem seletor de unidade, admin é global */}
        <header>
          <h2 className="font-headline text-3xl font-extrabold tracking-tight text-white">Olá, Administrador!</h2>
          <p className="text-white/70 font-medium mt-1">Visão global — todas as unidades</p>
        </header>

        <section className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {menuItems.map((item, idx) => (
            <Link 
              key={idx} 
              to={item.path}
              className="bg-white/10 hover:bg-white/20 border border-white/20 p-5 rounded-3xl shadow-sm hover:shadow-md active:scale-95 transition-all flex flex-col gap-3 backdrop-blur-sm"
            >
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-2xl text-black font-black">{item.icon}</span>
              </div>
              <h3 className="font-headline font-bold text-sm leading-tight text-white">{item.title}</h3>
            </Link>
          ))}
        </section>

        <section className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-3xl space-y-4">
          <h3 className="font-headline font-bold text-xl text-white">Atalhos Rápidos</h3>
          <div className="flex flex-col gap-2">
            <button onClick={() => navigate('/profile')} className="w-full h-14 bg-white rounded-xl font-bold flex items-center px-6 gap-3 shadow-sm active:scale-95 transition-transform text-sm text-black">
              <span className="material-symbols-outlined text-black">person</span>
              Meu Perfil
            </button>
            <button onClick={handleLogout} className="w-full h-14 bg-white/10 border border-white/20 rounded-xl font-bold flex items-center px-6 gap-3 shadow-sm active:scale-95 transition-transform text-red-400 text-sm">
              <span className="material-symbols-outlined">logout</span>
              Sair
            </button>
          </div>
        </section>
      </main>
      </div>
    </SportyBackground>
  );
}

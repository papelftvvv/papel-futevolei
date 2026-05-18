import React, { useState, useEffect } from 'react';
import TopAppBar from '../components/TopAppBar';
import { supabase } from '../lib/supabase';
import SportyBackground from '../components/SportyBackground';

interface PendingApproval {
  id: string;
  full_name: string;
  email: string;
  pending_plan_id: string;
  plan_name?: string;
  onesignal_id?: string;
}

export default function ManageApprovals() {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchApprovals();
  }, []);

  async function fetchApprovals() {
    try {
      setLoading(true);
      // Busca perfis pendentes sem join direto (FK não explícita)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, pending_plan_id, remaining_checkins, onesignal_id')
        .eq('plan_status', 'pendente');

      if (error) throw error;

      if (data && data.length > 0) {
        // Busca nomes dos planos separadamente
        const planIds = data.map((p: any) => p.pending_plan_id).filter(Boolean);
        let planMap: Record<string, any> = {};
        if (planIds.length > 0) {
          const { data: plansData } = await supabase
            .from('plans')
            .select('id, name, classes_per_week, type, billing_cycle')
            .in('id', planIds);
          planMap = Object.fromEntries((plansData || []).map((p: any) => [p.id, p]));
        }
        const updated = data.map((p: any) => ({
          ...p,
          plan_name: planMap[p.pending_plan_id]?.name || 'Plano Desconhecido'
        }));
        setApprovals(updated);
      } else {
        setApprovals([]);
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(userId: string, planId: string | null, approve: boolean) {
    try {
      if (approve) {
        const app = approvals.find(a => a.id === userId);
        if (app) {
          const { data: planData } = await supabase.from('plans').select('*').eq('id', planId).single();
          
          let updates: any = { 
            plan_status: 'ativo', 
            pending_plan_id: null 
          };

          if (planData) {
            // Se for recorrente, trocamos o plano e a data Ã¢ncora
            if (planData.type === 'recorrente') {
              updates.plan_id = planId;
              updates.plan_activated_at = new Date().toISOString();
              updates.remaining_checkins = Math.max(0, (app.remaining_checkins || 0) + planData.classes_per_week);
            } else {
              // Se for avulso, apenas incrementamos o saldo (PAPEL FUTEVÔLEI Day)
              updates.remaining_checkins = Math.max(0, (app.remaining_checkins || 0) + 1);
            }
          }

          const { error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

          if (updateError) throw updateError;

          const { notifyAdmin } = await import('../lib/notifications');
          await notifyAdmin('plan_approved', {
            email: app.email,
            full_name: app.full_name,
            plan_name: app.plan_name,
            onesignal_id: (app as any).onesignal_id
          });
        }
      } else {
        // Recusa
        await supabase
          .from('profiles')
          .update({ plan_status: 'nenhum', pending_plan_id: null })
          .eq('id', userId);
      }
      
      setSuccessMsg(approve ? 'Plano aprovado com sucesso!' : 'Solicitação recusada.');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchApprovals();
    } catch (error: any) {
      alert(error.message);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-white uppercase animate-pulse bg-black">Carregando solicitações...</div>;

  return (
    <SportyBackground topHeight="25%">
      <div className="font-body text-white antialiased min-h-screen pb-32 relative">
      <TopAppBar title="Aprovações de Planos" showBackButton backPath="/admin" />

      <main className="pt-24 px-6 max-w-2xl mx-auto relative">
        <div className="mb-10">
          <h1 className="font-headline font-extrabold text-3xl text-white tracking-tight">Solicitações Pendentes</h1>
          <p className="text-white/50 text-sm font-medium">Aprovação de novos planos para alunos</p>
        </div>

        {successMsg && (
          <div className="mb-6 p-4 bg-primary/10 border-2 border-primary/20 rounded-2xl text-primary text-xs font-bold uppercase tracking-widest text-center animate-bounce">
            {successMsg}
          </div>
        )}

        {approvals.length === 0 ? (
          <div className="bg-white/10 border-2 border-dashed border-white/20 rounded-3xl p-12 text-center">
            <span className="material-symbols-outlined text-white/30 text-6xl mb-4">check_circle</span>
            <p className="text-white/50 font-medium">Nenhuma solicitação pendente no momento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {approvals.map(app => (
              <div key={app.id} className="bg-zinc-900 border border-white/10 p-6 rounded-2xl flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-headline font-bold text-lg text-white">{app.full_name || 'Aluno Sem Nome'}</h3>
                    <p className="text-white/50 text-sm lowercase">{app.email}</p>
                    <div className="mt-3 inline-flex items-center gap-2 bg-secondary/10 px-3 py-1 rounded-full">
                      <span className="material-symbols-outlined text-secondary text-sm">payments</span>
                      <span className="text-secondary text-xs font-black uppercase tracking-widest">{app.plan_name || 'Plano Desconhecido'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleAction(app.id, app.pending_plan_id, true)}
                    className="flex-1 bg-secondary text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:opacity-90 transition-all"
                  >
                    Aprovar
                  </button>
                  <button 
                    onClick={() => handleAction(app.id, null, false)}
                    className="px-6 py-3 bg-surface-container-highest text-on-surface-variant rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-error/10 hover:text-error transition-all"
                  >
                    Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      </div>
    </SportyBackground>
  );
}

import React, { useState, useEffect } from 'react';
import TopAppBar from '../components/TopAppBar';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
  avatar_url: string;
  plan_status: string;
  wristband_level?: number;
  loyalty_points?: {
    balance: number;
  };
}

const WRISTBANDS = [
  { level: 1, name: 'Branco', color: 'bg-white text-black' },
  { level: 2, name: 'Cinza', color: 'bg-zinc-500 text-white' },
  { level: 3, name: 'Azul', color: 'bg-blue-600 text-white' },
  { level: 4, name: 'Amarelo', color: 'bg-yellow-500 text-black' },
  { level: 5, name: 'Laranja', color: 'bg-orange-500 text-white' },
  { level: 6, name: 'Verde', color: 'bg-green-600 text-white' },
  { level: 7, name: 'Vermelho', color: 'bg-red-600 text-white' },
  { level: 8, name: 'Preto', color: 'bg-black text-white border border-[#D4AF37]' },
];

interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  created_at: string;
}

export default function ManageStudents() {
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState<Profile | null>(null);
  const [managingPoints, setManagingPoints] = useState<Profile | null>(null);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [adjustmentValue, setAdjustmentValue] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    try {
      setLoading(true);

      // Busca todos os perfis que NÃO são admin ou professor
      // Usa OR explícito para incluir também quem tem role = NULL
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .or('role.eq.student,role.is.null')
        .order('full_name', { ascending: true });

      if (profilesError) throw profilesError;

      // Busca os saldos de pontos separadamente
      const { data: pointsData } = await supabase
        .from('loyalty_points')
        .select('user_id, balance');

      // Mapeia os pontos por user_id para merge eficiente
      const pointsMap = new Map((pointsData || []).map((p: any) => [p.user_id, p.balance]));

      // Mescla os dados
      const merged = (profilesData || []).map((profile: any) => ({
        ...profile,
        loyalty_points: { balance: pointsMap.get(profile.id) || 0 }
      }));

      setStudents(merged);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  async function handleUpdateStudent() {
    if (!editingStudent) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: editingStudent.full_name,
          email: editingStudent.email,
          phone: editingStudent.phone,
          plan_status: editingStudent.plan_status,
          wristband_level: editingStudent.wristband_level
        })
        .eq('id', editingStudent.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('Nenhuma alteração foi salva no banco de dados. Isso geralmente acontece por falta de permissão de administrador (RLS) para atualizar perfis de outros usuários.');
      }

      setStudents(prev => prev.map(s => s.id === editingStudent.id ? editingStudent : s));
      setEditingStudent(null);
      showSuccess('Perfil atualizado com sucesso!');
    } catch (error: any) {
      alert(error.message);
    }
  }

  async function handleDeleteStudent(id: string) {
    if (!confirm('Deseja realmente excluir este aluno? Isso removerá o perfil dele da base de dados.')) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setStudents(prev => prev.filter(s => s.id !== id));
      showSuccess('Aluno removido com sucesso!');
      setEditingStudent(null);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchHistory(studentId: string) {
    try {
      setLoadingHistory(true);
      const { data, error } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('user_id', studentId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      console.error(error.message);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handlePointsAdjustment(type: 'credit' | 'debit') {
    if (!managingPoints || !adjustmentValue || !adjustmentReason) {
      alert('Preencha o valor e a justificativa!');
      return;
    }

    try {
      const amount = parseInt(adjustmentValue);
      const finalAmount = type === 'credit' ? amount : -amount;

      const { error } = await supabase
        .from('loyalty_transactions')
        .insert({
          user_id: managingPoints.id,
          amount: finalAmount,
          type: type,
          description: `[Ajuste Admin] ${adjustmentReason}`
        });

      if (error) throw error;

      // Atualizar localmente o saldo na lista de estudantes
      setStudents(prev => prev.map(s => {
        if (s.id === managingPoints.id) {
          const currentBalance = s.loyalty_points?.balance || 0;
          return {
            ...s,
            loyalty_points: { balance: currentBalance + finalAmount }
          };
        }
        return s;
      }));

      showSuccess(`Pontos ${type === 'credit' ? 'creditados' : 'debitados'} com sucesso!`);
      setAdjustmentValue('');
      setAdjustmentReason('');
      fetchHistory(managingPoints.id); // Recarregar histórico
    } catch (error: any) {
      alert('Erro ao ajustar pontos: ' + error.message);
    }
  }

  const exportCSV = () => {
    const headers = ['Nome', 'Email', 'Telefone', 'Status do Plano', 'Data de Cadastro'];
    const rows = students.map(s => [
      s.full_name,
      s.email,
      s.phone,
      s.plan_status,
      new Date(s.created_at).toLocaleDateString('pt-BR')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(field => `"${field || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `alunos_PAPEL FUTEVÔLEI_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = students.filter(s =>
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone?.includes(searchTerm)
  );

  return (
    <div className="bg-black font-body text-white antialiased min-h-screen pb-32">
      <TopAppBar title="GESTÃO DE ALUNOS" showBackButton />

      <main className="pt-24 px-6 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline font-extrabold text-3xl tracking-tight leading-none text-white">Alunos Cadastrados</h1>
            <p className="text-white/50 text-sm font-medium mt-1">Visualize, edite e exporte os dados da base.</p>
          </div>
          <button
            onClick={exportCSV}
            className="bg-white text-black px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:bg-white/90 active:scale-95 transition-all text-xs uppercase tracking-widest"
          >
            <span className="material-symbols-outlined text-sm text-black">download</span>
            Exportar CSV
          </button>
        </div>

        {/* Success Toast */}
        {successMsg && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[250] bg-green-600 text-white px-8 py-4 rounded-2xl shadow-2xl font-bold text-sm animate-bounce border border-green-500">
            {successMsg}
          </div>
        )}

        {/* Search Bar */}
        <div className="relative group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/40 group-focus-within:text-white transition-colors">search</span>
          <input
            type="text"
            placeholder="Buscar por nome, email ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 pl-12 pr-6 rounded-3xl bg-zinc-900 border-2 border-white/10 focus:border-white/30 focus:ring-4 focus:ring-white/5 transition-all font-medium text-sm text-white placeholder:text-white/30"
          />
        </div>

        {/* Students Table/Cards */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="py-20 text-center font-bold text-primary animate-pulse uppercase tracking-widest text-xs">Carregando base de alunos...</div>
          ) : filteredStudents.length > 0 ? (
            filteredStudents.map(student => (
              <div key={student.id} className="bg-zinc-900 border border-white/10 p-6 rounded-[32px] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:bg-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-surface-container overflow-hidden shrink-0 border-4 border-white shadow-sm">
                    <img src={student.avatar_url || 'https://via.placeholder.com/150'} alt={student.full_name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-headline font-black text-xl text-white leading-tight flex items-center gap-2 flex-wrap">
                      {student.full_name}
                      <button
                        onClick={() => {
                          setManagingPoints(student);
                          fetchHistory(student.id);
                        }}
                        className="bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:bg-[#D4AF37] hover:text-white transition-all shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[12px]">workspace_premium</span>
                        {student.loyalty_points?.balance || 0} PTS
                      </button>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${WRISTBANDS.find(w => w.level === (student.wristband_level || 1))?.color}`}>
                        {WRISTBANDS.find(w => w.level === (student.wristband_level || 1))?.name}
                      </span>
                    </h3>
                    <p className="text-white/50 text-xs font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px]">mail</span> {student.email}
                    </p>
                    <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px]">phone</span> {student.phone || 'Sem telefone'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0">
                  <div className="text-right hidden md:block">
                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Plano</p>
                    <p className={`text-xs font-bold ${student.plan_status === 'ativo' ? 'text-primary' : 'text-error'}`}>{student.plan_status?.toUpperCase() || 'NENHUM'}</p>
                  </div>
                  <button
                    onClick={() => setEditingStudent(student)}
                    className="flex-1 md:flex-none w-12 h-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
                  >
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteStudent(student.id)}
                    className="flex-1 md:flex-none w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center text-on-surface-variant/50 font-medium italic opacity-50">Nenhum aluno encontrado para "{searchTerm}".</div>
          )}
        </div>

        {/* Edit Modal */}
        {editingStudent && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-black/60 animate-in fade-in duration-300">
            <div className="bg-zinc-900 border border-white/10 w-full max-w-lg rounded-[40px] shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center">
                <h2 className="font-headline font-black text-2xl tracking-tighter text-white">Editar Perfil</h2>
                <button onClick={() => setEditingStudent(null)} className="material-symbols-outlined text-white/50">close</button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/50 ml-1">Nome Completo</label>
                  <input
                    value={editingStudent.full_name}
                    onChange={e => setEditingStudent({ ...editingStudent, full_name: e.target.value })}
                    className="w-full h-14 px-5 rounded-2xl bg-zinc-800 border border-white/10 font-bold text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/50 ml-1">Email</label>
                  <input
                    value={editingStudent.email}
                    onChange={e => setEditingStudent({ ...editingStudent, email: e.target.value })}
                    className="w-full h-14 px-5 rounded-2xl bg-zinc-800 border border-white/10 font-bold text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/50 ml-1">Telefone</label>
                  <input
                    value={editingStudent.phone}
                    onChange={e => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                    className="w-full h-14 px-5 rounded-2xl bg-zinc-800 border border-white/10 font-bold text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/50 ml-1">Status do Plano</label>
                  <select
                    value={editingStudent.plan_status}
                    onChange={e => setEditingStudent({ ...editingStudent, plan_status: e.target.value })}
                    className="w-full h-14 px-5 rounded-2xl bg-zinc-800 border border-white/10 font-bold appearance-none text-white"
                  >
                    <option value="nenhum">Nenhum</option>
                    <option value="pendente">Pendente</option>
                    <option value="ativo">Ativo</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/50 ml-1">Nível da Pulseira</label>
                  <select
                    value={editingStudent.wristband_level || 1}
                    onChange={e => setEditingStudent({ ...editingStudent, wristband_level: parseInt(e.target.value) })}
                    className="w-full h-14 px-5 rounded-2xl bg-zinc-800 border border-white/10 font-bold appearance-none text-white"
                  >
                    {WRISTBANDS.map(w => (
                      <option key={w.level} value={w.level}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleUpdateStudent}
                  className="flex-1 h-16 bg-white text-black rounded-2xl font-headline font-black text-lg shadow-xl active:scale-95 transition-transform"
                >
                  SALVAR
                </button>
                <button
                  onClick={() => handleDeleteStudent(editingStudent.id)}
                  className="px-6 h-16 bg-red-50 text-red-500 rounded-2xl font-bold flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loyalty Points Modal */}
        {managingPoints && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-black/60 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col md:flex-row h-[80vh] md:h-auto">
              {/* Left Side: History */}
              <div className="flex-1 p-8 bg-surface-container/30 border-r border-primary-container/10 overflow-y-auto custom-scrollbar">
                <div className="mb-6">
                  <h3 className="font-headline font-black text-xl text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#D4AF37]">history</span>
                    HISTÓRICO
                  </h3>
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Atividades recentes de {managingPoints.full_name.split(' ')[0]}</p>
                </div>

                {loadingHistory ? (
                  <div className="py-10 text-center animate-pulse text-[10px] font-black text-primary/40 uppercase tracking-widest">Carregando extrato...</div>
                ) : history.length > 0 ? (
                  <div className="space-y-3">
                    {history.map(t => (
                      <div key={t.id} className="bg-white p-4 rounded-2xl border border-primary-container/5 shadow-sm">
                        <div className="flex justify-between items-start">
                          <p className="text-[11px] font-bold text-on-surface leading-tight">{t.description}</p>
                          <span className={`text-[11px] font-black ${t.amount > 0 ? 'text-primary' : 'text-error'}`}>
                            {t.amount > 0 ? '+' : ''}{t.amount}
                          </span>
                        </div>
                        <p className="text-[9px] font-medium text-on-surface-variant mt-1">
                          {new Date(t.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-on-surface-variant/40 italic text-xs">Nenhuma transação encontrada.</div>
                )}
              </div>

              {/* Right Side: Adjustment Panel */}
              <div className="w-full md:w-[320px] p-8 space-y-8 bg-white relative">
                <button onClick={() => setManagingPoints(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-surface-container flex items-center justify-center material-symbols-outlined opacity-40">close</button>

                <div>
                  <div className="bg-[#D4AF37]/10 p-6 rounded-[32px] text-center border-2 border-[#D4AF37]/20">
                    <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-1">Saldo Atual</p>
                    <h4 className="font-headline font-black text-4xl text-[#D4AF37] tracking-tighter italic">
                      {(students.find(s => s.id === managingPoints.id)?.loyalty_points as any)?.balance || 0}
                    </h4>
                    <p className="text-[10px] font-bold text-[#D4AF37]/60 uppercase">PAPEL FUTEVÔLEI Points</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-2">Pontos para ajustar</label>
                    <input
                      type="number"
                      value={adjustmentValue}
                      onChange={e => setAdjustmentValue(e.target.value)}
                      placeholder="Ex: 50"
                      className="w-full h-14 px-6 rounded-2xl bg-surface-container font-black text-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-2">Justificativa</label>
                    <textarea
                      value={adjustmentReason}
                      onChange={e => setAdjustmentReason(e.target.value)}
                      placeholder="Motivo do ajuste..."
                      className="w-full p-4 rounded-2xl bg-surface-container font-bold text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handlePointsAdjustment('credit')}
                      className="flex-1 h-14 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">add</span> CREDITAR
                    </button>
                    <button
                      onClick={() => handlePointsAdjustment('debit')}
                      className="flex-1 h-14 bg-error text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-error/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">remove</span> DEBITAR
                    </button>
                  </div>
                </div>

                <p className="text-[9px] font-medium text-center text-on-surface-variant px-4 italic leading-tight">
                  *O ajuste manual é lançado imediatamente e notificado no extrato do aluno.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
}

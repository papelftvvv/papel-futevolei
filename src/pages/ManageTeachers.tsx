import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import TopAppBar from '../components/TopAppBar';
import SportyBackground from '../components/SportyBackground';

export default function ManageTeachers() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  async function fetchTeachers() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'teacher')
        .order('full_name');

      if (error) throw error;
      setTeachers(data || []);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveTeacher(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        // Lógica de Edição
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            email: email
          })
          .eq('id', editingId);

        if (error) throw error;
        alert('Professor atualizado com sucesso!');
      } else {
        // Lógica de Criação ou Promoção
        // Primeiro verificamos se o usuário já existe na tabela profiles pelo NOME
        // Buscamos pelo nome porque o e-mail não é salvo na tabela profiles no cadastro inicial do app
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('full_name', fullName)
          .maybeSingle();

        if (profileError) throw profileError;

        if (existingProfile) {
          // Se ele já existe, atualizamos a role dele para 'teacher' e salvamos o e-mail
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              role: 'teacher',
              email: email 
            })
            .eq('id', existingProfile.id);

          if (updateError) throw updateError;
          alert('Este usuário já estava cadastrado como aluno e foi promovido a Professor!');
        } else {
          // Se não existe, criamos a conta normalmente
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
                role: 'teacher'
              }
            }
          });

          if (error) throw error;
          alert('Professor cadastrado! Ele deve confirmar o e-mail para ativar a conta.');
        }
      }

      // Reset form
      cancelEdit();
      fetchTeachers();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEdit(teacher: any) {
    setEditingId(teacher.id);
    setFullName(teacher.full_name || '');
    setEmail(teacher.email || '');
    setPassword(''); // Não editamos senha por aqui por segurança
  }

  function cancelEdit() {
    setEditingId(null);
    setFullName('');
    setEmail('');
    setPassword('');
  }

  async function handleDeleteTeacher(id: string) {
    if (!confirm('Tem certeza que deseja excluir este professor? Isso removerá o acesso dele imediatamente.')) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Professor removido com sucesso!');
      fetchTeachers();
    } catch (error: any) {
      alert('Erro ao excluir: ' + error.message);
    }
  }

  return (
    <div className="bg-zinc-950 text-white min-h-screen pb-12 relative overflow-hidden">
      <SportyBackground topHeight="25%" />
      
      <TopAppBar title="GESTÃO DE PROFESSORES" showBackButton />

      <main className="mt-24 px-6 max-w-4xl mx-auto space-y-12 relative z-10">
        {/* Formulário de Cadastro/Edição */}
        <section className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-primary text-3xl">person_add</span>
            <h3 className="font-headline font-extrabold text-2xl uppercase tracking-tight">
              {editingId ? 'Editar Professor' : 'Cadastrar Novo Professor'}
            </h3>
          </div>
          
          <form onSubmit={handleSaveTeacher} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-zinc-400 ml-1">Nome Completo</label>
              <input 
                className="w-full h-14 px-4 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-inner"
                type="text" value={fullName} onChange={e => setFullName(e.target.value)} required 
                placeholder="Ex: Carlos Silva"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-zinc-400 ml-1">E-mail</label>
              <input 
                className="w-full h-14 px-4 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-inner"
                type="email" value={email} onChange={e => setEmail(e.target.value)} required 
                placeholder="professor@email.com"
              />
            </div>
            {!editingId && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold uppercase text-zinc-400 ml-1">Senha Inicial</label>
                <input 
                  className="w-full h-14 px-4 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-inner"
                  type="password" value={password} onChange={e => setPassword(e.target.value)} required 
                  placeholder="Minimo 6 caracteres"
                />
              </div>
            )}
            <div className="md:col-span-2 flex gap-3 mt-2">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`h-14 font-headline font-bold rounded-xl active:scale-95 transition-all shadow-lg disabled:opacity-50 flex-1 flex items-center justify-center gap-2 ${editingId ? 'bg-zinc-700 text-white hover:bg-zinc-600' : 'bg-primary text-black hover:bg-primary/90'}`}
              >
                <span className="material-symbols-outlined">{editingId ? 'save' : 'how_to_reg'}</span>
                {isSubmitting ? 'SALVANDO...' : (editingId ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR PROFESSOR')}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  onClick={cancelEdit}
                  className="px-6 h-14 bg-zinc-800 text-white font-bold rounded-xl active:scale-95 transition-all border border-zinc-700 hover:bg-zinc-700 flex items-center justify-center"
                >
                  CANCELAR
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Lista de Professores */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">groups</span>
            <h3 className="font-headline font-extrabold text-2xl uppercase tracking-tight">Professores Cadastrados</h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid gap-4">
              {teachers.map(teacher => (
                <div key={teacher.id} className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/50 p-5 rounded-2xl flex items-center justify-between hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                      {teacher.avatar_url ? (
                        <img src={teacher.avatar_url} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-primary text-2xl">person</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg leading-tight">{teacher.full_name || 'Sem Nome'}</p>
                      <div className="flex flex-col gap-0.5 mt-1">
                        <p className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-xs text-primary">mail</span> {teacher.email}
                        </p>
                        {teacher.phone && (
                          <p className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-xs text-primary">phone</span> {teacher.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => startEdit(teacher)}
                      className="w-11 h-11 flex items-center justify-center rounded-full bg-zinc-800 text-white hover:bg-zinc-700 transition-colors border border-zinc-700"
                      title="Editar Professor"
                    >
                      <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <button 
                      onClick={() => handleDeleteTeacher(teacher.id)}
                      className="w-11 h-11 flex items-center justify-center rounded-full bg-red-950 text-red-400 hover:bg-red-900 transition-colors border border-red-900/50"
                      title="Excluir Professor"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                </div>
              ))}
              {teachers.length === 0 && (
                <div className="text-center py-12 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
                  <span className="material-symbols-outlined text-zinc-600 text-5xl mb-2">person_off</span>
                  <p className="text-zinc-500 italic">Nenhum professor encontrado.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

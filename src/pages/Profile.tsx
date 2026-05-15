import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import TopAppBar from '../components/TopAppBar';
import StudentNavbar from '../components/StudentNavbar';
import SportyBackground from '../components/SportyBackground';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<{
    full_name: string;
    phone: string;
    cpf: string;
    avatar_url: string | null;
    wristband_level?: number;
  }>({
    full_name: '',
    phone: '',
    cpf: '',
    avatar_url: null,
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pointsBalance, setPointsBalance] = useState(0);


  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('No user logged in');

      let { data, error, status } = await supabase
        .from('profiles')
        .select(`full_name, role, avatar_url, cpf, wristband_level`)
        .eq('id', user.id)
        .maybeSingle();

      if (error && status !== 406) throw error;

      // Se não existir perfil, cria um básico agora mesmo
      if (!data) {
        const newFullName = user.user_metadata?.full_name || user.user_metadata?.name || 'Novo Atleta';
        const newAvatar = user.user_metadata?.avatar_url || null;
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: newFullName,
            avatar_url: newAvatar,
            role: 'aluno',
            updated_at: new Date()
          })
          .select()
          .single();
        
        if (createError) console.error('Erro ao criar perfil:', createError);
        data = newProfile;
      }

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          phone: user.user_metadata?.phone || user.phone || '',
          cpf: data.cpf || '',
          avatar_url: data.avatar_url,
          wristband_level: data.wristband_level
        });
      }

      // Fetch points and transactions
      const { data: pointsData } = await supabase.from('loyalty_points').select('balance').eq('user_id', user.id).maybeSingle();
      if (!pointsData) {
        // Criar registro de pontos se não existir
        await supabase.from('loyalty_points').insert({ user_id: user.id, balance: 0 });
      }
      setPointsBalance(pointsData?.balance || 0);

      const { data: transData } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setTransactions(transData || []);

    } catch (error: any) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('No user logged in');

      const updates = {
        id: user.id,
        full_name: profile.full_name,
        cpf: profile.cpf.replace(/\D/g, ''),
        avatar_url: profile.avatar_url,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) throw error;
      alert('Perfil atualizado com sucesso!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem para fazer o upload.');
      }

      const file = event.target.files[0];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      setProfile({ ...profile, avatar_url: data.publicUrl });
      
      // Update the profile in the database immediately
      await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id);
      
      alert('Foto atualizada com sucesso!');

    } catch (error: any) {
      console.error('Erro no upload:', error);
      alert('Erro ao enviar foto. Verifique se a imagem é pequena ou tente outra.');
    } finally {
      setUploading(false);
    }
  }

  if (loading && !profile.full_name) {
    return <div className="min-h-screen flex items-center justify-center bg-surface">Carregando...</div>;
  }

  return (
    <SportyBackground topHeight="25%">
      <div className="text-on-surface pb-32 min-h-screen relative">
      <TopAppBar title="MEU PERFIL" avatarSrc={profile.avatar_url || undefined} showBackButton wristbandLevel={profile.wristband_level} />

      <main className="mt-24 px-6 max-w-lg mx-auto space-y-8">
        <section className="flex flex-col items-center space-y-4">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary-container shadow-xl bg-surface-container-highest flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-6xl text-on-surface-variant">person</span>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-sm">photo_camera</span>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={uploadAvatar} 
                disabled={uploading}
              />
            </label>
          </div>
          {uploading && <p className="text-xs font-bold text-primary animate-pulse">Enviando foto...</p>}
        </section>

        <form onSubmit={updateProfile} className="space-y-6">
          <div className="space-y-2">
            <label className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Nome Completo</label>
            <input
              className="w-full h-14 px-5 rounded-xl bg-surface-container-highest border border-outline-variant/30 focus:ring-4 focus:ring-primary/10 transition-all font-medium text-on-surface"
              type="text"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">CPF (apenas números)</label>
            <input
              className="w-full h-14 px-5 rounded-xl bg-surface-container-highest border border-outline-variant/30 focus:ring-4 focus:ring-primary/10 transition-all font-medium text-on-surface"
              type="text"
              placeholder="000.000.000-00"
              value={profile.cpf}
              onChange={(e) => {
                const value = e.target.value
                    .replace(/\D/g, '')
                    .replace(/(\d{3})(\d)/, '$1.$2')
                    .replace(/(\d{3})(\d)/, '$1.$2')
                    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
                    .replace(/(-\d{2})\d+?$/, '$1');
                setProfile({ ...profile, cpf: value });
              }}
            />
            <p className="text-[10px] text-on-surface-variant ml-1 italic">Necessário para pagamentos via PIX e Cartão no Mercado Pago.</p>
          </div>

          <div className="space-y-2">
            <label className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Telefone</label>
            <input
              className="w-full h-14 px-5 rounded-xl bg-surface-container-highest border border-outline-variant/30 focus:ring-4 focus:ring-primary/10 transition-all font-medium opacity-60 text-on-surface"
              type="tel"
              value={profile.phone}
              disabled
            />
            <p className="text-[10px] text-on-surface-variant ml-1 italic">O telefone é vinculado Ã  sua conta e não pode ser alterado aqui.</p>
          </div>

          <div className="pt-4 space-y-4">
            <button
              type="button"
              onClick={() => navigate('/plans')}
              className="w-full h-14 bg-secondary/10 text-secondary font-headline font-bold text-lg rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-3"
            >
              <span className="material-symbols-outlined">payments</span>
              MEUS PLANOS
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-primary text-on-primary font-headline font-bold text-lg rounded-xl shadow-lg active:scale-95 transition-transform disabled:opacity-50"
            >
              SALVAR ALTERAÇÕES
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full h-14 bg-white border-2 border-error text-error font-headline font-bold text-lg rounded-xl active:scale-95 transition-transform"
            >
              SAIR DA CONTA
            </button>
          </div>
        </form>

        {/* Loyalty Points History */}
        <section className="space-y-6 pt-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined">stars</span>
             </div>
             <div>
                <h3 className="font-headline font-extrabold text-xl">Meu PAPEL POINTS</h3>
                <p className="text-on-surface-variant text-xs font-medium uppercase tracking-widest">Saldo Atual: <span className="text-secondary font-black">{pointsBalance} Pontos</span></p>
             </div>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
             {transactions.length > 0 ? transactions.map(t => (
                <div key={t.id} className="bg-white p-4 rounded-2xl shadow-sm border border-primary-container/10 flex justify-between items-center group">
                   <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[18px] ${t.amount > 0 ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
                         <span className="material-symbols-outlined">{t.amount > 0 ? 'add_circle' : 'remove_circle'}</span>
                      </div>
                      <div>
                         <p className="font-bold text-sm text-on-surface capitalize">{t.description}</p>
                         <p className="text-[10px] font-medium text-on-surface-variant opacity-60 uppercase">{new Date(t.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                   </div>
                   <div className={`font-headline font-black text-sm ${t.amount > 0 ? 'text-primary' : 'text-error'}`}>
                      {t.amount > 0 ? `+${t.amount}` : t.amount}
                   </div>
                </div>
             )) : (
                <div className="text-center py-10 opacity-30 italic text-xs font-bold uppercase tracking-widest">Nenhum ponto acumulado ainda</div>
             )}
          </div>
        </section>
      </main>


      <StudentNavbar activePage="perfil" />
      </div>
    </SportyBackground>
  );
}

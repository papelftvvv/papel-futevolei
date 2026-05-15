import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { notifyAdmin } from '../lib/notifications';
import SportyBackground from '../components/SportyBackground';

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) {
      setError('CPF inválido. Deve conter 11 dígitos.');
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
          role: role,
          cpf: cleanCPF
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Cria o perfil na tabela profiles imediatamente após o cadastro
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        phone: phone,
        role: role,
        cpf: cleanCPF,
        points: 0,
        plan_status: 'nenhum'
      });

      notifyAdmin('registration', {
        full_name: fullName,
        email: email,
        phone: phone,
        role: role,
        cpf: cleanCPF
      });

      alert('Cadastro realizado com sucesso! Faça login para continuar.');
      navigate('/');
    }
  };

  return (
    <SportyBackground>
      <div className="flex flex-col px-6 pt-12 pb-24 max-w-md mx-auto w-full">
        <header className="relative z-10 mb-8">
          <button 
            onClick={() => navigate('/')} 
            className="text-white/60 flex items-center text-[10px] font-bold uppercase tracking-widest hover:text-white mb-6"
          >
            <span className="material-symbols-outlined text-sm mr-1">arrow_back</span> Voltar
          </button>
          <h1 className="font-headline font-black text-3xl tracking-tight text-white leading-tight uppercase italic">
            Crie sua Conta
          </h1>
          <p className="font-body text-white/40 mt-2 text-xs uppercase tracking-widest">
            Junte-se à elite do PAPEL FUTEVÔLEI.
          </p>
        </header>

        <section className="flex-grow relative z-10 w-full">
          <form className="space-y-6" onSubmit={handleRegister}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg text-[10px] text-center font-bold">
                {error}
              </div>
            )}



            <div className="space-y-4">
              <div className="space-y-1">
                <label className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 ml-1">Nome Completo</label>
                <input
                  className="w-full h-12 px-5 rounded-lg bg-white/5 border border-white/10 text-white font-medium outline-none focus:border-white/30 transition-all placeholder:text-white/10"
                  placeholder="Seu nome"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 ml-1">E-mail</label>
                <input
                  className="w-full h-12 px-5 rounded-lg bg-white/5 border border-white/10 text-white font-medium outline-none focus:border-white/30 transition-all placeholder:text-white/10"
                  placeholder="exemplo@email.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 ml-1">Senha</label>
                <input
                  className="w-full h-12 px-5 rounded-lg bg-white/5 border border-white/10 text-white font-medium outline-none focus:border-white/30 transition-all placeholder:text-white/10"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 ml-1">CPF</label>
                <input
                  className="w-full h-12 px-5 rounded-lg bg-white/5 border border-white/10 text-white font-medium outline-none focus:border-white/30 transition-all placeholder:text-white/10"
                  placeholder="000.000.000-00"
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 ml-1">Telefone</label>
                <input
                  className="w-full h-12 px-5 rounded-lg bg-white/5 border border-white/10 text-white font-medium outline-none focus:border-white/30 transition-all placeholder:text-white/10"
                  placeholder="(00) 00000-0000"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                disabled={loading}
                className="w-full h-14 bg-white text-black font-headline font-bold text-sm tracking-widest rounded-lg shadow-lg active:scale-95 transition-all disabled:opacity-50 uppercase"
              >
                {loading ? 'PROCESSANDO...' : 'FINALIZAR CADASTRO'}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs font-medium text-white/40 uppercase tracking-widest">
              Já tem uma conta?
              <Link to="/" className="text-white font-bold ml-2 hover:underline">Entrar</Link>
            </p>
          </div>
        </section>
      </div>
    </SportyBackground>
  );
}

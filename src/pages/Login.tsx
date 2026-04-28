import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import SportyBackground from '../components/SportyBackground';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'splash' | 'form'>('splash');
  const [loginRole, setLoginRole] = useState<'student' | 'teacher' | null>(null);

  // Redirecionamento Automático se já houver sessão ativa
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setLoading(true);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile?.role === 'admin') navigate('/admin');
        else if (profile?.role === 'teacher') navigate('/teacher');
        else navigate('/student');
      }
    }
    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profile?.role === 'admin') {
        navigate('/admin');
      } else if (profile?.role === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
    }
  };

  const startLoginFlow = (role: 'student' | 'teacher') => {
    setLoginRole(role);
    setStep('form');
  };

  return (
    <SportyBackground>
      <div className="flex flex-col relative" style={{ minHeight: '100vh' }}>

      <main className="relative z-20 flex-grow flex flex-col items-center px-8 pt-24">
        {/* Logo & Header Section */}
        <div className="flex flex-col items-center w-full mb-12">
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
              }}
              transition={{ 
                scale: { type: 'spring', damping: 20, stiffness: 100 },
                duration: 0.8
              }}
              alt="Papel Futevôlei Logo"
              className="w-64 h-64 object-contain mix-blend-screen mb-6"
              src="/logo.png"
            />
            <header className="text-center">
              <h1 className="font-headline font-black text-4xl tracking-[0.2em] leading-tight text-white uppercase italic">
                PAPEL
              </h1>
              <p className="text-xs font-black tracking-[0.6em] uppercase text-white/60 mt-2">
                FUTEVÔLEI
              </p>
            </header>
        </div>

        <div className="w-full flex flex-col items-center">
        <AnimatePresence mode="wait">
          {step === 'splash' ? (
            <motion.div
              key="splash"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-xs flex flex-col items-center space-y-4"
            >
              <div className="w-full space-y-4 pt-4">
                <button
                  onClick={() => startLoginFlow('student')}
                  className="w-full h-14 px-6 rounded-lg font-headline font-bold text-black bg-white shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-white/90 active:scale-95 transition-all text-sm uppercase tracking-widest"
                >
                  LOGIN ALUNO
                </button>
                <button
                  onClick={() => startLoginFlow('teacher')}
                  className="w-full h-14 px-6 rounded-lg font-headline font-bold text-white bg-transparent border border-white/20 hover:bg-white/5 active:scale-95 transition-all text-sm uppercase tracking-widest"
                >
                  LOGIN PROFESSOR
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-xs space-y-4"
            >
              <div className="flex items-center mb-2">
                <button onClick={() => setStep('splash')} className="text-white/60 flex items-center text-[10px] font-bold uppercase tracking-wider hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-sm mr-1">arrow_back</span> Voltar
                </button>
                <span className="ml-auto text-[10px] font-bold uppercase tracking-widest opacity-40">
                  {loginRole === 'student' ? 'Aluno' : 'Professor'}
                </span>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg text-[10px] text-center font-bold">
                  {error}
                </div>
              )}
              
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 px-6 rounded-lg bg-white/5 border border-white/10 text-white shadow-sm focus:ring-1 focus:ring-white/30 focus:border-white/30 transition-all placeholder:text-white/20 outline-none"
                  required
                />
                <input
                  type="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 px-6 rounded-lg bg-white/5 border border-white/10 text-white shadow-sm focus:ring-1 focus:ring-white/30 focus:border-white/30 transition-all placeholder:text-white/20 outline-none"
                  required
                />
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full py-4 px-6 rounded-lg font-headline font-bold text-black bg-white shadow-lg hover:bg-white/90 active:scale-95 transition-all text-sm uppercase tracking-widest disabled:opacity-50 mt-2"
              >
                {loading ? 'ENTRANDO...' : 'ENTRAR'}
              </button>

              <div className="text-center pt-4">
                <Link 
                  to="/forgot-password" 
                  className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white/100 transition-all"
                >
                  Esqueci minha senha
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        <footer className="mt-8 text-center pb-8 relative z-20">
          <p className="font-label font-medium text-sm text-white/60">
            Não tem conta? <Link to="/register" className="font-bold text-white underline underline-offset-8 decoration-white/20 hover:decoration-white transition-all">Cadastre-se</Link>
          </p>
        </footer>
      </main>
      </div>
    </SportyBackground>
  );
}

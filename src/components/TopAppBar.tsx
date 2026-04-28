import React from 'react';
import { useNavigate } from 'react-router-dom';

interface TopAppBarProps {
  title?: string;
  avatarSrc?: string;
  avatarAlt?: string;
  showBackButton?: boolean;
}

const DEFAULT_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmhvMLYsiOKVXKNDrsFAHFtQXzfVGjuEL_L_TFvjkqb4xgsa4YJY1QR4d4h4OrHdCHoimQsQbIBa3GEMNoxLA_7d4g869yio-XLYVQX5dQN918iHcV09zk3sLY9UMiuBA0r4IyQz9BQrj5H-wYlr9-2o47XdYieZeUNUyk_5YsTqEn-sph-dg7GURVuZv_qXosC38RVKd1DRmnGQO93KRLAQlZ_mgOOrihEYdy2u4cibsWaCIMWt7TNWjph8ae6yImGOh6aVpxP7PU';

export default function TopAppBar({ 
  title = 'PAPEL FUTEVÃ”LEI', 
  avatarSrc = DEFAULT_AVATAR, 
  avatarAlt = 'Perfil',
  showBackButton = false
}: TopAppBarProps) {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-black/60 backdrop-blur-md border-b border-white/10 flex justify-between items-center px-6 h-16">
      <div className="flex items-center gap-2 overflow-hidden">
        {showBackButton ? (
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 -ml-2 flex items-center justify-center text-white active:scale-95 transition-transform shrink-0"
          >
            <span className="material-symbols-outlined font-black">arrow_back</span>
          </button>
        ) : (
          <span className="material-symbols-outlined text-white shrink-0">sports_volleyball</span>
        )}
        <h1 className="font-headline font-black tracking-[0.1em] text-white text-[10px] uppercase truncate max-w-[200px]">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={handleRefresh}
          className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white active:rotate-180 transition-all duration-500"
          title="Sincronizar dados"
        >
          <span className="material-symbols-outlined font-bold text-xl">sync</span>
        </button>

        <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/20 shrink-0 shadow-sm">
          <img
            alt={avatarAlt}
            className="w-full h-full object-cover"
            src={avatarSrc}
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </header>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnit } from '../contexts/UnitContext';

interface TopAppBarProps {
  title?: string;
  avatarSrc?: string;
  avatarAlt?: string;
  showBackButton?: boolean;
}

const DEFAULT_AVATAR = '/logo.png';

export default function TopAppBar({ 
  title, 
  avatarSrc, 
  avatarAlt = 'Perfil',
  showBackButton = false
}: TopAppBarProps) {
  const navigate = useNavigate();
  const { activeUnit, units, setUnitBySlug } = useUnit();
  const [showUnitSelector, setShowUnitSelector] = React.useState(false);

  const handleRefresh = () => {
    window.location.reload();
  };

  const displayTitle = title || activeUnit?.name || 'PAPEL FUTEVÔLEI';
  const displayAvatar = avatarSrc || DEFAULT_AVATAR;

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-surface/60 backdrop-blur-md border-b border-outline-variant flex justify-between items-center px-6 h-16 transition-colors duration-500">
        <div className="flex items-center gap-2 overflow-hidden">
          {showBackButton ? (
            <button 
              onClick={() => navigate(-1)} 
              className="w-10 h-10 -ml-2 flex items-center justify-center text-on-surface active:scale-95 transition-transform shrink-0"
            >
              <span className="material-symbols-outlined font-black">arrow_back</span>
            </button>
          ) : (
            <span className="material-symbols-outlined text-primary shrink-0">sports_volleyball</span>
          )}
          <div className="flex flex-col items-start">
            <h1 className="font-headline font-black tracking-[0.1em] text-on-surface text-[10px] uppercase truncate max-w-[200px]">
              {displayTitle}
            </h1>
            {activeUnit && (
              <span className="text-[8px] font-black text-primary uppercase tracking-widest px-1 bg-primary/10 rounded">
                {activeUnit.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className="w-10 h-10 flex items-center justify-center text-on-surface/40 hover:text-on-surface active:rotate-180 transition-all duration-500"
            title="Sincronizar dados"
          >
            <span className="material-symbols-outlined font-bold text-xl">sync</span>
          </button>

          <div className="w-10 h-10 rounded-lg overflow-hidden border border-outline-variant shrink-0 shadow-sm">
            <img
              alt={avatarAlt}
              className="w-full h-full object-cover"
              src={displayAvatar}
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </header>

      {/* Modal de Seleção de Unidade */}
      {showUnitSelector && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowUnitSelector(false)}
          />
          <div className="relative bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-headline font-black text-2xl mb-2 text-on-surface">Trocar Unidade</h3>
            <p className="text-on-surface-variant text-sm mb-8 font-medium">Selecione o local que deseja visualizar:</p>
            
            <div className="grid gap-3">
              {units.map((unit) => (
                <button
                  key={unit.id}
                  onClick={() => {
                    setUnitBySlug(unit.slug);
                    setShowUnitSelector(false);
                  }}
                  className={`w-full p-5 rounded-2xl border-2 flex items-center justify-between transition-all active:scale-[0.98] ${
                    activeUnit?.id === unit.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-outline-variant bg-surface-container-low hover:border-primary/50'
                  }`}
                >
                  <div className="text-left">
                    <p className={`font-black text-sm uppercase tracking-widest ${activeUnit?.id === unit.id ? 'text-primary' : 'text-on-surface'}`}>
                      {unit.name}
                    </p>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase mt-1">Unidade Ativa</p>
                  </div>
                  {activeUnit?.id === unit.id && (
                    <span className="material-symbols-outlined text-primary">check_circle</span>
                  )}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setShowUnitSelector(false)}
              className="w-full mt-8 py-4 font-black text-xs uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

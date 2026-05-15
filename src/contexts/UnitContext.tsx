import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Unit {
  id: string;
  name: string;
  slug: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  logo_url?: string;
}

interface UnitContextType {
  activeUnit: Unit | null;
  units: Unit[];
  setUnitBySlug: (slug: string) => void;
  loading: boolean;
}

const UnitContext = createContext<UnitContextType | undefined>(undefined);

export function UnitProvider({ children }: { children: React.ReactNode }) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [activeUnit, setActiveUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUnits() {
      try {
        const { data, error } = await supabase.from('units').select('*');
        if (error) throw error;
        
        let loadedUnits = data || [];
        
        // Fallback caso a tabela esteja vazia
        if (loadedUnits.length === 0) {
          loadedUnits = [
            {
              id: 'default-ctl',
              name: 'CTL - Papel Futevôlei',
              slug: 'ctl',
              primary_color: '#FFFFFF', // Branco para detalhes
              secondary_color: '#9CA3AF', // Cinza
              background_color: '#000000' // Preto dominante
            },
            {
              id: 'default-complexo',
              name: 'Complexo Praia & Esportes',
              slug: 'complexo-praia',
              primary_color: '#F97316', // Laranja
              secondary_color: '#FB923C', // Laranja claro
              background_color: '#F5F5DC' // Bege Areia dominante
            }
          ];
        }

        setUnits(loadedUnits);
        
        const savedUnitSlug = localStorage.getItem('selected_unit_slug') || 'ctl';
        const initialUnit = loadedUnits.find(u => u.slug === savedUnitSlug) || loadedUnits[0] || null;
        
        setActiveUnit(initialUnit);
      } catch (err) {
        console.error('Erro ao carregar unidades:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUnits();
  }, []);

  // Efeito para aplicar cores CSS dinamicamente
  useEffect(() => {
    if (activeUnit) {
      const root = document.documentElement;
      
      // CTL: Preto dominante
      if (activeUnit.slug === 'ctl') {
        root.style.setProperty('--unit-primary', '#FFFFFF');
        root.style.setProperty('--unit-background', '#000000');
        root.style.setProperty('--unit-text', '#FFFFFF');
        root.style.setProperty('--unit-text-muted', '#9CA3AF');
        root.style.setProperty('--unit-surface', '#111111');
        root.style.setProperty('--unit-surface-muted', '#1A1A1A');
        root.style.setProperty('--unit-accent', '#EAB308'); // Mantemos um toque de amarelo como destaque
      } 
      // Complexo Praia: Bege dominante
      else {
        root.style.setProperty('--unit-primary', '#F97316');
        root.style.setProperty('--unit-background', '#F5F5DC');
        root.style.setProperty('--unit-text', '#1A1A1A');
        root.style.setProperty('--unit-text-muted', '#555555');
        root.style.setProperty('--unit-surface', '#FFFFFF');
        root.style.setProperty('--unit-surface-muted', '#FFF9E5');
        root.style.setProperty('--unit-accent', '#FB923C');
      }
      
      localStorage.setItem('selected_unit_slug', activeUnit.slug);
    }
  }, [activeUnit]);

  const setUnitBySlug = (slug: string) => {
    const unit = units.find(u => u.slug === slug);
    if (unit) setActiveUnit(unit);
  };

  return (
    <UnitContext.Provider value={{ activeUnit, units, setUnitBySlug, loading }}>
      {children}
    </UnitContext.Provider>
  );
}

export function useUnit() {
  const context = useContext(UnitContext);
  if (context === undefined) {
    throw new Error('useUnit deve ser usado dentro de um UnitProvider');
  }
  return context;
}

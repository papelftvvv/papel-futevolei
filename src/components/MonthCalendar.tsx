import React, { useState } from 'react';

interface ClassItem {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  unit_id: string;
  wristband_level: number;
}

interface MonthCalendarProps {
  classes: ClassItem[];
  units: any[];
  onSelectDate?: (date: string) => void;
}

const WRISTBAND_COLORS: { [key: number]: string } = {
  1: '#E5E5E5', // Branco
  2: '#9CA3AF', // Cinza
  3: '#3B82F6', // Azul
  4: '#EAB308', // Amarelo
  5: '#F97316', // Laranja
  6: '#22C55E', // Verde
  7: '#EF4444', // Vermelho
  8: '#111827', // Preto
};

export default function MonthCalendar({ classes, units, onSelectDate }: MonthCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday
  const totalDays = lastDayOfMonth.getDate();

  // Generate days array
  const days = [];
  
  // Fill empty slots before first day (Monday as first day)
  const emptySlots = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
  for (let i = 0; i < emptySlots; i++) {
    days.push(null);
  }

  // Fill days of the month
  for (let i = 1; i <= totalDays; i++) {
    days.push(new Date(year, month, i));
  }

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const dayNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getClassesForDay = (date: Date) => {
    return classes.filter(c => {
      const classDate = new Date(c.start_time);
      return classDate.getDate() === date.getDate() &&
             classDate.getMonth() === date.getMonth() &&
             classDate.getFullYear() === date.getFullYear();
    });
  };

  return (
    <div className="bg-zinc-900 rounded-[32px] border border-white/10 overflow-hidden text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-headline font-black text-xl uppercase text-white">
          {monthNames[month]} {year}
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={handlePrevMonth}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button 
            onClick={handleNextMonth}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 gap-2 mb-2 text-center">
        {dayNames.map(day => (
          <div key={day} className="text-xs font-bold text-white/50 uppercase tracking-widest py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square bg-white/[0.02] rounded-lg"></div>;
          }

          const dayClasses = getClassesForDay(date);
          const isToday = new Date().toDateString() === date.toDateString();

          return (
            <div 
              key={date.toISOString()} 
              className={`aspect-square bg-white/5 rounded-lg p-2 flex flex-col gap-1 border transition-colors cursor-pointer
                ${isToday ? 'border-primary' : 'border-white/5 hover:border-white/20'}
              `}
              onClick={() => {
                if (onSelectDate) {
                  const yyyy = date.getFullYear();
                  const mm = String(date.getMonth() + 1).padStart(2, '0');
                  const dd = String(date.getDate()).padStart(2, '0');
                  onSelectDate(`${yyyy}-${mm}-${dd}`);
                }
              }}
            >
              <span className={`text-xs font-black ${isToday ? 'text-primary' : 'text-white/70'}`}>
                {date.getDate()}
              </span>
              
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
                {dayClasses.map(c => {
                  const startTime = new Date(c.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  
                  const unit = units.find(u => u.id === c.unit_id);
                  const isCTL = unit?.name?.toLowerCase().includes('ctl');
                  
                  const wristbandColor = WRISTBAND_COLORS[c.wristband_level] || '#FFFFFF';
                  
                  return (
                    <div 
                      key={c.id}
                      className={`text-[8px] font-bold p-1 rounded-md border
                        ${isCTL ? 'bg-black text-white' : 'bg-orange-500 text-white'}
                      `}
                      style={{ borderColor: wristbandColor }}
                      title={`${c.name} - ${startTime} (${unit?.name || 'Unidade'})`}
                    >
                      <div className="truncate">{startTime} {c.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

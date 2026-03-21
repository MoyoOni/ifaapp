import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, ChevronLeft, ChevronRight, Grid3X3, CalendarDays, LayoutGrid, Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';

interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  date: Date;
  time: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'missed' | 'pending' | 'confirmed';
  topic: string;
}

const statusClass = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-500';
    case 'cancelled': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-500';
    case 'missed': return 'bg-muted text-foreground border-muted-foreground';
    case 'confirmed': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-500';
    default: return 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-200 border-yellow-400';
  }
};

const PractitionerCalendarView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month' | 'year'>('month');

  const { data: raw = [], isLoading, isError } = useQuery<unknown[]>({
    queryKey: ['babalawo-appointments', user?.id],
    queryFn: async () => {
      const res = await api.get(`/appointments/babalawo/${user!.id}`);
      return res.data;
    },
    enabled: !!user?.id,
  });

  const appointments: Appointment[] = (raw as Record<string, unknown>[]).map(apt => {
    const scheduled = apt.scheduledDate as string | undefined;
    const d = scheduled ? new Date(scheduled) : new Date(`${apt.date as string}T${(apt.time as string) ?? '00:00'}`);
    const rawStatus = ((apt.status as string) ?? 'scheduled').toLowerCase();
    const status = (['scheduled', 'completed', 'cancelled', 'missed', 'pending', 'confirmed'].includes(rawStatus)
      ? rawStatus
      : 'scheduled') as Appointment['status'];
    return {
      id: apt.id as string,
      clientId: apt.clientId as string,
      clientName: (apt.client as { name?: string } | null)?.name ?? (apt.clientName as string) ?? 'Client',
      date: d,
      time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      duration: (apt.duration as number) ?? 60,
      status,
      topic: (apt.topic as string) ?? (apt.notes as string) ?? 'Consultation',
    };
  });

  const navigateDate = (direction: 'prev' | 'next') => {
    const d = new Date(currentDate);
    if (view === 'day') d.setDate(d.getDate() + (direction === 'next' ? 1 : -1));
    else if (view === 'week') d.setDate(d.getDate() + (direction === 'next' ? 7 : -7));
    else if (view === 'month') d.setMonth(d.getMonth() + (direction === 'next' ? 1 : -1));
    else d.setFullYear(d.getFullYear() + (direction === 'next' ? 1 : -1));
    setCurrentDate(d);
  };

  const sameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

  const renderYearView = () => {
    const year = currentDate.getFullYear();
    return (
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 12 }, (_, i) => {
          const monthStart = new Date(year, i, 1);
          const monthEnd = new Date(year, i + 1, 0);
          const monthApts = appointments.filter(a => a.date >= monthStart && a.date <= monthEnd);
          return (
            <div
              key={i}
              className="border border-border rounded-lg p-4 bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => { setCurrentDate(new Date(year, i, 1)); setView('month'); }}
            >
              <h3 className="font-semibold text-center text-foreground">
                {monthStart.toLocaleString('default', { month: 'short' })}
              </h3>
              <div className="mt-2 text-center">
                <p className="text-sm text-muted-foreground">{monthApts.length} appointments</p>
                <p className="text-xs text-green-600 dark:text-green-400">{monthApts.filter(a => a.status === 'completed').length} completed</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const days = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, prevMonthLastDay - i), isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    for (let i = 1; i <= 42 - days.length; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

    return (
      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <th key={d} className="border border-border p-2 text-left text-muted-foreground font-normal text-sm">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, wi) => (
              <tr key={wi}>
                {week.map((day, di) => {
                  const dayApts = appointments.filter(a => sameDay(a.date, day.date));
                  return (
                    <td key={di} className={`border border-border p-2 ${!day.isCurrentMonth ? 'bg-muted/30 text-muted-foreground/50' : 'bg-card'}`}>
                      <div className="flex flex-col h-24 p-1">
                        <div className="text-right font-medium text-sm">{day.date.getDate()}</div>
                        <div className="flex-1 overflow-y-auto text-xs space-y-1 mt-1 max-h-16">
                          {dayApts.slice(0, 2).map(apt => (
                            <div key={apt.id} className={`p-1 rounded truncate border-l-2 ${statusClass(apt.status)}`}>
                              {apt.time} {apt.clientName}
                            </div>
                          ))}
                          {dayApts.length > 2 && <div className="text-muted-foreground">+{dayApts.length - 2} more</div>}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderDayView = () => {
    const dayApts = appointments
      .filter(a => sameDay(a.date, currentDate))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return (
      <div className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          {currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </h2>
        {dayApts.length > 0 ? (
          dayApts.map(apt => (
            <div key={apt.id} className={`p-4 rounded-lg border-l-4 ${statusClass(apt.status)}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span className="font-medium">{apt.time}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="font-medium">{apt.duration} min</span>
                  </div>
                  <h3 className="font-bold text-lg mt-1">{apt.clientName}</h3>
                  <p className="text-muted-foreground">{apt.topic}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass(apt.status)}`}>
                  {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-muted/50 rounded-lg">
            <Calendar size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No appointments scheduled for this day.</p>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-highlight" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <p className="text-lg font-medium text-foreground mb-4">Failed to load appointments</p>
        <button type="button" onClick={() => window.location.reload()} className="px-4 py-2 bg-highlight text-white rounded-xl font-medium">
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold brand-font text-foreground">Practice Centre</h1>
          <p className="text-muted-foreground text-lg mt-1">Manage your appointments and schedule</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/practitioner/consultations')}
          className="px-4 py-2 bg-highlight text-white font-bold rounded-xl shadow-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"
        >
          <Calendar size={18} /> View Consultations
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Previous" onClick={() => navigateDate('prev')} className="p-2 rounded-lg hover:bg-muted">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-bold min-w-[200px] text-center text-foreground">
            {view === 'year'
              ? currentDate.getFullYear()
              : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button type="button" aria-label="Next" onClick={() => navigateDate('next')} className="p-2 rounded-lg hover:bg-muted">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {([
            { key: 'day', icon: CalendarDays, label: 'Day' },
            { key: 'week', icon: Calendar, label: 'Week' },
            { key: 'month', icon: Grid3X3, label: 'Month' },
            { key: 'year', icon: LayoutGrid, label: 'Year' },
          ] as const).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                view === key ? 'bg-highlight text-white' : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              <Icon size={18} /> {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'year' ? renderYearView() : view === 'month' ? renderMonthView() : renderDayView()}
    </div>
  );
};

export default PractitionerCalendarView;

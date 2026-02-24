import React, { useState } from 'react';
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, Grid3X3, CalendarDays, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';

interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  date: Date;
  time: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'missed';
  topic: string;
}

const PractitionerCalendarView: React.FC = () => {
  const { user: _user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month' | 'year'>('month');

  // Mock appointment data
  const appointments: Appointment[] = [
    {
      id: 'apt-1',
      clientId: 'client-1',
      clientName: 'Amara Johnson',
      date: new Date(Date.now() + 86400000), // Tomorrow
      time: '10:00 AM',
      duration: 60,
      status: 'scheduled',
      topic: 'Career Guidance'
    },
    {
      id: 'apt-2',
      clientId: 'client-2',
      clientName: 'David Chen',
      date: new Date(Date.now() + 172800000), // In 2 days
      time: '2:00 PM',
      duration: 45,
      status: 'scheduled',
      topic: 'Relationship Advice'
    },
    {
      id: 'apt-3',
      clientId: 'client-3',
      clientName: 'Sarah Williams',
      date: new Date(Date.now() - 86400000), // Yesterday
      time: '11:00 AM',
      duration: 30,
      status: 'completed',
      topic: 'Initial Consultation'
    },
    {
      id: 'apt-4',
      clientId: 'client-4',
      clientName: 'Michael Brown',
      date: new Date(Date.now() - 432000000), // 5 days ago
      time: '9:00 AM',
      duration: 60,
      status: 'completed',
      topic: 'Spiritual Alignment'
    },
    {
      id: 'apt-5',
      clientId: 'client-5',
      clientName: 'Elena Rodriguez',
      date: new Date(Date.now() - 1296000000), // 15 days ago
      time: '3:00 PM',
      duration: 90,
      status: 'completed',
      topic: 'Ancestral Healing'
    },
    // Past appointments
    {
      id: 'apt-6',
      clientId: 'client-6',
      clientName: 'James Wilson',
      date: new Date(Date.now() - 2160000000), // 25 days ago
      time: '1:00 PM',
      duration: 45,
      status: 'completed',
      topic: 'Divination Session'
    },
    {
      id: 'apt-7',
      clientId: 'client-7',
      clientName: 'Fatima Ahmed',
      date: new Date(Date.now() - 3024000000), // 35 days ago
      time: '4:00 PM',
      duration: 60,
      status: 'completed',
      topic: 'Ritual Preparation'
    },
    {
      id: 'apt-8',
      clientId: 'client-8',
      clientName: 'Robert Taylor',
      date: new Date(Date.now() - 3888000000), // 45 days ago
      time: '10:30 AM',
      duration: 30,
      status: 'missed',
      topic: 'Follow-up'
    },
    {
      id: 'apt-9',
      clientId: 'client-9',
      clientName: 'Maria Garcia',
      date: new Date(Date.now() - 4752000000), // 55 days ago
      time: '11:45 AM',
      duration: 75,
      status: 'completed',
      topic: 'Life Path Guidance'
    },
    {
      id: 'apt-10',
      clientId: 'client-10',
      clientName: 'Chinedu Okonkwo',
      date: new Date(Date.now() - 5616000000), // 65 days ago
      time: '2:30 PM',
      duration: 60,
      status: 'completed',
      topic: 'Cultural Orientation'
    },
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    return time.replace('AM', 'am').replace('PM', 'pm');
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else { // year view
      newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const renderYearView = () => {
    const currentYear = currentDate.getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthStart = new Date(currentYear, i, 1);
      const monthEnd = new Date(currentYear, i + 1, 0);
      
      // Filter appointments for this month
      const monthAppointments = appointments.filter(app =>
        app.date >= monthStart && app.date <= monthEnd
      );
      
      return {
        name: monthStart.toLocaleString('default', { month: 'short' }),
        appointments: monthAppointments,
        total: monthAppointments.length,
        completed: monthAppointments.filter(app => app.status === 'completed').length,
      };
    });

    return (
      <div className="mt-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {months.map((month, idx) => (
            <div key={idx} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => {
                   setCurrentDate(new Date(currentYear, idx, 1));
                   setView('month');
                 }}>
              <h3 className="font-semibold text-center text-gray-800">{month.name}</h3>
              <div className="mt-2 text-center">
                <p className="text-sm text-gray-600">{month.total} appointments</p>
                <p className="text-xs text-green-600">{month.completed} completed</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    // Calculate days to show in the calendar grid
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDay = firstDayOfMonth.getDay(); // Sunday = 0
    const daysInMonth = lastDayOfMonth.getDate();

    // Create array of days to render
    const days = [];
    
    // Previous month's days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      days.push({
        date: new Date(year, month - 1, day),
        isCurrentMonth: false
      });
    }

    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Next month's days to fill the grid
    const daysNeeded = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= daysNeeded; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    // Group days by week
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <th key={day} className="border p-2 text-left text-gray-600 font-normal">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, weekIdx) => (
              <tr key={weekIdx}>
                {week.map((day, dayIdx) => {
                  const dayAppointments = appointments.filter(app => 
                    app.date.getDate() === day.date.getDate() &&
                    app.date.getMonth() === day.date.getMonth() &&
                    app.date.getFullYear() === day.date.getFullYear()
                  );

                  return (
                    <td key={dayIdx} className={`border p-2 ${!day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}`}>
                      <div className="flex flex-col h-24 p-1">
                        <div className="text-right font-medium">{day.date.getDate()}</div>
                        <div className="flex-1 overflow-y-auto text-xs space-y-1 mt-1 max-h-16">
                          {dayAppointments.slice(0, 2).map(app => (
                            <div key={app.id} className={`p-1 rounded truncate ${app.status === 'completed' ? 'bg-green-100 text-green-800' : app.status === 'cancelled' ? 'bg-red-100 text-red-800' : app.status === 'missed' ? 'bg-gray-200 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>
                              {app.time} {app.clientName}
                            </div>
                          ))}
                          {dayAppointments.length > 2 && (
                            <div className="text-gray-500">+{dayAppointments.length - 2} more</div>
                          )}
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
    // Filter appointments for the selected day
    const dayAppointments = appointments.filter(app => 
      app.date.getDate() === currentDate.getDate() &&
      app.date.getMonth() === currentDate.getMonth() &&
      app.date.getFullYear() === currentDate.getFullYear()
    ).sort((a, b) => a.time.localeCompare(b.time));

    return (
      <div className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">{formatDate(currentDate)}</h2>
        {dayAppointments.length > 0 ? (
          dayAppointments.map(app => (
            <div key={app.id} className={`p-4 rounded-lg border-l-4 ${app.status === 'completed' ? 'border-green-500 bg-green-50' : app.status === 'cancelled' ? 'border-red-500 bg-red-50' : app.status === 'missed' ? 'border-gray-500 bg-gray-50' : 'border-blue-500 bg-blue-50'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span className="font-medium">{formatTime(app.time)}</span>
                    <span className="text-gray-500">•</span>
                    <span className="font-medium">{app.duration} min</span>
                  </div>
                  <h3 className="font-bold text-lg mt-1">{app.clientName}</h3>
                  <p className="text-gray-700">{app.topic}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  app.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                  app.status === 'completed' ? 'bg-green-100 text-green-800' :
                  app.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-1">No appointments</h3>
            <p className="text-gray-500">You have no appointments scheduled for this day.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold brand-font text-stone-900">Practice Centre</h1>
          <p className="text-stone-600 text-lg mt-1">Manage your appointments and schedule</p>
        </div>
        <button className="px-4 py-2 bg-highlight text-white font-bold rounded-xl shadow-lg hover:bg-yellow-600 transition-colors flex items-center gap-2">
          <Plus size={18} /> Schedule Appointment
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigateDate('prev')} 
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-bold min-w-[200px] text-center">
            {view === 'year' ? currentDate.getFullYear() : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button 
            onClick={() => navigateDate('next')} 
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setView('day')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              view === 'day' ? 'bg-highlight text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <CalendarDays size={18} /> Day
          </button>
          <button
            onClick={() => setView('week')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              view === 'week' ? 'bg-highlight text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Calendar size={18} /> Week
          </button>
          <button
            onClick={() => setView('month')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              view === 'month' ? 'bg-highlight text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Grid3X3 size={18} /> Month
          </button>
          <button
            onClick={() => setView('year')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              view === 'year' ? 'bg-highlight text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <LayoutGrid size={18} /> Year
          </button>
        </div>
      </div>

      {view === 'year' ? renderYearView() : view === 'month' ? renderMonthView() : renderDayView()}
    </div>
  );
};

export default PractitionerCalendarView;
import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';

interface Appointment {
  id: string;
  babalawoId: string;
  clientId: string;
  date: string;
  time: string;
  timezone: string;
  duration: number;
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'IN_SESSION' | 'REQUESTED' | 'CONFIRMED';
  price?: number;
  notes?: string;
  babalawo?: {
    id: string;
    name: string;
    yorubaName?: string;
    avatar?: string;
  };
  client?: {
    id: string;
    name: string;
    yorubaName?: string;
    avatar?: string;
  };
}

interface CalendarDay {
  date: Date | null;
  month: number;
}

interface AppointmentsCalendarProps {
  userId: string;
  userRole: string;
  onBookAppointment?: () => void;
}

/**
 * Appointments Calendar Component
 * Booking system for Babalawo consultations
 * NOTE: Timezone defaults to WAT (West Africa Time - Africa/Lagos)
 */
const AppointmentsCalendar: React.FC<AppointmentsCalendarProps> = ({
  userId,
  userRole,
  // onBookAppointment,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const queryClient = useQueryClient();

  const isBabalawo = userRole === 'BABALAWO';
  const endpoint = isBabalawo
    ? `/appointments/babalawo/${userId}`
    : `/appointments/client/${userId}`;

  // Fetch appointments
  const { data: appointments = [], isError } = useQuery<Appointment[]>({
    queryKey: ['appointments', endpoint],
    queryFn: async () => {
      try {
        const response = await api.get(endpoint);
        return response.data;
      } catch (error) {
        throw error;
      }
    },
    enabled: !!userId,
  });

  // Group appointments by date for calendar display
  const appointmentsByDate = useMemo(() => {
    return appointments.reduce((acc: Record<string, Appointment[]>, apt: Appointment) => {
      if (!acc[apt.date]) {
        acc[apt.date] = [];
      }
      acc[apt.date].push(apt);
      return acc;
    }, {} as Record<string, Appointment[]>);
  }, [appointments]);

  // Get the display name for an appointment (client or babalawo depending on role)
  const getDisplayName = (appt: Appointment): string => {
    if (isBabalawo) {
      return appt.client?.name || 'Client';
    }
    return appt.babalawo?.name || 'Babalawo';
  };

  // Get a label for the appointment type
  const getServiceType = (_appt: Appointment): string => {
    return 'Consultation';
  };

  // Get appointments for a specific day
  const getAppointmentsForDay = (date: Date): { id: string; clientName: string; serviceType: string }[] => {
    const dateStr = date.toISOString().split('T')[0];
    const dayAppointments = appointmentsByDate[dateStr] || [];
    return dayAppointments.map((appt: Appointment) => ({
      id: appt.id,
      clientName: getDisplayName(appt),
      serviceType: getServiceType(appt),
    }));
  };

  // Build calendar grid for the current month
  const renderCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: CalendarDay[] = [];

    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = new Date(year, month - 1, daysInPrevMonth - i);
      days.push({ date: day, month: month - 1 });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(year, month, i);
      days.push({ date: day, month });
    }

    // Next month leading days to fill grid (always show 6 rows = 42 cells)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const day = new Date(year, month + 1, i);
      days.push({ date: day, month: month + 1 });
    }

    return days;
  };

  // Upcoming appointments sorted by date
  const upcomingAppointments = useMemo(() => {
    const now = new Date().toISOString().split('T')[0];
    return appointments
      .filter((appt: Appointment) => appt.date >= now && appt.status !== 'CANCELLED' && appt.status !== 'COMPLETED')
      .sort((a: Appointment, b: Appointment) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .map((appt: Appointment) => ({
        id: appt.id,
        clientName: getDisplayName(appt),
        serviceType: getServiceType(appt),
        date: appt.date,
        time: appt.time,
        status: appt.status.toLowerCase(),
      }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, isBabalawo]);

  // Invalidate queries helper (kept for future use with cancel/update mutations)
  void queryClient;

  if (isError) {
    return (
      <div className="min-h-screen bg-background text-white p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Error Loading Appointments</h2>
            <p className="text-muted mb-6">We couldn&apos;t load your appointments. Please try again later.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-highlight text-white rounded-xl font-medium"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white p-6">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-[1.5rem] font-[700] text-foreground">Appointments</h1>
          <p className="text-[0.875rem] text-muted-foreground">Manage your scheduled consultations</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-card border border-input rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[1.25rem] font-[700] text-foreground">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate((prev: Date) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate((prev: Date) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                >
                  Next
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day: string) => (
                <div key={day} className="text-center p-2 text-[0.875rem] font-[500] text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {renderCalendarDays().map((day: CalendarDay, index: number) => (
                <div
                  key={index}
                  className={`min-h-24 p-2 border border-input ${
                    day.month !== currentDate.getMonth() ? 'bg-muted/20' : ''
                  }`}
                >
                  {day.date && (
                    <>
                      <div className="text-[0.875rem] font-[500] text-foreground">
                        {day.date.getDate()}
                      </div>
                      <div className="mt-1 space-y-1 max-h-20 overflow-y-auto">
                        {getAppointmentsForDay(day.date).slice(0, 2).map(appt => (
                          <div
                            key={appt.id}
                            className="text-[0.75rem] p-1 bg-primary/10 text-primary rounded truncate"
                            title={`${appt.clientName}: ${appt.serviceType}`}
                          >
                            {appt.clientName.split(' ')[0]}
                          </div>
                        ))}
                        {getAppointmentsForDay(day.date).length > 2 && (
                          <div className="text-[0.75rem] text-muted-foreground">
                            +{getAppointmentsForDay(day.date).length - 2} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-input rounded-2xl p-6">
            <h2 className="text-[1.25rem] font-[700] text-foreground mb-6">Upcoming Appointments</h2>

            {upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map(appt => (
                  <div
                    key={appt.id}
                    className={`p-4 rounded-xl border ${
                      appt.status === 'confirmed' ? 'border-primary/30 bg-primary/5' :
                      appt.status === 'pending' ? 'border-warning/30 bg-warning/5' :
                      'border-destructive/30 bg-destructive/5'
                    }`}
                  >
                    <div className="flex justify-between">
                      <h3 className="text-[1rem] font-[700] text-foreground">{appt.serviceType}</h3>
                      <Badge
                        variant={
                          appt.status === 'confirmed' ? 'default' :
                          appt.status === 'pending' ? 'secondary' :
                          'destructive'
                        }
                        className="text-[0.75rem] font-[700]"
                      >
                        {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-[0.875rem] text-foreground mt-1">{appt.clientName}</p>
                    <p className="text-[0.875rem] text-muted-foreground">
                      {new Date(appt.date).toLocaleDateString()} &bull; {appt.time}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" size="sm" className="text-[0.875rem]">
                        Details
                      </Button>
                      <Button size="sm" className="text-[0.875rem]">
                        Contact
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-muted mx-auto mb-4" />
                <p className="text-[0.875rem] text-muted-foreground">No upcoming appointments</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentsCalendar;

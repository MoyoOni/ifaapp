import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Calendar, AlertTriangle, X, CheckCircle, XCircle, Clock, UserPlus, BookOpen } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { isDevModeActive } from '@/shared/utils/dev-mode';

interface Appointment {
  id: string;
  babalawoId: string;
  clientId: string;
  clientName?: string;
  scheduledDate?: string;
  date: string;
  time: string;
  timezone: string;
  duration: number;
  topic?: string;
  notes?: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'UPCOMING' | 'IN_SESSION' | 'REQUESTED';
  preferredMethod?: string;
  price?: number;
  babalawo?: { id: string; name: string; yorubaName?: string; avatar?: string };
  client?: { id: string; name: string; yorubaName?: string; avatar?: string };
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

const statusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'confirmed': return 'border-primary/30 bg-primary/5';
    case 'pending':
    case 'requested': return 'border-yellow-400/30 bg-yellow-50 dark:bg-yellow-950/20';
    case 'completed': return 'border-green-400/30 bg-green-50 dark:bg-green-950/20';
    case 'cancelled': return 'border-red-400/30 bg-red-50 dark:bg-red-950/20';
    default: return 'border-input bg-card';
  }
};

const AppointmentsCalendar: React.FC<AppointmentsCalendarProps> = ({ userId, userRole }) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineInput, setShowDeclineInput] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isBabalawo = userRole === 'BABALAWO';
  const endpoint = isBabalawo
    ? `/appointments/babalawo/${userId}`
    : `/appointments/client/${userId}`;

  const { data: appointments = [], isError } = useQuery<Appointment[]>({
    queryKey: ['babalawo-appointments', userId],
    queryFn: async () => {
      const response = await api.get(endpoint);
      return response.data;
    },
    enabled: !!userId && !isDevModeActive(),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['babalawo-appointments', userId] });
  };

  const confirmMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/appointments/${id}/confirm`),
    onSuccess: () => { invalidate(); setSelectedAppt(null); },
  });

  const declineMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/appointments/${id}/decline`, { reason }),
    onSuccess: () => { invalidate(); setSelectedAppt(null); setShowDeclineInput(false); setDeclineReason(''); },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/appointments/${id}/complete`),
    onSuccess: () => { invalidate(); },
  });

  const addSeekerMutation = useMutation({
    mutationFn: (clientId: string) =>
      api.post(`/babalawo-client/${user!.id}/clients`, { clientId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['babalawo-clients'] });
      setSelectedAppt(null);
      navigate('/practitioner/my-seekers');
    },
  });

  const appointmentsByDate = useMemo(() => {
    return appointments.reduce((acc: Record<string, Appointment[]>, apt) => {
      const dateKey = apt.scheduledDate
        ? apt.scheduledDate.split('T')[0]
        : apt.date;
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(apt);
      return acc;
    }, {});
  }, [appointments]);

  const getDisplayName = (appt: Appointment): string => {
    if (isBabalawo) return appt.client?.name || appt.clientName || 'Client';
    return appt.babalawo?.name || 'Babalawo';
  };

  const getAppointmentsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return (appointmentsByDate[dateStr] || []).map(appt => ({
      id: appt.id,
      clientName: getDisplayName(appt),
      raw: appt,
    }));
  };

  const renderCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const days: CalendarDay[] = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, daysInPrevMonth - i), month: month - 1 });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), month });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), month: month + 1 });
    }
    return days;
  };

  const upcomingAppointments = useMemo(() => {
    const now = new Date().toISOString().split('T')[0];
    return appointments
      .filter(a => {
        const dateKey = a.scheduledDate ? a.scheduledDate.split('T')[0] : a.date;
        return dateKey >= now && a.status !== 'CANCELLED' && a.status !== 'COMPLETED';
      })
      .sort((a, b) => {
        const da = a.scheduledDate || a.date;
        const db = b.scheduledDate || b.date;
        return da.localeCompare(db);
      });
  }, [appointments]);

  const formatDateTime = (appt: Appointment) => {
    const iso = appt.scheduledDate || `${appt.date}T${appt.time}`;
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
  };

  if (isError) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto text-center py-12">
          <AlertTriangle className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Appointments</h2>
          <p className="text-muted-foreground mb-6">We couldn&apos;t load your appointments. Please try again.</p>
          <button type="button" onClick={() => window.location.reload()} className="px-4 py-2 bg-highlight text-white rounded-xl font-medium">
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-[1.5rem] font-[700] text-foreground">Appointments</h1>
          <p className="text-[0.875rem] text-muted-foreground">Manage your scheduled consultations</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Grid */}
          <div className="lg:col-span-2 bg-card border border-input rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[1.25rem] font-[700] text-foreground">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(p => new Date(p.getFullYear(), p.getMonth() - 1, 1))}>Prev</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(p => new Date(p.getFullYear(), p.getMonth() + 1, 1))}>Next</Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center p-2 text-[0.875rem] font-[500] text-muted-foreground">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {renderCalendarDays().map((day, index) => (
                <div
                  key={index}
                  className={`min-h-24 p-2 border border-input ${day.month !== currentDate.getMonth() ? 'bg-muted/20' : ''}`}
                >
                  {day.date && (
                    <>
                      <div className="text-[0.875rem] font-[500] text-foreground">{day.date.getDate()}</div>
                      <div className="mt-1 space-y-1 max-h-20 overflow-y-auto">
                        {getAppointmentsForDay(day.date).slice(0, 2).map(appt => (
                          <div
                            key={appt.id}
                            onClick={() => setSelectedAppt(appt.raw)}
                            className="text-[0.75rem] p-1 bg-primary/10 text-primary rounded truncate cursor-pointer hover:bg-primary/20"
                            title={appt.clientName}
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

          {/* Upcoming Appointments List */}
          <div className="bg-card border border-input rounded-2xl p-6">
            <h2 className="text-[1.25rem] font-[700] text-foreground mb-6">Upcoming Appointments</h2>

            {upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map(appt => {
                  const { date, time } = formatDateTime(appt);
                  const displayName = getDisplayName(appt);
                  return (
                    <div
                      key={appt.id}
                      className={`p-4 rounded-xl border ${statusColor(appt.status)}`}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="text-[1rem] font-[700] text-foreground">{appt.topic || 'Consultation'}</h3>
                        <Badge variant={appt.status === 'CONFIRMED' ? 'default' : appt.status === 'COMPLETED' ? 'default' : 'secondary'} className="text-[0.75rem]">
                          {appt.status.charAt(0) + appt.status.slice(1).toLowerCase()}
                        </Badge>
                      </div>
                      <p className="text-[0.875rem] text-foreground mt-1">{displayName}</p>
                      <p className="text-[0.875rem] text-muted-foreground">{date} &bull; {time}</p>
                      <div className="mt-3 flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedAppt(appt)}>
                          Details
                        </Button>
                        <Button size="sm" onClick={() => {
                          const contactId = isBabalawo ? appt.clientId : appt.babalawoId;
                          navigate(`/messages/${contactId}`);
                        }}>
                          Contact
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-[0.875rem] text-muted-foreground">No upcoming appointments</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Panel Slide-Over */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedAppt(null)}>
          <div
            className="w-full max-w-md bg-card h-full shadow-2xl overflow-y-auto p-6 flex flex-col gap-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Appointment Details</h2>
              <button type="button" aria-label="Close" onClick={() => { setSelectedAppt(null); setShowDeclineInput(false); setDeclineReason(''); }} className="p-2 hover:bg-muted/60 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wider">Client</p>
                <p className="text-base font-semibold text-stone-900 dark:text-stone-100">{getDisplayName(selectedAppt)}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wider">Date & Time</p>
                <p className="text-base text-stone-800 dark:text-stone-200">
                  {(() => { const { date, time } = formatDateTime(selectedAppt); return `${date} at ${time}`; })()}
                </p>
              </div>
              {selectedAppt.topic && (
                <div>
                  <p className="text-xs text-stone-400 uppercase tracking-wider">Topic</p>
                  <p className="text-base text-stone-800 dark:text-stone-200">{selectedAppt.topic}</p>
                </div>
              )}
              {selectedAppt.preferredMethod && (
                <div>
                  <p className="text-xs text-stone-400 uppercase tracking-wider">Method</p>
                  <p className="text-base text-stone-800 dark:text-stone-200">{selectedAppt.preferredMethod}</p>
                </div>
              )}
              {selectedAppt.notes && (
                <div>
                  <p className="text-xs text-stone-400 uppercase tracking-wider">Notes</p>
                  <p className="text-sm text-stone-600">{selectedAppt.notes}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wider">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  selectedAppt.status === 'CONFIRMED' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' :
                  selectedAppt.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                  selectedAppt.status === 'CANCELLED' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' :
                  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                }`}>
                  {selectedAppt.status.charAt(0) + selectedAppt.status.slice(1).toLowerCase()}
                </span>
              </div>
            </div>

            {/* Action Buttons based on status — babalawo only */}
            {isBabalawo && (
              <div className="space-y-3">
                {(selectedAppt.status === 'PENDING' || selectedAppt.status === 'REQUESTED') && (
                  <>
                    <Button
                      className="w-full"
                      onClick={() => confirmMutation.mutate(selectedAppt.id)}
                      disabled={confirmMutation.isPending}
                    >
                      <CheckCircle size={16} className="mr-2" />
                      {confirmMutation.isPending ? 'Confirming...' : 'Confirm Appointment'}
                    </Button>

                    {!showDeclineInput ? (
                      <Button variant="outline" className="w-full text-red-600 dark:text-red-400 border-red-300" onClick={() => setShowDeclineInput(true)}>
                        <XCircle size={16} className="mr-2" />
                        Decline
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          className="w-full p-3 border border-border rounded-xl text-sm resize-none"
                          rows={3}
                          placeholder="Reason for declining (optional)"
                          value={declineReason}
                          onChange={e => setDeclineReason(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => declineMutation.mutate({ id: selectedAppt.id, reason: declineReason })}
                            disabled={declineMutation.isPending}
                          >
                            {declineMutation.isPending ? 'Declining...' : 'Confirm Decline'}
                          </Button>
                          <Button variant="outline" className="flex-1" onClick={() => setShowDeclineInput(false)}>Cancel</Button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {selectedAppt.status === 'CONFIRMED' && (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => completeMutation.mutate(selectedAppt.id)}
                    disabled={completeMutation.isPending}
                  >
                    <Clock size={16} className="mr-2" />
                    {completeMutation.isPending ? 'Completing...' : 'Mark as Complete'}
                  </Button>
                )}

                {selectedAppt.status === 'COMPLETED' && (
                  <>
                    <Button
                      className="w-full"
                      onClick={() => addSeekerMutation.mutate(selectedAppt.clientId)}
                      disabled={addSeekerMutation.isPending}
                    >
                      <UserPlus size={16} className="mr-2" />
                      {addSeekerMutation.isPending ? 'Adding...' : 'Add to My Seekers'}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate('/prescriptions/create')}
                    >
                      <BookOpen size={16} className="mr-2" />
                      Create Guidance Plan
                    </Button>
                  </>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/messages/${selectedAppt.clientId}`)}
                >
                  Message Client
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsCalendar;

import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, Plus, X, Edit, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { getDemoUser, getUserAppointments } from '@/demo';
import LoadingSpinner from '@/components/common/LoadingSpinner';

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
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const queryClient = useQueryClient();

  const isBabalawo = userRole === 'BABALAWO';
  const endpoint = isBabalawo
    ? `/appointments/babalawo/${userId}`
    : `/appointments/client/${userId}`;

  // Fetch appointments
  const { data: appointments = [], isLoading, isError } = useQuery<Appointment[]>({
    queryKey: ['appointments', endpoint],
    queryFn: async () => {
      try {
        const response = await api.get(endpoint);
        return response.data;
      } catch (error) {
        if (!isDemoMode) throw error;

        logger.warn('Failed to fetch appointments, using demo data');
        const demoAppointments = getUserAppointments(userId);

        return demoAppointments.map((apt) => ({
          id: apt.id,
          babalawoId: apt.babalawoId,
          clientId: apt.clientId,
          date: apt.date,
          time: apt.time,
          timezone: 'Africa/Lagos',
          duration: apt.duration || 60,
          status: (apt.status as Appointment['status']) || 'UPCOMING',
          price: 25000,
          notes: apt.notes,
          babalawo: (() => {
            const demoBaba = getDemoUser(apt.babalawoId);
            return demoBaba
              ? {
                  id: demoBaba.id,
                  name: demoBaba.name,
                  yorubaName: demoBaba.yorubaName,
                  avatar: demoBaba.avatar,
                }
              : undefined;
          })(),
          client: (() => {
            const demoClient = getDemoUser(apt.clientId);
            return demoClient
              ? {
                  id: demoClient.id,
                  name: demoClient.name,
                  yorubaName: demoClient.yorubaName,
                  avatar: demoClient.avatar,
                }
              : undefined;
          })(),
        }));
      }
    },
    enabled: !!userId,
  });

  // Mutation to cancel appointment
  const cancelAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await api.patch(`/appointments/${appointmentId}/cancel`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', endpoint] });
    },
  });

  // Mutation to update appointment status
  const updateAppointmentStatusMutation = useMutation({
    mutationFn: async ({ appointmentId, status }: { appointmentId: string; status: string }) => {
      const response = await api.patch(`/appointments/${appointmentId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', endpoint] });
    },
  });

  // Filter appointments by selected date
  const filteredAppointments = appointments.filter((apt) => apt.date === selectedDate);

  // Group appointments by date
  const appointmentsByDate = appointments.reduce((acc, apt) => {
    if (!acc[apt.date]) {
      acc[apt.date] = [];
    }
    acc[apt.date].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'COMPLETED':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'IN_SESSION':
        return 'bg-highlight/20 text-highlight border-highlight/30';
      case 'REQUESTED':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'CONFIRMED':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const formatTime = (time: string) => {
    // Convert HH:mm to 12-hour format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Get dates with appointments for calendar highlighting
  const datesWithAppointments = Object.keys(appointmentsByDate);

  if (isError) {
    return (
      <div className="min-h-screen bg-background text-white p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Error Loading Appointments</h2>
            <p className="text-muted mb-6">We couldn't load your appointments. Please try again later.</p>
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
                  onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
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
                  onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                >
                  Next
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center p-2 text-[0.875rem] font-[500] text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {renderCalendarDays().map((day, index) => (
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
                      {new Date(appt.date).toLocaleDateString()} • {appt.time}
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
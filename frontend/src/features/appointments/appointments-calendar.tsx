import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, Plus, X, Edit, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { getDemoUser, getUserAppointments } from '@/demo';

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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-5xl font-bold brand-font text-highlight">Appointments</h1>
            <p className="text-muted text-lg">
              {isBabalawo ? 'Manage your consultations' : 'Your scheduled sessions'}
            </p>
          </div>
          {!isBabalawo && (
            <button
              onClick={() => setShowBookingModal(true)}
              className="flex items-center gap-2 bg-highlight hover:bg-highlight/90 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-xl"
            >
              <Plus size={20} />
              Book Appointment
            </button>
          )}
        </div>

        {/* Calendar Date Picker */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-4 mb-4">
            <Calendar size={24} className="text-highlight" />
            <h2 className="text-xl font-bold text-white">Select Date</h2>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full max-w-xs bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-highlight"
          />
          {datesWithAppointments.length > 0 && (
            <p className="text-sm text-muted mt-3">
              Dates with appointments: {datesWithAppointments.length}
            </p>
          )}
        </div>

        {/* Appointments List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-highlight border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No appointments on this date.</p>
            {!isBabalawo && (
              <button
                onClick={() => setShowBookingModal(true)}
                className="mt-4 text-highlight hover:text-highlight/80 underline"
              >
                Book an appointment
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-highlight transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-4">
                    {/* Time and Duration */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Clock size={20} className="text-highlight" />
                        <span className="text-xl font-bold text-white">
                          {formatTime(appointment.time)}
                        </span>
                      </div>
                      <span className="text-muted">
                        {appointment.duration} minutes
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>

                    {/* Client/Babalawo Info */}
                    {isBabalawo ? (
                      appointment.client && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                            {appointment.client.name[0]}
                          </div>
                          <div>
                            <p className="text-white font-medium">{appointment.client.name}</p>
                            {appointment.client.yorubaName && (
                              <p className="text-muted text-sm">
                                {appointment.client.yorubaName}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    ) : (
                      appointment.babalawo && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-highlight/20 flex items-center justify-center text-sm font-bold text-highlight">
                            {appointment.babalawo.name[0]}
                          </div>
                          <div>
                            <p className="text-white font-medium">{appointment.babalawo.name}</p>
                            {appointment.babalawo.yorubaName && (
                              <p className="text-muted text-sm">
                                {appointment.babalawo.yorubaName}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    )}

                    {/* Timezone */}
                    <p className="text-muted text-sm flex items-center gap-2">
                      <MapPin size={14} />
                      Timezone: {appointment.timezone || 'Africa/Lagos (WAT)'}
                    </p>

                    {/* Notes */}
                    {appointment.notes && (
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-muted text-sm">{appointment.notes}</p>
                      </div>
                    )}

                    {/* Price */}
                    {appointment.price && (
                      <p className="text-highlight font-bold">
                        ₦{appointment.price.toLocaleString()}
                      </p>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 ml-4">
                    {(appointment.status === 'UPCOMING' || appointment.status === 'REQUESTED') && (
                      <>
                        <button
                          onClick={() => {
                            if (isBabalawo) {
                              updateAppointmentStatusMutation.mutate({
                                appointmentId: appointment.id,
                                status: 'IN_SESSION'
                              });
                            } else {
                              setEditingAppointment(appointment);
                            }
                          }}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title={isBabalawo ? "Start Session" : "Edit Appointment"}
                        >
                          {isBabalawo ? <CheckCircle size={18} className="text-green-500" /> : <Edit size={18} />}
                        </button>
                        <button
                          onClick={() => cancelAppointmentMutation.mutate(appointment.id)}
                          disabled={cancelAppointmentMutation.isPending}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Cancel Appointment"
                        >
                          {cancelAppointmentMutation.isPending ? (
                            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <X size={18} className="text-red-400" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Booking Modal Placeholder */}
        {showBookingModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
            <div className="bg-background border border-white/20 rounded-2xl p-8 max-w-md w-full space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold brand-font text-white">Book Appointment</h3>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-muted">
                Booking form would be implemented here. Requires Personal Awo relationship.
              </p>
              <button
                onClick={() => setShowBookingModal(false)}
                className="w-full bg-highlight hover:bg-highlight/90 text-white px-6 py-3 rounded-xl font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Edit Appointment Modal */}
        {editingAppointment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
            <div className="bg-background border border-white/20 rounded-2xl p-8 max-w-md w-full space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold brand-font text-white">Edit Appointment</h3>
                <button
                  onClick={() => setEditingAppointment(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-muted">
                Edit functionality would be implemented here.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingAppointment(null)}
                  className="flex-1 bg-highlight hover:bg-highlight/90 text-white px-6 py-3 rounded-xl font-bold transition-all"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingAppointment(null)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsCalendar;
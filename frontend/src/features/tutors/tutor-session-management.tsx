import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface TutorSession {
  id: string;
  tutorId: string;
  studentId: string;
  date: string;
  time: string;
  timezone: string;
  duration: number;
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'IN_SESSION';
  price: number;
  currency: string;
  notes?: string;
  tutor?: {
    user: {
      name: string;
      yorubaName?: string;
      avatar?: string;
    };
  };
  student?: {
    name: string;
    yorubaName?: string;
    avatar?: string;
  };
}

interface TutorSessionManagementProps {
  userId: string;
  userRole: string;
}

/**
 * Tutor Session Management Component
 * View and manage tutoring sessions (for both tutors and students)
 */
const TutorSessionManagement: React.FC<TutorSessionManagementProps> = ({ userId, userRole }) => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const isTutor = userRole === 'VENDOR' || userRole === 'ADMIN'; // Assuming tutors can have VENDOR role

  // Fetch sessions
  const endpoint = isTutor
    ? `/tutors/sessions/tutor/${userId}`
    : `/tutors/sessions/student/${userId}`;

  const { data: sessions = [], isLoading } = useQuery<TutorSession[]>({
    queryKey: ['tutor-sessions', endpoint],
    queryFn: async () => {
      const response = await api.get(endpoint);
      return response.data;
    },
    enabled: !!userId,
  });

  // Filter sessions by selected date
  const filteredSessions = sessions.filter((session) => session.date === selectedDate);



  const updateStatusMutation = useMutation({
    mutationFn: async ({ sessionId, status }: { sessionId: string; status: string }) => {
      await api.patch(`/tutors/sessions/${sessionId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutor-sessions'] });
    },
  });

  const getStatusColor = (status: TutorSession['status']) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'COMPLETED':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'IN_SESSION':
        return 'bg-highlight/20 text-highlight border-highlight/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const currencySymbol = (currency: string) => {
    return currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-12 h-12 animate-spin text-highlight" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold brand-font text-highlight">Tutor Sessions</h1>

        {/* Date Selector */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <label className="block text-sm font-medium text-highlight mb-2">
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-highlight"
          />
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">No sessions scheduled for this date.</p>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {isTutor
                          ? session.student?.yorubaName || session.student?.name || 'Student'
                          : session.tutor?.user.yorubaName || session.tutor?.user.name || 'Tutor'}
                      </h3>
                      <p className="text-sm text-muted">
                        {formatTime(session.time)} • {session.duration} minutes
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(session.status)}`}
                  >
                    {session.status.replace('_', ' ')}
                  </span>
                </div>

                {session.notes && (
                  <p className="text-sm text-muted">{session.notes}</p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="text-highlight font-bold">
                    {currencySymbol(session.currency)}
                    {session.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>

                  {session.status === 'UPCOMING' && (
                    <div className="flex gap-2">
                      {isTutor && (
                        <>
                          <button
                            onClick={() =>
                              updateStatusMutation.mutate({ sessionId: session.id, status: 'IN_SESSION' })
                            }
                            className="px-4 py-2 bg-highlight/20 hover:bg-highlight/30 text-highlight rounded-lg text-sm font-medium transition-colors"
                          >
                            Start Session
                          </button>
                          <button
                            onClick={() =>
                              updateStatusMutation.mutate({ sessionId: session.id, status: 'COMPLETED' })
                            }
                            className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-sm font-medium transition-colors"
                          >
                            Mark Complete
                          </button>
                        </>
                      )}
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({ sessionId: session.id, status: 'CANCELLED' })
                        }
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {session.status === 'IN_SESSION' && isTutor && (
                    <button
                      onClick={() =>
                        updateStatusMutation.mutate({ sessionId: session.id, status: 'COMPLETED' })
                      }
                      className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-sm font-medium transition-colors"
                    >
                      End Session
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorSessionManagement;

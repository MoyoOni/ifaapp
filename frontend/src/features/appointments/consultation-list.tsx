import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConsultationNotepad } from '@/shared/components/consultation-notepad';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Phone,
  Users,
  MessageCircle,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  Loader2,
  AlertCircle,
  Star
} from 'lucide-react';
import { useClientAppointments } from './hooks/use-client-appointments';
import { LeaveReviewModal } from '@/shared/components/leave-review-modal';

interface ConsultationListProps {
  clientId: string;
}

const ConsultationList: React.FC<ConsultationListProps> = ({ clientId }) => {
  const navigate = useNavigate();
  const { appointments, loading, error, refetch } = useClientAppointments(clientId);
  const [reviewModal, setReviewModal] = useState<{ appointmentId: string; babalawoId: string; babalawoName: string; babalawoAvatar?: string } | null>(null);

  const isSkipped = (apptId: string) => {
    try {
      const skipped: string[] = JSON.parse(localStorage.getItem('review_skipped') || '[]');
      return skipped.includes(apptId);
    } catch { return false; }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-highlight" size={32} />
        <span className="ml-2 text-stone-500">Loading consultations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 rounded-2xl p-6 text-center">
        <AlertCircle className="text-amber-500 dark:text-amber-400 mx-auto" size={48} />
        <h3 className="font-bold text-lg text-amber-800 dark:text-amber-400 mt-2">Error Loading Consultations</h3>
        <p className="text-amber-600 dark:text-amber-400 mt-1">{error}</p>
        <button 
          onClick={() => { void refetch(); }}
          className="mt-4 px-4 py-2 bg-highlight text-white rounded-lg hover:bg-yellow-500 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div className="bg-muted/40 rounded-2xl p-8 text-center border border-border/50">
        <Calendar className="text-stone-400 mx-auto" size={48} />
        <h3 className="font-bold text-lg text-stone-800 dark:text-stone-200 mt-2">No Consultations Yet</h3>
        <p className="text-stone-500 mt-1">Book your first consultation with a Babalawo to get started</p>
        <button 
          onClick={() => navigate('/babalawo')}
          className="mt-4 px-6 py-3 bg-highlight text-white rounded-xl font-bold hover:bg-yellow-500 transition-colors"
        >
          Find a Babalawo
        </button>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING_CONFIRMATION':
        return { 
          icon: ClockIcon, 
          text: 'Pending Confirmation', 
          color: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30/50 dark:bg-amber-900/20',
          border: 'border-amber-200 dark:border-amber-800'
        };
      case 'CONFIRMED':
        return { 
          icon: CheckCircle, 
          text: 'Confirmed', 
          color: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30/50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800'
        };
      case 'COMPLETED':
        return { 
          icon: CheckCircle, 
          text: 'Completed', 
          color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30/50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800'
        };
      case 'CANCELLED':
        return { 
          icon: XCircle, 
          text: 'Cancelled', 
          color: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30/50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800'
        };
      case 'DECLINED':
        return { 
          icon: XCircle, 
          text: 'Declined', 
          color: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30/50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800'
        };
      default:
        return { 
          icon: ClockIcon, 
          text: status.replace('_', ' '), 
          color: 'text-muted-foreground bg-muted/60',
          border: 'border-border'
        };
    }
  };

  const formatTime = (timeValue: string) => {
    if (!timeValue) {
      return 'Time TBD';
    }
    if (timeValue.includes(' ')) {
      return timeValue;
    }
    const [hours, minutes = '00'] = timeValue.split(':');
    const hour = parseInt(hours, 10);
    if (Number.isNaN(hour)) {
      return timeValue;
    }
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${period}`;
  };

  const formatMethod = (method?: string) => {
    if (!method) return 'video';
    return method.toLowerCase().replace('_', ' ');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold brand-font text-stone-800 dark:text-stone-200">My Consultations</h2>
        <span className="bg-highlight/10 text-highlight px-3 py-1 rounded-full text-sm font-bold">
          {appointments.length} {appointments.length === 1 ? 'session' : 'sessions'}
        </span>
      </div>

      <div className="space-y-4">
        {appointments.map(appointment => {
          const statusConfig = getStatusConfig(appointment.status);
          const StatusIcon = statusConfig.icon;
          
          // Format date
          const date = new Date(appointment.date);
          const formattedDate = date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          });
          
          // Format time
          const formattedTime = formatTime(appointment.time);
          
          return (
            <div 
              key={appointment.id} 
              className={`bg-card rounded-2xl border-2 p-5 transition-all hover:shadow-md ${statusConfig.border}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg text-stone-800 dark:text-stone-200">{appointment.topic}</h3>
                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold ${statusConfig.color}`}>
                      <StatusIcon size={12} />
                      {statusConfig.text}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-stone-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      <span>{formattedDate}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />
                      <span>{formattedTime}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      {appointment.preferredMethod === 'VIDEO' ? <Video size={14} /> : 
                       appointment.preferredMethod === 'PHONE' ? <Phone size={14} /> : 
                       <MapPin size={14} />}
                      <span className="capitalize">{formatMethod(appointment.preferredMethod)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <Users size={14} />
                      <span>{appointment.babalawo?.name || 'Babalawo'}</span>
                    </div>
                  </div>
                  
                  {appointment.notes && (
                    <div className="mt-2 flex items-start gap-2">
                      <MessageCircle size={14} className="text-stone-400 mt-0.5" />
                      <p className="text-sm text-stone-500">{appointment.notes}</p>
                    </div>
                  )}
                </div>
                
                <div className="sm:text-right">
                  <p className="font-bold text-primary">₦{Number(appointment.price || 0).toLocaleString()}</p>
                  <p className="text-xs text-stone-400 mt-1">ID: {appointment.id.substring(0, 8).toUpperCase()}</p>
                </div>
              </div>
              
              {appointment.status === 'CONFIRMED' && (
                <div className="mt-4 pt-4 border-t border-border/50 flex gap-3">
                  <button className="flex-1 py-2.5 bg-highlight text-white rounded-xl text-sm font-bold hover:bg-yellow-500 transition-colors">
                    Join Session
                  </button>
                  <button className="px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-bold hover:bg-muted/40 transition-colors">
                    Message
                  </button>
                </div>
              )}
              {appointment.status === 'COMPLETED' && appointment.babalawo?.id && (
                <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                  {/* Rebook shortcut */}
                  <button
                    type="button"
                    onClick={() => navigate(`/booking/${appointment.babalawo!.id}`)}
                    className="w-full py-2 bg-primary/10 text-primary text-xs font-bold rounded-xl hover:bg-primary/20 transition-colors"
                  >
                    Book again with {appointment.babalawo.name || 'this Babalawo'} →
                  </button>
                  {/* Review prompt */}
                  {!isSkipped(appointment.id) && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">How was this session?</p>
                      <button
                        type="button"
                        onClick={() => setReviewModal({
                          appointmentId: appointment.id,
                          babalawoId: appointment.babalawo!.id,
                          babalawoName: appointment.babalawo!.name || 'Your Babalawo',
                          babalawoAvatar: appointment.babalawo!.avatar,
                        })}
                        className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                      >
                        <Star size={13} className="fill-amber-400 text-amber-400" />
                        Rate this session
                      </button>
                    </div>
                  )}
                  {/* Client session notes */}
                  <ConsultationNotepad
                    clientId={clientId}
                    clientName={appointment.babalawo.name || 'your Babalawo'}
                    appointmentId={appointment.id}
                    label="My Session Notes"
                    placeholder="What guidance did you receive? What do you want to remember from this session?"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {reviewModal && (
        <LeaveReviewModal
          isOpen
          onClose={() => setReviewModal(null)}
          appointmentId={reviewModal.appointmentId}
          babalawoId={reviewModal.babalawoId}
          babalawoName={reviewModal.babalawoName}
          babalawoAvatar={reviewModal.babalawoAvatar}
        />
      )}
    </div>
  );
};

export default ConsultationList;
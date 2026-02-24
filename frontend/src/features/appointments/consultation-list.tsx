import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  AlertCircle
} from 'lucide-react';
import { useClientAppointments } from './hooks/use-client-appointments';

interface ConsultationListProps {
  clientId: string;
}

const ConsultationList: React.FC<ConsultationListProps> = ({ clientId }) => {
  const navigate = useNavigate();
  const { appointments, loading, error, refetch } = useClientAppointments(clientId);

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
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center">
        <AlertCircle className="text-amber-500 mx-auto" size={48} />
        <h3 className="font-bold text-lg text-amber-800 mt-2">Error Loading Consultations</h3>
        <p className="text-amber-600 mt-1">{error}</p>
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
      <div className="bg-stone-50 rounded-2xl p-8 text-center border border-stone-100">
        <Calendar className="text-stone-400 mx-auto" size={48} />
        <h3 className="font-bold text-lg text-stone-800 mt-2">No Consultations Yet</h3>
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
          color: 'text-amber-600 bg-amber-100/50',
          border: 'border-amber-200'
        };
      case 'CONFIRMED':
        return { 
          icon: CheckCircle, 
          text: 'Confirmed', 
          color: 'text-green-600 bg-green-100/50',
          border: 'border-green-200'
        };
      case 'COMPLETED':
        return { 
          icon: CheckCircle, 
          text: 'Completed', 
          color: 'text-blue-600 bg-blue-100/50',
          border: 'border-blue-200'
        };
      case 'CANCELLED':
        return { 
          icon: XCircle, 
          text: 'Cancelled', 
          color: 'text-red-600 bg-red-100/50',
          border: 'border-red-200'
        };
      case 'DECLINED':
        return { 
          icon: XCircle, 
          text: 'Declined', 
          color: 'text-red-600 bg-red-100/50',
          border: 'border-red-200'
        };
      default:
        return { 
          icon: ClockIcon, 
          text: status.replace('_', ' '), 
          color: 'text-stone-600 bg-stone-100/50',
          border: 'border-stone-200'
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
        <h2 className="text-xl font-bold brand-font text-stone-800">My Consultations</h2>
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
              className={`bg-white rounded-2xl border-2 p-5 transition-all hover:shadow-md ${statusConfig.border}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg text-stone-800">{appointment.topic}</h3>
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
                <div className="mt-4 pt-4 border-t border-stone-100 flex gap-3">
                  <button className="flex-1 py-2.5 bg-highlight text-white rounded-xl text-sm font-bold hover:bg-yellow-500 transition-colors">
                    Join Session
                  </button>
                  <button className="px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-bold hover:bg-stone-50 transition-colors">
                    Message
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConsultationList;
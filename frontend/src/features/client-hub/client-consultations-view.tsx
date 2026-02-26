import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, Search, User, MessageCircle, MapPin } from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import { useNavigate } from 'react-router-dom';

interface Consultation {
  id: string;
  babalawoName: string;
  babalawoAvatar: string;
  date: Date;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'pending';
  serviceType: string;
  price: number;
  templeName?: string;
  notes?: string;
}

const ClientConsultationsView: React.FC = () => {
  const navigate = useNavigate();
  const { user: _user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled' | 'pending'>('all');

  // Mock consultation data
  const consultations: Consultation[] = [
    {
      id: 'cons-1',
      babalawoName: 'Babalawo Adeyemi',
      babalawoAvatar: '',
      date: new Date(Date.now() + 86400000), // Tomorrow
      time: '14:00',
      status: 'scheduled',
      serviceType: 'Spiritual Consultation',
      price: 15000,
      templeName: 'Ile Ifa Temple',
      notes: 'Annual spiritual guidance session'
    },
    {
      id: 'cons-2',
      babalawoName: 'Babalawo Ogunbiyi',
      babalawoAvatar: '',
      date: new Date(Date.now() - 172800000), // 2 days ago
      time: '10:30',
      status: 'completed',
      serviceType: 'Divination Reading',
      price: 12000,
      templeName: 'Sacred Grove Temple',
      notes: 'Monthly divination session'
    },
    {
      id: 'cons-3',
      babalawoName: 'Babalawo Johnson',
      babalawoAvatar: '',
      date: new Date(Date.now() + 259200000), // 3 days from now
      time: '16:00',
      status: 'pending',
      serviceType: 'Ancestral Guidance',
      price: 20000,
      templeName: 'Heritage Temple',
      notes: 'Initial consultation for family matters'
    },
    {
      id: 'cons-4',
      babalawoName: 'Babalawo Adewale',
      babalawoAvatar: '',
      date: new Date(Date.now() - 604800000), // Last week
      time: '11:00',
      status: 'cancelled',
      serviceType: 'Spiritual Cleansing',
      price: 8000,
      templeName: 'Purity Temple',
      notes: 'Cancelled due to schedule conflict'
    }
  ];

  const filteredConsultations = consultations.filter(consultation => {
    const matchesSearch = consultation.babalawoName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         consultation.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (consultation.templeName && consultation.templeName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || consultation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return Clock;
      case 'completed': return CheckCircle;
      case 'cancelled': return XCircle;
      case 'pending': return Clock;
      default: return Clock;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-[1.5rem] font-[700] text-foreground">My Consultations</h1>
          <p className="text-[0.875rem] text-muted-foreground">Manage your scheduled sessions</p>
        </div>
        
        {consultations.length > 0 ? (
          <div className="space-y-6">
            {consultations.map(consultation => (
              <div key={consultation.id} className="bg-card border border-input rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-[1.125rem] font-[700] text-foreground">{consultation.serviceType}</h2>
                    <p className="text-[0.875rem] text-muted-foreground">{consultation.babalawo.name}</p>
                  </div>
                  <Badge 
                    variant={
                      consultation.status === 'confirmed' ? 'default' : 
                      consultation.status === 'pending' ? 'secondary' : 
                      consultation.status === 'cancelled' ? 'destructive' : 
                      'outline'
                    }
                    className="text-[0.75rem] font-[700]"
                  >
                    {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <p className="text-[0.875rem] text-muted-foreground">Date</p>
                    <p className="text-[1rem] font-[500] text-foreground">{new Date(consultation.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-[0.875rem] text-muted-foreground">Time</p>
                    <p className="text-[1rem] font-[500] text-foreground">{consultation.time}</p>
                  </div>
                  <div>
                    <p className="text-[0.875rem] text-muted-foreground">Duration</p>
                    <p className="text-[1rem] font-[500] text-foreground">{consultation.duration} mins</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  {consultation.status === 'confirmed' && (
                    <>
                      <Button variant="outline" size="sm">
                        Reschedule
                      </Button>
                      <Button variant="destructive" size="sm">
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-muted mx-auto mb-4" />
            <h3 className="text-[1.25rem] font-[700] text-foreground mb-2">No consultations scheduled</h3>
            <p className="text-[0.875rem] text-muted-foreground mb-6">Your upcoming sessions will appear here</p>
            <Button asChild>
              <Link to="/babalawo/discovery">Find a Spiritual Guide</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Upcoming Reminder */}
      {consultations.filter(c => c.status === 'scheduled').length > 0 && (
        <div className="bg-gradient-to-r from-muted to-muted/50 rounded-2xl p-6 border border-input">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-muted rounded-xl text-muted-foreground">
              <Clock size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Upcoming Consultation</h3>
              <p className="text-muted-foreground mb-3">
                You have {consultations.filter(c => c.status === 'scheduled').length} scheduled consultation(s) coming up soon.
              </p>
              <div className="space-y-2">
                {consultations.filter(c => c.status === 'scheduled').slice(0, 2).map(consultation => (
                  <div key={consultation.id} className="flex items-center gap-3 text-sm">
                    <span className="font-medium text-foreground">{consultation.babalawoName}</span>
                    <span className="text-muted-foreground">
                      on {consultation.date.toLocaleDateString()} at {consultation.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientConsultationsView;
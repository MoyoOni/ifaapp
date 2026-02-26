import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Loader2, BookOpen, Building2, BarChart3, User } from 'lucide-react';
import ClientList from '../../client-hub/client-list';
import { useBabalawoDashboard } from '@/shared/hooks/dashboard';
import { useAuth } from '@/shared/hooks/use-auth';
import { Button } from '@/shared/components/ui/button';

interface PractitionerDashboardProps {
    userId?: string;
    initialTab?: 'overview' | 'seekers' | 'services' | 'temple';
}

interface AppointmentDisplay {
    id: string;
    clientName: string;
    time: string;
    type: string;
    date: string;
}

const PractitionerDashboard: React.FC<PractitionerDashboardProps> = ({ userId, initialTab = 'overview' }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const resolvedUserId = userId || user?.id || '';
    const { data: dashboard, isLoading } = useBabalawoDashboard(resolvedUserId);

    // Format currency for display
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Format date for display
    const formatAppointmentDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    // Stats from API or defaults
    const stats = {
        totalClients: dashboard?.clientCount ?? 0,
        upcomingSessions: dashboard?.upcomingConsultations?.length ?? 0,
        pendingRequests: dashboard?.analytics?.pendingRequests ?? 0,
        monthlyEarnings: formatCurrency(dashboard?.monthlyEarnings?.amount ?? 0)
    };

    // Transform consultations for display
    const upcomingAppointments: AppointmentDisplay[] = (dashboard?.upcomingConsultations ?? []).map((apt) => ({
        id: apt.id,
        clientName: apt.clientName,
        time: new Date(apt.scheduledDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        type: apt.topic,
        date: formatAppointmentDate(apt.scheduledDate)
    }));

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-highlight" />
            </div>
        );
    }

    const renderContent = () => {
        switch (initialTab) {
            case 'seekers':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                            <Users size={24} /> My Seekers
                        </h2>
                        <ClientList
                            babalawoId={resolvedUserId}
                            onSelectClient={(id) => navigate(`/profile/${id}`)}
                            onMessageClient={(id) => navigate(`/messages/${id}`)}
                        />
                    </div>
                );
            case 'services':
                return (
                    <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm text-center space-y-4">
                        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
                            <BookOpen size={32} />
                        </div>
                        <h3 className="text-xl font-bold brand-font">Service Offerings</h3>
                        <p className="text-stone-500">Manage your spiritual consultations and ritual services.</p>
                        <button className="px-6 py-2 bg-highlight text-white font-bold rounded-xl shadow-lg">Add New Service</button>
                    </div>
                );
            case 'temple':
                return (
                    <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm text-center space-y-4">
                        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
                            <Building2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold brand-font">Temple Connection</h3>
                        <p className="text-stone-500">Connect with physical temples and manage your spiritual lineage.</p>
                        <button className="px-6 py-2 bg-highlight text-white font-bold rounded-xl shadow-lg">Connect Temple</button>
                    </div>
                );
            case 'overview':
            default:
                return (
                  <div className="p-6 max-w-7xl mx-auto">
                    <div className="mb-8">
                      <h1 className="text-[1.5rem] font-[700] text-foreground">My Dashboard</h1>
                      <p className="text-[0.875rem] text-muted-foreground">Manage your practice and appointments</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-6 text-white">
                        <h3 className="text-[1rem] font-[500] opacity-80">Total Clients</h3>
                        <p className="text-[2rem] font-[700]">{stats.totalClients}</p>
                      </div>
                      <div className="bg-card border border-input rounded-2xl p-6">
                        <h3 className="text-[1rem] font-[500] text-muted-foreground">Pending Requests</h3>
                        <p className="text-[2rem] font-[700] text-foreground">{stats.pendingRequests}</p>
                      </div>
                      <div className="bg-card border border-input rounded-2xl p-6">
                        <h3 className="text-[1rem] font-[500] text-muted-foreground">Revenue (This Month)</h3>
                        <p className="text-[2rem] font-[700] text-foreground">{stats.monthlyEarnings}</p>
                      </div>
                      <div className="bg-card border border-input rounded-2xl p-6">
                        <h3 className="text-[1rem] font-[500] text-muted-foreground">Upcoming Sessions</h3>
                        <p className="text-[2rem] font-[700] text-foreground">{stats.upcomingSessions}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-card border border-input rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="text-[1.25rem] font-[700] text-foreground">Recent Appointments</h2>
                          <Button variant="outline" size="sm">View All</Button>
                        </div>
                        
                        {upcomingAppointments.length > 0 ? (
                          <div className="space-y-4">
                            {upcomingAppointments.map((appointment: AppointmentDisplay) => (
                              <div key={appointment.id} className="flex items-center justify-between p-4 border border-input rounded-xl hover:bg-muted/50 transition-colors">
                                <div>
                                  <h3 className="text-[1rem] font-[700] text-foreground">{appointment.clientName}</h3>
                                  <p className="text-[0.875rem] text-muted-foreground">{appointment.type}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[0.875rem] font-[500] text-foreground">{appointment.date}</p>
                                  <p className="text-[0.875rem] text-muted-foreground">{appointment.time}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Calendar className="w-12 h-12 text-muted mx-auto mb-3" />
                            <p className="text-[0.875rem] text-muted-foreground">No recent appointments</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-card border border-input rounded-2xl p-6">
                        <h2 className="text-[1.25rem] font-[700] text-foreground mb-6">Quick Actions</h2>
                        
                        <div className="space-y-4">
                          <Button className="w-full justify-start" onClick={() => navigate('/practitioner/calendar')}>
                            <Calendar className="w-4 h-4 mr-2" />
                            Manage Schedule
                          </Button>
                          <Button className="w-full justify-start" onClick={() => navigate('/practitioner/my-seekers')}>
                            <Users className="w-4 h-4 mr-2" />
                            View Clients
                          </Button>
                          <Button className="w-full justify-start" onClick={() => navigate('/practitioner/earnings-report')}>
                            <BarChart3 className="w-4 h-4 mr-2" />
                            View Analytics
                          </Button>
                          <Button className="w-full justify-start" onClick={() => navigate('/profile')}>
                            <User className="w-4 h-4 mr-2" />
                            Edit Profile
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold brand-font text-stone-900">
                        {initialTab === 'overview' ? 'Practice Center' : initialTab.charAt(0).toUpperCase() + initialTab.slice(1)}
                    </h1>
                    <p className="text-stone-600 text-lg">
                        {initialTab === 'overview'
                            ? 'Manage your spiritual practice, seekers, and appointments.'
                            : `Manage your ${initialTab} and coordination.`}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => navigate('/practitioner/consultations')} className="px-4 py-2 bg-white border border-stone-300 text-stone-800 font-bold rounded-xl shadow-sm hover:bg-stone-50 transition-colors flex items-center gap-2">
                        <Calendar size={18} /> Calendar
                    </button>
                    <button onClick={() => navigate('/practitioner/invite-client')} className="px-4 py-2 bg-highlight text-white font-bold rounded-xl shadow-lg hover:bg-yellow-600 transition-colors flex items-center gap-2">
                        <Users size={18} /> Invite Seeker
                    </button>
                </div>
            </div>

            {renderContent()}
        </div>
    );
};

export default PractitionerDashboard;
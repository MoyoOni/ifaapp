import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, MessageSquare, DollarSign, Bell, Loader2, BookOpen, Building2 } from 'lucide-react';
import ClientList from '../../client-hub/client-list';
import { useBabalawoDashboard } from '@/shared/hooks/use-dashboard';
import { useAuth } from '@/shared/hooks/use-auth';

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
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-start justify-between">
                                <div>
                                    <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Active Seekers</p>
                                    <h3 className="text-3xl font-bold text-stone-900 mt-1">{stats.totalClients}</h3>
                                </div>
                                <div className="bg-blue-100 p-3 rounded-xl text-blue-700">
                                    <Users size={24} />
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-start justify-between">
                                <div>
                                    <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Upcoming Sessions</p>
                                    <h3 className="text-3xl font-bold text-stone-900 mt-1">{stats.upcomingSessions}</h3>
                                </div>
                                <div className="bg-purple-100 p-3 rounded-xl text-purple-700">
                                    <Calendar size={24} />
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-start justify-between">
                                <div>
                                    <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Pending Requests</p>
                                    <h3 className="text-3xl font-bold text-stone-900 mt-1">{stats.pendingRequests}</h3>
                                </div>
                                <div className="bg-orange-100 p-3 rounded-xl text-orange-700">
                                    <Bell size={24} />
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-start justify-between">
                                <div>
                                    <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Earnings (Mo)</p>
                                    <h3 className="text-3xl font-bold text-stone-900 mt-1">{stats.monthlyEarnings}</h3>
                                </div>
                                <div className="bg-green-100 p-3 rounded-xl text-green-700">
                                    <DollarSign size={24} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main Column: Client List */}
                            <div className="lg:col-span-2 space-y-6">
                                <ClientList
                                    babalawoId={resolvedUserId}
                                    onSelectClient={(id) => navigate(`/profile/${id}`)}
                                    onMessageClient={(id) => navigate(`/messages/${id}`)}
                                />
                            </div>

                            {/* Sidebar Column: Schedule & Tasks */}
                            <div className="space-y-6">
                                {/* Upcoming Schedule */}
                                <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-xl text-stone-900">Today's Schedule</h3>
                                        <button onClick={() => navigate('/practitioner/consultations')} className="text-xs font-bold text-highlight hover:underline">View All</button>
                                    </div>

                                    <div className="space-y-3">
                                        {upcomingAppointments.map(app => (
                                            <div key={app.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-stone-50 transition-colors border border-transparent hover:border-stone-200">
                                                <div className="flex flex-col items-center min-w-[60px]">
                                                    <span className="text-xs font-bold text-stone-500 uppercase">{app.date}</span>
                                                    <span className="text-stone-900 font-bold">{app.time}</span>
                                                </div>
                                                <div className="w-1 h-10 bg-highlight/20 rounded-full"></div>
                                                <div>
                                                    <h4 className="font-bold text-stone-900 text-sm">{app.clientName}</h4>
                                                    <p className="text-xs text-stone-600">{app.type}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {upcomingAppointments.length === 0 && (
                                            <p className="text-stone-600 text-sm text-center py-4">No appointments today.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Quick Actions Card */}
                                <div className="bg-gradient-to-br from-foreground to-stone-900 rounded-2xl p-6 text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                                    <h3 className="font-bold text-xl mb-2 relative z-10">Broadcast Message</h3>
                                    <p className="text-sm text-stone-300 mb-6 relative z-10">Send an update or teaching to all your seekers at once.</p>

                                    <button className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-bold transition-all flex items-center justify-center gap-2 relative z-10 text-sm">
                                        <MessageSquare size={16} /> Compose Broadcast
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
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
                    <button onClick={() => navigate('/practitioner/clients/invite')} className="px-4 py-2 bg-highlight text-white font-bold rounded-xl shadow-lg hover:bg-yellow-600 transition-colors flex items-center gap-2">
                        <Users size={18} /> Invite Seeker
                    </button>
                </div>
            </div>

            {renderContent()}
        </div>
    );
};

export default PractitionerDashboard;
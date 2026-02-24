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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold brand-font text-stone-900">
            My Consultations
          </h1>
          <p className="text-stone-600 text-lg">
            Manage your spiritual consultation appointments and history.
          </p>
        </div>
        <button 
          onClick={() => navigate('/babalawo')}
          className="px-6 py-3 bg-highlight text-white font-bold rounded-xl shadow-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"
        >
          <Search size={18} /> Book New Consultation
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-700">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Scheduled</p>
              <h3 className="text-xl font-bold text-stone-900">
                {consultations.filter(c => c.status === 'scheduled').length}
              </h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl text-green-700">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Completed</p>
              <h3 className="text-xl font-bold text-stone-900">
                {consultations.filter(c => c.status === 'completed').length}
              </h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-xl text-purple-700">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">This Month</p>
              <h3 className="text-xl font-bold text-stone-900">
                {consultations.filter(c => c.date.getMonth() === new Date().getMonth()).length}
              </h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-xl text-orange-700">
              <User size={20} />
            </div>
            <div>
              <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Total Spent</p>
              <h3 className="text-xl font-bold text-stone-900">
                {formatCurrency(consultations.filter(c => c.status === 'completed').reduce((sum, c) => sum + c.price, 0))}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" size={20} />
            <input
              type="text"
              placeholder="Search consultations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Consultations List */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <h2 className="text-xl font-bold text-stone-900">Consultation History</h2>
          <p className="text-stone-600 mt-1">{filteredConsultations.length} consultations found</p>
        </div>
        
        <div className="divide-y divide-stone-100">
          {filteredConsultations.length > 0 ? (
            filteredConsultations.map((consultation) => {
              const StatusIcon = getStatusIcon(consultation.status);
              return (
                <div key={consultation.id} className="p-6 hover:bg-stone-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-stone-200 rounded-full flex items-center justify-center">
                          <User className="text-stone-600" size={24} />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-stone-900">{consultation.babalawoName}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(consultation.status)}`}>
                              <StatusIcon size={12} className="inline mr-1" />
                              {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-stone-600 mb-2">{consultation.serviceType}</p>
                          {consultation.templeName && (
                            <p className="text-stone-500 text-sm flex items-center gap-1">
                              <MapPin size={14} /> {consultation.templeName}
                            </p>
                          )}
                          {consultation.notes && (
                            <p className="text-stone-500 text-sm mt-2">"{consultation.notes}"</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:items-end gap-2">
                      <div className="text-right">
                        <p className="text-stone-900 font-bold">{formatCurrency(consultation.price)}</p>
                        <p className="text-stone-600 text-sm">
                          {consultation.date.toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })} at {consultation.time}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {consultation.status === 'scheduled' && (
                          <>
                            <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors">
                              Reschedule
                            </button>
                            <button className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors">
                              Cancel
                            </button>
                          </>
                        )}
                        {(consultation.status === 'completed' || consultation.status === 'scheduled') && (
                          <button className="px-3 py-1 bg-stone-100 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-200 transition-colors flex items-center gap-1">
                            <MessageCircle size={14} /> Message
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center">
              <Calendar size={48} className="mx-auto text-stone-300 mb-4" />
              <h3 className="text-lg font-bold text-stone-900 mb-2">No consultations found</h3>
              <p className="text-stone-600">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Book your first consultation to get started'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <button 
                  onClick={() => navigate('/babalawo')}
                  className="mt-4 px-4 py-2 bg-highlight text-white font-bold rounded-xl hover:bg-yellow-600 transition-colors"
                >
                  Find a Babalawo
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Reminder */}
      {consultations.filter(c => c.status === 'scheduled').length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-700">
              <Clock size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 mb-2">Upcoming Consultation</h3>
              <p className="text-stone-600 mb-3">
                You have {consultations.filter(c => c.status === 'scheduled').length} scheduled consultation(s) coming up soon.
              </p>
              <div className="space-y-2">
                {consultations.filter(c => c.status === 'scheduled').slice(0, 2).map(consultation => (
                  <div key={consultation.id} className="flex items-center gap-3 text-sm">
                    <span className="font-medium text-stone-900">{consultation.babalawoName}</span>
                    <span className="text-stone-600">
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
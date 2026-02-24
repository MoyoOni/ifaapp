import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Calendar, MessageCircle, Wallet, Phone, Mail, MapPin, Clock } from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import { Badge } from '@/shared/components/badge';

interface Client {
  id: string;
  name: string;
  yorubaName: string | null;
  avatar: string | null;
  email: string;
  phone: string | null;
  location: string | null;
  status: 'active' | 'inactive' | 'pending';
  lastContact: string;
  totalAppointments: number;
  upcomingAppointment?: {
    id: string;
    date: string;
    time: string;
    topic: string;
  };
  totalSpent: number;
}

const MySeekersView: React.FC = () => {
  const { user: _user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');

  // Mock data for clients - would come from API in real implementation
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockClients: Client[] = [
        {
          id: '1',
          name: 'Amara Johnson',
          yorubaName: 'Àmárà Ìyáṣọ́rọ̀',
          avatar: null,
          email: 'amara@example.com',
          phone: '+1234567890',
          location: 'Lagos, Nigeria',
          status: 'active',
          lastContact: '2023-05-15',
          totalAppointments: 8,
          upcomingAppointment: {
            id: 'appt-1',
            date: '2023-06-01',
            time: '10:00 AM',
            topic: 'Career Guidance'
          },
          totalSpent: 25000
        },
        {
          id: '2',
          name: 'David Chen',
          yorubaName: null,
          avatar: null,
          email: 'david@example.com',
          phone: '+1987654321',
          location: 'New York, USA',
          status: 'active',
          lastContact: '2023-05-10',
          totalAppointments: 5,
          upcomingAppointment: {
            id: 'appt-2',
            date: '2023-05-30',
            time: '2:00 PM',
            topic: 'Relationship Advice'
          },
          totalSpent: 18000
        },
        {
          id: '3',
          name: 'Sarah Williams',
          yorubaName: 'Sáràh Tíjání',
          avatar: null,
          email: 'sarah@example.com',
          phone: '+1555555555',
          location: 'London, UK',
          status: 'inactive',
          lastContact: '2023-04-20',
          totalAppointments: 3,
          totalSpent: 9000
        },
        {
          id: '4',
          name: 'Michael Brown',
          yorubaName: null,
          avatar: null,
          email: 'michael@example.com',
          phone: '+1777777777',
          location: 'Toronto, Canada',
          status: 'pending',
          lastContact: '2023-05-01',
          totalAppointments: 1,
          totalSpent: 3000
        }
      ];
      setClients(mockClients);
      setLoading(false);
    }, 800);
  }, []);

  const filteredClients = clients.filter(client => 
    filter === 'all' || client.status === filter
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 p-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-xl p-6 bg-white shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-gray-200 rounded-full h-12 w-12"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-4/5"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold brand-font text-stone-900">My Seekers</h1>
          <p className="text-stone-600 text-lg mt-1">
            Manage and connect with your spiritual seekers
          </p>
        </div>
        <Link 
          to="/practitioner/invite-client"
          className="px-4 py-2 bg-highlight text-white font-bold rounded-xl shadow-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"
        >
          <UserPlus size={18} /> Invite New Seeker
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <button 
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            filter === 'all' 
              ? 'bg-highlight text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({clients.length})
        </button>
        <button 
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            filter === 'active' 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Active ({clients.filter(c => c.status === 'active').length})
        </button>
        <button 
          onClick={() => setFilter('inactive')}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            filter === 'inactive' 
              ? 'bg-gray-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Inactive ({clients.filter(c => c.status === 'inactive').length})
        </button>
        <button 
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            filter === 'pending' 
              ? 'bg-yellow-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pending ({clients.filter(c => c.status === 'pending').length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div key={client.id} className="border rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 truncate">{client.name}</h3>
                    {client.yorubaName && (
                      <p className="text-gray-600 text-sm italic truncate">{client.yorubaName}</p>
                    )}
                  </div>
                  <Badge className={`${getStatusColor(client.status)} px-3 py-1 rounded-full text-xs font-medium`}>
                    {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                  </Badge>
                </div>
                
                <div className="mt-3 space-y-2">
                  <div className="flex items-center text-gray-600 text-sm">
                    <Mail size={14} className="mr-2" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  
                  {client.phone && (
                    <div className="flex items-center text-gray-600 text-sm">
                      <Phone size={14} className="mr-2" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  
                  {client.location && (
                    <div className="flex items-center text-gray-600 text-sm">
                      <MapPin size={14} className="mr-2" />
                      <span>{client.location}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-gray-600 text-sm">
                    <Clock size={14} className="mr-2" />
                    <span>Last contact: {client.lastContact}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Appointments</p>
                    <p className="font-semibold">{client.totalAppointments}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Total Spent</p>
                    <p className="font-semibold">₦{client.totalSpent.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="font-semibold capitalize">{client.status}</p>
                  </div>
                </div>
                
                {client.upcomingAppointment && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center text-sm font-medium text-orange-700">
                      <Calendar size={16} className="mr-2" />
                      <span>Upcoming: {client.upcomingAppointment.topic}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {client.upcomingAppointment.date} at {client.upcomingAppointment.time}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                <MessageCircle size={16} />
                Message
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                <Calendar size={16} />
                Schedule
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                <Wallet size={16} />
                Payment
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MySeekersView;
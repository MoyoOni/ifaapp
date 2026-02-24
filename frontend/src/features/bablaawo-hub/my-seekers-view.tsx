import React, { useState } from 'react';
import { User, Search, Filter, Calendar, MessageSquare, Phone, Mail, MapPin, Star } from 'lucide-react';
import { Badge } from '@/shared/components/badge';

interface Seeker {
  id: string;
  name: string;
  avatar?: string;
  lastActive: string;
  consultations: number;
  rating: number;
  location: string;
  status: 'active' | 'inactive' | 'pending';
  nextAppointment?: string;
  interests: string[];
}

const MySeekersView: React.FC = () => {
  const [seekers, _setSeekers] = useState<Seeker[]>([
    {
      id: '1',
      name: 'Adunni Smith',
      lastActive: '2 days ago',
      consultations: 5,
      rating: 4.8,
      location: 'Lagos, Nigeria',
      status: 'active',
      nextAppointment: '2024-02-25',
      interests: ['Divination', 'Spiritual Cleansing']
    },
    {
      id: '2',
      name: 'Emeka Johnson',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      lastActive: '1 week ago',
      consultations: 3,
      rating: 4.5,
      location: 'Abuja, Nigeria',
      status: 'active',
      interests: ['Naming Ceremony', 'Marriage Rituals']
    },
    {
      id: '3',
      name: 'Fatimah Yusuf',
      lastActive: '3 days ago',
      consultations: 7,
      rating: 4.9,
      location: 'Kano, Nigeria',
      status: 'active',
      nextAppointment: '2024-02-28',
      interests: ['Healing Rituals', 'Protection Charms']
    },
    {
      id: '4',
      name: 'Olumide Adebayo',
      avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
      lastActive: '2 weeks ago',
      consultations: 2,
      rating: 4.2,
      location: 'Ibadan, Nigeria',
      status: 'inactive',
      interests: ['Ancestral Connection']
    },
    {
      id: '5',
      name: 'Grace Okonkwo',
      lastActive: 'Just now',
      consultations: 1,
      rating: 5.0,
      location: 'Port Harcourt, Nigeria',
      status: 'active',
      nextAppointment: '2024-02-22',
      interests: ['Divination', 'Prayer Requests']
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredSeekers = seekers.filter(seeker => {
    const matchesSearch = seeker.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || seeker.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-stone-100 text-stone-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-stone-100 text-stone-800';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold brand-font text-stone-900">
            My Seekers
          </h1>
          <p className="text-stone-600">
            Manage and connect with your spiritual seekers
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-stone-100 text-stone-700 font-bold rounded-xl hover:bg-stone-200 transition-colors flex items-center gap-2">
            <Mail size={18} /> Invite Seeker
          </button>
          <button className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-green-800 transition-colors flex items-center gap-2">
            <User size={18} /> Add Manually
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm">Total Seekers</p>
              <h3 className="text-2xl font-bold text-stone-900">{seekers.length}</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <User size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm">Active Seekers</p>
              <h3 className="text-2xl font-bold text-stone-900">
                {seekers.filter(s => s.status === 'active').length}
              </h3>
            </div>
            <div className="p-3 bg-green-100 rounded-xl text-green-700">
              <Star size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm">Avg. Rating</p>
              <h3 className="text-2xl font-bold text-stone-900">
                {seekers.reduce((acc, seeker) => acc + seeker.rating, 0) / seekers.length || 0}
              </h3>
            </div>
            <div className="p-3 bg-yellow-100 rounded-xl text-yellow-700">
              <Star size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm">Scheduled</p>
              <h3 className="text-2xl font-bold text-stone-900">
                {seekers.filter(s => s.nextAppointment).length}
              </h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl text-blue-700">
              <Calendar size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" size={18} />
            <input
              type="text"
              placeholder="Search seekers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
            <button className="px-3 py-2 border border-stone-300 rounded-xl flex items-center gap-2 hover:bg-stone-50">
              <Filter size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Seekers List */}
      <div className="space-y-4">
        {filteredSeekers.length > 0 ? (
          filteredSeekers.map((seeker) => (
            <div key={seeker.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-5 flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
                    {seeker.avatar ? (
                      <img src={seeker.avatar} alt={seeker.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User size={32} className="text-stone-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-stone-900">{seeker.name}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1 text-sm text-stone-600">
                        <MapPin size={14} /> {seeker.location}
                      </span>
                      <span className="text-sm text-stone-600">{seeker.lastActive}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={14} 
                          fill={i < Math.floor(seeker.rating) ? "#fbbf24" : "none"} 
                          stroke="#fbbf24" 
                          className={i < Math.floor(seeker.rating) ? "fill-yellow-400" : "fill-none"}
                        />
                      ))}
                      <span className="text-sm text-stone-600 ml-1">{seeker.rating}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-stone-500">Consultations</p>
                    <p className="font-bold">{seeker.consultations}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Status</p>
                    <Badge variant="default" className={`${getStatusColor(seeker.status)} px-3 py-1 text-xs`}>
                      {seeker.status.charAt(0).toUpperCase() + seeker.status.slice(1)}
                    </Badge>
                  </div>
                  {seeker.nextAppointment && (
                    <div>
                      <p className="text-xs text-stone-500">Next Appointment</p>
                      <p className="font-bold">{new Date(seeker.nextAppointment).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 sm:items-end">
                  <div className="flex gap-2">
                    <button className="p-2 bg-stone-100 rounded-xl hover:bg-stone-200">
                      <MessageSquare size={18} className="text-stone-700" />
                    </button>
                    <button className="p-2 bg-stone-100 rounded-xl hover:bg-stone-200">
                      <Phone size={18} className="text-stone-700" />
                    </button>
                    <button className="p-2 bg-stone-100 rounded-xl hover:bg-stone-200">
                      <Mail size={18} className="text-stone-700" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {seeker.interests.slice(0, 2).map((interest, idx) => (
                      <span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {interest}
                      </span>
                    ))}
                    {seeker.interests.length > 2 && (
                      <span className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded-full">
                        +{seeker.interests.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-12 text-center">
            <User size={48} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-lg font-bold text-stone-900 mb-2">No seekers found</h3>
            <p className="text-stone-600 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Your spiritual seekers will appear here once they connect with you'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MySeekersView;
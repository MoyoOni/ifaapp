import React, { useState, useEffect } from 'react';
import { Building2, Calendar, MapPin, Phone, Globe, Star, Heart, Search, Plus } from 'lucide-react';
import { Button } from '@/shared/components/button';

interface Temple {
  id: string;
  name: string;
  yorubaName: string;
  description: string;
  location: string;
  contact: string;
  website: string;
  affiliated: boolean;
  rating: number;
  memberSince: string;
  upcomingEvents: number;
  practitioners: number;
}

const TempleConnectionView: React.FC = () => {
  const [temples, setTemples] = useState<Temple[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'affiliated' | 'nearby'>('all');
  const [showJoinForm, setShowJoinForm] = useState(false);
  
  // Mock temple data
  useEffect(() => {
    setTimeout(() => {
      const mockTemples: Temple[] = [
        {
          id: '1',
          name: 'Ile Ifa Oodua',
          yorubaName: 'Ìlẹ̀ Ifá Òòdùà',
          description: 'A traditional Ifa center dedicated to preserving ancient wisdom and cultural practices.',
          location: 'Lagos, Nigeria',
          contact: '+234 123 456 7890',
          website: 'www.ileifaoodua.org',
          affiliated: true,
          rating: 4.8,
          memberSince: '2022-03-15',
          upcomingEvents: 5,
          practitioners: 12
        },
        {
          id: '2',
          name: 'House of Orunmila',
          yorubaName: 'Ìlé Orúnmìlà',
          description: 'A spiritual center focusing on healing and divination practices.',
          location: 'Ibadan, Nigeria',
          contact: '+234 987 654 3210',
          website: 'www.houseoforunmila.org',
          affiliated: true,
          rating: 4.6,
          memberSince: '2023-01-10',
          upcomingEvents: 3,
          practitioners: 8
        },
        {
          id: '3',
          name: 'Sacred Grove Temple',
          yorubaName: 'Ìkúnlé Àgùntàn',
          description: 'A retreat center offering immersive spiritual experiences in nature.',
          location: 'Osun State, Nigeria',
          contact: '+234 555 123 4567',
          website: 'www.sacredgrovetemple.org',
          affiliated: false,
          rating: 4.9,
          memberSince: '',
          upcomingEvents: 7,
          practitioners: 5
        },
        {
          id: '4',
          name: 'Global Ifa Foundation',
          yorubaName: 'Ìgbìmọ̀ Ifá Aye',
          description: 'An international organization promoting Ifa studies and practices worldwide.',
          location: 'London, UK',
          contact: '+44 20 7123 4567',
          website: 'www.globalifafoundation.org',
          affiliated: false,
          rating: 4.7,
          memberSince: '',
          upcomingEvents: 10,
          practitioners: 15
        }
      ];
      setTemples(mockTemples);
      setLoading(false);
    }, 800);
  }, []);

  const filteredTemples = temples.filter(temple => {
    const matchesSearch = temple.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         temple.yorubaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         temple.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'affiliated') return matchesSearch && temple.affiliated;
    if (filter === 'nearby') return matchesSearch && temple.location.includes('Nigeria'); // Simplified for demo
    
    return matchesSearch;
  });

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
                  <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
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
          <h1 className="text-3xl md:text-4xl font-bold brand-font text-stone-900">Temple Connection</h1>
          <p className="text-stone-600 text-lg mt-1">
            Connect with traditional temples and spiritual centers
          </p>
        </div>
        <Button 
          onClick={() => setShowJoinForm(!showJoinForm)}
          className="bg-highlight hover:bg-yellow-600 text-white font-bold flex items-center gap-2"
        >
          <Plus size={18} /> Join New Temple
        </Button>
      </div>

      {showJoinForm && (
        <div className="border rounded-xl p-6 bg-white shadow-sm">
          <h3 className="text-xl font-semibold mb-4">Join a Temple</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temple Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-highlight focus:border-highlight"
                placeholder="Enter temple name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Yoruba Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-highlight focus:border-highlight"
                placeholder="Enter Yoruba name"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-highlight focus:border-highlight"
                placeholder="Enter location"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-highlight focus:border-highlight"
                placeholder="Enter contact info"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website (optional)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-highlight focus:border-highlight"
                  placeholder="Enter website"
                />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Why do you want to join?</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-highlight focus:border-highlight"
                rows={3}
                placeholder="Tell us about your interest in joining this temple..."
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowJoinForm(false)}
            >
              Cancel
            </Button>
            <Button className="bg-highlight hover:bg-yellow-600">
              Submit Request
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search temples..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64 focus:ring-highlight focus:border-highlight"
          />
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'all' 
                ? 'bg-highlight text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Temples
          </button>
          <button 
            onClick={() => setFilter('affiliated')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'affiliated' 
                ? 'bg-highlight text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Affiliated
          </button>
          <button 
            onClick={() => setFilter('nearby')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'nearby' 
                ? 'bg-highlight text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Nearby
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemples.map((temple) => (
          <div key={temple.id} className="border rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="text-highlight" size={20} />
                  <h3 className="text-xl font-bold text-gray-900">{temple.name}</h3>
                </div>
                <p className="text-gray-600 text-sm italic mt-1">{temple.yorubaName}</p>
              </div>
              <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                <Star size={14} className="text-yellow-500 fill-current" />
                <span className="text-sm font-medium text-yellow-700">{temple.rating}</span>
              </div>
            </div>
            
            <p className="mt-4 text-gray-700">{temple.description}</p>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center text-gray-600 text-sm">
                <MapPin size={14} className="mr-2" />
                <span>{temple.location}</span>
              </div>
              
              <div className="flex items-center text-gray-600 text-sm">
                <Phone size={14} className="mr-2" />
                <span>{temple.contact}</span>
              </div>
              
              {temple.website && (
                <div className="flex items-center text-gray-600 text-sm">
                  <Globe size={14} className="mr-2" />
                  <a href={`http://${temple.website}`} className="text-highlight hover:underline">{temple.website}</a>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-xs text-gray-500">Events</p>
                <p className="font-semibold">{temple.upcomingEvents}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Practitioners</p>
                <p className="font-semibold">{temple.practitioners}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Joined</p>
                <p className="font-semibold">{temple.affiliated ? temple.memberSince : 'Not joined'}</p>
              </div>
            </div>
            
            <div className="mt-6 flex gap-2">
              {temple.affiliated ? (
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium">
                  <Heart size={16} className="fill-current" /> Connected
                </button>
              ) : (
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-highlight text-white rounded-lg hover:bg-yellow-600 text-sm font-medium">
                  <Heart size={16} /> Join Temple
                </button>
              )}
              
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                <Calendar size={16} /> Events
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TempleConnectionView;
import React, { useState } from 'react';
import { Building2, MapPin, Phone, Mail, Link, Users, CheckCircle, XCircle } from 'lucide-react';

interface Temple {
  id: string;
  name: string;
  location: string;
  contactEmail: string;
  contactPhone: string;
  description: string;
  website?: string;
  connected: boolean;
  connectedSince?: string;
  membersCount: number;
  servicesOffered: string[];
  operatingHours: {
    day: string;
    open: string;
    close: string;
  }[];
}

const TempleConnectionView: React.FC = () => {
  const [temples, setTemples] = useState<Temple[]>([
    {
      id: '1',
      name: 'Arowora Ifa Temple',
      location: 'Lekki Phase 1, Lagos, Nigeria',
      contactEmail: 'contact@aroworaifa.org',
      contactPhone: '+234 801 234 5678',
      description: 'A traditional Ifa temple dedicated to preserving ancient wisdom and providing spiritual guidance.',
      website: 'https://aroworaifa.org',
      connected: true,
      connectedSince: '2023-05-15',
      membersCount: 127,
      servicesOffered: ['Divination', 'Naming Ceremonies', 'Marriage Blessings'],
      operatingHours: [
        { day: 'Monday-Friday', open: '8:00 AM', close: '6:00 PM' },
        { day: 'Saturday', open: '9:00 AM', close: '4:00 PM' },
        { day: 'Sunday', open: 'Closed', close: 'Closed' }
      ]
    },
    {
      id: '2',
      name: 'Oduduwa Heritage Center',
      location: 'Ikeja, Lagos, Nigeria',
      contactEmail: 'info@oduduwa-center.org',
      contactPhone: '+234 802 345 6789',
      description: 'A cultural and spiritual center promoting Yoruba traditions and Ifa teachings.',
      website: 'https://oduduwa-center.org',
      connected: false,
      membersCount: 89,
      servicesOffered: ['Cultural Education', 'Traditional Ceremonies', 'Divination'],
      operatingHours: [
        { day: 'Monday-Saturday', open: '9:00 AM', close: '5:00 PM' },
        { day: 'Sunday', open: '10:00 AM', close: '2:00 PM' }
      ]
    },
    {
      id: '3',
      name: 'Agemo Ifa Sanctuary',
      location: 'Ibadan, Oyo State, Nigeria',
      contactEmail: 'sanctuary@agemoifa.ng',
      contactPhone: '+234 803 456 7890',
      description: 'A sacred space for Ifa practitioners and seekers of spiritual knowledge.',
      connected: false,
      membersCount: 65,
      servicesOffered: ['Divination', 'Healing Rituals', 'Spiritual Cleansing'],
      operatingHours: [
        { day: 'Tuesday-Sunday', open: '7:00 AM', close: '7:00 PM' },
        { day: 'Monday', open: 'Closed', close: 'Closed' }
      ]
    }
  ]);

  const [connectedTemples, setConnectedTemples] = useState(temples.filter(t => t.connected));
  const [availableTemples, setAvailableTemples] = useState(temples.filter(t => !t.connected));

  const toggleConnection = (id: string) => {
    setTemples(prev => prev.map(temple => {
      if (temple.id === id) {
        const isConnected = !temple.connected;
        if (isConnected) {
          // Add to connected temples
          setConnectedTemples(prevConn => [
            ...prevConn, 
            { ...temple, connected: true, connectedSince: new Date().toISOString().split('T')[0] }
          ]);
          // Remove from available temples
          setAvailableTemples(prevAvail => prevAvail.filter(t => t.id !== id));
        } else {
          // Remove from connected temples
          setConnectedTemples(prevConn => prevConn.filter(t => t.id !== id));
          // Add to available temples
          setAvailableTemples(prevAvail => [
            ...prevAvail, 
            { ...temple, connected: false, connectedSince: undefined }
          ]);
        }
        return { ...temple, connected: isConnected, connectedSince: isConnected ? new Date().toISOString().split('T')[0] : undefined };
      }
      return temple;
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold brand-font text-stone-900">
            Temple Connections
          </h1>
          <p className="text-stone-600">
            Connect with traditional Ifa temples and spiritual centers
          </p>
        </div>
        <button className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-green-800 transition-colors flex items-center gap-2">
          <Building2 size={18} /> Find Temples
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm">Connected Temples</p>
              <h3 className="text-2xl font-bold text-stone-900">{connectedTemples.length}</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <Building2 size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm">Total Members</p>
              <h3 className="text-2xl font-bold text-stone-900">
                {connectedTemples.reduce((sum, temple) => sum + temple.membersCount, 0)}
              </h3>
            </div>
            <div className="p-3 bg-green-100 rounded-xl text-green-700">
              <Users size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm">Active Connections</p>
              <h3 className="text-2xl font-bold text-stone-900">
                {temples.filter(t => t.connected).length}
              </h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl text-blue-700">
              <Link size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Connected Temples */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <CheckCircle className="text-green-600" size={20} /> Connected Temples
          </h2>
          <span className="text-stone-600">{connectedTemples.length} temples</span>
        </div>
        
        {connectedTemples.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {connectedTemples.map((temple) => (
              <div key={temple.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-stone-900">{temple.name}</h3>
                      <p className="text-stone-600 mt-1">{temple.description}</p>
                    </div>
                    <button 
                      onClick={() => toggleConnection(temple.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium hover:bg-red-200 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-stone-600">
                      <MapPin size={16} /> {temple.location}
                    </div>
                    <div className="flex items-center gap-2 text-stone-600">
                      <Phone size={16} /> {temple.contactPhone}
                    </div>
                    <div className="flex items-center gap-2 text-stone-600">
                      <Mail size={16} /> {temple.contactEmail}
                    </div>
                    {temple.website && (
                      <div className="flex items-center gap-2 text-stone-600">
                        <Link size={16} /> {temple.website}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-stone-100">
                    <h4 className="font-medium text-stone-800 mb-2">Services Offered</h4>
                    <div className="flex flex-wrap gap-2">
                      {temple.servicesOffered.map((service, idx) => (
                        <span key={idx} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-stone-100">
                    <h4 className="font-medium text-stone-800 mb-2">Operating Hours</h4>
                    <div className="space-y-1">
                      {temple.operatingHours.map((hours, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-stone-600">{hours.day}</span>
                          <span className="font-medium">{hours.open} - {hours.close}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-stone-600">Connected since</p>
                      <p className="font-bold">{temple.connectedSince}</p>
                    </div>
                    <div>
                      <p className="text-sm text-stone-600">Members</p>
                      <p className="font-bold">{temple.membersCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-12 text-center">
            <Building2 size={48} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-lg font-bold text-stone-900 mb-2">No connected temples</h3>
            <p className="text-stone-600 max-w-md mx-auto">
              Connect with traditional Ifa temples to expand your spiritual network
            </p>
          </div>
        )}
      </div>

      {/* Available Temples */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <XCircle className="text-stone-500" size={20} /> Available Temples
          </h2>
          <span className="text-stone-600">{availableTemples.length} temples</span>
        </div>
        
        {availableTemples.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableTemples.map((temple) => (
              <div key={temple.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-stone-900">{temple.name}</h3>
                      <p className="text-stone-600 mt-1">{temple.description}</p>
                    </div>
                    <button 
                      onClick={() => toggleConnection(temple.id)}
                      className="px-3 py-1 bg-primary text-white rounded-full text-sm font-medium hover:bg-green-800 transition-colors"
                    >
                      Connect
                    </button>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-stone-600">
                      <MapPin size={16} /> {temple.location}
                    </div>
                    <div className="flex items-center gap-2 text-stone-600">
                      <Phone size={16} /> {temple.contactPhone}
                    </div>
                    <div className="flex items-center gap-2 text-stone-600">
                      <Mail size={16} /> {temple.contactEmail}
                    </div>
                    {temple.website && (
                      <div className="flex items-center gap-2 text-stone-600">
                        <Link size={16} /> {temple.website}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-stone-100">
                    <h4 className="font-medium text-stone-800 mb-2">Services Offered</h4>
                    <div className="flex flex-wrap gap-2">
                      {temple.servicesOffered.map((service, idx) => (
                        <span key={idx} className="px-3 py-1 bg-stone-100 text-stone-700 rounded-full text-sm">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-stone-100">
                    <h4 className="font-medium text-stone-800 mb-2">Operating Hours</h4>
                    <div className="space-y-1">
                      {temple.operatingHours.map((hours, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-stone-600">{hours.day}</span>
                          <span className="font-medium">{hours.open} - {hours.close}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-stone-600">Members</p>
                      <p className="font-bold">{temple.membersCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-12 text-center">
            <XCircle size={48} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-lg font-bold text-stone-900 mb-2">No available temples</h3>
            <p className="text-stone-600 max-w-md mx-auto">
              You're connected to all nearby temples. Consider expanding your search radius.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TempleConnectionView;
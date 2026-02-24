import React, { useState } from 'react';
import { FileText, Search, Calendar, User, Clock, CheckCircle, XCircle, Eye, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import _api from '@/lib/api';

interface Prescription {
  id: string;
  title: string;
  description: string;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: string;
  updatedAt: string;
  babalawo: {
    id: string;
    name: string;
    yorubaName?: string;
  };
  client: {
    id: string;
    name: string;
  };
  appointment?: {
    id: string;
    date: string;
    type: string;
  };
}

const PrescriptionHistoryView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');

  // Mock prescription data
  const mockPrescriptions: Prescription[] = [
    {
      id: 'rx-001',
      title: 'Weekly Spiritual Cleansing Regimen',
      description: 'Daily herbal baths with specific prayers for ancestral connection',
      status: 'approved',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-16T14:22:00Z',
      babalawo: {
        id: 'bw-001',
        name: 'Samuel Adewale',
        yorubaName: 'Babalawo Samuel'
      },
      client: {
        id: 'client-001',
        name: 'Current User'
      },
      appointment: {
        id: 'apt-001',
        date: '2024-01-20T15:00:00Z',
        type: 'Video Consultation'
      }
    },
    {
      id: 'rx-002',
      title: 'Protection Ritual Protocol',
      description: 'Amulet blessing and weekly meditation practice for spiritual shielding',
      status: 'pending',
      createdAt: '2024-01-18T09:15:00Z',
      updatedAt: '2024-01-18T09:15:00Z',
      babalawo: {
        id: 'bw-002',
        name: 'Mary Johnson',
        yorubaName: 'Iya Mary'
      },
      client: {
        id: 'client-001',
        name: 'Current User'
      },
      appointment: {
        id: 'apt-002',
        date: '2024-01-22T11:00:00Z',
        type: 'In-person Consultation'
      }
    },
    {
      id: 'rx-003',
      title: 'Ancestral Communication Guidance',
      description: 'Dream work techniques and offering protocols for ancestor connection',
      status: 'rejected',
      createdAt: '2024-01-10T16:45:00Z',
      updatedAt: '2024-01-12T13:30:00Z',
      babalawo: {
        id: 'bw-003',
        name: 'David Okafor',
        yorubaName: 'Babalawo David'
      },
      client: {
        id: 'client-001',
        name: 'Current User'
      }
    }
  ];

  // Simulate API call
  const { data: prescriptions = [], isLoading } = useQuery<Prescription[]>({
    queryKey: ['prescriptions-history'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 600));
      return mockPrescriptions;
    }
  });

  // Filter prescriptions
  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = prescription.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prescription.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prescription.babalawo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (prescription.babalawo.yorubaName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    const matchesStatus = statusFilter === 'all' || prescription.status === statusFilter;
    
    // Time filter logic would go here
    const matchesTime = timeFilter === 'all';
    
    return matchesSearch && matchesStatus && matchesTime;
  });

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'approved':
        return { 
          icon: CheckCircle, 
          color: 'text-green-600', 
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Approved'
        };
      case 'pending':
        return { 
          icon: Clock, 
          color: 'text-yellow-600', 
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          label: 'Pending Review'
        };
      case 'rejected':
        return { 
          icon: XCircle, 
          color: 'text-red-600', 
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Rejected'
        };
      default:
        return { 
          icon: FileText, 
          color: 'text-stone-600', 
          bgColor: 'bg-stone-50',
          borderColor: 'border-stone-200',
          label: 'Unknown'
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewPrescription = (prescriptionId: string) => {
    // Navigate to prescription detail view
    console.log(`Viewing prescription: ${prescriptionId}`);
  };

  const handleDownloadPrescription = (prescriptionId: string) => {
    // Handle PDF download
    console.log(`Downloading prescription: ${prescriptionId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-highlight mx-auto mb-4"></div>
          <p className="text-stone-600">Loading prescription history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-highlight/10 rounded-full mb-4">
            <FileText className="text-highlight" size={20} />
            <span className="font-bold text-highlight uppercase tracking-wider">Prescriptions</span>
          </div>
          
          <h1 className="text-4xl font-bold text-stone-800 brand-font mb-4">
            Prescription History
          </h1>
          <p className="text-xl text-stone-600">
            Track your spiritual guidance prescriptions and their current status
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-stone-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search prescriptions, babalawos, or descriptions..."
                className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Time Filter */}
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-stone-600">
            Showing <span className="font-bold text-stone-800">{filteredPrescriptions.length}</span> of{' '}
            <span className="font-bold text-stone-800">{prescriptions.length}</span> prescriptions
          </p>
        </div>

        {/* Prescriptions List */}
        {filteredPrescriptions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-12 text-center">
            <FileText size={48} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-xl font-bold text-stone-800 mb-2">No prescriptions found</h3>
            <p className="text-stone-600">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPrescriptions.map((prescription) => {
              const statusInfo = getStatusInfo(prescription.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <div
                  key={prescription.id}
                  className={`bg-white rounded-2xl border ${statusInfo.borderColor} shadow-sm overflow-hidden hover:shadow-md transition-shadow`}
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-bold text-stone-800 mb-2">
                              {prescription.title}
                            </h3>
                            <p className="text-stone-600 mb-3 line-clamp-2">
                              {prescription.description}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500">
                              <div className="flex items-center gap-1">
                                <User size={16} />
                                <span>Babalawo: {prescription.babalawo.yorubaName || prescription.babalawo.name}</span>
                              </div>
                              
                              {prescription.appointment && (
                                <>
                                  <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                                  <div className="flex items-center gap-1">
                                    <Calendar size={16} />
                                    <span>{formatDate(prescription.appointment.date)}</span>
                                  </div>
                                </>
                              )}
                              
                              <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                              <div className="flex items-center gap-1">
                                <Clock size={16} />
                                <span>Created: {formatDate(prescription.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className={`px-3 py-2 rounded-xl ${statusInfo.bgColor} ${statusInfo.borderColor} border flex items-center gap-2`}>
                          <StatusIcon size={18} className={statusInfo.color} />
                          <span className={`font-bold text-sm ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewPrescription(prescription.id)}
                            className="p-2 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
                            title="View details"
                          >
                            <Eye size={18} className="text-stone-600" />
                          </button>
                          <button
                            onClick={() => handleDownloadPrescription(prescription.id)}
                            className="p-2 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
                            title="Download PDF"
                          >
                            <Download size={18} className="text-stone-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {prescription.status === 'rejected' && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-sm text-red-700">
                          <span className="font-bold">Note:</span> This prescription was rejected. 
                          Please contact your Babalawo for clarification or request a revision.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <h3 className="text-2xl font-bold text-stone-800">
              {prescriptions.filter(p => p.status === 'approved').length}
            </h3>
            <p className="text-stone-600">Approved</p>
          </div>
          
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="text-yellow-600" size={24} />
            </div>
            <h3 className="text-2xl font-bold text-stone-800">
              {prescriptions.filter(p => p.status === 'pending').length}
            </h3>
            <p className="text-stone-600">Pending</p>
          </div>
          
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="text-blue-600" size={24} />
            </div>
            <h3 className="text-2xl font-bold text-stone-800">{prescriptions.length}</h3>
            <p className="text-stone-600">Total</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionHistoryView;
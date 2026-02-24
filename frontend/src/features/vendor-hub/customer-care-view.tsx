import React, { useState } from 'react';
import { MessageSquare, Mail, User, Calendar, Search, Filter, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface SupportTicket {
  id: string;
  subject: string;
  customerName: string;
  customerEmail: string;
  category: 'technical' | 'billing' | 'product' | 'shipping' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  dateCreated: string;
  lastUpdated: string;
  description: string;
  assignedTo?: string;
}

const CustomerCareView: React.FC = () => {
  const [tickets, _setTickets] = useState<SupportTicket[]>([
    {
      id: 'TKT-001',
      subject: 'Damaged Ifa Divination Chain',
      customerName: 'Adunni Smith',
      customerEmail: 'adunni@example.com',
      category: 'product',
      priority: 'high',
      status: 'in-progress',
      dateCreated: '2024-02-15',
      lastUpdated: '2024-02-18',
      description: 'Received the divination chain but noticed cracks on some of the wooden beads. Need replacement or refund.',
      assignedTo: 'Customer Service Team'
    },
    {
      id: 'TKT-002',
      subject: 'Delayed Shipment',
      customerName: 'Emeka Johnson',
      customerEmail: 'emeka@example.com',
      category: 'shipping',
      priority: 'medium',
      status: 'open',
      dateCreated: '2024-02-16',
      lastUpdated: '2024-02-16',
      description: 'Ordered traditional fabric 2 weeks ago but still hasn\'t arrived. Tracking shows no updates.',
      assignedTo: 'Shipping Department'
    },
    {
      id: 'TKT-003',
      subject: 'Incorrect Product Sent',
      customerName: 'Fatimah Yusuf',
      customerEmail: 'fatimah@example.com',
      category: 'product',
      priority: 'high',
      status: 'resolved',
      dateCreated: '2024-02-10',
      lastUpdated: '2024-02-14',
      description: 'Received Adire fabric instead of Aso Oke. Need the correct item sent immediately.',
      assignedTo: 'Customer Service Team'
    },
    {
      id: 'TKT-004',
      subject: 'Billing Discrepancy',
      customerName: 'Olumide Adebayo',
      customerEmail: 'olumide@example.com',
      category: 'billing',
      priority: 'medium',
      status: 'open',
      dateCreated: '2024-02-17',
      lastUpdated: '2024-02-17',
      description: 'Charged twice for the same order. Need refund for the duplicate charge.',
      assignedTo: 'Finance Department'
    },
    {
      id: 'TKT-005',
      subject: 'Technical Question',
      customerName: 'Grace Okonkwo',
      customerEmail: 'grace@example.com',
      category: 'technical',
      priority: 'low',
      status: 'resolved',
      dateCreated: '2024-02-12',
      lastUpdated: '2024-02-13',
      description: 'How do I properly maintain my Ifa divination chain to preserve its sacred properties?',
      assignedTo: 'Support Team'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const statuses = ['all', 'open', 'in-progress', 'resolved', 'closed'];
  const priorities = ['all', 'low', 'medium', 'high', 'urgent'];

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-stone-100 text-stone-800';
      default: return 'bg-stone-100 text-stone-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-stone-100 text-stone-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-stone-100 text-stone-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return <MessageSquare size={16} />;
      case 'billing': return <Mail size={16} />;
      case 'product': return <CheckCircle size={16} />;
      case 'shipping': return <Calendar size={16} />;
      default: return <User size={16} />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold brand-font text-stone-900">
            Customer Care
          </h1>
          <p className="text-stone-600">
            Manage and respond to customer support requests
          </p>
        </div>
        <button className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-green-800 transition-colors flex items-center gap-2">
          <MessageSquare size={18} /> New Ticket
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm">Total Tickets</p>
              <h3 className="text-2xl font-bold text-stone-900">{tickets.length}</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <MessageSquare size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm">Open Tickets</p>
              <h3 className="text-2xl font-bold text-stone-900">
                {tickets.filter(t => t.status === 'open').length}
              </h3>
            </div>
            <div className="p-3 bg-yellow-100 rounded-xl text-yellow-700">
              <AlertCircle size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm">High Priority</p>
              <h3 className="text-2xl font-bold text-stone-900">
                {tickets.filter(t => t.priority === 'high' || t.priority === 'urgent').length}
              </h3>
            </div>
            <div className="p-3 bg-red-100 rounded-xl text-red-700">
              <AlertCircle size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm">Resolved</p>
              <h3 className="text-2xl font-bold text-stone-900">
                {tickets.filter(t => t.status === 'resolved').length}
              </h3>
            </div>
            <div className="p-3 bg-green-100 rounded-xl text-green-700">
              <CheckCircle size={24} />
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
              placeholder="Search tickets..."
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
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
            >
              {priorities.map(priority => (
                <option key={priority} value={priority}>
                  {priority === 'all' ? 'All Priorities' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                </option>
              ))}
            </select>
            <button className="px-3 py-2 border border-stone-300 rounded-xl flex items-center gap-2 hover:bg-stone-50">
              <Filter size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length > 0 ? (
          filteredTickets.map((ticket) => (
            <div 
              key={ticket.id} 
              className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-stone-100 rounded-lg">
                        {getCategoryIcon(ticket.category)}
                      </div>
                      <h3 className="font-bold text-lg text-stone-900">{ticket.subject}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('-', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="text-stone-600 mt-1">From: {ticket.customerName} ({ticket.customerEmail})</p>
                    
                    <div className="flex flex-wrap gap-4 mt-3">
                      <div className="flex items-center gap-1 text-sm text-stone-600">
                        <Calendar size={14} /> Created: {new Date(ticket.dateCreated).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-stone-600">
                        <Clock size={14} /> Updated: {new Date(ticket.lastUpdated).toLocaleDateString()}
                      </div>
                      {ticket.assignedTo && (
                        <div className="flex items-center gap-1 text-sm text-stone-600">
                          <User size={14} /> {ticket.assignedTo}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-stone-600 text-sm line-clamp-2 max-w-md">
                      {ticket.description.substring(0, 100)}...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-12 text-center">
            <MessageSquare size={48} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-lg font-bold text-stone-900 mb-2">No tickets found</h3>
            <p className="text-stone-600 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No support tickets to display'}
            </p>
          </div>
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-stone-900">{selectedTicket.subject}</h3>
              <button 
                onClick={() => setSelectedTicket(null)}
                className="text-stone-500 hover:text-stone-700"
              >
                <AlertCircle size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-stone-500">ID:</span>
                  <span className="font-medium">{selectedTicket.id}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-stone-500">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status.replace('-', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-stone-500">Priority:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${getPriorityColor(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-stone-500">Category:</span>
                  <span className="capitalize">{selectedTicket.category}</span>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-stone-800 mb-1">Customer</h4>
                <p className="text-stone-700">{selectedTicket.customerName} ({selectedTicket.customerEmail})</p>
              </div>
              
              <div>
                <h4 className="font-medium text-stone-800 mb-1">Description</h4>
                <p className="text-stone-700 whitespace-pre-line">{selectedTicket.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-stone-800 mb-1">Created</h4>
                  <p className="text-stone-700">{new Date(selectedTicket.dateCreated).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="font-medium text-stone-800 mb-1">Last Updated</h4>
                  <p className="text-stone-700">{new Date(selectedTicket.lastUpdated).toLocaleDateString()}</p>
                </div>
              </div>
              
              {selectedTicket.assignedTo && (
                <div>
                  <h4 className="font-medium text-stone-800 mb-1">Assigned To</h4>
                  <p className="text-stone-700">{selectedTicket.assignedTo}</p>
                </div>
              )}
              
              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="flex-1 py-3 border border-stone-300 text-stone-700 rounded-xl font-bold hover:bg-stone-50 transition-colors"
                >
                  Close
                </button>
                <button
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-green-800 transition-colors"
                >
                  Respond
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerCareView;
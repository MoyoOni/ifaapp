import React, { useState } from 'react';
import { MessageCircle, Mail, LifeBuoy, HelpCircle, Search, Filter, Send, Paperclip, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';

interface VendorSupportCenterViewProps {
  onBack?: () => void;
}

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'account' | 'product' | 'other';
  createdAt: string;
  updatedAt: string;
  replies: SupportReply[];
}

interface SupportReply {
  id: string;
  message: string;
  sender: 'vendor' | 'support-agent';
  timestamp: string;
}

const VendorSupportCenterView: React.FC<VendorSupportCenterViewProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState('technical');
  const [newTicketPriority, setNewTicketPriority] = useState('medium');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [activeTicket, setActiveTicket] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  const { data: tickets = [
    {
      id: 'ticket-001',
      subject: 'Product listing not showing correctly',
      message: 'I added a new product yesterday but it\'s still not visible on the marketplace. Can you help me fix this?',
      status: 'open',
      priority: 'high',
      category: 'product',
      createdAt: '2025-01-20T10:30:00Z',
      updatedAt: '2025-01-20T14:45:00Z',
      replies: [
        {
          id: 'reply-001',
          message: 'Thanks for reaching out. I can see your product is in draft status. It needs to be published before it appears on the marketplace.',
          sender: 'support-agent',
          timestamp: '2025-01-20T11:15:00Z'
        }
      ]
    },
    {
      id: 'ticket-002',
      subject: 'Payment not processed for order #abc123',
      message: 'I haven\'t received payment for order #abc123 that was marked as delivered 3 days ago.',
      status: 'in-progress',
      priority: 'urgent',
      category: 'billing',
      createdAt: '2025-01-18T15:20:00Z',
      updatedAt: '2025-01-19T09:10:00Z',
      replies: [
        {
          id: 'reply-002',
          message: 'We are currently investigating this issue. The payment should be processed within 24-48 hours.',
          sender: 'support-agent',
          timestamp: '2025-01-18T16:30:00Z'
        }
      ]
    },
    {
      id: 'ticket-003',
      subject: 'Request to update business information',
      message: 'I need to update my business name and contact information. How can I do this?',
      status: 'resolved',
      priority: 'low',
      category: 'account',
      createdAt: '2025-01-15T09:15:00Z',
      updatedAt: '2025-01-15T11:45:00Z',
      replies: [
        {
          id: 'reply-003',
          message: 'You can update your business information in your profile settings. Go to Dashboard > Profile > Business Information.',
          sender: 'support-agent',
          timestamp: '2025-01-15T10:00:00Z'
        }
      ]
    }
  ] as SupportTicket[], isLoading } = useQuery({
    queryKey: ['vendor-tickets', user?.id],
    queryFn: async () => {
      // In a real implementation, this would fetch from the backend
      // For demo purposes, returning mock data
      return [
        {
          id: 'ticket-001',
          subject: 'Product listing not showing correctly',
          message: 'I added a new product yesterday but it\'s still not visible on the marketplace. Can you help me fix this?',
          status: 'open',
          priority: 'high',
          category: 'product',
          createdAt: '2025-01-20T10:30:00Z',
          updatedAt: '2025-01-20T14:45:00Z',
          replies: [
            {
              id: 'reply-001',
              message: 'Thanks for reaching out. I can see your product is in draft status. It needs to be published before it appears on the marketplace.',
              sender: 'support-agent',
              timestamp: '2025-01-20T11:15:00Z'
            }
          ]
        },
        {
          id: 'ticket-002',
          subject: 'Payment not processed for order #abc123',
          message: 'I haven\'t received payment for order #abc123 that was marked as delivered 3 days ago.',
          status: 'in-progress',
          priority: 'urgent',
          category: 'billing',
          createdAt: '2025-01-18T15:20:00Z',
          updatedAt: '2025-01-19T09:10:00Z',
          replies: [
            {
              id: 'reply-002',
              message: 'We are currently investigating this issue. The payment should be processed within 24-48 hours.',
              sender: 'support-agent',
              timestamp: '2025-01-18T16:30:00Z'
            }
          ]
        },
        {
          id: 'ticket-003',
          subject: 'Request to update business information',
          message: 'I need to update my business name and contact information. How can I do this?',
          status: 'resolved',
          priority: 'low',
          category: 'account',
          createdAt: '2025-01-15T09:15:00Z',
          updatedAt: '2025-01-15T11:45:00Z',
          replies: [
            {
              id: 'reply-003',
              message: 'You can update your business information in your profile settings. Go to Dashboard > Profile > Business Information.',
              sender: 'support-agent',
              timestamp: '2025-01-15T10:00:00Z'
            }
          ]
        }
      ];
    },
    enabled: !!user?.id
  });

  const mutation = useMutation({
    mutationFn: async (newTicket: Omit<SupportTicket, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'replies'>) => {
      // In a real implementation, this would send to the backend
      console.log('Creating new ticket:', newTicket);
      return { id: `ticket-${Date.now()}`, ...newTicket, status: 'open', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), replies: [] };
    },
    onSuccess: () => {
      // Reset form
      setNewTicketSubject('');
      setNewTicketMessage('');
      setNewTicketCategory('technical');
      setNewTicketPriority('medium');
    }
  });

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) return;
    
    mutation.mutate({
      subject: newTicketSubject,
      message: newTicketMessage,
      priority: newTicketPriority as 'low' | 'medium' | 'high' | 'urgent',
      category: newTicketCategory as 'technical' | 'billing' | 'account' | 'product' | 'other',
      updatedAt: new Date().toISOString(),
      replies: []
    });
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ticket.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeTicket) return;
    
    // In a real implementation, this would submit the reply to the backend
    console.log('Submitting reply:', { ticketId: activeTicket, message: replyMessage });
    
    // Reset reply form
    setReplyMessage('');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-stone-600 bg-stone-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-100';
      case 'in-progress': return 'text-yellow-600 bg-yellow-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'closed': return 'text-stone-600 bg-stone-100';
      default: return 'text-stone-600 bg-stone-100';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-stone-200 rounded w-1/4"></div>
            <div className="h-12 bg-stone-200 rounded w-1/2 mx-auto"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
                  <div className="h-6 bg-stone-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-stone-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-stone-200 rounded w-1/3 mb-4"></div>
                  <div className="h-8 bg-stone-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <button 
            onClick={onBack || (() => window.history.back())}
            className="text-sm font-bold text-stone-500 hover:text-stone-800 mb-2 flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold brand-font text-stone-800">Support Center</h1>
              <p className="text-stone-500">Get help with your store and resolve issues</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Submit Ticket Form */}
            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
              <h2 className="text-lg font-bold text-stone-800 mb-4">Submit New Request</h2>
              <form onSubmit={handleCreateTicket}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-stone-600 mb-1">Subject</label>
                    <input
                      type="text"
                      value={newTicketSubject}
                      onChange={(e) => setNewTicketSubject(e.target.value)}
                      className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-highlight focus:border-highlight"
                      placeholder="Briefly describe your issue"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-stone-600 mb-1">Category</label>
                    <select
                      value={newTicketCategory}
                      onChange={(e) => setNewTicketCategory(e.target.value)}
                      className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-highlight focus:border-highlight"
                    >
                      <option value="technical">Technical Issue</option>
                      <option value="billing">Billing/Payment</option>
                      <option value="account">Account</option>
                      <option value="product">Product Listing</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-stone-600 mb-1">Priority</label>
                    <select
                      value={newTicketPriority}
                      onChange={(e) => setNewTicketPriority(e.target.value)}
                      className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-highlight focus:border-highlight"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-stone-600 mb-1">Message</label>
                    <textarea
                      value={newTicketMessage}
                      onChange={(e) => setNewTicketMessage(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-highlight focus:border-highlight"
                      placeholder="Describe your issue in detail..."
                      required
                    ></textarea>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={mutation.isLoading}
                      className="px-6 py-3 bg-highlight text-white rounded-xl font-bold hover:bg-yellow-500 transition-all flex items-center gap-2"
                    >
                      {mutation.isLoading ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          Submit Request
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Tickets List */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-stone-800">My Requests</h2>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search requests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-highlight focus:border-highlight w-full md:w-48"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <select 
                      value={statusFilter} 
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-highlight focus:border-highlight"
                    >
                      <option value="all">All Statuses</option>
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                    
                    <select 
                      value={priorityFilter} 
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-highlight focus:border-highlight"
                    >
                      <option value="all">All Priorities</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-stone-100">
                {filteredTickets.length === 0 ? (
                  <div className="p-12 text-center">
                    <MessageCircle className="text-stone-300 mx-auto mb-4" size={48} />
                    <p className="text-stone-500 font-medium">No support requests found.</p>
                  </div>
                ) : (
                  filteredTickets.map(ticket => (
                    <div 
                      key={ticket.id} 
                      className={`p-4 hover:bg-stone-50 transition-colors cursor-pointer ${
                        activeTicket === ticket.id ? 'bg-stone-50' : ''
                      }`}
                      onClick={() => setActiveTicket(activeTicket === ticket.id ? null : ticket.id)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            <div className={`p-1.5 rounded-lg ${
                              ticket.category === 'technical' ? 'bg-blue-100 text-blue-600' :
                              ticket.category === 'billing' ? 'bg-purple-100 text-purple-600' :
                              ticket.category === 'account' ? 'bg-green-100 text-green-600' :
                              ticket.category === 'product' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-stone-100 text-stone-600'
                            }`}>
                              {ticket.category === 'technical' && <HelpCircle size={16} />}
                              {ticket.category === 'billing' && <LifeBuoy size={16} />}
                              {ticket.category === 'account' && <Mail size={16} />}
                              {ticket.category === 'product' && <AlertTriangle size={16} />}
                              {ticket.category === 'other' && <MessageCircle size={16} />}
                            </div>
                            
                            <div className="min-w-0">
                              <h3 className="font-bold text-stone-800 truncate">{ticket.subject}</h3>
                              <p className="text-sm text-stone-500 mt-1 line-clamp-2">{ticket.message}</p>
                              
                              <div className="flex flex-wrap gap-2 mt-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getPriorityColor(ticket.priority)}`}>
                                  {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(ticket.status)}`}>
                                  {ticket.status.replace('-', ' ').charAt(0).toUpperCase() + ticket.status.slice(1).replace('-', ' ')}
                                </span>
                                <span className="text-xs text-stone-400 flex items-center gap-1">
                                  <Clock size={12} />
                                  {new Date(ticket.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {activeTicket === ticket.id ? (
                            <span className="text-xs text-stone-500">Tap to close</span>
                          ) : (
                            <span className="text-xs text-stone-500">Tap to view details</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Ticket Replies */}
                      {activeTicket === ticket.id && (
                        <div className="mt-4 pt-4 border-t border-stone-100 space-y-4">
                          <div className="space-y-3">
                            <div className={`p-3 rounded-lg ${
                              ticket.replies.some(r => r.sender === 'vendor') ? 'bg-blue-50' : 'bg-stone-50'
                            }`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-sm text-stone-800">
                                  {ticket.replies.some(r => r.sender === 'vendor') ? 'You' : 'Support Agent'}
                                </span>
                                <span className="text-xs text-stone-400">
                                  {new Date(ticket.replies[0]?.timestamp || ticket.updatedAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-stone-700">{ticket.replies[0]?.message || ticket.message}</p>
                            </div>
                            
                            {ticket.replies.slice(1).map(reply => (
                              <div 
                                key={reply.id} 
                                className={`p-3 rounded-lg ${
                                  reply.sender === 'vendor' ? 'bg-blue-50' : 'bg-stone-50'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-sm text-stone-800">
                                    {reply.sender === 'vendor' ? 'You' : 'Support Agent'}
                                  </span>
                                  <span className="text-xs text-stone-400">
                                    {new Date(reply.timestamp).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm text-stone-700">{reply.message}</p>
                              </div>
                            ))}
                          </div>
                          
                          {/* Reply Form */}
                          <form onSubmit={handleReplySubmit} className="mt-4">
                            <div className="flex gap-2 mb-2">
                              <input
                                type="text"
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                className="flex-1 px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-highlight focus:border-highlight"
                                placeholder="Type your reply..."
                              />
                              <button
                                type="submit"
                                className="px-4 py-2 bg-highlight text-white rounded-lg font-bold hover:bg-yellow-500 transition-colors flex items-center gap-1"
                              >
                                <Send size={16} />
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
              <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                <LifeBuoy className="text-highlight" size={20} />
                Quick Help
              </h2>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="flex items-center gap-2 p-2 rounded-lg hover:bg-stone-50 text-stone-700">
                    <HelpCircle size={16} className="text-stone-400" />
                    <span className="text-sm">Getting Started</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center gap-2 p-2 rounded-lg hover:bg-stone-50 text-stone-700">
                    <AlertTriangle size={16} className="text-stone-400" />
                    <span className="text-sm">Common Issues</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center gap-2 p-2 rounded-lg hover:bg-stone-50 text-stone-700">
                    <CheckCircle size={16} className="text-stone-400" />
                    <span className="text-sm">Best Practices</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center gap-2 p-2 rounded-lg hover:bg-stone-50 text-stone-700">
                    <XCircle size={16} className="text-stone-400" />
                    <span className="text-sm">Account Policies</span>
                  </a>
                </li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-6 text-white">
              <h2 className="text-lg font-bold mb-2">Need Immediate Help?</h2>
              <p className="text-sm opacity-90 mb-4">Our support team is ready to assist you with urgent matters.</p>
              <button className="w-full py-3 bg-white text-primary rounded-xl font-bold hover:opacity-90 transition-opacity">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorSupportCenterView;
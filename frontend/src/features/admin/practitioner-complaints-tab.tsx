import React, { useState } from 'react';
import { 
  AlertTriangle, 
  User, 
  Clock, 
  CheckCircle, 
  FileText,
  Search,
  Shield,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from '@/shared/components/ui/select';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Skeleton } from '@/shared/components/ui/skeleton';
import api from '@/lib/api';

interface PractitionerComplaint {
  id: string;
  clientId: string;
  client: {
    id: string;
    name: string;
    email: string;
  };
  practitionerId: string;
  practitioner: {
    id: string;
    name: string;
    email: string;
    isVerified: boolean;
  };
  reason: string;
  description: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  resolutionNotes?: string;
  resolvedBy?: string;
  resolver?: {
    name: string;
  };
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const PractitionerComplaintsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingComplaint, setEditingComplaint] = useState<PractitionerComplaint | null>(null);
  const [resolutionAction, setResolutionAction] = useState<string>('WARN');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [clientNotification, setClientNotification] = useState<string>('');
  
  const queryClient = useQueryClient();

  const { data: complaints = [], isLoading } = useQuery<PractitionerComplaint[]>({
    queryKey: ['practitioner-complaints'],
    queryFn: async () => {
      const response = await api.get('/admin/complaints');
      return response.data;
    }
  });

  const resolveComplaintMutation = useMutation({
    mutationFn: async ({ complaintId, action, resolutionNotes, clientNotification }: { 
      complaintId: string, 
      action: string, 
      resolutionNotes: string, 
      clientNotification: string 
    }) => {
      const response = await api.post(`/admin/complaints/${complaintId}/resolve`, {
        action,
        resolutionNotes,
        clientNotification
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practitioner-complaints'] });
      setEditingComplaint(null);
    }
  });

  // Apply search and filter
  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = complaint.practitioner.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          complaint.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          complaint.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter !== 'all') {
      return complaint.status === statusFilter;
    }
    return matchesSearch;
  });

  const handleResolveComplaint = () => {
    if (!editingComplaint) return;
    
    resolveComplaintMutation.mutate({
      complaintId: editingComplaint.id,
      action: resolutionAction,
      resolutionNotes,
      clientNotification
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'DISMISSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'no-show': return 'bg-orange-100 text-orange-800';
      case 'inappropriate': return 'bg-red-100 text-red-800';
      case 'fraud': return 'bg-purple-100 text-purple-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const renderSkeletonRows = () => {
    return Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={index}>
        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <AlertTriangle size={22} />
          Practitioner Complaints Management
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle size={16} />
              Total Complaints
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{complaints.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock size={16} />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {complaints.filter(c => c.status === 'PENDING').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle size={16} />
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {complaints.filter(c => c.status === 'RESOLVED').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User size={16} />
              Unique Practitioners
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {[...new Set(complaints.map(c => c.practitionerId))].length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Complaints List</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search complaints..."
                className="pl-8 w-[200px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Complaint</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Practitioner</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  renderSkeletonRows()
                ) : filteredComplaints.length > 0 ? (
                  filteredComplaints.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-muted-foreground" />
                          <span>#{complaint.id.substring(0, 8)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-xs">{complaint.client.name.charAt(0)}</span>
                          </div>
                          <div>
                            <div className="font-medium">{complaint.client.name}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[100px]">{complaint.client.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            complaint.practitioner.isVerified ? 'bg-green-100' : 'bg-muted'
                          }`}>
                            <span className={`text-xs ${complaint.practitioner.isVerified ? 'text-green-800' : 'text-muted-foreground'}`}>
                              {complaint.practitioner.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-1">
                              {complaint.practitioner.name}
                              {complaint.practitioner.isVerified && (
                                <Shield size={12} className="text-green-600 fill-green-300" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[100px]">{complaint.practitioner.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getReasonColor(complaint.reason)}>
                          {complaint.reason}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(complaint.status)}>
                          {complaint.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Dialog 
                          open={editingComplaint?.id === complaint.id} 
                          onOpenChange={(open) => setEditingComplaint(open ? complaint : null)}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              {complaint.status === 'PENDING' ? 'Resolve' : 'View'}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>
                                {complaint.status === 'PENDING' ? 'Resolve Complaint' : 'View Complaint Details'}
                              </DialogTitle>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium mb-2">Client</h4>
                                  <div className="text-sm p-3 bg-muted rounded">
                                    <div className="font-medium">{complaint.client.name}</div>
                                    <div className="text-muted-foreground">{complaint.client.email}</div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium mb-2">Practitioner</h4>
                                  <div className="text-sm p-3 bg-muted rounded">
                                    <div className="font-medium">{complaint.practitioner.name}</div>
                                    <div className="text-muted-foreground">{complaint.practitioner.email}</div>
                                    {complaint.practitioner.isVerified && (
                                      <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                                        <Shield size={12} /> Verified
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Complaint Details</h4>
                                <div className="text-sm p-3 bg-muted rounded">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge className={getReasonColor(complaint.reason)}>
                                      {complaint.reason}
                                    </Badge>
                                    <Badge className={getStatusColor(complaint.status)}>
                                      {complaint.status}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      Filed: {new Date(complaint.createdAt).toLocaleString()}
                                    </span>
                                  </div>
                                  <p>{complaint.description}</p>
                                </div>
                              </div>
                              
                              {complaint.status === 'RESOLVED' && (
                                <div>
                                  <h4 className="font-medium mb-2">Resolution Details</h4>
                                  <div className="text-sm p-3 bg-muted rounded">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span>Resolved by: {complaint.resolver?.name || 'Unknown'}</span>
                                      <span className="text-muted-foreground">at {complaint.resolvedAt ? new Date(complaint.resolvedAt).toLocaleString() : 'N/A'}</span>
                                    </div>
                                    <p><strong>Action:</strong> {complaint.resolutionNotes}</p>
                                  </div>
                                </div>
                              )}
                              
                              {complaint.status === 'PENDING' && (
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="action">Resolution Action</Label>
                                    <Select value={resolutionAction} onValueChange={setResolutionAction}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select action" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="WARN">Warn Practitioner</SelectItem>
                                        <SelectItem value="SUSPEND_BOOKINGS">Suspend Bookings</SelectItem>
                                        <SelectItem value="REVOKE_VERIFICATION">Revoke Verification</SelectItem>
                                        <SelectItem value="ESCALATE">Escalate to Dispute</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div>
                                    <Label htmlFor="notes">Resolution Notes</Label>
                                    <Textarea
                                      id="notes"
                                      value={resolutionNotes}
                                      onChange={(e) => setResolutionNotes(e.target.value)}
                                      placeholder="Add notes about the resolution..."
                                    />
                                  </div>
                                  
                                  <div>
                                    <Label htmlFor="notification">Client Notification</Label>
                                    <Textarea
                                      id="notification"
                                      value={clientNotification}
                                      onChange={(e) => setClientNotification(e.target.value)}
                                      placeholder="Message to send to the client about the resolution..."
                                    />
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="outline" 
                                      onClick={() => {
                                        setEditingComplaint(null);
                                        setResolutionAction('WARN');
                                        setResolutionNotes('');
                                        setClientNotification('');
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button 
                                      onClick={handleResolveComplaint}
                                      disabled={resolveComplaintMutation.isPending}
                                    >
                                      {resolveComplaintMutation.isPending ? 'Resolving...' : 'Resolve Complaint'}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No complaints found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        <p>Handle complaints about practitioners separately from forum reports.</p>
      </div>
    </div>
  );
};

export default PractitionerComplaintsTab;
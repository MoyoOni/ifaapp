import React, { useState } from 'react';
import {
  AlertTriangle,
  User,
  Clock,
  CheckCircle,
  FileText,
  Search,
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

interface UserReport {
  id: string;
  reporterId: string;
  reporter: { id: string; name: string; email: string };
  reportedUserId: string;
  reportedUser: { id: string; name: string; email: string; role: string };
  reason: string;
  description: string;
  flaggedByKeywordRule?: boolean;
  matchedKeywords?: string[];
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  resolutionNotes?: string;
  resolvedBy?: { name: string };
  resolvedAt?: string;
  createdAt: string;
}

// Whole-app audit loose end: generic version of practitioner-complaints-tab.tsx,
// for reports filed against any user (not just practitioners).
const UserReportsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingReport, setEditingReport] = useState<UserReport | null>(null);
  const [resolutionAction, setResolutionAction] = useState<string>('WARN');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');

  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery<UserReport[]>({
    queryKey: ['user-reports'],
    queryFn: async () => (await api.get('/admin/user-reports')).data,
  });

  const resolveReportMutation = useMutation({
    mutationFn: async ({ reportId, action, resolutionNotes }: { reportId: string; action: string; resolutionNotes: string }) =>
      (await api.post(`/admin/user-reports/${reportId}/resolve`, { action, resolutionNotes })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-reports'] });
      setEditingReport(null);
    }
  });

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.reportedUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reason.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter !== 'all') {
      return report.status === statusFilter;
    }
    return matchesSearch;
  });

  const handleResolveReport = () => {
    if (!editingReport) return;
    resolveReportMutation.mutate({ reportId: editingReport.id, action: resolutionAction, resolutionNotes });
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
      case 'HARASSMENT': return 'bg-red-100 text-red-800';
      case 'FRAUD': return 'bg-purple-100 text-purple-800';
      case 'SPAM': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const renderSkeletonRows = () =>
    Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={index}>
        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
      </TableRow>
    ));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <AlertTriangle size={22} />
          User Reports
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle size={16} />
              Total Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{reports.length}</div>
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
              {reports.filter(r => r.status === 'PENDING').length}
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
              {reports.filter(r => r.status === 'RESOLVED').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User size={16} />
              Unique Reported Users
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {[...new Set(reports.map(r => r.reportedUserId))].length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Reports List</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
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
                  <TableHead>Report</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Reported User</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  renderSkeletonRows()
                ) : filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-muted-foreground" />
                          <span>#{report.id.substring(0, 8)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-xs">{report.reporter.name.charAt(0)}</span>
                          </div>
                          <div>
                            <div className="font-medium">{report.reporter.name}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[100px]">{report.reporter.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-xs">{report.reportedUser.name.charAt(0)}</span>
                          </div>
                          <div>
                            <div className="font-medium">{report.reportedUser.name}</div>
                            <div className="text-xs text-muted-foreground">{report.reportedUser.role}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          <Badge className={getReasonColor(report.reason)}>
                            {report.reason}
                          </Badge>
                          {report.flaggedByKeywordRule && (
                            <span title={report.matchedKeywords?.join(', ')}>
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                ⚠ Flagged
                              </Badge>
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(report.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Dialog
                          open={editingReport?.id === report.id}
                          onOpenChange={(open) => setEditingReport(open ? report : null)}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              {report.status === 'PENDING' ? 'Resolve' : 'View'}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>
                                {report.status === 'PENDING' ? 'Resolve Report' : 'View Report Details'}
                              </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium mb-2">Reporter</h4>
                                  <div className="text-sm p-3 bg-muted rounded">
                                    <div className="font-medium">{report.reporter.name}</div>
                                    <div className="text-muted-foreground">{report.reporter.email}</div>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-medium mb-2">Reported User</h4>
                                  <div className="text-sm p-3 bg-muted rounded">
                                    <div className="font-medium">{report.reportedUser.name}</div>
                                    <div className="text-muted-foreground">{report.reportedUser.email}</div>
                                    <div className="mt-1 text-xs text-muted-foreground">{report.reportedUser.role}</div>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-medium mb-2">Report Details</h4>
                                <div className="text-sm p-3 bg-muted rounded">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge className={getReasonColor(report.reason)}>
                                      {report.reason}
                                    </Badge>
                                    <Badge className={getStatusColor(report.status)}>
                                      {report.status}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      Filed: {new Date(report.createdAt).toLocaleString()}
                                    </span>
                                  </div>
                                  <p>{report.description}</p>
                                </div>
                              </div>

                              {report.status !== 'PENDING' && (
                                <div>
                                  <h4 className="font-medium mb-2">Resolution Details</h4>
                                  <div className="text-sm p-3 bg-muted rounded">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span>Resolved by: {report.resolvedBy?.name || 'Unknown'}</span>
                                      <span className="text-muted-foreground">at {report.resolvedAt ? new Date(report.resolvedAt).toLocaleString() : 'N/A'}</span>
                                    </div>
                                    <p><strong>Notes:</strong> {report.resolutionNotes}</p>
                                  </div>
                                </div>
                              )}

                              {report.status === 'PENDING' && (
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="action">Resolution Action</Label>
                                    <Select value={resolutionAction} onValueChange={setResolutionAction}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select action" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="WARN">Warn User</SelectItem>
                                        <SelectItem value="SUSPEND">Suspend Account (30 days)</SelectItem>
                                        <SelectItem value="DISMISS">Dismiss (no action)</SelectItem>
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

                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setEditingReport(null);
                                        setResolutionAction('WARN');
                                        setResolutionNotes('');
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={handleResolveReport}
                                      disabled={resolveReportMutation.isPending || resolutionNotes.trim().length === 0}
                                    >
                                      {resolveReportMutation.isPending ? 'Resolving...' : 'Resolve Report'}
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
                      No reports found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserReportsTab;

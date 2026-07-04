import React, { useState, useMemo } from 'react';
import { 
  Star, 
  Calendar, 
  DollarSign, 
  UserCheck, 
  AlertTriangle, 
  Activity,
  Search,
  Users
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
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
import { Skeleton } from '@/shared/components/ui/skeleton';
import api from '@/lib/api';

interface PractitionerPerformance {
  id: string;
  name: string;
  email: string;
  totalConsultationsAllTime: number;
  totalConsultationsThisMonth: number;
  averageRating: number;
  totalReviews: number;
  responseRate: number;
  noShowRate: number;
  revenueGenerated: number;
  daysSinceLastLogin: number;
  daysSinceLastConsultation: number;
  status: 'Active' | 'Quiet' | 'Inactive' | 'At Risk';
  lastLoginAt?: Date;
  lastConsultationAt?: Date;
}

const PractitionerPerformanceTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const { data: practitioners = [], isLoading } = useQuery<PractitionerPerformance[]>({
    queryKey: ['practitioner-performance'],
    queryFn: async () => {
      const response = await api.get('/admin/practitioner-performance');
      return response.data;
    }
  });

  // Apply search, filter, and sorting
  const filteredPractitioners = useMemo(() => {
    let result = [...practitioners];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.email.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'rating':
          aValue = a.averageRating;
          bValue = b.averageRating;
          break;
        case 'revenue':
          aValue = a.revenueGenerated;
          bValue = b.revenueGenerated;
          break;
        case 'consultations':
          aValue = a.totalConsultationsThisMonth;
          bValue = b.totalConsultationsThisMonth;
          break;
        case 'activity':
          // Sort by last consultation date (more recent first)
          aValue = a.daysSinceLastConsultation;
          bValue = b.daysSinceLastConsultation;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      // Handle infinity values (never logged in or consulted)
      if (aValue === Infinity && bValue === Infinity) return 0;
      if (aValue === Infinity) return sortOrder === 'asc' ? 1 : -1;
      if (bValue === Infinity) return sortOrder === 'asc' ? -1 : 1;

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [practitioners, searchTerm, statusFilter, sortBy, sortOrder]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Quiet': return 'bg-yellow-100 text-yellow-800';
      case 'Inactive': return 'bg-red-100 text-red-800';
      case 'At Risk': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
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
          <Activity size={22} />
          Practitioner Performance Dashboard
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users size={16} />
              Total Practitioners
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{practitioners.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star size={16} />
              Avg Rating
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {practitioners.length > 0 
                ? (practitioners.reduce((sum, p) => sum + p.averageRating, 0) / practitioners.length).toFixed(1)
                : '0.0'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar size={16} />
              Consultations (This Month)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {practitioners.length > 0 
                ? practitioners.reduce((sum, p) => sum + p.totalConsultationsThisMonth, 0)
                : '0'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign size={16} />
              Revenue Generated
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              ₦{(practitioners.length > 0 
                ? practitioners.reduce((sum, p) => sum + p.revenueGenerated, 0)
                : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Practitioner List</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search practitioners..."
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
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Quiet">Quiet</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="At Risk">At Risk</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="consultations">Consultations</SelectItem>
                <SelectItem value="activity">Recent Activity</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>This Month</TableHead>
                  <TableHead>Response Rate</TableHead>
                  <TableHead>No-Show Rate</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Last Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  renderSkeletonRows()
                ) : filteredPractitioners.length > 0 ? (
                  filteredPractitioners.map((practitioner) => (
                    <TableRow key={practitioner.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-xs">
                              {practitioner.name.charAt(0)}
                            </span>
                          </div>
                          <span>{practitioner.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(practitioner.status)}>
                          {practitioner.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star size={14} className="fill-yellow-400 text-yellow-400" />
                          <span>{practitioner.averageRating.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground ml-1">
                            ({practitioner.totalReviews})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {practitioner.totalConsultationsThisMonth}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <UserCheck size={14} />
                          <span>{practitioner.responseRate.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <AlertTriangle size={14} className="text-red-500" />
                          <span>{practitioner.noShowRate.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        ₦{practitioner.revenueGenerated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">
                            Login: {practitioner.daysSinceLastLogin === Infinity 
                              ? 'Never' 
                              : `${practitioner.daysSinceLastLogin} days ago`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Consult: {practitioner.daysSinceLastConsultation === Infinity 
                              ? 'Never' 
                              : `${practitioner.daysSinceLastConsultation} days ago`}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No practitioners found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        <p>Data is updated in real-time. "At Risk" practitioners have ratings below 3.5 with more than 2 reviews.</p>
      </div>
    </div>
  );
};

export default PractitionerPerformanceTab;
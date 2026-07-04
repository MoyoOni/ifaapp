import React, { useState } from 'react';
import { 
  Shield, 
  Star, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Clock, 
  UserCheck, 
  AlertTriangle, 
  Activity,
  Search,
  Download,
  Filter,
  Eye,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  Users,
  Plus,
  Edit,
  BarChart3,
  Scale
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Skeleton } from '@/shared/components/ui/skeleton';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';

interface TrustScoreBreakdown {
  userId: string;
  name: string;
  currentTrustScore: number;
  isOverridden: boolean;
  overrideDetails: {
    score: number;
    reason: string | null;
    overriddenBy: string | null;
    overriddenAt: string | null;
  } | null;
  algorithmicScore: number;
  breakdown: {
    baseRating: number;
    reviewCountBonus: number;
    responseRateBonus: number;
    accountAgeBonus: number;
    manualAdjustments: number;
  };
}

interface TrustScoreAdjustment {
  id: string;
  name: string;
  email: string;
  trustScoreOverride: number;
  trustScoreOverrideReason: string | null;
  trustScoreOverrideBy: string | null;
  trustScoreOverrideAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const TrustScoreManagementTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'breakdown' | 'adjustments'>('breakdown');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [overrideScore, setOverrideScore] = useState<number | undefined>(undefined);
  const [overrideReason, setOverrideReason] = useState<string>('');
  
  const queryClient = useQueryClient();

  const { data: practitioners = [], isLoading } = useQuery<TrustScoreBreakdown[]>({
    queryKey: ['trust-score-breakdown-all'],
    queryFn: async () => {
      // We'll need to get all practitioners first, then fetch breakdown for each
      // For now, let's fetch from a hypothetical endpoint
      try {
        const response = await api.get('/admin/practitioners/for-featuring');
        const practitioners = response.data;
        
        // Fetch breakdown for each practitioner
        const breakdowns = await Promise.all(
          practitioners.map(async (p: any) => {
            try {
              const breakdownRes = await api.get(`/admin/users/${p.id}/trust-score-breakdown`);
              return breakdownRes.data;
            } catch (err) {
              // If there's an error getting breakdown, return basic info
              return {
                userId: p.id,
                name: p.name,
                currentTrustScore: p.averageRating || 0,
                isOverridden: false,
                overrideDetails: null,
                algorithmicScore: p.averageRating || 0,
                breakdown: {
                  baseRating: p.averageRating || 0,
                  reviewCountBonus: 0,
                  responseRateBonus: 0,
                  accountAgeBonus: 0,
                  manualAdjustments: 0
                }
              };
            }
          })
        );
        
        return breakdowns;
      } catch (err) {
        logger.error('Error fetching practitioners:', err);
        return [];
      }
    }
  });

  const { data: adjustments = [], isLoading: isLoadingAdjustments } = useQuery<TrustScoreAdjustment[]>({
    queryKey: ['trust-score-adjustments'],
    queryFn: async () => {
      const response = await api.get('/admin/trust-score-adjustments');
      return response.data;
    }
  });

  const updateTrustScoreMutation = useMutation({
    mutationFn: async ({ userId, score, reason }: { userId: string, score: number, reason: string }) => {
      const response = await api.patch(`/admin/users/${userId}/trust-score`, {
        trustScoreOverride: score,
        trustScoreOverrideReason: reason
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trust-score-breakdown-all'] });
      queryClient.invalidateQueries({ queryKey: ['trust-score-adjustments'] });
      setEditingUser(null);
      setOverrideScore(undefined);
      setOverrideReason('');
    }
  });

  // Apply search filter
  const filteredPractitioners = practitioners.filter(practitioner => 
    practitioner.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateTrustScore = () => {
    if (!editingUser || overrideScore === undefined) return;
    
    updateTrustScoreMutation.mutate({
      userId: editingUser.userId,
      score: overrideScore,
      reason: overrideReason
    });
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
          <Scale size={22} />
          Trust Score Management
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Shield size={16} />
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
              <Edit size={16} />
              Overridden Scores
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {practitioners.filter(p => p.isOverridden).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star size={16} />
              Avg Manual Score
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {practitioners.length > 0 
                ? (practitioners.reduce((sum, p) => sum + p.currentTrustScore, 0) / practitioners.length).toFixed(1)
                : '0.0'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 size={16} />
              Avg Algorithmic Score
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {practitioners.length > 0 
                ? (practitioners.reduce((sum, p) => sum + p.algorithmicScore, 0) / practitioners.length).toFixed(1)
                : '0.0'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Trust Score Management</CardTitle>
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
            
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'breakdown' | 'adjustments')}>
              <TabsList>
                <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
                <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'breakdown' ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Practitioner</TableHead>
                    <TableHead>Current Score</TableHead>
                    <TableHead>Algorithmic Score</TableHead>
                    <TableHead>Override Status</TableHead>
                    <TableHead>Base Rating</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    renderSkeletonRows()
                  ) : filteredPractitioners.length > 0 ? (
                    filteredPractitioners.map((practitioner) => (
                      <TableRow key={practitioner.userId}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-sm">
                                {practitioner.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{practitioner.name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Shield size={14} className={`${practitioner.isOverridden ? 'text-orange-500 fill-orange-200' : 'text-green-500 fill-green-200'}`} />
                            <span className={practitioner.isOverridden ? 'text-orange-600 font-medium' : 'text-green-600'}>
                              {practitioner.currentTrustScore.toFixed(1)}/10
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {practitioner.algorithmicScore.toFixed(1)}/10
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={practitioner.isOverridden ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}>
                            {practitioner.isOverridden ? 'Overridden' : 'Auto-calculated'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star size={14} className="fill-yellow-400 text-yellow-400" />
                            <span>{practitioner.breakdown.baseRating.toFixed(1)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Dialog 
                            open={editingUser?.userId === practitioner.userId} 
                            onOpenChange={(open) => setEditingUser(open ? practitioner : null)}
                          >
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                {practitioner.isOverridden ? 'Edit' : 'Override'}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  {practitioner.isOverridden ? 'Edit Trust Score Override' : 'Override Trust Score'}
                                </DialogTitle>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                    <span className="text-sm">{practitioner.name.charAt(0)}</span>
                                  </div>
                                  <div>
                                    <div className="font-medium">{practitioner.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      Current: {practitioner.currentTrustScore.toFixed(1)}, 
                                      Algorithmic: {practitioner.algorithmicScore.toFixed(1)}
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <Label htmlFor="score">Trust Score (0-10)</Label>
                                  <Input
                                    id="score"
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="0.1"
                                    value={overrideScore ?? practitioner.currentTrustScore}
                                    onChange={(e) => setOverrideScore(parseFloat(e.target.value))}
                                    placeholder="Enter trust score"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor="reason">Override Reason</Label>
                                  <Textarea
                                    id="reason"
                                    value={overrideReason || practitioner.overrideDetails?.reason || ''}
                                    onChange={(e) => setOverrideReason(e.target.value)}
                                    placeholder="Enter reason for manual override (community elder, known lineage, etc.)"
                                  />
                                </div>
                                
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    onClick={() => {
                                      // Reset to algorithmic score if removing override
                                      setEditingUser(null);
                                      setOverrideScore(undefined);
                                      setOverrideReason('');
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={handleUpdateTrustScore}
                                    disabled={updateTrustScoreMutation.isPending}
                                  >
                                    {updateTrustScoreMutation.isPending ? 'Saving...' : 'Save Override'}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No practitioners found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Practitioner</TableHead>
                    <TableHead>Override Score</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Modified By</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingAdjustments ? (
                    renderSkeletonRows()
                  ) : adjustments.length > 0 ? (
                    adjustments.map((adjustment) => (
                      <TableRow key={adjustment.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-xs">{adjustment.name.charAt(0)}</span>
                            </div>
                            <div>
                              <div className="font-medium">{adjustment.name}</div>
                              <div className="text-xs text-muted-foreground">{adjustment.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Shield size={14} className="text-orange-500 fill-orange-200" />
                            <span className="text-orange-600 font-medium">
                              {adjustment.trustScoreOverride?.toFixed(1)}/10
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate text-sm" title={adjustment.trustScoreOverrideReason || ''}>
                            {adjustment.trustScoreOverrideReason || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {adjustment.trustScoreOverrideBy || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {adjustment.trustScoreOverrideAt 
                            ? new Date(adjustment.trustScoreOverrideAt).toLocaleDateString() 
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No manual adjustments found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        <p>Manually adjust trust scores for practitioners when algorithmic scoring doesn't capture important factors.</p>
      </div>
    </div>
  );
};

export default TrustScoreManagementTab;
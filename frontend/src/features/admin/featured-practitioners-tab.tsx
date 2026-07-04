import React, { useState } from 'react';
import { 
  Star, 
  Search,
  CalendarDays,
  Users,
  Crown,
  Sparkles
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
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { DatePicker } from '@/shared/components/ui/date-picker';
import api from '@/lib/api';

interface Practitioner {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  averageRating: number;
  totalReviews: number;
  isFeatured: boolean;
  featuredOrder?: number;
  featuredExpiry?: string;
  createdAt: string;
  updatedAt: string;
}

const FeaturedPractitionersTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'featured' | 'not_featured'>('all');
  const [editingPractitioner, setEditingPractitioner] = useState<Practitioner | null>(null);
  const [newOrder, setNewOrder] = useState<number | undefined>(undefined);
  const [newExpiry, setNewExpiry] = useState<Date | undefined>(undefined);
  
  const queryClient = useQueryClient();

  const { data: practitioners = [], isLoading } = useQuery<Practitioner[]>({
    queryKey: ['practitioners-for-featuring'],
    queryFn: async () => {
      const response = await api.get('/admin/practitioners/for-featuring');
      return response.data;
    }
  });

  const { data: featuredPractitioners = [] } = useQuery<Practitioner[]>({
    queryKey: ['featured-practitioners'],
    queryFn: async () => {
      const response = await api.get('/admin/practitioners/featured');
      return response.data;
    }
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, isFeatured, featuredOrder, featuredExpiry }: { 
      id: string, 
      isFeatured: boolean, 
      featuredOrder?: number, 
      featuredExpiry?: Date 
    }) => {
      const response = await api.patch(`/admin/practitioners/${id}/featured`, {
        userId: id,
        isFeatured,
        featuredOrder,
        featuredExpiry
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practitioners-for-featuring'] });
      queryClient.invalidateQueries({ queryKey: ['featured-practitioners'] });
    }
  });

  // Apply search and filter
  const filteredPractitioners = practitioners.filter(practitioner => {
    const matchesSearch = practitioner.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          practitioner.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'featured') return practitioner.isFeatured;
    if (filter === 'not_featured') return !practitioner.isFeatured;
    return matchesSearch;
  });

  const handleToggleFeatured = (practitioner: Practitioner) => {
    const isFeatured = !practitioner.isFeatured;
    const featuredOrder = isFeatured ? (newOrder || practitioner.featuredOrder || 1) : null;
    
    toggleFeaturedMutation.mutate({
      id: practitioner.id,
      isFeatured,
      featuredOrder: featuredOrder as number,
      featuredExpiry: newExpiry
    });
    
    // Reset form
    setNewOrder(undefined);
    setNewExpiry(undefined);
    setEditingPractitioner(null);
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
        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Crown size={22} />
          Featured Practitioners Management
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
              <Sparkles size={16} />
              Featured
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{featuredPractitioners.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star size={16} />
              Avg Rating (Featured)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {featuredPractitioners.length > 0 
                ? (featuredPractitioners.reduce((sum, p) => sum + p.averageRating, 0) / featuredPractitioners.length).toFixed(1)
                : '0.0'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CalendarDays size={16} />
              Avg Reviews (Featured)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {featuredPractitioners.length > 0 
                ? Math.round(featuredPractitioners.reduce((sum, p) => sum + p.totalReviews, 0) / featuredPractitioners.length)
                : '0'}
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
            <Select 
              value={filter} 
              onValueChange={(v) => setFilter(v as 'all' | 'featured' | 'not_featured')}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="not_featured">Not Featured</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Practitioner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Reviews</TableHead>
                  <TableHead>Featured Order</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  renderSkeletonRows()
                ) : filteredPractitioners.length > 0 ? (
                  filteredPractitioners.map((practitioner) => (
                    <TableRow key={practitioner.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-sm">
                              {practitioner.avatar ? (
                                <img src={practitioner.avatar} alt={practitioner.name} className="w-full h-full rounded-full" />
                              ) : (
                                practitioner.name.charAt(0).toUpperCase()
                              )}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{practitioner.name}</div>
                            <div className="text-xs text-muted-foreground">{practitioner.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={practitioner.isFeatured ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {practitioner.isFeatured ? 'Featured' : 'Not Featured'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star size={14} className="fill-yellow-400 text-yellow-400" />
                          <span>{practitioner.averageRating.toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users size={14} />
                          <span>{practitioner.totalReviews}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {practitioner.featuredOrder ? (
                          <Badge variant="secondary">#{practitioner.featuredOrder}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {practitioner.featuredExpiry ? (
                          <span className="text-sm">
                            {new Date(practitioner.featuredExpiry).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Dialog 
                          open={editingPractitioner?.id === practitioner.id} 
                          onOpenChange={(open) => setEditingPractitioner(open ? practitioner : null)}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              {practitioner.isFeatured ? 'Edit' : 'Feature'}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                {practitioner.isFeatured ? 'Edit Featured Status' : 'Feature Practitioner'}
                              </DialogTitle>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="featured-toggle">Featured Status</Label>
                                <Switch
                                  id="featured-toggle"
                                  checked={practitioner.isFeatured}
                                  onCheckedChange={() => handleToggleFeatured(practitioner)}
                                />
                              </div>
                              
                              {practitioner.isFeatured && (
                                <>
                                  <div>
                                    <Label htmlFor="featured-order">Featured Order</Label>
                                    <Input
                                      id="featured-order"
                                      type="number"
                                      min="1"
                                      value={newOrder ?? practitioner.featuredOrder ?? ''}
                                      onChange={(e) => setNewOrder(Number(e.target.value))}
                                      placeholder="Enter order position"
                                    />
                                  </div>
                                  
                                  <div>
                                    <Label htmlFor="expiry-date">Expiry Date</Label>
                                    <DatePicker
                                      value={newExpiry ? new Date(newExpiry) : practitioner.featuredExpiry ? new Date(practitioner.featuredExpiry) : undefined}
                                      onChange={setNewExpiry}
                                      placeholder="Select expiry date"
                                    />
                                  </div>
                                  
                                  <div className="flex gap-2 pt-2">
                                    <Button 
                                      variant="outline" 
                                      onClick={() => {
                                        toggleFeaturedMutation.mutate({
                                          id: practitioner.id,
                                          isFeatured: false,
                                          featuredOrder: undefined,
                                          featuredExpiry: undefined
                                        });
                                        setEditingPractitioner(null);
                                      }}
                                    >
                                      Remove Feature
                                    </Button>
                                    <Button 
                                      onClick={() => handleToggleFeatured(practitioner)}
                                      disabled={toggleFeaturedMutation.isPending}
                                    >
                                      {toggleFeaturedMutation.isPending ? 'Saving...' : 'Update'}
                                    </Button>
                                  </div>
                                </>
                              )}
                              
                              {!practitioner.isFeatured && (
                                <>
                                  <div>
                                    <Label htmlFor="featured-order">Featured Order</Label>
                                    <Input
                                      id="featured-order"
                                      type="number"
                                      min="1"
                                      value={newOrder || 1}
                                      onChange={(e) => setNewOrder(Number(e.target.value))}
                                      placeholder="Enter order position"
                                    />
                                  </div>
                                  
                                  <div>
                                    <Label htmlFor="expiry-date">Expiry Date</Label>
                                    <DatePicker
                                      value={newExpiry ? new Date(newExpiry) : undefined}
                                      onChange={setNewExpiry}
                                      placeholder="Select expiry date"
                                    />
                                  </div>
                                  
                                  <Button 
                                    onClick={() => handleToggleFeatured(practitioner)}
                                    disabled={toggleFeaturedMutation.isPending}
                                  >
                                    {toggleFeaturedMutation.isPending ? 'Saving...' : 'Feature Practitioner'}
                                  </Button>
                                </>
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
        <p>Featured practitioners appear at the top of the discovery page with a ★ badge.</p>
      </div>
    </div>
  );
};

export default FeaturedPractitionersTab;
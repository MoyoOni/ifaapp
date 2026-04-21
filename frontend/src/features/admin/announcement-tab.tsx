import React, { useState } from 'react';
import { 
  Megaphone, 
  Mail, 
  Bell, 
  Calendar, 
  Send,
  Clock,
  User,
  Users,
  Globe,
  ShoppingCart,
  Star,
  CheckCircle,
  AlertTriangle,
  Info,
  Loader2,
  Plus,
  Edit3,
  Trash2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from '@/shared/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/shared/components/ui/dialog';
import { Switch } from '@/shared/components/ui/switch';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'BANNER' | 'IN_APP_NOTIFICATION' | 'EMAIL_BROADCAST';
  target: 'ALL_USERS' | 'CLIENTS' | 'BABALAWOS' | 'VENDORS' | 'DEVOTED_SUBSCRIBERS' | 'SPECIFIC_USERS';
  userIds?: string[];
  link?: string;
  isDismissible: boolean;
  scheduledAt?: Date;
  expiresAt?: Date;
  sendEmail: boolean;
  subject?: string;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  creator: {
    id: string;
    name: string;
  };
}

const AnnouncementTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    type: 'IN_APP_NOTIFICATION' as 'BANNER' | 'IN_APP_NOTIFICATION' | 'EMAIL_BROADCAST',
    target: 'ALL_USERS' as 'ALL_USERS' | 'CLIENTS' | 'BABALAWOS' | 'VENDORS' | 'DEVOTED_SUBSCRIBERS' | 'SPECIFIC_USERS',
    userIds: [] as string[],
    link: '',
    isDismissible: true,
    scheduledAt: '',
    expiresAt: '',
    sendEmail: false,
    subject: '',
  });
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  
  const toast = useToast();
  const qc = useQueryClient();

  // Fetch announcements
  const { data: announcements = [], isLoading: announcementsLoading, refetch } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const response = await api.get('/admin/announcements');
      return response.data as Announcement[];
    }
  });

  const { mutateAsync: createAnnouncement, isPending: creatingAnnouncement } = useMutation({
    mutationFn: async (data: typeof newAnnouncement) => {
      const response = await api.post('/admin/announcements', {
        ...data,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Announcement created successfully');
      setNewAnnouncement({
        title: '',
        content: '',
        type: 'IN_APP_NOTIFICATION',
        target: 'ALL_USERS',
        userIds: [],
        link: '',
        isDismissible: true,
        scheduledAt: '',
        expiresAt: '',
        sendEmail: false,
        subject: '',
      });
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create announcement');
    }
  });

  const handleCreateAnnouncement = () => {
    createAnnouncement(newAnnouncement);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'BANNER': return <Megaphone size={16} />;
      case 'IN_APP_NOTIFICATION': return <Bell size={16} />;
      case 'EMAIL_BROADCAST': return <Mail size={16} />;
      default: return <Info size={16} />;
    }
  };

  const getTargetIcon = (target: string) => {
    switch (target) {
      case 'ALL_USERS': return <Globe size={16} />;
      case 'CLIENTS': return <User size={16} />;
      case 'BABALAWOS': return <Star size={16} />;
      case 'VENDORS': return <ShoppingCart size={16} />;
      case 'DEVOTED_SUBSCRIBERS': return <CheckCircle size={16} />;
      case 'SPECIFIC_USERS': return <Users size={16} />;
      default: return <User size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Megaphone size={22} />
          Platform Announcements
        </h2>
        
        <div className="flex gap-2">
          <Button 
            variant={activeTab === 'compose' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('compose')}
          >
            <Plus size={16} className="mr-2" />
            Compose
          </Button>
          <Button 
            variant={activeTab === 'history' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('history')}
          >
            <Clock size={16} className="mr-2" />
            History
          </Button>
        </div>
      </div>

      {activeTab === 'compose' && (
        <div className="bg-card p-6 rounded-xl border border-border">
          <h3 className="text-lg font-semibold mb-4">Create New Announcement</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  placeholder="Enter announcement title"
                />
              </div>
              
              <div>
                <Label>Content *</Label>
                <Textarea
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                  placeholder="Enter announcement content"
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type *</Label>
                  <Select 
                    value={newAnnouncement.type}
                    onValueChange={(value) => setNewAnnouncement({
                      ...newAnnouncement, 
                      type: value as any
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BANNER">Banner</SelectItem>
                      <SelectItem value="IN_APP_NOTIFICATION">In-App Notification</SelectItem>
                      <SelectItem value="EMAIL_BROADCAST">Email Broadcast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Target *</Label>
                  <Select 
                    value={newAnnouncement.target}
                    onValueChange={(value) => setNewAnnouncement({
                      ...newAnnouncement, 
                      target: value as any
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL_USERS">All Users</SelectItem>
                      <SelectItem value="CLIENTS">Clients</SelectItem>
                      <SelectItem value="BABALAWOS">Babalawos</SelectItem>
                      <SelectItem value="VENDORS">Vendors</SelectItem>
                      <SelectItem value="DEVOTED_SUBSCRIBERS">Devoted Subscribers</SelectItem>
                      <SelectItem value="SPECIFIC_USERS">Specific Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {(newAnnouncement.target === 'SPECIFIC_USERS' || newAnnouncement.type === 'EMAIL_BROADCAST') && (
                <div>
                  <Label>User IDs (comma-separated)</Label>
                  <Textarea
                    value={newAnnouncement.userIds.join(', ')}
                    onChange={(e) => setNewAnnouncement({
                      ...newAnnouncement, 
                      userIds: e.target.value.split(',').map(id => id.trim()).filter(id => id)
                    })}
                    placeholder="Enter user IDs separated by commas"
                    rows={2}
                  />
                </div>
              )}
              
              <div>
                <Label>Link (optional)</Label>
                <Input
                  value={newAnnouncement.link}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, link: e.target.value})}
                  placeholder="https://..."
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Schedule Delivery (optional)</Label>
                <Input
                  type="datetime-local"
                  value={newAnnouncement.scheduledAt}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, scheduledAt: e.target.value})}
                />
              </div>
              
              <div>
                <Label>Expiration Date (optional)</Label>
                <Input
                  type="datetime-local"
                  value={newAnnouncement.expiresAt}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, expiresAt: e.target.value})}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label>Send via Email</Label>
                  <p className="text-xs text-muted-foreground">Also send as email to targeted users</p>
                </div>
                <Switch
                  checked={newAnnouncement.sendEmail}
                  onCheckedChange={(checked) => setNewAnnouncement({...newAnnouncement, sendEmail: checked})}
                />
              </div>
              
              {newAnnouncement.sendEmail && (
                <div>
                  <Label>Email Subject *</Label>
                  <Input
                    value={newAnnouncement.subject}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, subject: e.target.value})}
                    placeholder="Email subject line"
                  />
                </div>
              )}
              
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label>Dismissible</Label>
                  <p className="text-xs text-muted-foreground">Can users dismiss this announcement?</p>
                </div>
                <Switch
                  checked={newAnnouncement.isDismissible}
                  onCheckedChange={(checked) => setNewAnnouncement({...newAnnouncement, isDismissible: checked})}
                />
              </div>
              
              <div className="pt-4">
                <Button 
                  className="w-full" 
                  onClick={handleCreateAnnouncement}
                  disabled={creatingAnnouncement || !newAnnouncement.title || !newAnnouncement.content}
                >
                  {creatingAnnouncement ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={16} className="mr-2" />
                      Send Announcement
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-card p-6 rounded-xl border border-border">
          <h3 className="text-lg font-semibold mb-4">Announcement History</h3>
          
          {announcementsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No announcements found. Create your first announcement.
                </div>
              ) : (
                announcements.map(announcement => (
                  <Card key={announcement.id} className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {getTypeIcon(announcement.type)} {announcement.title}
                          </CardTitle>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              {getTargetIcon(announcement.target)} {announcement.target.replace('_', ' ')}
                            </span>
                            <span>Sent by: {announcement.creator.name}</span>
                            <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <Badge variant={announcement.sentAt ? "default" : "secondary"}>
                          {announcement.sentAt ? 'Sent' : 'Scheduled'}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-foreground mb-3">{announcement.content}</p>
                      
                      <div className="flex flex-wrap gap-2">
                        {announcement.link && (
                          <Badge variant="outline" className="text-xs">
                            Link: {announcement.link}
                          </Badge>
                        )}
                        
                        {announcement.scheduledAt && (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <Clock size={12} />
                            Scheduled: {new Date(announcement.scheduledAt).toLocaleString()}
                          </Badge>
                        )}
                        
                        {announcement.expiresAt && (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <AlertTriangle size={12} />
                            Expires: {new Date(announcement.expiresAt).toLocaleString()}
                          </Badge>
                        )}
                        
                        {announcement.sendEmail && (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <Mail size={12} />
                            Sent via Email
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Announcement Preview</DialogTitle>
          </DialogHeader>
          
          {previewData && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold">{previewData.title}</h4>
                <p className="mt-2">{previewData.content}</p>
                {previewData.link && (
                  <a 
                    href={previewData.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm mt-2 inline-block"
                  >
                    Learn more
                  </a>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowPreview(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnnouncementTab;
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Badge } from '../../shared/components/ui/badge';
import { Button } from '../../shared/components/ui/button';
import { Download, Calendar, Clock, User, NotebookPen } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';

interface Appointment {
  id: string;
  babalawo: { id: string; name: string; yorubaName?: string; avatar?: string };
  date: string;
  time: string;
  duration: number;
  topic: string;
  preferredMethod: 'PHONE' | 'VIDEO' | 'IN_PERSON';
  price?: number;
  status: string;
  createdAt: string;
  guidancePlan?: { id: string };
}

const SessionHistoryWithReceipts: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    api.get<Appointment[]>(`/appointments/client/${user.id}/history`)
      .then(res => setAppointments(res.data))
      .catch(() => setError('Failed to load session history'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const downloadReceipt = (appointmentId: string) => {
    window.open(`/api/appointments/${appointmentId}/receipt`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="bg-destructive/10 border border-destructive/20">
          <CardContent className="py-6 text-center"><p className="text-destructive">{error}</p></CardContent>
        </Card>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader><CardTitle>Session History</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              You don't have any completed sessions yet. Your session history will appear here after your consultations are completed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Session History <Badge variant="secondary">{appointments.length} sessions</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="border rounded-lg p-4 hover:bg-accent/5 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{appointment.topic || 'Spiritual Consultation'}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><User className="w-4 h-4" />{appointment.babalawo.name}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(appointment.date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{appointment.time}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="outline">{appointment.preferredMethod}</Badge>
                      <Badge variant="outline">{appointment.duration} mins</Badge>
                      {appointment.guidancePlan && (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300">Guidance Plan</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="font-bold text-primary">₦{appointment.price ? Number(appointment.price).toLocaleString() : '0'}</p>
                    <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => downloadReceipt(appointment.id)}>
                      <Download className="w-4 h-4" /> Receipt
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.open(`/appointments/${appointment.id}/notes`, '_blank')} className="flex items-center gap-1 text-xs">
                      <NotebookPen size={12} /> My Notes
                    </Button>
                  </div>
                </div>
                <div className="my-4 border-t" />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="font-medium">Session Details</p><p className="text-muted-foreground mt-1">Completed</p></div>
                  <div className="text-right"><p className="font-medium">Transaction ID</p><p className="text-muted-foreground mt-1">{appointment.id.substring(0, 8).toUpperCase()}</p></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionHistoryWithReceipts;

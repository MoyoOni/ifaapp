import React from 'react';
import { Calendar, Clock, MapPin, MoreVertical } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

interface Session {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  practitioner: string;
  type: 'in-person' | 'virtual';
}

interface UpcomingSessionsProps {
  sessions: Session[];
}

const UpcomingSessions: React.FC<UpcomingSessionsProps> = ({ sessions }) => {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-foreground">Upcoming Sessions</h2>
        <button className="text-sm text-primary hover:underline">View all</button>
      </div>
      
      <div className="space-y-4">
        {sessions.length > 0 ? (
          sessions.map(session => (
            <div key={session.id} className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
              <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground">{session.title}</h3>
                <p className="text-sm text-muted-foreground">{session.practitioner}</p>
                
                <div className="flex flex-wrap gap-4 mt-2 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{session.time}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{session.location}</span>
                  </div>
                  
                  <div className={`px-2 py-0.5 rounded text-xs ${
                    session.type === 'virtual' 
                      ? 'bg-success/10 text-success' 
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {session.type === 'virtual' ? 'Virtual' : 'In-Person'}
                  </div>
                </div>
              </div>
              
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p>No upcoming sessions</p>
            <p className="text-sm mt-1">Schedule your next session</p>
            <Button className="mt-3">Book a Session</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export { UpcomingSessions };
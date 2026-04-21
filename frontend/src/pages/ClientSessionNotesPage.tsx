import React from 'react';
import { useParams } from 'react-router-dom';
import ClientSessionNotes from '../features/appointments/client-session-notes';

const ClientSessionNotesPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();

  if (!appointmentId) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-destructive">Invalid appointment ID</h1>
          <p className="text-muted-foreground mt-2">Please select a valid appointment to manage notes.</p>
        </div>
      </div>
    );
  }

  // We'll use a mock client ID here - in a real implementation, this would come from the auth context
  // or be derived from the appointment details
  const clientId = 'current_user_id'; // This would be replaced with actual current user ID

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Session Notes</h1>
        <ClientSessionNotes appointmentId={appointmentId} clientId={clientId} />
      </div>
    </div>
  );
};

export default ClientSessionNotesPage;
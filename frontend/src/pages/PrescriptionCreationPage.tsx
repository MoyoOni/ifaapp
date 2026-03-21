import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import PrescriptionCreationForm from '@/features/prescriptions/prescription-creation-form';

const PrescriptionCreationPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const resolvedAppointmentId = appointmentId || searchParams.get('appointmentId') || '';

  if (!resolvedAppointmentId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 my-4 text-sm text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg" role="alert">
          Missing appointment ID.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PrescriptionCreationForm
        appointmentId={resolvedAppointmentId}
        onSuccess={() => navigate('/prescription-history')}
        onCancel={() => navigate(-1)}
      />
    </div>
  );
};

export default PrescriptionCreationPage;
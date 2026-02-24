import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { getDemoAppointmentById, getDemoUserById, type DemoUser } from '@/demo';

interface Appointment {
  id: string;
  confirmationCode: string;
  babalawo: {
    name: string;
    avatar: string;
    specialty: string;
  };
  date: string;
  time: string;
  duration: number;
  topic: string;
  preferredMethod: string;
  price: number;
}

export const BookingConfirmation: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!appointmentId) {
      setError('Missing appointment ID.');
      setLoading(false);
      return;
    }

    const fetchAppointment = async () => {
      try {
        const cached = sessionStorage.getItem(`demo-appointment:${appointmentId}`);
        if (cached) {
          setAppointment(JSON.parse(cached));
          setLoading(false);
          return;
        }

        const response = await api.get(`/appointments/${appointmentId}`);
        const data = response.data;
        setAppointment(data);
      } catch (err) {
        const demoAppointment = getDemoAppointmentById(appointmentId);
        if (demoAppointment) {
          const demoBaba = getDemoUserById(demoAppointment.babalawoId) as DemoUser | null;
          setAppointment({
            id: demoAppointment.id,
            confirmationCode: `CONF-${demoAppointment.id.slice(-4).toUpperCase()}`,
            babalawo: {
              name: demoBaba?.name || 'Babalawo',
              avatar: demoBaba?.avatar || '',
              specialty: demoBaba?.specialization?.[0] || 'Ifa Divination',
            },
            date: demoAppointment.date,
            time: demoAppointment.time,
            duration: demoAppointment.duration,
            topic: demoAppointment.notes || 'Consultation',
            preferredMethod: demoAppointment.preferredMethod,
            price: 0,
          });
        } else {
          setError('Appointment not found.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [appointmentId]);

  const copyCode = () => {
    if (appointment?.confirmationCode) {
      navigator.clipboard.writeText(appointment.confirmationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-4">
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">{error}</div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/client/consultations')} className="px-4 py-2 font-semibold text-white bg-primary rounded-lg hover:bg-primary/90">View My Consultations</button>
          <button onClick={() => navigate('/babalawo')} className="px-4 py-2 font-semibold text-stone-700 bg-stone-200 rounded-lg hover:bg-stone-300">Find a Babalawo</button>
        </div>
      </div>
    );
  }
  if (!appointment) return <div>No appointment details found.</div>;

  return (
    <div className="confirmation-page space-y-6">
      <div className="p-4 my-4 text-sm text-green-700 bg-green-100 rounded-lg" role="alert">
        ✓ Consultation Booked Successfully!
      </div>

      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold">Confirmation Code</h3>
        <div className="flex items-center space-x-4">
          <code className="text-lg font-bold">{appointment.confirmationCode}</code>
          <button onClick={copyCode} className="px-3 py-1 text-sm font-semibold text-white bg-gray-500 rounded-lg hover:bg-gray-700">
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold">Consultation Details</h3>
        <div className="flex items-center space-x-4">
          <img src={appointment.babalawo.avatar} alt={appointment.babalawo.name} className="w-16 h-16 rounded-full" />
          <div>
            <p className="font-bold">{appointment.babalawo.name}</p>
            <p className="text-sm text-gray-500">{appointment.babalawo.specialty}</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div><span>Date & Time:</span> <span>{new Date(`${appointment.date}T${appointment.time}`).toLocaleString()}</span></div>
          <div><span>Duration:</span> <span>{appointment.duration} minutes</span></div>
          <div><span>Topic:</span> <span>{appointment.topic}</span></div>
          <div><span>Contact Method:</span> <span>{appointment.preferredMethod}</span></div>
        </div>
      </div>

      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold">Cost Breakdown</h3>
        <div><span>Consultation Fee:</span> <span>₦{Number(appointment.price || 0).toLocaleString()}</span></div>
        <div><span>Escrow Held:</span> <span>₦{Number(appointment.price || 0).toLocaleString()}</span></div>
        <p className="text-sm text-gray-500">Payment will be released to the babalawo after the consultation is completed.</p>
      </div>
      
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold">What Happens Next</h3>
        <ol className="list-decimal list-inside">
            <li>{appointment.babalawo.name} will confirm within 24 hours</li>
            <li>You'll receive a confirmation notification</li>
            <li>Join the consultation via your preferred contact method</li>
            <li>Receive your guidance plan after the consultation</li>
            <li>Payment is released when consultation is marked complete</li>
        </ol>
      </div>

      <div className="flex space-x-4">
        <button onClick={() => navigate('/client/consultations')} className="px-4 py-2 font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-700">View My Consultations</button>
        <button onClick={() => navigate('/babalawo')} className="px-4 py-2 font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Schedule Another</button>
      </div>
    </div>
  );
};

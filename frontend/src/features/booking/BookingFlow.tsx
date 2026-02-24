import { useState } from 'react';
import BookingForm from './BookingForm';
import BookingConfirmation from './BookingConfirmation';
import api from '@/lib/api';

const BookingFlow = () => {
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBookingSubmit = async (details: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/appointments', details);
      setBookingDetails(response.data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">An error occurred: {error}</p>}
      {!bookingDetails && !loading && (
        <BookingForm onSubmit={handleBookingSubmit} />
      )}
      {bookingDetails && (
        <BookingConfirmation bookingDetails={bookingDetails} />
      )}
    </div>
  );
};

export default BookingFlow;

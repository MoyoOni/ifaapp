import React from 'react';

interface BookingConfirmationProps {
  bookingDetails: {
    topic: string;
    date: string;
    time: string;
    preferredMethod: string;
    paymentMethod: string;
  };
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({ bookingDetails }) => {
  return (
    <div className="p-8 max-w-md mx-auto bg-white rounded-lg shadow-md text-center">
      <h2 className="text-2xl font-bold mb-6 text-green-600">Booking Confirmed!</h2>
      <p className="mb-4">Your consultation has been successfully booked.</p>
      <div className="text-left bg-gray-100 p-4 rounded-lg">
        <p className="mb-2"><span className="font-semibold">Topic:</span> {bookingDetails.topic}</p>
        <p className="mb-2"><span className="font-semibold">Date:</span> {bookingDetails.date}</p>
        <p className="mb-2"><span className="font-semibold">Time:</span> {bookingDetails.time}</p>
        <p className="mb-2"><span className="font-semibold">Method:</span> {bookingDetails.preferredMethod}</p>
        <p><span className="font-semibold">Payment:</span> {bookingDetails.paymentMethod}</p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
      >
        Book Another Consultation
      </button>
    </div>
  );
};

export default BookingConfirmation;

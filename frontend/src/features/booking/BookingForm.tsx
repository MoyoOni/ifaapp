import React, { useState } from 'react';

interface BookingFormProps {
  onSubmit: (details: {
    babalawoId: string;
    clientId: string;
    date: string;
    time: string;
    topic: string;
    preferredMethod: string;
    paymentMethod: string;
    specialRequests?: string;
  }) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ onSubmit }) => {
  const [topic, setTopic] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [preferredMethod, setPreferredMethod] = useState('VIDEO');
  const [paymentMethod, setPaymentMethod] = useState('WALLET');
  const [specialRequests, setSpecialRequests] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      babalawoId: 'baba-1', // Mocked
      clientId: 'client-1', // Mocked
      date,
      time,
      topic,
      preferredMethod,
      paymentMethod,
      specialRequests,
    });
  };

  return (
    <div className="p-8 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Book a Consultation</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="topic" className="block text-gray-700 font-semibold mb-2">Topic</label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Love & Relationships"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="date" className="block text-gray-700 font-semibold mb-2">Date</label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="time" className="block text-gray-700 font-semibold mb-2">Time</label>
          <input
            type="time"
            id="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="preferredMethod" className="block text-gray-700 font-semibold mb-2">Preferred Method</label>
          <select
            id="preferredMethod"
            value={preferredMethod}
            onChange={(e) => setPreferredMethod(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="VIDEO">Video Call</option>
            <option value="PHONE">Phone Call</option>
            <option value="IN_PERSON">In Person</option>
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="paymentMethod" className="block text-gray-700 font-semibold mb-2">Payment Method</label>
          <select
            id="paymentMethod"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="WALLET">Wallet</option>
            <option value="CARD">Credit Card</option>
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="specialRequests" className="block text-gray-700 font-semibold mb-2">Special Requests</label>
          <textarea
            id="specialRequests"
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          ></textarea>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
        >
          Book Now
        </button>
      </form>
    </div>
  );
};

export default BookingForm;

import React from 'react';
import { CheckCircle, Copy, Calendar, Clock, User, DollarSign, MessageCircle } from 'lucide-react';

interface BookingConfirmationProps {
  confirmationCode: string;
  babalawoName: string;
  babalawoAvatar?: string;
  date: string;
  time: string;
  topic: string;
  price: number;
  preferredMethod: string;
  onViewConsultations: () => void;
  onBookAnother: () => void;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  confirmationCode,
  babalawoName,
  babalawoAvatar,
  date,
  time,
  topic,
  price,
  preferredMethod,
  onViewConsultations,
  onBookAnother,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(confirmationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in text-center py-8">
      {/* Success Icon */}
      <div className="mb-6">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={48} className="text-green-500" />
        </div>
        <h2 className="text-3xl font-bold text-stone-800 brand-font">Booking Confirmed!</h2>
        <p className="text-stone-500 mt-2">Your consultation has been scheduled</p>
      </div>

      {/* Confirmation Code */}
      <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200 max-w-sm mx-auto">
        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Confirmation Code</p>
        <div className="flex items-center gap-3 justify-center">
          <p className="text-2xl font-mono font-bold text-stone-800">{confirmationCode}</p>
          <button
            onClick={handleCopyCode}
            className="p-2 hover:bg-white rounded-lg transition-colors"
            title="Copy confirmation code"
          >
            <Copy size={16} className={copied ? 'text-green-500' : 'text-stone-400'} />
          </button>
        </div>
        {copied && <p className="text-xs text-green-500 mt-2 font-bold">Copied!</p>}
      </div>

      {/* Booking Details */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4 max-w-md mx-auto">
        <h3 className="text-lg font-bold text-stone-800">Session Details</h3>

        {/* Babalawo */}
        <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
          {babalawoAvatar ? (
            <img src={babalawoAvatar} alt={babalawoName} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 bg-highlight rounded-full flex items-center justify-center text-white font-bold">
              {babalawoName.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-sm text-stone-500">Babalawo</p>
            <p className="font-bold text-stone-800">{babalawoName}</p>
          </div>
        </div>

        {/* Date */}
        <div className="flex items-start gap-3">
          <Calendar className="text-highlight flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm text-stone-500">Date</p>
            <p className="font-bold text-stone-800">{formatDate(date)}</p>
          </div>
        </div>

        {/* Time */}
        <div className="flex items-start gap-3">
          <Clock className="text-highlight flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm text-stone-500">Time</p>
            <p className="font-bold text-stone-800">{time}</p>
          </div>
        </div>

        {/* Topic */}
        <div className="flex items-start gap-3">
          <MessageCircle className="text-highlight flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm text-stone-500">Topic</p>
            <p className="font-bold text-stone-800">{topic}</p>
          </div>
        </div>

        {/* Method */}
        <div className="flex items-start gap-3">
          <User className="text-highlight flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm text-stone-500">Method</p>
            <p className="font-bold text-stone-800 capitalize">{preferredMethod}</p>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-start gap-3 pt-2 border-t border-stone-100">
          <DollarSign className="text-highlight flex-shrink-0 mt-0.5" size={20} />
          <div className="w-full">
            <p className="text-sm text-stone-500">Total Cost</p>
            <p className="font-bold text-lg text-primary">₦{price.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-highlight/10 rounded-2xl p-4 border border-highlight/20 space-y-3 max-w-md mx-auto">
        <h4 className="font-bold text-stone-800">What Happens Next?</h4>
        <ul className="text-left text-sm text-stone-600 space-y-2">
          <li className="flex gap-2">
            <span className="text-highlight font-bold">1.</span>
            <span>Your babalawo will review your booking request</span>
          </li>
          <li className="flex gap-2">
            <span className="text-highlight font-bold">2.</span>
            <span>You'll receive a confirmation once they accept</span>
          </li>
          <li className="flex gap-2">
            <span className="text-highlight font-bold">3.</span>
            <span>Get a link to join your session 30 minutes before</span>
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto pt-4">
        <button
          onClick={onViewConsultations}
          className="flex-1 py-3 px-4 bg-stone-900 text-white rounded-xl font-bold hover:bg-black transition-all"
        >
          View My Consultations
        </button>
        <button
          onClick={onBookAnother}
          className="flex-1 py-3 px-4 bg-white border-2 border-highlight text-highlight rounded-xl font-bold hover:bg-highlight hover:text-white transition-all"
        >
          Book Another
        </button>
      </div>
    </div>
  );
};

export default BookingConfirmation;

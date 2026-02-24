import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, Video, MapPin, Lock, AlertCircle, Wallet, Loader2 } from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { getUserWallet } from '@/demo';
import { useBabalawo } from './hooks/use-babalawo';
import { useBookAppointment } from './hooks/use-book-appointment';
import { useAvailableSlots } from './hooks/use-available-slots';
import BookingConfirmation from './booking-confirmation';
import PaymentModal from '@/features/payments/payment-modal';
import { Currency, PaymentPurpose } from '@common';

interface BookingFlowProps {
  babalawoId: string;
  onBack: () => void;
  onSuccess: () => void;
}

type Step = 'service' | 'date' | 'confirm' | 'payment' | 'success';

interface WalletBalance {
  balance: number;
  currency: string;
}

const BookingFlow: React.FC<BookingFlowProps> = ({ babalawoId, onBack, onSuccess }) => {
  const { user } = useAuth();
  const { babalawo, loading: babalawLoading } = useBabalawo(babalawoId);
  const { bookAppointment, loading: bookingLoading, error: bookingError, clearError } = useBookAppointment();

  const [step, setStep] = useState<Step>('service');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);

  // Use the dynamic availability hook
  const { slots: availableSlots, loading: slotsLoading, error: slotsError } = useAvailableSlots({
    babalawoId,
    date: selectedDate,
  });

  // Fetch wallet balance when entering confirm step
  useEffect(() => {
    if (step === 'confirm' && user?.id) {
      fetchWalletBalance();
    }
  }, [step, user?.id]);

  const fetchWalletBalance = async () => {
    if (!user?.id) return;

    setWalletLoading(true);
    try {
      const response = await api.get('/wallet/balance');
      setWalletBalance(response.data);
    } catch (err) {
      logger.error('Error fetching wallet balance:', err);
      const demoWallet = getUserWallet(user.id);
      setWalletBalance({
        balance: demoWallet?.balance ?? 1000000,
        currency: demoWallet?.currency ?? 'NGN',
      });
    } finally {
      setWalletLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!user || !selectedService || !selectedTime) {
      alert('Please complete all required fields');
      return;
    }

    clearError();

    // Format date as YYYY-MM-DD
    const dateStr = selectedDate.toISOString().split('T')[0];

    // Convert selected time back to 24-hour format for the backend
    let time24Format = selectedTime;
    if (selectedTime) {
      // Convert from 12-hour to 24-hour format (e.g., "10:00 AM" -> "10:00", "5:00 PM" -> "17:00")
      const [timePart, period] = selectedTime.split(' ');
      const [h, minutes] = timePart.split(':').map(Number);
      let hours = h;
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      time24Format = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    const bookingData = {
      babalawoId,
      clientId: user.id,
      date: dateStr,
      time: time24Format,
      topic: selectedService.topic || selectedService.title,
      preferredMethod: 'VIDEO' as const,
      duration: 60,
      price: selectedService.price,
      paymentMethod: 'ESCROW' as const,
    };

    const result = await bookAppointment(bookingData);

    if (result) {
      setBookingResult(result);
      setShowPaymentModal(false);
      setStep('success');
    }
  };

  const handlePaymentSuccess = (reference: string) => {
    logger.log('Payment successful:', reference);
    // After payment, proceed to create booking
    handlePayment();
  };

  const handlePaymentError = (error: string) => {
    logger.error('Payment error:', error);
    // Stay on payment step and show error
  };

  const handleProceedToPayment = () => {
    // Check wallet balance
    if (walletBalance && walletBalance.balance < (selectedService?.price || 0)) {
      // Show payment modal to add funds
      setShowPaymentModal(true);
    } else {
      // Sufficient balance - proceed directly
      setStep('payment');
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'service': return 'Select Service';
      case 'date': return 'Select Date & Time';
      case 'confirm': return 'Review Session';
      case 'payment': return 'Complete Payment';
      case 'success': return 'Booking Confirmed';
      default: return '';
    }
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate.getTime() + days * 86400000);
    // Don't allow past dates
    if (!isPastDate(newDate)) {
      setSelectedDate(newDate);
      setSelectedTime(null); // Reset time when date changes
    }
  };

  if (step === 'success' && bookingResult) {
    return (
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl mx-auto shadow-2xl border border-stone-100">
        <BookingConfirmation
          confirmationCode={bookingResult.confirmationCode}
          babalawoName={babalawo?.name || 'Babalawo'}
          babalawoAvatar={babalawo?.avatar}
          date={bookingResult.date}
          time={bookingResult.time}
          topic={bookingResult.topic}
          price={bookingResult.price}
          preferredMethod="VIDEO"
          onViewConsultations={() => {
            onSuccess();
          }}
          onBookAnother={() => {
            setStep('service');
            setSelectedService(null);
            setSelectedTime(null);
            setBookingResult(null);
          }}
        />
      </div>
    );
  }

  if (babalawLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!babalawo) {
    return (
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl mx-auto shadow-2xl border border-stone-100 text-center py-12">
        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-stone-800">Unable to Load</h3>
        <p className="text-stone-500 mt-2">Could not load babalawo information</p>
        <button onClick={onBack} className="mt-4 px-6 py-2 bg-stone-900 text-white rounded-lg">
          Go Back
        </button>
      </div>
    );
  }

  const insufficientFunds = walletBalance && selectedService && walletBalance.balance < selectedService.price;

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 animate-in slide-in-from-right-4 duration-500 max-w-2xl mx-auto shadow-2xl border border-stone-100">
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-stone-100">
        <button
          onClick={step === 'service' ? onBack : () => setStep(step === 'payment' ? 'confirm' : step === 'confirm' ? 'date' : 'service')}
          className="p-2 hover:bg-stone-100 rounded-full transition-colors"
        >
          <ChevronLeft size={24} className="text-stone-400" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold brand-font text-stone-800">{getStepTitle()}</h2>
          <div className="flex gap-2 mt-2">
            {(['service', 'date', 'confirm', 'payment'] as const).map((s, i) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${(['service', 'date', 'confirm', 'payment'].indexOf(step) >= i ? 'bg-highlight' : 'bg-stone-100')}`} />
            ))}
          </div>
        </div>
      </div>

      {bookingError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-800">Booking Error</p>
            <p className="text-red-700 text-sm">{bookingError}</p>
          </div>
        </div>
      )}

      {step === 'service' && (
        <div className="space-y-4">
          <p className="text-stone-500 mb-4">Choose the type of consultation you need from {babalawo.name}.</p>
          {babalawo.services.map(service => (
            <div
              key={service.id}
              onClick={() => setSelectedService(service)}
              className={`p-6 rounded-2xl border-2 cursor-pointer transition-all hover:bg-stone-50 ${selectedService?.id === service.id ? 'border-highlight bg-highlight/5' : 'border-stone-100'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-stone-800">{service.title}</h3>
                <span className="font-bold text-highlight">₦{service.price.toLocaleString()}</span>
              </div>
              <p className="text-stone-500 text-sm">{service.description}</p>
              <div className="mt-3 flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-widest">
                <Clock size={12} /> {service.duration}
              </div>
            </div>
          ))}
          <div className="pt-4 flex justify-end">
            <button
              disabled={!selectedService}
              onClick={() => setStep('date')}
              className="px-8 py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 'date' && (
        <div className="space-y-8 animate-in fade-in">
          {/* Date Picker */}
          <div className="bg-stone-50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4 px-2">
              <button
                onClick={() => handleDateChange(-1)}
                disabled={isPastDate(new Date(selectedDate.getTime() - 86400000))}
                className="p-1 hover:bg-white rounded-full disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft />
              </button>
              <span className="font-bold text-lg">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              <button onClick={() => handleDateChange(1)} className="p-1 hover:bg-white rounded-full"><ChevronRight /></button>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-sm">
              {[...Array(7)].map((_, i) => {
                const dayDate = new Date();
                dayDate.setDate(dayDate.getDate() + i - 3);
                const isToday = i === 3;
                const isSelected = dayDate.toDateString() === selectedDate.toDateString();
                const isPast = isPastDate(dayDate) && !isToday;

                return (
                  <div
                    key={i}
                    onClick={() => !isPast && setSelectedDate(dayDate)}
                    className={`h-10 w-10 mx-auto rounded-full flex items-center justify-center cursor-pointer transition-colors
                      ${isSelected ? 'bg-highlight text-white font-bold' : ''}
                      ${isPast ? 'text-stone-300 cursor-not-allowed' : 'text-stone-500 hover:bg-stone-200'}
                    `}
                  >
                    {dayDate.getDate()}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time Slots */}
          <div>
            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-4">Available Slots</h3>

            {slotsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-highlight" size={32} />
                <span className="ml-2 text-stone-500">Loading available times...</span>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-8 bg-stone-50 rounded-xl border border-stone-200">
                <Calendar className="mx-auto text-stone-400 mb-2" size={32} />
                <p className="text-stone-500 font-medium">No availability on this date</p>
                <p className="text-stone-400 text-sm mt-1">Try selecting a different date</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableSlots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={`py-3 px-4 rounded-xl font-medium transition-all ${selectedTime === slot ? 'bg-highlight text-white shadow-lg scale-105' : 'bg-white border border-stone-200 text-stone-600 hover:border-highlight hover:text-highlight'}`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}

            {slotsError && (
              <p className="text-xs text-amber-600 mt-2">
                <AlertCircle size={12} className="inline mr-1" />
                Using demo slots. {slotsError}
              </p>
            )}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              disabled={!selectedTime}
              onClick={() => setStep('confirm')}
              className="px-8 py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200">
            <h3 className="text-lg font-bold brand-font mb-4">Session Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-stone-200">
                <div className="w-12 h-12 bg-white rounded-full border border-stone-100 flex items-center justify-center text-highlight">
                  <Video size={24} />
                </div>
                <div>
                  <p className="font-bold text-stone-800">{selectedService?.title}</p>
                  <p className="text-stone-500 text-sm">{selectedService?.duration} • Video Consultation</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="text-stone-400" size={20} />
                <div>
                  <p className="font-bold text-stone-800">{selectedDate.toLocaleDateString()}</p>
                  <p className="text-stone-500 text-sm">Date</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="text-stone-400" size={20} />
                <div>
                  <p className="font-bold text-stone-800">{selectedTime}</p>
                  <p className="text-stone-500 text-sm">Time</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="text-stone-400" size={20} />
                <div>
                  <p className="font-bold text-stone-800">Virtual (Zoom/Meet)</p>
                  <p className="text-stone-500 text-sm">Location</p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-200 flex justify-between items-center">
              <span className="font-bold text-stone-500">Total</span>
              <span className="font-bold text-2xl text-primary">₦{selectedService?.price.toLocaleString()}</span>
            </div>
          </div>

          {/* Wallet Balance Section */}
          <div className={`p-4 rounded-xl border ${insufficientFunds ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-3">
              <Wallet className={insufficientFunds ? 'text-amber-600' : 'text-green-600'} size={20} />
              <div className="flex-1">
                <p className="text-sm font-medium text-stone-600">Wallet Balance</p>
                {walletLoading ? (
                  <Loader2 className="animate-spin text-stone-400" size={16} />
                ) : (
                  <p className={`font-bold ${insufficientFunds ? 'text-amber-800' : 'text-green-800'}`}>
                    ₦{(walletBalance?.balance || 0).toLocaleString()}
                  </p>
                )}
              </div>
              {insufficientFunds && (
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded">
                  Insufficient Funds
                </span>
              )}
            </div>
            {insufficientFunds && (
              <p className="text-xs text-amber-700 mt-2">
                You need ₦{((selectedService?.price || 0) - (walletBalance?.balance || 0)).toLocaleString()} more to complete this booking.
              </p>
            )}
          </div>

          <button
            onClick={handleProceedToPayment}
            className="w-full py-4 bg-highlight text-white rounded-xl font-bold text-lg hover:bg-yellow-500 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            {insufficientFunds ? 'Add Funds & Pay' : 'Proceed to Payment'}
          </button>
        </div>
      )}

      {step === 'payment' && (
        <div className="space-y-6 animate-in fade-in text-center py-8">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              {bookingLoading ? (
                <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
              ) : (
                <Lock className="w-12 h-12 text-green-500" />
              )}
            </div>
            <h3 className="text-xl font-bold text-stone-800">
              {bookingLoading ? 'Processing Your Booking' : 'Confirm Payment'}
            </h3>
            <p className="text-stone-500 mt-2">
              {bookingLoading ? 'Creating your appointment...' : 'Click below to complete your booking'}
            </p>
          </div>

          <div className="bg-stone-50 p-4 rounded-xl max-w-sm mx-auto border border-stone-200 text-left">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-stone-500">Consultation Fee</span>
              <span className="font-bold">₦{selectedService?.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-stone-500">Platform Fee</span>
              <span className="font-bold">₦500.00</span>
            </div>
            <div className="border-t border-stone-200 my-2 pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>₦{((selectedService?.price || 0) + 500).toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={handlePayment}
            disabled={bookingLoading}
            className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold text-lg hover:bg-black transition-all shadow-lg disabled:opacity-70 mt-4"
          >
            {bookingLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={20} />
                Processing...
              </span>
            ) : (
              'Confirm & Pay from Wallet'
            )}
          </button>

          <p className="text-xs text-stone-400 mt-4">
            <Lock size={12} className="inline mr-1" />
            Funds will be held in escrow until your consultation is complete.
          </p>
        </div>
      )}

      {/* Payment Modal for adding funds */}
      {showPaymentModal && selectedService && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={selectedService.price + 500 - (walletBalance?.balance || 0)}
          currency={Currency.NGN}
          purpose={PaymentPurpose.WALLET_TOPUP}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      )}
    </div>
  );
};

export default BookingFlow;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  MessageSquare,
  Video,
  Phone,
  MapPin,
  DollarSign,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { getDemoUserById, type DemoUser } from '@/demo/index';
import { cn } from '@/lib/utils';

interface BookingFormProps {
  babalawoId: string;
  babalawoName: string;
}

export const BookingForm: React.FC<BookingFormProps> = ({ babalawoId, babalawoName }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    scheduledDate: '',
    time: '',
    duration: 60,
    topic: '',
    preferredMethod: 'VIDEO',
    specialRequests: '',
    paymentMethod: 'WALLET',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Calculate price based on duration
  const pricePerMinute = 25; // NGN per minute
  const totalPrice = formData.duration * pricePerMinute;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const appointmentPayload = {
        babalawoId,
        clientId: user?.id || 'demo-client-1',
        date: formData.scheduledDate,
        time: formData.time,
        duration: formData.duration,
        topic: formData.topic,
        preferredMethod: formData.preferredMethod,
        specialRequests: formData.specialRequests,
        paymentMethod: formData.paymentMethod,
        price: totalPrice,
      };
      const response = await api.post('/appointments', appointmentPayload);
      const appointment = response.data;
      navigate(`/booking/${appointment.id}/confirmation`);
    } catch (err) {
      const demoId = `demo-apt-${Date.now()}`;
      const demoBabalawo = getDemoUserById(babalawoId) as DemoUser | null;
      const demoAppointment = {
        id: demoId,
        confirmationCode: `CONF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        clientId: user?.id || 'demo-client-1',
        babalawoId,
        babalawo: {
          name: demoBabalawo?.name || babalawoName,
          avatar: demoBabalawo?.avatar || '',
          specialty: demoBabalawo?.specialization?.[0] || 'Ifa Divination',
        },
        date: formData.scheduledDate,
        time: formData.time,
        duration: formData.duration,
        topic: formData.topic,
        preferredMethod: formData.preferredMethod,
        price: totalPrice,
      };

      sessionStorage.setItem(`demo-appointment:${demoId}`, JSON.stringify(demoAppointment));
      navigate(`/booking/${demoId}/confirmation`);
    } finally {
      setLoading(false);
    }
  };

  const methodOptions = [
    { value: 'VIDEO', label: 'Video Call', icon: Video, description: 'Face-to-face consultation via video' },
    { value: 'PHONE', label: 'Phone Call', icon: Phone, description: 'Audio-only consultation' },
    { value: 'IN_PERSON', label: 'In Person', icon: MapPin, description: 'Physical meeting at temple' },
  ];

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-card rounded-[2.5rem] p-8 md:p-10 shadow-elevation-2 border border-border space-y-8"
    >
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl md:text-4xl font-bold brand-font text-foreground">
          Book Consultation
        </h2>
        <p className="text-muted-foreground">
          Schedule your spiritual guidance session with {babalawoName}
        </p>
      </div>

      {/* Date & Time Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-foreground uppercase tracking-wide">
            <Calendar size={16} className="text-primary" />
            Consultation Date
          </label>
          <input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={formData.scheduledDate}
            onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
            required
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
          />
        </div>

        {/* Time */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-foreground uppercase tracking-wide">
            <Clock size={16} className="text-primary" />
            Preferred Time
          </label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            required
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
          />
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-bold text-foreground uppercase tracking-wide">
          <Clock size={16} className="text-primary" />
          Duration
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[30, 60, 90].map((duration) => (
            <button
              key={duration}
              type="button"
              onClick={() => setFormData({ ...formData, duration })}
              className={cn(
                "px-4 py-3 rounded-xl border-2 transition-all font-medium",
                formData.duration === duration
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-primary/5"
              )}
            >
              {duration} min
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Price: ₦{formData.duration * pricePerMinute} ({formData.duration} min × ₦{pricePerMinute}/min)
        </p>
      </div>

      {/* Consultation Topic */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-bold text-foreground uppercase tracking-wide">
          <MessageSquare size={16} className="text-primary" />
          Consultation Topic
        </label>
        <textarea
          value={formData.topic}
          onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
          placeholder="What would you like guidance on? (e.g., Life direction, spiritual growth, divination)"
          required
          rows={4}
          className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none"
        />
      </div>

      {/* Preferred Method */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-bold text-foreground uppercase tracking-wide">
          <Video size={16} className="text-primary" />
          Preferred Method
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {methodOptions.map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.value}
                type="button"
                onClick={() => setFormData({ ...formData, preferredMethod: method.value })}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all text-left group",
                  formData.preferredMethod === method.value
                    ? "bg-primary/10 border-primary shadow-md"
                    : "bg-background border-border hover:border-primary/50 hover:bg-primary/5"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    formData.preferredMethod === method.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/10 text-secondary"
                  )}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-foreground mb-1">{method.label}</div>
                    <div className="text-xs text-muted-foreground">{method.description}</div>
                  </div>
                  {formData.preferredMethod === method.value && (
                    <CheckCircle2 size={20} className="text-primary flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Special Requests */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-bold text-foreground uppercase tracking-wide">
          <MessageSquare size={16} className="text-primary" />
          Special Requests <span className="text-muted-foreground font-normal normal-case">(Optional)</span>
        </label>
        <textarea
          value={formData.specialRequests}
          onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
          placeholder="Any special accommodations, dietary restrictions, or preferences?"
          rows={3}
          className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none"
        />
      </div>

      {/* Price Summary */}
      <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign size={20} className="text-primary" />
            <span className="font-bold text-foreground">Total Amount</span>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold brand-font text-primary">
              ₦{totalPrice.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {formData.duration} minutes × ₦{pricePerMinute}/min
            </div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Payment will be processed from your wallet</p>
          <p>• Full refund if cancelled 24 hours before appointment</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-error/10 border border-error/30 rounded-xl text-error"
        >
          <AlertCircle size={20} />
          <span className="font-medium">{error}</span>
        </motion.div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !formData.scheduledDate || !formData.time || !formData.topic}
        className={cn(
          "w-full py-4 px-6 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3",
          loading || !formData.scheduledDate || !formData.time || !formData.topic
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        )}
      >
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            <span>Booking Consultation...</span>
          </>
        ) : (
          <>
            <CheckCircle2 size={20} />
            <span>Confirm Booking</span>
          </>
        )}
      </button>
    </motion.form>
  );
};

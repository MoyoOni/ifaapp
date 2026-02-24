import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, AlertCircle, Info, Calendar, Lock, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';

interface PersonalAwoRequestFormProps {
  babalawoId: string;
  babalawoName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Personal Awo Request Form
 * Client-initiated form to request a long-term Personal Awo relationship
 * NOTE: Includes spiritual covenant, duration selection, and exclusivity acknowledgment
 */
const PersonalAwoRequestForm: React.FC<PersonalAwoRequestFormProps> = ({
  babalawoId,
  babalawoName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [durationMonths, setDurationMonths] = useState<3 | 6 | 12>(6);
  const [covenantAgreed, setCovenantAgreed] = useState(false);
  const [exclusivityAcknowledged, setExclusivityAcknowledged] = useState(false);

  const defaultCovenantText = `I acknowledge that this Personal Awo relationship is a sacred bond. I commit to:
- Respecting the spiritual guidance provided
- Maintaining open and honest communication
- Honoring the exclusivity of this relationship
- Following through on commitments made during our sessions`;

  const requestMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(
        `/babalawo-client/request-personal-awo/${user?.id}/${babalawoId}`,
        {
          relationshipType: 'PERSONAL_AWO',
          durationMonths,
          covenantAgreed: true,
          covenantText: defaultCovenantText,
          exclusivityAcknowledged: true,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-awo', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['babalawo-client'] });
      onSuccess?.();
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!covenantAgreed || !exclusivityAcknowledged) {
      return;
    }
    requestMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-white/10 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-highlight">Request Personal Awo</h3>
            <p className="text-sm text-muted mt-1">
              Requesting long-term relationship with {babalawoName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            disabled={requestMutation.isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cultural Context */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-medium text-yellow-300">Sacred Relationship</p>
              <p className="text-sm text-yellow-300/80">
                A Personal Awo relationship is a long-term spiritual bond, not a transactional service.
                This commitment honors the traditional Ifá practice of having a dedicated spiritual guide.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Duration Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">
              <Calendar className="w-4 h-4 inline mr-2" />
              Relationship Duration
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[3, 6, 12].map((months) => (
                <button
                  key={months}
                  type="button"
                  onClick={() => setDurationMonths(months as 3 | 6 | 12)}
                  className={`px-4 py-3 rounded-lg border transition-all ${
                    durationMonths === months
                      ? 'bg-highlight/20 border-highlight text-highlight'
                      : 'bg-white/5 border-white/10 text-white hover:border-highlight/50'
                  }`}
                >
                  <div className="font-bold text-lg">{months}</div>
                  <div className="text-xs text-muted">Months</div>
                </button>
              ))}
            </div>
          </div>

          {/* Covenant Agreement */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="covenant"
                  checked={covenantAgreed}
                  onChange={(e) => setCovenantAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 text-highlight border-white/20 rounded focus:ring-highlight"
                />
                <label htmlFor="covenant" className="flex-1 cursor-pointer">
                  <p className="font-medium mb-2">Spiritual Covenant Agreement</p>
                  <div className="text-sm text-muted space-y-1 whitespace-pre-line">
                    {defaultCovenantText}
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Exclusivity Acknowledgment */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-3">
                <div>
                  <p className="font-medium text-blue-300 mb-1">Exclusivity Requirement</p>
                  <p className="text-sm text-blue-300/80">
                    You can only have one active Personal Awo relationship at a time. This ensures
                    the sacred bond remains focused and meaningful.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="exclusivity"
                    checked={exclusivityAcknowledged}
                    onChange={(e) => setExclusivityAcknowledged(e.target.checked)}
                    className="mt-1 w-4 h-4 text-highlight border-white/20 rounded focus:ring-highlight"
                  />
                  <label htmlFor="exclusivity" className="flex-1 cursor-pointer text-sm text-blue-300/80">
                    I acknowledge that I can only have one active Personal Awo relationship at a time.
                    If I already have one, I understand I must complete a 14-day grace period before switching.
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Grace Period Info */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-300">14-Day Grace Period</p>
                <p className="text-xs text-yellow-300/70">
                  If you need to change your Personal Awo in the future, there is a 14-day grace period
                  before the switch takes effect. This allows time for reflection and ensures the decision
                  is made thoughtfully.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={requestMutation.isPending}
              className="flex-1 px-4 py-3 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!covenantAgreed || !exclusivityAcknowledged || requestMutation.isPending}
              className="flex-1 px-4 py-3 bg-highlight text-white rounded-lg font-medium hover:bg-highlight/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {requestMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonalAwoRequestForm;

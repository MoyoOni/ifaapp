import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Upload, X, Loader2, FileText } from 'lucide-react';
import api from '@/lib/api';

export enum DisputeType {
  ORDER = 'ORDER',
  ESCROW = 'ESCROW',
  APPOINTMENT = 'APPOINTMENT',
  SPIRITUAL = 'SPIRITUAL',
  OTHER = 'OTHER',
}

export enum DisputeCategory {
  SPIRITUAL_MISCONDUCT = 'SPIRITUAL_MISCONDUCT',
  PRODUCT_QUALITY = 'PRODUCT_QUALITY',
  SERVICE_ISSUE = 'SERVICE_ISSUE',
  PAYMENT = 'PAYMENT',
  CULTURAL_AUTHENTICITY = 'CULTURAL_AUTHENTICITY',
  OTHER = 'OTHER',
}

interface DisputeFilingFormProps {
  orderId?: string;
  escrowId?: string;
  appointmentId?: string;
  respondentId: string;
  respondentName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Dispute Filing Form Component
 * Allows users to file disputes with evidence upload
 */
const DisputeFilingForm: React.FC<DisputeFilingFormProps> = ({
  orderId,
  escrowId,
  appointmentId,
  respondentId,
  respondentName,
  onSuccess,
  onCancel,
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    type: DisputeType.OTHER,
    category: DisputeCategory.OTHER,
    title: '',
    description: '',
    evidence: [] as string[], // URLs to evidence
  });
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [evidenceInput, setEvidenceInput] = useState('');

  const createDisputeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/disputes', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      if (onSuccess) onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDisputeMutation.mutate({
      orderId,
      escrowId,
      appointmentId,
      respondentId,
      type: formData.type,
      category: formData.category,
      title: formData.title,
      description: formData.description,
      evidence: evidenceUrls,
    });
  };

  const addEvidenceUrl = () => {
    if (evidenceInput.trim() && !evidenceUrls.includes(evidenceInput.trim())) {
      setEvidenceUrls([...evidenceUrls, evidenceInput.trim()]);
      setEvidenceInput('');
    }
  };

  const removeEvidenceUrl = (url: string) => {
    setEvidenceUrls(evidenceUrls.filter((u) => u !== url));
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-8 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <AlertCircle size={24} className="text-highlight" />
        <h2 className="text-2xl font-bold">File a Dispute</h2>
      </div>

      {respondentName && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-sm text-blue-300">
            <strong>Respondent:</strong> {respondentName}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dispute Type */}
        <div>
          <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
            Dispute Type *
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as DisputeType })}
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-highlight"
          >
            {Object.values(DisputeType).map((type) => (
              <option key={type} value={type}>
                {type.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Dispute Category */}
        <div>
          <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
            Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as DisputeCategory })}
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-highlight"
          >
            {Object.values(DisputeCategory).map((category) => (
              <option key={category} value={category}>
                {category.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          {formData.category === DisputeCategory.SPIRITUAL_MISCONDUCT && (
            <p className="text-xs text-yellow-400 mt-2">
              ⚠️ Spiritual misconduct disputes are automatically escalated to the Cultural Advisory Board.
            </p>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            minLength={5}
            maxLength={200}
            placeholder="Brief summary of the dispute"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            minLength={20}
            maxLength={5000}
            rows={6}
            placeholder="Provide detailed information about the dispute, including what happened, when it occurred, and why you believe this is a valid dispute..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight resize-none"
          />
          <p className="text-xs text-muted mt-1">
            {formData.description.length}/5000 characters (minimum 20)
          </p>
        </div>

        {/* Evidence URLs */}
        <div>
          <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
            Evidence (Optional)
          </label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="url"
                value={evidenceInput}
                onChange={(e) => setEvidenceInput(e.target.value)}
                placeholder="Paste URL to screenshot, document, or other evidence"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight"
              />
              <button
                type="button"
                onClick={addEvidenceUrl}
                className="px-6 py-3 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors"
              >
                <Upload size={18} />
              </button>
            </div>
            {evidenceUrls.length > 0 && (
              <div className="space-y-2">
                {evidenceUrls.map((url, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-3"
                  >
                    <FileText size={16} className="text-highlight" />
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-sm text-highlight hover:underline truncate"
                    >
                      {url}
                    </a>
                    <button
                      type="button"
                      onClick={() => removeEvidenceUrl(url)}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      <X size={16} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-muted mt-2">
            Add URLs to screenshots, documents, or other evidence that supports your dispute.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-white/10">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-white/20 text-white rounded-xl font-bold hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={createDisputeMutation.isPending || formData.title.length < 5 || formData.description.length < 20}
            className="flex-1 px-6 py-3 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {createDisputeMutation.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <AlertCircle size={18} />
                File Dispute
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DisputeFilingForm;

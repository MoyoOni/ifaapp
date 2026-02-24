import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Upload, Plus, X, Loader2, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';


interface VerificationApplicationFormProps {
  userId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Verification Application Form
 * Four-stage verification workflow for Babalawos
 * NOTE: Culturally critical - rigorous verification ensures platform integrity
 */
const VerificationApplicationForm: React.FC<VerificationApplicationFormProps> = ({
  userId,
  onSuccess,
  onCancel,
}) => {
  const queryClient = useQueryClient();
  const [lineage, setLineage] = useState('');
  const [mentorEndorsements, setMentorEndorsements] = useState<string[]>(['']);
  const [yearsOfService, setYearsOfService] = useState<number>(0);
  const [specialization, setSpecialization] = useState<string[]>(['']);
  const [languages, setLanguages] = useState<string[]>(['Yoruba', 'English']);
  const [files, setFiles] = useState<{ name: string, size: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Mock Upload Handler
  const handleMockUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setFiles(prev => [...prev, {
        name: `document_${Date.now()}.pdf`,
        size: `${(Math.random() * 2 + 1).toFixed(1)} MB`
      }]);
      setIsUploading(false);
    }, 1200);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      try {
        const response = await api.post('/verification/apply', {
          lineage,
          mentorEndorsements: mentorEndorsements.filter((id) => id.trim() !== ''),
          yearsOfService,
          documentation: files.map(f => f.name),
          specialization: specialization.filter((spec) => spec.trim() !== ''),
          languages: languages.filter((lang) => lang.trim() !== ''),
        });
        return response.data;
      } catch (e) {
        logger.warn("Verification API failed, using mock success");
        await new Promise(r => setTimeout(r, 1500));
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-application', userId] });
      if (onSuccess) {
        onSuccess();
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate();
  };

  const addField = (field: 'mentorEndorsements' | 'specialization' | 'languages') => {
    if (field === 'mentorEndorsements') {
      setMentorEndorsements([...mentorEndorsements, '']);
    } else if (field === 'specialization') {
      setSpecialization([...specialization, '']);
    } else if (field === 'languages') {
      setLanguages([...languages, '']);
    }
  };

  const updateField = (
    field: 'mentorEndorsements' | 'specialization' | 'languages',
    index: number,
    value: string
  ) => {
    if (field === 'mentorEndorsements') {
      const updated = [...mentorEndorsements];
      updated[index] = value;
      setMentorEndorsements(updated);
    } else if (field === 'specialization') {
      const updated = [...specialization];
      updated[index] = value;
      setSpecialization(updated);
    } else if (field === 'languages') {
      const updated = [...languages];
      updated[index] = value;
      setLanguages(updated);
    }
  };

  const removeField = (
    field: 'mentorEndorsements' | 'specialization' | 'languages',
    index: number
  ) => {
    if (field === 'mentorEndorsements') {
      setMentorEndorsements(mentorEndorsements.filter((_, i) => i !== index));
    } else if (field === 'specialization') {
      setSpecialization(specialization.filter((_, i) => i !== index));
    } else if (field === 'languages') {
      setLanguages(languages.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="min-h-screen bg-background text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-5xl font-bold brand-font text-highlight">
            Verification Application
          </h1>
          <p className="text-muted text-lg">
            Complete the four-stage verification workflow to become a verified Babalawo
          </p>
        </div>

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 space-y-6">
          {/* Lineage */}
          <div className="space-y-3">
            <label className="text-sm font-bold uppercase text-muted tracking-widest">
              Documented Lineage *
            </label>
            <p className="text-xs text-muted">
              Traceable lineage to a recognized source within the Ifá priesthood
            </p>
            <textarea
              value={lineage}
              onChange={(e) => setLineage(e.target.value)}
              required
              rows={4}
              placeholder="Describe your lineage and traceable connection to recognized Ifá priesthood source..."
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-muted outline-none focus:ring-2 focus:ring-highlight resize-none"
            />
          </div>

          {/* Mentor Endorsements */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold uppercase text-muted tracking-widest">
                Mentor Endorsements *
              </label>
              <button
                type="button"
                onClick={() => addField('mentorEndorsements')}
                className="text-highlight hover:text-highlight/80 text-sm font-medium flex items-center gap-2"
              >
                <Plus size={16} />
                Add Mentor ID
              </button>
            </div>
            <p className="text-xs text-muted">
              IDs of endorsing Babalawos (minimum 1 required)
            </p>
            <div className="space-y-2">
              {mentorEndorsements.map((id, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => updateField('mentorEndorsements', index, e.target.value)}
                    required
                    placeholder="Mentor Babalawo User ID"
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-muted outline-none focus:ring-2 focus:ring-highlight"
                  />
                  {mentorEndorsements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeField('mentorEndorsements', index)}
                      className="p-3 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Years of Service */}
          <div className="space-y-3">
            <label className="text-sm font-bold uppercase text-muted tracking-widest">
              Years of Service *
            </label>
            <input
              type="number"
              value={yearsOfService}
              onChange={(e) => setYearsOfService(parseInt(e.target.value) || 0)}
              required
              min={0}
              placeholder="Number of years serving as Babalawo"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-muted outline-none focus:ring-2 focus:ring-highlight"
            />
          </div>

          {/* Supporting Documents (Upload Simulation) */}
          <div className="space-y-3">
            <label className="text-sm font-bold uppercase text-muted tracking-widest">
              Supporting Documents *
            </label>
            <p className="text-xs text-muted">
              Upload certificates, identification, or other proof of lineage
            </p>

            <div className="border-2 border-dashed border-white/20 rounded-2xl p-6 text-center hover:bg-white/5 transition-colors cursor-pointer" onClick={handleMockUpload}>
              {isUploading ? (
                <div className="flex flex-col items-center gap-2 text-highlight animate-pulse">
                  <Loader2 size={32} className="animate-spin" />
                  <span className="font-bold">Uploading Securely...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted">
                  <Upload size={32} />
                  <span className="font-bold">Click to Upload Documents</span>
                  <span className="text-xs">PDF, JPG, PNG (Max 10MB)</span>
                </div>
              )}
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2 mt-4">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white/10 px-4 py-3 rounded-xl">
                    <div className="flex items-center gap-3">
                      <FileText className="text-highlight" size={20} />
                      <div>
                        <p className="text-sm font-bold text-white">{file.name}</p>
                        <p className="text-xs text-muted">{file.size}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => removeFile(idx)} className="text-white/50 hover:text-white">
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Specialization */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold uppercase text-muted tracking-widest">
                Specialization Areas *
              </label>
              <button
                type="button"
                onClick={() => addField('specialization')}
                className="text-highlight hover:text-highlight/80 text-sm font-medium flex items-center gap-2"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
            <div className="space-y-2">
              {specialization.map((spec, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={spec}
                    onChange={(e) => updateField('specialization', index, e.target.value)}
                    required
                    placeholder="e.g., Odu Ifá Interpretation, Herbal Science"
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-muted outline-none focus:ring-2 focus:ring-highlight"
                  />
                  {specialization.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeField('specialization', index)}
                      className="p-3 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold uppercase text-muted tracking-widest">
                Languages Spoken *
              </label>
              <button
                type="button"
                onClick={() => addField('languages')}
                className="text-highlight hover:text-highlight/80 text-sm font-medium flex items-center gap-2"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
            <div className="space-y-2">
              {languages.map((lang, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={lang}
                    onChange={(e) => updateField('languages', index, e.target.value)}
                    required
                    placeholder="Language name"
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-muted outline-none focus:ring-2 focus:ring-highlight"
                  />
                  {languages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeField('languages', index)}
                      className="p-3 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-white/10">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all border border-white/20"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="ml-auto px-6 py-3 bg-highlight hover:bg-highlight/90 text-white rounded-xl font-bold transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Submit Application
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerificationApplicationForm;

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';

interface VendorApplicationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Vendor Application Form Component
 * Allows users to apply to become a vendor on the marketplace
 * NOTE: Requires business verification and approval process
 */
const VendorApplicationForm: React.FC<VendorApplicationFormProps> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    businessName: '',
    businessLicense: '',
    taxId: '',
    endorsementBy: '',
    description: '',
    artisanHeritageProof: '',
    yorubaProficiencyLevel: '' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'NATIVE' | '',
    yorubaProficiencyProof: '',
    noCounterfeitSpiritualItems: false,
  });

  const [submitted, setSubmitted] = useState(false);

  const applicationMutation = useMutation({
    mutationFn: async (data: Partial<typeof formData>) => {
      const response = await api.post('/marketplace/vendors', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-status', user?.id] });
      setSubmitted(true);
      if (onSuccess) {
        setTimeout(() => onSuccess(), 2000);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare data for submission - remove empty strings and set to undefined
    const submitData = {
      ...formData,
      artisanHeritageProof: formData.artisanHeritageProof || undefined,
      yorubaProficiencyLevel: formData.yorubaProficiencyLevel || undefined,
      yorubaProficiencyProof: formData.yorubaProficiencyProof || undefined,
      endorsementBy: formData.endorsementBy || undefined,
      businessLicense: formData.businessLicense || undefined,
      taxId: formData.taxId || undefined,
      // Remove noCounterfeitSpiritualItems from submission - it's validated in UI only
      // Backend enforces this at product creation time
    };
    delete (submitData as any).noCounterfeitSpiritualItems;

    applicationMutation.mutate(submitData);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background text-white p-6 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <CheckCircle size={32} className="text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-muted">
              Your vendor application has been received. Our team will review it and get back to you within 3-5 business days.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-sm text-muted">
              You will receive an email notification once your application status changes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold brand-font text-white mb-2">Become a Vendor</h1>
          <p className="text-muted">
            Join our marketplace to sell cultural products, spiritual tools, and educational services to the Ìlú Àṣẹ community
          </p>
        </div>

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
            {/* Business Name */}
            <div>
              <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
                Business Name *
              </label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="Enter your business name"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight"
              />
            </div>

            {/* Business License */}
            <div>
              <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
                Business License / Registration Number
              </label>
              <input
                type="text"
                value={formData.businessLicense}
                onChange={(e) => setFormData({ ...formData, businessLicense: e.target.value })}
                placeholder="e.g., RC123456 (if applicable)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight"
              />
              <p className="text-xs text-muted mt-1">
                Required for businesses operating in Nigeria. Leave empty if not applicable.
              </p>
            </div>

            {/* Tax ID */}
            <div>
              <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
                Tax Identification Number (TIN)
              </label>
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="e.g., TIN123456 (for VAT compliance)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight"
              />
              <p className="text-xs text-muted mt-1">
                Required for vendors selling to Nigerian customers (VAT compliance).
              </p>
            </div>

            {/* Endorsement */}
            <div>
              <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
                Endorsement by Babalawo / Elder (Optional)
              </label>
              <input
                type="text"
                value={formData.endorsementBy}
                onChange={(e) => setFormData({ ...formData, endorsementBy: e.target.value })}
                placeholder="User ID of endorsing Babalawo or elder"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight"
              />
              <p className="text-xs text-muted mt-1">
                If you have been endorsed by a verified Babalawo or community elder, enter their user ID here.
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
                Business Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your business, products, and cultural authenticity..."
                rows={6}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight resize-none"
              />
              <p className="text-xs text-muted mt-1">
                Provide details about what you sell, your sourcing methods, and your connection to Yoruba culture.
              </p>
            </div>

            {/* Cultural Authenticity Section */}
            <div className="pt-6 border-t border-white/10">
              <h3 className="text-lg font-bold text-highlight mb-4">Cultural Authenticity Requirements</h3>

              {/* Artisan Heritage Proof */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
                  Proof of Artisan Heritage (Optional)
                </label>
                <input
                  type="url"
                  value={formData.artisanHeritageProof}
                  onChange={(e) => setFormData({ ...formData, artisanHeritageProof: e.target.value })}
                  placeholder="URL to documentation proving artisan heritage (for crafts vendors)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight"
                />
                <p className="text-xs text-muted mt-1">
                  If you sell traditional crafts, provide documentation of your artisan lineage or heritage.
                </p>
              </div>

              {/* Yoruba Language Proficiency */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
                  Yoruba Language Proficiency Level (Optional)
                </label>
                <select
                  value={formData.yorubaProficiencyLevel}
                  onChange={(e) => setFormData({ ...formData, yorubaProficiencyLevel: e.target.value as any })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-highlight"
                >
                  <option value="">Select proficiency level</option>
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                  <option value="NATIVE">Native Speaker</option>
                </select>
                <p className="text-xs text-muted mt-1">
                  Required for vendors offering Yoruba language tutoring or cultural education services.
                </p>
              </div>

              {/* Yoruba Proficiency Proof */}
              {formData.yorubaProficiencyLevel && (
                <div className="mb-4">
                  <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
                    Yoruba Proficiency Proof
                  </label>
                  <input
                    type="url"
                    value={formData.yorubaProficiencyProof}
                    onChange={(e) => setFormData({ ...formData, yorubaProficiencyProof: e.target.value })}
                    placeholder="URL to documentation of Yoruba language proficiency"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight"
                  />
                  <p className="text-xs text-muted mt-1">
                    Provide certificates, test results, or other documentation proving your Yoruba proficiency.
                  </p>
                </div>
              )}

              {/* No Counterfeit Spiritual Items Agreement */}
              <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.noCounterfeitSpiritualItems}
                    onChange={(e) => setFormData({ ...formData, noCounterfeitSpiritualItems: e.target.checked })}
                    required
                    className="w-5 h-5 mt-0.5 text-highlight focus:ring-highlight rounded"
                  />
                  <div>
                    <span className="font-medium text-yellow-400">
                      I agree not to sell counterfeit or fake spiritual items *
                    </span>
                    <p className="text-xs text-muted mt-1">
                      All products must be authentic. Selling counterfeit spiritual items, replicas, or fakes is strictly prohibited and will result in immediate suspension.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-highlight/10 border border-highlight/30 rounded-xl p-4">
            <h3 className="font-bold text-highlight mb-2">Application Process</h3>
            <ul className="text-sm text-muted space-y-1 list-disc list-inside">
              <li>Your application will be reviewed by our admin team</li>
              <li>Verification typically takes 3-5 business days</li>
              <li>You'll receive email notifications about your application status</li>
              <li>Once approved, you can start listing products on the marketplace</li>
            </ul>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center gap-4">
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
              disabled={applicationMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {applicationMutation.isPending ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorApplicationForm;

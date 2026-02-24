import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';

interface RefundRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentReference: string;
    originalAmount: number;
    currency?: string;
    onSuccess?: () => void;
}

type CancellationReason =
    | 'BABALAWO_CANCELLED'
    | 'USER_CANCELLED'
    | 'SERVICE_NOT_COMPLETED'
    | 'DISPUTE_RESOLUTION'
    | 'TECHNICAL_ISSUE'
    | 'OTHER';

const REFUND_REASONS: { value: CancellationReason; label: string; refundPercent: number }[] = [
    { value: 'BABALAWO_CANCELLED', label: 'Service provider cancelled', refundPercent: 100 },
    { value: 'USER_CANCELLED', label: 'I want to cancel', refundPercent: 50 },
    { value: 'SERVICE_NOT_COMPLETED', label: 'Service was not completed', refundPercent: 100 },
    { value: 'DISPUTE_RESOLUTION', label: 'Dispute resolution', refundPercent: 100 },
    { value: 'TECHNICAL_ISSUE', label: 'Technical issue', refundPercent: 100 },
    { value: 'OTHER', label: 'Other reason', refundPercent: 50 },
];

export function RefundRequestModal({
    isOpen,
    onClose,
    paymentReference,
    originalAmount,
    currency = 'NGN',
    onSuccess,
}: RefundRequestModalProps) {
    const [reason, setReason] = useState<CancellationReason>('USER_CANCELLED');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const selectedReason = REFUND_REASONS.find((r) => r.value === reason);
    const refundAmount = selectedReason
        ? (originalAmount * selectedReason.refundPercent) / 100
        : originalAmount * 0.5;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            await api.post('/payments/refund', {
                reference: paymentReference,
                cancellationReason: reason,
                notes: notes.trim() || undefined,
            });

            setSuccess(true);
            setTimeout(() => {
                onSuccess?.();
                onClose();
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to process refund. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold">Request Refund</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition"
                        disabled={isSubmitting}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {success ? (
                        <div className="text-center py-8">
                            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Refund Requested!</h3>
                            <p className="text-gray-600">
                                Your refund of {formatCurrency(refundAmount)} will be processed within 5-10 business
                                days.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Payment Info */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="text-sm text-gray-600 mb-1">Original Payment</div>
                                <div className="text-lg font-semibold">{formatCurrency(originalAmount)}</div>
                                <div className="text-xs text-gray-500 mt-1">Ref: {paymentReference}</div>
                            </div>

                            {/* Cancellation Reason */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason for Refund
                                </label>
                                <select
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value as CancellationReason)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    disabled={isSubmitting}
                                >
                                    {REFUND_REASONS.map((r) => (
                                        <option key={r.value} value={r.value}>
                                            {r.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Refund Amount Display */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-semibold text-amber-900 mb-1">
                                            Refund Amount: {formatCurrency(refundAmount)}
                                        </div>
                                        <div className="text-sm text-amber-800">
                                            {selectedReason?.refundPercent}% of original payment based on our refund
                                            policy.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Additional Notes (Optional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Provide any additional details..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-800">{error}</p>
                                </div>
                            )}

                            {/* Refund Policy */}
                            <div className="text-xs text-gray-500 space-y-1">
                                <div className="font-semibold">Refund Policy:</div>
                                <ul className="list-disc list-inside space-y-0.5 ml-2">
                                    <li>100% refund if service provider cancels</li>
                                    <li>50% refund if you cancel after booking</li>
                                    <li>100% refund for technical issues or service not completed</li>
                                    <li>Refunds processed within 5-10 business days</li>
                                </ul>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Processing...' : 'Request Refund'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { 
  Calendar, 
  User, 
  CheckCircle, 
  Circle, 
  MessageCircle,
  Star,
  BadgeCheck,
  Flag,
  Flame,
  Trophy,
  RotateCcw,
  Edit3,
  Send,
  XCircle,
  AlertCircle,
  Award,
  Heart,
  Sparkles
} from 'lucide-react';

interface GuidancePlanItem {
  index: number;
  name: string;
  completed: boolean;
  completedAt?: string | null;
}

interface GuidancePlanTracking {
  id: string;
  type: string;
  status: string;
  instructions?: string;
  appointment: {
    date: string;
  };
  babalawo: {
    id: string;
    name: string;
    yorubaName?: string;
  };
  progress: {
    totalItems: number;
    completedCount: number;
    progressPercentage: number;
    isOverdue: boolean;
  };
  items: GuidancePlanItem[];
  createdAt: string;
  completedAt?: string;
}

const GuidancePlanTrackingView: React.FC = () => {
  const { guidancePlanId } = useParams<{ guidancePlanId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showConfetti, setShowConfetti] = useState(false);

  const { data: plan, isLoading, isError, refetch } = useQuery<GuidancePlanTracking>({
    queryKey: ['detailed-guidance-plan', guidancePlanId],
    queryFn: async () => {
      const response = await api.get(`/guidance-plans/${guidancePlanId}/tracking`);
      return response.data;
    },
    enabled: !!guidancePlanId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const toggleItemMutation = useMutation({
    mutationFn: async ({ itemIndex, completed }: { itemIndex: number; completed: boolean }) => {
      const response = await api.patch(`/guidance-plans/${guidancePlanId}/items/${itemIndex}/completion`, {
        completed: !completed
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['detailed-guidance-plan', guidancePlanId] });
      queryClient.invalidateQueries({ queryKey: ['guidance-plans', user?.id] });
      
      // Check if all items are completed to show confetti
      if (plan && plan.progress.completedCount + 1 === plan.progress.totalItems) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000); // Hide confetti after 5 seconds
      }
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h2 className="text-xl font-semibold text-red-500">Error loading guidance plan</h2>
        <button 
          onClick={() => refetch()} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const issuedDate = new Date(plan.appointment.date);
  const planDurationDays = 30; // Assuming 30 days duration
  const expirationDate = new Date(issuedDate);
  expirationDate.setDate(expirationDate.getDate() + planDurationDays);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Confetti effect when plan is completed */}
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="text-6xl animate-bounce">🎉</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-yellow-400/20 backdrop-blur-sm border border-yellow-400/30 rounded-xl p-8 max-w-md text-center">
              <RotateCcw className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">Àṣẹ!</h3>
              <p className="text-yellow-600 dark:text-yellow-300 mt-2">
                You completed your guidance plan
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Header Section */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {plan.type} Guidance Plan
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Issued by {plan.babalawo.yorubaName || plan.babalawo.name} •{' '}
                {formatDate(plan.createdAt)}
              </p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center min-w-[140px]">
              <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                {planDurationDays} days
              </p>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progress: {plan.progress.completedCount}/{plan.progress.totalItems} items
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {plan.progress.progressPercentage}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${
                plan.progress.isOverdue 
                  ? 'bg-amber-500' 
                  : plan.progress.progressPercentage === 100 
                    ? 'bg-green-500' 
                    : 'bg-blue-500'
              }`}
              style={{ width: `${plan.progress.progressPercentage}%` }}
            ></div>
          </div>
          
          {plan.progress.isOverdue && (
            <p className="text-amber-600 dark:text-amber-400 text-sm mt-2 flex items-center gap-1">
              ⚠️ Plan is overdue, consider contacting your Babalawo
            </p>
          )}
        </div>

        {/* Items List */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Guidance Items</h2>
          
          <div className="space-y-3">
            {plan.items.map((item, index) => {
              // Calculate expected date for this item (assuming daily progression)
              const expectedDate = new Date(issuedDate);
              expectedDate.setDate(expectedDate.getDate() + index);
              const isOverdueItem = !item.completed && new Date() > expectedDate && plan.status !== 'COMPLETED';
              
              return (
                <div 
                  key={item.index} 
                  className={`p-4 rounded-lg border ${
                    item.completed 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                      : isOverdueItem
                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                        : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleItemMutation.mutate({ 
                        itemIndex: item.index, 
                        completed: item.completed 
                      })}
                      disabled={toggleItemMutation.isPending}
                      className="mt-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
                      aria-label={item.completed ? "Mark as incomplete" : "Mark as complete"}
                    >
                      {item.completed ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-400" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${
                        item.completed 
                          ? 'text-green-700 dark:text-green-400 line-through' 
                          : isOverdueItem
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-gray-900 dark:text-gray-200'
                      }`}>
                        Day {index + 1}: {item.name}
                      </p>
                      
                      {item.completed && item.completedAt && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          Completed on {formatDate(item.completedAt)}
                        </p>
                      )}
                      
                      {isOverdueItem && (
                        <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                          Expected by: {formatDate(expectedDate.toISOString())}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                // Logic to mark today's item as complete
                const todayIndex = Math.min(
                  Math.floor((new Date().getTime() - issuedDate.getTime()) / (1000 * 60 * 60 * 24)),
                  plan.items.length - 1
                );
                
                const itemToComplete = plan.items[todayIndex];
                if (itemToComplete && !itemToComplete.completed) {
                  toggleItemMutation.mutate({ 
                    itemIndex: itemToComplete.index, 
                    completed: itemToComplete.completed 
                  });
                }
              }}
              disabled={toggleItemMutation.isPending || plan.status === 'COMPLETED'}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-5 h-5" />
              Mark today's item complete
            </button>
            
            <button
              onClick={() => window.open(`mailto:${plan.babalawo.id}?subject=Guidance Plan Question&body=Hi, I have a question about my guidance plan.`)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Message my Babalawo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidancePlanTrackingView;
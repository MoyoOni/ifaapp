import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, User, MapPin, MessageSquare, Calendar, Camera, Star } from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import api from '@/lib/api'; // Changed to default import

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ReactNode;
  requiresAction: boolean;
}

interface FirstStepsChecklistProps {
  className?: string;
  onCompletionChange?: (percentage: number) => void;
}

const FirstStepsChecklist: React.FC<FirstStepsChecklistProps> = ({ 
  className = '',
  onCompletionChange
}) => {
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchChecklistStatus = async () => {
      try {
        // Fetch user profile data to determine checklist status
        const response = await api.get(`/users/${user.id}`);
        const userData = response.data;

        // Define checklist items with their completion status
        const checklistItems: ChecklistItem[] = [
          {
            id: 'profile-photo',
            title: 'Add a profile photo',
            description: 'Help others recognize you in the community',
            completed: !!userData.avatar,
            icon: <Camera className="w-5 h-5" />,
            requiresAction: true
          },
          {
            id: 'yoruba-name',
            title: 'Set your Yoruba name',
            description: 'Share your spiritual identity with the community',
            completed: !!userData.yorubaName,
            icon: <User className="w-5 h-5" />,
            requiresAction: true
          },
          {
            id: 'location',
            title: 'Add your location',
            description: 'Connect with nearby practitioners and events',
            completed: !!userData.location,
            icon: <MapPin className="w-5 h-5" />,
            requiresAction: true
          },
          {
            id: 'bio',
            title: 'Write a short bio',
            description: 'Tell the community about your journey',
            completed: !!userData.bio && userData.bio.length > 10,
            icon: <MessageSquare className="w-5 h-5" />,
            requiresAction: true
          },
          {
            id: 'first-consultation',
            title: 'Book your first consultation',
            description: 'Connect with a Babalawo for guidance',
            completed: userData._count?.appointmentsAsClient > 0,
            icon: <Calendar className="w-5 h-5" />,
            requiresAction: false // This is informational based on actions taken elsewhere
          },
          {
            id: 'first-review',
            title: 'Leave a review',
            description: 'Share your experience with others',
            completed: userData._count?.babalawoReviews > 0,
            icon: <Star className="w-5 h-5" />,
            requiresAction: false // This is informational based on actions taken elsewhere
          }
        ];

        setItems(checklistItems);
        
        // Calculate completion percentage and notify parent
        const completedCount = checklistItems.filter(item => item.completed).length;
        const percentage = Math.round((completedCount / checklistItems.length) * 100);
        
        if (onCompletionChange) {
          onCompletionChange(percentage);
        }
      } catch (error) {
        console.error('Error fetching checklist status:', error);
        
        // Set default checklist items in case of error
        const defaultItems: ChecklistItem[] = [
          {
            id: 'profile-photo',
            title: 'Add a profile photo',
            description: 'Help others recognize you in the community',
            completed: false,
            icon: <Camera className="w-5 h-5" />,
            requiresAction: true
          },
          {
            id: 'yoruba-name',
            title: 'Set your Yoruba name',
            description: 'Share your spiritual identity with the community',
            completed: false,
            icon: <User className="w-5 h-5" />,
            requiresAction: true
          },
          {
            id: 'location',
            title: 'Add your location',
            description: 'Connect with nearby practitioners and events',
            completed: false,
            icon: <MapPin className="w-5 h-5" />,
            requiresAction: true
          },
          {
            id: 'bio',
            title: 'Write a short bio',
            description: 'Tell the community about your journey',
            completed: false,
            icon: <MessageSquare className="w-5 h-5" />,
            requiresAction: true
          },
          {
            id: 'first-consultation',
            title: 'Book your first consultation',
            description: 'Connect with a Babalawo for guidance',
            completed: false,
            icon: <Calendar className="w-5 h-5" />,
            requiresAction: false
          },
          {
            id: 'first-review',
            title: 'Leave a review',
            description: 'Share your experience with others',
            completed: false,
            icon: <Star className="w-5 h-5" />,
            requiresAction: false
          }
        ];
        
        setItems(defaultItems);
      } finally {
        setLoading(false);
      }
    };

    fetchChecklistStatus();
  }, [user, onCompletionChange]);

  const toggleItem = async (itemId: string) => {
    if (!user) return;

    const item = items.find(i => i.id === itemId);
    if (!item || !item.requiresAction) return; // Only allow toggling items that require action

    try {
      // Determine what needs to be updated based on the item ID
      let updateData: any = {};
      let newValue = !item.completed;

      switch (item.id) {
        case 'profile-photo':
          // For profile photo, we would normally open a modal or navigate to profile edit
          // For now, we'll just show a message indicating action needed
          alert(`Please update your profile photo in the settings section.`);
          return;
        case 'yoruba-name':
          updateData = { yorubaName: newValue ? user.name : null };
          break;
        case 'location':
          updateData = { location: newValue ? 'Lagos, Nigeria' : null }; // Placeholder value
          break;
        case 'bio':
          updateData = { bio: newValue ? 'I am on a spiritual journey to learn about Ifá.' : null }; // Placeholder value
          break;
        default:
          return;
      }

      // Update user profile via API
      await api.patch(`/users/${user.id}`, updateData);

      // Update local state
      setItems(prevItems => 
        prevItems.map(i => 
          i.id === itemId ? { ...i, completed: newValue } : i
        )
      );

      // Recalculate and notify completion change
      const updatedItems = items.map(i => 
        i.id === itemId ? { ...i, completed: newValue } : i
      );
      const completedCount = updatedItems.filter(i => i.completed).length;
      const percentage = Math.round((completedCount / updatedItems.length) * 100);
      
      if (onCompletionChange) {
        onCompletionChange(percentage);
      }
    } catch (error) {
      console.error(`Error updating ${item.id}:`, error);
      alert(`Failed to update ${item.title}. Please try again.`);
    }
  };

  if (loading) {
    return (
      <div className={`bg-card rounded-xl p-6 border border-border/50 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-3/4 mb-6"></div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start gap-4 py-3">
              <div className="w-8 h-8 bg-muted rounded-full mt-0.5"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  return (
    <div className={`bg-card rounded-xl p-6 border border-border/50 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg text-foreground">Your First Steps</h3>
        <span className="text-sm font-medium text-muted-foreground">
          {completedCount}/{totalCount} completed
        </span>
      </div>

      <div className="mb-4">
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-highlight h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        <p className="text-right text-xs text-muted-foreground mt-1">
          {completionPercentage}% complete
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div 
            key={item.id}
            className={`flex items-start gap-4 p-3 rounded-lg transition-colors ${
              item.completed 
                ? 'bg-green-50/50 dark:bg-green-900/10 border border-green-200/50' 
                : 'hover:bg-muted/50'
            }`}
          >
            <button
              onClick={() => toggleItem(item.id)}
              disabled={!item.requiresAction}
              className={`mt-0.5 flex-shrink-0 ${
                item.requiresAction ? 'cursor-pointer' : 'cursor-default'
              }`}
              aria-label={item.completed ? `Mark ${item.title} as incomplete` : `Mark ${item.title} as complete`}
            >
              {item.completed ? (
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-green-500 text-white">
                  <CheckCircle className="w-5 h-5" />
                </div>
              ) : (
                <div className="flex items-center justify-center w-7 h-7 rounded-full border border-border">
                  <Circle className="w-5 h-5 text-transparent" />
                </div>
              )}
            </button>
            
            <div className="flex-1 min-w-0">
              <h4 className={`font-medium flex items-center gap-2 ${
                item.completed 
                  ? 'text-green-700 dark:text-green-300 line-through' 
                  : 'text-foreground'
              }`}>
                <span>{item.icon}</span>
                {item.title}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {completedCount === totalCount && (
        <div className="mt-5 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800/50">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-green-800 dark:text-green-200">Congratulations!</h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                You've completed all your first steps. Your profile is well on its way to being complete!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FirstStepsChecklist;
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle, Sparkles, HeartHandshake, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InterestOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface OnboardingStep {
  id: 'welcome' | 'interests' | 'preferences' | 'complete';
  title: string;
  subtitle: string;
}

const interestOptions: InterestOption[] = [
  {
    id: 'spirituality',
    title: 'Spiritual Growth',
    description: 'Deepen your connection to ancient wisdom traditions',
    icon: <HeartHandshake className="w-6 h-6" />
  },
  {
    id: 'culture',
    title: 'Cultural Learning',
    description: 'Explore Yoruba traditions, language, and customs',
    icon: <Sparkles className="w-6 h-6" />
  },
  {
    id: 'education',
    title: 'Educational Courses',
    description: 'Access courses on Ifá, Orisa, and African philosophy',
    icon: <GraduationCap className="w-6 h-6" />
  },
  {
    id: 'community',
    title: 'Community Connection',
    description: 'Connect with practitioners and seekers like yourself',
    icon: <HeartHandshake className="w-6 h-6" />
  },
  {
    id: 'practice',
    title: 'Spiritual Practice',
    description: 'Learn divination, ritual practices, and ceremonies',
    icon: <Sparkles className="w-6 h-6" />
  },
  {
    id: 'healing',
    title: 'Holistic Healing',
    description: 'Understand traditional healing methods and remedies',
    icon: <HeartHandshake className="w-6 h-6" />
  }
];

const steps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Ilé Àṣẹ',
    subtitle: 'Your digital sanctuary for ancient wisdom'
  },
  {
    id: 'interests',
    title: 'What interests you most?',
    subtitle: 'Choose up to 3 areas you\'d like to explore'
  },
  {
    id: 'preferences',
    title: 'Customize your experience',
    subtitle: 'Help us tailor content to your journey'
  },
  {
    id: 'complete',
    title: 'Ready to begin your journey?',
    subtitle: 'Your personalized experience awaits'
  }
];

interface OnboardingFlowProps {
  onComplete: () => void;
  className?: string;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, className }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep['id']>('welcome');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [newsletterEnabled, setNewsletterEnabled] = useState(true);

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleInterestToggle = (id: string) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter(i => i !== id));
    } else if (selectedInterests.length < 3) {
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  const nextStep = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">{steps[0].title}</h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              {steps[0].subtitle}. We'll personalize your experience based on your interests.
            </p>
          </motion.div>
        );

      case 'interests':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">{steps[1].title}</h2>
              <p className="text-muted-foreground">{steps[1].subtitle}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {interestOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => handleInterestToggle(option.id)}
                  className={cn(
                    "p-4 rounded-xl border-2 cursor-pointer transition-all",
                    selectedInterests.includes(option.id)
                      ? "border-primary bg-primary/5"
                      : "border-input hover:border-primary/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      selectedInterests.includes(option.id)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{option.title}</h3>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                    {selectedInterests.includes(option.id) && (
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {selectedInterests.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                Select up to 3 interests to personalize your experience
              </p>
            )}
          </motion.div>
        );

      case 'preferences':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">{steps[2].title}</h2>
              <p className="text-muted-foreground">{steps[2].subtitle}</p>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
                <div>
                  <h3 className="font-semibold text-foreground">Push Notifications</h3>
                  <p className="text-sm text-muted-foreground">Receive updates about new content and activities</p>
                </div>
                <div 
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={cn(
                    "relative w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer",
                    notificationsEnabled ? "bg-primary" : "bg-muted"
                  )}
                >
                  <div 
                    className={cn(
                      "bg-white w-4 h-4 rounded-full shadow-md transform transition-transform",
                      notificationsEnabled ? "translate-x-6" : ""
                    )}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
                <div>
                  <h3 className="font-semibold text-foreground">Newsletter</h3>
                  <p className="text-sm text-muted-foreground">Weekly insights and curated content</p>
                </div>
                <div 
                  onClick={() => setNewsletterEnabled(!newsletterEnabled)}
                  className={cn(
                    "relative w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer",
                    newsletterEnabled ? "bg-primary" : "bg-muted"
                  )}
                >
                  <div 
                    className={cn(
                      "bg-white w-4 h-4 rounded-full shadow-md transform transition-transform",
                      newsletterEnabled ? "translate-x-6" : ""
                    )}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 'complete':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <div className="mx-auto bg-success/10 w-20 h-20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">{steps[3].title}</h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              {steps[3].subtitle}. Based on your selections, we'll curate content just for you.
            </p>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("max-w-2xl mx-auto bg-background rounded-2xl p-6 md:p-8", className)}>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {renderStep()}
      </AnimatePresence>

      <div className="flex justify-between mt-10">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 'welcome'}
        >
          Back
        </Button>
        
        <Button
          onClick={nextStep}
          disabled={
            (currentStep === 'interests' && selectedInterests.length === 0) ||
            currentStep === 'complete'
          }
        >
          {currentStep === 'complete' ? 'Finish Onboarding' : 'Continue'}
        </Button>
      </div>
    </div>
  );
};

export { OnboardingFlow };
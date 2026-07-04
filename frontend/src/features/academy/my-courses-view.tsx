import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { logger } from '@/shared/utils/logger';

import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { isDevModeActive } from '@/shared/utils/dev-mode';

interface Enrollment {
  id: string;
  courseId: string;
  studentId: string;
  status: string;
  progress: number;
  enrolledAt: string;
  completedAt?: string;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string;
    duration?: number;
    lessonCount: number;
    certificateEnabled: boolean;
    instructor: {
      name: string;
      yorubaName?: string;
      verified: boolean;
    };
  };
  certificate?: {
    certificateUrl: string;
    issuedAt: string;
  };
}

interface MyCoursesViewProps {
  onSelectEnrollment?: (enrollmentId: string) => void;
}

/**
 * My Courses View Component
 * Dashboard showing enrolled courses with progress tracking
 */
const MyCoursesView: React.FC<MyCoursesViewProps> = ({ onSelectEnrollment: _onSelectEnrollment }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch enrollments with demo fallback
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery<Enrollment[]>({
    queryKey: ['academy-my-enrollments', user?.id],
    queryFn: async () => {
      try {
        const response = await api.get('/academy/enrollments');
        return response.data || [];
      } catch (e) {
        throw e;
      }
    },
    enabled: !!user && !isDevModeActive(),
  });

  if (enrollmentsLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <LoadingSpinner size="lg" variant="primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-[1.5rem] font-[700] text-foreground">My Courses</h1>
          <p className="text-[0.875rem] text-muted-foreground">Track your learning progress</p>
        </div>
        
        {enrollments && enrollments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enrollment) => (
              <div 
                key={enrollment.id} 
                className="bg-card border border-input rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/academy/course/${enrollment.courseId}`)}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-[1.125rem] font-[700] text-foreground mb-1">{enrollment.course.title}</h2>
                      <p className="text-[0.875rem] text-muted-foreground">{enrollment.course.instructor.name}</p>
                    </div>
                    <Badge 
                      variant={enrollment.status === 'completed' ? 'default' : 'secondary'}
                      className="text-[0.75rem] font-[700]"
                    >
                      {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-[0.875rem] text-foreground mb-1">
                      <span>Progress</span>
                      <span>{Math.round(enrollment.progress)}%</span>
                    </div>
                    <progress
                      value={enrollment.progress}
                      max={100}
                      aria-label="Course progress"
                      className="w-full h-2 rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-primary"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[0.875rem] text-muted-foreground">
                      {Math.round((enrollment.progress / 100) * enrollment.course.lessonCount)} of {enrollment.course.lessonCount} lessons
                    </span>
                    <Button size="sm" variant="outline">
                      {enrollment.status === 'completed' ? 'Review' : 'Continue'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-[1.25rem] font-[700] text-foreground mb-2">No courses enrolled</h3>
            <p className="text-[0.875rem] text-muted-foreground mb-6">Start your learning journey by enrolling in a course</p>
            <Button onClick={() => window.location.href = '/academy'}>
              Browse Courses
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCoursesView;

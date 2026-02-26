import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, GraduationCap, Clock, CheckCircle, Play, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import LoadingSpinner from '@/components/common/LoadingSpinner';

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
const MyCoursesView: React.FC<MyCoursesViewProps> = ({ onSelectEnrollment }) => {
  const { user } = useAuth();

  // Fetch enrollments with demo fallback
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery<Enrollment[]>({
    queryKey: ['academy-my-enrollments', user?.id],
    queryFn: async () => {
      try {
        const response = await api.get('/academy/enrollments');
        return response.data || [];
      } catch (e) {
        if (!isDemoMode) throw e;

        if (!isDemoMode) throw e;


        logger.error('Failed to fetch enrollments, using demo data', e);
        // Collect demo enrollments from sessionStorage
        if (typeof sessionStorage !== 'undefined' && user?.id) {
          const demoEnrollments: Enrollment[] = [];
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key?.startsWith(`demo-enrollment:`) && key.includes(`:${user.id}`)) {
              try {
                const enrollment = JSON.parse(sessionStorage.getItem(key) || '') as Enrollment;
                // Fetch course details for demo enrollment
                const courseId = enrollment.courseId;
                // Use mock course data
                demoEnrollments.push({
                  ...enrollment,
                  course: {
                    id: courseId,
                    title: courseId === 'demo-course-1' ? 'Foundations of Ifá Divination' :
                      courseId === 'demo-course-2' ? 'Spiritual Protection & Daily Practice' :
                        'Yoruba Cultural Studies',
                    slug: courseId === 'demo-course-1' ? 'foundations-of-ifa-divination' :
                      courseId === 'demo-course-2' ? 'spiritual-protection-daily-practice' :
                        'yoruba-cultural-studies',
                    thumbnail: 'https://images.unsplash.com/photo-1522992319-0365e5f11656?w=1200',
                    duration: courseId === 'demo-course-1' ? 6 : courseId === 'demo-course-2' ? 4 : 5,
                    lessonCount: courseId === 'demo-course-1' ? 8 : courseId === 'demo-course-2' ? 6 : 10,
                    certificateEnabled: courseId === 'demo-course-1' || courseId === 'demo-course-3',
                    instructor: {
                      name: 'Babaláwo Adeyemi',
                      yorubaName: 'Babaláwo Adeyemi',
                      verified: true,
                    },
                  },
                });
              } catch (parseError) {
                logger.warn('Failed to parse demo enrollment', parseError);
              }
            }
          }
          return demoEnrollments;
        }
        return [];
      }
    },
    enabled: !!user,
  });

  const activeEnrollments = enrollments.filter((e) => e.status === 'ACTIVE');
  const completedEnrollments = enrollments.filter((e) => e.status === 'COMPLETED');

  if (enrollmentsLoading) {
    return (
      <div className="min-h-screen bg-background text-white p-6 flex items-center justify-center">
        <LoadingSpinner size="lg" variant="primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white p-6">
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
                      variant={enrollment.status === 'completed' ? 'success' : 'secondary'}
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
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${enrollment.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[0.875rem] text-muted-foreground">
                      {enrollment.completedLessons} of {enrollment.totalLessons} lessons
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
            <BookOpen className="w-16 h-16 text-muted mx-auto mb-4" />
            <h3 className="text-[1.25rem] font-[700] text-foreground mb-2">No courses enrolled</h3>
            <p className="text-[0.875rem] text-muted-foreground mb-6">Start your learning journey by enrolling in a course</p>
            <Button asChild>
              <Link to="/academy">Browse Courses</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCoursesView;

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, GraduationCap, Clock, CheckCircle, Users, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { getCourseById } from './course-data';
import { AcademySkeleton } from '@/shared/components/skeleton';
import { useToast } from '@/components/common/ToastProvider';

interface Lesson {
  id: string;
  courseId: string;
  title: string;
  order: number;
  content: string;
  duration: number; // in minutes
}

interface Course {
  id: string;
  instructorId: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  level: string;
  thumbnail?: string;
  duration?: number;
  price: number;
  currency: string;
  status: string;
  enrolledCount: number;
  lessonCount: number;
  certificateEnabled: boolean;
  instructor: {
    id: string;
    name: string;
    yorubaName?: string;
    verified: boolean;
  };
  lessons: Lesson[];
  _count: {
    lessons: number;
    enrollments: number;
  };
}

interface CourseDetailViewProps {
  courseId: string;
  onBack?: () => void;
}

const CourseDetailView: React.FC<CourseDetailViewProps> = ({ courseId, onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch course
  const { data: course, isLoading, isError, error } = useQuery<Course>({
    queryKey: ['course', courseId],
    queryFn: async () => {
      try {
        const response = await api.get(`/academy/courses/${courseId}`);
        return response.data;
      } catch (e) {
        if (!isDemoMode) throw e;

        logger.error('Failed to fetch course, using demo data', e);
        return getCourseById(courseId);
      }
    },
  });

  // Enroll mutation
  const { mutate: enroll, isLoading: isEnrolling } = useMutation({
    mutationFn: () => api.post(`/academy/courses/${courseId}/enroll`),
    onSuccess: () => {
      toast({
        title: 'Enrollment Successful',
        description: `You've been enrolled in ${course?.title}`,
      });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
    onError: (err) => {
      logger.error('Failed to enroll in course', err);
      toast({
        title: 'Enrollment Failed',
        description: 'Could not enroll in the course. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Handle enrollment
  const handleEnroll = () => {
    if (!user) {
      toast({
        title: 'Not Logged In',
        description: 'You need to be logged in to enroll in a course',
        variant: 'destructive',
      });
      return;
    }

    enroll();
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <AcademySkeleton />
      </div>
    );
  }

  if (isError) {
    return <div>Failed to load course: {(error as Error)?.message || 'Unknown error'}</div>;
  }

  if (!course) {
    return <div>Course not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft size={16} />
          Back to Courses
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-input overflow-hidden">
        {/* Course Header */}
        <div className="h-64 bg-gradient-to-r from-primary/10 to-secondary/10 relative">
          <div className="absolute bottom-6 left-6">
            <h1 className="text-3xl font-bold text-foreground">{course.title}</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="bg-primary/10 text-primary text-sm font-bold px-3 py-1 rounded-full">
                {course.category.replace('_', ' ')}
              </span>
              <span className="bg-secondary/10 text-secondary text-sm font-bold px-3 py-1 rounded-full">
                {course.level}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Course Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <GraduationCap className="text-primary" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Instructor</p>
                <p className="font-medium">{course.instructor.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <Clock className="text-primary" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">{course.duration} mins</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <Users className="text-primary" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Enrolled</p>
                <p className="font-medium">{course.enrolledCount} students</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">About this course</h2>
            <p className="text-muted-foreground leading-relaxed">{course.description}</p>
          </div>

          {/* Lessons */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">Lessons</h2>
            <div className="space-y-4">
              {course.lessons.map((lesson) => (
                <div key={lesson.id} className="flex items-center justify-between p-4 bg-muted rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <BookOpen className="text-primary" size={16} />
                    </div>
                    <div>
                      <h3 className="font-medium">{lesson.title}</h3>
                      <p className="text-sm text-muted-foreground">{lesson.duration} mins</p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Lesson {lesson.order}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enrollment */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-2xl font-bold text-foreground">
                {course.price === 0 ? 'Free' : `${course.currency} ${course.price}`}
              </p>
              <p className="text-sm text-muted-foreground">
                Includes certificate • {course.lessonCount} lessons
              </p>
            </div>
            <button
              onClick={handleEnroll}
              disabled={isEnrolling}
              className="bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-8 rounded-xl font-bold text-base flex items-center gap-2 transition-all disabled:opacity-70"
            >
              {isEnrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isEnrolling ? 'Processing...' : 'Enroll Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add memoization to prevent unnecessary re-renders
const MemoizedCourseDetailView = React.memo(CourseDetailView);
MemoizedCourseDetailView.displayName = 'CourseDetailView';

export { MemoizedCourseDetailView as CourseDetailView };
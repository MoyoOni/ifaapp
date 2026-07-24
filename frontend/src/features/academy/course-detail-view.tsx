import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, GraduationCap, Clock, Users, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { logger } from '@/shared/utils/logger';

import { AcademySkeleton } from '@/shared/components/skeleton';
import { useToast } from '@/shared/components/toast';

// Orisha-themed styling helpers for course categories
function getOrishaGradientClass(category: string): string {
  switch (category?.toLowerCase()) {
    case 'divination': return 'from-primary/20 to-accent/20';
    case 'herbalism': return 'from-green-900/30 to-primary/20';
    case 'ritual': return 'from-highlight/20 to-primary/20';
    default: return 'from-muted to-accent/10';
  }
}

function getOrishaBadgeClass(category: string): string {
  switch (category?.toLowerCase()) {
    case 'divination': return 'bg-primary/20 text-primary';
    case 'herbalism': return 'bg-green-900/30 text-green-400';
    case 'ritual': return 'bg-highlight/20 text-highlight';
    default: return 'bg-muted text-muted-foreground';
  }
}

function getOrishaIconBackgroundClass(category: string): string {
  switch (category?.toLowerCase()) {
    case 'divination': return 'bg-primary/10';
    case 'herbalism': return 'bg-green-900/20';
    case 'ritual': return 'bg-highlight/10';
    default: return 'bg-muted';
  }
}

function getOrishaIconColorClass(category: string): string {
  switch (category?.toLowerCase()) {
    case 'divination': return 'text-primary';
    case 'herbalism': return 'text-green-400';
    case 'ritual': return 'text-highlight';
    default: return 'text-muted-foreground';
  }
}

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
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch course
  const { data: course, isLoading, isError, refetch } = useQuery<Course>({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const response = await api.get(`/academy/courses/${courseId}`);
      return response.data;
    },
  });

  // Check whether the current user is already enrolled, so the CTA reflects
  // reality instead of always offering "Enroll Now" (which 409s harmlessly
  // server-side, but reads as broken to a student who already signed up).
  const { data: myEnrollments } = useQuery<{ id: string }[]>({
    queryKey: ['enrollments', courseId, user?.id],
    queryFn: async () => {
      const response = await api.get(`/academy/enrollments?courseId=${courseId}`);
      return response.data;
    },
    enabled: !!user && !!courseId,
  });
  const isEnrolled = (myEnrollments?.length ?? 0) > 0;

  // Enroll mutation
  const { mutate: enroll, isPending: isEnrolling } = useMutation({
    mutationFn: () => api.post('/academy/enrollments', { courseId }),
    onSuccess: () => {
      success(`You've been enrolled in ${course?.title || 'the course'}`);
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['enrollments', courseId, user?.id] });
    },
    onError: (err) => {
      logger.error('Failed to enroll in course', err);
      error('Could not enroll in the course. Please try again.');
    },
  });

  // Handle enrollment
  const handleEnroll = () => {
    if (!user) {
      error('You need to be logged in to enroll in a course');
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
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <button type="button" onClick={onBack} className="flex items-center gap-2 text-primary hover:underline">
            <ArrowLeft size={16} />
            Back to Courses
          </button>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-8 text-center">
          <div className="text-destructive text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Could Not Load Course</h2>
          <p className="text-muted-foreground mb-6">
            There was a problem connecting to the server. Check your connection and try again.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => refetch()}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 border border-border text-foreground rounded-xl font-bold hover:bg-muted transition-colors"
            >
              Back to Academy
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <button type="button" onClick={onBack} className="flex items-center gap-2 text-primary hover:underline">
            <ArrowLeft size={16} />
            Back to Courses
          </button>
        </div>
        <div className="bg-card rounded-2xl border border-input p-8 text-center">
          <div className="text-destructive text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Course Not Found</h2>
          <p className="text-muted-foreground mb-6">
            This course doesn't exist or may have been removed.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors"
          >
            Back to Academy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft size={16} />
          Back to Courses
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-input overflow-hidden">
        {/* Course Header */}
        <div className={`h-64 bg-gradient-to-r ${getOrishaGradientClass(course.category)} relative`}>
          <div className="absolute bottom-6 left-6">
            <h1 className="text-3xl font-bold text-foreground">{course.title}</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className={`${getOrishaBadgeClass(course.category)} text-sm font-bold px-3 py-1 rounded-full`}>
                {course.category.replace('_', ' ')}
              </span>
              <span className="bg-muted text-muted-foreground text-sm font-bold px-3 py-1 rounded-full">
                {course.level}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Course Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className={`${getOrishaIconBackgroundClass(course.category)} p-3 rounded-full`}>
                <GraduationCap className={`${getOrishaIconColorClass(course.category)}`} size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Instructor</p>
                <p className="font-medium text-foreground">{course.instructor?.name || 'Unknown'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`${getOrishaIconBackgroundClass(course.category)} p-3 rounded-full`}>
                <Clock className={`${getOrishaIconColorClass(course.category)}`} size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium text-foreground">{course.duration || 0} mins</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`${getOrishaIconBackgroundClass(course.category)} p-3 rounded-full`}>
                <Users className={`${getOrishaIconColorClass(course.category)}`} size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Enrolled</p>
                <p className="font-medium text-foreground">{course.enrolledCount || 0} students</p>
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
              {(course.lessons || []).map((lesson) => (
                <div key={lesson.id} className="flex items-center justify-between p-4 bg-muted rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`${getOrishaIconBackgroundClass(course.category)} p-2 rounded-full`}>
                      <BookOpen className={`${getOrishaIconColorClass(course.category)}`} size={16} />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{lesson.title}</h3>
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-border">
            <div>
              <p className="text-2xl font-bold text-foreground">
                {course.price === 0 
                  ? 'Free' 
                  : course.currency + ' ' + course.price.toString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Includes certificate • {course.lessonCount || 0} lessons
              </p>
            </div>
            {isEnrolled ? (
              <button
                onClick={() => navigate(`/academy/learn/${myEnrollments![0].id}`)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-8 rounded-xl font-bold text-base flex items-center gap-2 transition-all"
              >
                Continue Learning
              </button>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={isEnrolling}
                className="bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-8 rounded-xl font-bold text-base flex items-center gap-2 transition-all disabled:opacity-70"
              >
                {isEnrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isEnrolling ? 'Processing...' : 'Enroll Now'}
              </button>
            )}
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
export default MemoizedCourseDetailView;
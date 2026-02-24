import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, GraduationCap, Clock, CheckCircle, Users, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { getCourseById } from './course-data';

interface Lesson {
  id: string;
  courseId: string;
  title: string;
  order: number;
  type: string;
  duration?: number;
  status: string;
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

interface Enrollment {
  id: string;
  courseId: string;
  studentId: string;
  status: string;
  progress: number;
  enrolledAt: string;
  completedAt?: string;
}

interface CourseDetailViewProps {
  courseId: string;
  onBack?: () => void;
  onEnroll?: (enrollmentId: string) => void;
}

// Course data is now imported from course-data.ts

/**
 * Course Detail View Component
 * Course details, curriculum, and enrollment
 * NOTE: All courses require Community Advisory Council approval
 */
const CourseDetailView: React.FC<CourseDetailViewProps> = ({ courseId, onBack, onEnroll }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();


  // Fetch course
  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: ['academy-course', courseId],
    queryFn: async () => {
      try {
        const response = await api.get(`/academy/courses/${courseId}`);
        return response.data;
      } catch (e) {
        if (!isDemoMode) throw e;


        logger.error('Failed to fetch course, using demo data', e);
        return getCourseById(courseId) || null;
      }
    },
    enabled: !!courseId,
  });

  // Check enrollment status with demo fallback
  const { data: enrollment } = useQuery<Enrollment | null>({
    queryKey: ['academy-enrollment', courseId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        const enrollments = await api.get('/academy/enrollments', {
          params: { courseId },
        });
        const userEnrollment = enrollments.data.find((e: Enrollment) => e.studentId === user.id);
        return userEnrollment || null;
      } catch {
        // Demo fallback: check sessionStorage for demo enrollments
        if (typeof sessionStorage !== 'undefined') {
          const key = `demo-enrollment:${courseId}:${user.id}`;
          const cached = sessionStorage.getItem(key);
          if (cached) {
            try {
              return JSON.parse(cached) as Enrollment;
            } catch (e) {
              logger.warn('Failed to parse demo enrollment', e);
            }
          }
        }
        return null;
      }
    },
    enabled: !!courseId && !!user,
  });

  // Enrollment mutation with demo fallback
  const enrollMutation = useMutation({
    mutationFn: async () => {
      try {
        const response = await api.post('/academy/enrollments', { courseId });
        return response.data;
      } catch (e) {
        if (!isDemoMode) throw e;


        logger.warn('Failed to enroll, using demo fallback', e);
        // Create demo enrollment
        const demoEnrollment: Enrollment = {
          id: `demo-enrollment-${courseId}-${user?.id}-${Date.now()}`,
          courseId,
          studentId: user?.id || '',
          status: 'ACTIVE',
          progress: 0,
          enrolledAt: new Date().toISOString(),
        };
        // Store in sessionStorage
        if (typeof sessionStorage !== 'undefined' && user?.id) {
          const key = `demo-enrollment:${courseId}:${user.id}`;
          sessionStorage.setItem(key, JSON.stringify(demoEnrollment));
        }
        return demoEnrollment;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['academy-enrollment', courseId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['academy-course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['academy-my-enrollments', user?.id] });
      if (onEnroll && data?.id) {
        onEnroll(data.id);
      }
    },
  });

  if (courseLoading) {
    return (
      <div className="min-h-screen bg-background text-white p-6 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-highlight border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background text-white p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-muted">Course not found.</p>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 text-highlight hover:text-secondary transition-colors"
            >
              Back to Academy
            </button>
          )}
        </div>
      </div>
    );
  }

  const isEnrolled = enrollment !== null && enrollment !== undefined;
  const isCompleted = enrollment?.status === 'COMPLETED';

  return (
    <div className="min-h-screen bg-background text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Academy
          </button>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Header */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs bg-primary text-white px-2 py-1 rounded uppercase">
                  {course.level}
                </span>
                {course.certificateEnabled && (
                  <span className="text-xs bg-highlight text-foreground px-2 py-1 rounded font-bold">
                    Certificate Available
                  </span>
                )}
                <span className="text-xs text-muted capitalize">{course.category}</span>
              </div>
              <h1 className="text-4xl font-bold brand-font text-white mb-4">{course.title}</h1>
              <div className="flex items-center gap-4 text-muted mb-6">
                <div className="flex items-center gap-2">
                  <GraduationCap size={16} />
                  <span>{course.instructor.yorubaName || course.instructor.name}</span>
                  {course.instructor.verified && (
                    <span className="text-xs bg-highlight/20 text-highlight px-2 py-1 rounded">
                      ✓ Verified
                    </span>
                  )}
                </div>
                {course.duration && (
                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    <span>{course.duration} hours</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <BookOpen size={16} />
                  <span>{course.lessonCount} lessons</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users size={16} />
                  <span>{course.enrolledCount} enrolled</span>
                </div>
              </div>
            </div>

            {/* Course Thumbnail */}
            {course.thumbnail && (
              <div className="relative h-64 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Description */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">About This Course</h2>
              <p className="text-muted whitespace-pre-wrap">{course.description}</p>
            </div>

            {/* Curriculum */}
            {course.lessons && course.lessons.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Curriculum</h2>
                <div className="space-y-3">
                  {course.lessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="w-8 h-8 rounded-full bg-highlight/20 flex items-center justify-center text-highlight font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold">{lesson.title}</div>
                        <div className="text-xs text-muted flex items-center gap-2 mt-1">
                          <span className="capitalize">{lesson.type.toLowerCase()}</span>
                          {lesson.duration && (
                            <>
                              <span>•</span>
                              <span>{lesson.duration} min</span>
                            </>
                          )}
                        </div>
                      </div>
                      {isEnrolled && (
                        <CheckCircle size={20} className="text-highlight flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enrollment Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 sticky top-6">
              <div className="space-y-4">
                {/* Price */}
                <div>
                  <div className="text-4xl font-bold text-highlight mb-2">
                    {course.price === 0 ? (
                      <span className="text-2xl text-muted">Free</span>
                    ) : (
                      <>
                        {course.currency === 'NGN' ? '₦' : '$'}
                        {course.price.toLocaleString()}
                      </>
                    )}
                  </div>
                </div>

                {/* Enrollment Status */}
                {isEnrolled && (
                  <div className="bg-primary/20 border border-primary/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle size={20} className="text-primary" />
                      <span className="font-bold">Enrolled</span>
                    </div>
                    <div className="text-sm text-muted mb-2">
                      Progress: {Math.round(enrollment.progress)}%
                    </div>
                    {enrollment.progress > 0 && (
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className="bg-highlight h-2 rounded-full transition-all"
                          style={{ width: `${enrollment.progress}%` }}
                        ></div>
                      </div>
                    )}
                    {!isCompleted && (
                      <button
                        onClick={() => {
                          // Navigate to lesson player
                          if (onEnroll && enrollment) {
                            onEnroll(enrollment.id);
                          }
                        }}
                        className="w-full mt-4 px-4 py-2 bg-highlight text-foreground rounded-lg font-bold hover:bg-secondary transition-colors"
                      >
                        Continue Learning
                      </button>
                    )}
                    {isCompleted && course.certificateEnabled && (
                      <div className="mt-4 text-sm text-highlight font-bold">
                        ✓ Certificate Available
                      </div>
                    )}
                  </div>
                )}

                {!isEnrolled && (
                  <button
                    onClick={() => {
                      if (user) {
                        enrollMutation.mutate();
                      } else {
                        alert('Please log in to enroll');
                      }
                    }}
                    disabled={enrollMutation.isPending || !user || course.status !== 'APPROVED'}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enrollMutation.isPending ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Enrolling...
                      </>
                    ) : (
                      <>
                        <GraduationCap size={20} />
                        Enroll Now
                      </>
                    )}
                  </button>
                )}

                {/* Course Info */}
                <div className="space-y-3 pt-4 border-t border-white/10 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Level</span>
                    <span className="font-bold capitalize">{course.level.toLowerCase()}</span>
                  </div>
                  {course.duration && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Duration</span>
                      <span className="font-bold">{course.duration} hours</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Lessons</span>
                    <span className="font-bold">{course.lessonCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Students</span>
                    <span className="font-bold">{course.enrolledCount}</span>
                  </div>
                  {course.certificateEnabled && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Certificate</span>
                      <span className="text-highlight font-bold">✓ Included</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Instructor Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Instructor</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-highlight/20 flex items-center justify-center text-highlight font-bold text-xl flex-shrink-0">
                  {(course.instructor.yorubaName || course.instructor.name)[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-bold">{course.instructor.yorubaName || course.instructor.name}</div>
                  {course.instructor.verified && (
                    <div className="text-xs text-highlight mt-1">✓ Verified Trainer</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailView;

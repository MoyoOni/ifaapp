import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, GraduationCap, Clock, CheckCircle, Play, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';

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
        <div className="w-12 h-12 border-4 border-highlight border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold brand-font text-white mb-2">My Courses</h1>
          <p className="text-muted">Your learning journey and progress</p>
        </div>

        {/* Active Courses */}
        {activeEnrollments.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">In Progress ({activeEnrollments.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeEnrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  onClick={() => {
                    if (onSelectEnrollment) {
                      onSelectEnrollment(enrollment.id);
                    }
                  }}
                  className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-highlight/50 transition-all cursor-pointer group"
                >
                  {/* Thumbnail */}
                  <div className="relative h-48 bg-white/5 overflow-hidden">
                    {enrollment.course.thumbnail ? (
                      <img
                        src={enrollment.course.thumbnail}
                        alt={enrollment.course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted">
                        <BookOpen size={48} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground via-transparent to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="text-lg font-bold line-clamp-2 mb-2">{enrollment.course.title}</div>
                      <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                        <div
                          className="bg-highlight h-2 rounded-full transition-all"
                          style={{ width: `${enrollment.progress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-white/80">{Math.round(enrollment.progress)}% Complete</div>
                    </div>
                  </div>

                  {/* Course Info */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <GraduationCap size={14} />
                      <span>{enrollment.course.instructor.yorubaName || enrollment.course.instructor.name}</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted">
                      {enrollment.course.duration && (
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{enrollment.course.duration} hrs</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <BookOpen size={12} />
                        <span>{enrollment.course.lessonCount} lessons</span>
                      </div>
                    </div>

                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-highlight text-foreground rounded-lg font-bold hover:bg-secondary transition-colors">
                      <Play size={16} />
                      Continue Learning
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Courses */}
        {completedEnrollments.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Completed ({completedEnrollments.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedEnrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
                >
                  {/* Thumbnail */}
                  <div className="relative h-48 bg-white/5 overflow-hidden">
                    {enrollment.course.thumbnail ? (
                      <img
                        src={enrollment.course.thumbnail}
                        alt={enrollment.course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted">
                        <BookOpen size={48} />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-highlight text-foreground px-3 py-1 rounded text-xs font-bold flex items-center gap-1">
                      <CheckCircle size={14} />
                      Completed
                    </div>
                  </div>

                  {/* Course Info */}
                  <div className="p-4 space-y-3">
                    <h3 className="font-bold text-lg line-clamp-2">{enrollment.course.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <GraduationCap size={14} />
                      <span>{enrollment.course.instructor.yorubaName || enrollment.course.instructor.name}</span>
                    </div>

                    {enrollment.certificate && enrollment.course.certificateEnabled && (
                      <a
                        href={enrollment.certificate.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-highlight text-highlight rounded-lg font-bold hover:bg-highlight/10 transition-colors"
                      >
                        <CheckCircle size={16} />
                        View Certificate
                      </a>
                    )}

                    {onSelectEnrollment && (
                      <button
                        onClick={() => onSelectEnrollment(enrollment.id)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-white/20 text-white rounded-lg font-bold hover:bg-white/10 transition-colors"
                      >
                        Review Course
                        <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {enrollments.length === 0 && (
          <div className="text-center py-12 text-muted">
            <BookOpen size={64} className="mx-auto mb-4 opacity-50" />
            <p className="text-xl mb-2">You haven't enrolled in any courses yet</p>
            <p className="text-sm">Browse the Academy to find courses that interest you</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCoursesView;

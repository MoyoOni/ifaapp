import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, Clock, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { getCourseById } from './course-data';
// import { useAuth } from '@/shared/hooks/use-auth';

interface Lesson {
  id: string;
  courseId: string;
  title: string;
  order: number;
  type: string;
  content?: string;
  videoUrl?: string;
  audioUrl?: string;
  duration?: number;
  resources: string[];
  status: string;
}

interface Course {
  id: string;
  title: string;
  instructorId: string;
  lessons: Lesson[];
  instructor: {
    name: string;
    yorubaName?: string;
  };
}

interface Enrollment {
  id: string;
  courseId: string;
  studentId: string;
  status: string;
  progress: number;
  certificate?: {
    certificateUrl: string;
    issuedAt: string;
  };
}

interface LessonCompletion {
  id: string;
  lessonId: string;
  completedAt: string;
  lesson: {
    id: string;
    title: string;
  };
}

interface LessonPlayerViewProps {
  enrollmentId: string;
  lessonId?: string;
  onBack?: () => void;
}

/**
 * Lesson Player View Component
 * Video/audio lesson player with progress tracking
 * NOTE: Tracks completion for enrolled students
 */
const LessonPlayerView: React.FC<LessonPlayerViewProps> = ({ enrollmentId, lessonId, onBack }) => {
  // const { user } = useAuth();
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(lessonId || null);
  // const [isPlaying, setIsPlaying] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'lessons' | 'notes'>('lessons');
  const [notes, setNotes] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const queryClient = useQueryClient();

  // Fetch enrollment with demo fallback
  const { data: enrollment, isLoading: enrollmentLoading } = useQuery<Enrollment>({
    queryKey: ['academy-enrollment', enrollmentId],
    queryFn: async () => {
      try {
        const response = await api.get(`/academy/enrollments/${enrollmentId}`);
        return response.data;
      } catch (e) {
        if (!isDemoMode) throw e;

        if (!isDemoMode) throw e;


        logger.error('Failed to fetch enrollment, using demo data', e);
        // Try to find demo enrollment in sessionStorage
        if (typeof sessionStorage !== 'undefined') {
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key?.startsWith('demo-enrollment:')) {
              try {
                const cached = JSON.parse(sessionStorage.getItem(key) || '');
                if (cached.id === enrollmentId) {
                  return cached as Enrollment;
                }
              } catch (parseError) {
                logger.warn('Failed to parse demo enrollment', parseError);
              }
            }
          }
        }
        throw new Error('Enrollment not found');
      }
    },
    enabled: !!enrollmentId,
  });

  // Load notes when course ID is available
  React.useEffect(() => {
    if (enrollment?.courseId) {
      const savedNotes = localStorage.getItem(`notes-${enrollment.courseId}`);
      if (savedNotes) {
        setNotes(savedNotes);
      }
    }
  }, [enrollment?.courseId]);

  // Fetch course with lessons and demo fallback
  const { data: course } = useQuery<Course>({
    queryKey: ['academy-course', enrollment?.courseId],
    queryFn: async () => {
      try {
        const response = await api.get(`/academy/courses/${enrollment?.courseId}`);
        return response.data;
      } catch (e) {
        if (!isDemoMode) throw e;

        if (!isDemoMode) throw e;


        logger.error('Failed to fetch course, using demo data', e);
        // Return demo course based on courseId
        const courseId = enrollment?.courseId;
        const demoCourse = getCourseById(courseId || '');
        if (demoCourse) {
          return {
            id: demoCourse.id,
            title: demoCourse.title,
            instructorId: demoCourse.instructorId,
            instructor: {
              name: demoCourse.instructor.name,
              yorubaName: demoCourse.instructor.yorubaName,
            },
            lessons: demoCourse.lessons.map(lesson => ({
              ...lesson,
              order: lesson.order - 1, // Adjust to 0-based for player
            })),
          } as Course;
        }
        // Fallback for old demo courses
        if (courseId === 'demo-course-1') {
          return {
            id: 'demo-course-1',
            title: 'Foundations of Ifá Divination',
            instructorId: 'demo-baba-1',
            instructor: {
              name: 'Babaláwo Adeyemi',
              yorubaName: 'Babaláwo Adeyemi',
            },
            lessons: [
              { id: 'demo-lesson-1', courseId: 'demo-course-1', title: 'Origins of Ifá', order: 0, type: 'VIDEO', duration: 18, status: 'PUBLISHED', resources: [] },
              { id: 'demo-lesson-2', courseId: 'demo-course-1', title: 'Sacred Tools Overview', order: 1, type: 'VIDEO', duration: 22, status: 'PUBLISHED', resources: [] },
              { id: 'demo-lesson-3', courseId: 'demo-course-1', title: 'Preparing for Divination', order: 2, type: 'READING', duration: 15, status: 'PUBLISHED', resources: [] },
            ],
          } as Course;
        } else if (courseId === 'demo-course-2') {
          return {
            id: 'demo-course-2',
            title: 'Spiritual Protection & Daily Practice',
            instructorId: 'demo-baba-1',
            instructor: {
              name: 'Babaláwo Adeyemi',
              yorubaName: 'Babaláwo Adeyemi',
            },
            lessons: [
              { id: 'demo-lesson-4', courseId: 'demo-course-2', title: 'Daily Prayer Structure', order: 0, type: 'VIDEO', duration: 20, status: 'PUBLISHED', resources: [] },
              { id: 'demo-lesson-5', courseId: 'demo-course-2', title: 'Protective Herbs', order: 1, type: 'READING', duration: 12, status: 'PUBLISHED', resources: [] },
            ],
          } as Course;
        }
        throw new Error('Course not found');
      }
    },
    enabled: !!enrollment?.courseId,
  });

  // Fetch current lesson with demo fallback
  const { data: currentLesson } = useQuery<Lesson>({
    queryKey: ['academy-lesson', currentLessonId],
    queryFn: async () => {
      try {
        const response = await api.get(`/academy/lessons/${currentLessonId}`);
        return response.data;
      } catch (e) {
        if (!isDemoMode) throw e;

        if (!isDemoMode) throw e;


        logger.error('Failed to fetch lesson, using demo data', e);
        // Return demo lesson from course lessons
        if (course && currentLessonId) {
          const lesson = course.lessons.find((l) => l.id === currentLessonId);
          if (lesson) {
            return lesson;
          }
        }
        throw new Error('Lesson not found');
      }
    },
    enabled: !!currentLessonId,
  });

  // Fetch completed lessons with demo fallback
  const { data: completedLessons = [] } = useQuery<LessonCompletion[]>({
    queryKey: ['academy-lesson-completions', enrollmentId],
    queryFn: async () => {
      try {
        const response = await api.get(`/academy/enrollments/${enrollmentId}/completions`);
        return response.data || [];
      } catch (e) {
        if (!isDemoMode) throw e;

        if (!isDemoMode) throw e;


        logger.error('Failed to fetch completions, using demo data', e);
        // Check sessionStorage for demo completions
        if (typeof sessionStorage !== 'undefined') {
          const key = `demo-lesson-completions:${enrollmentId}`;
          const cached = sessionStorage.getItem(key);
          if (cached) {
            try {
              return JSON.parse(cached) as LessonCompletion[];
            } catch (parseError) {
              logger.warn('Failed to parse demo completions', parseError);
            }
          }
        }
        return [];
      }
    },
    enabled: !!enrollmentId,
  });

  // Complete lesson mutation with demo fallback
  const completeLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      try {
        const response = await api.post(`/academy/enrollments/${enrollmentId}/complete-lesson`, {
          lessonId,
        });
        return response.data;
      } catch (e) {
        if (!isDemoMode) throw e;

        if (!isDemoMode) throw e;


        logger.warn('Failed to complete lesson, using demo fallback', e);
        // Create demo completion
        const completion: LessonCompletion = {
          id: `demo-completion-${lessonId}-${Date.now()}`,
          lessonId,
          completedAt: new Date().toISOString(),
          lesson: {
            id: lessonId,
            title: currentLesson?.title || 'Lesson',
          },
        };
        // Store in sessionStorage
        if (typeof sessionStorage !== 'undefined') {
          const key = `demo-lesson-completions:${enrollmentId}`;
          const existing = sessionStorage.getItem(key);
          const completions: LessonCompletion[] = existing ? JSON.parse(existing) : [];
          if (!completions.find((c) => c.lessonId === lessonId)) {
            completions.push(completion);
            sessionStorage.setItem(key, JSON.stringify(completions));
          }
          // Update enrollment progress
          if (course && enrollment) {
            const totalLessons = course.lessons.length;
            const newProgress = Math.min(100, ((completions.length + 1) / totalLessons) * 100);
            const enrollmentKey = Object.keys(sessionStorage).find((k) =>
              k.startsWith('demo-enrollment:') && k.includes(`:${enrollment.studentId}`)
            );
            if (enrollmentKey) {
              const enrollmentData = JSON.parse(sessionStorage.getItem(enrollmentKey) || '{}');
              enrollmentData.progress = newProgress;
              sessionStorage.setItem(enrollmentKey, JSON.stringify(enrollmentData));
            }
          }
        }
        return completion;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy-lesson-completions', enrollmentId] });
      queryClient.invalidateQueries({ queryKey: ['academy-enrollment', enrollmentId] });
      queryClient.invalidateQueries({ queryKey: ['academy-my-enrollments'] });
    },
  });

  // Set initial lesson if not set
  React.useEffect(() => {
    if (course && course.lessons.length > 0 && !currentLessonId) {
      setCurrentLessonId(course.lessons[0].id);
    }
  }, [course, currentLessonId]);

  const completedLessonIds = completedLessons.map((c) => c.lessonId);
  const isLessonCompleted = currentLessonId ? completedLessonIds.includes(currentLessonId) : false;

  const handleCompleteLesson = () => {
    if (currentLessonId && !isLessonCompleted) {
      completeLessonMutation.mutate(currentLessonId);
    }
  };

  const handleLessonSelect = (lesson: Lesson) => {
    setCurrentLessonId(lesson.id);
  };



  if (enrollmentLoading || !enrollment || !course) {
    return (
      <div className="min-h-screen bg-background text-white p-6 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-highlight border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold brand-font text-white">{course.title}</h1>
              <p className="text-sm text-muted">
                By {course.instructor.yorubaName || course.instructor.name}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="text-right">
            <div className="text-sm text-muted mb-1">Progress</div>
            <div className="text-2xl font-bold text-highlight">{Math.round(enrollment.progress)}%</div>
            <div className="w-32 bg-white/10 rounded-full h-2 mt-2">
              <div
                className="bg-highlight h-2 rounded-full transition-all"
                style={{ width: `${enrollment.progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Lesson Content - Main Area */}
          <div className="lg:col-span-3 space-y-6">
            {currentLesson && (
              <>
                {/* Lesson Title */}
                <div>
                  <h2 className="text-3xl font-bold mb-2">{currentLesson.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-muted">
                    <span className="capitalize">{currentLesson.type.toLowerCase()}</span>
                    {currentLesson.duration && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{currentLesson.duration} min</span>
                        </div>
                      </>
                    )}
                    {isLessonCompleted && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1 text-highlight">
                          <CheckCircle size={14} />
                          <span>Completed</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Video Player */}
                {currentLesson.type === 'VIDEO' && currentLesson.videoUrl && (
                  <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                    <video
                      ref={videoRef}
                      src={currentLesson.videoUrl}
                      className="w-full h-full"
                      controls
                    />
                  </div>
                )}

                {/* Audio Player */}
                {currentLesson.type === 'AUDIO' && currentLesson.audioUrl && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-8">
                    <audio
                      ref={audioRef}
                      src={currentLesson.audioUrl}
                      className="w-full"
                      controls
                    />
                  </div>
                )}

                {/* Text Content */}
                {currentLesson.content && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="prose prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-muted">{currentLesson.content}</div>
                    </div>
                  </div>
                )}

                {/* Resources */}
                {currentLesson.resources && currentLesson.resources.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-4">Resources</h3>
                    <div className="space-y-2">
                      {currentLesson.resources.map((resource, index) => (
                        <a
                          key={index}
                          href={resource}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          Resource {index + 1} →
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Complete Lesson Button */}
                {!isLessonCompleted && (
                  <button
                    onClick={handleCompleteLesson}
                    disabled={completeLessonMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors disabled:opacity-50"
                  >
                    {completeLessonMutation.isPending ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Marking as complete...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} />
                        Mark as Complete
                      </>
                    )}
                  </button>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      const currentIndex = course.lessons.findIndex((l) => l.id === currentLessonId);
                      if (currentIndex > 0) {
                        handleLessonSelect(course.lessons[currentIndex - 1]);
                      }
                    }}
                    disabled={course.lessons.findIndex((l) => l.id === currentLessonId) === 0}
                    className="px-6 py-3 border border-white/20 text-white rounded-xl font-bold hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>

                  <button
                    onClick={() => {
                      const currentIndex = course.lessons.findIndex((l) => l.id === currentLessonId);
                      if (currentIndex < course.lessons.length - 1) {
                        handleLessonSelect(course.lessons[currentIndex + 1]);
                      }
                    }}
                    disabled={
                      course.lessons.findIndex((l) => l.id === currentLessonId) ===
                      course.lessons.length - 1
                    }
                    className="px-6 py-3 border border-white/20 text-white rounded-xl font-bold hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Sidebar - Lesson List & Notes */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 sticky top-6">

              {/* Sidebar Tabs */}
              <div className="flex gap-2 mb-4 border-b border-white/10 pb-2">
                <button
                  onClick={() => setSidebarTab('lessons')}
                  className={`flex-1 pb-2 text-sm font-bold transition-colors relative ${sidebarTab === 'lessons' ? 'text-highlight' : 'text-muted hover:text-white'}`}
                >
                  Lessons
                  {sidebarTab === 'lessons' && <div className="absolute bottom-[-9px] left-0 w-full h-0.5 bg-highlight rounded-full"></div>}
                </button>
                <button
                  onClick={() => setSidebarTab('notes')}
                  className={`flex-1 pb-2 text-sm font-bold transition-colors relative ${sidebarTab === 'notes' ? 'text-highlight' : 'text-muted hover:text-white'}`}
                >
                  My Notes
                  {sidebarTab === 'notes' && <div className="absolute bottom-[-9px] left-0 w-full h-0.5 bg-highlight rounded-full"></div>}
                </button>
              </div>

              {sidebarTab === 'lessons' ? (
                <>
                  <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar">
                    {course.lessons.map((lesson) => {
                      const isCompleted = completedLessonIds.includes(lesson.id);
                      const isCurrent = lesson.id === currentLessonId;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => handleLessonSelect(lesson)}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${isCurrent
                            ? 'border-highlight bg-highlight/10 text-highlight'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                            }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold">{lesson.order + 1}.</span>
                            <span className="text-sm font-bold line-clamp-1">{lesson.title}</span>
                            {isCompleted && (
                              <CheckCircle size={14} className="text-highlight flex-shrink-0" />
                            )}
                          </div>
                          <div className="text-xs text-muted flex items-center gap-2">
                            <span className="capitalize">{lesson.type.toLowerCase()}</span>
                            {lesson.duration && (
                              <>
                                <span>•</span>
                                <span>{lesson.duration} min</span>
                              </>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Completion Summary */}
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="text-sm text-muted mb-2">Course Progress</div>
                    <div className="text-2xl font-bold text-highlight mb-2">
                      {Math.round(enrollment.progress)}%
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-highlight h-2 rounded-full transition-all"
                        style={{ width: `${enrollment.progress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-muted mt-2">
                      {completedLessons.length} of {course.lessons.length} lessons completed
                    </div>
                  </div>

                  {/* Certificate */}
                  {enrollment.status === 'COMPLETED' && enrollment.certificate && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <a
                        href={enrollment.certificate.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full px-4 py-3 bg-highlight/20 text-highlight rounded-lg font-bold hover:bg-highlight/30 transition-colors text-center block"
                      >
                        View Certificate
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-[calc(100vh-250px)] flex flex-col">
                  <textarea
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      localStorage.setItem(`notes-${course.id}`, e.target.value);
                    }}
                    placeholder="Write your reflections here..."
                    className="w-full h-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/20 resize-none focus:outline-none focus:border-highlight/50"
                  />
                  <p className="text-xs text-muted mt-2 text-center">
                    Notes are saved locally on your device.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPlayerView;

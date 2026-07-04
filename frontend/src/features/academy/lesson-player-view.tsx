import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, Clock, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';
import { isDevModeActive } from '@/shared/utils/dev-mode';
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
  const toast = useToast();

  // Fetch enrollment with demo fallback
  const { data: enrollment, isLoading: enrollmentLoading } = useQuery<Enrollment>({
    queryKey: ['academy-enrollment', enrollmentId],
    queryFn: async () => {
      const response = await api.get(`/academy/enrollments/${enrollmentId}`);
      return response.data;
    },
    enabled: !!enrollmentId && !isDevModeActive(),
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
      const response = await api.get(`/academy/courses/${enrollment?.courseId}`);
      return response.data;
    },
    enabled: !!enrollment?.courseId && !isDevModeActive(),
  });

  // Fetch current lesson with demo fallback
  const { data: currentLesson } = useQuery<Lesson>({
    queryKey: ['academy-lesson', currentLessonId],
    queryFn: async () => {
      const response = await api.get(`/academy/lessons/${currentLessonId}`);
      return response.data;
    },
    enabled: !!currentLessonId && !isDevModeActive(),
  });

  // Fetch completed lessons with demo fallback
  const { data: completedLessons = [] } = useQuery<LessonCompletion[]>({
    queryKey: ['academy-lesson-completions', enrollmentId],
    queryFn: async () => {
      const response = await api.get(`/academy/enrollments/${enrollmentId}/completions`);
      return response.data || [];
    },
    enabled: !!enrollmentId && !isDevModeActive(),
  });

  // Complete lesson mutation
  const completeLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const response = await api.post(`/academy/enrollments/${enrollmentId}/complete-lesson`, {
        lessonId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy-lesson-completions', enrollmentId] });
      queryClient.invalidateQueries({ queryKey: ['academy-enrollment', enrollmentId] });
      queryClient.invalidateQueries({ queryKey: ['academy-my-enrollments'] });
      toast.success('Lesson completed!');
    },
    onError: (err: Error) => {
      toast.error(`Failed to mark lesson complete — ${err.message}`);
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
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-highlight border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                aria-label="Go back"
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            <div>
              <h1 className="text-[1.5rem] font-[700] brand-font text-foreground">{course.title}</h1>
              <p className="text-sm text-muted-foreground">
                By {course.instructor.yorubaName || course.instructor.name}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="text-right">
            <div className="text-sm text-muted-foreground mb-1">Progress</div>
            <div className="text-[1.5rem] font-[700] text-highlight">{Math.round(enrollment.progress)}%</div>
            <progress
              value={enrollment.progress}
              max={100}
              aria-label="Course progress"
              className="w-32 h-2 mt-2 rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-highlight [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-highlight"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Lesson Content - Main Area */}
          <div className="lg:col-span-3 space-y-6">
            {currentLesson && (
              <>
                {/* Lesson Title */}
                <div>
                  <h2 className="text-[1.875rem] font-[700] mb-2">{currentLesson.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                  <div className="bg-card border border-border rounded-xl p-8">
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
                  <div className="bg-card border border-border rounded-xl p-6">
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap text-foreground">{currentLesson.content}</div>
                    </div>
                  </div>
                )}

                {/* Resources */}
                {currentLesson.resources && currentLesson.resources.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="text-[1.125rem] font-[700] mb-4 text-foreground">Resources</h3>
                    <div className="space-y-2">
                      {currentLesson.resources.map((resource, index) => (
                        <a
                          key={index}
                          href={resource}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 bg-background rounded-lg hover:bg-muted transition-colors text-foreground"
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
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-highlight text-foreground rounded-xl font-[700] hover:bg-secondary transition-colors disabled:opacity-50"
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
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <button
                    onClick={() => {
                      const currentIndex = course.lessons.findIndex((l) => l.id === currentLessonId);
                      if (currentIndex > 0) {
                        handleLessonSelect(course.lessons[currentIndex - 1]);
                      }
                    }}
                    disabled={course.lessons.findIndex((l) => l.id === currentLessonId) === 0}
                    className="px-6 py-3 border border-border text-foreground rounded-xl font-[700] hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="px-6 py-3 border border-border text-foreground rounded-xl font-[700] hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Sidebar - Lesson List & Notes */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-4 sticky top-6">

              {/* Sidebar Tabs */}
              <div className="flex gap-2 mb-4 border-b border-border pb-2">
                <button
                  onClick={() => setSidebarTab('lessons')}
                  className={`flex-1 pb-2 text-sm font-bold transition-colors relative ${sidebarTab === 'lessons' ? 'text-highlight' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Lessons
                  {sidebarTab === 'lessons' && <div className="absolute bottom-[-9px] left-0 w-full h-0.5 bg-highlight rounded-full"></div>}
                </button>
                <button
                  onClick={() => setSidebarTab('notes')}
                  className={`flex-1 pb-2 text-sm font-bold transition-colors relative ${sidebarTab === 'notes' ? 'text-highlight' : 'text-muted-foreground hover:text-foreground'}`}
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
                            : 'border-border bg-muted/50 hover:border-border'
                            }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold">{lesson.order + 1}.</span>
                            <span className="text-sm font-bold line-clamp-1">{lesson.title}</span>
                            {isCompleted && (
                              <CheckCircle size={14} className="text-highlight flex-shrink-0" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
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
                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="text-sm text-muted-foreground mb-2">Course Progress</div>
                    <div className="text-2xl font-bold text-highlight mb-2">
                      {Math.round(enrollment.progress)}%
                    </div>
                    <progress
                      value={enrollment.progress}
                      max={100}
                      aria-label="Course progress"
                      className="w-full h-2 rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-highlight [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-highlight"
                    />
                    <div className="text-xs text-muted-foreground mt-2">
                      {completedLessons.length} of {course.lessons.length} lessons completed
                    </div>
                  </div>

                  {/* Certificate */}
                  {enrollment.status === 'COMPLETED' && enrollment.certificate && (
                    <div className="mt-6 pt-6 border-t border-border">
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
                    className="w-full h-full bg-background border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-highlight/50"
                  />
                  <p className="text-xs text-muted-foreground mt-2 text-center">
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


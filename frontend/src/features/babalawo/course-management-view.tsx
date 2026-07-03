import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit, Trash2, GripVertical, BookOpen, Eye, EyeOff,
  ArrowLeft, Save, ChevronDown, ChevronUp,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { useToast } from '@/shared/components/toast';
import { useModal } from '@/components/common/ModalProvider';

interface Lesson {
  id: string;
  courseId: string;
  title: string;
  order: number;
  type: 'VIDEO' | 'TEXT' | 'AUDIO' | 'QUIZ';
  content?: string;
  videoUrl?: string;
  audioUrl?: string;
  duration?: number;
  resources: string[];
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
  lessons?: Lesson[];
  _count: { lessons: number; enrollments: number };
}

const CATEGORIES = [
  { value: 'foundational', label: 'Ifá Divination' },
  { value: 'cultural_studies', label: 'Yoruba Culture' },
  { value: 'spiritual_practice', label: 'Sacred Arts' },
  { value: 'advanced_priestly', label: 'Spirituality' },
];

const LEVELS = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  PENDING_APPROVAL: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  APPROVED: 'bg-green-500/20 text-green-400 border-green-500/30',
  REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
  ARCHIVED: 'bg-muted text-muted-foreground border-border',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Babalawo Course Management View
 * Create, edit, and manage academy courses and lessons
 */
const CourseManagementView: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const { showModal } = useModal();

  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Course form state
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('foundational');
  const [formLevel, setFormLevel] = useState('BEGINNER');
  const [formPrice, setFormPrice] = useState(0);
  const [formThumbnail, setFormThumbnail] = useState('');
  const [formCertificate, setFormCertificate] = useState(true);

  // Lesson management
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [lessonFormCourseId, setLessonFormCourseId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonType, setLessonType] = useState<'TEXT' | 'VIDEO' | 'AUDIO' | 'QUIZ'>('TEXT');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonDuration, setLessonDuration] = useState(0);

  // Fetch babalawo's own courses
  const { data: courses = [], isLoading, isError, refetch } = useQuery<Course[]>({
    queryKey: ['my-courses', user?.id],
    queryFn: async () => {
      const res = await api.get('/academy/courses', { params: { instructorId: user?.id } });
      return res.data;
    },
    enabled: !!user?.id && !localStorage.getItem('dev_mode_role'),
    staleTime: 10 * 60 * 1000, // Courses: 10 minutes
  });

  // Course CRUD mutations
  const createCourseMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await api.post('/academy/courses', body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      success('Course created successfully');
      resetCourseForm();
      setView('list');
    },
    onError: (err: any) => toastError(err?.response?.data?.message || 'Failed to create course'),
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      const res = await api.patch(`/academy/courses/${id}`, body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      success('Course updated');
      resetCourseForm();
      setView('list');
    },
    onError: (err: any) => toastError(err?.response?.data?.message || 'Failed to update course'),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.patch(`/academy/courses/${id}`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      success('Course status updated');
    },
    onError: (err: any) => toastError(err?.response?.data?.message || 'Failed to update status'),
  });

  // Lesson mutations
  const createLessonMutation = useMutation({
    mutationFn: async ({ courseId, body }: { courseId: string; body: Record<string, unknown> }) => {
      const res = await api.post(`/academy/courses/${courseId}/lessons`, body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      queryClient.invalidateQueries({ queryKey: ['course-lessons'] });
      success('Lesson added');
      resetLessonForm();
    },
    onError: (err: any) => toastError(err?.response?.data?.message || 'Failed to add lesson'),
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      await api.delete(`/academy/lessons/${lessonId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      queryClient.invalidateQueries({ queryKey: ['course-lessons'] });
      success('Lesson removed');
    },
    onError: (err: any) => toastError(err?.response?.data?.message || 'Failed to delete lesson'),
  });

  // Fetch lessons for expanded course
  const { data: courseLessons = [] } = useQuery<Lesson[]>({
    queryKey: ['course-lessons', expandedCourseId],
    queryFn: async () => {
      const res = await api.get(`/academy/courses/${expandedCourseId}/lessons`);
      return res.data;
    },
    enabled: !!expandedCourseId && !localStorage.getItem('dev_mode_role'),
  });

  const resetCourseForm = () => {
    setEditingCourse(null);
    setFormTitle('');
    setFormSlug('');
    setFormDescription('');
    setFormCategory('foundational');
    setFormLevel('BEGINNER');
    setFormPrice(0);
    setFormThumbnail('');
    setFormCertificate(true);
  };

  const resetLessonForm = () => {
    setLessonFormCourseId(null);
    setLessonTitle('');
    setLessonType('TEXT');
    setLessonContent('');
    setLessonVideoUrl('');
    setLessonDuration(0);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setFormTitle(course.title);
    setFormSlug(course.slug);
    setFormDescription(course.description);
    setFormCategory(course.category);
    setFormLevel(course.level);
    setFormPrice(course.price);
    setFormThumbnail(course.thumbnail || '');
    setFormCertificate(course.certificateEnabled);
    setView('form');
  };

  const handleSubmitCourse = (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      title: formTitle.trim(),
      slug: formSlug.trim() || slugify(formTitle),
      description: formDescription.trim(),
      category: formCategory,
      level: formLevel,
      price: formPrice,
      thumbnail: formThumbnail.trim() || undefined,
      certificateEnabled: formCertificate,
    };
    if (editingCourse) {
      updateCourseMutation.mutate({ id: editingCourse.id, body });
    } else {
      createCourseMutation.mutate(body);
    }
  };

  const handleSubmitLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonFormCourseId) return;
    const body: Record<string, unknown> = {
      title: lessonTitle.trim(),
      type: lessonType,
      content: lessonContent.trim() || undefined,
      videoUrl: lessonVideoUrl.trim() || undefined,
      duration: lessonDuration || undefined,
      order: courseLessons.length + 1,
    };
    createLessonMutation.mutate({ courseId: lessonFormCourseId, body });
  };

  const handleDeleteLesson = (lesson: Lesson) => {
    showModal({
      title: 'Delete Lesson',
      message: `Are you sure you want to delete "${lesson.title}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () => deleteLessonMutation.mutate(lesson.id),
    });
  };

  // --- COURSE FORM VIEW ---
  if (view === 'form') {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <button
          onClick={() => { resetCourseForm(); setView('list'); }}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Back to Courses
        </button>

        <h2 className="text-xl font-bold text-foreground">
          {editingCourse ? 'Edit Course' : 'Create New Course'}
        </h2>

        <form onSubmit={handleSubmitCourse} className="bg-card rounded-2xl p-6 border border-border space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => { setFormTitle(e.target.value); if (!editingCourse) setFormSlug(slugify(e.target.value)); }}
              placeholder="Introduction to Ifá Divination"
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Slug</label>
            <input
              type="text"
              value={formSlug}
              onChange={(e) => setFormSlug(e.target.value)}
              placeholder="introduction-to-ifa-divination"
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">Auto-generated from title. Edit if needed.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description *</label>
            <textarea
              required
              rows={4}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="A comprehensive course covering the foundations of Ifá divination..."
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Category *</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                aria-label="Course category"
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Level</label>
              <select
                value={formLevel}
                onChange={(e) => setFormLevel(e.target.value)}
                aria-label="Course level"
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Price (₦)</label>
              <input
                type="number"
                min={0}
                value={formPrice}
                onChange={(e) => setFormPrice(Number(e.target.value))}
                aria-label="Course price in naira"
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">Set to 0 for free courses.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Thumbnail URL</label>
              <input
                type="url"
                value={formThumbnail}
                onChange={(e) => setFormThumbnail(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={formCertificate}
              onChange={(e) => setFormCertificate(e.target.checked)}
              className="rounded border-border"
            />
            Enable certificate on completion
          </label>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={createCourseMutation.isPending || updateCourseMutation.isPending}
              className="px-5 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={16} />
              {(createCourseMutation.isPending || updateCourseMutation.isPending) ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
            </button>
            <button
              type="button"
              onClick={() => { resetCourseForm(); setView('list'); }}
              className="px-5 py-2 bg-muted text-muted-foreground rounded-xl font-medium hover:opacity-80 transition-opacity"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // --- COURSE LIST VIEW ---
  if (isError) {
    return (
      <div className="bg-card rounded-2xl p-8 border border-border text-center">
        <BookOpen className="mx-auto mb-4 text-muted-foreground" size={48} />
        <h2 className="text-lg font-bold text-foreground mb-2">Failed to Load Courses</h2>
        <p className="text-muted-foreground text-sm mb-4">Could not fetch your courses.</p>
        <button onClick={() => refetch()} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen size={28} /> My Courses
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage your academy courses.</p>
        </div>
        <button
          onClick={() => { resetCourseForm(); setView('form'); }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2 self-start"
        >
          <Plus size={16} /> New Course
        </button>
      </div>

      {/* Course List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse h-24 bg-muted rounded-xl" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 border border-border text-center">
          <BookOpen className="mx-auto mb-4 text-muted-foreground" size={48} />
          <h2 className="text-lg font-bold text-foreground mb-2">No Courses Yet</h2>
          <p className="text-muted-foreground text-sm mb-4">Create your first course to share your knowledge in the academy.</p>
          <button
            onClick={() => { resetCourseForm(); setView('form'); }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Create Course
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <div key={course.id} className="bg-card rounded-xl border border-border overflow-hidden">
              {/* Course card header */}
              <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                {course.thumbnail && (
                  <img
                    src={course.thumbnail}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground truncate">{course.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[course.status] || STATUS_COLORS.DRAFT}`}>
                      {course.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">{course.description}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                    <span>{course._count?.lessons ?? course.lessonCount ?? 0} lessons</span>
                    <span>{course._count?.enrollments ?? course.enrolledCount ?? 0} enrolled</span>
                    <span>{course.price === 0 ? 'Free' : `₦${course.price.toLocaleString()}`}</span>
                    <span>{LEVELS.find(l => l.value === course.level)?.label || course.level}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {course.status === 'DRAFT' && (
                    <button
                      onClick={() => toggleStatusMutation.mutate({ id: course.id, status: 'PENDING_APPROVAL' })}
                      className="px-3 py-1.5 text-sm bg-green-500/10 dark:text-green-400 text-green-600 rounded-lg hover:bg-green-500/20 transition-colors flex items-center gap-1"
                    >
                      <Eye size={14} /> Publish
                    </button>
                  )}
                  {(course.status === 'APPROVED' || course.status === 'PENDING_APPROVAL') && (
                    <button
                      onClick={() => toggleStatusMutation.mutate({ id: course.id, status: 'DRAFT' })}
                      className="px-3 py-1.5 text-sm bg-yellow-500/10 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition-colors flex items-center gap-1"
                    >
                      <EyeOff size={14} /> Unpublish
                    </button>
                  )}
                  <button
                    onClick={() => handleEditCourse(course)}
                    className="px-3 py-1.5 text-sm bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors flex items-center gap-1"
                  >
                    <Edit size={14} /> Edit
                  </button>
                  <button
                    onClick={() => setExpandedCourseId(expandedCourseId === course.id ? null : course.id)}
                    className="px-3 py-1.5 text-sm bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors flex items-center gap-1"
                  >
                    {expandedCourseId === course.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    Lessons
                  </button>
                </div>
              </div>

              {/* Expanded lessons section */}
              <AnimatePresence>
                {expandedCourseId === course.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-border overflow-hidden"
                  >
                    <div className="p-4 space-y-3 bg-background/50">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-foreground">Lessons ({courseLessons.length})</h3>
                        <button
                          onClick={() => { resetLessonForm(); setLessonFormCourseId(course.id); }}
                          className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1"
                        >
                          <Plus size={12} /> Add Lesson
                        </button>
                      </div>

                      {/* Lesson list */}
                      {courseLessons.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">No lessons yet. Add your first lesson.</p>
                      ) : (
                        <div className="space-y-2">
                          {[...courseLessons].sort((a, b) => a.order - b.order).map((lesson) => (
                            <div key={lesson.id} className="flex items-center gap-3 bg-card rounded-lg p-3 border border-border">
                              <GripVertical size={14} className="text-muted-foreground shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-foreground">{lesson.order}. {lesson.title}</span>
                                <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                                  <span>{lesson.type}</span>
                                  {lesson.duration && <span>{lesson.duration} min</span>}
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteLesson(lesson)}
                                aria-label={`Delete lesson ${lesson.title}`}
                                className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add lesson form */}
                      {lessonFormCourseId === course.id && (
                        <motion.form
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          onSubmit={handleSubmitLesson}
                          className="bg-card rounded-xl p-4 border border-primary/30 space-y-3"
                        >
                          <h4 className="text-sm font-bold text-foreground">New Lesson</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              type="text"
                              required
                              value={lessonTitle}
                              onChange={(e) => setLessonTitle(e.target.value)}
                              placeholder="Lesson title"
                              className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <select
                              value={lessonType}
                              onChange={(e) => setLessonType(e.target.value as Lesson['type'])}
                              aria-label="Lesson type"
                              className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              <option value="TEXT">Text</option>
                              <option value="VIDEO">Video</option>
                              <option value="AUDIO">Audio</option>
                              <option value="QUIZ">Quiz</option>
                            </select>
                          </div>
                          {(lessonType === 'VIDEO' || lessonType === 'AUDIO') && (
                            <input
                              type="url"
                              value={lessonVideoUrl}
                              onChange={(e) => setLessonVideoUrl(e.target.value)}
                              placeholder={lessonType === 'VIDEO' ? 'Video URL' : 'Audio URL'}
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          )}
                          <textarea
                            rows={3}
                            value={lessonContent}
                            onChange={(e) => setLessonContent(e.target.value)}
                            placeholder="Lesson content or description..."
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                          />
                          <div className="w-32">
                            <label className="block text-xs text-muted-foreground mb-1">Duration (min)</label>
                            <input
                              type="number"
                              min={0}
                              value={lessonDuration}
                              onChange={(e) => setLessonDuration(Number(e.target.value))}
                              aria-label="Lesson duration in minutes"
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={createLessonMutation.isPending}
                              className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                              {createLessonMutation.isPending ? 'Adding...' : 'Add Lesson'}
                            </button>
                            <button
                              type="button"
                              onClick={resetLessonForm}
                              className="px-3 py-1.5 text-sm bg-muted text-muted-foreground rounded-lg hover:opacity-80 transition-opacity"
                            >
                              Cancel
                            </button>
                          </div>
                        </motion.form>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseManagementView;

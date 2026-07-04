import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, GraduationCap, Play, Clock, CheckCircle, Users, Filter, AlertCircle, Lock, Sparkles } from 'lucide-react';
import { FeatureHeader } from '@/shared/components/feature-header';
import { PageTransition } from '@/components/common/page-transition';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { AcademySkeleton } from '@/shared/components/skeleton';
import { useSubscription } from '@/features/subscription/use-subscription';
import { isDevModeActive } from '@/shared/utils/dev-mode';

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
  isDevoted?: boolean;
  instructor: {
    id: string;
    name: string;
    yorubaName?: string;
    verified: boolean;
  };
  _count: {
    lessons: number;
    enrollments: number;
  };
}

interface AcademyViewProps {
  onSelectCourse?: (courseId: string) => void;
}

/**
 * Academy View Component
 * Course catalog and learning dashboard
 * NOTE: All courses require Community Advisory Council approval
 */
const AcademyView: React.FC<AcademyViewProps> = ({ onSelectCourse }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { isDevoted } = useSubscription();

  const handleCourseClick = (course: Course) => {
    if (course.isDevoted && !isDevoted) {
      navigate('/pricing');
      return;
    }
    onSelectCourse?.(course.id);
    navigate(`/academy/course/${course.id}`);
  };

  // Fetch courses
  const { data: courses = [], isLoading: coursesLoading, isError: coursesError, refetch: refetchCourses } = useQuery<Course[]>({
    queryKey: ['academy-courses', selectedCategory, selectedLevel, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      const response = await api.get(`/academy/courses?${params.toString()}`);
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // Course catalog: 10 minutes
    enabled: !isDevModeActive(),
  });

  const categories = [
    { id: 'all', name: 'All Courses', icon: '📚' },
    { id: 'foundational', name: 'Foundational', icon: '🌱' },
    { id: 'spiritual_practice', name: 'Spiritual Practice', icon: '🙏' },
    { id: 'ifa_divination', name: 'Ifa Divination', icon: '🔮' },
    { id: 'orisha_studies', name: 'Orisha Studies', icon: '🌺' },
    { id: 'herbalism_healing', name: 'Herbalism & Healing', icon: '🌿' },
    { id: 'advanced_priestly', name: 'Advanced Priestly', icon: '⚡' },
    { id: 'cultural_studies', name: 'Cultural Studies', icon: '🏛️' },
  ];

  const filteredCourses = courses.filter((course) => {
    if (selectedLevel !== 'all' && course.level !== selectedLevel) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        course.instructor.name.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold brand-font text-foreground">Academy</h1>
              <p className="text-muted-foreground">Expand your knowledge of Ifá and Isese</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Browse All Courses */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold brand-font text-foreground">Browse All Courses</h2>
            <div className="text-sm text-muted-foreground">
              {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} available
            </div>
          </div>
          
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div 
                  key={course.id}
                  className="bg-card rounded-2xl border border-border/50 p-5 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleCourseClick(course)}
                >
                  <div className="aspect-video bg-muted rounded-xl mb-4 overflow-hidden">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {course.duration}m
                    </div>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-foreground line-clamp-1">{course.title}</h3>
                      <p className="text-muted-foreground text-sm mt-1">{course.instructor.name}</p>
                    </div>
                    {course.level === 'beginner' && (
                      <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs px-2 py-1 rounded-full">Beginner</span>
                    )}
                    {course.level === 'intermediate' && (
                      <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs px-2 py-1 rounded-full">Intermediate</span>
                    )}
                    {course.level === 'advanced' && (
                      <span className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs px-2 py-1 rounded-full">Advanced</span>
                    )}
                  </div>
                  
                  <p className="text-muted-foreground text-sm mt-3 line-clamp-2">
                    {course.description}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{course.duration} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      <span>{course.enrolledCount} students</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle size={14} />
                      <span>{course.lessonCount} lessons</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/20 rounded-2xl border border-border/50">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <BookOpen size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">No courses found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                We couldn't find any courses matching your filters. Try changing your selection.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedLevel('all');
                }}
                className="mt-4 text-primary font-bold hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AcademyView;
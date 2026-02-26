import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, GraduationCap, Play, Clock, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { getAllCourses } from './course-data';
import { AcademySkeleton } from '@/shared/components/skeleton';

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
  _count: {
    lessons: number;
    enrollments: number;
  };
}

interface AcademyViewProps {
  onSelectCourse?: (courseId: string) => void;
}

// Import courses from course-data.ts
const DEMO_COURSES: Course[] = getAllCourses();

/**
 * Academy View Component
 * Course catalog and learning dashboard
 * NOTE: All courses require Community Advisory Council approval
 */
const AcademyView: React.FC<AcademyViewProps> = ({ onSelectCourse }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch courses
  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ['academy-courses', selectedCategory, selectedLevel, searchQuery],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (selectedCategory !== 'all') {
          params.append('category', selectedCategory);
        }
        const response = await api.get(`/academy/courses?${params.toString()}`);
        return response.data;
      } catch (e) {
        if (!isDemoMode) throw e;


        logger.error('Failed to fetch courses, using demo data', e);
        return selectedCategory === 'all'
          ? DEMO_COURSES
          : DEMO_COURSES.filter((course) => course.category === selectedCategory);
      }
    },
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

  const levels = [
    { id: 'all', name: 'All Levels' },
    { id: 'BEGINNER', name: 'Beginner' },
    { id: 'INTERMEDIATE', name: 'Intermediate' },
    { id: 'ADVANCED', name: 'Advanced' },
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
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
        {/* Decorative Circles */}
        <div className="absolute -top-24 -right-24 w-64 h-64 border-[30px] border-white/10 rounded-full opacity-50"></div>
        <div className="absolute top-1/2 left-10 w-20 h-20 bg-accent rounded-full blur-3xl opacity-30"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[0.75rem] font-[700] uppercase tracking-widest text-accent">
              <GraduationCap size={14} /> IIAS Academy
            </span>
            <h1 className="text-[2.25rem] font-[700] brand-font leading-tight">Wisdom of the Orishas</h1>
            <p className="text-primary-foreground max-w-lg text-lg">
              Structured learning pathways approved by the Council. From beginner basics to advanced priesthood studies.
            </p>
          </div>

          <div className="flex gap-3">
            <button className="px-5 py-3 bg-card text-primary rounded-xl font-[700] hover:bg-muted transition-colors shadow-lg flex items-center gap-2">
              <Play size={18} className="fill-current" />
              Resume Learning
            </button>
          </div>
        </div>
      </div>

      {/* 2. Controls & Search */}
      <div className="flex flex-col lg:flex-row gap-6 sticky top-0 z-20 lg:relative">
        {/* Categories */}
        <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-4 lg:pb-0 no-scrollbar">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap text-[0.875rem] font-[700] ${selectedCategory === category.id
                ? 'border-primary bg-primary text-primary-foreground shadow-md'
                : 'border-muted bg-card text-foreground hover:border-primary/30 hover:text-foreground'
                }`}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Level Select */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-4 py-2 bg-card border border-input rounded-lg text-[0.875rem] font-[500] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary cursor-pointer"
          >
            {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>

          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/60" size={16} />
            <input
              type="text"
              placeholder="Find a course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-card border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* 3. Courses Grid */}
      {coursesLoading ? (
        <AcademySkeleton />
      ) : filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted rounded-3xl border border-input">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <BookOpen size={32} className="text-primary/60" />
          </div>
          <h3 className="text-[1.25rem] font-[700] text-foreground">No courses found</h3>
          <p className="text-muted-foreground max-w-sm text-center mt-2">
            Try adjusting the filters or search for a different topic.
          </p>
          <button
            onClick={() => { setSelectedCategory('all'); setSelectedLevel('all'); setSearchQuery(''); }}
            className="mt-6 text-foreground font-[700] hover:underline"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              onClick={() => onSelectCourse && onSelectCourse(course.id)}
              className="group bg-white rounded-2xl border border-emerald-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full"
            >
              {/* Thumbnail */}
              <div className="relative h-56 bg-muted overflow-hidden">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                    <GraduationCap size={48} />
                  </div>
                )}

                {/* Badges/Tags */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                  {course.certificateEnabled && (
                    <span className="bg-accent text-accent-foreground text-[0.625rem] font-[700] uppercase tracking-wider px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                      <CheckCircle size={10} /> Certified
                    </span>
                  )}
                  <span className={`text-[0.625rem] font-[700] uppercase tracking-wider px-2 py-1 rounded-md shadow-sm ${course.level === 'BEGINNER' ? 'bg-success text-success-foreground' :
                    course.level === 'INTERMEDIATE' ? 'bg-sky-500 text-white' :
                      'bg-secondary text-secondary-foreground'
                    }`}>
                    {course.level}
                  </span>
                </div>

                {/* Play Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white scale-50 group-hover:scale-100 transition-transform duration-300">
                    <Play size={32} className="ml-1 fill-current" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[0.625rem] font-[700] text-primary">
                    {course.instructor.name.charAt(0)}
                  </div>
                  <span className="text-[0.75rem] font-[700] text-primary uppercase tracking-wide">
                    {course.instructor.name}
                  </span>
                  {course.instructor.verified && (
                    <CheckCircle size={10} className="text-primary" />
                  )}
                </div>

                <h3 className="text-[1.25rem] font-[700] brand-font text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-foreground text-sm line-clamp-2 mb-6">
                  {course.description}
                </p>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-input">
                  <div className="flex items-center gap-4 text-[0.875rem] font-[500] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{course.duration || 2}h</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen size={14} />
                      <span>{course.lessonCount}</span>
                    </div>
                  </div>

                  <div className="text-[1.125rem] font-[700] text-foreground">
                    {course.price === 0 ? 'Free' : (
                      <>{course.currency === 'NGN' ? '₦' : '$'}{course.price.toLocaleString()}</>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AcademyView;
